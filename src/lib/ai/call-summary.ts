import Anthropic from "@anthropic-ai/sdk";
import { getHumeClient } from "@/lib/hume/client";
import { db } from "@/db";
import { calls } from "@/db/schema";
import { eq } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

interface TranscriptLine {
  speaker: "ai" | "caller";
  text: string;
}

interface SummaryResult {
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  transcript: TranscriptLine[];
}

/**
 * Fetch the transcript from Hume's chat events API.
 */
async function fetchTranscript(chatId: string): Promise<TranscriptLine[]> {
  const client = getHumeClient();
  const transcript: TranscriptLine[] = [];

  const page = await client.empathicVoice.chats.listChatEvents(chatId, {
    pageSize: 100,
    ascendingOrder: true,
  });

  for (const event of page) {
    if (!event.messageText) continue;

    if (event.role === "USER") {
      transcript.push({ speaker: "caller", text: event.messageText });
    } else if (event.role === "AGENT") {
      transcript.push({ speaker: "ai", text: event.messageText });
    }
  }

  return transcript;
}

/**
 * Use Claude to generate a summary and sentiment from a call transcript.
 */
async function generateSummary(transcript: TranscriptLine[]): Promise<{ summary: string; sentiment: "positive" | "neutral" | "negative" }> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const transcriptText = transcript
    .map((line) => `${line.speaker === "ai" ? "AI" : "Caller"}: ${line.text}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5-20250929",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `Analyze this phone call transcript between an AI receptionist and a caller. Provide:

1. A concise 1-3 sentence summary of what happened in the call (what the caller needed, what was resolved).
2. The overall caller sentiment: "positive", "neutral", or "negative".

Respond in this exact JSON format only, no other text:
{"summary": "...", "sentiment": "positive|neutral|negative"}

Transcript:
${transcriptText}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text);
    const sentiment = ["positive", "neutral", "negative"].includes(parsed.sentiment)
      ? parsed.sentiment
      : "neutral";
    return { summary: parsed.summary || "Call completed.", sentiment };
  } catch {
    return { summary: "Call completed.", sentiment: "neutral" };
  }
}

/**
 * Process a completed call: fetch transcript, generate summary, update DB.
 * This is designed to be called fire-and-forget after a call ends.
 */
export async function processCallSummary(callId: string, chatId: string): Promise<SummaryResult | null> {
  try {
    const transcript = await fetchTranscript(chatId);

    if (transcript.length === 0) {
      console.log("No transcript found for call", { callId, chatId });
      return null;
    }

    const { summary, sentiment } = await generateSummary(transcript);

    await db.update(calls).set({
      summary,
      sentiment,
      transcript,
      updatedAt: new Date().toISOString(),
    }).where(eq(calls.id, callId));

    console.log("Call summary generated:", { callId, sentiment, lines: transcript.length });

    return { summary, sentiment, transcript };
  } catch (error) {
    reportError("Failed to generate call summary", error, {
      extra: { callId, chatId },
    });
    return null;
  }
}
