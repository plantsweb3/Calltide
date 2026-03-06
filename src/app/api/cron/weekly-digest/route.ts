import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { getResend } from "@/lib/email/client";
import {
  businesses,
  calls,
  appointments,
  customers,
  weeklyDigests,
} from "@/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { getTwilioClient } from "@/lib/twilio/client";
import { env } from "@/lib/env";
import {
  buildDigestEmail,
  buildDigestSms,
  getAvgJobValue,
  calculateSavedEstimate,
  type DigestStats,
} from "@/lib/emails/weekly-digest";
import { getBusinessWeekRange } from "@/lib/timezone";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Determine if a call was after-hours based on the call timestamp and business hours.
 */
function isAfterHours(
  callCreatedAt: string,
  businessHours: Record<string, { open: string; close: string; closed?: boolean }>,
  timezone: string,
): boolean {
  const callDate = new Date(callCreatedAt);

  // Get local day and time
  const localDay = callDate.toLocaleDateString("en-US", { weekday: "long", timeZone: timezone }).toLowerCase();
  const localTime = callDate.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  });

  // Check various key formats: "monday", "Mon", etc.
  const shortDay = callDate.toLocaleDateString("en-US", { weekday: "short", timeZone: timezone });
  const hours = businessHours[localDay] || businessHours[shortDay];

  if (!hours || hours.closed || hours.open === "closed") return true;
  if (localTime < hours.open || localTime >= hours.close) return true;
  return false;
}

export async function GET(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = getResend();

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Get all active businesses with digest enabled
    const activeBiz = await db
      .select()
      .from(businesses)
      .where(
        and(
          eq(businesses.active, true),
          sql`COALESCE(${businesses.enableWeeklyDigest}, 1) = 1`,
        ),
      );

    const dashboardBase = env.NEXT_PUBLIC_APP_URL ?? "https://calltide.app";

    for (const biz of activeBiz) {
      try {
        // No email = can't send
        if (!biz.ownerEmail) {
          skipped++;
          continue;
        }

        const delivery = biz.digestDeliveryMethod ?? "both";
        const receptionistName = biz.receptionistName || "Maria";
        const bizHours = (biz.businessHours ?? {}) as Record<string, { open: string; close: string; closed?: boolean }>;
        const tz = biz.timezone || "America/Chicago";

        // Compute week boundaries in the business's timezone
        const lastWeek = getBusinessWeekRange(tz, 1);
        const prevWeekRange = getBusinessWeekRange(tz, 2);
        const weekStartDate = lastWeek.startDate;
        const weekEndDate = lastWeek.endDate;

        // Check if digest already sent for this week
        const [existing] = await db
          .select({ id: weeklyDigests.id })
          .from(weeklyDigests)
          .where(
            and(
              eq(weeklyDigests.businessId, biz.id),
              eq(weeklyDigests.weekStartDate, weekStartDate),
            ),
          )
          .limit(1);

        if (existing) {
          skipped++;
          continue;
        }

        // ── Aggregate metrics for this week ──

        // All calls this week
        const weekCalls = await db
          .select()
          .from(calls)
          .where(
            and(
              eq(calls.businessId, biz.id),
              gte(calls.createdAt, lastWeek.start),
              lt(calls.createdAt, lastWeek.end),
            ),
          );

        const totalCalls = weekCalls.length;

        // After-hours calls
        const afterHoursCalls = weekCalls.filter((c) =>
          isAfterHours(c.createdAt, bizHours, tz),
        ).length;

        // Emergency calls (transfer requested or outcome contains emergency context)
        const emergencyCalls = weekCalls.filter(
          (c) => c.transferRequested,
        ).length;

        // Appointments booked this week
        const [apptResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(appointments)
          .where(
            and(
              eq(appointments.businessId, biz.id),
              gte(appointments.createdAt, lastWeek.start),
              lt(appointments.createdAt, lastWeek.end),
            ),
          );
        const appointmentsBooked = apptResult?.count ?? 0;

        // New customers added this week
        const [custResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(customers)
          .where(
            and(
              eq(customers.businessId, biz.id),
              gte(customers.createdAt, lastWeek.start),
              lt(customers.createdAt, lastWeek.end),
              sql`${customers.deletedAt} IS NULL`,
            ),
          );
        const newCustomers = custResult?.count ?? 0;

        // Estimated revenue
        const avgJobValue = getAvgJobValue(biz.type, biz.avgJobValue);
        const estimatedRevenue = appointmentsBooked * avgJobValue;

        // Busiest day
        const callsByDay: Record<string, number> = {};
        for (const c of weekCalls) {
          const d = new Date(c.createdAt);
          const dayName = DAY_NAMES[d.getDay()];
          callsByDay[dayName] = (callsByDay[dayName] ?? 0) + 1;
        }
        let busiestDay = "—";
        let busiestDayCount = 0;
        for (const [day, count] of Object.entries(callsByDay)) {
          if (count > busiestDayCount) {
            busiestDay = day;
            busiestDayCount = count;
          }
        }

        // Previous week calls for WoW comparison
        const [prevResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(calls)
          .where(
            and(
              eq(calls.businessId, biz.id),
              gte(calls.createdAt, prevWeekRange.start),
              lt(calls.createdAt, prevWeekRange.end),
            ),
          );
        const prevWeekCalls = prevResult?.count ?? 0;

        // WoW change
        const wowChangePercent =
          prevWeekCalls === 0
            ? totalCalls > 0
              ? 100
              : 0
            : Math.round(((totalCalls - prevWeekCalls) / prevWeekCalls) * 100);

        // Saved estimate
        const savedEstimate = calculateSavedEstimate(afterHoursCalls, avgJobValue);

        const stats: DigestStats = {
          totalCalls,
          afterHoursCalls,
          appointmentsBooked,
          estimatedRevenue,
          emergencyCalls,
          newCustomers,
          busiestDay,
          busiestDayCount,
          prevWeekCalls,
          wowChangePercent,
          savedEstimate,
        };

        let emailSentAt: string | null = null;
        let smsSentAt: string | null = null;
        let resendId: string | null = null;

        // ── Send Email ──
        if (delivery === "email" || delivery === "both") {
          const { subject, html } = buildDigestEmail({
            receptionistName,
            businessName: biz.name,
            weekStartDate,
            weekEndDate,
            stats,
            dashboardUrl: `${dashboardBase}/dashboard`,
          });

          const from = env.OUTREACH_FROM_EMAIL ?? "Calltide <hello@contact.calltide.app>";

          const { data, error } = await resend.emails.send({
            from,
            replyTo: "hello@calltide.app",
            to: biz.ownerEmail,
            subject,
            html,
          });

          if (error) {
            reportError(`[weekly-digest] Email failed for ${biz.id}`, error);
          } else {
            emailSentAt = new Date().toISOString();
            resendId = data?.id ?? null;
          }
        }

        // ── Send SMS ──
        if ((delivery === "sms" || delivery === "both") && biz.ownerPhone) {
          try {
            const smsBody = buildDigestSms({ receptionistName, stats });
            const twilio = getTwilioClient();
            await twilio.messages.create({
              to: biz.ownerPhone,
              from: env.TWILIO_PHONE_NUMBER,
              body: smsBody,
            });
            smsSentAt = new Date().toISOString();
          } catch (smsErr) {
            reportError(`[weekly-digest] SMS failed for ${biz.id}`, smsErr);
          }
        }

        // ── Record digest ──
        await db.insert(weeklyDigests).values({
          businessId: biz.id,
          weekStartDate,
          weekEndDate,
          stats,
          emailSentAt,
          smsSentAt,
          resendId,
        });

        sent++;
      } catch (err) {
        errors++;
        reportError(`[weekly-digest] Error for ${biz.id}`, err);
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
    reportError("[weekly-digest] Fatal error", err);
    return NextResponse.json({ error: "Weekly digest failed" }, { status: 500 });
  }
}
