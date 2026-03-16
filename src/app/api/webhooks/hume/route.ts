import { NextRequest } from "next/server";
import { verifyHumeSignature } from "@/lib/hume/webhook-verify";
import { dispatchToolCall } from "@/lib/hume/tool-handlers";
import { getBusinessByPhone, findOrCreateLead } from "@/lib/ai/context-builder";
import { db } from "@/db";
import { calls } from "@/db/schema";
import { eq } from "drizzle-orm";
import { processCallSummary } from "@/lib/ai/call-summary";
import type { HumeWebhookEvent, HumeChatStartedData, HumeChatEndedData, HumeToolCallData } from "@/types";
import { reportError, reportWarning } from "@/lib/error-reporting";
import { enqueueJob } from "@/lib/jobs/queue";
import { sendBasicCallNotification } from "@/lib/notifications/post-call";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { trackCallStart, trackCallEnd, updateActiveCall } from "@/lib/monitoring/active-calls";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`hume-webhook:${ip}`, RATE_LIMITS.webhook);
  if (!rl.success) return rateLimitResponse(rl);

  const rawBody = await req.text();

  // Verify HMAC signature — mandatory
  const signature = req.headers.get("x-hume-signature") || "";
  const secretKey = process.env.HUME_SECRET_KEY;

  if (!secretKey) {
    reportWarning("HUME_SECRET_KEY is not set — rejecting webhook");
    return Response.json({ error: "Webhook auth not configured" }, { status: 500 });
  }

  if (!signature || !verifyHumeSignature(rawBody, signature, secretKey)) {
    reportWarning("Invalid Hume webhook signature");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: HumeWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Log event type without PII
  console.log(`[hume] webhook: ${event.type} chatId=${event.chat_id}`);

  try {
    switch (event.type) {
      case "chat_started":
        await handleChatStarted(event);
        break;
      case "chat_ended":
        await handleChatEnded(event);
        break;
      case "tool_call":
        return await handleToolCall(event);
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ ok: true });
  } catch (error) {
    reportError("Webhook handler error", error, {
      extra: { eventType: event.type, chatId: event.chat_id, chatGroupId: event.chat_group_id },
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function handleChatStarted(event: HumeWebhookEvent) {
  const data = event.data as unknown as HumeChatStartedData;

  const calledPhone = data.called_phone;
  const callerPhone = data.caller_phone;

  // Find business by the called phone number — reject if unknown
  let businessId: string | undefined;

  if (calledPhone) {
    const biz = await getBusinessByPhone(calledPhone);
    if (biz) businessId = biz.id;
  }

  if (!businessId) {
    reportWarning("Unmatched incoming call — no business found", {
      chatId: event.chat_id,
    });
    // Do NOT create any DB records for unknown callers
    return;
  }

  // Find or create lead
  let leadId: string | undefined;
  if (callerPhone) {
    const lead = await findOrCreateLead(businessId, callerPhone);
    leadId = lead.id;
  }

  // Create call record
  await db.insert(calls).values({
    businessId,
    leadId,
    humeChitChatId: event.chat_id,
    humeChatGroupId: event.chat_group_id,
    direction: "inbound",
    callerPhone,
    calledPhone,
    status: "in_progress",
  });

  // Track active call for live monitoring (fire-and-forget)
  trackCallStart({
    businessId,
    callerPhone: callerPhone || "unknown",
    direction: "inbound",
    humeSessionId: event.chat_id,
  }).catch((err) => reportError("Active call tracking failed", err, { businessId }));

  console.log(`[hume] call started: chatId=${event.chat_id} businessId=${businessId}`);
}

async function handleChatEnded(event: HumeWebhookEvent) {
  const data = event.data as unknown as HumeChatEndedData;

  // Update call record
  const [call] = await db
    .select()
    .from(calls)
    .where(eq(calls.humeChitChatId, event.chat_id))
    .limit(1);

  if (call) {
    await db.update(calls).set({
      status: "completed",
      duration: data.duration_seconds,
      updatedAt: new Date().toISOString(),
    }).where(eq(calls.id, call.id));

    // Generate AI summary from transcript (fire-and-forget, with retry on failure)
    // Rich notifications are sent from processCallSummary when it succeeds.
    // If it fails, we send a basic fallback notification so the owner is never left in the dark.
    processCallSummary(call.id, event.chat_id).catch(async (err) => {
      reportError("Background call summary failed", err, {
        extra: { callId: call.id, chatId: event.chat_id },
      });
      // Fallback: send basic notification so owner knows about the call
      sendBasicCallNotification(call.id, call.callerPhone, data.duration_seconds).catch(() => {});
      await enqueueJob("call_summary", { callId: call.id, chatId: event.chat_id }).catch(() => {});
    });
  }

  // Remove from active calls (fire-and-forget)
  trackCallEnd({ humeSessionId: event.chat_id }).catch((err) =>
    reportError("Active call cleanup failed", err),
  );

  console.log(`[hume] call ended: chatId=${event.chat_id}`);
}

async function handleToolCall(event: HumeWebhookEvent) {
  const data = event.data as unknown as HumeToolCallData;

  // Find the call record to get context
  const [call] = await db
    .select()
    .from(calls)
    .where(eq(calls.humeChitChatId, event.chat_id))
    .limit(1);

  let params: Record<string, unknown>;
  try {
    params = JSON.parse(data.parameters);
  } catch {
    reportWarning("Hume tool call: invalid JSON parameters", {
      toolName: data.name,
      chatId: event.chat_id,
      rawLength: data.parameters?.length ?? 0,
      rawPreview: data.parameters?.slice(0, 200) ?? "",
    });
    return Response.json({
      tool_call_id: data.tool_call_id,
      content: JSON.stringify({ error: "Invalid parameters" }),
    });
  }

  if (!call) {
    console.warn("Tool call for unknown chat — no call record found", {
      chatId: event.chat_id,
      toolName: data.name,
    });
    return Response.json({
      tool_call_id: data.tool_call_id,
      content: JSON.stringify({ error: "No active call found" }),
    });
  }

  const result = await dispatchToolCall(data.name, params, {
    businessId: call.businessId,
    callId: call.id,
    leadId: call.leadId || undefined,
    callerPhone: call.callerPhone || undefined,
    language: (call.language as "en" | "es") || "en",
  });

  // Return tool result for Hume to feed back to the conversation
  return Response.json({
    tool_call_id: data.tool_call_id,
    content: JSON.stringify(result.data || { error: result.error }),
  });
}
