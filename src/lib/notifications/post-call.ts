import { db } from "@/db";
import { businesses, calls } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendSMS } from "@/lib/twilio/sms";
import { env } from "@/lib/env";
import { reportError } from "@/lib/error-reporting";

/**
 * Send a rich owner SMS after call summary is generated.
 * Replaces the generic "Call handled" message with outcome-specific context.
 */
export async function sendOwnerCallAlert(callId: string): Promise<void> {
  const [call] = await db.select().from(calls).where(eq(calls.id, callId)).limit(1);
  if (!call) return;

  const [biz] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, call.businessId))
    .limit(1);
  if (!biz || !biz.ownerPhone) return;

  // Respect quiet hours — don't text owner between 9 PM and 7 AM local time
  if (biz.timezone) {
    const localHour = parseInt(
      new Date().toLocaleTimeString("en-US", { hour: "2-digit", hour12: false, timeZone: biz.timezone }),
      10,
    );
    if (localHour >= 21 || localHour < 7) return;
  }

  const receptionistName = biz.receptionistName || "Maria";
  const callerDisplay = call.callerPhone || "unknown number";
  const outcome = call.outcome || "unknown";
  const summary = call.summary || "";
  const duration = call.duration ? `${Math.ceil(call.duration / 60)}min` : "";

  let message: string;

  switch (outcome) {
    case "appointment_booked":
      message = `${receptionistName} just booked an appointment! Caller: ${callerDisplay}. ${summary}${duration ? ` (${duration})` : ""}`;
      break;
    case "estimate_requested":
      message = `${receptionistName} took an estimate request from ${callerDisplay}. ${summary}${duration ? ` (${duration})` : ""}`;
      break;
    case "message_taken":
      message = `${receptionistName} took a message from ${callerDisplay}. ${summary}${duration ? ` (${duration})` : ""}`;
      break;
    case "transfer":
      message = `${receptionistName} transferred a call from ${callerDisplay} — they requested to speak with you. ${summary}`;
      break;
    case "info_only":
      message = `${receptionistName} answered an info call from ${callerDisplay}. ${summary}${duration ? ` (${duration})` : ""}`;
      break;
    case "spam":
      // Don't bother the owner with spam
      return;
    default:
      message = `${receptionistName} handled a call from ${callerDisplay}. ${summary}${duration ? ` (${duration})` : ""}`;
  }

  // Truncate to SMS-safe length (160 chars ideal, 320 max for multi-part)
  if (message.length > 300) {
    message = message.slice(0, 297) + "...";
  }

  message += " — Calltide";

  try {
    await sendSMS({
      to: biz.ownerPhone,
      from: biz.twilioNumber || env.TWILIO_PHONE_NUMBER,
      body: message,
      businessId: biz.id,
      callId,
      templateType: "owner_notify",
    });
  } catch (err) {
    reportError("[post-call] Owner alert SMS failed", err, { businessId: biz.id });
  }
}

/**
 * Send an instant text-back to the caller when a call appears to be missed or very short.
 * "Missed" = call duration < 15 seconds or status indicates no real conversation happened.
 */
export async function sendMissedCallTextBack(callId: string): Promise<void> {
  const [call] = await db.select().from(calls).where(eq(calls.id, callId)).limit(1);
  if (!call) return;

  // Only text back missed/short calls — not completed conversations
  const isMissed =
    call.outcome === "unknown" &&
    (call.duration === null || call.duration < 15);

  if (!isMissed) return;

  // Need caller phone to text back
  if (!call.callerPhone) return;

  const [biz] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, call.businessId))
    .limit(1);
  if (!biz) return;

  // Check business has the missed call recovery feature enabled
  if (biz.enableMissedCallRecovery === false) return;

  const bizName = biz.name;
  const fromNumber = biz.twilioNumber || env.TWILIO_PHONE_NUMBER;

  const body = `Hi, this is ${bizName}. Sorry we missed your call — we're on a job right now. Can we call you back in the next 30 minutes? Reply YES to confirm. — Calltide`;

  try {
    await sendSMS({
      to: call.callerPhone,
      from: fromNumber,
      body,
      businessId: biz.id,
      callId,
      leadId: call.leadId || undefined,
      templateType: "missed_call_recovery",
    });
  } catch (err) {
    reportError("[post-call] Missed call text-back failed", err, { businessId: biz.id });
  }
}
