import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, leads, businesses } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendSMS } from "@/lib/twilio/sms";
import { getReminderMessage } from "@/lib/sms-templates";
import { getBusinessDateRange } from "@/lib/timezone";
import type { Language } from "@/types";

/**
 * GET /api/cron/reminders
 *
 * Sends SMS reminders for appointments happening tomorrow.
 * Designed to be called once daily by Vercel Cron (or similar).
 *
 * Protect with CRON_SECRET header in production:
 *   vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 14 * * *" }] }
 */
export async function GET(req: NextRequest) {
  // Verify cron secret — mandatory in production
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Query a wide window of upcoming appointments (next 2 days UTC) then filter per business timezone
  const wideTomorrow = new Date();
  wideTomorrow.setDate(wideTomorrow.getDate() + 2);
  const wideStart = new Date().toISOString().split("T")[0];
  const wideEnd = wideTomorrow.toISOString().split("T")[0];

  // Find confirmed appointments in the wide window that haven't had reminders sent
  const upcoming = await db
    .select({
      appointmentId: appointments.id,
      service: appointments.service,
      date: appointments.date,
      time: appointments.time,
      status: appointments.status,
      leadId: appointments.leadId,
      businessId: appointments.businessId,
    })
    .from(appointments)
    .where(
      and(
        sql`${appointments.date} >= ${wideStart}`,
        sql`${appointments.date} <= ${wideEnd}`,
        eq(appointments.status, "confirmed"),
        eq(appointments.reminderSent, false)
      )
    );

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  // Cache business lookups
  const bizCache = new Map<string, typeof businesses.$inferSelect | null>();

  for (const apt of upcoming) {
    // Look up business (cached)
    let biz = bizCache.get(apt.businessId);
    if (biz === undefined) {
      const [result] = await db
        .select()
        .from(businesses)
        .where(eq(businesses.id, apt.businessId))
        .limit(1);
      biz = result ?? null;
      bizCache.set(apt.businessId, biz);
    }

    if (!biz) {
      failed++;
      continue;
    }

    // Check if this appointment's date is actually "tomorrow" in the business's timezone
    const tz = biz.timezone || "America/Chicago";
    const { dateStr: tomorrowStr } = getBusinessDateRange(tz, 1);
    if (apt.date !== tomorrowStr) {
      skipped++;
      continue;
    }

    // Re-check appointment status (may have been cancelled since query)
    const [freshApt] = await db
      .select({ status: appointments.status, reminderSent: appointments.reminderSent })
      .from(appointments)
      .where(eq(appointments.id, apt.appointmentId))
      .limit(1);

    if (!freshApt || freshApt.status !== "confirmed" || freshApt.reminderSent) {
      skipped++;
      continue;
    }

    // Look up lead phone
    const [lead] = await db
      .select({ phone: leads.phone, name: leads.name, language: leads.language })
      .from(leads)
      .where(eq(leads.id, apt.leadId))
      .limit(1);

    if (!lead?.phone) {
      failed++;
      continue;
    }

    const lang = (lead.language as Language) || "en";
    const body = getReminderMessage(
      {
        businessName: biz.name,
        service: apt.service,
        date: apt.date,
        time: apt.time,
      },
      lang
    );

    const result = await sendSMS({
      to: lead.phone,
      from: biz.twilioNumber,
      body,
      businessId: apt.businessId,
      leadId: apt.leadId,
      templateType: "reminder",
    });

    if (result.success) {
      // Mark reminder as sent
      await db
        .update(appointments)
        .set({ reminderSent: true, updatedAt: new Date().toISOString() })
        .where(eq(appointments.id, apt.appointmentId));
      sent++;
    } else {
      failed++;
    }
  }

  return NextResponse.json({
    total: upcoming.length,
    sent,
    failed,
    skipped,
  });
}
