import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businesses, cancellationFeedback } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe/client";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";
import { logActivity } from "@/lib/activity";

const cancelSchema = z.object({
  reason: z.enum([
    "too_expensive",
    "not_enough_value",
    "switching_competitor",
    "going_manual",
    "seasonal_business",
    "other",
  ]),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().max(2000).optional(),
  recoveryOfferAccepted: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`cancel:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = cancelSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      { error: `${firstError.path.join(".")}: ${firstError.message}` },
      { status: 400 },
    );
  }

  const data = result.data;

  try {
    // Look up the business
    const [biz] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Save cancellation feedback
    await db.insert(cancellationFeedback).values({
      businessId,
      reason: data.reason,
      rating: data.rating,
      feedback: data.feedback || null,
      recoveryOfferShown: true,
      recoveryOfferAccepted: data.recoveryOfferAccepted ?? false,
    });

    // If the user accepted the recovery offer, flag for manual processing
    if (data.recoveryOfferAccepted) {
      await logActivity({
        type: "recovery_offer_accepted",
        entityType: "business",
        entityId: businessId,
        title: `${biz.name} accepted cancellation recovery offer`,
        detail: `Reason: ${data.reason}. Owner chose to stay with 2 months free offer.`,
      });

      return NextResponse.json({
        success: true,
        action: "recovery_accepted",
        message: "Thank you for staying! We'll apply your discount shortly.",
      });
    }

    // Cancel the Stripe subscription at period end
    if (biz.stripeSubscriptionId) {
      try {
        const stripe = getStripe();
        await stripe.subscriptions.update(biz.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      } catch (stripeErr) {
        reportError("Stripe subscription cancellation failed", stripeErr, {
          businessId,
          extra: { subscriptionId: biz.stripeSubscriptionId },
        });
        // Continue — still mark as canceled in our system
      }
    }

    // Update business status
    await db
      .update(businesses)
      .set({
        paymentStatus: "canceled",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businesses.id, businessId));

    await logActivity({
      type: "subscription_canceled",
      entityType: "business",
      entityId: businessId,
      title: `${biz.name} canceled subscription`,
      detail: `Reason: ${data.reason}, Rating: ${data.rating ?? "N/A"}, Feedback: ${data.feedback || "None"}`,
    });

    return NextResponse.json({
      success: true,
      action: "canceled",
      message: "Your subscription has been canceled. You'll retain access until the end of your current billing period.",
    });
  } catch (err) {
    reportError("Cancellation failed", err, { businessId });
    return NextResponse.json({ error: "Cancellation failed" }, { status: 500 });
  }
}
