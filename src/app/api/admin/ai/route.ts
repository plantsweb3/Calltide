import { NextResponse } from "next/server";
import { db } from "@/db";
import { calls, escalations, businesses } from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    // Quality metrics from calls
    const [quality] = await db
      .select({
        totalCalls: sql<number>`count(*)`,
        avgDuration: sql<number>`avg(case when ${calls.duration} > 0 then ${calls.duration} end)`,
        completionRate: sql<number>`(sum(case when ${calls.status} = 'completed' then 1.0 else 0 end) / count(*)) * 100`,
        transferRate: sql<number>`(sum(case when ${calls.transferRequested} = 1 then 1.0 else 0 end) / count(*)) * 100`,
        positiveRate: sql<number>`(sum(case when ${calls.sentiment} = 'positive' then 1.0 else 0 end) / count(*)) * 100`,
        neutralRate: sql<number>`(sum(case when ${calls.sentiment} = 'neutral' then 1.0 else 0 end) / count(*)) * 100`,
        negativeRate: sql<number>`(sum(case when ${calls.sentiment} = 'negative' then 1.0 else 0 end) / count(*)) * 100`,
      })
      .from(calls);

    // Sentiment breakdown
    const sentimentBreakdown = await db
      .select({
        sentiment: calls.sentiment,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(calls)
      .groupBy(calls.sentiment);

    // Escalation log with business names
    const escalationLog = await db
      .select({
        id: escalations.id,
        callId: escalations.callId,
        customerId: escalations.customerId,
        businessName: businesses.name,
        reason: escalations.reason,
        resolutionStatus: escalations.resolutionStatus,
        assignedTo: escalations.assignedTo,
        notes: escalations.notes,
        resolvedAt: escalations.resolvedAt,
        createdAt: escalations.createdAt,
      })
      .from(escalations)
      .leftJoin(businesses, eq(escalations.customerId, businesses.id))
      .orderBy(desc(escalations.createdAt))
      .limit(50);

    // Escalation stats
    const [escStats] = await db
      .select({
        total: sql<number>`count(*)`,
        open: sql<number>`sum(case when ${escalations.resolutionStatus} = 'open' then 1 else 0 end)`,
        inProgress: sql<number>`sum(case when ${escalations.resolutionStatus} = 'in_progress' then 1 else 0 end)`,
        resolved: sql<number>`sum(case when ${escalations.resolutionStatus} = 'resolved' then 1 else 0 end)`,
      })
      .from(escalations);

    return NextResponse.json({
      quality: {
        totalCalls: quality.totalCalls ?? 0,
        avgDuration: Math.round(quality.avgDuration ?? 0),
        completionRate: Math.round((quality.completionRate ?? 0) * 10) / 10,
        transferRate: Math.round((quality.transferRate ?? 0) * 10) / 10,
        positiveRate: Math.round((quality.positiveRate ?? 0) * 10) / 10,
        neutralRate: Math.round((quality.neutralRate ?? 0) * 10) / 10,
        negativeRate: Math.round((quality.negativeRate ?? 0) * 10) / 10,
      },
      sentimentBreakdown: sentimentBreakdown.map((r) => ({
        sentiment: r.sentiment || "unknown",
        count: r.count,
      })),
      escalations: {
        stats: {
          total: escStats?.total ?? 0,
          open: escStats?.open ?? 0,
          inProgress: escStats?.inProgress ?? 0,
          resolved: escStats?.resolved ?? 0,
        },
        log: escalationLog,
      },
    });
  } catch (error) {
    console.error("Error fetching AI performance data:", error);
    return NextResponse.json({ error: "Failed to fetch AI performance data" }, { status: 500 });
  }
}
