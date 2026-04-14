import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { businesses, calls } from "@/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
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
 * Handles call completion processing.
 */
export async function POST(req: NextRequest) {
  const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
  if (contentLength > 1_000_000) {
    return Response.json({ error: "Payload too large" }, { status: 413 });
  }

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

  if (!signature) {
    reportWarning("ElevenLabs webhook missing signature header");
    return Response.json({ error: "Missing signature" }, { status: 401 });
  }

  // ElevenLabs sends signatures in "t=<unix_ts>,v0=<hex_hmac>" format.
  // The signed payload is "<timestamp>.<raw_body>".
  try {
    let sigHex: string;
    let signedPayload: string;

    if (signature.includes(",") && signature.includes("=")) {
      // Parse structured format: t=TIMESTAMP,v0=SIGNATURE
      const parts = Object.fromEntries(
        signature.split(",").map((p) => {
          const idx = p.indexOf("=");
          return [p.slice(0, idx), p.slice(idx + 1)];
        }),
      );
      const timestamp = parts["t"];
      sigHex = parts["v0"] || parts["v1"] || "";
      if (!timestamp || !sigHex) {
        reportWarning("ElevenLabs webhook signature missing t or v0", { signature: signature.slice(0, 30) });
        return Response.json({ error: "Invalid signature format" }, { status: 401 });
      }
      // Replay protection: reject signatures older than 5 minutes
      const age = Math.abs(Date.now() / 1000 - Number(timestamp));
      if (age > 300) {
        reportWarning("ElevenLabs webhook signature timestamp expired", { age });
        return Response.json({ error: "Signature expired" }, { status: 401 });
      }
      signedPayload = `${timestamp}.${rawBody}`;
    } else {
      // Fallback: plain hex signature, sign just the body
      sigHex = signature;
      signedPayload = rawBody;
    }

    const expectedSig = createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");
    const sigBuf = Buffer.from(sigHex, "hex");
    const expectedBuf = Buffer.from(expectedSig, "hex");
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      reportWarning("Invalid ElevenLabs webhook signature", { format: signature.includes(",") ? "structured" : "plain" });
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch (err) {
    reportWarning("ElevenLabs webhook signature verification error", {
      signaturePrefix: signature.slice(0, 30),
      error: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: ElevenLabsPostCallEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  reportWarning("[elevenlabs] webhook received", { type: event.type, conversationId: event.conversation_id });

  // ── Handle call initiation failures ──
  if (event.type === "call_initiation_failure") {
    reportError("ElevenLabs call initiation failure", new Error(event.error || "Unknown"), {
      extra: { conversationId: event.conversation_id, phoneLast4: event.phone_number?.slice(-4) },
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
        reportWarning("[elevenlabs] audio stored", { callId: audioCall.id });
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

  // Fallback: look up by agent_id + most recent in_progress call (with time guard to reduce race risk)
  if (!call && event.agent_id) {
    const [biz] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.elevenlabsAgentId, event.agent_id))
      .limit(1);

    if (biz) {
      // Only match calls created in the last 30 minutes to avoid grabbing stale zombies
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const [recentCall] = await db
        .select()
        .from(calls)
        .where(and(
          eq(calls.businessId, biz.id),
          eq(calls.status, "in_progress"),
          gte(calls.createdAt, thirtyMinAgo),
        ))
        .orderBy(desc(calls.createdAt))
        .limit(1);

      if (recentCall) {
        // Atomic claim: only update if status is still in_progress (prevents two webhooks matching the same record)
        const updated = await db.update(calls).set({
          elevenlabsConversationId: conversationId,
        }).where(and(
          eq(calls.id, recentCall.id),
          eq(calls.status, "in_progress"),
        )).returning({ id: calls.id });

        if (updated.length > 0) {
          call = { ...recentCall, elevenlabsConversationId: conversationId };
        }
      }
    }
  }

  if (!call) {
    reportWarning("ElevenLabs post-call webhook: no matching call record", {
      conversationId,
    });
    return Response.json({ error: "Call record not found, will retry" }, { status: 500 });
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

  // Detect call language from transcript for bilingual summary support
  const detectedLanguage = (() => {
    const callerLines = transcript.filter((l) => l.speaker === "caller").map((l) => l.text.toLowerCase());
    if (callerLines.length < 2) return undefined;
    const spanishIndicators = [
      "hola", "gracias", "por favor", "necesito", "quiero", "tengo", "puede",
      "cita", "ayuda", "problema", "emergencia", "buenos días", "buenas tardes",
      "sí", "no puedo", "dónde", "cuándo", "cuánto", "servicio",
    ];
    let spanishCount = 0;
    for (const line of callerLines) {
      if (spanishIndicators.some((ind) => line.includes(ind))) spanishCount++;
    }
    const ratio = spanishCount / callerLines.length;
    return ratio >= 0.5 ? "es" as const : "en" as const;
  })();

  // Generate AI summary from transcript (fire-and-forget, with retry on failure)
  processCallSummary(call.id, conversationId, transcript, detectedLanguage).catch(async (err) => {
    reportError("Background call summary failed", err, {
      extra: { callId: call.id, conversationId },
    });
    // Fallback: send basic notification so owner knows about the call
    sendBasicCallNotification(call.id, call.callerPhone, durationSeconds).catch(() => {});
    await enqueueJob("call_summary", { callId: call.id, chatId: conversationId }).catch(() => {});
  });

  // Remove from active calls (fire-and-forget)
  trackCallEnd({ sessionId: call.twilioCallSid || conversationId }).catch((err) =>
    reportError("Active call cleanup failed", err),
  );

  reportWarning("[elevenlabs] call completed", { conversationId, callId: call.id });

  return Response.json({ ok: true });
}
