import { db } from "@/db";
import { calls, customers, estimates } from "@/db/schema";
import { eq, and, gte, isNull } from "drizzle-orm";

/**
 * Auto-create an estimate when a call outcome is "estimate_requested".
 * Deduplicates: skips if an estimate for the same customer+service exists within 24h.
 */
export async function autoCreateEstimate(callId: string, serviceRequested: string | null): Promise<void> {
  const [call] = await db.select().from(calls).where(eq(calls.id, callId)).limit(1);
  if (!call || !call.callerPhone) return;
  if (call.outcome !== "estimate_requested") return;

  // Find the customer record (skip soft-deleted)
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.businessId, call.businessId), eq(customers.phone, call.callerPhone), isNull(customers.deletedAt)))
    .limit(1);

  if (!customer) return;

  // Deduplicate: check if an estimate for the same customer+service exists in last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const service = serviceRequested || "General Inquiry";

  const [existing] = await db
    .select({ id: estimates.id })
    .from(estimates)
    .where(
      and(
        eq(estimates.customerId, customer.id),
        eq(estimates.service, service),
        gte(estimates.createdAt, oneDayAgo),
      )
    )
    .limit(1);

  if (existing) return;

  // Create the estimate with follow-up in 3 days
  const now = new Date();
  const followUpAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

  await db.insert(estimates).values({
    businessId: call.businessId,
    customerId: customer.id,
    callId: call.id,
    service,
    description: call.summary || undefined,
    status: "new",
    nextFollowUpAt: followUpAt,
  });

  // Increment totalEstimates on customer
  await db.update(customers).set({
    totalEstimates: (customer.totalEstimates || 0) + 1,
    updatedAt: now.toISOString(),
  }).where(eq(customers.id, customer.id));
}
