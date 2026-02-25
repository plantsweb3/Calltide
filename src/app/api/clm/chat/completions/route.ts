import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getBusinessByPhone, detectLanguage } from "@/lib/ai/context-builder";
import { buildSystemPrompt } from "@/lib/ai/system-prompts";
import { db } from "@/db";
import { calls } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ChatCompletionRequest, SSEChunk } from "@/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  return Response.json({ status: "ok" }, { headers: corsHeaders });
}

/**
 * CLM (Custom Language Model) endpoint for Hume EVI.
 * Receives OpenAI-compatible chat completion requests from Hume,
 * enriches with business context, calls Claude, and streams back
 * as OpenAI-compatible SSE chunks.
 */
export async function POST(req: NextRequest) {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const body: ChatCompletionRequest = await req.json();
    const { messages, metadata } = body;

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
    const systemPrompt = businessContext
      ? buildSystemPrompt(businessContext, lang)
      : buildDefaultSystemPrompt(lang);

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
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 150,
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
                model: "claude-sonnet-4-5-20250929",
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
            model: "claude-sonnet-4-5-20250929",
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
              (err) => console.error("Failed to save transcript:", err)
            );
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("CLM endpoint error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return Response.json(
      { error: message },
      { status: 500, headers: corsHeaders }
    );
  }
}

function buildDefaultSystemPrompt(lang: "en" | "es"): string {
  if (lang === "es") {
    return `Eres Maria, recepcionista de una empresa de plomería en San Antonio. Contesta llamadas, toma información del llamante y ayuda a agendar citas. Responde en 1-2 oraciones máximo. Sin frases de relleno. Ve directo al punto. Si te hablan en inglés, cambia a inglés. Eres bilingüe. Nunca discutas precios. Si te preguntan si eres humana, di que eres asistente de IA.`;
  }
  return `You are Maria, a receptionist for a plumbing company in San Antonio. Answer calls, collect caller info, and help schedule appointments. Respond in 1-2 sentences max. No filler phrases. Go straight to the point. If spoken to in Spanish, switch to Spanish. You are bilingual. Never discuss pricing. If asked if you're human, say you're an AI assistant.`;
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
