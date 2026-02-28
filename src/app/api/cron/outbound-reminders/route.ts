import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, leads, businesses, customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { scheduleOutboundCall } from "@/lib/outbound/engine";
import { reportError } from "@/lib/error-reporting";

/**
 * GET /api/cron/outbound-reminders
 *
 * Schedules outbound reminder calls for appointments happening tomorrow.
 * Runs daily at 6PM CT. Only for businesses with outbound + appointment reminders enabled.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  let scheduled = 0;
  let skipped = 0;

  try {
    // Find confirmed appointments for tomorrow
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
          eq(appointments.date, tomorrowStr),
          eq(appointments.status, "confirmed"),
        ),
      );

    for (const apt of upcoming) {
      try {
        // Check business has outbound enabled
        const [biz] = await db
          .select({
            outboundEnabled: businesses.outboundEnabled,
            appointmentReminders: businesses.appointmentReminders,
            defaultLanguage: businesses.defaultLanguage,
          })
          .from(businesses)
          .where(eq(businesses.id, apt.businessId));

        if (!biz?.outboundEnabled || !biz?.appointmentReminders) {
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

        // Schedule the call for tomorrow morning (business will dispatch within calling hours)
        const scheduledFor = `${tomorrowStr}T09:00:00.000Z`;
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
      date: tomorrowStr,
      total: upcoming.length,
      scheduled,
      skipped,
    });
  } catch (error) {
    reportError("Outbound reminders cron failed", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
