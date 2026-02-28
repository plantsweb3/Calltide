import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, capacitySnapshots } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { determineTier, PROVIDER_LIMITS } from "@/lib/capacity/config";
import {
  getTwilioMetrics,
  getHumeMetrics,
  getAnthropicMetrics,
  getTursoMetrics,
  getConcurrentCallCount,
} from "@/lib/capacity/providers";
import { checkThresholds } from "@/lib/capacity/thresholds";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    // Count active clients
    const [clientCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(businesses)
      .where(eq(businesses.active, true));

    const activeClients = clientCount?.count ?? 0;
    const tier = determineTier(activeClients);

    // Collect provider metrics
    const twilio = await getTwilioMetrics(today);
    const hume = await getHumeMetrics();
    const anthropic = await getAnthropicMetrics();
    const turso = await getTursoMetrics();
    const concurrent = await getConcurrentCallCount();

    // Insert snapshot
    await db.insert(capacitySnapshots).values({
      date: today,
      currentTier: tier,
      activeClients,
      callsToday: twilio.callsToday,
      peakConcurrent: concurrent,
      humeMinutesMtd: hume.minutesUsedMtd,
      humePlanMinutes: hume.planMinutes,
      humeConcurrentPeak: hume.concurrentPeak,
      humeConcurrentLimit: hume.concurrentLimit,
      anthropicTokensMtd: anthropic.tokensUsedMtd,
      anthropicRpmPeak: anthropic.rpmPeak,
      anthropicSpendMtd: anthropic.monthlySpend,
      tursoRowReadsMtd: turso.rowReadsEstimate,
      tursoRowWritesMtd: turso.rowWritesEstimate,
      twilioCallsToday: twilio.callsToday,
      twilioErrorCount: twilio.errorCount,
      twilioSuccessRate: twilio.successRate,
    });

    // Run threshold checks
    await checkThresholds([
      {
        provider: "Hume",
        metric: "monthly_minutes",
        currentValue: hume.minutesUsedMtd,
        limitValue: hume.planMinutes,
      },
      {
        provider: "Hume",
        metric: "concurrent_connections",
        currentValue: concurrent,
        limitValue: hume.concurrentLimit,
      },
      {
        provider: "Anthropic",
        metric: "monthly_spend",
        currentValue: anthropic.monthlySpend,
        limitValue: anthropic.spendLimit,
      },
      {
        provider: "Turso",
        metric: "row_reads",
        currentValue: turso.rowReadsEstimate,
        limitValue: turso.rowReadLimit,
      },
      {
        provider: "Turso",
        metric: "row_writes",
        currentValue: turso.rowWritesEstimate,
        limitValue: turso.rowWriteLimit,
      },
    ]);

    return NextResponse.json({
      ok: true,
      date: today,
      tier,
      activeClients,
      callsToday: twilio.callsToday,
      concurrent,
    });
  } catch (err) {
    console.error("[capacity snapshot] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Snapshot failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
