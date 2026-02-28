import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getBusinessByPhone, detectLanguage } from "@/lib/ai/context-builder";
import { buildSystemPrompt } from "@/lib/ai/system-prompts";
import { detectEmergency } from "@/lib/emergency";
import { db } from "@/db";
import { calls } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ChatCompletionRequest, SSEChunk, BusinessContext, Language } from "@/types";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5-20250929";
const MAX_MESSAGES = 50; // Cap conversation history to prevent unbounded input
const MAX_MESSAGE_LENGTH = 2000; // Cap individual message content length

function getAllowedOrigin(req: NextRequest): string {
  const origin = req.headers.get("origin") || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  // Allow requests from our own app and from Hume's servers (no origin header on server-to-server)
  if (!origin || origin === appUrl || origin.endsWith(".hume.ai")) {
    return origin || appUrl;
  }
  return appUrl;
}

function getCorsHeaders(req: NextRequest) {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 200, headers: getCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
  return Response.json({ status: "ok" }, { headers: getCorsHeaders(req) });
}

/**
 * CLM (Custom Language Model) endpoint for Hume EVI.
 * Receives OpenAI-compatible chat completion requests from Hume,
 * enriches with business context, calls Claude, and streams back
 * as OpenAI-compatible SSE chunks.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`clm:${ip}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  // Authenticate CLM requests — CLM_API_KEY is required
  const clmKey = process.env.CLM_API_KEY;
  if (!clmKey) {
    return Response.json(
      { error: "CLM_API_KEY not configured" },
      { status: 500, headers: getCorsHeaders(req) },
    );
  }
  {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${clmKey}`) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: getCorsHeaders(req) }
      );
    }
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const body: ChatCompletionRequest = await req.json();
    const { messages: rawMessages, metadata } = body;

    // Validate and sanitize input
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return Response.json(
        { error: "messages array is required" },
        { status: 400, headers: getCorsHeaders(req) }
      );
    }

    // Cap message history and content length to prevent abuse
    const messages = rawMessages.slice(-MAX_MESSAGES).map((m) => ({
      ...m,
      content: typeof m.content === "string" ? m.content.slice(0, MAX_MESSAGE_LENGTH) : m.content,
    }));

    // Resolve business context from the called phone number or fall back to first business
    let businessContext = null;
    if (metadata?.called_phone) {
      businessContext = await getBusinessByPhone(metadata.called_phone);
    }

    // Detect language from the latest user message
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const detectedLang = lastUserMessage
      ? detectLanguage(lastUserMessage.content)
      : "en";

    // Use business default language if no strong signal, otherwise use detected
    const lang = detectedLang;

    // Build the system prompt with business context
    let systemPrompt = businessContext
      ? buildSystemPrompt(businessContext, lang)
      : buildDefaultSystemPrompt(lang);

    // Check if business is currently closed (after-hours)
    if (businessContext) {
      const afterHoursNotice = getAfterHoursNotice(businessContext, lang);
      if (afterHoursNotice) {
        systemPrompt += afterHoursNotice;
      }
    }

    // Check latest user message for emergency keywords
    if (lastUserMessage) {
      const emergency = detectEmergency(lastUserMessage.content);
      if (emergency.isEmergency) {
        const emergencyInstruction = lang === "es"
          ? `\n\n[ALERTA DE EMERGENCIA: El llamante describió una situación de emergencia ("${emergency.matchedPhrase}"). Sigue el Protocolo de Emergencia de inmediato. Mantén la calma, valida la urgencia, usa transfer_to_human con razón "[EMERGENCY]", y recuérdales llamar al 911 si hay peligro inmediato.]`
          : `\n\n[EMERGENCY ALERT: The caller described an emergency situation ("${emergency.matchedPhrase}"). Follow the Emergency Protocol immediately. Stay calm, validate the urgency, use transfer_to_human with reason "[EMERGENCY]", and remind them to call 911 if there is immediate danger.]`;
        systemPrompt += emergencyInstruction;
      }
    }

    // Convert messages to Anthropic format (filter out system messages — we inject our own)
    const anthropicMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Ensure messages alternate user/assistant; Anthropic requires user first
    const cleanedMessages = ensureAlternatingRoles(anthropicMessages);

    // Stream from Claude
    const stream = anthropic!.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 200,
      system: systemPrompt,
      messages: cleanedMessages,
    });

    // Return SSE stream in OpenAI-compatible format
    const encoder = new TextEncoder();
    const responseId = `chatcmpl-${crypto.randomUUID()}`;
    const created = Math.floor(Date.now() / 1000);
    const chatGroupId = metadata?.chat_group_id;

    const readableStream = new ReadableStream({
      async start(controller) {
        let aiResponseText = "";
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              aiResponseText += event.delta.text;
              const chunk: SSEChunk = {
                id: responseId,
                object: "chat.completion.chunk",
                created,
                model: CLAUDE_MODEL,
                choices: [
                  {
                    index: 0,
                    delta: { content: event.delta.text },
                    finish_reason: null,
                  },
                ],
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
              );
            }
          }

          // Send final chunk with finish_reason
          const finalChunk: SSEChunk = {
            id: responseId,
            object: "chat.completion.chunk",
            created,
            model: CLAUDE_MODEL,
            choices: [
              {
                index: 0,
                delta: {},
                finish_reason: "stop",
              },
            ],
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(finalChunk)}\n\n`)
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();

          // Save transcript to DB after stream completes
          if (chatGroupId) {
            saveTranscript(chatGroupId, messages, aiResponseText, detectedLang).catch(
              (err) => reportError("Failed to save transcript", err, { extra: { chatGroupId } })
            );
          }
        } catch (error) {
          reportError("Stream error", error, { extra: { chatGroupId } });
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        ...getCorsHeaders(req),
      },
    });
  } catch (error) {
    reportError("CLM endpoint error", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json(
      { error: message },
      { status: 500, headers: getCorsHeaders(req) }
    );
  }
}

function buildDefaultSystemPrompt(lang: "en" | "es"): string {
  if (lang === "es") {
    return `Eres una recepcionista virtual de una empresa de servicios. Contesta llamadas, toma información del llamante y ayuda a agendar citas. Responde en 1-2 oraciones máximo. Sin frases de relleno. Ve directo al punto. Si te hablan en inglés, cambia a inglés. Eres bilingüe. Nunca discutas precios. Si te preguntan si eres humana, di que eres asistente de IA.`;
  }
  return `You are a virtual receptionist for a service business. Answer calls, collect caller info, and help schedule appointments. Respond in 1-2 sentences max. No filler phrases. Go straight to the point. If spoken to in Spanish, switch to Spanish. You are bilingual. Never discuss pricing. If asked if you're human, say you're an AI assistant.`;
}

/**
 * Convert Hume messages + latest AI response into transcript format
 * and save to the call record. Runs fire-and-forget after streaming.
 */
async function saveTranscript(
  chatGroupId: string,
  messages: ChatCompletionRequest["messages"],
  aiResponse: string,
  language: string
) {
  // Build transcript from conversation messages (skip system)
  const transcript: Array<{ speaker: "ai" | "caller"; text: string }> = [];
  for (const msg of messages) {
    if (msg.role === "system") continue;
    transcript.push({
      speaker: msg.role === "assistant" ? "ai" : "caller",
      text: msg.content,
    });
  }
  // Append the latest AI response
  if (aiResponse.trim()) {
    transcript.push({ speaker: "ai", text: aiResponse.trim() });
  }

  // Find call by chat_group_id and update transcript + language
  const [call] = await db
    .select({ id: calls.id })
    .from(calls)
    .where(eq(calls.humeChatGroupId, chatGroupId))
    .limit(1);

  if (call) {
    await db
      .update(calls)
      .set({
        transcript,
        language,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(calls.id, call.id));
  }
}

/**
 * Check if the business is currently closed based on businessHours and timezone.
 * Returns an instruction string to append to the system prompt, or null if open.
 */
function getAfterHoursNotice(biz: BusinessContext, lang: Language): string | null {
  try {
    const now = new Date();
    // Get current day/time in the business timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: biz.timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const weekday = parts.find((p) => p.type === "weekday")?.value; // Mon, Tue, etc.
    const hour = parts.find((p) => p.type === "hour")?.value || "0";
    const minute = parts.find((p) => p.type === "minute")?.value || "0";
    const currentMinutes = parseInt(hour) * 60 + parseInt(minute);

    if (!weekday) return null;

    const hours = biz.businessHours[weekday];
    if (!hours) {
      // No hours entry for this day = closed
      return buildAfterHoursPrompt(biz, lang);
    }

    // Check if explicitly closed
    if ((hours as Record<string, unknown>).closed) {
      return buildAfterHoursPrompt(biz, lang);
    }

    // Parse open/close times
    const [openH, openM] = hours.open.split(":").map(Number);
    const [closeH, closeM] = hours.close.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) {
      return buildAfterHoursPrompt(biz, lang);
    }

    return null;
  } catch {
    // If timezone parsing fails, don't inject anything
    return null;
  }
}

function buildAfterHoursPrompt(biz: BusinessContext, lang: Language): string {
  const hoursDisplay = Object.entries(biz.businessHours)
    .map(([day, h]) => {
      if ((h as Record<string, unknown>).closed) return `${day}: Closed`;
      return `${day}: ${h.open}-${h.close}`;
    })
    .join(", ");

  const emergencyLine = biz.emergencyPhone
    ? lang === "es"
      ? ` Si es una emergencia, usa transfer_to_human con el número de emergencia.`
      : ` If it's an emergency, still use transfer_to_human with the emergency phone.`
    : "";

  if (lang === "es") {
    return `\n\n[FUERA DE HORARIO: El negocio está actualmente CERRADO. Horario: ${hoursDisplay}. Ofrece tomar un mensaje y dile al llamante que le contactarán durante el horario laboral.${emergencyLine}]`;
  }
  return `\n\n[AFTER HOURS: The business is currently CLOSED. Hours: ${hoursDisplay}. Offer to take a message and let the caller know someone will get back to them during business hours.${emergencyLine}]`;
}

/**
 * Ensure messages alternate between user and assistant roles.
 * Anthropic requires the first message to be from the user.
 */
function ensureAlternatingRoles(
  messages: Array<{ role: string; content: string }>
): Array<{ role: "user" | "assistant"; content: string }> {
  if (messages.length === 0) {
    return [{ role: "user", content: "Hello" }];
  }

  const result: Array<{ role: "user" | "assistant"; content: string }> = [];

  for (const msg of messages) {
    const role = msg.role === "assistant" ? "assistant" : "user";
    // If same role as previous, merge content
    if (result.length > 0 && result[result.length - 1].role === role) {
      result[result.length - 1].content += "\n" + msg.content;
    } else {
      result.push({ role, content: msg.content });
    }
  }

  // Ensure first message is user
  if (result[0]?.role !== "user") {
    result.unshift({ role: "user", content: "Hello" });
  }

  return result;
}
