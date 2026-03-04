import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, calls, appointments, outreachLog } from "@/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { sendSMS } from "@/lib/twilio/sms";
import { env } from "@/lib/env";
import { getBusinessDateRange } from "@/lib/timezone";

/**
 * GET /api/cron/daily-summary
 * Sends a daily end-of-day SMS recap to every active business owner at 6 PM CT.
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

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Get all active businesses with daily summary enabled
    const activeBiz = await db
      .select()
      .from(businesses)
      .where(
        and(
          eq(businesses.active, true),
          sql`COALESCE(${businesses.enableDailySummary}, 1) = 1`,
        ),
      );

    for (const biz of activeBiz) {
      try {
        // Must have a phone number
        if (!biz.ownerPhone) {
          skipped++;
          continue;
        }

        const receptionistName = biz.receptionistName || "Maria";

        // Compute date ranges in the business's timezone
        const tz = biz.timezone || "America/Chicago";
        const todayRange = getBusinessDateRange(tz, 0);
        const tomorrowRange = getBusinessDateRange(tz, 1);

        // Count calls today
        const [callResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(calls)
          .where(
            and(
              eq(calls.businessId, biz.id),
              gte(calls.createdAt, todayRange.start),
              lt(calls.createdAt, todayRange.end),
            ),
          );
        const totalCalls = callResult?.count ?? 0;

        // Count appointments booked today
        const [apptResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(appointments)
          .where(
            and(
              eq(appointments.businessId, biz.id),
              gte(appointments.createdAt, todayRange.start),
              lt(appointments.createdAt, todayRange.end),
            ),
          );
        const apptsBooked = apptResult?.count ?? 0;

        // Count emergency calls today (transfer requested)
        const [emergResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(calls)
          .where(
            and(
              eq(calls.businessId, biz.id),
              eq(calls.transferRequested, true),
              gte(calls.createdAt, todayRange.start),
              lt(calls.createdAt, todayRange.end),
            ),
          );
        const emergencyCalls = emergResult?.count ?? 0;

        // Count tomorrow's scheduled appointments
        const [tomorrowResult] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(appointments)
          .where(
            and(
              eq(appointments.businessId, biz.id),
              eq(appointments.date, tomorrowRange.dateStr),
              sql`${appointments.status} != 'cancelled'`,
            ),
          );
        const tomorrowAppts = tomorrowResult?.count ?? 0;

        // Build SMS body
        let smsBody: string;
        if (totalCalls === 0) {
          smsBody = `${receptionistName} had a quiet day at ${biz.name}. 0 calls today. Tomorrow: ${tomorrowAppts} appointment${tomorrowAppts !== 1 ? "s" : ""}. — Calltide`;
        } else {
          smsBody = `${receptionistName} Daily Recap for ${biz.name}:\nToday: ${totalCalls} call${totalCalls !== 1 ? "s" : ""} answered, ${apptsBooked} appt${apptsBooked !== 1 ? "s" : ""} booked, ${emergencyCalls} emergency${emergencyCalls !== 1 ? "s" : ""}\nTomorrow: ${tomorrowAppts} appointment${tomorrowAppts !== 1 ? "s" : ""} scheduled\n— Calltide`;
        }

        // Send via sendSMS (templateType "owner_notify" skips lead opt-out and TCPA checks)
        const result = await sendSMS({
          to: biz.ownerPhone,
          from: env.TWILIO_PHONE_NUMBER,
          body: smsBody,
          businessId: biz.id,
          templateType: "owner_notify",
        });

        if (result.success) {
          // Log to outreachLog
          await db.insert(outreachLog).values({
            businessId: biz.id,
            source: "daily_summary",
            channel: "sms",
          });
          sent++;
        } else {
          errors++;
          reportError(`[daily-summary] SMS failed for ${biz.id}`, result.error);
        }
      } catch (err) {
        errors++;
        reportError(`[daily-summary] Error for ${biz.id}`, err);
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
    reportError("[daily-summary] Fatal error", err);
    return NextResponse.json({ error: "Daily summary failed" }, { status: 500 });
  }
}
