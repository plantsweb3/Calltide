import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  businesses,
  mrrSnapshots,
  paymentEvents,
  dunningState,
  clientCosts,
  subscriptionEvents,
} from "@/db/schema";
import { eq, desc, sql, and, gte, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const tab = request.nextUrl.searchParams.get("tab") ?? "revenue";

  switch (tab) {
    case "revenue":
      return NextResponse.json(await getRevenue());
    case "payments":
      return NextResponse.json(await getPayments());
    case "costs":
      return NextResponse.json(await getCosts());
    case "forecast":
      return NextResponse.json(await getForecast());
    default:
      return NextResponse.json({ error: "Unknown tab" }, { status: 400 });
  }
}

async function getRevenue() {
  // Current MRR
  const [mrrResult] = await db
    .select({
      totalMrr: sql<number>`COALESCE(SUM(${businesses.mrr}), 0)`,
      activeCount: sql<number>`COUNT(CASE WHEN ${businesses.stripeSubscriptionStatus} = 'active' THEN 1 END)`,
      pastDueCount: sql<number>`COUNT(CASE WHEN ${businesses.stripeSubscriptionStatus} = 'past_due' THEN 1 END)`,
    })
    .from(businesses)
    .where(inArray(businesses.stripeSubscriptionStatus, ["active", "past_due"]));

  const mrr = mrrResult?.totalMrr ?? 0;
  const arr = mrr * 12;

  // MRR trend (last 12 months)
  const snapshots = await db
    .select()
    .from(mrrSnapshots)
    .orderBy(desc(mrrSnapshots.date))
    .limit(365);

  // Calculate growth
  const sortedSnapshots = snapshots.reverse();
  let mrrGrowthPct = 0;
  if (sortedSnapshots.length >= 2) {
    const latest = sortedSnapshots[sortedSnapshots.length - 1].mrr;
    const prev = sortedSnapshots[Math.max(0, sortedSnapshots.length - 31)]?.mrr ?? latest;
    mrrGrowthPct = prev > 0 ? ((latest - prev) / prev) * 100 : 0;
  }

  // MRR movements by month (from subscription events)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const movements = await db
    .select({
      month: sql<string>`substr(${subscriptionEvents.createdAt}, 1, 7)`,
      newMrr: sql<number>`COALESCE(SUM(CASE WHEN ${subscriptionEvents.changeType} = 'created' THEN ${subscriptionEvents.mrr} ELSE 0 END), 0)`,
      churnedMrr: sql<number>`COALESCE(SUM(CASE WHEN ${subscriptionEvents.changeType} = 'canceled' THEN ${subscriptionEvents.mrr} ELSE 0 END), 0)`,
      recoveredMrr: sql<number>`COALESCE(SUM(CASE WHEN ${subscriptionEvents.changeType} = 'recovered' THEN ${subscriptionEvents.mrr} ELSE 0 END), 0)`,
    })
    .from(subscriptionEvents)
    .where(gte(subscriptionEvents.createdAt, ninetyDaysAgo.toISOString()))
    .groupBy(sql`substr(${subscriptionEvents.createdAt}, 1, 7)`)
    .orderBy(sql`substr(${subscriptionEvents.createdAt}, 1, 7)`);

  return {
    mrr,
    arr,
    activeClients: mrrResult?.activeCount ?? 0,
    mrrGrowthPct: Math.round(mrrGrowthPct * 10) / 10,
    snapshots: sortedSnapshots,
    movements,
  };
}

async function getPayments() {
  // Past-due clients with dunning
  const pastDueClients = await db
    .select({
      business: businesses,
      dunning: dunningState,
    })
    .from(businesses)
    .leftJoin(
      dunningState,
      and(
        eq(dunningState.businessId, businesses.id),
        eq(dunningState.status, "active"),
      ),
    )
    .where(inArray(businesses.paymentStatus, ["past_due", "grace_period"]));

  // MRR at risk
  const mrrAtRisk = pastDueClients.reduce(
    (sum, c) => sum + (c.business.mrr ?? 49700),
    0,
  );

  // Recovery stats
  const [recoveryStats] = await db
    .select({
      totalDunned: sql<number>`COUNT(*)`,
      recovered: sql<number>`COUNT(CASE WHEN ${dunningState.status} = 'recovered' THEN 1 END)`,
      avgDaysToRecover: sql<number>`AVG(CASE WHEN ${dunningState.status} = 'recovered' THEN CAST((julianday(${dunningState.recoveredAt}) - julianday(${dunningState.firstFailedAt})) AS INTEGER) END)`,
    })
    .from(dunningState);

  const recoveryRate =
    (recoveryStats?.totalDunned ?? 0) > 0
      ? ((recoveryStats?.recovered ?? 0) / recoveryStats!.totalDunned) * 100
      : 0;

  // Recent payment events
  const recentEvents = await db
    .select({
      event: paymentEvents,
      businessName: businesses.name,
    })
    .from(paymentEvents)
    .leftJoin(businesses, eq(paymentEvents.businessId, businesses.id))
    .orderBy(desc(paymentEvents.createdAt))
    .limit(50);

  return {
    pastDueClients: pastDueClients.map((c) => ({
      id: c.business.id,
      name: c.business.name,
      mrr: c.business.mrr,
      paymentStatus: c.business.paymentStatus,
      firstFailedAt: c.dunning?.firstFailedAt,
      attemptCount: c.dunning?.attemptCount,
      lastFailureCode: c.dunning?.lastFailureCode,
      email1SentAt: c.dunning?.email1SentAt,
      email2SentAt: c.dunning?.email2SentAt,
      email3SentAt: c.dunning?.email3SentAt,
      smsSentAt: c.dunning?.smsSentAt,
    })),
    mrrAtRisk,
    recoveryRate: Math.round(recoveryRate),
    avgDaysToRecover: Math.round(recoveryStats?.avgDaysToRecover ?? 0),
    recentEvents: recentEvents.map((e) => ({
      ...e.event,
      businessName: e.businessName,
    })),
  };
}

async function getCosts() {
  // Latest month of cost data
  const latestCosts = await db
    .select({
      cost: clientCosts,
      businessName: businesses.name,
    })
    .from(clientCosts)
    .leftJoin(businesses, eq(clientCosts.businessId, businesses.id))
    .orderBy(desc(clientCosts.month), desc(clientCosts.totalCost))
    .limit(100);

  // Aggregate stats for latest month
  const latestMonth = latestCosts[0]?.cost.month;
  const monthCosts = latestCosts.filter((c) => c.cost.month === latestMonth);

  const totalCost = monthCosts.reduce((s, c) => s + (c.cost.totalCost ?? 0), 0);
  const avgCost = monthCosts.length > 0 ? totalCost / monthCosts.length : 0;
  const totalRevenue = monthCosts.reduce((s, c) => s + (c.cost.revenue ?? 0), 0);
  const avgMarginPct = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

  return {
    month: latestMonth ?? "N/A",
    totalMonthlyCost: totalCost,
    avgCostPerClient: Math.round(avgCost),
    avgMarginPct: Math.round(avgMarginPct * 10) / 10,
    clients: monthCosts.map((c) => ({
      businessId: c.cost.businessId,
      businessName: c.businessName,
      ...c.cost,
    })),
  };
}

async function getForecast() {
  // Get MRR snapshots for projection
  const snapshots = await db
    .select()
    .from(mrrSnapshots)
    .orderBy(desc(mrrSnapshots.date))
    .limit(90);

  const sorted = snapshots.reverse();

  // Calculate recent trends
  const recentSnapshots = sorted.slice(-30);
  const totalNew = recentSnapshots.reduce((s, r) => s + (r.newClients ?? 0), 0);
  const totalChurned = recentSnapshots.reduce((s, r) => s + (r.churnedClients ?? 0), 0);
  const totalRecovered = recentSnapshots.reduce((s, r) => s + (r.recoveredClients ?? 0), 0);
  const days = recentSnapshots.length || 1;

  const avgDailyNew = totalNew / days;
  const avgDailyChurn = totalChurned / days;
  const avgDailyRecovery = totalRecovered / days;
  const currentMrr = sorted[sorted.length - 1]?.mrr ?? 0;
  const pricePerClient = 49700; // $497

  // 90-day projections
  const projections: { day: number; optimistic: number; base: number; pessimistic: number }[] = [];
  for (let d = 0; d <= 90; d++) {
    const baseNet = (avgDailyNew - avgDailyChurn + avgDailyRecovery) * d * pricePerClient;
    const optimisticNet = (avgDailyNew * 1.3 - avgDailyChurn * 0.7 + avgDailyRecovery * 1.2) * d * pricePerClient;
    const pessimisticNet = (avgDailyNew * 0.7 - avgDailyChurn * 1.3 + avgDailyRecovery * 0.8) * d * pricePerClient;
    projections.push({
      day: d,
      base: Math.round(currentMrr + baseNet),
      optimistic: Math.round(currentMrr + optimisticNet),
      pessimistic: Math.round(currentMrr + pessimisticNet),
    });
  }

  // Monthly churn rate
  const [activeCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(businesses)
    .where(eq(businesses.active, true));

  const monthlyChurnRate =
    (activeCount?.count ?? 0) > 0
      ? (totalChurned / days) * 30 / (activeCount?.count ?? 1) * 100
      : 0;

  return {
    currentMrr,
    monthlyChurnRate: Math.round(monthlyChurnRate * 10) / 10,
    avgMonthlySignups: Math.round(avgDailyNew * 30 * 10) / 10,
    avgMonthlyChurn: Math.round(avgDailyChurn * 30 * 10) / 10,
    recoveryRate: Math.round(totalNew > 0 ? (totalRecovered / (totalNew + totalChurned || 1)) * 100 : 0),
    historical: sorted,
    projections,
  };
}
