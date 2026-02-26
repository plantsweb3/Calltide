import { NextResponse } from "next/server";
import { db } from "@/db";
import { calls, businesses } from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    // Total call stats
    const [callStats] = await db
      .select({
        totalCalls: sql<number>`count(*)`,
        completedCalls: sql<number>`sum(case when ${calls.status} = 'completed' then 1 else 0 end)`,
        missedCalls: sql<number>`sum(case when ${calls.status} = 'missed' then 1 else 0 end)`,
        failedCalls: sql<number>`sum(case when ${calls.status} = 'failed' then 1 else 0 end)`,
        avgDuration: sql<number>`avg(case when ${calls.duration} > 0 then ${calls.duration} end)`,
      })
      .from(calls);

    // Call volume by day (last 30 days)
    const volumeByDay = await db
      .select({
        date: sql<string>`date(${calls.createdAt})`.as("date"),
        count: sql<number>`count(*)`.as("count"),
      })
      .from(calls)
      .where(sql`${calls.createdAt} >= datetime('now', '-30 days')`)
      .groupBy(sql`date(${calls.createdAt})`)
      .orderBy(sql`date(${calls.createdAt})`);

    // Language breakdown
    const languageBreakdown = await db
      .select({
        language: calls.language,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(calls)
      .groupBy(calls.language);

    // Sentiment breakdown
    const sentimentBreakdown = await db
      .select({
        sentiment: calls.sentiment,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(calls)
      .groupBy(calls.sentiment);

    // Status breakdown
    const statusBreakdown = await db
      .select({
        status: calls.status,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(calls)
      .groupBy(calls.status);

    // Recent calls (last 20)
    const recentCalls = await db
      .select({
        id: calls.id,
        businessName: businesses.name,
        callerPhone: calls.callerPhone,
        direction: calls.direction,
        status: calls.status,
        duration: calls.duration,
        language: calls.language,
        sentiment: calls.sentiment,
        summary: calls.summary,
        createdAt: calls.createdAt,
      })
      .from(calls)
      .leftJoin(businesses, eq(calls.businessId, businesses.id))
      .orderBy(desc(calls.createdAt))
      .limit(20);

    return NextResponse.json({
      stats: {
        totalCalls: callStats.totalCalls ?? 0,
        completedCalls: callStats.completedCalls ?? 0,
        missedCalls: callStats.missedCalls ?? 0,
        failedCalls: callStats.failedCalls ?? 0,
        avgDuration: Math.round(callStats.avgDuration ?? 0),
      },
      volumeByDay,
      languageBreakdown: languageBreakdown.map((r) => ({
        language: r.language || "unknown",
        count: r.count,
      })),
      sentimentBreakdown: sentimentBreakdown.map((r) => ({
        sentiment: r.sentiment || "unknown",
        count: r.count,
      })),
      statusBreakdown,
      recentCalls,
    });
  } catch (error) {
    console.error("Error fetching call analytics:", error);
    return NextResponse.json({ error: "Failed to fetch call analytics" }, { status: 500 });
  }
}
