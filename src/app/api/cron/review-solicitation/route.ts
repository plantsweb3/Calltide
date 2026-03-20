import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, appointments, leads, reviewRequests, outreachLog, smsOptOuts, smsMessages } from "@/db/schema";
import { eq, and, sql, isNull, gte } from "drizzle-orm";
import { normalizePhone } from "@/lib/compliance/sms";
import { reportError } from "@/lib/error-reporting";
import { sendSMS } from "@/lib/twilio/sms";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { verifyCronAuth } from "@/lib/cron-auth";

/**
 * GET /api/cron/review-solicitation
 *
 * Automated review solicitation — sends Google review request SMS to customers
 * 2-4 hours after their appointment is marked as completed. This optimal timing
 * catches customers while the positive experience is still fresh.
 *
 * Runs hourly. Protected by CRON_SECRET.
 *
 * Guards:
 * - Only targets appointments with status = "completed" and updatedAt 2-4 hours ago
 * - Skips customers who opted out of SMS (leads.smsOptOut)
 * - Skips appointments that already have a review request in the reviewRequests table
 * - Requires business to have a googleReviewUrl and enableReviewRequests = true
 * - Rate limit: max 20 review requests per business per day
 */

const MAX_REVIEW_REQUESTS_PER_DAY = 20;
const MIN_HOURS_AFTER_COMPLETION = 2;
const MAX_HOURS_AFTER_COMPLETION = 4;

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("review-solicitation", "0 * * * *", async () => {
    const now = new Date();
    const windowStart = new Date(now.getTime() - MAX_HOURS_AFTER_COMPLETION * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() - MIN_HOURS_AFTER_COMPLETION * 60 * 60 * 1000);
    const windowStartISO = windowStart.toISOString();
    const windowEndISO = windowEnd.toISOString();

    // Today's date boundaries for daily rate limiting (UTC day)
    const todayStart = now.toISOString().split("T")[0] + "T00:00:00.000Z";

    let sent = 0;
    let skipped = 0;
    let rateLimited = 0;
    let errors = 0;

    try {
      // Get active businesses with review solicitation enabled and a Google review URL
      const activeBiz = await db
        .select()
        .from(businesses)
        .where(
          and(
            eq(businesses.active, true),
            sql`${businesses.googleReviewUrl} IS NOT NULL AND ${businesses.googleReviewUrl} != ''`,
            sql`COALESCE(${businesses.enableReviewRequests}, 1) = 1`,
          ),
        );

      for (const biz of activeBiz) {
        try {
          // Find completed appointments where updatedAt falls in the 2-4 hour window
          const completedAppts = await db
            .select({
              appointmentId: appointments.id,
              leadId: appointments.leadId,
              service: appointments.service,
            })
            .from(appointments)
            .where(
              and(
                eq(appointments.businessId, biz.id),
                eq(appointments.status, "completed"),
                sql`${appointments.updatedAt} >= ${windowStartISO}`,
                sql`${appointments.updatedAt} <= ${windowEndISO}`,
              ),
            );

          if (completedAppts.length === 0) continue;

          for (const appt of completedAppts) {
            try {
              // Enforce daily rate limit — query DB each time for accuracy across Vercel instances
              const [dailyCountResult] = await db
                .select({ count: sql<number>`COUNT(*)` })
                .from(smsMessages)
                .where(
                  and(
                    eq(smsMessages.businessId, biz.id),
                    eq(smsMessages.templateType, "review_request"),
                    eq(smsMessages.status, "sent"),
                    gte(smsMessages.createdAt, todayStart),
                  ),
                );
              const currentCount = dailyCountResult?.count ?? 0;
              if (currentCount >= MAX_REVIEW_REQUESTS_PER_DAY) {
                rateLimited++;
                continue;
              }

              // Check if this appointment already has a review request
              const [existingRequest] = await db
                .select({ id: reviewRequests.id })
                .from(reviewRequests)
                .where(eq(reviewRequests.appointmentId, appt.appointmentId))
                .limit(1);

              if (existingRequest) {
                skipped++;
                continue;
              }

              // Get lead info
              const [lead] = await db
                .select({
                  id: leads.id,
                  phone: leads.phone,
                  name: leads.name,
                  language: leads.language,
                  smsOptOut: leads.smsOptOut,
                })
                .from(leads)
                .where(eq(leads.id, appt.leadId))
                .limit(1);

              if (!lead?.phone) {
                skipped++;
                continue;
              }

              // Check SMS opt-out (lead-level)
              if (lead.smsOptOut) {
                skipped++;
                continue;
              }

              // Check global SMS opt-out table (smsOptOuts)
              const normalizedLeadPhone = normalizePhone(lead.phone);
              const [globalOptOut] = await db
                .select({ id: smsOptOuts.id })
                .from(smsOptOuts)
                .where(
                  and(
                    eq(smsOptOuts.phoneNumber, normalizedLeadPhone),
                    isNull(smsOptOuts.reoptedInAt),
                  ),
                )
                .limit(1);

              if (globalOptOut) {
                skipped++;
                continue;
              }

              // Check if this customer already received a review request in the last 90 days
              const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
              const [recentRequest] = await db
                .select({ id: reviewRequests.id })
                .from(reviewRequests)
                .where(
                  and(
                    eq(reviewRequests.businessId, biz.id),
                    eq(reviewRequests.customerPhone, lead.phone),
                    eq(reviewRequests.status, "sent"),
                    sql`${reviewRequests.sentAt} >= ${ninetyDaysAgo}`,
                  ),
                )
                .limit(1);

              if (recentRequest) {
                skipped++;
                continue;
              }

              // Build the SMS
              const language = lead.language || "en";
              const receptionistName = biz.receptionistName || "Maria";
              const customerName = lead.name?.split(" ")[0] || "";
              const smsBody = buildReviewSolicitationSms({
                customerName,
                businessName: biz.name,
                receptionistName,
                googleReviewUrl: biz.googleReviewUrl!,
                language,
              });

              // Send SMS
              const result = await sendSMS({
                to: lead.phone,
                from: biz.twilioNumber,
                body: smsBody,
                businessId: biz.id,
                leadId: lead.id,
                templateType: "review_request",
              });

              if (result.success) {
                // Record in review_requests table
                await db.insert(reviewRequests).values({
                  businessId: biz.id,
                  appointmentId: appt.appointmentId,
                  leadId: lead.id,
                  customerPhone: lead.phone,
                  language,
                  status: "sent",
                  twilioSid: result.sid,
                });

                // Log to outreach log
                await db.insert(outreachLog).values({
                  businessId: biz.id,
                  source: "review_solicitation",
                  channel: "sms",
                });

                sent++;
              } else {
                // Record failed attempt
                await db.insert(reviewRequests).values({
                  businessId: biz.id,
                  appointmentId: appt.appointmentId,
                  leadId: lead.id,
                  customerPhone: lead.phone,
                  language,
                  status: "failed",
                });
                errors++;
              }
            } catch (err) {
              errors++;
              reportError(`[review-solicitation] Error for appt ${appt.appointmentId}`, err);
            }
          }
        } catch (err) {
          errors++;
          reportError(`[review-solicitation] Error for business ${biz.id}`, err);
        }
      }

      return NextResponse.json({
        success: true,
        businessesChecked: activeBiz.length,
        sent,
        skipped,
        rateLimited,
        errors,
      });
    } catch (err) {
      reportError("[review-solicitation] Fatal error", err);
      return NextResponse.json(
        { error: "Review solicitation cron failed" },
        { status: 500 },
      );
    }
  });
}

/**
 * Build a bilingual review solicitation SMS.
 */
function buildReviewSolicitationSms(opts: {
  customerName: string;
  businessName: string;
  receptionistName: string;
  googleReviewUrl: string;
  language: string;
}): string {
  const { customerName, businessName, receptionistName, googleReviewUrl, language } = opts;

  if (language === "es") {
    const greeting = customerName ? `Hola ${customerName}!` : "Hola!";
    return `${greeting} Gracias por elegir ${businessName}. Nos encantaria saber su opinion! Dejenos una resena: ${googleReviewUrl}\n\n— ${receptionistName}\n\nResponda STOP para cancelar`;
  }

  const greeting = customerName ? `Hi ${customerName}!` : "Hi!";
  return `${greeting} Thanks for choosing ${businessName}. We'd love your feedback! Leave us a review: ${googleReviewUrl}\n\n— ${receptionistName}\n\nReply STOP to opt out`;
}
