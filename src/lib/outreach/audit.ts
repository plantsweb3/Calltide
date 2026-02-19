import { getTwilioClient } from "@/lib/twilio/client";
import { env } from "@/lib/env";
import { db } from "@/db";
import { prospectAuditCalls, prospects } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

const MAX_CALLS_PER_DAY = 50;
const CALL_WINDOW_START = 9; // 9 AM CT
const CALL_WINDOW_END = 17; // 5 PM CT

function isWithinCallWindow(): boolean {
  const now = new Date();
  const ct = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Chicago" }),
  );
  const hour = ct.getHours();
  return hour >= CALL_WINDOW_START && hour < CALL_WINDOW_END;
}

async function getTodayCallCount(): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(prospectAuditCalls)
    .where(gte(prospectAuditCalls.createdAt, today));
  return result[0]?.count ?? 0;
}

export async function scheduleAuditCall(
  prospectId: string,
): Promise<{ success: boolean; callId?: string; error?: string }> {
  if (!isWithinCallWindow()) {
    return { success: false, error: "Outside calling window (9am-5pm CT)" };
  }

  const todayCount = await getTodayCallCount();
  if (todayCount >= MAX_CALLS_PER_DAY) {
    return { success: false, error: `Daily limit reached (${MAX_CALLS_PER_DAY}/day)` };
  }

  const prospect = await db
    .select()
    .from(prospects)
    .where(eq(prospects.id, prospectId))
    .then((rows) => rows[0]);

  if (!prospect) return { success: false, error: "Prospect not found" };
  if (!prospect.phone) return { success: false, error: "Prospect has no phone" };

  const [auditCall] = await db
    .insert(prospectAuditCalls)
    .values({
      prospectId,
      fromNumber: env.TWILIO_PHONE_NUMBER,
      toNumber: prospect.phone,
      status: "queued",
      scheduledAt: new Date().toISOString(),
    })
    .returning();

  try {
    const client = getTwilioClient();
    const call = await client.calls.create({
      to: prospect.phone,
      from: env.TWILIO_PHONE_NUMBER,
      url: `${env.NEXT_PUBLIC_APP_URL}/api/audit/twiml`,
      statusCallback: `${env.NEXT_PUBLIC_APP_URL}/api/audit/status`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
      machineDetection: "Enable",
      timeout: 20,
    });

    await db
      .update(prospectAuditCalls)
      .set({ twilioCallSid: call.sid, status: "initiated" })
      .where(eq(prospectAuditCalls.id, auditCall.id));

    await db
      .update(prospects)
      .set({ status: "audit_scheduled", updatedAt: new Date().toISOString() })
      .where(eq(prospects.id, prospectId));

    await logActivity({
      type: "audit_call",
      entityType: "prospect",
      entityId: prospectId,
      title: `Audit call scheduled for ${prospect.businessName}`,
      detail: `Calling ${prospect.phone}`,
    });

    return { success: true, callId: auditCall.id };
  } catch (error) {
    await db
      .update(prospectAuditCalls)
      .set({ status: "failed" })
      .where(eq(prospectAuditCalls.id, auditCall.id));

    return {
      success: false,
      error: error instanceof Error ? error.message : "Call failed",
    };
  }
}

export async function handleAuditStatusCallback(params: {
  CallSid: string;
  CallStatus: string;
  CallDuration?: string;
  AnsweredBy?: string;
}) {
  const { CallSid, CallStatus, CallDuration, AnsweredBy } = params;

  const [auditCall] = await db
    .select()
    .from(prospectAuditCalls)
    .where(eq(prospectAuditCalls.twilioCallSid, CallSid));

  if (!auditCall) return;

  const updates: Partial<typeof prospectAuditCalls.$inferInsert> = {
    status: CallStatus,
  };

  if (CallDuration) updates.duration = parseInt(CallDuration, 10);
  if (AnsweredBy) updates.answeredBy = AnsweredBy;
  if (CallStatus === "completed" || CallStatus === "no-answer" || CallStatus === "busy" || CallStatus === "failed") {
    updates.completedAt = new Date().toISOString();
  }

  await db
    .update(prospectAuditCalls)
    .set(updates)
    .where(eq(prospectAuditCalls.id, auditCall.id));

  // Update prospect audit result on terminal statuses
  if (["completed", "no-answer", "busy", "failed"].includes(CallStatus)) {
    let auditResult: string;
    if (CallStatus === "completed" && AnsweredBy === "human") {
      auditResult = "answered";
    } else if (CallStatus === "completed" && AnsweredBy === "machine") {
      auditResult = "voicemail";
    } else if (CallStatus === "completed") {
      auditResult = "answered"; // default if machine detection not available
    } else if (CallStatus === "no-answer") {
      auditResult = "missed";
    } else {
      auditResult = "failed";
    }

    await db
      .update(prospects)
      .set({
        status: "audit_complete",
        auditResult,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(prospects.id, auditCall.prospectId));

    await logActivity({
      type: "audit_result",
      entityType: "prospect",
      entityId: auditCall.prospectId,
      title: `Audit call ${auditResult}`,
      detail: `Duration: ${CallDuration ?? 0}s, Answered by: ${AnsweredBy ?? "unknown"}`,
    });
  }
}
