import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { setupSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getPriceId, type PlanType } from "@/lib/stripe-prices";
import { reportError } from "@/lib/error-reporting";
import { getStripe } from "@/lib/stripe/client";
import { cookies } from "next/headers";

const COOKIE_NAME = "capta_setup";

const schema = z.object({
  plan: z.enum(["monthly", "annual"]).default("monthly"),
});

/**
 * POST /api/setup/checkout
 * Create Stripe checkout session from a completed setup session.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`setup-checkout:${ip}`, { limit: 5, windowSeconds: 3600 });
  if (!rl.success) return rateLimitResponse(rl);

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

  // Get session from cookie
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "No session found" }, { status: 401 });
  }

  try {
    const [session] = await db
      .select()
      .from(setupSessions)
      .where(
        and(
          eq(setupSessions.token, token),
          eq(setupSessions.status, "active"),
        ),
      )
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const missing: string[] = [];
    if (!session.businessName?.trim()) missing.push("business name");
    if (!session.ownerEmail?.trim()) missing.push("email");
    if (!session.ownerName?.trim()) missing.push("name");
    if (!session.ownerPhone?.trim()) missing.push("phone number");
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Please complete your profile first. Missing: ${missing.join(", ")}.` },
        { status: 400 },
      );
    }

    if (!session.receptionistName?.trim()) {
      return NextResponse.json({ error: "Please complete the receptionist setup (Step 3) first" }, { status: 400 });
    }
    if (!session.personalityPreset) {
      return NextResponse.json({ error: "Please select a personality style (Step 4) first" }, { status: 400 });
    }

    // Save selected plan
    await db
      .update(setupSessions)
      .set({
        selectedPlan: plan,
        lastActiveAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(setupSessions.id, session.id));

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: session.ownerEmail!,
      payment_method_collection: "always",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: {
          source: "setup_page",
          plan,
          setupSessionId: session.id,
        },
      },
      metadata: {
        email: session.ownerEmail!,
        source: "setup_page",
        plan,
        setupSessionId: session.id,
      },
      success_url: `${appUrl}/setup?session_id={CHECKOUT_SESSION_ID}&token=${session.token}`,
      cancel_url: `${appUrl}/setup?step=6&canceled=true&token=${session.token}`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    reportError("[setup/checkout] Stripe error", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
