import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, businesses, paymentEvents } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { DEMO_BUSINESS_ID } from "../demo-data";
import { reportError } from "@/lib/error-reporting";
import { PLAN_DETAILS, LOCATION_PRICING, type PlanType } from "@/lib/stripe-prices";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({
      plan: "Professional",
      planType: "monthly" as PlanType,
      price: 49700,
      status: "active",
      stripeSubscriptionStatus: "active",
      nextBillingAt: new Date(Date.now() + 15 * 86400000).toISOString(),
      cardLast4: "4242",
      cardExpMonth: 12,
      cardExpYear: 2027,
      lifetimeRevenue: 149100,
      hasStripeCustomer: true,
      invoices: [
        { id: "demo-inv-1", amount: 49700, date: new Date(Date.now() - 30 * 86400000).toISOString(), invoiceId: "inv_demo_001" },
        { id: "demo-inv-2", amount: 49700, date: new Date(Date.now() - 60 * 86400000).toISOString(), invoiceId: "inv_demo_002" },
        { id: "demo-inv-3", amount: 49700, date: new Date(Date.now() - 90 * 86400000).toISOString(), invoiceId: "inv_demo_003" },
      ],
    });
  }

  const rl = await rateLimit(`dashboard-billing-${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const planType = (business.planType ?? "monthly") as PlanType;
    const planInfo = PLAN_DETAILS[planType];

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

    // Get account-level location info
    let locationCount = 1;
    let additionalLocationPrice = 0;
    let totalMonthly = planInfo.monthlyRate;

    if (business.accountId) {
      const [account] = await db
        .select({ locationCount: accounts.locationCount, planType: accounts.planType })
        .from(accounts)
        .where(eq(accounts.id, business.accountId))
        .limit(1);

      if (account) {
        locationCount = account.locationCount ?? 1;
        const acctPlan = (account.planType ?? "monthly") as PlanType;
        additionalLocationPrice = LOCATION_PRICING[acctPlan].monthlyRate;
        totalMonthly = planInfo.monthlyRate + (locationCount - 1) * additionalLocationPrice;
      }
    }

    return NextResponse.json({
      plan: planInfo.name,
      planType,
      price: planInfo.monthlyRate,
      status: business.paymentStatus ?? "active",
      stripeSubscriptionStatus: business.stripeSubscriptionStatus,
      nextBillingAt: business.nextBillingAt,
      cardLast4: business.cardLast4,
      cardExpMonth: business.cardExpMonth,
      cardExpYear: business.cardExpYear,
      lifetimeRevenue: business.lifetimeRevenue ?? 0,
      hasStripeCustomer: !!business.stripeCustomerId,
      locationCount,
      additionalLocationPrice,
      totalMonthly,
      invoices: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        date: p.createdAt,
        invoiceId: p.invoiceId,
      })),
    });
  } catch (err) {
    reportError("Failed to fetch billing data", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
