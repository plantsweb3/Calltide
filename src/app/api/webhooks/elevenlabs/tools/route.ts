import { NextRequest } from "next/server";
import { dispatchToolCall } from "@/lib/hume/tool-handlers";
import { db } from "@/db";
import { calls } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError, reportWarning } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST /api/webhooks/elevenlabs/tools
 *
 * Single dispatcher endpoint for ElevenLabs server tool calls.
 * ElevenLabs calls this during conversations when the AI invokes a tool.
 * Dispatches to existing tool handlers — zero changes to business logic.
 */
export async function POST(req: NextRequest) {
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

  if (!apiKey || apiKey !== webhookSecret) {
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

  console.log(`[elevenlabs/tools] tool call: ${toolName} conversation=${conversationId}`);

  // Look up the call record by conversationId
  const [call] = await db
    .select()
    .from(calls)
    .where(eq(calls.elevenlabsConversationId, conversationId))
    .limit(1);

  if (!call) {
    // Extract business_id from parameters (injected as dynamic variable)
    const businessId = parameters?.business_id as string | undefined;
    if (!businessId) {
      reportWarning("ElevenLabs tool call: no call record and no business_id", {
        conversationId,
        toolName,
      });
      return Response.json({ error: "No active call found" });
    }

    // Call record may not exist yet if the conversation just started
    // Dispatch with minimal context
    const result = await dispatchToolCall(toolName, parameters, {
      businessId,
      language: "en",
    });

    return Response.json(result.data || { error: result.error });
  }

  // Dispatch to existing tool handler
  const result = await dispatchToolCall(toolName, parameters, {
    businessId: call.businessId,
    callId: call.id,
    leadId: call.leadId || undefined,
    callerPhone: call.callerPhone || undefined,
    language: (call.language as "en" | "es") || "en",
  });

  return Response.json(result.data || { error: result.error });
}
