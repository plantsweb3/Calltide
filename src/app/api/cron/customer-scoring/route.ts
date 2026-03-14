import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, customers, appointments, calls, estimates } from "@/db/schema";
import { eq, and, sql, count, gte } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { verifyCronAuth } from "@/lib/cron-auth";

/**
 * GET /api/cron/customer-scoring
 * Recalculates customer lifetime value, tiers, and auto-tags.
 * Runs daily at 3 AM CT (09:00 UTC).
 *
 * Tiers:
 * - vip: 5+ appointments OR lifetime_value >= 2000
 * - loyal: 3+ appointments OR lifetime_value >= 500
 * - at-risk: Last contact > 6 months ago AND was previously loyal/vip
 * - dormant: Last contact > 12 months ago
 * - new: everyone else
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("customer-scoring", "0 9 * * *", async () => {
    let updated = 0;
    let errors = 0;

    try {
      const activeBiz = await db
        .select({ id: businesses.id, avgJobValue: businesses.avgJobValue })
        .from(businesses)
        .where(eq(businesses.active, true));

      const now = new Date();
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const sixMonthsAgoISO = sixMonthsAgo.toISOString();

      const twelveMonthsAgo = new Date(now);
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const twelveMonthsAgoISO = twelveMonthsAgo.toISOString();

      for (const biz of activeBiz) {
        try {
          const allCustomers = await db
            .select()
            .from(customers)
            .where(
              and(
                eq(customers.businessId, biz.id),
                sql`${customers.deletedAt} IS NULL`,
              ),
            );

          const avgJobValue = biz.avgJobValue || 250;

          for (const customer of allCustomers) {
            try {
              // Calculate lifetime value from completed appointments
              const [apptCount] = await db
                .select({ total: count() })
                .from(appointments)
                .where(
                  and(
                    eq(appointments.businessId, biz.id),
                    sql`${appointments.leadId} IN (
                      SELECT id FROM leads WHERE phone = ${customer.phone} AND business_id = ${biz.id}
                    )`,
                    sql`${appointments.status} IN ('confirmed', 'completed')`,
                  ),
                );

              const totalAppts = apptCount?.total || 0;
              const lifetimeValue = totalAppts * avgJobValue;

              // Determine last contact date
              const lastContact = customer.lastCallAt || customer.createdAt;
              const lastContactDate = new Date(lastContact);

              // Calculate tier
              let tier: string;
              const previousTier = customer.tier;

              if (totalAppts >= 5 || lifetimeValue >= 2000) {
                // Check if at-risk (was VIP but no recent contact)
                if (lastContactDate < sixMonthsAgo) {
                  tier = "at-risk";
                } else {
                  tier = "vip";
                }
              } else if (totalAppts >= 3 || lifetimeValue >= 500) {
                if (lastContactDate < sixMonthsAgo) {
                  tier = "at-risk";
                } else {
                  tier = "loyal";
                }
              } else if (lastContactDate < twelveMonthsAgo) {
                tier = "dormant";
              } else if (lastContactDate < sixMonthsAgo && (previousTier === "loyal" || previousTier === "vip")) {
                tier = "at-risk";
              } else {
                tier = "new";
              }

              // Auto-tag based on behavior
              const tags = [...(customer.tags || [])];
              const addTag = (tag: string) => {
                if (!tags.includes(tag)) tags.push(tag);
              };
              const removeTag = (tag: string) => {
                const idx = tags.indexOf(tag);
                if (idx !== -1) tags.splice(idx, 1);
              };

              // Auto-tags
              if (totalAppts >= 5) addTag("repeat-customer");
              if (tier === "vip") { addTag("vip"); removeTag("at-risk"); removeTag("dormant"); }
              if (tier === "at-risk") { addTag("at-risk"); removeTag("vip"); }
              if (tier === "dormant") { addTag("dormant"); removeTag("at-risk"); removeTag("vip"); }
              if (customer.complaintCount && customer.complaintCount >= 2) addTag("frequent-complainer");

              // Only update if something changed
              if (
                tier !== customer.tier ||
                lifetimeValue !== customer.lifetimeValue ||
                totalAppts !== customer.totalAppointments ||
                JSON.stringify(tags) !== JSON.stringify(customer.tags)
              ) {
                await db
                  .update(customers)
                  .set({
                    tier,
                    lifetimeValue,
                    totalAppointments: totalAppts,
                    tags,
                    updatedAt: new Date().toISOString(),
                  })
                  .where(eq(customers.id, customer.id));
                updated++;
              }
            } catch (err) {
              errors++;
              reportError(`[customer-scoring] Error for customer ${customer.id}`, err);
            }
          }
        } catch (err) {
          errors++;
          reportError(`[customer-scoring] Error for business ${biz.id}`, err);
        }
      }

      return NextResponse.json({ success: true, updated, errors });
    } catch (err) {
      reportError("[customer-scoring] Fatal error", err);
      return NextResponse.json({ error: "Customer scoring cron failed" }, { status: 500 });
    }
  });
}
