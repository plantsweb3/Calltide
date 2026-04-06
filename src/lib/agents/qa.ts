import { db } from "@/db";
import { calls, businesses, callQaScores } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { env } from "@/lib/env";
import { logAgentActivity } from "./tools";
import { reportError, reportWarning } from "@/lib/error-reporting";
import { createNotification } from "@/lib/notifications";
import { getAnthropic, HAIKU_MODEL } from "@/lib/ai/client";

const CLAUDE_MODEL = env.CLAUDE_MODEL ?? HAIKU_MODEL;

interface QaResult {
  score: number;
  breakdown: {
    greeting: number;
    languageMatch: number;
    needCapture: number;
    actionTaken: number;
    accuracy: number;
    sentiment: number;
    aiDisclosure: number;
  };
  flags: string[];
  fixRecommendation: string | null;
  summary: string;
}

const QA_SYSTEM_PROMPT = `You are Capta's QA analyst. You review AI receptionist call transcripts for quality.
You receive the full call transcript, the business profile, the post-call summary, and sentiment.

Score the call 0-100 using these weighted criteria:
- Greeting (15%): Did the AI identify itself and the business name correctly?
- Language Match (10%): Did the AI respond in the caller's language? Check if the caller spoke Spanish but AI responded in English or vice versa.
- Need Capture (20%): Did the AI understand what the caller needed?
- Action Taken (20%): Was the right action taken? (book appointment, take message, transfer, provide info)
- Accuracy (15%): Did the AI say anything that contradicts the business profile? Wrong hours, non-existent services, wrong business name?
- Caller Sentiment (10%): Was the post-call sentiment positive or neutral?
- AI Disclosure (10%): Did the AI disclose that it is an AI assistant and that the call may be recorded? This is a legal/compliance requirement. Look for phrases like "AI assistant", "virtual receptionist", "call may be recorded", or similar disclosures in the greeting.

RESPOND WITH ONLY A JSON OBJECT — no markdown, no explanation:
{
  "score": <number 0-100>,
  "breakdown": {
    "greeting": <number 0-100>,
    "languageMatch": <number 0-100>,
    "needCapture": <number 0-100>,
    "actionTaken": <number 0-100>,
    "accuracy": <number 0-100>,
    "sentiment": <number 0-100>,
    "aiDisclosure": <number 0-100>
  },
  "flags": [<string array of specific issues found, empty if none>],
  "fixRecommendation": <string or null — if score < 70, what should be changed in the system prompt or config>,
  "summary": <string — 1-2 sentence assessment>
}

Scoring guide:
- 90-100: Excellent. The receptionist handled everything perfectly.
- 80-89: Good. Minor issues that didn't impact the caller's experience.
- 70-79: Acceptable. Some issues but the caller's need was met.
- 50-69: Poor. Caller likely had a bad experience. Needs attention.
- Below 50: Critical. Wrong info given, wrong language, or caller clearly frustrated.`;

function daysBetween(dateStr: string, now: Date): number {
  const d = new Date(dateStr);
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Triggered after every post-call summary is generated.
 * QA's every call in first 7 days, or flagged/sampled calls after.
 */
export async function triggerQaIfNewClient(
  callRecord: {
    id: string;
    businessId: string;
    transcript: Array<{ speaker: "ai" | "caller"; text: string }> | null;
    summary: string | null;
    sentiment: string | null;
    duration: number | null;
    language: string | null;
    transferRequested: boolean | number | null;
  },
  businessRecord: {
    id: string;
    name: string;
    type: string;
    services: string[];
    businessHours: Record<string, { open: string; close: string }>;
    defaultLanguage: string;
    ownerName: string;
    createdAt: string;
  },
): Promise<void> {
  if (!callRecord.transcript || callRecord.transcript.length === 0) return;

  const now = new Date();
  const daysSinceCreation = daysBetween(businessRecord.createdAt, now);
  const isFirstWeek = daysSinceCreation <= 7;

  // If past first week: only QA negative sentiment, transfers, or 10% sample
  if (!isFirstWeek) {
    const shouldReview =
      callRecord.sentiment === "negative" || !!callRecord.transferRequested;
    const randomSample = Math.random() < 0.1;
    if (!shouldReview && !randomSample) return;
  }

  try {
    // Build formatted context (reduces token count ~30-40% vs JSON)
    const formattedTranscript = callRecord.transcript
      .map((line) => `${line.speaker === "ai" ? "AI" : "Caller"}: ${line.text}`)
      .join("\n");

    const hoursStr = businessRecord.businessHours
      ? Object.entries(businessRecord.businessHours)
          .map(([day, h]) => `${day}: ${h.open}-${h.close}`)
          .join(", ")
      : "not set";

    const contextText = `Transcript:
${formattedTranscript}

Summary: ${callRecord.summary ?? "none"}
Sentiment: ${callRecord.sentiment ?? "unknown"}
Duration: ${callRecord.duration ?? "unknown"}s
Language: ${callRecord.language ?? "unknown"}
Business: ${businessRecord.name} (${businessRecord.type})
Services: ${businessRecord.services?.join(", ") || "none listed"}
Hours: ${hoursStr}
Default Language: ${businessRecord.defaultLanguage}`;

    // Direct Claude call for QA scoring (no tool use needed)
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      system: QA_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: contextText },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    let qaResult: QaResult;
    try {
      qaResult = JSON.parse(text);
    } catch {
      reportWarning("QA agent returned non-JSON response", { callId: callRecord.id, text });
      return;
    }

    // Validate score is in range
    if (typeof qaResult.score !== "number" || qaResult.score < 0 || qaResult.score > 100) {
      return;
    }

    // Store in callQaScores
    await db.insert(callQaScores).values({
      callId: callRecord.id,
      businessId: callRecord.businessId,
      score: qaResult.score,
      breakdown: qaResult.breakdown,
      flags: qaResult.flags || [],
      fixRecommendation: qaResult.fixRecommendation || null,
      summary: qaResult.summary || null,
      isFirstWeek,
    });

    // Log activity
    await logAgentActivity({
      agentName: "qa",
      actionType: "qa_scored",
      targetId: callRecord.businessId,
      targetType: "client",
      inputSummary: `QA scored call ${callRecord.id} for ${businessRecord.name}`,
      outputSummary: `Score: ${qaResult.score}/100. ${qaResult.summary}`,
      toolsCalled: [],
      escalated: false,
      resolvedWithoutEscalation: true,
    });

    // If score < 70 and first week: escalate
    if (qaResult.score < 70 && isFirstWeek) {
      // Check total low scores for this business in first week
      const lowScores = await db
        .select({ id: callQaScores.id })
        .from(callQaScores)
        .where(
          and(
            eq(callQaScores.businessId, callRecord.businessId),
            eq(callQaScores.isFirstWeek, true),
            lt(callQaScores.score, 70),
          ),
        );

      const urgency = lowScores.length >= 2 ? "high" : "medium";
      const reason =
        lowScores.length >= 2
          ? `CRITICAL: ${lowScores.length} low QA scores in first week for ${businessRecord.name}`
          : `Low QA score (${qaResult.score}/100) on new client ${businessRecord.name}'s call`;

      // Create notification for admin visibility
      await createNotification({
        source: "retention",
        severity: lowScores.length >= 2 ? "critical" : "warning",
        title: lowScores.length >= 2 ? "Multiple low QA scores" : "QA score dropped",
        message: `${businessRecord.name} — score ${qaResult.score}/100. ${qaResult.fixRecommendation || qaResult.summary}`,
        actionUrl: "/admin/ai",
      });

      // Log escalation
      await logAgentActivity({
        agentName: "qa",
        actionType: "escalated",
        targetId: callRecord.businessId,
        targetType: "client",
        inputSummary: reason,
        outputSummary: qaResult.fixRecommendation || qaResult.summary,
        toolsCalled: ["escalate_to_owner"],
        escalated: true,
        resolvedWithoutEscalation: false,
        metadata: {
          score: qaResult.score,
          flags: qaResult.flags,
          lowScoreCount: lowScores.length,
          urgency,
        },
      });
    }

    reportWarning("QA scored call", {
      callId: callRecord.id,
      score: qaResult.score,
      isFirstWeek,
    });
  } catch (error) {
    reportError("QA agent error", error, {
      extra: { callId: callRecord.id, businessId: callRecord.businessId },
    });
  }
}
