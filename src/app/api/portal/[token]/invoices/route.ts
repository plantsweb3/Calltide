import { NextRequest, NextResponse } from "next/server";
import { validatePortalToken } from "@/lib/portal/auth";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { rateLimit, RATE_LIMITS, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";

/**
 * GET /api/portal/[token]/invoices
 * List invoices for the customer linked to this portal token.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`portal-invoices:${ip}`, RATE_LIMITS.standard);
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
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        amount: invoices.amount,
        status: invoices.status,
        dueDate: invoices.dueDate,
        paidAt: invoices.paidAt,
        paymentMethod: invoices.paymentMethod,
        paymentLinkUrl: invoices.paymentLinkUrl,
        notes: invoices.notes,
        lineItems: invoices.lineItems,
        subtotal: invoices.subtotal,
        taxRate: invoices.taxRate,
        taxAmount: invoices.taxAmount,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.businessId, business.id),
          eq(invoices.customerId, customer.id)
        )
      )
      .orderBy(desc(invoices.createdAt))
      .limit(50);

    return NextResponse.json({ invoices: rows });
  } catch (err) {
    reportError("Portal: failed to fetch invoices", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
