import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getPriceId, type PlanType } from "@/lib/stripe-prices";
import { reportError } from "@/lib/error-reporting";
import { getStripe } from "@/lib/stripe/client";

const schema = z.object({
  plan: z.enum(["monthly", "annual"]).default("monthly"),
});

/**
 * POST /api/dashboard/onboarding/checkout
 * Creates a Stripe checkout session for an existing onboarding business.
 * Business already exists in DB (created during initial signup).
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`onb-checkout:${ip}`, { limit: 5, windowSeconds: 3600 });
  if (!rl.success) return rateLimitResponse(rl);

  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { plan } = result.data;
  const priceId = getPriceId(plan as PlanType);
  if (!priceId) {
    return NextResponse.json({ error: "Stripe price not configured" }, { status: 500 });
  }

  try {
    const [biz] = await db
      .select({
        ownerEmail: businesses.ownerEmail,
        stripeCustomerId: businesses.stripeCustomerId,
        stripeSubscriptionStatus: businesses.stripeSubscriptionStatus,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // If already has active subscription, skip checkout
    if (biz.stripeSubscriptionStatus === "active" || biz.stripeSubscriptionStatus === "trialing") {
      return NextResponse.json({ alreadyActive: true });
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_collection: "always",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { source: "onboarding_paywall", plan, businessId },
      },
      metadata: { email: biz.ownerEmail ?? "", source: "onboarding_paywall", plan, businessId },
      success_url: `${appUrl}/dashboard/onboarding?session_id={CHECKOUT_SESSION_ID}&step=7`,
      cancel_url: `${appUrl}/dashboard/onboarding?step=6&canceled=true`,
      allow_promotion_codes: true,
    };

    // Reuse existing Stripe customer if available
    if (biz.stripeCustomerId) {
      sessionParams.customer = biz.stripeCustomerId;
    } else if (biz.ownerEmail) {
      sessionParams.customer_email = biz.ownerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    reportError("[onboarding/checkout] Stripe error", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
