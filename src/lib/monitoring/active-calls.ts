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
  humeSessionId?: string;
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
    humeSessionId: params.humeSessionId,
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
  identifier: { twilioCallSid?: string; humeSessionId?: string },
  updates: {
    currentIntent?: string;
    callType?: string;
    language?: string;
    status?: string;
    durationSeconds?: number;
  },
) {
  const condition = identifier.humeSessionId
    ? eq(activeCalls.humeSessionId, identifier.humeSessionId)
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
  humeSessionId?: string;
}) {
  const condition = identifier.humeSessionId
    ? eq(activeCalls.humeSessionId, identifier.humeSessionId)
    : identifier.twilioCallSid
      ? eq(activeCalls.twilioCallSid, identifier.twilioCallSid)
      : null;

  if (!condition) return;

  await db.delete(activeCalls).where(condition);
}

/**
 * Clean up stale active call records (>30 min old).
 * Should be called from the health agent cron.
 */
export async function cleanupStaleCalls(): Promise<number> {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const stale = await db
    .select({ count: count() })
    .from(activeCalls)
    .where(lt(activeCalls.startedAt, thirtyMinAgo));

  const staleCount = stale[0]?.count ?? 0;

  if (staleCount > 0) {
    await db.delete(activeCalls).where(lt(activeCalls.startedAt, thirtyMinAgo));
  }

  return staleCount;
}

/**
 * Update today's peak concurrent call count if current count exceeds it.
 * Also increments totalCalls for the day.
 */
async function updatePeakTracking() {
  const [activeCount] = await db
    .select({ count: count() })
    .from(activeCalls)
    .where(eq(activeCalls.status, "in_progress"));

  const currentCount = activeCount?.count ?? 0;
  const today = new Date().toISOString().slice(0, 10);
  const currentTime = new Date().toTimeString().slice(0, 5);

  const [existing] = await db
    .select()
    .from(callPeaks)
    .where(eq(callPeaks.date, today));

  if (!existing) {
    await db.insert(callPeaks).values({
      date: today,
      peakConcurrent: currentCount,
      peakTime: currentTime,
      totalCalls: 1,
    });
  } else {
    const updates: Partial<typeof callPeaks.$inferInsert> = {
      totalCalls: (existing.totalCalls ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    if (currentCount > (existing.peakConcurrent ?? 0)) {
      updates.peakConcurrent = currentCount;
      updates.peakTime = currentTime;
    }

    await db
      .update(callPeaks)
      .set(updates)
      .where(eq(callPeaks.date, today));
  }
}
