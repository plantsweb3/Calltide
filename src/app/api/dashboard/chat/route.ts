import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chat, getChatHistory, getAutoGreeting } from "@/lib/maria/chat-engine";
import { getBusinessById } from "@/lib/ai/context-builder";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";

const SendSchema = z.object({
  message: z.string().min(1).max(2000),
});

/**
 * GET /api/dashboard/chat — Load chat history
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const messages = await getChatHistory(businessId, "dashboard");
    const biz = await getBusinessById(businessId);
    const greeting = biz
      ? getAutoGreeting(biz.ownerName, biz.receptionistName || "Maria", biz.timezone)
      : "Hi! How can I help you today?";

    return NextResponse.json({
      messages,
      greeting,
      receptionistName: biz?.receptionistName || "Maria",
    });
  } catch (err) {
    reportError("Chat history load failed", err, { extra: { businessId } });
    return NextResponse.json({ error: "Failed to load chat" }, { status: 500 });
  }
}

/**
 * POST /api/dashboard/chat — Send a message to Maria
 */
export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check Anthropic API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      reply: "I'm not available right now — the AI service isn't configured. Please contact support.",
      tokenCount: 0,
      toolsUsed: [],
    });
  }

  // Rate limit: 20 messages per minute per business
  const rl = await rateLimit(`chat:${businessId}`, { limit: 20, windowSeconds: 60 });
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body = await req.json();
    const parsed = SendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const result = await chat(businessId, parsed.data.message, "dashboard");

    return NextResponse.json({
      reply: result.reply,
      tokenCount: result.tokenCount,
      toolsUsed: result.toolsUsed,
    });
  } catch (err) {
    reportError("Chat message failed", err, { extra: { businessId } });

    // Check if it's an API key issue
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("API key") || errMsg.includes("authentication")) {
      return NextResponse.json({
        reply: "I'm having trouble connecting right now. Please try again in a moment.",
        tokenCount: 0,
        toolsUsed: [],
      });
    }

    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}
