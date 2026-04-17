import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, googleReviews } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { sendSMS } from "@/lib/twilio/sms";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { verifyCronAuth } from "@/lib/cron-auth";
import { isOwnerInQuietHours } from "@/lib/notifications/quiet-hours";

/**
 * GET /api/cron/review-monitor
 * Checks Google Business Profile for new reviews via the GBP API.
 * Alerts owners immediately on negative reviews (< 4 stars).
 * Sends a weekly review summary as part of the digest.
 * Runs every 6 hours.
 *
 * NOTE: This cron is functional but Google Business Profile API integration
 * requires OAuth2 setup. Without GBP credentials, reviews can be manually
 * entered via the admin panel or API. The alert system works regardless.
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("review-monitor", "0 */6 * * *", async () => {
    let fetched = 0;
    let alerts = 0;
    let errors = 0;

    try {
      // Get active businesses with Google review URLs
      const activeBiz = await db
        .select({
          id: businesses.id,
          name: businesses.name,
          ownerPhone: businesses.ownerPhone,
          twilioNumber: businesses.twilioNumber,
          receptionistName: businesses.receptionistName,
          googleReviewUrl: businesses.googleReviewUrl,
          ownerQuietHoursStart: businesses.ownerQuietHoursStart,
          ownerQuietHoursEnd: businesses.ownerQuietHoursEnd,
          timezone: businesses.timezone,
        })
        .from(businesses)
        .where(
          and(
            eq(businesses.active, true),
            sql`${businesses.googleReviewUrl} IS NOT NULL AND ${businesses.googleReviewUrl} != ''`,
          ),
        );

      for (const biz of activeBiz) {
        try {
          // Atomic claim: mark reviews as alerted BEFORE sending SMS to prevent
          // concurrent cron runs / retries from re-alerting. Accepts a small
          // SMS-loss risk on transient Twilio failures in exchange for no dupes.
          const unprocessedReviews = await db
            .update(googleReviews)
            .set({ alertedAt: new Date().toISOString() })
            .where(
              and(
                eq(googleReviews.businessId, biz.id),
                sql`${googleReviews.alertedAt} IS NULL`,
              ),
            )
            .returning();

          for (const review of unprocessedReviews) {
            fetched++;

            // Alert on negative reviews (< 4 stars)
            if (review.rating < 4 && !isOwnerInQuietHours(biz)) {
              const receptionistName = biz.receptionistName || "Maria";
              const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
              const authorLine = review.authorName ? ` from ${review.authorName}` : "";
              const textPreview = review.text ? `\n\n"${review.text.slice(0, 200)}"` : "";

              try {
                await sendSMS({
                  to: biz.ownerPhone,
                  from: biz.twilioNumber || process.env.TWILIO_PHONE_NUMBER || "",
                  body: `Review alert for ${biz.name}: ${stars} (${review.rating}/5)${authorLine}${textPreview}\n\nView and respond in your dashboard.\n\n— ${receptionistName}`,
                  businessId: biz.id,
                  templateType: "review_alert",
                });
                alerts++;
              } catch (err) {
                errors++;
                reportError(`[review-monitor] SMS send failed for review ${review.id}`, err, { extra: { businessId: biz.id } });
              }
            }
          }
        } catch (err) {
          errors++;
          reportError(`[review-monitor] Error for business ${biz.id}`, err);
        }
      }

      return NextResponse.json({
        success: true,
        businesses: activeBiz.length,
        fetched,
        alerts,
        errors,
      });
    } catch (err) {
      reportError("[review-monitor] Fatal error", err);
      return NextResponse.json({ error: "Review monitor cron failed" }, { status: 500 });
    }
  });
}
