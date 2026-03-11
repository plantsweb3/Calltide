import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, leads, businesses, customers, outboundCalls } from "@/db/schema";
import { eq, and, sql, gte } from "drizzle-orm";
import { scheduleOutboundCall } from "@/lib/outbound/engine";
import { reportError } from "@/lib/error-reporting";
import { getBusinessDateRange, localDateToUtc } from "@/lib/timezone";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { verifyCronAuth } from "@/lib/cron-auth";

/**
 * GET /api/cron/outbound-reminders
 *
 * Schedules outbound reminder calls for appointments happening tomorrow.
 * Runs daily at midnight UTC. Only for businesses with outbound + appointment reminders enabled.
 * Uses business timezone to determine "tomorrow" and schedule calls for 9 AM local time.
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("outbound-reminders", "0 0 * * *", async () => {
    // Query a wide window of upcoming appointments (next 2 days UTC) then filter per business timezone
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const wideStart = new Date().toISOString().split("T")[0];
    const wideEnd = dayAfterTomorrow.toISOString().split("T")[0];

    let scheduled = 0;
    let skipped = 0;

    try {
      // Find confirmed appointments in the wide window
      const upcoming = await db
        .select({
          appointmentId: appointments.id,
          service: appointments.service,
          date: appointments.date,
          time: appointments.time,
          leadId: appointments.leadId,
          businessId: appointments.businessId,
        })
        .from(appointments)
        .where(
          and(
            sql`${appointments.date} >= ${wideStart}`,
            sql`${appointments.date} <= ${wideEnd}`,
            eq(appointments.status, "confirmed"),
          ),
        );

      // Cache business lookups
      const bizCache = new Map<string, { outboundEnabled: boolean | null; appointmentReminders: boolean | null; defaultLanguage: string | null; timezone: string | null } | null>();

      for (const apt of upcoming) {
        try {
          // Check business has outbound enabled (cached)
          let biz = bizCache.get(apt.businessId);
          if (biz === undefined) {
            const [result] = await db
              .select({
                outboundEnabled: businesses.outboundEnabled,
                appointmentReminders: businesses.appointmentReminders,
                defaultLanguage: businesses.defaultLanguage,
                timezone: businesses.timezone,
              })
              .from(businesses)
              .where(eq(businesses.id, apt.businessId));
            biz = result ?? null;
            bizCache.set(apt.businessId, biz);
          }

          if (!biz?.outboundEnabled || !biz?.appointmentReminders) {
            skipped++;
            continue;
          }

          // Check if this appointment's date is actually "tomorrow" in the business's timezone
          const tz = biz.timezone || "America/Chicago";
          const { dateStr: tomorrowStr } = getBusinessDateRange(tz, 1);
          if (apt.date !== tomorrowStr) {
            skipped++;
            continue;
          }

          // Get customer phone from lead
          const [lead] = await db
            .select({ phone: leads.phone, name: leads.name, language: leads.language })
            .from(leads)
            .where(eq(leads.id, apt.leadId));

          if (!lead?.phone) {
            skipped++;
            continue;
          }

          // Try to find a matching customer for consent check
          const [customer] = await db
            .select({ id: customers.id })
            .from(customers)
            .where(
              and(
                eq(customers.businessId, apt.businessId),
                eq(customers.phone, lead.phone),
              ),
            )
            .limit(1);

          // Idempotency: skip if already scheduled for this appointment
          const todayStr = new Date().toISOString().split("T")[0];
          const [alreadyScheduled] = await db
            .select({ id: outboundCalls.id })
            .from(outboundCalls)
            .where(
              and(
                eq(outboundCalls.businessId, apt.businessId),
                eq(outboundCalls.callType, "appointment_reminder"),
                eq(outboundCalls.referenceId, apt.appointmentId),
                gte(outboundCalls.createdAt, todayStr),
              ),
            )
            .limit(1);

          if (alreadyScheduled) {
            skipped++;
            continue;
          }

          // Schedule the call for 9 AM in the business's LOCAL timezone
          const scheduledFor = localDateToUtc(tomorrowStr, "09:00:00", tz);
          const result = await scheduleOutboundCall({
            businessId: apt.businessId,
            customerId: customer?.id,
            customerPhone: lead.phone,
            callType: "appointment_reminder",
            referenceId: apt.appointmentId,
            scheduledFor,
            language: lead.language ?? biz.defaultLanguage ?? "en",
          });

          if (result.success) {
            scheduled++;
          } else {
            skipped++;
          }
        } catch (err) {
          reportError("Outbound reminder scheduling error", err, {
            extra: { appointmentId: apt.appointmentId },
          });
          skipped++;
        }
      }

      return NextResponse.json({
        total: upcoming.length,
        scheduled,
        skipped,
      });
    } catch (error) {
      reportError("Outbound reminders cron failed", error);
      return NextResponse.json({ error: "Cron failed" }, { status: 500 });
    }
  });
}
