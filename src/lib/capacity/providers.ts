import { db } from "@/db";
import { calls, businesses, activeCalls } from "@/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { PROVIDER_LIMITS } from "./config";

export interface TwilioMetrics {
  callsToday: number;
  errorCount: number;
  successRate: number;
}

export interface HumeMetrics {
  minutesUsedMtd: number;
  planMinutes: number;
  concurrentPeak: number;
  concurrentLimit: number;
}

export interface AnthropicMetrics {
  tokensUsedMtd: number;
  rpmPeak: number;
  monthlySpend: number; // cents
  spendLimit: number; // cents
}

export interface TursoMetrics {
  rowReadsEstimate: number;
  rowReadLimit: number;
  rowWritesEstimate: number;
  rowWriteLimit: number;
  storageLimitMb: number;
}

export async function getTwilioMetrics(date: string): Promise<TwilioMetrics> {
  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

  const [callData] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      failed: sql<number>`COUNT(CASE WHEN ${calls.status} = 'failed' THEN 1 END)`,
    })
    .from(calls)
    .where(and(gte(calls.createdAt, dayStart), lt(calls.createdAt, dayEnd)));

  const total = callData?.total ?? 0;
  const failed = callData?.failed ?? 0;

  return {
    callsToday: total,
    errorCount: failed,
    successRate: total > 0 ? ((total - failed) / total) * 100 : 100,
  };
}

export async function getHumeMetrics(): Promise<HumeMetrics> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [minuteData] = await db
    .select({
      totalMinutes: sql<number>`COALESCE(SUM(${calls.duration}), 0) / 60.0`,
    })
    .from(calls)
    .where(gte(calls.createdAt, monthStart));

  // Current concurrent calls as proxy for peak
  const [concurrent] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(activeCalls);

  return {
    minutesUsedMtd: minuteData?.totalMinutes ?? 0,
    planMinutes: PROVIDER_LIMITS.hume.monthlyMinutes,
    concurrentPeak: concurrent?.count ?? 0,
    concurrentLimit: PROVIDER_LIMITS.hume.concurrentLimit,
  };
}

export async function getAnthropicMetrics(): Promise<AnthropicMetrics> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [callData] = await db
    .select({
      count: sql<number>`COUNT(*)`,
      totalMinutes: sql<number>`COALESCE(SUM(${calls.duration}), 0) / 60.0`,
    })
    .from(calls)
    .where(gte(calls.createdAt, monthStart));

  const count = callData?.count ?? 0;
  const minutes = callData?.totalMinutes ?? 0;

  // Estimate tokens from call duration + summary generation:
  // - System prompt: ~800 tokens per call
  // - Transcript context: ~100 tokens/minute of call audio
  // - Summary generation: ~500 tokens output per call
  // Blended cost: ~$3/MTok input, ~$15/MTok output (Sonnet)
  const inputTokens = count * 800 + minutes * 100;
  const outputTokens = count * 500;
  const estimatedTokens = inputTokens + outputTokens;
  const estimatedSpend = Math.round(
    (inputTokens / 1_000_000) * 3 * 100 + (outputTokens / 1_000_000) * 15 * 100,
  ); // cents

  // RPM peak estimation: peak hourly calls / 60 (rough proxy, no real tracking yet)
  const [peakHour] = await db
    .select({
      maxCalls: sql<number>`MAX(hourly_count)`,
    })
    .from(
      db
        .select({
          hourly_count: sql<number>`COUNT(*)`.as("hourly_count"),
        })
        .from(calls)
        .where(gte(calls.createdAt, monthStart))
        .groupBy(sql`strftime('%Y-%m-%d %H', ${calls.createdAt})`)
        .as("hourly"),
    );
  const estimatedRpmPeak = Math.ceil((peakHour?.maxCalls ?? 0) / 60) * 2; // 2 API calls per call (context + summary)

  return {
    tokensUsedMtd: estimatedTokens,
    rpmPeak: estimatedRpmPeak,
    monthlySpend: estimatedSpend,
    spendLimit: PROVIDER_LIMITS.anthropic.monthlySpendLimit,
  };
}

export async function getTursoMetrics(): Promise<TursoMetrics> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [callCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(calls)
    .where(gte(calls.createdAt, monthStart));

  const [bizCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(businesses)
    .where(eq(businesses.active, true));

  const callsThisMonth = callCount?.count ?? 0;
  const activeClients = bizCount?.count ?? 0;

  // Better estimates based on actual operations per call:
  // Per call: ~8 reads (lead lookup, business config, availability, etc.) + ~4 writes (call record, lead upsert, SMS, etc.)
  // Per client/day: ~20 reads (dashboard loads, cron checks) + ~5 writes (health checks, snapshots)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const clientReads = activeClients * dayOfMonth * 20;
  const clientWrites = activeClients * dayOfMonth * 5;

  return {
    rowReadsEstimate: callsThisMonth * 8 + clientReads,
    rowReadLimit: PROVIDER_LIMITS.turso.rowReadLimit,
    rowWritesEstimate: callsThisMonth * 4 + clientWrites,
    rowWriteLimit: PROVIDER_LIMITS.turso.rowWriteLimit,
    storageLimitMb: PROVIDER_LIMITS.turso.storageLimitMb,
  };
}

export async function getConcurrentCallCount(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(activeCalls);
  return result?.count ?? 0;
}

export async function cleanupStaleCalls(): Promise<number> {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const stale = await db
    .delete(activeCalls)
    .where(lt(activeCalls.startedAt, thirtyMinAgo))
    .returning();
  return stale.length;
}
