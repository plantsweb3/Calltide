import { NextRequest } from "next/server";
import { verifyHumeSignature } from "@/lib/hume/webhook-verify";
import { dispatchToolCall } from "@/lib/hume/tool-handlers";
import { getBusinessByPhone, findOrCreateLead } from "@/lib/ai/context-builder";
import { db } from "@/db";
import { calls } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendSMS } from "@/lib/twilio/sms";
import type { HumeWebhookEvent, HumeChatStartedData, HumeChatEndedData, HumeToolCallData } from "@/types";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify HMAC signature
  const signature = req.headers.get("x-hume-signature") || "";
  const secretKey = process.env.HUME_SECRET_KEY!;

  if (secretKey && signature) {
    const valid = verifyHumeSignature(rawBody, signature, secretKey);
    if (!valid) {
      console.error("Invalid Hume webhook signature");
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: HumeWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log(`Hume webhook: ${event.type}`, { chatId: event.chat_id, chatGroupId: event.chat_group_id });

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
    console.error("Webhook handler error:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function handleChatStarted(event: HumeWebhookEvent) {
  const data = event.data as unknown as HumeChatStartedData;

  // Find business by the called phone number
  const calledPhone = data.called_phone;
  const callerPhone = data.caller_phone;

  let businessId = "test-business-001"; // fallback

  if (calledPhone) {
    const biz = await getBusinessByPhone(calledPhone);
    if (biz) businessId = biz.id;
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

  console.log("Call started:", { businessId, leadId, chatId: event.chat_id });
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

    // Notify owner that a call was handled
    const biz = await getBusinessByPhone(call.calledPhone || "");
    if (biz) {
      const duration = data.duration_seconds
        ? `${Math.round(data.duration_seconds / 60)}min`
        : "unknown duration";

      await sendSMS({
        to: biz.ownerPhone,
        from: biz.twilioNumber,
        body: `Call handled by AI assistant from ${call.callerPhone || "unknown"}. Duration: ${duration}. Check your dashboard for details.`,
        businessId: biz.id,
        callId: call.id,
        leadId: call.leadId || undefined,
        templateType: "owner_notify",
      });
    }
  }

  console.log("Call ended:", { chatId: event.chat_id });
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
    params = {};
  }

  const result = await dispatchToolCall(data.name, params, {
    businessId: call?.businessId || "test-business-001",
    callId: call?.id,
    leadId: call?.leadId || undefined,
    callerPhone: call?.callerPhone || undefined,
    language: (call?.language as "en" | "es") || "en",
  });

  // Return tool result for Hume to feed back to the conversation
  return Response.json({
    tool_call_id: data.tool_call_id,
    content: JSON.stringify(result.data || { error: result.error }),
  });
}
