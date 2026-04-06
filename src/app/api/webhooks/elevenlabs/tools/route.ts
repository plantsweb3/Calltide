import { NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { dispatchToolCall } from "@/lib/voice/tool-handlers";
import { db } from "@/db";
import { calls } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError, reportWarning } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

// ── Idempotency cache ──
// Prevents ElevenLabs retries from causing double bookings, double SMS, etc.
const idempotencyCache = new Map<string, { result: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour — prevents double-bookings from late retries
const MAX_CACHE_SIZE = 1000;

function cleanupIdempotencyCache() {
  const now = Date.now();
  for (const [key, entry] of idempotencyCache) {
    if (now - entry.timestamp > CACHE_TTL) idempotencyCache.delete(key);
  }
  // LRU eviction if still too large
  if (idempotencyCache.size > MAX_CACHE_SIZE) {
    const entries = [...idempotencyCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, idempotencyCache.size - MAX_CACHE_SIZE);
    for (const [key] of toDelete) idempotencyCache.delete(key);
  }
}

function buildIdempotencyKey(conversationId: string, toolName: string, params: Record<string, unknown>): string {
  const raw = `${conversationId}:${toolName}:${JSON.stringify(params)}`;
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * POST /api/webhooks/elevenlabs/tools
 *
 * Single dispatcher endpoint for ElevenLabs server tool calls.
 * ElevenLabs calls this during conversations when the AI invokes a tool.
 * Dispatches to existing tool handlers — zero changes to business logic.
 */
export async function POST(req: NextRequest) {
  const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
  if (contentLength > 1_000_000) {
    return Response.json({ error: "Payload too large" }, { status: 413 });
  }

  const ip = getClientIp(req);
  const rl = await rateLimit(`elevenlabs-tools:${ip}`, RATE_LIMITS.webhook);
  if (!rl.success) return rateLimitResponse(rl);

  // Verify auth — ElevenLabs sends our webhook secret as x-api-key header
  const apiKey = req.headers.get("x-elevenlabs-api-key") || req.headers.get("x-api-key");
  const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;

  if (!webhookSecret) {
    reportWarning("ELEVENLABS_WEBHOOK_SECRET not set — rejecting tool webhook");
    return Response.json({ error: "Webhook auth not configured" }, { status: 500 });
  }

  if (!apiKey) {
    reportWarning("Invalid ElevenLabs tool webhook auth — missing API key");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use fixed-length buffers for timing-safe comparison (prevents length oracle)
  const apiKeyHash = createHash("sha256").update(apiKey).digest();
  const secretHash = createHash("sha256").update(webhookSecret).digest();
  if (!timingSafeEqual(apiKeyHash, secretHash)) {
    reportWarning("Invalid ElevenLabs tool webhook auth");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    tool_name: string;
    parameters: Record<string, unknown>;
    conversation_id: string;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tool_name: toolName, parameters, conversation_id: conversationId } = body;

  if (!toolName || !conversationId) {
    return Response.json({ error: "Missing tool_name or conversation_id" }, { status: 400 });
  }

  reportWarning("[elevenlabs/tools] tool call", { toolName, conversationId });

  // ── Idempotency check ──
  // Periodic cleanup of expired entries
  cleanupIdempotencyCache();

  const idempotencyKey = buildIdempotencyKey(conversationId, toolName, parameters);
  const cached = idempotencyCache.get(idempotencyKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    reportWarning("[elevenlabs/tools] idempotent hit — returning cached result", { toolName });
    return Response.json(cached.result);
  }

  // Extract business_id from parameters (injected as dynamic variable by ElevenLabs agent config)
  const businessIdParam = parameters?.business_id as string | undefined;

  // Look up the call record by conversationId
  let [call] = await db
    .select()
    .from(calls)
    .where(eq(calls.elevenlabsConversationId, conversationId))
    .limit(1);

  // Validate business ownership if both call and businessId are available
  if (call && businessIdParam && call.businessId !== businessIdParam) {
    reportWarning("ElevenLabs tool webhook: businessId mismatch", {
      conversationId,
      callBusinessId: call.businessId,
      paramBusinessId: businessIdParam,
    });
    return Response.json({ error: "Business mismatch" }, { status: 403 });
  }

  // If not found by conversationId, try matching by call_id from stream parameters
  if (!call) {
    const callId = parameters?.call_id as string | undefined;
    if (callId) {
      const [byCallId] = await db
        .select()
        .from(calls)
        .where(
          businessIdParam
            ? and(eq(calls.id, callId), eq(calls.businessId, businessIdParam))
            : eq(calls.id, callId)
        )
        .limit(1);
      if (byCallId) {
        // Link this conversationId to the call for the post-call webhook to find
        await db.update(calls)
          .set({ elevenlabsConversationId: conversationId })
          .where(eq(calls.id, byCallId.id));
        call = { ...byCallId, elevenlabsConversationId: conversationId };
      }
    }
  }

  if (!call) {
    if (!businessIdParam) {
      reportWarning("ElevenLabs tool call: no call record and no business_id", {
        conversationId,
        toolName,
      });
      return Response.json({ error: "No active call found" });
    }

    // Call record may not exist yet if the conversation just started
    // Dispatch with minimal context
    const result = await dispatchToolCall(toolName, parameters, {
      businessId: businessIdParam,
      language: "en",
    });

    const responseData = result.data || { error: result.error };
    // Cache successful results for idempotency
    if (result.success) {
      idempotencyCache.set(idempotencyKey, {
        result: responseData,
        timestamp: Date.now(),
      });
    }

    return Response.json(responseData);
  }

  // Dispatch to existing tool handler
  const result = await dispatchToolCall(toolName, parameters, {
    businessId: call.businessId,
    callId: call.id,
    leadId: call.leadId || undefined,
    callerPhone: call.callerPhone || undefined,
    language: (call.language as "en" | "es") || "en",
  });

  const responseData = result.data || { error: result.error };
  // Cache successful results for idempotency
  if (result.success) {
    idempotencyCache.set(idempotencyKey, {
      result: responseData,
      timestamp: Date.now(),
    });
  }

  return Response.json(responseData);
}
