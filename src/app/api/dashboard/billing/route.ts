import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, paymentEvents } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get payment history (successful payments)
  const payments = await db
    .select()
    .from(paymentEvents)
    .where(
      and(
        eq(paymentEvents.businessId, businessId),
        eq(paymentEvents.status, "succeeded"),
      ),
    )
    .orderBy(desc(paymentEvents.createdAt))
    .limit(24);

  return NextResponse.json({
    plan: "Professional",
    price: 49700, // cents
    status: business.paymentStatus ?? "active",
    stripeSubscriptionStatus: business.stripeSubscriptionStatus,
    nextBillingAt: business.nextBillingAt,
    cardLast4: business.cardLast4,
    cardExpMonth: business.cardExpMonth,
    cardExpYear: business.cardExpYear,
    lifetimeRevenue: business.lifetimeRevenue ?? 0,
    hasStripeCustomer: !!business.stripeCustomerId,
    invoices: payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      date: p.createdAt,
      invoiceId: p.invoiceId,
    })),
  });
}
