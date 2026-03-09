import { db } from "@/db";
import {
  businesses,
  jobCards,
  ownerResponses,
  customerNotifications,
  leads,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { normalizePhone } from "@/lib/compliance/sms";
import { sendSMS } from "@/lib/twilio/sms";
import { env } from "@/lib/env";
import { reportError } from "@/lib/error-reporting";
import { logActivity } from "@/lib/activity";

interface OwnerReplyResult {
  handled: boolean;
  action?: "confirm" | "adjust" | "site_visit" | "unknown";
  jobCardId?: string;
  responseMessage?: string;
}

/**
 * Detect if an inbound SMS is from a business owner replying to a job card notification.
 * Must be called BEFORE other keyword handlers in the webhook.
 */
export async function detectOwnerReply(
  fromPhone: string,
  toPhone: string,
  body: string,
): Promise<OwnerReplyResult> {
  const normalizedFrom = normalizePhone(fromPhone);

  // Find a business where the owner's phone matches the sender AND the Twilio number matches the recipient
  const allBiz = await db
    .select({
      id: businesses.id,
      ownerPhone: businesses.ownerPhone,
      name: businesses.name,
      receptionistName: businesses.receptionistName,
      twilioNumber: businesses.twilioNumber,
    })
    .from(businesses)
    .where(eq(businesses.active, true));

  const normalizedTo = normalizePhone(toPhone);
  const matchedBiz = allBiz.find((b) => {
    const normalizedOwner = normalizePhone(b.ownerPhone);
    return normalizedOwner === normalizedFrom && normalizePhone(b.twilioNumber) === normalizedTo;
  });

  if (!matchedBiz) return { handled: false };

  // Find the most recent pending job card for this business
  const [pendingCard] = await db
    .select()
    .from(jobCards)
    .where(
      and(
        eq(jobCards.businessId, matchedBiz.id),
        eq(jobCards.status, "pending_review"),
      ),
    )
    .orderBy(desc(jobCards.createdAt))
    .limit(1);

  // Also check for awaiting_adjustment cards (owner replying with a price after "2")
  if (!pendingCard) {
    const [adjustingCard] = await db
      .select()
      .from(jobCards)
      .where(
        and(
          eq(jobCards.businessId, matchedBiz.id),
          eq(jobCards.status, "awaiting_adjustment"),
        ),
      )
      .orderBy(desc(jobCards.createdAt))
      .limit(1);

    if (adjustingCard) {
      return handleAdjustmentReply(matchedBiz, adjustingCard, body);
    }

    return { handled: false };
  }

  // Parse the reply
  const parsed = parseOwnerReply(body);

  if (parsed.action === "unknown") {
    return { handled: false };
  }

  return handleOwnerReply(matchedBiz, pendingCard, parsed, body);
}

interface ParsedReply {
  action: "confirm" | "adjust" | "site_visit" | "unknown";
  amount?: number;
  amountMax?: number;
}

/**
 * Parse owner's SMS reply to determine action.
 */
export function parseOwnerReply(body: string): ParsedReply {
  const trimmed = body.trim();

  // Exact "1" = confirm
  if (trimmed === "1") return { action: "confirm" };

  // Exact "2" = adjust (will prompt for amount)
  if (trimmed === "2") return { action: "adjust" };

  // Exact "3" = schedule site visit
  if (trimmed === "3") return { action: "site_visit" };

  // Natural language detection
  const lower = trimmed.toLowerCase();

  if (/^(confirm|yes|ok|approved?|good|looks good|send it|go ahead)/i.test(lower)) {
    return { action: "confirm" };
  }

  if (/^(adjust|change|update|modify|too (high|low))/i.test(lower)) {
    return { action: "adjust" };
  }

  if (/^(visit|site visit|schedule|inspect|look at)/i.test(lower)) {
    return { action: "site_visit" };
  }

  // Check if it's a dollar amount (could be an adjustment reply)
  const amount = parseAmountOrRange(trimmed);
  if (amount) {
    return { action: "adjust", amount: amount.min, amountMax: amount.max };
  }

  return { action: "unknown" };
}

/**
 * Parse a dollar amount or range from text.
 * Handles: "$500", "500", "$500-$800", "500-800", "$1,500", "$1.5k"
 */
export function parseAmountOrRange(text: string): { min: number; max?: number } | null {
  const cleaned = text.trim();

  // Range pattern: "$500-$800", "500 - 800", "$500–$800"
  const rangeMatch = cleaned.match(
    /^\$?([\d,]+(?:\.\d+)?k?)\s*[-–—to]+\s*\$?([\d,]+(?:\.\d+)?k?)\s*$/i,
  );
  if (rangeMatch) {
    const min = parseNumber(rangeMatch[1]);
    const max = parseNumber(rangeMatch[2]);
    if (min != null && max != null && min > 0 && max >= min) {
      return { min, max };
    }
  }

  // Single amount: "$500", "500", "$1,500", "1.5k"
  const singleMatch = cleaned.match(/^\$?([\d,]+(?:\.\d+)?k?)\s*$/i);
  if (singleMatch) {
    const amount = parseNumber(singleMatch[1]);
    if (amount != null && amount > 0) {
      return { min: amount };
    }
  }

  return null;
}

function parseNumber(str: string): number | null {
  const cleaned = str.replace(/,/g, "");
  if (cleaned.toLowerCase().endsWith("k")) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? null : num * 1000;
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

async function handleOwnerReply(
  biz: { id: string; name: string; receptionistName: string | null; twilioNumber: string },
  card: typeof jobCards.$inferSelect,
  parsed: ParsedReply,
  rawReply: string,
): Promise<OwnerReplyResult> {
  const receptionistName = biz.receptionistName || "Maria";
  let responseMessage = "";

  try {
    switch (parsed.action) {
      case "confirm": {
        // Update job card status
        await db.update(jobCards).set({
          status: "confirmed",
          ownerResponse: "confirmed",
          ownerRespondedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).where(eq(jobCards.id, card.id));

        // Log owner response
        await db.insert(ownerResponses).values({
          businessId: biz.id,
          jobCardId: card.id,
          direction: "inbound",
          messageType: "confirm_reply",
          rawReply,
          parsedAction: "confirm",
        });

        // Send customer notification
        await sendCustomerNotification(biz, card, "estimate_confirmed", receptionistName);

        responseMessage = `Confirmed! ${receptionistName} will notify the customer with your estimate range.`;

        await logActivity({
          type: "owner_response",
          entityType: "job_card",
          entityId: card.id,
          title: "Owner confirmed job card estimate",
          detail: `Owner confirmed estimate for ${card.callerName || "caller"}.`,
        });

        break;
      }

      case "adjust": {
        if (parsed.amount) {
          // Owner sent "2" with an amount inline, or just a dollar amount
          const adjustedMin = parsed.amount;
          const adjustedMax = parsed.amountMax || Math.round(parsed.amount * 1.2);

          await db.update(jobCards).set({
            status: "adjusted",
            ownerResponse: "adjusted",
            ownerAdjustedMin: adjustedMin,
            ownerAdjustedMax: adjustedMax,
            ownerRespondedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }).where(eq(jobCards.id, card.id));

          await db.insert(ownerResponses).values({
            businessId: biz.id,
            jobCardId: card.id,
            direction: "inbound",
            messageType: "adjust_reply",
            rawReply,
            parsedAction: "adjust",
            parsedAmount: adjustedMin,
          });

          await sendCustomerNotification(biz, card, "estimate_adjusted", receptionistName, adjustedMin, adjustedMax);

          responseMessage = `Got it! Updated estimate to $${adjustedMin.toLocaleString()}–$${adjustedMax.toLocaleString()}. ${receptionistName} will notify the customer.`;

          await logActivity({
            type: "owner_response",
            entityType: "job_card",
            entityId: card.id,
            title: "Owner adjusted estimate",
            detail: `Adjusted to $${adjustedMin.toLocaleString()}–$${adjustedMax.toLocaleString()}.`,
          });
        } else {
          // Owner replied "2" without amount — ask for the adjusted price
          await db.update(jobCards).set({
            status: "awaiting_adjustment",
            updatedAt: new Date().toISOString(),
          }).where(eq(jobCards.id, card.id));

          await db.insert(ownerResponses).values({
            businessId: biz.id,
            jobCardId: card.id,
            direction: "inbound",
            messageType: "adjust_reply",
            rawReply,
            parsedAction: "adjust",
          });

          responseMessage = "What's your adjusted estimate? Reply with a dollar amount (e.g. $800) or range (e.g. $800-$1200).";
        }
        break;
      }

      case "site_visit": {
        await db.update(jobCards).set({
          status: "site_visit_requested",
          ownerResponse: "site_visit",
          ownerRespondedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).where(eq(jobCards.id, card.id));

        await db.insert(ownerResponses).values({
          businessId: biz.id,
          jobCardId: card.id,
          direction: "inbound",
          messageType: "site_visit_reply",
          rawReply,
          parsedAction: "site_visit",
        });

        await sendCustomerNotification(biz, card, "site_visit_scheduled", receptionistName);

        responseMessage = `Site visit noted! ${receptionistName} will let the customer know you'll be reaching out to schedule an on-site assessment.`;

        await logActivity({
          type: "owner_response",
          entityType: "job_card",
          entityId: card.id,
          title: "Owner requested site visit",
          detail: `Site visit requested for ${card.callerName || "caller"}.`,
        });

        break;
      }

      default:
        return { handled: false };
    }

    return {
      handled: true,
      action: parsed.action,
      jobCardId: card.id,
      responseMessage,
    };
  } catch (err) {
    reportError("handleOwnerReply failed", err, { extra: { jobCardId: card.id, businessId: biz.id } });
    return { handled: false };
  }
}

/**
 * Handle a follow-up reply from an owner who previously said "2" (adjust).
 * Expects a dollar amount or range.
 */
async function handleAdjustmentReply(
  biz: { id: string; name: string; receptionistName: string | null; twilioNumber: string },
  card: typeof jobCards.$inferSelect,
  body: string,
): Promise<OwnerReplyResult> {
  const receptionistName = biz.receptionistName || "Maria";
  const amount = parseAmountOrRange(body.trim());

  if (!amount) {
    // Still not a valid amount — nudge again
    return {
      handled: true,
      action: "unknown",
      jobCardId: card.id,
      responseMessage: "Please reply with a dollar amount (e.g. $800) or range (e.g. $800-$1200) for this job.",
    };
  }

  const adjustedMin = amount.min;
  const adjustedMax = amount.max || Math.round(amount.min * 1.2);

  try {
    await db.update(jobCards).set({
      status: "adjusted",
      ownerResponse: "adjusted",
      ownerAdjustedMin: adjustedMin,
      ownerAdjustedMax: adjustedMax,
      ownerRespondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).where(eq(jobCards.id, card.id));

    await db.insert(ownerResponses).values({
      businessId: biz.id,
      jobCardId: card.id,
      direction: "inbound",
      messageType: "adjust_reply",
      rawReply: body,
      parsedAction: "adjust",
      parsedAmount: adjustedMin,
    });

    await sendCustomerNotification(biz, card, "estimate_adjusted", receptionistName, adjustedMin, adjustedMax);

    const responseMessage = `Got it! Updated estimate to $${adjustedMin.toLocaleString()}–$${adjustedMax.toLocaleString()}. ${receptionistName} will notify the customer.`;

    await logActivity({
      type: "owner_response",
      entityType: "job_card",
      entityId: card.id,
      title: "Owner adjusted estimate",
      detail: `Adjusted to $${adjustedMin.toLocaleString()}–$${adjustedMax.toLocaleString()}.`,
    });

    return {
      handled: true,
      action: "adjust",
      jobCardId: card.id,
      responseMessage,
    };
  } catch (err) {
    reportError("handleAdjustmentReply failed", err, { extra: { jobCardId: card.id } });
    return { handled: false };
  }
}

/**
 * Send a follow-up notification to the customer after owner responds.
 */
async function sendCustomerNotification(
  biz: { id: string; name: string; receptionistName: string | null; twilioNumber: string },
  card: typeof jobCards.$inferSelect,
  type: "estimate_confirmed" | "estimate_adjusted" | "site_visit_scheduled",
  receptionistName: string,
  adjustedMin?: number,
  adjustedMax?: number,
): Promise<void> {
  // Need caller phone to notify customer
  if (!card.callerPhone) return;

  // Check if customer has a lead record for compliance
  let leadId: string | undefined;
  if (card.leadId) {
    const [lead] = await db
      .select({ id: leads.id, smsOptOut: leads.smsOptOut })
      .from(leads)
      .where(eq(leads.id, card.leadId))
      .limit(1);
    if (lead?.smsOptOut) return; // Customer opted out
    leadId = lead?.id;
  }

  const callerName = card.callerName || "there";
  const jobDesc = card.scopeDescription || card.jobTypeLabel || "your project";
  const fromNumber = biz.twilioNumber || env.TWILIO_PHONE_NUMBER;
  let message: string;

  switch (type) {
    case "estimate_confirmed": {
      const min = card.estimateMin;
      const max = card.estimateMax;
      const range = min != null && max != null
        ? `$${min.toLocaleString()}–$${max.toLocaleString()}`
        : "your estimate";
      message = `Hi ${callerName}! ${biz.name} reviewed your request for ${jobDesc} and confirmed the estimate of ${range}. They'll be in touch to schedule. Reply STOP to opt out.`;
      break;
    }
    case "estimate_adjusted": {
      const min = adjustedMin || card.ownerAdjustedMin;
      const max = adjustedMax || card.ownerAdjustedMax;
      const range = min != null && max != null
        ? `$${min.toLocaleString()}–$${max.toLocaleString()}`
        : "a custom estimate";
      message = `Hi ${callerName}! ${biz.name} reviewed your request for ${jobDesc}. Updated estimate: ${range}. They'll follow up to schedule. Reply STOP to opt out.`;
      break;
    }
    case "site_visit_scheduled": {
      message = `Hi ${callerName}! ${biz.name} would like to schedule a site visit for ${jobDesc} to give you an accurate quote. They'll reach out shortly to arrange a time. Reply STOP to opt out.`;
      break;
    }
  }

  // Truncate for SMS safety
  if (message.length > 300) {
    message = message.slice(0, 297) + "...";
  }

  try {
    const result = await sendSMS({
      to: card.callerPhone,
      from: fromNumber,
      body: message,
      businessId: biz.id,
      leadId,
      templateType: "estimate_follow_up",
    });

    if (result.success) {
      await db.insert(customerNotifications).values({
        businessId: biz.id,
        jobCardId: card.id,
        leadId: leadId || null,
        notificationType: type,
        recipientPhone: card.callerPhone,
        messageText: message,
        twilioSid: result.sid,
      });

      // Update job card with notification timestamp
      await db.update(jobCards).set({
        customerNotifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).where(eq(jobCards.id, card.id));
    }
  } catch (err) {
    reportError("sendCustomerNotification failed", err, {
      extra: { jobCardId: card.id, type },
    });
  }
}
