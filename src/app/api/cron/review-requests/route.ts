import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, appointments, leads, reviewRequests, outreachLog } from "@/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { sendSMS } from "@/lib/twilio/sms";
import { canSendSms } from "@/lib/compliance/sms";
import { env } from "@/lib/env";
import { getBusinessDateRange } from "@/lib/timezone";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";

/**
 * GET /api/cron/review-requests
 * Sends Google review request SMS to customers 24 hours after their appointment.
 * Runs daily at 10 AM CT (16:00 UTC).
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronMonitor("review-requests", "0 16 * * *", async () => {
    const now = new Date();

    // 90-day lookback window for rate limiting
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoISO = ninetyDaysAgo.toISOString();

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    try {
      // Get active businesses with review requests enabled and a Google review URL
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
          // Compute "yesterday" in the business's timezone
          const tz = biz.timezone || "America/Chicago";
          const { dateStr: yesterdayDate } = getBusinessDateRange(tz, -1);

          // Find yesterday's confirmed/completed appointments for this business
          const yesterdayAppts = await db
            .select({
              appointmentId: appointments.id,
              leadId: appointments.leadId,
              service: appointments.service,
            })
            .from(appointments)
            .where(
              and(
                eq(appointments.businessId, biz.id),
                eq(appointments.date, yesterdayDate),
                sql`${appointments.status} IN ('confirmed', 'completed')`,
              ),
            );

          for (const appt of yesterdayAppts) {
            try {
              // Get lead info
              const [lead] = await db
                .select()
                .from(leads)
                .where(eq(leads.id, appt.leadId))
                .limit(1);

              if (!lead || !lead.phone) {
                skipped++;
                continue;
              }

              // Check if lead opted out of SMS
              if (lead.smsOptOut) {
                skipped++;
                continue;
              }

              // Check TCPA compliance (opt-outs + quiet hours)
              try {
                const smsCheck = await canSendSms(lead.phone, tz);
                if (!smsCheck.allowed) {
                  skipped++;
                  continue;
                }
              } catch {
                // Non-fatal: proceed if compliance check errors
              }

              // Rate limit: max 1 review request per customer per business per 90 days
              const [existing] = await db
                .select({ id: reviewRequests.id })
                .from(reviewRequests)
                .where(
                  and(
                    eq(reviewRequests.businessId, biz.id),
                    eq(reviewRequests.customerPhone, lead.phone),
                    eq(reviewRequests.status, "sent"),
                    gte(reviewRequests.sentAt, ninetyDaysAgoISO),
                  ),
                )
                .limit(1);

              if (existing) {
                skipped++;
                continue;
              }

              // Detect language from lead record or default to English
              const language = lead.language || "en";

              // Build SMS body
              const receptionistName = biz.receptionistName || "Maria";
              const customerName = lead.name?.split(" ")[0] || "";
              const smsBody = buildReviewSms({
                customerName,
                businessName: biz.name,
                receptionistName,
                googleReviewUrl: biz.googleReviewUrl!,
                language,
              });

              // Send SMS
              const result = await sendSMS({
                to: lead.phone,
                from: env.TWILIO_PHONE_NUMBER,
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
                  source: "review_request",
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
              reportError(`[review-requests] Error for appt ${appt.appointmentId}`, err);
            }
          }
        } catch (err) {
          errors++;
          reportError(`[review-requests] Error for business ${biz.id}`, err);
        }
      }

      return NextResponse.json({
        success: true,
        total: activeBiz.length,
        sent,
        skipped,
        errors,
      });
    } catch (err) {
      reportError("[review-requests] Fatal error", err);
      return NextResponse.json({ error: "Review requests cron failed" }, { status: 500 });
    }
  });
}

function buildReviewSms(opts: {
  customerName: string;
  businessName: string;
  receptionistName: string;
  googleReviewUrl: string;
  language: string;
}): string {
  const { customerName, businessName, receptionistName, googleReviewUrl, language } = opts;
  const name = customerName ? `${customerName}, ` : "";

  if (language === "es") {
    return `${name}gracias por elegir ${businessName}! Si tuvo una buena experiencia, nos encantaría que nos dejara una reseña: ${googleReviewUrl}\n\n— ${receptionistName} de ${businessName}\n\nResponda STOP para cancelar`;
  }

  return `${name}thank you for choosing ${businessName}! If you had a great experience, we'd love a quick review: ${googleReviewUrl}\n\n— ${receptionistName} at ${businessName}\n\nReply STOP to opt out`;
}
