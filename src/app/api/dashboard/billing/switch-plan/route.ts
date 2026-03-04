import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { db } from "@/db";
import { accounts, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DEMO_BUSINESS_ID } from "../../demo-data";
import { reportError } from "@/lib/error-reporting";
import { getPriceId, getLocationPriceId, getMrrForPlan, type PlanType } from "@/lib/stripe-prices";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  plan: z.enum(["monthly", "annual"]),
});

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion });
}

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true, message: "Demo mode — no changes made" });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { plan } = result.data;
  const newPriceId = getPriceId(plan as PlanType);

  if (!newPriceId) {
    return NextResponse.json({ error: "Stripe price not configured for this plan" }, { status: 500 });
  }

  try {
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (business.planType === plan) {
      return NextResponse.json({ error: "Already on this plan" }, { status: 400 });
    }

    if (!business.stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    const stripe = getStripe();

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(business.stripeSubscriptionId);
    const currentItemId = subscription.items.data[0]?.id;

    if (!currentItemId) {
      return NextResponse.json({ error: "No subscription items found" }, { status: 400 });
    }

    // Build item updates — base plan + any location line items
    const itemUpdates: Stripe.SubscriptionUpdateParams.Item[] = [
      { id: currentItemId, price: newPriceId },
    ];

    // Switch additional location line items to new plan pricing
    const newLocationPriceId = getLocationPriceId(plan as PlanType);
    if (newLocationPriceId) {
      for (const item of subscription.items.data.slice(1)) {
        if (item.metadata?.type === "additional_location") {
          itemUpdates.push({ id: item.id, price: newLocationPriceId });
        }
      }
    }

    await stripe.subscriptions.update(business.stripeSubscriptionId, {
      items: itemUpdates,
      proration_behavior: "create_prorations",
      metadata: { plan },
    });

    // Update business record
    const newMrr = getMrrForPlan(plan as PlanType);
    await db
      .update(businesses)
      .set({
        planType: plan,
        mrr: newMrr,
        annualConvertedAt: plan === "annual" ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businesses.id, businessId));

    // Update account plan type
    if (business.accountId) {
      await db
        .update(accounts)
        .set({ planType: plan, updatedAt: new Date().toISOString() })
        .where(eq(accounts.id, business.accountId));
    }

    await logActivity({
      type: "plan_switched",
      entityType: "business",
      entityId: businessId,
      title: `${business.name} switched to ${plan} plan`,
      detail: `MRR: $${(newMrr / 100).toFixed(0)}/mo`,
    });

    return NextResponse.json({ success: true, plan, mrr: newMrr });
  } catch (err) {
    reportError("Failed to switch plan", err);
    return NextResponse.json({ error: "Failed to switch plan" }, { status: 500 });
  }
}
