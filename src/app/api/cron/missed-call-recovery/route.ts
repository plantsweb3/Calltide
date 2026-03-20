import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, calls, leads, outreachLog, smsOptOuts } from "@/db/schema";
import { eq, and, lt, gte, sql, isNull } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { sendSMS } from "@/lib/twilio/sms";
import { canSendSms, normalizePhone } from "@/lib/compliance/sms";
import { env } from "@/lib/env";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { verifyCronAuth } from "@/lib/cron-auth";

const ABANDONED_THRESHOLD_SECONDS = 15;
const RECOVERY_DELAY_MINUTES = 2;
const RATE_LIMIT_HOURS = 24;

/**
 * GET /api/cron/missed-call-recovery
 * Finds abandoned calls (< 15s) from 2+ minutes ago and sends recovery SMS.
 * Runs every 10 minutes via Vercel cron.
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("missed-call-recovery", "*/10 * * * *", async () => {
    const now = new Date();

    // Only look at calls from the last hour (avoid scanning entire table)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    // Must be at least 2 minutes old (give caller time to call back)
    const twoMinutesAgo = new Date(now.getTime() - RECOVERY_DELAY_MINUTES * 60 * 1000);
    // Rate limit window
    const rateLimitCutoff = new Date(now.getTime() - RATE_LIMIT_HOURS * 60 * 60 * 1000);

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    try {
      // Find completed inbound calls with short duration, not yet processed for recovery
      const abandonedCalls = await db
        .select({
          callId: calls.id,
          businessId: calls.businessId,
          leadId: calls.leadId,
          callerPhone: calls.callerPhone,
          calledPhone: calls.calledPhone,
          duration: calls.duration,
          createdAt: calls.createdAt,
        })
        .from(calls)
        .where(
          and(
            eq(calls.direction, "inbound"),
            eq(calls.status, "completed"),
            lt(calls.duration, ABANDONED_THRESHOLD_SECONDS),
            isNull(calls.recoveryStatus),
            eq(calls.isAbandoned, false),
            gte(calls.createdAt, oneHourAgo.toISOString()),
            lt(calls.createdAt, twoMinutesAgo.toISOString()),
          ),
        );

      for (const call of abandonedCalls) {
        try {
          if (!call.callerPhone) {
            skipped++;
            continue;
          }

          // Mark as abandoned regardless of whether we send SMS
          await db.update(calls).set({
            isAbandoned: true,
            updatedAt: now.toISOString(),
          }).where(eq(calls.id, call.callId));

          // Check if caller called back within the delay window
          const [callback] = await db
            .select({ id: calls.id })
            .from(calls)
            .where(
              and(
                eq(calls.businessId, call.businessId),
                eq(calls.callerPhone, call.callerPhone),
                eq(calls.direction, "inbound"),
                gte(calls.createdAt, call.createdAt),
                sql`${calls.id} != ${call.callId}`,
              ),
            )
            .limit(1);

          if (callback) {
            skipped++; // They called back, no recovery needed
            continue;
          }

          // Get business
          const [biz] = await db
            .select()
            .from(businesses)
            .where(eq(businesses.id, call.businessId))
            .limit(1);

          if (!biz || !biz.active) {
            skipped++;
            continue;
          }

          // Check business has recovery enabled
          if (biz.enableMissedCallRecovery === false) {
            skipped++;
            continue;
          }

          // Rate limit: 1 recovery text per phone per 24 hours
          const [recentRecovery] = await db
            .select({ id: calls.id })
            .from(calls)
            .where(
              and(
                eq(calls.callerPhone, call.callerPhone),
                eq(calls.isAbandoned, true),
                sql`${calls.recoveryStatus} IS NOT NULL`,
                gte(calls.recoverySmsSentAt, rateLimitCutoff.toISOString()),
              ),
            )
            .limit(1);

          if (recentRecovery) {
            skipped++;
            continue;
          }

          // Check lead SMS opt-out
          if (call.leadId) {
            const [lead] = await db
              .select({ smsOptOut: leads.smsOptOut })
              .from(leads)
              .where(eq(leads.id, call.leadId))
              .limit(1);

            if (lead?.smsOptOut) {
              skipped++;
              continue;
            }
          }

          // Check global SMS opt-out table (smsOptOuts)
          const normalizedCallerPhone = normalizePhone(call.callerPhone);
          const [globalOptOut] = await db
            .select({ id: smsOptOuts.id })
            .from(smsOptOuts)
            .where(
              and(
                eq(smsOptOuts.phoneNumber, normalizedCallerPhone),
                isNull(smsOptOuts.reoptedInAt),
              ),
            )
            .limit(1);

          if (globalOptOut) {
            skipped++;
            continue;
          }

          // TCPA compliance check (use business timezone for quiet hours)
          const tz = biz.timezone || "America/Chicago";
          try {
            const smsCheck = await canSendSms(call.callerPhone, tz);
            if (!smsCheck.allowed) {
              skipped++;
              continue;
            }
          } catch {
            // Non-fatal: proceed if compliance check errors
          }

          // Detect language from lead or default to English
          let language = "en";
          if (call.leadId) {
            const [lead] = await db
              .select({ language: leads.language })
              .from(leads)
              .where(eq(leads.id, call.leadId))
              .limit(1);
            if (lead?.language) language = lead.language;
          }

          const receptionistName = biz.receptionistName || "Maria";

          // Build recovery SMS
          const smsBody = language === "es"
            ? `¡Hola! Somos ${biz.name}. Vimos que nos llamó hace poco. ¿Podemos ayudarle con algo? Responda SÍ y nos comunicaremos pronto. — ${receptionistName}\n\nResponda STOP para cancelar`
            : `Hi! This is ${biz.name}. We saw you called us a little while ago. Can we help you with anything? Reply YES and we'll reach out shortly. — ${receptionistName}\n\nReply STOP to opt out`;

          const result = await sendSMS({
            to: call.callerPhone,
            from: biz.twilioNumber,
            body: smsBody,
            businessId: biz.id,
            leadId: call.leadId || undefined,
            callId: call.callId,
            templateType: "missed_call_recovery",
          });

          if (result.success) {
            await db.update(calls).set({
              recoveryStatus: "sms_sent",
              recoverySmsSentAt: now.toISOString(),
              updatedAt: now.toISOString(),
            }).where(eq(calls.id, call.callId));

            await db.insert(outreachLog).values({
              businessId: biz.id,
              source: "missed_call_recovery",
              channel: "sms",
            });

            sent++;
          } else {
            errors++;
            reportError(`[missed-call-recovery] SMS failed for call ${call.callId}`, result.error);
          }
        } catch (err) {
          errors++;
          reportError(`[missed-call-recovery] Error for call ${call.callId}`, err);
        }
      }

      return NextResponse.json({
        success: true,
        found: abandonedCalls.length,
        sent,
        skipped,
        errors,
      });
    } catch (err) {
      reportError("[missed-call-recovery] Fatal error", err);
      return NextResponse.json({ error: "Missed call recovery failed" }, { status: 500 });
    }
  });
}
