import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { customerPortalTokens, customers, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { hashPortalToken } from "@/lib/portal/auth";

const bodySchema = z.object({
  sendSms: z.boolean().optional().default(false),
});

/**
 * POST /api/dashboard/customers/[id]/portal-link
 * Generate a magic link for a customer to access the self-service portal.
 * Optionally sends the link via SMS.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`portal-link:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const { id: customerId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    // Verify the customer belongs to this business (prevent IDOR)
    const [customer] = await db
      .select({
        id: customers.id,
        phone: customers.phone,
        name: customers.name,
        language: customers.language,
      })
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.businessId, businessId))
      )
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Generate a unique token (30-day expiry). Store the SHA-256 hash so a DB
    // leak can't be used to access portals; the raw token is only returned to
    // the caller and delivered via SMS below.
    const token = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    await db.insert(customerPortalTokens).values({
      businessId,
      customerId,
      token: hashPortalToken(token),
      expiresAt,
    });

    const appUrl = env.NEXT_PUBLIC_APP_URL;
    const portalUrl = `${appUrl}/portal/${token}`;

    // Optionally send SMS with the portal link
    if (parsed.data.sendSms && customer.phone) {
      try {
        const [business] = await db
          .select({
            name: businesses.name,
            twilioNumber: businesses.twilioNumber,
          })
          .from(businesses)
          .where(eq(businesses.id, businessId))
          .limit(1);

        const fromNumber =
          business?.twilioNumber || env.TWILIO_PHONE_NUMBER;
        const bizName = business?.name || "Your service provider";

        const isSpanish = customer.language === "es";
        const smsBody = isSpanish
          ? `${bizName}: Acceda a su portal de cliente para ver sus citas, estimados y facturas: ${portalUrl}`
          : `${bizName}: Access your customer portal to view appointments, estimates, and invoices: ${portalUrl}`;

        const { sendSMS } = await import("@/lib/twilio/sms");
        await sendSMS({
          to: customer.phone,
          from: fromNumber,
          body: smsBody,
          businessId,
          templateType: "portal_link",
        });
      } catch (smsErr) {
        reportError("Failed to send portal link SMS", smsErr, { businessId });
        // Don't fail the request — the link was still generated
      }
    }

    return NextResponse.json({ url: portalUrl, token, expiresAt });
  } catch (err) {
    reportError("Failed to generate portal link", err, { businessId });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
