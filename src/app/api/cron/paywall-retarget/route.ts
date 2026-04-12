import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getResend } from "@/lib/email/client";
import { businesses, paywallEmails } from "@/db/schema";
import { and, eq, isNull, ne } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { logActivity } from "@/lib/activity";
import {
  getPaywallEmail,
  PAYWALL_EMAIL_SCHEDULE,
  ABANDON_HOURS,
  type PaywallEmailNumber,
} from "@/lib/emails/paywall-retarget";
import { verifyCronAuth } from "@/lib/cron-auth";

const FROM_EMAIL = "Ulysses at Capta <hello@contact.captahq.com>";
const REPLY_TO = process.env.OWNER_EMAIL || "hello@captahq.com";

/**
 * GET /api/cron/paywall-retarget
 *
 * Daily cron (10 AM) — sends paywall retarget emails to businesses
 * that completed onboarding steps 1-5 but haven't paid.
 *
 * Logic:
 * 1. Find businesses with onboardingStatus = 'paywall_reached', no active Stripe sub, not unsubscribed
 * 2. Calculate hours since onboardingPaywallReachedAt
 * 3. Determine which email to send (1-4) based on schedule
 * 4. Skip if already sent that email number
 * 5. After 14 days (336h), mark as 'abandoned'
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  let resend;
  try {
    resend = getResend();
  } catch {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let abandoned = 0;
  let errors = 0;

  try {
    // Find all businesses at paywall without payment
    const candidates = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        type: businesses.type,
        ownerEmail: businesses.ownerEmail,
        receptionistName: businesses.receptionistName,
        personalityPreset: businesses.personalityPreset,
        serviceArea: businesses.serviceArea,
        services: businesses.services,
        businessHours: businesses.businessHours,
        defaultLanguage: businesses.defaultLanguage,
        onboardingPaywallReachedAt: businesses.onboardingPaywallReachedAt,
        stripeSubscriptionStatus: businesses.stripeSubscriptionStatus,
        paywallUnsubscribed: businesses.paywallUnsubscribed,
      })
      .from(businesses)
      .where(
        and(
          eq(businesses.onboardingStatus, "paywall_reached"),
          eq(businesses.paywallUnsubscribed, false),
        ),
      );

    const now = Date.now();

    for (const biz of candidates) {
      // Skip if they already have an active subscription
      if (biz.stripeSubscriptionStatus === "active" || biz.stripeSubscriptionStatus === "trialing") {
        skipped++;
        continue;
      }

      if (!biz.onboardingPaywallReachedAt || !biz.ownerEmail) {
        skipped++;
        continue;
      }

      const paywallAt = new Date(biz.onboardingPaywallReachedAt).getTime();
      const hoursSince = (now - paywallAt) / (1000 * 60 * 60);

      // Check for abandonment (14 days)
      if (hoursSince >= ABANDON_HOURS) {
        await db
          .update(businesses)
          .set({ onboardingStatus: "abandoned", updatedAt: new Date().toISOString() })
          .where(eq(businesses.id, biz.id));
        abandoned++;

        await logActivity({
          type: "status_change",
          entityType: "business",
          entityId: biz.id,
          title: "Onboarding abandoned (14d timeout)",
          detail: `${biz.name} — paywall reached ${Math.round(hoursSince / 24)}d ago`,
        });
        continue;
      }

      // Get already-sent emails for this business
      const sentEmails = await db
        .select({ emailNumber: paywallEmails.emailNumber })
        .from(paywallEmails)
        .where(
          and(
            eq(paywallEmails.businessId, biz.id),
            ne(paywallEmails.status, "failed"),
          ),
        );
      const sentNumbers = new Set(sentEmails.map((e) => e.emailNumber));

      // Determine which email to send — find the highest eligible email not yet sent
      let emailToSend: PaywallEmailNumber | null = null;
      for (const schedule of PAYWALL_EMAIL_SCHEDULE) {
        if (hoursSince >= schedule.hoursAfter && !sentNumbers.has(schedule.emailNumber)) {
          emailToSend = schedule.emailNumber;
        }
      }

      if (!emailToSend) {
        skipped++;
        continue;
      }

      // Build email data
      const emailData = {
        businessId: biz.id,
        businessName: biz.name,
        receptionistName: biz.receptionistName || "Maria",
        trade: biz.type,
        city: biz.serviceArea || "",
        personalityPreset: biz.personalityPreset || "friendly",
        services: (biz.services as string[]) || [],
        businessHours: biz.businessHours as Record<string, { open: string; close: string; closed?: boolean }> | null,
        onboardingPaywallReachedAt: biz.onboardingPaywallReachedAt,
        language: biz.defaultLanguage || "en",
      };

      const email = getPaywallEmail(emailToSend, emailData);

      try {
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          replyTo: REPLY_TO,
          to: biz.ownerEmail,
          subject: email.subject,
          html: email.html,
        });

        if (error) {
          errors++;
          await db.insert(paywallEmails).values({
            businessId: biz.id,
            emailNumber: emailToSend,
            templateKey: email.templateKey,
            status: "failed",
            language: emailData.language,
          });
          reportError(`Paywall retarget email ${emailToSend} failed for ${biz.id}`, error);
          continue;
        }

        await db.insert(paywallEmails).values({
          businessId: biz.id,
          emailNumber: emailToSend,
          templateKey: email.templateKey,
          status: "sent",
          resendId: data?.id,
          language: emailData.language,
        });

        sent++;

        await logActivity({
          type: "email_sent",
          entityType: "business",
          entityId: biz.id,
          title: `Paywall retarget email ${emailToSend} sent`,
          detail: `To: ${biz.ownerEmail} — ${email.subject}`,
        });
      } catch (err) {
        errors++;
        reportError(`Paywall retarget email error for ${biz.id}`, err);
      }
    }

    return NextResponse.json({
      success: true,
      candidates: candidates.length,
      sent,
      skipped,
      abandoned,
      errors,
    });
  } catch (error) {
    reportError("Paywall retarget cron error", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
