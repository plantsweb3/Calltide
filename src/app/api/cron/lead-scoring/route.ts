import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  businesses,
  customers,
  calls,
  appointments,
  estimates,
  smsMessages,
} from "@/db/schema";
import { eq, and, gte, sql, inArray } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { withCronMonitor } from "@/lib/monitoring/sentry-crons";
import { verifyCronAuth } from "@/lib/cron-auth";

const BATCH_SIZE = 50;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type Tier = "hot" | "warm" | "cold" | "dormant";

function scoreToTier(score: number): Tier {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  if (score >= 1) return "cold";
  return "dormant";
}

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  return withCronMonitor("lead-scoring", "0 3 * * *", async () => {
    let scored = 0;
    let errors = 0;

    try {
      // Get all active businesses
      const activeBiz = await db
        .select({ id: businesses.id })
        .from(businesses)
        .where(eq(businesses.active, true));

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS).toISOString();
      const fourteenDaysAgo = new Date(now.getTime() - FOURTEEN_DAYS_MS).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS).toISOString();

      for (const biz of activeBiz) {
        try {
          // Get all non-deleted customers for this business
          const allCustomers = await db
            .select({
              id: customers.id,
              phone: customers.phone,
              isRepeat: customers.isRepeat,
              lastCallAt: customers.lastCallAt,
            })
            .from(customers)
            .where(
              and(
                eq(customers.businessId, biz.id),
                sql`${customers.deletedAt} IS NULL`,
              ),
            );

          // Process in batches
          for (let i = 0; i < allCustomers.length; i += BATCH_SIZE) {
            const batch = allCustomers.slice(i, i + BATCH_SIZE);
            const customerIds = batch.map((c) => c.id);

            // ── Batch queries: fetch all signals for this batch ──

            // 1. Call frequency in last 30 days per customer
            const callCounts = await db
              .select({
                customerId: calls.customerId,
                count: sql<number>`COUNT(*)`,
              })
              .from(calls)
              .where(
                and(
                  eq(calls.businessId, biz.id),
                  inArray(calls.customerId, customerIds),
                  gte(calls.createdAt, thirtyDaysAgo),
                ),
              )
              .groupBy(calls.customerId);

            const callCountMap = new Map(
              callCounts.map((r) => [r.customerId, r.count]),
            );

            // 2. Find leadIds associated with these customers (via calls)
            const customerLeadLinks = await db
              .select({
                customerId: calls.customerId,
                leadId: calls.leadId,
              })
              .from(calls)
              .where(
                and(
                  eq(calls.businessId, biz.id),
                  inArray(calls.customerId, customerIds),
                  sql`${calls.leadId} IS NOT NULL`,
                ),
              )
              .groupBy(calls.customerId, calls.leadId);

            // Build customerId -> Set<leadId> map
            const customerLeadMap = new Map<string, Set<string>>();
            for (const link of customerLeadLinks) {
              if (!link.customerId || !link.leadId) continue;
              if (!customerLeadMap.has(link.customerId)) {
                customerLeadMap.set(link.customerId, new Set());
              }
              customerLeadMap.get(link.customerId)!.add(link.leadId);
            }

            // Collect all unique leadIds for batch queries
            const allLeadIds = new Set<string>();
            for (const leadSet of customerLeadMap.values()) {
              for (const lid of leadSet) allLeadIds.add(lid);
            }
            const leadIdArray = Array.from(allLeadIds);

            // 3. Appointment completions in last 30 days (via leadId)
            let apptStatusMap = new Map<string, string>(); // leadId -> best status
            if (leadIdArray.length > 0) {
              const apptRows = await db
                .select({
                  leadId: appointments.leadId,
                  status: appointments.status,
                })
                .from(appointments)
                .where(
                  and(
                    eq(appointments.businessId, biz.id),
                    inArray(appointments.leadId, leadIdArray),
                    gte(appointments.createdAt, thirtyDaysAgo),
                  ),
                );

              // Track best status per lead: completed > confirmed > others
              for (const row of apptRows) {
                const current = apptStatusMap.get(row.leadId);
                if (row.status === "completed" || !current) {
                  apptStatusMap.set(row.leadId, row.status);
                } else if (row.status === "confirmed" && current !== "completed") {
                  apptStatusMap.set(row.leadId, row.status);
                }
              }
            }

            // 4. Estimate values in last 30 days per customer
            const estimateRows = await db
              .select({
                customerId: estimates.customerId,
                maxAmount: sql<number>`MAX(${estimates.amount})`,
              })
              .from(estimates)
              .where(
                and(
                  eq(estimates.businessId, biz.id),
                  inArray(estimates.customerId, customerIds),
                  gte(estimates.createdAt, thirtyDaysAgo),
                ),
              )
              .groupBy(estimates.customerId);

            const estimateMap = new Map(
              estimateRows.map((r) => [r.customerId, r.maxAmount ?? 0]),
            );

            // 5. SMS engagement in last 30 days (inbound SMS from lead)
            let smsEngagedLeads = new Set<string>();
            if (leadIdArray.length > 0) {
              const smsRows = await db
                .select({ leadId: smsMessages.leadId })
                .from(smsMessages)
                .where(
                  and(
                    eq(smsMessages.businessId, biz.id),
                    inArray(smsMessages.leadId, leadIdArray),
                    eq(smsMessages.direction, "inbound"),
                    gte(smsMessages.createdAt, thirtyDaysAgo),
                  ),
                )
                .groupBy(smsMessages.leadId);

              smsEngagedLeads = new Set(
                smsRows.map((r) => r.leadId).filter(Boolean) as string[],
              );
            }

            // ── Compute score for each customer in the batch ──
            const updates: { id: string; leadScore: number; tier: Tier }[] = [];

            for (const cust of batch) {
              let score = 0;

              // 1. Call frequency (max +20)
              const callCount = callCountMap.get(cust.id) ?? 0;
              if (callCount >= 3) {
                score += 20;
              } else if (callCount >= 1) {
                score += 10;
              }

              // 2. Appointment completion (max +25)
              const custLeadIds = customerLeadMap.get(cust.id);
              if (custLeadIds) {
                let bestApptStatus: string | null = null;
                for (const lid of custLeadIds) {
                  const status = apptStatusMap.get(lid);
                  if (status === "completed") {
                    bestApptStatus = "completed";
                    break;
                  }
                  if (status === "confirmed" && bestApptStatus !== "completed") {
                    bestApptStatus = "confirmed";
                  }
                }
                if (bestApptStatus === "completed") {
                  score += 25;
                } else if (bestApptStatus === "confirmed") {
                  score += 15;
                }
              }

              // 3. Estimate value (max +20)
              const maxEstimate = estimateMap.get(cust.id) ?? 0;
              if (maxEstimate > 500) {
                score += 20;
              } else if (maxEstimate > 100) {
                score += 10;
              }

              // 4. Recency (max +15)
              if (cust.lastCallAt) {
                const lastCall = new Date(cust.lastCallAt).getTime();
                const sevenAgo = new Date(sevenDaysAgo).getTime();
                const fourteenAgo = new Date(fourteenDaysAgo).getTime();
                const thirtyAgo = new Date(thirtyDaysAgo).getTime();

                if (lastCall >= sevenAgo) {
                  score += 15;
                } else if (lastCall >= fourteenAgo) {
                  score += 10;
                } else if (lastCall >= thirtyAgo) {
                  score += 5;
                }
              }

              // 5. SMS engagement (max +10)
              if (custLeadIds) {
                for (const lid of custLeadIds) {
                  if (smsEngagedLeads.has(lid)) {
                    score += 10;
                    break;
                  }
                }
              }

              // 6. Repeat customer (max +10)
              if (cust.isRepeat) {
                score += 10;
              }

              // Cap at 100
              score = Math.min(score, 100);

              const tier = scoreToTier(score);
              updates.push({ id: cust.id, leadScore: score, tier });
            }

            // ── Batch update customers ──
            const updatedAt = new Date().toISOString();
            for (const u of updates) {
              await db
                .update(customers)
                .set({
                  leadScore: u.leadScore,
                  tier: u.tier,
                  updatedAt,
                })
                .where(eq(customers.id, u.id));
            }

            scored += updates.length;
          }
        } catch (err) {
          errors++;
          reportError(`[lead-scoring] Error for business ${biz.id}`, err);
        }
      }

      return NextResponse.json({
        success: true,
        businesses: activeBiz.length,
        scored,
        errors,
      });
    } catch (err) {
      reportError("[lead-scoring] Fatal error", err);
      return NextResponse.json(
        { error: "Lead scoring failed" },
        { status: 500 },
      );
    }
  });
}
