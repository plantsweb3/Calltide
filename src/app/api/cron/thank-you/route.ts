import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, appointments, leads } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { sendSMS } from "@/lib/twilio/sms";
import { canSendSms } from "@/lib/compliance/sms";
import { getBusinessDateRange } from "@/lib/timezone";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { verifyCronAuth } from "@/lib/cron-auth";

/**
 * GET /api/cron/thank-you
 * Sends a thank-you SMS to customers after their appointment is completed.
 * Runs daily at 6 PM CT (00:00 UTC next day) — after the workday ends.
 * Staggers with review requests (which run at 10 AM CT the next day).
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("thank-you-sms", "0 0 * * *", async () => {
    let sent = 0;
    let skipped = 0;
    let errors = 0;

    try {
      const activeBiz = await db
        .select()
        .from(businesses)
        .where(
          and(
            eq(businesses.active, true),
            eq(businesses.enableThankYouSms, true),
          ),
        );

      for (const biz of activeBiz) {
        try {
          const tz = biz.timezone || "America/Chicago";
          const { dateStr: todayDate } = getBusinessDateRange(tz, 0);

          // Find today's completed/confirmed appointments that haven't received a thank-you
          const todayAppts = await db
            .select({
              appointmentId: appointments.id,
              leadId: appointments.leadId,
              service: appointments.service,
            })
            .from(appointments)
            .where(
              and(
                eq(appointments.businessId, biz.id),
                eq(appointments.date, todayDate),
                sql`${appointments.status} IN ('confirmed', 'completed')`,
                eq(appointments.thankYouSent, false),
              ),
            );

          for (const appt of todayAppts) {
            try {
              const [lead] = await db
                .select({ id: leads.id, phone: leads.phone, name: leads.name, language: leads.language, smsOptOut: leads.smsOptOut })
                .from(leads)
                .where(eq(leads.id, appt.leadId))
                .limit(1);

              if (!lead?.phone || lead.smsOptOut) {
                skipped++;
                continue;
              }

              try {
                const smsCheck = await canSendSms(lead.phone, tz);
                if (!smsCheck.allowed) {
                  skipped++;
                  continue;
                }
              } catch {
                // Non-fatal
              }

              const customerName = lead.name?.split(" ")[0] || "";
              const receptionistName = biz.receptionistName || "Maria";
              const lang = lead.language || "en";

              const smsBody = lang === "es"
                ? `${customerName ? `${customerName}, g` : "G"}racias por confiar en ${biz.name} hoy. Esperamos haberle brindado un excelente servicio. Si necesita algo más, no dude en llamarnos.\n\n— ${receptionistName} de ${biz.name}\n\nResponda STOP para cancelar`
                : `${customerName ? `${customerName}, t` : "T"}hank you for choosing ${biz.name} today. We hope everything went well! If you need anything else, don't hesitate to call us.\n\n— ${receptionistName} at ${biz.name}\n\nReply STOP to opt out`;

              const result = await sendSMS({
                to: lead.phone,
                from: biz.twilioNumber,
                body: smsBody,
                businessId: biz.id,
                leadId: lead.id,
                templateType: "thank_you",
              });

              if (result.success) {
                await db
                  .update(appointments)
                  .set({ thankYouSent: true, updatedAt: new Date().toISOString() })
                  .where(eq(appointments.id, appt.appointmentId));
                sent++;
              } else {
                errors++;
              }
            } catch (err) {
              errors++;
              reportError(`[thank-you] Error for appt ${appt.appointmentId}`, err);
            }
          }
        } catch (err) {
          errors++;
          reportError(`[thank-you] Error for business ${biz.id}`, err);
        }
      }

      return NextResponse.json({ success: true, sent, skipped, errors });
    } catch (err) {
      reportError("[thank-you] Fatal error", err);
      return NextResponse.json({ error: "Thank-you cron failed" }, { status: 500 });
    }
  });
}
