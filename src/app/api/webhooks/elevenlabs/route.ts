import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { calls } from "@/db/schema";
import { eq } from "drizzle-orm";
import { processCallSummary } from "@/lib/ai/call-summary";
import { reportError, reportWarning } from "@/lib/error-reporting";
import { enqueueJob } from "@/lib/jobs/queue";
import { sendBasicCallNotification } from "@/lib/notifications/post-call";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { trackCallEnd } from "@/lib/monitoring/active-calls";

interface ElevenLabsTranscriptEntry {
  role: "agent" | "user";
  message: string;
  time_in_call_secs?: number;
}

interface ElevenLabsPostCallEvent {
  type: string;
  conversation_id: string;
  agent_id?: string;
  transcript?: ElevenLabsTranscriptEntry[];
  recording_url?: string;
  metadata?: {
    call_duration_secs?: number;
    cost?: number;
    latency_ms?: number;
  };
  analysis?: {
    summary?: string;
    evaluation_criteria_results?: Record<string, unknown>;
  };
  // Audio event fields
  audio_url?: string;
  // Call initiation failure fields
  error?: string;
  phone_number?: string;
}

/**
 * POST /api/webhooks/elevenlabs
 *
 * Post-call webhook handler. ElevenLabs fires this after each call
 * with conversation_id, transcript, analysis, and metadata.
 * Replaces /api/webhooks/hume for call completion handling.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`elevenlabs-webhook:${ip}`, RATE_LIMITS.webhook);
  if (!rl.success) return rateLimitResponse(rl);

  const rawBody = await req.text();

  // Verify signature — ElevenLabs signs webhooks with HMAC
  const signature = req.headers.get("elevenlabs-signature") || req.headers.get("x-elevenlabs-signature") || "";
  const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;

  if (!webhookSecret) {
    reportWarning("ELEVENLABS_WEBHOOK_SECRET not set — rejecting webhook");
    return Response.json({ error: "Webhook auth not configured" }, { status: 500 });
  }

  if (signature) {
    const expectedSig = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    try {
      const sigBuf = Buffer.from(signature, "hex");
      const expectedBuf = Buffer.from(expectedSig, "hex");
      if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
        reportWarning("Invalid ElevenLabs webhook signature");
        return Response.json({ error: "Invalid signature" }, { status: 401 });
      }
    } catch {
      reportWarning("ElevenLabs webhook signature verification error");
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: ElevenLabsPostCallEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log(`[elevenlabs] webhook: ${event.type} conversationId=${event.conversation_id}`);

  // ── Handle call initiation failures ──
  if (event.type === "call_initiation_failure") {
    reportError("ElevenLabs call initiation failure", new Error(event.error || "Unknown"), {
      extra: { conversationId: event.conversation_id, phone: event.phone_number },
    });
    return Response.json({ ok: true });
  }

  // ── Handle audio webhook — store recording URL on existing call ──
  if (event.type === "post_call_audio") {
    if (event.audio_url) {
      const [audioCall] = await db
        .select({ id: calls.id })
        .from(calls)
        .where(eq(calls.elevenlabsConversationId, event.conversation_id))
        .limit(1);
      if (audioCall) {
        await db.update(calls).set({ recordingUrl: event.audio_url }).where(eq(calls.id, audioCall.id));
        console.log(`[elevenlabs] audio stored for call ${audioCall.id}`);
      }
    }
    return Response.json({ ok: true });
  }

  if (event.type !== "post_call_transcription") {
    return Response.json({ ok: true });
  }

  const { conversation_id: conversationId, transcript: rawTranscript, metadata } = event;
  const durationSeconds = metadata?.call_duration_secs ?? 0;

  // Find call record by conversationId, or by matching in_progress calls for this agent
  let [call] = await db
    .select()
    .from(calls)
    .where(eq(calls.elevenlabsConversationId, conversationId))
    .limit(1);

  // If not found by conversationId, try to match by twilioCallSid or recent in_progress call
  if (!call) {
    // Try to find the most recent in_progress call for this agent's business
    // Update it with the conversationId
    const [recentCall] = await db
      .select()
      .from(calls)
      .where(eq(calls.status, "in_progress"))
      .limit(1);

    if (recentCall) {
      await db.update(calls).set({
        elevenlabsConversationId: conversationId,
      }).where(eq(calls.id, recentCall.id));
      call = { ...recentCall, elevenlabsConversationId: conversationId };
    }
  }

  if (!call) {
    reportWarning("ElevenLabs post-call webhook: no matching call record", {
      conversationId,
    });
    return Response.json({ ok: true });
  }

  // Convert ElevenLabs transcript format to our format
  const transcript = (rawTranscript || []).map((entry) => ({
    speaker: (entry.role === "agent" ? "ai" : "caller") as "ai" | "caller",
    text: entry.message,
  }));

  // Update call record
  await db.update(calls).set({
    status: "completed",
    duration: durationSeconds,
    elevenlabsConversationId: conversationId,
    transcript,
    recordingUrl: event.recording_url || null,
    costCents: metadata?.cost ? Math.round(metadata.cost * 100) : null,
    latencyMs: metadata?.latency_ms ?? null,
    updatedAt: new Date().toISOString(),
  }).where(eq(calls.id, call.id));

  // Generate AI summary from transcript (fire-and-forget, with retry on failure)
  processCallSummary(call.id, conversationId, transcript).catch(async (err) => {
    reportError("Background call summary failed", err, {
      extra: { callId: call.id, conversationId },
    });
    // Fallback: send basic notification so owner knows about the call
    sendBasicCallNotification(call.id, call.callerPhone, durationSeconds).catch(() => {});
    await enqueueJob("call_summary", { callId: call.id, conversationId }).catch(() => {});
  });

  // Remove from active calls (fire-and-forget)
  trackCallEnd({ sessionId: call.twilioCallSid || conversationId }).catch((err) =>
    reportError("Active call cleanup failed", err),
  );

  console.log(`[elevenlabs] call completed: conversationId=${conversationId} callId=${call.id}`);

  return Response.json({ ok: true });
}
