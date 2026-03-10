import { db } from "@/db";
import { businesses, outreachLog } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { aggregateDailyDigest } from "./aggregator";
import { formatDigestSMS, formatDigestEmail } from "./formatter";
import { sendSMS } from "@/lib/twilio/sms";
import { env } from "@/lib/env";
import { getResend } from "@/lib/email/client";
import { reportError } from "@/lib/error-reporting";
import { getBusinessDateRange } from "@/lib/timezone";

/**
 * Send the daily digest to a single business.
 */
export async function sendDailyDigest(businessId: string): Promise<boolean> {
  const [biz] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!biz) return false;

  // Respect preference
  if (biz.digestPreference === "none") return false;

  const tz = biz.timezone || "America/Chicago";
  const receptionistName = biz.receptionistName || "Maria";
  const ownerName = biz.ownerName?.split(" ")[0] || "there";

  // Check double-send: don't send if already sent today
  if (biz.lastDigestSentAt) {
    const todayRange = getBusinessDateRange(tz, 0);
    if (biz.lastDigestSentAt >= todayRange.start && biz.lastDigestSentAt < todayRange.end) {
      return false; // Already sent today
    }
  }

  // Aggregate data
  const data = await aggregateDailyDigest(businessId, tz);
  const preference = biz.digestPreference || "sms";
  let smsSent = false;
  let emailSent = false;

  // Send SMS
  if ((preference === "sms" || preference === "both") && biz.ownerPhone) {
    try {
      const smsBody = formatDigestSMS(data, biz.name, ownerName, receptionistName);
      const result = await sendSMS({
        to: biz.ownerPhone,
        from: biz.twilioNumber || env.TWILIO_PHONE_NUMBER,
        body: smsBody,
        businessId: biz.id,
        templateType: "owner_notify",
      });
      smsSent = result.success === true;
    } catch (err) {
      reportError("[daily-digest] SMS send failed", err, { extra: { businessId } });
    }
  }

  // Send email
  if ((preference === "email" || preference === "both") && biz.ownerEmail) {
    try {
      const { subject, html } = formatDigestEmail(data, biz.name, ownerName, receptionistName);
      const resend = getResend();
      const from = env.OUTREACH_FROM_EMAIL ?? "Capta <hello@contact.capta.app>";
      await resend.emails.send({
        from,
        replyTo: "hello@capta.app",
        to: biz.ownerEmail,
        subject,
        html,
      });
      emailSent = true;
    } catch (err) {
      reportError("[daily-digest] Email send failed", err, { extra: { businessId } });
    }
  }

  if (smsSent || emailSent) {
    // Update last digest sent timestamp
    await db.update(businesses).set({
      lastDigestSentAt: new Date().toISOString(),
    }).where(eq(businesses.id, biz.id));

    // Log to outreach log
    await db.insert(outreachLog).values({
      businessId: biz.id,
      source: "daily_digest",
      channel: smsSent && emailSent ? "both" : smsSent ? "sms" : "email",
    });

    return true;
  }

  return false;
}

/**
 * Process all businesses for daily digest delivery.
 * Simple approach: runs at 23:00 UTC (6 PM Central) for all businesses.
 * All current clients are in Texas — upgrade to time-aware scheduling later.
 */
export async function processAllDigests(): Promise<{ sent: number; skipped: number; errors: number }> {
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  const activeBiz = await db
    .select({ id: businesses.id, digestPreference: businesses.digestPreference })
    .from(businesses)
    .where(
      and(
        eq(businesses.active, true),
        sql`${businesses.digestPreference} != 'none'`,
      ),
    );

  for (const biz of activeBiz) {
    try {
      const success = await sendDailyDigest(biz.id);
      if (success) {
        sent++;
      } else {
        skipped++;
      }
    } catch (err) {
      errors++;
      reportError("[daily-digest] Error processing business", err, { extra: { businessId: biz.id } });
    }
  }

  return { sent, skipped, errors };
}
