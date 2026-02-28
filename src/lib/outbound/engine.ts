import { getTwilioClient } from "@/lib/twilio/client";
import { env } from "@/lib/env";
import { db } from "@/db";
import { outboundCalls, businesses, customers, consentRecords } from "@/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { logActivity } from "@/lib/activity";
import { reportError } from "@/lib/error-reporting";

/**
 * Check whether the business is within its configured outbound calling hours.
 */
export function isWithinCallingHours(
  startHour: string,
  endHour: string,
  timezone: string,
): boolean {
  const now = new Date();
  const ct = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const hour = ct.getHours();
  const minute = ct.getMinutes();
  const currentMinutes = hour * 60 + minute;

  const [startH, startM] = startHour.split(":").map(Number);
  const [endH, endM] = endHour.split(":").map(Number);
  const startMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Count how many outbound calls a business has made today.
 */
async function getTodayCallCount(businessId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(outboundCalls)
    .where(
      and(
        eq(outboundCalls.businessId, businessId),
        gte(outboundCalls.createdAt, today),
      ),
    );
  return result?.count ?? 0;
}

/**
 * TCPA-compliant pre-check: verify we have consent to call this phone for this business.
 * Returns { allowed, reason }.
 */
export async function canMakeOutboundCall(
  businessId: string,
  phone: string,
): Promise<{ allowed: boolean; reason?: string }> {
  // 1. Check opt-out / revoked consent
  const [revokedConsent] = await db
    .select({ id: consentRecords.id })
    .from(consentRecords)
    .where(
      and(
        eq(consentRecords.phoneNumber, phone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1")),
        eq(consentRecords.consentType, "outbound_call"),
        eq(consentRecords.status, "revoked"),
      ),
    )
    .limit(1);

  if (revokedConsent) {
    return { allowed: false, reason: "consent_revoked" };
  }

  // 2. Check that the customer exists for this business (implies prior relationship)
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.businessId, businessId),
        eq(customers.phone, phone),
      ),
    )
    .limit(1);

  if (!customer) {
    return { allowed: false, reason: "no_prior_relationship" };
  }

  return { allowed: true };
}

/**
 * Initiate an outbound call via Twilio, connecting to Hume EVI via TwiML.
 */
export async function initiateOutboundCall(
  outboundCallId: string,
): Promise<{ success: boolean; error?: string }> {
  const [call] = await db
    .select()
    .from(outboundCalls)
    .where(eq(outboundCalls.id, outboundCallId));

  if (!call) return { success: false, error: "Outbound call not found" };
  if (call.status !== "scheduled" && call.status !== "retry") {
    return { success: false, error: `Invalid status: ${call.status}` };
  }

  // Get business config
  const [biz] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, call.businessId));

  if (!biz) return { success: false, error: "Business not found" };
  if (!biz.outboundEnabled) return { success: false, error: "Outbound disabled for business" };

  // Check calling hours
  if (
    !isWithinCallingHours(
      biz.outboundCallingHoursStart ?? "09:00",
      biz.outboundCallingHoursEnd ?? "18:00",
      biz.timezone,
    )
  ) {
    return { success: false, error: "Outside calling hours" };
  }

  // Check daily limit
  const todayCount = await getTodayCallCount(call.businessId);
  if (todayCount >= (biz.outboundMaxCallsPerDay ?? 20)) {
    return { success: false, error: "Daily call limit reached" };
  }

  // TCPA consent check
  const consent = await canMakeOutboundCall(call.businessId, call.customerPhone);
  if (!consent.allowed) {
    await db
      .update(outboundCalls)
      .set({ status: "consent_blocked", outcome: consent.reason, updatedAt: new Date().toISOString() })
      .where(eq(outboundCalls.id, outboundCallId));
    return { success: false, error: `Consent check failed: ${consent.reason}` };
  }

  try {
    const client = getTwilioClient();
    const twilioCall = await client.calls.create({
      to: call.customerPhone,
      from: biz.twilioNumber,
      url: `${env.NEXT_PUBLIC_APP_URL}/api/outbound/twiml/${outboundCallId}`,
      statusCallback: `${env.NEXT_PUBLIC_APP_URL}/api/outbound/status/${outboundCallId}`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
      machineDetection: "Enable",
      timeout: 25,
    });

    await db
      .update(outboundCalls)
      .set({
        status: "initiated",
        twilioCallSid: twilioCall.sid,
        attemptedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(outboundCalls.id, outboundCallId));

    await logActivity({
      type: "outbound_call",
      entityType: "outbound_call",
      entityId: outboundCallId,
      title: `Outbound ${call.callType} call initiated`,
      detail: `Calling ${call.customerPhone} for business ${biz.name}`,
    });

    return { success: true };
  } catch (error) {
    reportError("Outbound call initiation failed", error, {
      businessId: call.businessId,
      extra: { outboundCallId },
    });

    await db
      .update(outboundCalls)
      .set({
        status: "failed",
        outcome: error instanceof Error ? error.message : "Twilio call failed",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(outboundCalls.id, outboundCallId));

    return { success: false, error: error instanceof Error ? error.message : "Call failed" };
  }
}

/**
 * Handle Twilio status callback for an outbound call.
 */
export async function handleOutboundStatusCallback(
  outboundCallId: string,
  params: {
    CallSid: string;
    CallStatus: string;
    CallDuration?: string;
    AnsweredBy?: string;
  },
) {
  const { CallStatus, CallDuration, AnsweredBy } = params;

  const [call] = await db
    .select()
    .from(outboundCalls)
    .where(eq(outboundCalls.id, outboundCallId));

  if (!call) return;

  const updates: Partial<typeof outboundCalls.$inferInsert> = {
    status: CallStatus,
    updatedAt: new Date().toISOString(),
  };

  if (CallDuration) updates.duration = parseInt(CallDuration, 10);

  const terminalStatuses = ["completed", "no-answer", "busy", "failed", "canceled"];
  if (terminalStatuses.includes(CallStatus)) {
    updates.completedAt = new Date().toISOString();

    if (CallStatus === "completed" && AnsweredBy === "human") {
      updates.outcome = "answered";
    } else if (CallStatus === "completed" && AnsweredBy === "machine") {
      updates.outcome = "voicemail";
    } else if (CallStatus === "completed") {
      updates.outcome = "answered";
    } else if (CallStatus === "no-answer") {
      updates.outcome = "no_answer";
    } else if (CallStatus === "busy") {
      updates.outcome = "busy";
    } else {
      updates.outcome = "failed";
    }

    // Schedule retry if not answered and retries remaining
    if (
      updates.outcome !== "answered" &&
      (call.retryCount ?? 0) < (call.maxRetries ?? 2)
    ) {
      updates.status = "retry";
      updates.retryCount = (call.retryCount ?? 0) + 1;
    }
  }

  await db
    .update(outboundCalls)
    .set(updates)
    .where(eq(outboundCalls.id, outboundCallId));

  if (terminalStatuses.includes(CallStatus)) {
    await logActivity({
      type: "outbound_call_result",
      entityType: "outbound_call",
      entityId: outboundCallId,
      title: `Outbound call ${updates.outcome}`,
      detail: `Duration: ${CallDuration ?? 0}s, Answered by: ${AnsweredBy ?? "unknown"}`,
    });
  }
}

/**
 * Schedule an outbound call. This creates the record; the dispatch cron will initiate it.
 */
export async function scheduleOutboundCall(params: {
  businessId: string;
  customerId?: string;
  customerPhone: string;
  callType: "appointment_reminder" | "estimate_followup" | "seasonal_reminder";
  referenceId?: string;
  scheduledFor: string;
  language?: string;
}): Promise<{ success: boolean; callId?: string; error?: string }> {
  // Check business has outbound enabled
  const [biz] = await db
    .select({
      outboundEnabled: businesses.outboundEnabled,
      appointmentReminders: businesses.appointmentReminders,
      estimateFollowups: businesses.estimateFollowups,
      seasonalReminders: businesses.seasonalReminders,
    })
    .from(businesses)
    .where(eq(businesses.id, params.businessId));

  if (!biz?.outboundEnabled) {
    return { success: false, error: "Outbound calling not enabled" };
  }

  // Check specific call type is enabled
  if (params.callType === "appointment_reminder" && !biz.appointmentReminders) {
    return { success: false, error: "Appointment reminders disabled" };
  }
  if (params.callType === "estimate_followup" && !biz.estimateFollowups) {
    return { success: false, error: "Estimate follow-ups disabled" };
  }
  if (params.callType === "seasonal_reminder" && !biz.seasonalReminders) {
    return { success: false, error: "Seasonal reminders disabled" };
  }

  // TCPA consent check
  const consent = await canMakeOutboundCall(params.businessId, params.customerPhone);
  if (!consent.allowed) {
    return { success: false, error: `Consent check failed: ${consent.reason}` };
  }

  // Check for duplicate scheduled call (same business, phone, type, reference within 24h)
  if (params.referenceId) {
    const [existing] = await db
      .select({ id: outboundCalls.id })
      .from(outboundCalls)
      .where(
        and(
          eq(outboundCalls.businessId, params.businessId),
          eq(outboundCalls.customerPhone, params.customerPhone),
          eq(outboundCalls.callType, params.callType),
          eq(outboundCalls.referenceId, params.referenceId),
        ),
      )
      .limit(1);

    if (existing) {
      return { success: false, error: "Duplicate call already scheduled" };
    }
  }

  const [record] = await db
    .insert(outboundCalls)
    .values({
      businessId: params.businessId,
      customerId: params.customerId,
      customerPhone: params.customerPhone,
      callType: params.callType,
      referenceId: params.referenceId,
      scheduledFor: params.scheduledFor,
      language: params.language ?? "en",
    })
    .returning();

  return { success: true, callId: record.id };
}
