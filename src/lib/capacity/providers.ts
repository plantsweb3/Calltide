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

  const [callCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(calls)
    .where(gte(calls.createdAt, monthStart));

  const count = callCount?.count ?? 0;
  // Estimate: ~1000 tokens per call, blended cost ~$0.0015/1K tokens
  const estimatedTokens = count * 1000;
  const estimatedSpend = Math.round((estimatedTokens / 1_000_000) * 1.5 * 100); // cents

  return {
    tokensUsedMtd: estimatedTokens,
    rpmPeak: 0, // Would need to track from API response headers
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

  const count = callCount?.count ?? 0;

  return {
    rowReadsEstimate: count * 5,
    rowReadLimit: PROVIDER_LIMITS.turso.rowReadLimit,
    rowWritesEstimate: count * 3,
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
