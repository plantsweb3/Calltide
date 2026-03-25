import { getAnthropic, HAIKU_MODEL } from "@/lib/ai/client";
import { db } from "@/db";
import { calls, customers, businesses } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
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
  sentiment: "positive" | "neutral" | "negative" | "frustrated" | "confused";
  outcome: CallOutcome;
  callerName: string | null;
  serviceRequested: string | null;
  transcript: TranscriptLine[];
}

/**
 * Use Claude to generate a summary and sentiment from a call transcript.
 */
interface KnowledgeGap {
  question: string;
  aiResponse: string;
}

interface GeneratedSummary {
  summary: string;
  sentiment: "positive" | "neutral" | "negative" | "frustrated" | "confused";
  outcome: CallOutcome;
  callerName: string | null;
  serviceRequested: string | null;
  knowledgeGaps: KnowledgeGap[];
}

/**
 * Detect language from transcript text using common Spanish indicators.
 * Returns "es" if majority of caller lines contain Spanish, "en" otherwise.
 */
function detectTranscriptLanguage(transcript: TranscriptLine[]): "en" | "es" {
  const callerLines = transcript.filter((l) => l.speaker === "caller").map((l) => l.text.toLowerCase());
  if (callerLines.length < 2) return "en";

  const spanishIndicators = [
    "hola", "gracias", "por favor", "necesito", "quiero", "tengo", "puede",
    "cita", "ayuda", "problema", "emergencia", "buenos días", "buenas tardes",
    "sí", "no puedo", "dónde", "cuándo", "cuánto", "servicio", "teléfono",
    "dirección", "nombre", "llamar", "mensaje", "urgente", "agua", "fuego",
  ];

  let spanishCount = 0;
  for (const line of callerLines) {
    if (spanishIndicators.some((ind) => line.includes(ind))) {
      spanishCount++;
    }
  }

  const ratio = spanishCount / callerLines.length;
  return ratio >= 0.5 ? "es" : "en";
}

async function generateSummary(transcript: TranscriptLine[], language?: "en" | "es"): Promise<GeneratedSummary> {
  const anthropic = getAnthropic();

  const transcriptText = transcript
    .map((line) => `${line.speaker === "ai" ? "AI" : "Caller"}: ${line.text}`)
    .join("\n");

  const detectedLang = language || detectTranscriptLanguage(transcript);
  const languageNote = detectedLang === "es"
    ? "\n\nIMPORTANT: This call was conducted in Spanish. Note this in the summary (e.g. 'Call was conducted in Spanish.'). Still write all output in English for dashboard readability."
    : "";

  const response = await anthropic.messages.create({
    model: process.env.CLAUDE_MODEL ?? HAIKU_MODEL,
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Analyze this phone call transcript between an AI receptionist and a caller. Extract:${languageNote}

1. A concise 1-3 sentence summary of what happened.
2. The overall caller sentiment: "positive", "neutral", "negative", "frustrated", or "confused".
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
6. Knowledge gaps — questions the caller asked where the AI was unsure or couldn't provide a definitive answer. Look for phrases like "I'll have to check on that", "I'm not sure about that", "let me have the owner get back to you", "I don't have that information", or any hedging/deflection. Return each gap as {question, aiResponse} — the caller's actual question and the AI's uncertain response. Empty array if none.

Respond in this exact JSON format only, no other text:
{"summary":"...","sentiment":"positive|neutral|negative|frustrated|confused","outcome":"appointment_booked|estimate_requested|message_taken|transfer|info_only|spam|unknown","callerName":"string or null","serviceRequested":"string or null","knowledgeGaps":[{"question":"...","aiResponse":"..."}]}

Transcript:
${transcriptText}`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text);
    const sentiment = ["positive", "neutral", "negative", "frustrated", "confused"].includes(parsed.sentiment)
      ? parsed.sentiment
      : "neutral";
    const validOutcomes: CallOutcome[] = ["appointment_booked", "estimate_requested", "message_taken", "transfer", "info_only", "spam", "unknown"];
    const outcome = validOutcomes.includes(parsed.outcome) ? parsed.outcome : "unknown";

    // Parse knowledge gaps
    const knowledgeGaps: KnowledgeGap[] = [];
    if (Array.isArray(parsed.knowledgeGaps)) {
      for (const gap of parsed.knowledgeGaps) {
        if (gap?.question && typeof gap.question === "string") {
          knowledgeGaps.push({
            question: gap.question.slice(0, 500),
            aiResponse: typeof gap.aiResponse === "string" ? gap.aiResponse.slice(0, 500) : "",
          });
        }
      }
    }

    return {
      summary: parsed.summary || "Call completed.",
      sentiment,
      outcome,
      callerName: parsed.callerName || null,
      serviceRequested: parsed.serviceRequested || null,
      knowledgeGaps,
    };
  } catch {
    return { summary: "Call completed.", sentiment: "neutral", outcome: "unknown", callerName: null, serviceRequested: null, knowledgeGaps: [] };
  }
}

/**
 * Process a completed call: generate summary from transcript, update DB.
 * Accepts transcript directly (from ElevenLabs post-call webhook).
 * Falls back gracefully if transcript not provided.
 */
export async function processCallSummary(
  callId: string,
  conversationId: string,
  providedTranscript?: TranscriptLine[],
  language?: "en" | "es",
): Promise<SummaryResult | null> {
  try {
    let transcript: TranscriptLine[];

    if (providedTranscript && providedTranscript.length > 0) {
      transcript = providedTranscript;
    } else {
      // Legacy: try fetching from ElevenLabs conversation API
      try {
        const { getElevenLabsClient } = await import("@/lib/elevenlabs/client");
        const client = getElevenLabsClient();
        const conversation = await client.conversationalAi.getConversation(conversationId);
        transcript = (conversation.transcript || []).map((entry) => ({
          speaker: (entry.role === "agent" ? "ai" : "caller") as "ai" | "caller",
          text: entry.message || "",
        }));
      } catch {
        // If ElevenLabs fetch also fails, return null
        console.log("No transcript available for call", { callId, conversationId });
        return null;
      }
    }

    if (transcript.length === 0) {
      console.log("No transcript found for call", { callId, conversationId });
      return null;
    }

    const { summary, sentiment, outcome, callerName, serviceRequested, knowledgeGaps } = await generateSummary(transcript, language);

    await db.update(calls).set({
      summary,
      sentiment,
      outcome,
      transcript,
      updatedAt: new Date().toISOString(),
    }).where(eq(calls.id, callId));

    console.log("Call summary generated:", { callId, sentiment, outcome, lines: transcript.length });

    // Fire webhook (fire-and-forget)
    const [callForWebhook] = await db.select({ businessId: calls.businessId, duration: calls.duration }).from(calls).where(eq(calls.id, callId)).limit(1);
    if (callForWebhook) {
      import("@/lib/webhooks/dispatcher").then(({ dispatchWebhook }) => {
        dispatchWebhook(callForWebhook.businessId, "call.completed", {
          callId,
          summary,
          sentiment,
          outcome,
          callerName,
          serviceRequested,
          duration: callForWebhook.duration,
          transcriptLines: transcript.length,
        }).catch(() => {});
      }).catch(() => {});
    }

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

    // Store knowledge gaps and notify owner (fire-and-forget)
    if (knowledgeGaps.length > 0 && callRecord) {
      import("@/lib/maria/learning").then(({ processKnowledgeGaps }) => {
        processKnowledgeGaps(callRecord.businessId, callId, knowledgeGaps).catch((err) => {
          reportError("Knowledge gap processing failed", err, { extra: { callId } });
        });
      }).catch(() => {});
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
    if (callRecord) {
      const cr = callRecord; // capture for closure safety
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
          businessId: cr.businessId,
          callId,
          jobIntakeId: intake.id,
          leadId: cr.leadId || undefined,
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
    }

    // Enqueue photo request with 2-minute delay (persistent, survives process restarts)
    // Only for genuine leads with completed intakes
    if (outcome !== "spam" && outcome !== "info_only" && callRecord?.callerPhone) {
      const crForPhoto = callRecord; // capture for closure safety
      import("@/lib/jobs/queue").then(({ enqueueJob }) => {
        enqueueJob("photo_request", {
          businessId: crForPhoto.businessId,
          callId,
          callerPhone: crForPhoto.callerPhone || "",
          callerName: callerName || null,
        }, 3, 2 * 60 * 1000).catch((err) => { // 3 attempts, 2-min delay
          reportError("Failed to enqueue photo request", err, { extra: { callId } });
        });
      }).catch(() => {});
    }

    // Send rich owner SMS alert now that we have the summary (fire-and-forget)
    // Suppress SMS during owner quiet hours
    (async () => {
      try {
        if (callRecord) {
          const { isOwnerInQuietHours } = await import("@/lib/notifications/quiet-hours");
          const [bizForQuiet] = await db
            .select({
              ownerQuietHoursStart: businesses.ownerQuietHoursStart,
              ownerQuietHoursEnd: businesses.ownerQuietHoursEnd,
              timezone: businesses.timezone,
            })
            .from(businesses)
            .where(eq(businesses.id, callRecord.businessId))
            .limit(1);
          if (bizForQuiet && isOwnerInQuietHours(bizForQuiet)) return;
        }
        await sendOwnerCallAlert(callId);
      } catch (err) {
        reportError("Post-call owner alert failed", err, { extra: { callId } });
      }
    })();

    // Send missed-call text-back to caller if applicable (fire-and-forget)
    sendMissedCallTextBack(callId).catch((err) => {
      reportError("Missed call text-back failed", err, { extra: { callId } });
    });

    // Complaint tracking: increment complaint count on negative sentiment (fire-and-forget)
    if (sentiment === "negative" && callRecord?.customerId) {
      (async () => {
        try {
          // Increment complaint count first
          await db.update(customers)
            .set({
              complaintCount: sql`COALESCE(${customers.complaintCount}, 0) + 1`,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(customers.id, callRecord.customerId!));

          // Read updated count for alert (after increment)
          if (callRecord.businessId) {
            const [cust] = await db
              .select({ complaintCount: customers.complaintCount, name: customers.name })
              .from(customers)
              .where(eq(customers.id, callRecord.customerId!))
              .limit(1);

            if (cust && (cust.complaintCount || 0) >= 2) {
              const [biz] = await db
                .select({
                  ownerPhone: businesses.ownerPhone,
                  twilioNumber: businesses.twilioNumber,
                  ownerQuietHoursStart: businesses.ownerQuietHoursStart,
                  ownerQuietHoursEnd: businesses.ownerQuietHoursEnd,
                  timezone: businesses.timezone,
                })
                .from(businesses)
                .where(eq(businesses.id, callRecord.businessId))
                .limit(1);

              if (biz) {
                // Suppress complaint SMS during owner quiet hours
                const { isOwnerInQuietHours } = await import("@/lib/notifications/quiet-hours");
                if (!isOwnerInQuietHours(biz)) {
                  const { sendSMS: sendAlert } = await import("@/lib/twilio/sms");
                  await sendAlert({
                    to: biz.ownerPhone,
                    from: biz.twilioNumber,
                    body: `Complaint alert: ${cust.name || "A customer"} has had ${cust.complaintCount} negative interactions. Consider a personal follow-up.`,
                    businessId: callRecord.businessId,
                    templateType: "owner_notify",
                  });
                }
              }
            }
          }
        } catch (err) {
          reportError("Complaint tracking failed", err, { extra: { callId } });
        }
      })();
    }

    return { summary, sentiment, outcome, callerName, serviceRequested, transcript };
  } catch (error) {
    reportError("Failed to generate call summary", error, {
      extra: { callId, conversationId },
    });
    return null;
  }
}
