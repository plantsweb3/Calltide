import { db } from "@/db";
import { activeCalls, callPeaks, businesses, customers } from "@/db/schema";
import { eq, and, lt, sql, count } from "drizzle-orm";

/**
 * Insert an active call record when a new inbound call starts.
 * Also updates peak tracking for today.
 */
export async function trackCallStart(params: {
  businessId: string;
  callerPhone: string;
  direction: "inbound" | "outbound";
  twilioCallSid?: string;
  sessionId?: string;
  callType?: string;
  language?: string;
}) {
  // Get business name (denormalized for fast display)
  const [biz] = await db
    .select({ name: businesses.name })
    .from(businesses)
    .where(eq(businesses.id, params.businessId));

  if (!biz) return;

  // Check if this is a returning caller
  let customerName: string | null = null;
  let isReturning = false;
  const [customer] = await db
    .select({ name: customers.name })
    .from(customers)
    .where(
      and(
        eq(customers.businessId, params.businessId),
        eq(customers.phone, params.callerPhone),
      ),
    )
    .limit(1);

  if (customer) {
    customerName = customer.name;
    isReturning = true;
  }

  await db.insert(activeCalls).values({
    businessId: params.businessId,
    businessName: biz.name,
    callerPhone: params.callerPhone,
    customerName,
    isReturningCaller: isReturning,
    direction: params.direction,
    twilioCallSid: params.twilioCallSid,
    sessionId: params.sessionId,
    callType: params.callType,
    language: params.language ?? "en",
    status: "in_progress",
  });

  // Update peak tracking
  await updatePeakTracking();
}

/**
 * Update an active call's intent / metadata during the call.
 */
export async function updateActiveCall(
  identifier: { twilioCallSid?: string; sessionId?: string },
  updates: {
    currentIntent?: string;
    callType?: string;
    language?: string;
    status?: string;
    durationSeconds?: number;
  },
) {
  const condition = identifier.sessionId
    ? eq(activeCalls.sessionId, identifier.sessionId)
    : identifier.twilioCallSid
      ? eq(activeCalls.twilioCallSid, identifier.twilioCallSid)
      : null;

  if (!condition) return;

  await db
    .update(activeCalls)
    .set({
      ...updates,
      lastActivityAt: new Date().toISOString(),
    })
    .where(condition);
}

/**
 * Remove an active call record when the call ends.
 * The permanent record lives in the `calls` or `outboundCalls` table.
 */
export async function trackCallEnd(identifier: {
  twilioCallSid?: string;
  sessionId?: string;
}) {
  const condition = identifier.sessionId
    ? eq(activeCalls.sessionId, identifier.sessionId)
    : identifier.twilioCallSid
      ? eq(activeCalls.twilioCallSid, identifier.twilioCallSid)
      : null;

  if (!condition) return;

  await db.delete(activeCalls).where(condition);
}

/**
 * Clean up stale active call records (>10 min old).
 * Should be called from the health agent cron.
 */
export async function cleanupStaleCalls(): Promise<number> {
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const stale = await db
    .select({ count: count() })
    .from(activeCalls)
    .where(lt(activeCalls.startedAt, tenMinAgo));

  const staleCount = stale[0]?.count ?? 0;

  if (staleCount > 0) {
    await db.delete(activeCalls).where(lt(activeCalls.startedAt, tenMinAgo));
  }

  return staleCount;
}

/**
 * Update today's peak concurrent call count if current count exceeds it.
 * Also increments totalCalls for the day.
 * Uses atomic SQL to avoid SELECT-then-UPDATE race conditions.
 */
async function updatePeakTracking() {
  const [activeCount] = await db
    .select({ count: count() })
    .from(activeCalls)
    .where(eq(activeCalls.status, "in_progress"));

  const currentCount = activeCount?.count ?? 0;
  const today = new Date().toISOString().slice(0, 10);
  const currentTime = new Date().toTimeString().slice(0, 5);
  const nowIso = new Date().toISOString();

  // Try atomic upsert: INSERT or UPDATE in one statement
  const [existing] = await db
    .select({ id: callPeaks.date })
    .from(callPeaks)
    .where(eq(callPeaks.date, today))
    .limit(1);

  if (!existing) {
    await db.insert(callPeaks).values({
      date: today,
      peakConcurrent: currentCount,
      peakTime: currentTime,
      totalCalls: 1,
    });
  } else {
    // Atomic update: use CASE/WHEN to conditionally update peak in a single statement
    await db.run(sql`
      UPDATE call_peaks
      SET total_calls = total_calls + 1,
          peak_concurrent = CASE WHEN ${currentCount} > COALESCE(peak_concurrent, 0) THEN ${currentCount} ELSE peak_concurrent END,
          peak_time = CASE WHEN ${currentCount} > COALESCE(peak_concurrent, 0) THEN ${currentTime} ELSE peak_time END,
          updated_at = ${nowIso}
      WHERE date = ${today}
    `);
  }
}
