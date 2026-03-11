import { db } from "@/db";
import { chatMessages, businessContextNotes, conversationSummaries } from "@/db/schema";
import { eq, and, desc, asc, lt, count } from "drizzle-orm";
import { getAnthropic, HAIKU_MODEL } from "@/lib/ai/client";
import { MARIA_TOOLS, handleToolCall } from "./tools";
import { buildMariaSystemPrompt } from "./persona";
import { getBusinessById } from "@/lib/ai/context-builder";
import { reportError } from "@/lib/error-reporting";
import type Anthropic from "@anthropic-ai/sdk";

const MAX_CONTEXT_MESSAGES = 24;
const COMPACTION_TRIGGER = 24;
const COMPACTION_KEEP = 12;

interface ChatResponse {
  reply: string;
  tokenCount: number;
  toolsUsed: string[];
}

/**
 * Process a message from the business owner and return Maria's response.
 * This is the core chat engine that handles conversation history,
 * context management, tool calls, and response generation.
 */
export async function chat(
  businessId: string,
  userMessage: string,
  channel: "dashboard" | "sms" = "dashboard"
): Promise<ChatResponse> {
  const biz = await getBusinessById(businessId);
  if (!biz) throw new Error("Business not found");

  // Save the user message
  await db.insert(chatMessages).values({
    businessId,
    role: "user",
    content: userMessage,
    channel,
  });

  // Check if compaction is needed
  const [messageCount] = await db
    .select({ cnt: count() })
    .from(chatMessages)
    .where(and(eq(chatMessages.businessId, businessId), eq(chatMessages.channel, channel)));

  if ((messageCount?.cnt ?? 0) >= COMPACTION_TRIGGER) {
    await compactConversation(businessId, channel);
  }

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

  // Build Anthropic messages array
  const messages: Anthropic.MessageParam[] = recentMessages.map((m) => {
    if (m.role === "assistant" && m.toolCalls && Array.isArray(m.toolCalls) && m.toolCalls.length > 0) {
      // Reconstruct assistant message with tool use blocks
      const content: Array<Anthropic.TextBlockParam | Anthropic.ToolUseBlockParam> = [];
      if (m.content) {
        content.push({ type: "text" as const, text: m.content });
      }
      for (const tc of m.toolCalls) {
        content.push({
          type: "tool_use" as const,
          id: `tool_${tc.name}_${Date.now()}`,
          name: tc.name,
          input: tc.input,
        });
      }
      return { role: "assistant" as const, content };
    }

    if (m.role === "user" && m.toolResults && Array.isArray(m.toolResults) && m.toolResults.length > 0) {
      // Tool results come as user messages
      const content: Anthropic.ToolResultBlockParam[] = m.toolResults.map((tr) => ({
        type: "tool_result" as const,
        tool_use_id: `tool_${tr.name}_result`,
        content: typeof tr.result === "string" ? tr.result : JSON.stringify(tr.result),
      }));
      return { role: "user" as const, content };
    }

    return {
      role: m.role as "user" | "assistant",
      content: m.content,
    };
  });

  // Call Anthropic with tool support
  const anthropic = getAnthropic();
  const toolsUsed: string[] = [];
  let totalTokens = 0;

  let response = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    tools: MARIA_TOOLS,
    messages,
  });

  totalTokens += (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

  // Handle tool use loop (max 5 iterations)
  let iterations = 0;
  while (response.stop_reason === "tool_use" && iterations < 5) {
    iterations++;

    // Extract tool calls from response
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    // Execute tools
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

      toolCallsForStorage.push({
        name: block.name,
        input: block.input as Record<string, unknown>,
        result: JSON.parse(result),
      });
    }

    // Get any text content from the assistant's response (before tool calls)
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

    // Continue the conversation with tool results
    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });

    response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools: MARIA_TOOLS,
      messages,
    });

    totalTokens += (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
  }

  // Extract final text response
  const finalText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  // Save assistant response
  await db.insert(chatMessages).values({
    businessId,
    role: "assistant",
    content: finalText,
    channel,
    tokenCount: response.usage?.output_tokens ?? 0,
  });

  return {
    reply: finalText,
    tokenCount: totalTokens,
    toolsUsed,
  };
}

/**
 * Compact older messages into a summary to keep the context window manageable.
 * Keeps the most recent COMPACTION_KEEP messages, summarizes the rest.
 */
async function compactConversation(
  businessId: string,
  channel: "dashboard" | "sms"
): Promise<void> {
  try {
    // Get all messages for this channel
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

    // Split: messages to summarize vs keep
    const toSummarize = allMessages.slice(0, allMessages.length - COMPACTION_KEEP);
    const oldest = toSummarize[0];
    const newest = toSummarize[toSummarize.length - 1];

    // Build text for summarization
    const transcript = toSummarize
      .filter((m) => m.content && m.content !== "[tool results]")
      .map((m) => `${m.role === "user" ? "Owner" : "Maria"}: ${m.content}`)
      .join("\n");

    if (!transcript.trim()) {
      // Nothing meaningful to summarize, just delete old messages
      const idsToDelete = toSummarize.map((m) => m.id);
      for (const id of idsToDelete) {
        await db.delete(chatMessages).where(eq(chatMessages.id, id));
      }
      return;
    }

    // Summarize using Haiku
    const anthropic = getAnthropic();
    const summaryResponse = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Summarize this conversation between a business owner and their AI office manager Maria. Capture key facts, decisions, preferences mentioned, and any important context. Be concise (3-5 sentences max).\n\n${transcript}`,
        },
      ],
    });

    const summaryText = summaryResponse.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    // Save summary
    await db.insert(conversationSummaries).values({
      businessId,
      channel,
      summary: summaryText,
      messageCount: toSummarize.length,
      oldestMessageAt: oldest.createdAt,
      newestMessageAt: newest.createdAt,
    });

    // Delete summarized messages
    const idsToDelete = toSummarize.map((m) => m.id);
    for (const id of idsToDelete) {
      await db.delete(chatMessages).where(eq(chatMessages.id, id));
    }
  } catch (err) {
    reportError("Conversation compaction failed", err, { extra: { businessId, channel } });
    // Non-critical — conversation still works, just longer context
  }
}

/**
 * Get the auto-greeting message for when the chat widget opens.
 * This is NOT sent through the LLM — it's a static greeting.
 */
export function getAutoGreeting(ownerName: string, receptionistName: string): string {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const firstName = ownerName.split(" ")[0];
  return `Good ${timeOfDay}, ${firstName}! How can I help you today?`;
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
    .limit(limit);

  // Reverse to chronological order and filter out tool-result messages
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
