import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  businesses,
  capacitySnapshots,
  capacityAlerts,
  scalingPlaybook,
} from "@/db/schema";
import { desc, eq, sql, isNull, and } from "drizzle-orm";
import { PROVIDER_LIMITS, determineTier } from "@/lib/capacity/config";
import { getConcurrentCallCount } from "@/lib/capacity/providers";
import { projectBreachDate, estimatePeakConcurrent, estimateMonthlyCost } from "@/lib/capacity/modeling";

export async function GET() {
  try {
    // Current concurrent calls
    const concurrent = await getConcurrentCallCount();

    // Active clients
    const [clientResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(businesses)
      .where(eq(businesses.active, true));
    const activeClients = clientResult?.count ?? 0;
    const tier = determineTier(activeClients);

    // Latest snapshot
    const [latestSnapshot] = await db
      .select()
      .from(capacitySnapshots)
      .orderBy(desc(capacitySnapshots.date))
      .limit(1);

    // Snapshots for charts (last 90 days)
    const snapshots = await db
      .select()
      .from(capacitySnapshots)
      .orderBy(desc(capacitySnapshots.date))
      .limit(90);

    // Active alerts
    const alerts = await db
      .select()
      .from(capacityAlerts)
      .where(isNull(capacityAlerts.resolvedAt))
      .orderBy(desc(capacityAlerts.createdAt));

    // All alerts (recent 50)
    const recentAlerts = await db
      .select()
      .from(capacityAlerts)
      .orderBy(desc(capacityAlerts.createdAt))
      .limit(50);

    // Playbook for current tier (and next tier)
    const allPlaybook = await db
      .select()
      .from(scalingPlaybook)
      .orderBy(scalingPlaybook.tier, scalingPlaybook.provider);

    // Breach projections
    const dayOfMonth = new Date().getDate();
    const breachProjections = [
      {
        id: "hume-minutes",
        provider: "Hume",
        metric: "Monthly Minutes",
        current: latestSnapshot?.humeMinutesMtd ?? 0,
        limit: PROVIDER_LIMITS.hume.monthlyMinutes,
        breachDate: projectBreachDate(latestSnapshot?.humeMinutesMtd ?? 0, PROVIDER_LIMITS.hume.monthlyMinutes, dayOfMonth)?.toISOString() ?? null,
      },
      {
        id: "anthropic-spend",
        provider: "Anthropic",
        metric: "Monthly Spend",
        current: latestSnapshot?.anthropicSpendMtd ?? 0,
        limit: PROVIDER_LIMITS.anthropic.monthlySpendLimit,
        breachDate: projectBreachDate(latestSnapshot?.anthropicSpendMtd ?? 0, PROVIDER_LIMITS.anthropic.monthlySpendLimit, dayOfMonth)?.toISOString() ?? null,
      },
      {
        id: "turso-reads",
        provider: "Turso",
        metric: "Row Reads",
        current: latestSnapshot?.tursoRowReadsMtd ?? 0,
        limit: PROVIDER_LIMITS.turso.rowReadLimit,
        breachDate: projectBreachDate(latestSnapshot?.tursoRowReadsMtd ?? 0, PROVIDER_LIMITS.turso.rowReadLimit, dayOfMonth)?.toISOString() ?? null,
      },
    ];

    // Peak concurrent estimate
    const estimatedPeak = estimatePeakConcurrent(activeClients);

    // Cost estimate
    const costEstimate = estimateMonthlyCost(activeClients);

    return NextResponse.json({
      concurrent,
      concurrentLimit: PROVIDER_LIMITS.hume.concurrentLimit,
      activeClients,
      tier,
      snapshot: latestSnapshot ?? null,
      snapshots: snapshots.reverse(),
      alerts,
      recentAlerts,
      playbook: allPlaybook,
      providerLimits: PROVIDER_LIMITS,
      breachProjections,
      estimatedPeak,
      costEstimate,
    });
  } catch (err) {
    console.error("[capacity status] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Status fetch failed" },
      { status: 500 },
    );
  }
}
