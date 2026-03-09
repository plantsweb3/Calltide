import { getHumeClient } from "@/lib/hume/client";
import { getAnthropic, HAIKU_MODEL } from "@/lib/ai/client";
import { db } from "@/db";
import { calls } from "@/db/schema";
import { eq } from "drizzle-orm";
import { businesses } from "@/db/schema";
import { reportError } from "@/lib/error-reporting";
import { triggerQaIfNewClient } from "@/lib/agents/qa";
import { sendOwnerCallAlert, sendMissedCallTextBack } from "@/lib/notifications/post-call";

interface TranscriptLine {
  speaker: "ai" | "caller";
  text: string;
}

type CallOutcome = "appointment_booked" | "estimate_requested" | "message_taken" | "transfer" | "info_only" | "spam" | "unknown";

interface SummaryResult {
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  outcome: CallOutcome;
  callerName: string | null;
  serviceRequested: string | null;
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

  for await (const event of page) {
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
interface GeneratedSummary {
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  outcome: CallOutcome;
  callerName: string | null;
  serviceRequested: string | null;
}

async function generateSummary(transcript: TranscriptLine[]): Promise<GeneratedSummary> {
  const anthropic = getAnthropic();

  const transcriptText = transcript
    .map((line) => `${line.speaker === "ai" ? "AI" : "Caller"}: ${line.text}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: process.env.CLAUDE_MODEL ?? HAIKU_MODEL,
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Analyze this phone call transcript between an AI receptionist and a caller. Extract:

1. A concise 1-3 sentence summary of what happened.
2. The overall caller sentiment: "positive", "neutral", or "negative".
3. The call outcome — pick the best match:
   - "appointment_booked" — caller scheduled an appointment
   - "estimate_requested" — caller asked for a quote/estimate/pricing
   - "message_taken" — AI took a message for the business owner
   - "transfer" — caller was transferred to a human
   - "info_only" — caller only wanted information (hours, location, etc.)
   - "spam" — spam/robocall/wrong number
   - "unknown" — none of the above
4. The caller's name if mentioned (null if not).
5. The service the caller asked about if mentioned (null if not).

Respond in this exact JSON format only, no other text:
{"summary":"...","sentiment":"positive|neutral|negative","outcome":"appointment_booked|estimate_requested|message_taken|transfer|info_only|spam|unknown","callerName":"string or null","serviceRequested":"string or null"}

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
    const validOutcomes: CallOutcome[] = ["appointment_booked", "estimate_requested", "message_taken", "transfer", "info_only", "spam", "unknown"];
    const outcome = validOutcomes.includes(parsed.outcome) ? parsed.outcome : "unknown";
    return {
      summary: parsed.summary || "Call completed.",
      sentiment,
      outcome,
      callerName: parsed.callerName || null,
      serviceRequested: parsed.serviceRequested || null,
    };
  } catch {
    return { summary: "Call completed.", sentiment: "neutral", outcome: "unknown", callerName: null, serviceRequested: null };
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

    const { summary, sentiment, outcome, callerName, serviceRequested } = await generateSummary(transcript);

    await db.update(calls).set({
      summary,
      sentiment,
      outcome,
      transcript,
      updatedAt: new Date().toISOString(),
    }).where(eq(calls.id, callId));

    console.log("Call summary generated:", { callId, sentiment, outcome, lines: transcript.length });

    // Trigger QA scoring (fire-and-forget) — use data already in memory
    const [callRecord] = await db.select().from(calls).where(eq(calls.id, callId)).limit(1);
    if (callRecord) {
      const [biz] = await db.select().from(businesses).where(eq(businesses.id, callRecord.businessId)).limit(1);
      if (biz) {
        triggerQaIfNewClient(
          { ...callRecord, transcript, summary, sentiment },
          biz,
        ).catch((err) => {
          reportError("QA trigger failed", err, { extra: { callId } });
        });
      }
    }

    // CRM pipeline: upsert customer + auto-create estimate (fire-and-forget)
    import("@/lib/crm/customer-upsert").then(({ upsertCustomerFromCall }) => {
      upsertCustomerFromCall(callId, { callerName, serviceRequested }).catch((err) => {
        reportError("Customer upsert failed", err, { extra: { callId } });
      });
    });

    if (outcome === "estimate_requested") {
      import("@/lib/crm/estimate-auto-create").then(({ autoCreateEstimate }) => {
        autoCreateEstimate(callId, serviceRequested).catch((err) => {
          reportError("Auto-create estimate failed", err, { extra: { callId } });
        });
      });
    }

    // Generate job card from completed intake + notify owner (fire-and-forget)
    import("@/lib/estimates/job-card").then(async ({ buildJobCard }) => {
      const { jobIntakes } = await import("@/db/schema");
      const { and: drizzleAnd, eq: drizzleEq } = await import("drizzle-orm");
      const [intake] = await db
        .select()
        .from(jobIntakes)
        .where(drizzleAnd(drizzleEq(jobIntakes.callId, callId), drizzleEq(jobIntakes.intakeComplete, true)))
        .limit(1);
      if (!intake) return; // No completed intake = no job card

      const card = await buildJobCard({
        businessId: callRecord!.businessId,
        callId,
        jobIntakeId: intake.id,
        leadId: callRecord!.leadId || undefined,
        callerName: callerName || undefined,
      });

      // Send job card SMS to owner for quick-response
      if (card) {
        const { sendJobCardToOwner } = await import("@/lib/notifications/owner-job-card");
        await sendJobCardToOwner(card.id);
      }
    }).catch((err) => {
      reportError("Job card generation failed", err, { extra: { callId } });
    });

    // Send rich owner SMS alert now that we have the summary (fire-and-forget)
    sendOwnerCallAlert(callId).catch((err) => {
      reportError("Post-call owner alert failed", err, { extra: { callId } });
    });

    // Send missed-call text-back to caller if applicable (fire-and-forget)
    sendMissedCallTextBack(callId).catch((err) => {
      reportError("Missed call text-back failed", err, { extra: { callId } });
    });

    return { summary, sentiment, outcome, callerName, serviceRequested, transcript };
  } catch (error) {
    reportError("Failed to generate call summary", error, {
      extra: { callId, chatId },
    });
    return null;
  }
}
