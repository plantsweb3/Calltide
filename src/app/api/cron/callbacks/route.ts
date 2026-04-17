import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { callbacks, businesses, smsOptOuts } from "@/db/schema";
import { eq, and, lte, isNull, inArray } from "drizzle-orm";
import { verifyCronAuth } from "@/lib/cron-auth";
import { reportError } from "@/lib/error-reporting";
import { sendSMS } from "@/lib/twilio/sms";
import { normalizePhone } from "@/lib/compliance/sms";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { isOwnerInQuietHours } from "@/lib/notifications/quiet-hours";

/**
 * GET /api/cron/callbacks
 * Processes scheduled callbacks that are due. Sends an SMS reminder
 * to the business owner with the customer's phone number and reason.
 * Runs every 5 minutes via Vercel cron.
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("callbacks", "*/5 * * * *", async () => {
    const now = new Date().toISOString();
    let processed = 0;
    let failed = 0;

    try {
      // Find candidates then atomically claim by id + status so concurrent cron
      // runs don't double-process the same callback.
      const candidates = await db
        .select({ id: callbacks.id })
        .from(callbacks)
        .where(
          and(
            eq(callbacks.status, "scheduled"),
            lte(callbacks.requestedTime, now),
          ),
        )
        .limit(10);

      const dueCallbacks = candidates.length === 0 ? [] : await db
        .update(callbacks)
        .set({ status: "calling", updatedAt: now })
        .where(
          and(
            inArray(callbacks.id, candidates.map((c) => c.id)),
            eq(callbacks.status, "scheduled"),
          ),
        )
        .returning();

      for (const cb of dueCallbacks) {
        try {
          // Look up business for Twilio number and owner phone
          const [biz] = await db
            .select()
            .from(businesses)
            .where(eq(businesses.id, cb.businessId))
            .limit(1);

          if (!biz || !biz.active) {
            await db
              .update(callbacks)
              .set({ status: "failed", updatedAt: new Date().toISOString() })
              .where(eq(callbacks.id, cb.id));
            failed++;
            continue;
          }

          // Skip during quiet hours — routine callback alert
          if (isOwnerInQuietHours(biz)) {
            // Re-mark as scheduled so it gets picked up next run
            await db
              .update(callbacks)
              .set({ status: "scheduled", updatedAt: new Date().toISOString() })
              .where(eq(callbacks.id, cb.id));
            continue;
          }

          // Send SMS reminder to the owner about the callback
          if (biz.ownerPhone && biz.twilioNumber) {
            // Check owner SMS opt-out
            const normalizedOwnerPhone = normalizePhone(biz.ownerPhone);
            const [ownerOptOut] = await db
              .select({ id: smsOptOuts.id })
              .from(smsOptOuts)
              .where(
                and(
                  eq(smsOptOuts.phoneNumber, normalizedOwnerPhone),
                  isNull(smsOptOuts.reoptedInAt),
                ),
              )
              .limit(1);

            if (!ownerOptOut) {
              const customerDisplay = cb.customerName || "Customer";
              const reasonLine = cb.reason ? ` — ${cb.reason}` : "";

              await sendSMS({
                to: biz.ownerPhone,
                from: biz.twilioNumber || process.env.TWILIO_PHONE_NUMBER || "",
                body: `Callback due now: ${customerDisplay} at ${cb.customerPhone}${reasonLine}. They requested a callback for this time.`,
                businessId: biz.id,
                templateType: "owner_notify",
              });
            }
          }

          await db
            .update(callbacks)
            .set({ status: "completed", updatedAt: new Date().toISOString() })
            .where(eq(callbacks.id, cb.id));

          processed++;
        } catch (err) {
          reportError("Callback execution failed", err, { extra: { callbackId: cb.id } });
          await db
            .update(callbacks)
            .set({ status: "failed", updatedAt: new Date().toISOString() })
            .where(eq(callbacks.id, cb.id));
          failed++;
        }
      }

      return NextResponse.json({
        success: true,
        found: dueCallbacks.length,
        processed,
        failed,
      });
    } catch (err) {
      reportError("[cron/callbacks] Fatal error", err);
      return NextResponse.json({ error: "Callback processing failed" }, { status: 500 });
    }
  });
}
