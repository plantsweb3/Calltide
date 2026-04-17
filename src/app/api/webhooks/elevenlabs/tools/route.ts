import { NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { z } from "zod";
import { dispatchToolCall } from "@/lib/voice/tool-handlers";
import { db } from "@/db";
import { calls, voiceToolIdempotency } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { reportError, reportWarning } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const toolCallSchema = z.object({
  tool_name: z.string().min(1).max(100),
  parameters: z.record(z.string(), z.unknown()).default({}),
  conversation_id: z.string().min(1).max(200),
});

// Durable idempotency via voice_tool_idempotency — safe across Vercel instances.
const IDEMPOTENCY_TTL_MS = 60 * 60 * 1000; // 1 hour
const CLAIM_POLL_ATTEMPTS = 10;
const CLAIM_POLL_INTERVAL_MS = 300;

function buildIdempotencyKey(conversationId: string, toolName: string, params: Record<string, unknown>): string {
  const raw = `${conversationId}:${toolName}:${JSON.stringify(params)}`;
  return createHash("sha256").update(raw).digest("hex");
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = toolCallSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json({ error: "Invalid tool call payload" }, { status: 400 });
  }
  const { tool_name: toolName, parameters, conversation_id: conversationId } = parsed.data;

  reportWarning("[elevenlabs/tools] tool call", { toolName, conversationId });

  // ── Idempotency check (DB-backed, cross-instance safe) ──
  const idempotencyKey = buildIdempotencyKey(conversationId, toolName, parameters);
  const ttlCutoff = new Date(Date.now() - IDEMPOTENCY_TTL_MS).toISOString();

  // Short-circuit on an already-completed key (handles duplicates after the
  // first instance has finished executing the tool).
  {
    const [existing] = await db
      .select()
      .from(voiceToolIdempotency)
      .where(eq(voiceToolIdempotency.key, idempotencyKey))
      .limit(1);
    if (existing && existing.createdAt > ttlCutoff && existing.status === "completed" && existing.result) {
      reportWarning("[elevenlabs/tools] idempotent hit — returning cached result", { toolName });
      return Response.json(JSON.parse(existing.result));
    }
  }

  // Atomic claim: try to insert with status='pending'. If another instance already
  // claimed, we lost the race — poll briefly for its result.
  const claim = await db
    .insert(voiceToolIdempotency)
    .values({ key: idempotencyKey, status: "pending" })
    .onConflictDoNothing()
    .returning({ key: voiceToolIdempotency.key });

  if (claim.length === 0) {
    // Another instance is executing this tool call. Poll for its result.
    for (let i = 0; i < CLAIM_POLL_ATTEMPTS; i++) {
      await sleep(CLAIM_POLL_INTERVAL_MS);
      const [row] = await db
        .select()
        .from(voiceToolIdempotency)
        .where(eq(voiceToolIdempotency.key, idempotencyKey))
        .limit(1);
      if (row?.status === "completed" && row.result) {
        return Response.json(JSON.parse(row.result));
      }
    }
    reportWarning("[elevenlabs/tools] concurrent tool call did not complete in time", { toolName });
    return Response.json({ error: "Tool call in progress" }, { status: 409 });
  }

  const finalizeIdempotency = async (responseData: unknown) => {
    try {
      await db
        .update(voiceToolIdempotency)
        .set({ status: "completed", result: JSON.stringify(responseData) })
        .where(eq(voiceToolIdempotency.key, idempotencyKey));
    } catch (err) {
      reportError("Failed to finalize voice tool idempotency", err, { extra: { toolName, conversationId } });
    }
  };

  // Best-effort cleanup of old entries — fire-and-forget.
  db.delete(voiceToolIdempotency)
    .where(sql`${voiceToolIdempotency.createdAt} < ${ttlCutoff}`)
    .catch(() => {});

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
    await finalizeIdempotency(responseData);
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
  await finalizeIdempotency(responseData);
  return Response.json(responseData);
}
