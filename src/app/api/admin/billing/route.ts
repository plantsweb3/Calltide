import { NextResponse } from "next/server";
import { db } from "@/db";
import { revenueMetrics, churnRiskScores, businesses } from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

export async function GET() {
  try {
    // Latest revenue metrics
    const [latest] = await db
      .select()
      .from(revenueMetrics)
      .orderBy(desc(revenueMetrics.date))
      .limit(1);

    // Revenue trend (last 30 days)
    const trend = await db
      .select()
      .from(revenueMetrics)
      .orderBy(desc(revenueMetrics.date))
      .limit(30);

    // Aggregate stats
    const [aggregates] = await db
      .select({
        totalNewCustomers: sql<number>`sum(${revenueMetrics.newCustomers})`,
        totalChurned: sql<number>`sum(${revenueMetrics.churnedCustomers})`,
        totalFailedPayments: sql<number>`sum(${revenueMetrics.failedPayments})`,
      })
      .from(revenueMetrics)
      .where(sql`${revenueMetrics.date} >= date('now', '-30 days')`);

    // Churn risk scores with business names
    const churnRisks = await db
      .select({
        id: churnRiskScores.id,
        customerId: churnRiskScores.customerId,
        businessName: businesses.name,
        businessType: businesses.type,
        score: churnRiskScores.score,
        factors: churnRiskScores.factors,
        calculatedAt: churnRiskScores.calculatedAt,
      })
      .from(churnRiskScores)
      .leftJoin(businesses, eq(churnRiskScores.customerId, businesses.id))
      .orderBy(desc(churnRiskScores.score));

    // Simple forecast: average MRR growth over last 30 days projected forward
    const sortedTrend = [...trend].reverse();
    let avgGrowth = 0;
    if (sortedTrend.length > 1) {
      const firstMrr = sortedTrend[0].mrr;
      const lastMrr = sortedTrend[sortedTrend.length - 1].mrr;
      avgGrowth = (lastMrr - firstMrr) / sortedTrend.length;
    }

    const currentMrr = latest?.mrr ?? 0;
    const forecast = {
      nextMonth: Math.round(currentMrr + avgGrowth * 30),
      threeMonth: Math.round(currentMrr + avgGrowth * 90),
      sixMonth: Math.round(currentMrr + avgGrowth * 180),
    };

    // Plan mix metrics
    const planMix = await db
      .select({
        planType: businesses.planType,
        count: sql<number>`count(*)`,
        totalMrr: sql<number>`sum(${businesses.mrr})`,
      })
      .from(businesses)
      .where(eq(businesses.active, true))
      .groupBy(businesses.planType);

    const planMixData: Record<string, { count: number; mrr: number }> = {};
    for (const row of planMix) {
      planMixData[row.planType ?? "monthly"] = {
        count: row.count,
        mrr: row.totalMrr ?? 0,
      };
    }

    return NextResponse.json({
      current: {
        mrr: latest?.mrr ?? 0,
        arr: latest?.arr ?? 0,
        customerCount: latest?.customerCount ?? 0,
      },
      trend: sortedTrend,
      aggregates: {
        newCustomers30d: aggregates?.totalNewCustomers ?? 0,
        churned30d: aggregates?.totalChurned ?? 0,
        failedPayments30d: aggregates?.totalFailedPayments ?? 0,
      },
      churnRisks,
      forecast,
      planMix: planMixData,
    });
  } catch (error) {
    reportError("Error fetching billing data", error);
    return NextResponse.json({ error: "Failed to fetch billing data" }, { status: 500 });
  }
}
