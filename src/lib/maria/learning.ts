import { db } from "@/db";
import { knowledgeGaps, businesses, receptionistCustomResponses } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { sendSMS } from "@/lib/twilio/sms";
import { reportError } from "@/lib/error-reporting";

interface KnowledgeGap {
  question: string;
  aiResponse: string;
}

/**
 * Process knowledge gaps extracted from a call summary.
 * Stores them in the DB and notifies the owner via SMS during week 1.
 */
export async function processKnowledgeGaps(
  businessId: string,
  callId: string,
  gaps: KnowledgeGap[],
): Promise<void> {
  if (gaps.length === 0) return;

  const [biz] = await db
    .select({
      ownerPhone: businesses.ownerPhone,
      twilioNumber: businesses.twilioNumber,
      receptionistName: businesses.receptionistName,
      ownerName: businesses.ownerName,
      createdAt: businesses.createdAt,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz) return;

  const daysSinceSignup = Math.floor(
    (Date.now() - new Date(biz.createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  const receptionistName = biz.receptionistName || "Maria";

  for (const gap of gaps) {
    // Store the gap
    const [inserted] = await db
      .insert(knowledgeGaps)
      .values({
        businessId,
        callId,
        question: gap.question,
        aiResponse: gap.aiResponse,
        status: "pending",
      })
      .returning({ id: knowledgeGaps.id });

    if (!inserted) continue;

    // During first 7 days: immediate SMS notification for each gap
    // After that: gaps are batched into daily summaries
    if (daysSinceSignup <= 7 && biz.ownerPhone && biz.twilioNumber) {
      const message =
        `Hey! A customer just asked: "${gap.question}" and I wasn't sure how to answer. ` +
        `What should I say next time? Just text me back and I'll remember it! — ${receptionistName}`;

      try {
        await sendSMS({
          to: biz.ownerPhone,
          from: biz.twilioNumber,
          body: message,
          businessId,
          templateType: "owner_notify",
        });

        await db
          .update(knowledgeGaps)
          .set({ status: "asked", askedAt: new Date().toISOString() })
          .where(eq(knowledgeGaps.id, inserted.id));
      } catch (err) {
        reportError("[learning] Failed to send gap SMS", err, {
          extra: { businessId, gapId: inserted.id },
        });
      }
    }
  }
}

/**
 * Check if an owner's SMS reply is answering a knowledge gap question.
 * If so, auto-create a custom response.
 *
 * Returns true if the message was handled as a learning response.
 */
export async function handleLearningResponse(
  businessId: string,
  messageBody: string,
): Promise<boolean> {
  // Find the most recent "asked" gap for this business
  const [pendingGap] = await db
    .select()
    .from(knowledgeGaps)
    .where(
      and(
        eq(knowledgeGaps.businessId, businessId),
        eq(knowledgeGaps.status, "asked"),
      ),
    )
    .orderBy(desc(knowledgeGaps.askedAt))
    .limit(1);

  if (!pendingGap) return false;

  // Heuristic: if the asked gap is less than 24h old, treat the reply as an answer
  if (pendingGap.askedAt) {
    const hoursSinceAsked =
      (Date.now() - new Date(pendingGap.askedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceAsked > 24) return false;
  }

  // Auto-create a custom response (FAQ category)
  const [customResponse] = await db
    .insert(receptionistCustomResponses)
    .values({
      businessId,
      category: "faq",
      triggerText: pendingGap.question,
      responseText: messageBody.trim(),
    })
    .returning({ id: receptionistCustomResponses.id });

  // Update the gap record
  await db
    .update(knowledgeGaps)
    .set({
      status: "answered",
      ownerResponse: messageBody.trim(),
      customResponseId: customResponse?.id || null,
      answeredAt: new Date().toISOString(),
    })
    .where(eq(knowledgeGaps.id, pendingGap.id));

  // Send confirmation SMS
  const [biz] = await db
    .select({
      ownerPhone: businesses.ownerPhone,
      twilioNumber: businesses.twilioNumber,
      receptionistName: businesses.receptionistName,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (biz?.ownerPhone && biz?.twilioNumber) {
    const receptionistName = biz.receptionistName || "Maria";
    const preview =
      messageBody.trim().length > 100
        ? messageBody.trim().slice(0, 97) + "..."
        : messageBody.trim();

    await sendSMS({
      to: biz.ownerPhone,
      from: biz.twilioNumber,
      body: `Got it! Next time someone asks "${pendingGap.question}", I'll say: "${preview}" — ${receptionistName}`,
      businessId,
      templateType: "owner_notify",
    }).catch((err) =>
      reportError("[learning] Confirmation SMS failed", err, { extra: { businessId } }),
    );
  }

  return true;
}

/**
 * Get pending knowledge gaps for daily summary batching (used after week 1).
 */
export async function getPendingGapsForSummary(
  businessId: string,
): Promise<Array<{ id: string; question: string }>> {
  return db
    .select({ id: knowledgeGaps.id, question: knowledgeGaps.question })
    .from(knowledgeGaps)
    .where(
      and(
        eq(knowledgeGaps.businessId, businessId),
        eq(knowledgeGaps.status, "pending"),
      ),
    )
    .orderBy(desc(knowledgeGaps.createdAt))
    .limit(10);
}
