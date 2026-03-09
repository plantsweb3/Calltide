import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { estimates, customers, businesses, outboundCalls } from "@/db/schema";
import { eq, and, lte, lt, gte, inArray } from "drizzle-orm";
import { scheduleOutboundCall } from "@/lib/outbound/engine";
import { reportError } from "@/lib/error-reporting";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";

/**
 * GET /api/cron/outbound-estimate-followup
 *
 * Schedules outbound follow-up calls for estimates needing attention.
 * Runs daily at 10AM CT. Only for businesses with outbound + estimate follow-ups enabled.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronMonitor("outbound-estimate-followup", "0 16 * * *", async () => {
    const now = new Date();
    const nowStr = now.toISOString();
    let scheduled = 0;
    let skipped = 0;

    try {
      // Find estimates due for follow-up (have a nextFollowUpAt that's passed)
      const dueEstimates = await db
        .select()
        .from(estimates)
        .where(
          and(
            lte(estimates.nextFollowUpAt, nowStr),
            inArray(estimates.status, ["new", "sent", "follow_up"]),
            lt(estimates.followUpCount, 3),
          ),
        );

      for (const est of dueEstimates) {
        try {
          // Check business config
          const [biz] = await db
            .select({
              outboundEnabled: businesses.outboundEnabled,
              estimateFollowups: businesses.estimateFollowups,
              defaultLanguage: businesses.defaultLanguage,
            })
            .from(businesses)
            .where(eq(businesses.id, est.businessId));

          if (!biz?.outboundEnabled || !biz?.estimateFollowups) {
            skipped++;
            continue;
          }

          // Get customer info
          const [customer] = await db
            .select()
            .from(customers)
            .where(eq(customers.id, est.customerId));

          if (!customer) {
            skipped++;
            continue;
          }

          // Idempotency: skip if already scheduled for this estimate today
          const todayStr = now.toISOString().split("T")[0];
          const [alreadyScheduled] = await db
            .select({ id: outboundCalls.id })
            .from(outboundCalls)
            .where(
              and(
                eq(outboundCalls.businessId, est.businessId),
                eq(outboundCalls.customerId, customer.id),
                eq(outboundCalls.callType, "estimate_followup"),
                eq(outboundCalls.referenceId, est.id),
                gte(outboundCalls.createdAt, todayStr),
              ),
            )
            .limit(1);

          if (alreadyScheduled) {
            skipped++;
            continue;
          }

          // Schedule outbound call
          const result = await scheduleOutboundCall({
            businessId: est.businessId,
            customerId: customer.id,
            customerPhone: customer.phone,
            callType: "estimate_followup",
            referenceId: est.id,
            scheduledFor: nowStr,
            language: customer.language ?? biz.defaultLanguage ?? "en",
          });

          if (result.success) {
            // Update estimate follow-up tracking
            const nextFollowUp = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
            await db
              .update(estimates)
              .set({
                followUpCount: (est.followUpCount ?? 0) + 1,
                lastFollowUpAt: nowStr,
                nextFollowUpAt: nextFollowUp,
                status: "follow_up",
                updatedAt: nowStr,
              })
              .where(eq(estimates.id, est.id));
            scheduled++;
          } else {
            skipped++;
          }
        } catch (err) {
          reportError("Outbound estimate follow-up error", err, {
            extra: { estimateId: est.id },
          });
          skipped++;
        }
      }

      return NextResponse.json({
        success: true,
        processed: dueEstimates.length,
        scheduled,
        skipped,
      });
    } catch (error) {
      reportError("Outbound estimate follow-up cron failed", error);
      return NextResponse.json({ error: "Cron failed" }, { status: 500 });
    }
  });
}
