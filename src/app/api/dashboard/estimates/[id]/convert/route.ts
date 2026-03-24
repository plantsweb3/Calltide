import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { estimates, invoices, customers } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST /api/dashboard/estimates/[id]/convert
 * Convert an estimate to an invoice.
 * - Creates a new invoice with the estimate's line items, amount, and customer
 * - Updates estimate: status='won', wonAt=now, convertedInvoiceId=newInvoice.id
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-estimate-convert:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const { id } = await params;

  try {
    // Fetch the estimate
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, id), eq(estimates.businessId, businessId)))
      .limit(1);

    if (!estimate) return NextResponse.json({ error: "Estimate not found" }, { status: 404 });

    // Prevent double conversion
    if (estimate.convertedInvoiceId) {
      return NextResponse.json({
        error: "This estimate has already been converted to an invoice",
        invoiceId: estimate.convertedInvoiceId,
      }, { status: 400 });
    }

    // Only convert estimates with an amount
    if (!estimate.amount || estimate.amount <= 0) {
      return NextResponse.json({
        error: "Cannot convert an estimate without a valid amount",
      }, { status: 400 });
    }

    // Only convert from actionable statuses
    if (["lost", "expired"].includes(estimate.status)) {
      return NextResponse.json({
        error: `Cannot convert an estimate with status "${estimate.status}"`,
      }, { status: 400 });
    }

    // Generate invoice number
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const [countResult] = await db
      .select({ count: count() })
      .from(invoices)
      .where(eq(invoices.businessId, businessId));
    const seq = ((countResult?.count ?? 0) + 1).toString().padStart(4, "0");
    const invoiceNumber = `INV-${today}-${seq}`;

    // Default due date: 30 days from now
    const dueDate = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split("T")[0];
    })();

    // Create invoice from estimate data
    const [invoice] = await db.insert(invoices).values({
      businessId,
      customerId: estimate.customerId,
      estimateId: estimate.id,
      invoiceNumber,
      amount: estimate.amount,
      status: "pending",
      dueDate,
      notes: estimate.notes || null,
      lineItems: estimate.lineItems || null,
      subtotal: estimate.subtotal ?? null,
      taxRate: estimate.taxRate ?? 0,
      taxAmount: estimate.taxAmount ?? 0,
    }).returning();

    // Update estimate: mark as won and link to invoice
    const now = new Date().toISOString();
    await db
      .update(estimates)
      .set({
        status: "won",
        wonAt: now,
        convertedInvoiceId: invoice.id,
        nextFollowUpAt: null,
        updatedAt: now,
      })
      .where(and(eq(estimates.id, id), eq(estimates.businessId, businessId)));

    // Fetch customer name for the response
    let customerName: string | null = null;
    if (estimate.customerId) {
      const [cust] = await db
        .select({ name: customers.name })
        .from(customers)
        .where(eq(customers.id, estimate.customerId))
        .limit(1);
      customerName = cust?.name ?? null;
    }

    return NextResponse.json({
      success: true,
      invoice: {
        ...invoice,
        customerName,
      },
      message: "Estimate converted to invoice successfully",
    });
  } catch (error) {
    reportError("Failed to convert estimate to invoice", error, { businessId });
    return NextResponse.json({ error: "Failed to convert estimate to invoice" }, { status: 500 });
  }
}
