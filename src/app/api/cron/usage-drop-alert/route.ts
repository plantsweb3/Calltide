import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, calls, usageAlerts, smsOptOuts } from "@/db/schema";
import { eq, and, gte, lt, isNull, sql } from "drizzle-orm";
import { verifyCronAuth } from "@/lib/cron-auth";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { sendSMS } from "@/lib/twilio/sms";
import { normalizePhone } from "@/lib/compliance/sms";
import { reportError } from "@/lib/error-reporting";
import { isOwnerInQuietHours } from "@/lib/notifications/quiet-hours";

/**
 * GET /api/cron/usage-drop-alert
 * Weekly on Monday mornings — detects businesses with a >50% drop
 * in call volume compared to the previous week and sends an SMS alert.
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("usage-drop-alert", "0 10 * * 1", async () => {
    let alerts = 0;
    let skipped = 0;
    let errors = 0;

    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

      // Get all active businesses
      const activeBusinesses = await db
        .select()
        .from(businesses)
        .where(
          and(
            eq(businesses.active, true),
            eq(businesses.paymentStatus, "active"),
          ),
        )
        .limit(500);

      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`;

      for (const biz of activeBusinesses) {
        if (!biz.ownerPhone || !biz.twilioNumber) continue;

        try {
          // Count calls in last 7 days
          const [thisWeek] = await db
            .select({ count: sql<number>`count(*)` })
            .from(calls)
            .where(
              and(
                eq(calls.businessId, biz.id),
                gte(calls.createdAt, sevenDaysAgo),
              ),
            );

          // Count calls in the 7 days before that
          const [lastWeek] = await db
            .select({ count: sql<number>`count(*)` })
            .from(calls)
            .where(
              and(
                eq(calls.businessId, biz.id),
                gte(calls.createdAt, fourteenDaysAgo),
                lt(calls.createdAt, sevenDaysAgo),
              ),
            );

          const thisCount = Number(thisWeek?.count ?? 0);
          const lastCount = Number(lastWeek?.count ?? 0);

          // Only alert if there was meaningful previous volume and >50% drop
          if (lastCount < 4) continue; // Skip if too few calls to be meaningful
          const dropPercent = Math.round(((lastCount - thisCount) / lastCount) * 100);

          if (dropPercent <= 50) continue;

          // Check for duplicate alert within 7 days
          const [existing] = await db
            .select({ id: usageAlerts.id })
            .from(usageAlerts)
            .where(
              and(
                eq(usageAlerts.businessId, biz.id),
                eq(usageAlerts.alertType, "usage_drop"),
                gte(usageAlerts.sentAt, sevenDaysAgo),
              ),
            )
            .limit(1);

          if (existing) {
            skipped++;
            continue;
          }

          // Check owner SMS opt-out
          const normalizedPhone = normalizePhone(biz.ownerPhone);
          const [optedOut] = await db
            .select({ id: smsOptOuts.id })
            .from(smsOptOuts)
            .where(
              and(
                eq(smsOptOuts.phoneNumber, normalizedPhone),
                isNull(smsOptOuts.reoptedInAt),
              ),
            )
            .limit(1);

          if (optedOut) {
            skipped++;
            continue;
          }

          // Skip during quiet hours — this is a routine alert
          if (isOwnerInQuietHours(biz)) {
            skipped++;
            continue;
          }

          await sendSMS({
            to: biz.ownerPhone,
            from: biz.twilioNumber,
            body: `Your call volume dropped ${dropPercent}% this week (${thisCount} calls vs ${lastCount} last week). This could mean your call forwarding needs attention. Check your setup: ${dashboardUrl}`,
            businessId: biz.id,
            templateType: "owner_notify",
          });

          await db.insert(usageAlerts).values({
            businessId: biz.id,
            alertType: "usage_drop",
            metricValue: `drop=${dropPercent}%,this_week=${thisCount},last_week=${lastCount}`,
          });

          alerts++;
        } catch (err) {
          reportError("Usage drop alert failed for business", err, {
            businessId: biz.id,
          });
          errors++;
        }
      }

      return NextResponse.json({
        success: true,
        alerts,
        skipped,
        errors,
        processed: activeBusinesses.length,
      });
    } catch (err) {
      reportError("[cron/usage-drop-alert] Fatal error", err);
      return NextResponse.json({ error: "Usage drop alert cron failed" }, { status: 500 });
    }
  });
}
