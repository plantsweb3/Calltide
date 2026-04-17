import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { estimates, customers, businesses, leads } from "@/db/schema";
import { and, lte, lt, inArray, count, sql } from "drizzle-orm";
import { sendSMS } from "@/lib/twilio/sms";
import { canSendSms } from "@/lib/compliance/sms";
import { getEstimateFollowUpMessage } from "@/lib/sms-templates";
import { reportError } from "@/lib/error-reporting";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("estimate-followup", "30 15 * * *", async () => {
    const now = new Date();
    const nowStr = now.toISOString();
    let sent = 0;
    let expired = 0;

    try {
      // Atomic claim: advance nextFollowUpAt + increment count + flip status in a
      // single UPDATE so concurrent cron runs / retries never double-send.
      const nextFollowUp = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const dueEstimates = await db
        .update(estimates)
        .set({
          followUpCount: sql`${estimates.followUpCount} + 1`,
          lastFollowUpAt: nowStr,
          nextFollowUpAt: nextFollowUp,
          status: "follow_up",
          updatedAt: nowStr,
        })
        .where(
          and(
            lte(estimates.nextFollowUpAt, nowStr),
            inArray(estimates.status, ["new", "sent", "follow_up"]),
            lt(estimates.followUpCount, 3),
          )
        )
        .returning();

      // Batch-fetch customers and businesses to avoid N+1 queries
      const customerIds = [...new Set(dueEstimates.map((e) => e.customerId).filter(Boolean))] as string[];
      const businessIds = [...new Set(dueEstimates.map((e) => e.businessId).filter(Boolean))] as string[];

      const customerRows = customerIds.length > 0
        ? await db.select().from(customers).where(inArray(customers.id, customerIds))
        : [];
      const customerMap = new Map(customerRows.map((c) => [c.id, c]));

      const bizRows = businessIds.length > 0
        ? await db.select().from(businesses).where(inArray(businesses.id, businessIds))
        : [];
      const bizMap = new Map(bizRows.map((b) => [b.id, b]));

      // Batch-fetch lead opt-outs for all relevant business+phone pairs
      const leadPhonePairs = dueEstimates
        .map((e) => ({ businessId: e.businessId, phone: customerMap.get(e.customerId!)?.phone }))
        .filter((p) => p.businessId && p.phone);
      const leadBusinessIds = [...new Set(leadPhonePairs.map((p) => p.businessId).filter(Boolean))] as string[];
      const leadRows = leadBusinessIds.length > 0
        ? await db.select().from(leads).where(inArray(leads.businessId, leadBusinessIds))
        : [];
      const leadOptOutSet = new Set(
        leadRows.filter((l) => l.smsOptOut).map((l) => `${l.businessId}:${l.phone}`)
      );

      for (const est of dueEstimates) {
        try {
          const customer = customerMap.get(est.customerId!);
          if (!customer) continue;

          const biz = bizMap.get(est.businessId);
          if (!biz) continue;

          // Lead-level opt-out check
          if (leadOptOutSet.has(`${est.businessId}:${customer.phone}`)) continue;

          // TCPA check (global smsOptOuts table + quiet hours)
          const smsCheck = await canSendSms(customer.phone);
          if (!smsCheck.allowed) continue;

          const lang = (customer.language === "es" ? "es" : "en") as "en" | "es";
          const body = getEstimateFollowUpMessage(
            {
              customerName: customer.name || "there",
              service: est.service || "your inquiry",
              businessName: biz.name,
              businessPhone: biz.twilioNumber,
            },
            lang
          );

          const smsResult = await sendSMS({
            to: customer.phone,
            from: biz.twilioNumber || process.env.TWILIO_PHONE_NUMBER || "",
            body,
            businessId: est.businessId,
            templateType: "estimate_follow_up",
          });

          if (smsResult.success) {
            // Claim already advanced counters — just count the outcome.
            sent++;
          }
        } catch (err) {
          reportError("Estimate follow-up cron error", err, { extra: { estimateId: est.id } });
        }
      }

      // Expire estimates >30 days old still in new/follow_up
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Count how many will be expired before updating
      const [expiredCount] = await db
        .select({ count: count() })
        .from(estimates)
        .where(
          and(
            inArray(estimates.status, ["new", "follow_up"]),
            lte(estimates.createdAt, thirtyDaysAgo),
          )
        );
      expired = expiredCount.count;

      if (expired > 0) {
        await db
          .update(estimates)
          .set({ status: "expired", nextFollowUpAt: null, updatedAt: nowStr })
          .where(
            and(
              inArray(estimates.status, ["new", "follow_up"]),
              lte(estimates.createdAt, thirtyDaysAgo),
            )
          );
      }

      return NextResponse.json({
        success: true,
        sent,
        expired,
        processed: dueEstimates.length,
      });
    } catch (error) {
      reportError("Estimate follow-up cron failed", error);
      return NextResponse.json({ error: "Cron failed" }, { status: 500 });
    }
  });
}
