import { NextRequest } from "next/server";
import twilio from "twilio";
import { db } from "@/db";
import { calls } from "@/db/schema";
import { eq } from "drizzle-orm";
import { reportError, reportWarning } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST /api/webhooks/twilio/transcription
 *
 * Twilio calls this webhook when voicemail transcription completes.
 * Updates the call record with the transcription text.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`twilio-transcription:${ip}`, RATE_LIMITS.webhook);
  if (!rl.success) return rateLimitResponse(rl);

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    reportWarning("TWILIO_AUTH_TOKEN not set — rejecting transcription webhook");
    return new Response("OK", { status: 200 });
  }

  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = String(value);
  }

  // Validate Twilio signature
  const signature = req.headers.get("x-twilio-signature") || "";
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/transcription`;
  const valid = twilio.validateRequest(authToken, signature, url, params);
  if (!valid) {
    reportWarning("Invalid Twilio signature on transcription webhook");
    return new Response("Forbidden", { status: 403 });
  }

  const transcriptionText = params.TranscriptionText || "";
  const callSid = params.CallSid || "";
  const transcriptionStatus = params.TranscriptionStatus || "";

  if (transcriptionStatus !== "completed" || !transcriptionText) {
    return new Response("OK", { status: 200 });
  }

  console.log(`[twilio/transcription] voicemail transcribed: callSid=${callSid}`);

  try {
    // Find the call by Twilio CallSid and update voicemailTranscript
    const [call] = await db
      .select({ id: calls.id })
      .from(calls)
      .where(eq(calls.twilioCallSid, callSid))
      .limit(1);

    if (!call) {
      reportWarning("Transcription webhook: no matching call record", { callSid });
      return new Response("OK", { status: 200 });
    }

    await db.update(calls).set({
      voicemailTranscript: transcriptionText,
      updatedAt: new Date().toISOString(),
    }).where(eq(calls.id, call.id));

    console.log(`[twilio/transcription] transcript saved for call ${call.id}`);
  } catch (err) {
    reportError("Voicemail transcription handler failed", err, { extra: { callSid } });
  }

  return new Response("OK", { status: 200 });
}
