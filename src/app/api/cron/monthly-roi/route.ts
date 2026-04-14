import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getResend } from "@/lib/email/client";
import {
  businesses,
  calls,
  appointments,
  customers,
  monthlyDigests,
} from "@/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { getTwilioClient } from "@/lib/twilio/client";
import { env } from "@/lib/env";
import {
  buildMonthlyRoiEmail,
  buildMonthlyRoiSms,
  calculateMonthlyStats,
} from "@/lib/emails/monthly-roi";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { verifyCronAuth } from "@/lib/cron-auth";
import { isAfterHours } from "@/lib/calendar/after-hours";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * GET /api/cron/monthly-roi
 *
 * Sends monthly ROI reports to all active businesses.
 * Run on the 1st of each month via cron.
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("monthly-roi", "0 14 1 * *", async () => {
    const resend = getResend();

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    try {
      const activeBiz = await db
        .select()
        .from(businesses)
        .where(eq(businesses.active, true));

      const dashboardBase = env.NEXT_PUBLIC_APP_URL ?? "https://captahq.com";

      // Calculate last month's boundaries
      const now = new Date();
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthYear = lastMonthDate.getFullYear();
      const lastMonthNum = lastMonthDate.getMonth(); // 0-indexed
      const monthLabel = `${MONTH_NAMES[lastMonthNum]} ${lastMonthYear}`;

      // ISO boundaries for last month
      const monthStart = `${lastMonthYear}-${String(lastMonthNum + 1).padStart(2, "0")}-01T00:00:00`;
      const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01T00:00:00`;
      const monthKey = `${lastMonthYear}-${String(lastMonthNum + 1).padStart(2, "0")}`;

      // Previous month (for MoM comparison)
      const prevMonthDate = new Date(lastMonthYear, lastMonthNum - 1, 1);
      const prevMonthStart = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}-01T00:00:00`;

      for (const biz of activeBiz) {
        try {
          if (!biz.ownerEmail) {
            skipped++;
            continue;
          }

          // Check if digest already sent
          const [existing] = await db
            .select({ id: monthlyDigests.id })
            .from(monthlyDigests)
            .where(
              and(
                eq(monthlyDigests.businessId, biz.id),
                eq(monthlyDigests.monthKey, monthKey),
              ),
            )
            .limit(1);

          if (existing) {
            skipped++;
            continue;
          }

          const receptionistName = biz.receptionistName || "Maria";
          const delivery = biz.digestDeliveryMethod ?? "both";

          // ── Aggregate metrics ──

          const monthCalls = await db
            .select({
              id: calls.id,
              language: calls.language,
              transferRequested: calls.transferRequested,
              createdAt: calls.createdAt,
            })
            .from(calls)
            .where(
              and(
                eq(calls.businessId, biz.id),
                gte(calls.createdAt, monthStart),
                lt(calls.createdAt, thisMonthStart),
              ),
            );

          const bizHours = (biz.businessHours ?? {}) as Record<string, { open: string; close: string; closed?: boolean }>;
          const tz = biz.timezone || "America/Chicago";
          const afterHoursCalls = monthCalls.filter((c) =>
            isAfterHours(c.createdAt, bizHours, tz),
          ).length;

          const emergencyCalls = monthCalls.filter((c) => c.transferRequested).length;
          const spanishCalls = monthCalls.filter((c) => c.language === "es").length;

          const [apptResult] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(appointments)
            .where(
              and(
                eq(appointments.businessId, biz.id),
                gte(appointments.createdAt, monthStart),
                lt(appointments.createdAt, thisMonthStart),
              ),
            );

          const [custResult] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(customers)
            .where(
              and(
                eq(customers.businessId, biz.id),
                gte(customers.createdAt, monthStart),
                lt(customers.createdAt, thisMonthStart),
                sql`${customers.deletedAt} IS NULL`,
              ),
            );

          // Previous month calls for MoM
          const [prevResult] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(calls)
            .where(
              and(
                eq(calls.businessId, biz.id),
                gte(calls.createdAt, prevMonthStart),
                lt(calls.createdAt, monthStart),
              ),
            );

          const stats = calculateMonthlyStats({
            totalCalls: monthCalls.length,
            afterHoursCalls,
            appointmentsBooked: apptResult?.count ?? 0,
            emergencyCalls,
            newCustomers: custResult?.count ?? 0,
            prevMonthCalls: prevResult?.count ?? 0,
            spanishCalls,
            businessType: biz.type,
            avgJobValueOverride: biz.avgJobValue,
          });

          let emailSentAt: string | null = null;
          let smsSentAt: string | null = null;
          let resendId: string | null = null;

          // ── Send Email ──
          if (delivery === "email" || delivery === "both") {
            const { subject, html } = buildMonthlyRoiEmail({
              receptionistName,
              businessName: biz.name,
              monthLabel,
              stats,
              dashboardUrl: `${dashboardBase}/dashboard`,
            });

            const from = env.OUTREACH_FROM_EMAIL ?? "Capta <hello@contact.captahq.com>";

            const { data, error } = await resend.emails.send({
              from,
              replyTo: "hello@captahq.com",
              to: biz.ownerEmail,
              subject,
              html,
            });

            if (error) {
              reportError(`[monthly-roi] Email failed for ${biz.id}`, error);
            } else {
              emailSentAt = new Date().toISOString();
              resendId = data?.id ?? null;
            }
          }

          // ── Send SMS ──
          if ((delivery === "sms" || delivery === "both") && biz.ownerPhone) {
            try {
              const smsBody = buildMonthlyRoiSms({ receptionistName, stats, monthLabel });
              const twilio = getTwilioClient();
              await twilio.messages.create({
                to: biz.ownerPhone,
                from: biz.twilioNumber || env.TWILIO_PHONE_NUMBER,
                body: smsBody,
              });
              smsSentAt = new Date().toISOString();
            } catch (smsErr) {
              reportError(`[monthly-roi] SMS failed for ${biz.id}`, smsErr);
            }
          }

          // ── Record digest ──
          await db.insert(monthlyDigests).values({
            businessId: biz.id,
            monthKey,
            monthLabel,
            stats,
            emailSentAt,
            smsSentAt,
            resendId,
          });

          sent++;
        } catch (err) {
          errors++;
          reportError(`[monthly-roi] Error for ${biz.id}`, err);
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
      reportError("[monthly-roi] Fatal error", err);
      return NextResponse.json({ error: "Monthly ROI report failed" }, { status: 500 });
    }
  });
}
