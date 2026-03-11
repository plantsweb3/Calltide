import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, mrrSnapshots, subscriptionEvents } from "@/db/schema";
import { eq, sql, and, gte, inArray } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const today = new Date().toISOString().split("T")[0];

    // Calculate current MRR from active + past_due subscriptions
    const [mrrResult] = await db
      .select({
        totalMrr: sql<number>`COALESCE(SUM(${businesses.mrr}), 0)`,
        activeCount: sql<number>`COUNT(CASE WHEN ${businesses.stripeSubscriptionStatus} = 'active' THEN 1 END)`,
        pastDueCount: sql<number>`COUNT(CASE WHEN ${businesses.stripeSubscriptionStatus} = 'past_due' THEN 1 END)`,
      })
      .from(businesses)
      .where(
        inArray(businesses.stripeSubscriptionStatus, ["active", "past_due"]),
      );

    // Count today's subscription events
    const todayStart = `${today}T00:00:00`;
    const [events] = await db
      .select({
        newClients: sql<number>`COUNT(CASE WHEN ${subscriptionEvents.changeType} = 'created' THEN 1 END)`,
        churnedClients: sql<number>`COUNT(CASE WHEN ${subscriptionEvents.changeType} = 'canceled' THEN 1 END)`,
        recoveredClients: sql<number>`COUNT(CASE WHEN ${subscriptionEvents.changeType} = 'recovered' THEN 1 END)`,
      })
      .from(subscriptionEvents)
      .where(gte(subscriptionEvents.createdAt, todayStart));

    const mrr = mrrResult?.totalMrr ?? 0;

    await db.insert(mrrSnapshots).values({
      date: today,
      mrr,
      arr: mrr * 12,
      activeClients: mrrResult?.activeCount ?? 0,
      pastDueClients: mrrResult?.pastDueCount ?? 0,
      newClients: events?.newClients ?? 0,
      churnedClients: events?.churnedClients ?? 0,
      recoveredClients: events?.recoveredClients ?? 0,
    });

    return NextResponse.json({
      ok: true,
      date: today,
      mrr,
      arr: mrr * 12,
      activeClients: mrrResult?.activeCount ?? 0,
      pastDueClients: mrrResult?.pastDueCount ?? 0,
    });
  } catch (err) {
    reportError("[mrr-snapshot] Error", err);
    return NextResponse.json(
      { error: "MRR snapshot failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
