import { NextRequest } from "next/server";
import twilio from "twilio";
import { db } from "@/db";
import { calls, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendSMS } from "@/lib/twilio/sms";
import { reportError, reportWarning } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST /api/webhooks/twilio/recording
 *
 * Twilio calls this when a voicemail recording is ready.
 * Saves the recording URL and transcription, then notifies the business owner.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`twilio-recording:${ip}`, RATE_LIMITS.webhook);
  if (!rl.success) return rateLimitResponse(rl);

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    reportWarning("TWILIO_AUTH_TOKEN not set — rejecting recording webhook");
    return new Response("OK", { status: 200 });
  }

  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = String(value);
  }

  // Validate Twilio signature
  const signature = req.headers.get("x-twilio-signature") || "";
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/recording`;
  const valid = twilio.validateRequest(authToken, signature, url, params);
  if (!valid) {
    reportWarning("Invalid Twilio signature on recording webhook");
    return new Response("Forbidden", { status: 403 });
  }

  const recordingUrl = params.RecordingUrl;
  const callSid = params.CallSid;
  const recordingStatus = params.RecordingStatus;
  const recordingDuration = parseInt(params.RecordingDuration || "0", 10);

  if (recordingStatus !== "completed" || !recordingUrl) {
    return new Response("OK", { status: 200 });
  }

  // Skip very short recordings (likely silence)
  if (recordingDuration < 3) {
    return new Response("OK", { status: 200 });
  }

  console.log(`[twilio/recording] voicemail ready: callSid=${callSid} duration=${recordingDuration}s`);

  try {
    // Try to find a call record for this voicemail by the Twilio CallSid
    // Since voicemails happen when Hume is down, we may not have a call record.
    // Look up the business by the called number from the original call.
    const calledNumber = params.To || "";
    const callerPhone = params.From || "";

    let businessId: string | undefined;
    let bizPhone: string | undefined;
    let bizOwnerPhone: string | undefined;
    let bizName: string | undefined;

    if (calledNumber) {
      const [biz] = await db
        .select({
          id: businesses.id,
          twilioNumber: businesses.twilioNumber,
          ownerPhone: businesses.ownerPhone,
          name: businesses.name,
        })
        .from(businesses)
        .where(and(eq(businesses.twilioNumber, calledNumber), eq(businesses.active, true)))
        .limit(1);

      if (biz) {
        businessId = biz.id;
        bizPhone = biz.twilioNumber;
        bizOwnerPhone = biz.ownerPhone;
        bizName = biz.name;
      }
    }

    if (!businessId || !bizOwnerPhone) {
      reportWarning("Voicemail recording for unknown business", { callSid, calledNumber });
      return new Response("OK", { status: 200 });
    }

    // Create a call record for the voicemail if one doesn't exist
    const existingCalls = await db
      .select({ id: calls.id })
      .from(calls)
      .where(eq(calls.twilioCallSid, callSid))
      .limit(1);

    let callId: string;
    if (existingCalls.length > 0) {
      callId = existingCalls[0].id;
      await db.update(calls).set({
        recordingUrl: `${recordingUrl}.mp3`,
        duration: recordingDuration,
        status: "voicemail",
        updatedAt: new Date().toISOString(),
      }).where(eq(calls.id, callId));
    } else {
      const [newCall] = await db.insert(calls).values({
        businessId,
        callerPhone: callerPhone || null,
        calledPhone: calledNumber,
        direction: "inbound",
        status: "voicemail",
        duration: recordingDuration,
        recordingUrl: `${recordingUrl}.mp3`,
        twilioCallSid: callSid,
        summary: "Voicemail — Hume was unavailable. Recording saved.",
        outcome: "message_taken",
      }).returning();
      callId = newCall.id;
    }

    // Transcription would require Twilio add-on — for now, direct owner to dashboard to listen

    // Notify business owner
    const callerDisplay = callerPhone || "unknown number";
    const durationStr = recordingDuration > 60
      ? `${Math.floor(recordingDuration / 60)}m ${recordingDuration % 60}s`
      : `${recordingDuration}s`;

    const smsBody = `Voicemail from ${callerDisplay} (${durationStr}). Check your dashboard to listen. — Capta`;

    await sendSMS({
      to: bizOwnerPhone,
      from: bizPhone || process.env.TWILIO_PHONE_NUMBER || "",
      body: smsBody,
      businessId,
      callId,
      templateType: "owner_notify",
    });
  } catch (err) {
    reportError("Voicemail recording handler failed", err, { extra: { callSid } });
  }

  return new Response("OK", { status: 200 });
}
