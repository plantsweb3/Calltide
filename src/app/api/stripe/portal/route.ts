import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion });
}

export async function POST(request: NextRequest) {
  const businessId = request.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business?.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: business.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    reportError("[stripe portal] Billing portal session creation failed", err);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 },
    );
  }
}
