import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  customers,
  calls,
  estimates,
  customerNotes,
  leads,
  churnRiskScores,
  escalations,
  invoices,
  outboundCalls,
} from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import { DEMO_BUSINESS_ID } from "../../demo-data";

// ── Input validation ──

const mergeCustomersSchema = z
  .object({
    primaryId: z.string().uuid("Invalid primary customer ID"),
    secondaryId: z.string().uuid("Invalid secondary customer ID"),
  })
  .refine((data) => data.primaryId !== data.secondaryId, {
    message: "Cannot merge a customer with itself",
  });

// ── POST: Merge two customer records ──

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`customer-merge:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  // ── Demo mode ──
  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true, message: "Demo mode — not saved" });
  }

  // ── Parse body ──
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = mergeCustomersSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { primaryId, secondaryId } = parsed.data;

  try {
    // ── Fetch both customers with IDOR protection ──
    const [primary] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.id, primaryId),
          eq(customers.businessId, businessId),
          isNull(customers.deletedAt)
        )
      )
      .limit(1);

    if (!primary) {
      return NextResponse.json(
        { error: "Primary customer not found" },
        { status: 404 }
      );
    }

    const [secondary] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.id, secondaryId),
          eq(customers.businessId, businessId),
          isNull(customers.deletedAt)
        )
      )
      .limit(1);

    if (!secondary) {
      return NextResponse.json(
        { error: "Secondary customer not found" },
        { status: 404 }
      );
    }

    // ── Merge within a transaction ──
    const merged = await db.transaction(async (tx) => {
      // 1. Reassign calls from secondary to primary
      await tx
        .update(calls)
        .set({ customerId: primaryId, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(calls.customerId, secondaryId),
            eq(calls.businessId, businessId)
          )
        );

      // 2. Reassign leads from secondary's phone to primary's phone
      //    This transitively moves appointments (linked via leadId)
      await tx
        .update(leads)
        .set({ phone: primary.phone, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(leads.phone, secondary.phone),
            eq(leads.businessId, businessId)
          )
        );

      // 3. Reassign estimates from secondary to primary
      await tx
        .update(estimates)
        .set({ customerId: primaryId, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(estimates.customerId, secondaryId),
            eq(estimates.businessId, businessId)
          )
        );

      // 4. Reassign customer notes from secondary to primary
      await tx
        .update(customerNotes)
        .set({ customerId: primaryId })
        .where(eq(customerNotes.customerId, secondaryId));

      // 5. Reassign churn risk scores
      await tx
        .update(churnRiskScores)
        .set({ customerId: primaryId })
        .where(eq(churnRiskScores.customerId, secondaryId));

      // 6. Reassign escalations
      await tx
        .update(escalations)
        .set({ customerId: primaryId })
        .where(eq(escalations.customerId, secondaryId));

      // 7. Reassign invoices
      await tx
        .update(invoices)
        .set({ customerId: primaryId })
        .where(eq(invoices.customerId, secondaryId));

      // 8. Reassign outbound calls
      await tx
        .update(outboundCalls)
        .set({ customerId: primaryId })
        .where(eq(outboundCalls.customerId, secondaryId));

      // 9. Merge fields on the primary customer record
      const mergedName = primary.name || secondary.name;
      const mergedEmail = primary.email || secondary.email;
      const mergedAddress = primary.address || secondary.address;
      const mergedNotes = primary.notes || secondary.notes;

      // Union of tags (deduplicated)
      const primaryTags = (primary.tags as string[]) || [];
      const secondaryTags = (secondary.tags as string[]) || [];
      const mergedTags = [...new Set([...primaryTags, ...secondaryTags])];

      // Add lifetime values together
      const mergedLifetimeValue =
        (primary.lifetimeValue || 0) + (secondary.lifetimeValue || 0);

      // Keep the earlier firstCallAt, keep the later lastCallAt
      let mergedFirstCallAt = primary.firstCallAt;
      if (secondary.firstCallAt) {
        if (
          !mergedFirstCallAt ||
          new Date(secondary.firstCallAt) < new Date(mergedFirstCallAt)
        ) {
          mergedFirstCallAt = secondary.firstCallAt;
        }
      }

      let mergedLastCallAt = primary.lastCallAt;
      if (secondary.lastCallAt) {
        if (
          !mergedLastCallAt ||
          new Date(secondary.lastCallAt) > new Date(mergedLastCallAt)
        ) {
          mergedLastCallAt = secondary.lastCallAt;
        }
      }

      // Sum up activity counts
      const mergedTotalCalls =
        (primary.totalCalls || 0) + (secondary.totalCalls || 0);
      const mergedTotalAppointments =
        (primary.totalAppointments || 0) + (secondary.totalAppointments || 0);
      const mergedTotalEstimates =
        (primary.totalEstimates || 0) + (secondary.totalEstimates || 0);
      const mergedComplaintCount =
        (primary.complaintCount || 0) + (secondary.complaintCount || 0);

      // Merge custom fields (primary wins on conflicts)
      const primaryCustomFields =
        (primary.customFields as Record<string, string>) || {};
      const secondaryCustomFields =
        (secondary.customFields as Record<string, string>) || {};
      const mergedCustomFields = {
        ...secondaryCustomFields,
        ...primaryCustomFields,
      };

      const now = new Date().toISOString();

      // 10. Update the primary customer with merged data
      await tx
        .update(customers)
        .set({
          name: mergedName,
          email: mergedEmail,
          address: mergedAddress,
          notes: mergedNotes,
          tags: mergedTags,
          lifetimeValue: mergedLifetimeValue,
          firstCallAt: mergedFirstCallAt,
          lastCallAt: mergedLastCallAt,
          totalCalls: mergedTotalCalls,
          totalAppointments: mergedTotalAppointments,
          totalEstimates: mergedTotalEstimates,
          complaintCount: mergedComplaintCount,
          customFields: mergedCustomFields,
          isRepeat: mergedTotalCalls > 1,
          updatedAt: now,
        })
        .where(eq(customers.id, primaryId));

      // 11. Soft-delete the secondary customer
      await tx
        .update(customers)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(customers.id, secondaryId));

      // 12. Return the updated primary customer
      const [updatedPrimary] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, primaryId))
        .limit(1);

      return updatedPrimary;
    });

    return NextResponse.json({
      success: true,
      customer: merged,
      mergedFrom: secondaryId,
    });
  } catch (error) {
    reportError("Failed to merge customers", error, {
      businessId,
      extra: { primaryId, secondaryId },
    });
    return NextResponse.json(
      { error: "Failed to merge customers" },
      { status: 500 }
    );
  }
}
