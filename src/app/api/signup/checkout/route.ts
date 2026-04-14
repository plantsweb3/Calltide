import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getPriceId, type PlanType } from "@/lib/stripe-prices";
import { reportError } from "@/lib/error-reporting";
import { getStripe } from "@/lib/stripe/client";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  plan: z.enum(["monthly", "annual"]).default("monthly"),
});

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`signup-checkout:${getClientIp(req)}`, { limit: 5, windowSeconds: 3600 });
  if (!rl.success) return rateLimitResponse(rl);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { email, plan } = result.data;

  // Prevent duplicate checkout for existing accounts
  const [existing] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.ownerEmail, email))
    .limit(1);
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please log in to your dashboard." },
      { status: 409 },
    );
  }

  const priceId = getPriceId(plan as PlanType);

  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured" },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";

  try {
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      payment_method_collection: "always",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { source: "landing_page", plan },
      },
      metadata: { email, source: "landing_page", plan },
      success_url: `${appUrl}/dashboard/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?canceled=true`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    reportError("[signup/checkout] Stripe error", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
