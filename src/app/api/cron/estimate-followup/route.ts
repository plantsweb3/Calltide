import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { estimates, customers, businesses } from "@/db/schema";
import { eq, and, lte, lt, inArray, count } from "drizzle-orm";
import { sendSMS } from "@/lib/twilio/sms";
import { canSendSms } from "@/lib/compliance/sms";
import { getEstimateFollowUpMessage } from "@/lib/sms-templates";
import { reportError } from "@/lib/error-reporting";

export async function GET(req: NextRequest) {
  // Auth: CRON_SECRET required
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const nowStr = now.toISOString();
  let sent = 0;
  let expired = 0;

  try {
    // Find estimates due for follow-up
    const dueEstimates = await db
      .select()
      .from(estimates)
      .where(
        and(
          lte(estimates.nextFollowUpAt, nowStr),
          inArray(estimates.status, ["new", "sent", "follow_up"]),
          lt(estimates.followUpCount, 3),
        )
      );

    for (const est of dueEstimates) {
      try {
        const [customer] = await db.select().from(customers).where(eq(customers.id, est.customerId)).limit(1);
        if (!customer) continue;

        const [biz] = await db.select().from(businesses).where(eq(businesses.id, est.businessId)).limit(1);
        if (!biz) continue;

        // TCPA check
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
          from: biz.twilioNumber,
          body,
          businessId: est.businessId,
          templateType: "estimate_follow_up",
        });

        if (smsResult.success) {
          const nextFollowUp = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
          await db.update(estimates).set({
            followUpCount: (est.followUpCount || 0) + 1,
            lastFollowUpAt: nowStr,
            nextFollowUpAt: nextFollowUp,
            status: "follow_up",
            updatedAt: nowStr,
          }).where(eq(estimates.id, est.id));
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
}
