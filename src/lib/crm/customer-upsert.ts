import { db } from "@/db";
import { calls, leads, customers } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

interface CallContext {
  callerName: string | null;
  serviceRequested: string | null;
}

/**
 * After a call completes, upsert a customer record from the call data.
 * Uses ON CONFLICT DO UPDATE on the unique (business_id, phone) index.
 */
export async function upsertCustomerFromCall(callId: string, context: CallContext): Promise<void> {
  const [call] = await db.select().from(calls).where(eq(calls.id, callId)).limit(1);
  if (!call || !call.callerPhone) return;

  // Get lead info (name, email) if available
  let leadName: string | null = null;
  let leadEmail: string | null = null;
  if (call.leadId) {
    const [lead] = await db.select().from(leads).where(eq(leads.id, call.leadId)).limit(1);
    if (lead) {
      leadName = lead.name;
      leadEmail = lead.email;
    }
  }

  const name = context.callerName || leadName || null;
  const now = new Date().toISOString();
  const phone = call.callerPhone;

  // Check if customer exists (include soft-deleted to avoid unique constraint violations)
  const [existing] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.businessId, call.businessId), eq(customers.phone, phone)))
    .limit(1);

  // Reactivate soft-deleted customer if needed
  if (existing?.deletedAt) {
    await db.update(customers).set({ deletedAt: null, updatedAt: now }).where(eq(customers.id, existing.id));
  }

  let customerId: string;

  if (existing) {
    // Update existing customer
    customerId = existing.id;
    const updates: Record<string, unknown> = {
      totalCalls: sql`${customers.totalCalls} + 1`,
      lastCallAt: now,
      isRepeat: true,
      updatedAt: now,
    };

    // Update name if we have a better one (non-null replaces null)
    if (name && !existing.name) {
      updates.name = name;
    }

    // Update email if we have one
    if (leadEmail && !existing.email) {
      updates.email = leadEmail;
    }

    // Update language from call
    if (call.language) {
      updates.language = call.language;
    }

    // Increment appointments if this call booked one
    if (call.outcome === "appointment_booked") {
      updates.totalAppointments = sql`${customers.totalAppointments} + 1`;
    }

    await db.update(customers).set(updates).where(eq(customers.id, existing.id));
  } else {
    // Create new customer
    const [created] = await db.insert(customers).values({
      businessId: call.businessId,
      phone,
      name,
      email: leadEmail,
      language: call.language || "en",
      source: "inbound_call",
      totalCalls: 1,
      totalAppointments: call.outcome === "appointment_booked" ? 1 : 0,
      firstCallAt: now,
      lastCallAt: now,
      isRepeat: false,
    }).returning();

    customerId = created.id;

    // Fire webhook for new customer (fire-and-forget)
    import("@/lib/webhooks/dispatcher").then(({ dispatchWebhook }) => {
      dispatchWebhook(call.businessId, "customer.created", {
        customerId: created.id,
        phone,
        name,
        language: call.language || "en",
        source: "inbound_call",
        callId,
      }).catch(() => {});
    }).catch(() => {});
  }

  // Link call to customer
  await db.update(calls).set({ customerId, updatedAt: now }).where(eq(calls.id, callId));
}
