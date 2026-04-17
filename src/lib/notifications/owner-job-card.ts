import { db } from "@/db";
import { businesses, jobCards, ownerResponses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendSMS } from "@/lib/twilio/sms";
import { env } from "@/lib/env";
import { reportError } from "@/lib/error-reporting";
import { formatJobCardSMS, type JobCard } from "@/lib/estimates/job-card";

/**
 * Send a job card SMS to the business owner for quick-response.
 * Returns true if sent successfully, false otherwise.
 */
export async function sendJobCardToOwner(jobCardId: string): Promise<boolean> {
  const [card] = await db
    .select()
    .from(jobCards)
    .where(eq(jobCards.id, jobCardId))
    .limit(1);

  if (!card) {
    reportError("sendJobCardToOwner: job card not found", null, { extra: { jobCardId } });
    return false;
  }

  // Don't send duplicate notifications
  if (card.status !== "pending_review") return false;

  const [biz] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, card.businessId))
    .limit(1);

  if (!biz || !biz.ownerPhone) {
    reportError("sendJobCardToOwner: business or owner phone not found", null, {
      extra: { jobCardId, businessId: card.businessId },
    });
    return false;
  }

  // Respect quiet hours — don't text owner between 9 PM and 7 AM
  if (biz.timezone) {
    const localHour = parseInt(
      new Date().toLocaleTimeString("en-US", { hour: "2-digit", hour12: false, timeZone: biz.timezone }),
      10,
    );
    if (localHour >= 21 || localHour < 7) return false;
  }

  const receptionistName = biz.receptionistName || "Maria";
  const lang = biz.defaultLanguage === "es" ? "es" : "en";
  const smsBody = formatJobCardSMS(card as unknown as JobCard, receptionistName, "normal", lang);
  const fromNumber = biz.twilioNumber || env.TWILIO_PHONE_NUMBER;

  try {
    const result = await sendSMS({
      to: biz.ownerPhone,
      from: fromNumber,
      body: smsBody,
      businessId: biz.id,
      templateType: "owner_notify",
    });

    if (result.success) {
      // Log the outbound notification
      await db.insert(ownerResponses).values({
        businessId: biz.id,
        jobCardId: card.id,
        direction: "outbound",
        messageType: "job_card_notify",
        messageText: smsBody,
        twilioSid: result.sid,
      });

      return true;
    }

    return false;
  } catch (err) {
    reportError("sendJobCardToOwner: SMS send failed", err, {
      extra: { jobCardId, businessId: biz.id },
    });
    return false;
  }
}
