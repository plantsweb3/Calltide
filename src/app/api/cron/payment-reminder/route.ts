import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, usageAlerts } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { verifyCronAuth } from "@/lib/cron-auth";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { sendEmailWithRetry } from "@/lib/email/client";
import { reportError } from "@/lib/error-reporting";

const FROM_EMAIL = "Capta <billing@contact.captahq.com>";

/**
 * GET /api/cron/payment-reminder
 * Daily at 10 AM — sends payment reminders for upcoming billing dates
 * and alerts for expiring credit cards.
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("payment-reminder", "0 10 * * *", async () => {
    let cardAlerts = 0;
    let billingAlerts = 0;
    let skipped = 0;
    let errors = 0;

    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();

      // Calculate next month/year for card expiry check
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

      // Find active businesses
      const activeBusinesses = await db
        .select()
        .from(businesses)
        .where(eq(businesses.paymentStatus, "active"))
        .limit(500);

      for (const biz of activeBusinesses) {
        if (!biz.ownerEmail) continue;

        try {
          // --- Card Expiring Check ---
          if (biz.cardExpMonth && biz.cardExpYear && biz.cardLast4) {
            const isExpiringThisMonth =
              biz.cardExpMonth === currentMonth && biz.cardExpYear === currentYear;
            const isExpiringNextMonth =
              biz.cardExpMonth === nextMonth && biz.cardExpYear === nextYear;

            if (isExpiringThisMonth || isExpiringNextMonth) {
              // Check for duplicate alert in last 30 days
              const [existing] = await db
                .select({ id: usageAlerts.id })
                .from(usageAlerts)
                .where(
                  and(
                    eq(usageAlerts.businessId, biz.id),
                    eq(usageAlerts.alertType, "card_expiring"),
                    gte(
                      usageAlerts.sentAt,
                      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    ),
                  ),
                )
                .limit(1);

              if (existing) {
                skipped++;
              } else {
                const expDate = `${String(biz.cardExpMonth).padStart(2, "0")}/${biz.cardExpYear}`;
                await sendEmailWithRetry({
                  from: FROM_EMAIL,
                  to: biz.ownerEmail,
                  subject: "Action Required: Your card on file is expiring soon",
                  html: `
                    <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
                      <h2 style="color: #1B2A4A;">Update Your Payment Method</h2>
                      <p>Hi ${biz.ownerName},</p>
                      <p>Your card ending in <strong>${biz.cardLast4}</strong> expires <strong>${expDate}</strong>. Please update it to avoid any interruption to your Capta service.</p>
                      <p>You can update your payment method from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" style="color: #D4A843;">billing dashboard</a>.</p>
                      <p style="color: #666; font-size: 13px; margin-top: 24px;">If you've already updated your card, please disregard this email.</p>
                      <p>Best,<br/>The Capta Team</p>
                    </div>
                  `,
                });

                await db.insert(usageAlerts).values({
                  businessId: biz.id,
                  alertType: "card_expiring",
                  metricValue: `card_last4=${biz.cardLast4},exp=${expDate}`,
                });

                cardAlerts++;
              }
            }
          }

          // --- Upcoming Billing Reminder ---
          if (biz.nextBillingAt) {
            const billingDate = new Date(biz.nextBillingAt);
            const daysUntilBilling = Math.ceil(
              (billingDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
            );

            if (daysUntilBilling > 0 && daysUntilBilling <= 7) {
              // Check for duplicate alert in last 7 days
              const [existing] = await db
                .select({ id: usageAlerts.id })
                .from(usageAlerts)
                .where(
                  and(
                    eq(usageAlerts.businessId, biz.id),
                    eq(usageAlerts.alertType, "payment_reminder"),
                    gte(
                      usageAlerts.sentAt,
                      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    ),
                  ),
                )
                .limit(1);

              if (existing) {
                skipped++;
              } else {
                const amount = biz.mrr ? `$${(biz.mrr / 100).toFixed(2)}` : "$497.00";
                const dateStr = billingDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                });

                await sendEmailWithRetry({
                  from: FROM_EMAIL,
                  to: biz.ownerEmail,
                  subject: `Upcoming payment: ${amount} on ${dateStr}`,
                  html: `
                    <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
                      <h2 style="color: #1B2A4A;">Payment Reminder</h2>
                      <p>Hi ${biz.ownerName},</p>
                      <p>Your next Capta payment of <strong>${amount}</strong> is scheduled for <strong>${dateStr}</strong>.</p>
                      <p>No action is needed if your payment method is up to date. You can review your billing details anytime from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" style="color: #D4A843;">billing dashboard</a>.</p>
                      <p>Best,<br/>The Capta Team</p>
                    </div>
                  `,
                });

                await db.insert(usageAlerts).values({
                  businessId: biz.id,
                  alertType: "payment_reminder",
                  metricValue: `amount=${amount},date=${biz.nextBillingAt}`,
                });

                billingAlerts++;
              }
            }
          }
        } catch (err) {
          reportError("Payment reminder failed for business", err, {
            businessId: biz.id,
          });
          errors++;
        }
      }

      return NextResponse.json({
        success: true,
        cardAlerts,
        billingAlerts,
        skipped,
        errors,
        processed: activeBusinesses.length,
      });
    } catch (err) {
      reportError("[cron/payment-reminder] Fatal error", err);
      return NextResponse.json({ error: "Payment reminder cron failed" }, { status: 500 });
    }
  });
}
