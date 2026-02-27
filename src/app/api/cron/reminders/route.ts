import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, leads, businesses } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendSMS } from "@/lib/twilio/sms";
import { getReminderMessage } from "@/lib/sms-templates";
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

  // Calculate tomorrow's date in UTC (good enough for daily reminders)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

  // Find confirmed appointments for tomorrow that haven't had reminders sent
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
        eq(appointments.reminderSent, false)
      )
    );

  let sent = 0;
  let failed = 0;

  for (const apt of upcoming) {
    // Look up lead phone and business info
    const [lead] = await db
      .select({ phone: leads.phone, name: leads.name, language: leads.language })
      .from(leads)
      .where(eq(leads.id, apt.leadId))
      .limit(1);

    const [biz] = await db
      .select({ name: businesses.name, twilioNumber: businesses.twilioNumber })
      .from(businesses)
      .where(eq(businesses.id, apt.businessId))
      .limit(1);

    if (!lead?.phone || !biz) {
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
    date: tomorrowStr,
    total: upcoming.length,
    sent,
    failed,
  });
}
