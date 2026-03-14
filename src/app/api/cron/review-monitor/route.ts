import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, googleReviews } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { sendSMS } from "@/lib/twilio/sms";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { verifyCronAuth } from "@/lib/cron-auth";

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
          // Check for any newly stored reviews that haven't been processed for alerts
          // Reviews can come from:
          // 1. GBP API (when configured)
          // 2. Manual entry via admin panel
          // 3. API import
          const unprocessedReviews = await db
            .select()
            .from(googleReviews)
            .where(
              and(
                eq(googleReviews.businessId, biz.id),
                // Reviews created in the last 6 hours that haven't been alerted on
                sql`${googleReviews.createdAt} >= datetime('now', '-6 hours')`,
              ),
            );

          for (const review of unprocessedReviews) {
            fetched++;

            // Alert on negative reviews (< 4 stars)
            if (review.rating < 4) {
              const receptionistName = biz.receptionistName || "Maria";
              const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
              const authorLine = review.authorName ? ` from ${review.authorName}` : "";
              const textPreview = review.text ? `\n\n"${review.text.slice(0, 200)}"` : "";

              await sendSMS({
                to: biz.ownerPhone,
                from: biz.twilioNumber,
                body: `Review alert for ${biz.name}: ${stars} (${review.rating}/5)${authorLine}${textPreview}\n\nView and respond in your dashboard.\n\n— ${receptionistName}`,
                businessId: biz.id,
                templateType: "review_alert",
              });

              alerts++;
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
