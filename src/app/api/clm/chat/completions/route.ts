import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getBusinessByPhone } from "@/lib/ai/context-builder";
import { buildSystemPrompt } from "@/lib/ai/system-prompts";
import { detectLanguage } from "@/lib/ai/context-builder";
import type { ChatCompletionRequest, SSEChunk } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * CLM (Custom Language Model) endpoint for Hume EVI.
 * Receives OpenAI-compatible chat completion requests from Hume,
 * enriches with business context, calls Claude, and streams back
 * as OpenAI-compatible SSE chunks.
 */
export async function POST(req: NextRequest) {
  try {
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
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 300,
      system: systemPrompt,
      messages: cleanedMessages,
    });

    // Return SSE stream in OpenAI-compatible format
    const encoder = new TextEncoder();
    const responseId = `chatcmpl-${crypto.randomUUID()}`;
    const created = Math.floor(Date.now() / 1000);

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const chunk: SSEChunk = {
                id: responseId,
                object: "chat.completion.chunk",
                created,
                model: "claude-sonnet-4-5-20250514",
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
            model: "claude-sonnet-4-5-20250514",
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
      },
    });
  } catch (error) {
    console.error("CLM endpoint error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function buildDefaultSystemPrompt(lang: "en" | "es"): string {
  if (lang === "es") {
    return "Eres un asistente virtual amigable que contesta llamadas telefónicas. Sé breve y servicial.";
  }
  return "You are a friendly virtual assistant answering phone calls. Be brief and helpful.";
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
