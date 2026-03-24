import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validatePortalToken } from "@/lib/portal/auth";
import { db } from "@/db";
import { estimates } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { rateLimit, RATE_LIMITS, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";

/**
 * GET /api/portal/[token]/estimates
 * List estimates for the customer linked to this portal token.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`portal-estimates:${ip}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const { token } = await params;

  try {
    const result = await validatePortalToken(token);
    if (!result) {
      return NextResponse.json(
        { error: "Invalid or expired portal link" },
        { status: 401 }
      );
    }

    const { customer, business } = result;

    const rows = await db
      .select({
        id: estimates.id,
        service: estimates.service,
        description: estimates.description,
        status: estimates.status,
        amount: estimates.amount,
        notes: estimates.notes,
        lineItems: estimates.lineItems,
        subtotal: estimates.subtotal,
        taxRate: estimates.taxRate,
        taxAmount: estimates.taxAmount,
        validUntil: estimates.validUntil,
        createdAt: estimates.createdAt,
      })
      .from(estimates)
      .where(
        and(
          eq(estimates.businessId, business.id),
          eq(estimates.customerId, customer.id)
        )
      )
      .orderBy(desc(estimates.createdAt))
      .limit(50);

    return NextResponse.json({ estimates: rows });
  } catch (err) {
    reportError("Portal: failed to fetch estimates", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const acceptSchema = z.object({
  estimateId: z.string().min(1),
});

/**
 * PUT /api/portal/[token]/estimates
 * Accept an estimate from the customer portal (sets status to 'won').
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`portal-estimate-accept:${ip}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const { token } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await validatePortalToken(token);
    if (!result) {
      return NextResponse.json(
        { error: "Invalid or expired portal link" },
        { status: 401 }
      );
    }

    const { customer, business } = result;

    // Verify the estimate belongs to this customer AND this business
    const [estimate] = await db
      .select({
        id: estimates.id,
        status: estimates.status,
        service: estimates.service,
        amount: estimates.amount,
      })
      .from(estimates)
      .where(
        and(
          eq(estimates.id, parsed.data.estimateId),
          eq(estimates.businessId, business.id),
          eq(estimates.customerId, customer.id)
        )
      )
      .limit(1);

    if (!estimate) {
      return NextResponse.json(
        { error: "Estimate not found" },
        { status: 404 }
      );
    }

    // Can only accept estimates that are open (new, sent, follow_up)
    if (["won", "lost", "expired"].includes(estimate.status)) {
      return NextResponse.json(
        { error: "This estimate can no longer be accepted" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    await db
      .update(estimates)
      .set({
        status: "won",
        wonAt: now,
        nextFollowUpAt: null,
        updatedAt: now,
      })
      .where(eq(estimates.id, estimate.id));

    // Notify business owner
    try {
      const { sendSMS } = await import("@/lib/twilio/sms");
      const { env } = await import("@/lib/env");
      const customerName = customer.name || customer.phone;
      const fromNumber = business.twilioNumber || env.TWILIO_PHONE_NUMBER;
      const amount = estimate.amount
        ? ` ($${estimate.amount.toFixed(2)})`
        : "";

      await sendSMS({
        to: business.ownerPhone,
        from: fromNumber,
        body: `Customer portal: ${customerName} accepted the estimate for ${estimate.service}${amount}. Time to schedule the job!`,
        businessId: business.id,
        templateType: "portal_notification",
      });
    } catch (smsErr) {
      reportError("Portal: failed to notify owner about estimate acceptance", smsErr, {
        businessId: business.id,
      });
    }

    return NextResponse.json({ success: true, status: "won" });
  } catch (err) {
    reportError("Portal: failed to accept estimate", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
