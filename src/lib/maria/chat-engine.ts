import { db } from "@/db";
import { chatMessages, businessContextNotes, conversationSummaries } from "@/db/schema";
import { eq, and, desc, asc, count } from "drizzle-orm";
import { getAnthropic, isAnthropicConfigured, HAIKU_MODEL } from "@/lib/ai/client";
import { MARIA_TOOLS, handleToolCall } from "./tools";
import { buildMariaSystemPrompt } from "./persona";
import { getBusinessById } from "@/lib/ai/context-builder";
import { reportError } from "@/lib/error-reporting";
import type Anthropic from "@anthropic-ai/sdk";

const MAX_CONTEXT_MESSAGES = 24;
const COMPACTION_TRIGGER = 30; // trigger after response, not before
const COMPACTION_KEEP = 12;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_LIMIT = 100;

/** Sanitize user message before storage — strip control chars, enforce length */
function sanitizeMessage(text: string): string {
  return text
    .slice(0, MAX_MESSAGE_LENGTH)
    // Remove control characters (keep newline, tab, space)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

interface ChatResponse {
  reply: string;
  tokenCount: number;
  toolsUsed: string[];
}

/**
 * Process a message from the business owner and return Maria's response.
 * @param onboardingContext - If "onboarding", Maria knows the business isn't active yet
 *   and can help with setup (forwarding instructions, activation, etc.)
 */
export async function chat(
  businessId: string,
  userMessage: string,
  channel: "dashboard" | "sms" = "dashboard",
  onboardingContext?: "onboarding",
): Promise<ChatResponse> {
  const biz = await getBusinessById(businessId);
  if (!biz) throw new Error("Business not found");

  // Sanitize and save the user message
  const sanitizedMessage = sanitizeMessage(userMessage);
  if (!sanitizedMessage) throw new Error("Empty message after sanitization");

  await db.insert(chatMessages).values({
    businessId,
    role: "user",
    content: sanitizedMessage,
    channel,
  });

  // Load conversation context
  const contextNotes = await db
    .select({ content: businessContextNotes.content })
    .from(businessContextNotes)
    .where(eq(businessContextNotes.businessId, businessId))
    .orderBy(desc(businessContextNotes.createdAt))
    .limit(20);

  // Load latest conversation summary (if any)
  const [latestSummary] = await db
    .select({ summary: conversationSummaries.summary })
    .from(conversationSummaries)
    .where(and(eq(conversationSummaries.businessId, businessId), eq(conversationSummaries.channel, channel)))
    .orderBy(desc(conversationSummaries.createdAt))
    .limit(1);

  // Build system prompt
  const systemPrompt = buildMariaSystemPrompt({
    businessName: biz.name,
    ownerName: biz.ownerName,
    tradeType: biz.type,
    receptionistName: biz.receptionistName || "Maria",
    timezone: biz.timezone,
    serviceArea: biz.serviceArea,
    contextNotes: contextNotes.map((n) => n.content),
    conversationSummary: latestSummary?.summary,
    onboardingContext: onboardingContext === "onboarding" ? {
      twilioNumber: biz.twilioNumber,
      isActive: false,
    } : undefined,
  });

  // Load recent messages for context window
  const recentMessages = await db
    .select({
      role: chatMessages.role,
      content: chatMessages.content,
      toolCalls: chatMessages.toolCalls,
      toolResults: chatMessages.toolResults,
    })
    .from(chatMessages)
    .where(and(eq(chatMessages.businessId, businessId), eq(chatMessages.channel, channel)))
    .orderBy(desc(chatMessages.createdAt))
    .limit(MAX_CONTEXT_MESSAGES);

  // Reverse to chronological order
  recentMessages.reverse();

  // Build Anthropic messages array — use stable IDs that match between tool_use and tool_result
  const messages: Anthropic.MessageParam[] = [];

  for (let i = 0; i < recentMessages.length; i++) {
    const m = recentMessages[i];

    if (m.role === "assistant" && m.toolCalls && Array.isArray(m.toolCalls) && m.toolCalls.length > 0) {
      const content: Array<Anthropic.TextBlockParam | Anthropic.ToolUseBlockParam> = [];
      if (m.content) {
        content.push({ type: "text" as const, text: m.content });
      }
      // Generate tool_use IDs that the next message's tool_result will reference
      const toolIds: string[] = [];
      for (let j = 0; j < m.toolCalls.length; j++) {
        const tc = m.toolCalls[j];
        const toolId = `hist_${i}_tool_${j}`;
        toolIds.push(toolId);
        content.push({
          type: "tool_use" as const,
          id: toolId,
          name: tc.name,
          input: tc.input,
        });
      }
      messages.push({ role: "assistant" as const, content });

      // Check if the next message is the matching tool results
      const next = recentMessages[i + 1];
      if (next && next.role === "user" && next.toolResults && Array.isArray(next.toolResults) && next.toolResults.length > 0) {
        const resultContent: Anthropic.ToolResultBlockParam[] = next.toolResults.map((tr, idx) => ({
          type: "tool_result" as const,
          tool_use_id: toolIds[idx] || `hist_${i}_fallback_${idx}`,
          content: typeof tr.result === "string" ? tr.result : JSON.stringify(tr.result),
        }));
        messages.push({ role: "user" as const, content: resultContent });
        i++; // skip the next message since we already processed it
      }
      continue;
    }

    // Skip orphaned tool result messages (already handled above)
    if (m.role === "user" && m.content === "[tool results]") continue;

    messages.push({
      role: m.role as "user" | "assistant",
      content: m.content || " ", // Anthropic requires non-empty content
    });
  }

  // Graceful degrade: return an apology when Anthropic is unavailable.
  if (!isAnthropicConfigured()) {
    const fallbackReply = biz.language === "es"
      ? "Lo siento, el asistente no está disponible ahora mismo. Por favor, inténtelo de nuevo en unos minutos."
      : "Sorry, the assistant is temporarily unavailable. Please try again in a few minutes.";
    await db.insert(chatMessages).values({
      businessId,
      role: "assistant",
      content: fallbackReply,
      channel,
    });
    return { reply: fallbackReply, tokenCount: 0, toolsUsed: [] };
  }

  // Call Anthropic with tool support
  const anthropic = getAnthropic();
  const toolsUsed: string[] = [];
  let totalTokens = 0;

  let response = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: channel === "sms" ? 400 : 1024, // shorter for SMS
    system: systemPrompt,
    tools: MARIA_TOOLS,
    messages,
  });

  totalTokens += (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

  // Handle tool use loop (max 5 iterations)
  let iterations = 0;
  while (response.stop_reason === "tool_use" && iterations < 5) {
    iterations++;

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    const toolCallsForStorage: Array<{ name: string; input: Record<string, unknown>; result: unknown }> = [];

    for (const block of toolUseBlocks) {
      toolsUsed.push(block.name);
      const result = await handleToolCall(
        block.name,
        block.input as Record<string, unknown>,
        biz,
        businessId
      );

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result,
      });

      // Safe JSON parse
      let parsed: unknown;
      try { parsed = JSON.parse(result); } catch { parsed = result; }

      toolCallsForStorage.push({
        name: block.name,
        input: block.input as Record<string, unknown>,
        result: parsed,
      });
    }

    const textContent = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Save assistant message with tool calls
    await db.insert(chatMessages).values({
      businessId,
      role: "assistant",
      content: textContent || "",
      channel,
      toolCalls: toolCallsForStorage,
      tokenCount: response.usage?.output_tokens ?? 0,
    });

    // Save tool results as a user message
    await db.insert(chatMessages).values({
      businessId,
      role: "user",
      content: "[tool results]",
      channel,
      toolResults: toolCallsForStorage.map((tc) => ({ name: tc.name, result: tc.result })),
    });

    // Continue the conversation
    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });

    response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: channel === "sms" ? 400 : 1024,
      system: systemPrompt,
      tools: MARIA_TOOLS,
      messages,
    });

    totalTokens += (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
  }

  // Extract final text response
  let finalText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  // Fallback if model produced no text (only tool calls on final iteration)
  if (!finalText.trim()) {
    finalText = "I looked into that for you but couldn't put together a response. Could you try asking again?";
  }

  // Save assistant response
  await db.insert(chatMessages).values({
    businessId,
    role: "assistant",
    content: finalText,
    channel,
    tokenCount: response.usage?.output_tokens ?? 0,
  });

  // Compact AFTER successful response (non-blocking)
  compactIfNeeded(businessId, channel).catch((err) =>
    reportError("Post-response compaction failed", err, { extra: { businessId } })
  );

  return {
    reply: finalText,
    tokenCount: totalTokens,
    toolsUsed,
  };
}

/** In-process lock to prevent concurrent compaction for the same business+channel */
const compactingBusinesses = new Set<string>();

/**
 * Check and compact if needed — runs after the response is sent.
 */
async function compactIfNeeded(businessId: string, channel: "dashboard" | "sms"): Promise<void> {
  const lockKey = `${businessId}:${channel}`;
  if (compactingBusinesses.has(lockKey)) return;

  const [messageCount] = await db
    .select({ cnt: count() })
    .from(chatMessages)
    .where(and(eq(chatMessages.businessId, businessId), eq(chatMessages.channel, channel)));

  if ((messageCount?.cnt ?? 0) >= COMPACTION_TRIGGER) {
    compactingBusinesses.add(lockKey);
    try {
      await compactConversation(businessId, channel);
    } finally {
      compactingBusinesses.delete(lockKey);
    }
  }
}

/**
 * Compact older messages into a summary to keep the context window manageable.
 */
async function compactConversation(
  businessId: string,
  channel: "dashboard" | "sms"
): Promise<void> {
  try {
    const biz = await getBusinessById(businessId);
    const receptionistName = biz?.receptionistName || "Maria";

    const allMessages = await db
      .select({
        id: chatMessages.id,
        role: chatMessages.role,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(and(eq(chatMessages.businessId, businessId), eq(chatMessages.channel, channel)))
      .orderBy(asc(chatMessages.createdAt));

    if (allMessages.length <= COMPACTION_KEEP) return;

    const toSummarize = allMessages.slice(0, allMessages.length - COMPACTION_KEEP);
    const oldest = toSummarize[0];
    const newest = toSummarize[toSummarize.length - 1];

    const transcript = toSummarize
      .filter((m) => m.content && m.content !== "[tool results]")
      .map((m) => `${m.role === "user" ? "Owner" : receptionistName}: ${m.content}`)
      .join("\n");

    if (!transcript.trim()) {
      for (const m of toSummarize) {
        await db.delete(chatMessages).where(eq(chatMessages.id, m.id));
      }
      return;
    }

    const anthropic = getAnthropic();
    const summaryResponse = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Summarize this conversation between a business owner and their AI office manager. Capture key facts, decisions, preferences mentioned, and any important context. Be concise (3-5 sentences max).\n\n${transcript}`,
        },
      ],
    });

    const summaryText = summaryResponse.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    await db.insert(conversationSummaries).values({
      businessId,
      channel,
      summary: summaryText,
      messageCount: toSummarize.length,
      oldestMessageAt: oldest.createdAt,
      newestMessageAt: newest.createdAt,
    });

    for (const m of toSummarize) {
      await db.delete(chatMessages).where(eq(chatMessages.id, m.id));
    }
  } catch (err) {
    reportError("Conversation compaction failed", err, { extra: { businessId, channel } });
  }
}

/**
 * Get the auto-greeting message for when the chat widget opens.
 */
export function getAutoGreeting(ownerName: string, receptionistName: string, timezone?: string): string {
  const now = new Date();
  const hour = timezone
    ? parseInt(now.toLocaleString("en-US", { timeZone: timezone, hour: "numeric", hour12: false }))
    : now.getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const firstName = ownerName.split(" ")[0] || ownerName;
  return `Good ${timeOfDay}, ${firstName}! It's ${receptionistName} — how can I help you today?`;
}

/**
 * Get recent chat history for the dashboard widget.
 */
export async function getChatHistory(
  businessId: string,
  channel: "dashboard" | "sms" = "dashboard",
  limit: number = 50
): Promise<Array<{
  id: string;
  role: string;
  content: string;
  toolsUsed?: string[];
  createdAt: string;
}>> {
  const cappedLimit = Math.min(limit || 50, MAX_HISTORY_LIMIT);
  const messages = await db
    .select({
      id: chatMessages.id,
      role: chatMessages.role,
      content: chatMessages.content,
      toolCalls: chatMessages.toolCalls,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .where(and(eq(chatMessages.businessId, businessId), eq(chatMessages.channel, channel)))
    .orderBy(desc(chatMessages.createdAt))
    .limit(cappedLimit);

  return messages
    .reverse()
    .filter((m) => m.content && m.content !== "[tool results]")
    .map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      toolsUsed: m.toolCalls ? (m.toolCalls as Array<{ name: string }>).map((tc) => tc.name) : undefined,
      createdAt: m.createdAt,
    }));
}
