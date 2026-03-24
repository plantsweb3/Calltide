import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { invoices, customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * GET /api/dashboard/invoices/[id]
 * Get a single invoice with full details and customer info.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-invoice-detail:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const { id } = await params;

  try {
    const [row] = await db
      .select({
        invoice: invoices,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerEmail: customers.email,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(eq(invoices.id, id), eq(invoices.businessId, businessId)))
      .limit(1);

    if (!row) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    return NextResponse.json({
      ...row.invoice,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerEmail: row.customerEmail,
    });
  } catch (error) {
    reportError("Failed to fetch invoice", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

const lineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
  total: z.number().min(0),
});

const updateInvoiceSchema = z.object({
  status: z.enum(["pending", "sent", "paid", "overdue", "cancelled"]).optional(),
  amount: z.number().positive().optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
  dueDate: z.string().optional(),
  lineItems: z.array(lineItemSchema).optional(),
  subtotal: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  taxAmount: z.number().min(0).optional(),
  customerId: z.string().optional(),
});

/**
 * PUT /api/dashboard/invoices/[id]
 * Update an invoice (status, notes, line items, amount, etc).
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-invoice-update:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const result = updateInvoiceSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  try {
    // Verify invoice belongs to this business
    const [existing] = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.businessId, businessId)))
      .limit(1);

    if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    // Verify customerId if provided
    if (result.data.customerId) {
      const [cust] = await db.select({ id: customers.id }).from(customers)
        .where(and(eq(customers.id, result.data.customerId), eq(customers.businessId, businessId)))
        .limit(1);
      if (!cust) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (result.data.status !== undefined) updates.status = result.data.status;
    if (result.data.amount !== undefined) updates.amount = result.data.amount;
    if (result.data.notes !== undefined) updates.notes = result.data.notes || null;
    if (result.data.dueDate !== undefined) updates.dueDate = result.data.dueDate;
    if (result.data.lineItems !== undefined) updates.lineItems = result.data.lineItems;
    if (result.data.subtotal !== undefined) updates.subtotal = result.data.subtotal;
    if (result.data.taxRate !== undefined) updates.taxRate = result.data.taxRate;
    if (result.data.taxAmount !== undefined) updates.taxAmount = result.data.taxAmount;
    if (result.data.customerId !== undefined) updates.customerId = result.data.customerId;

    // Handle status transitions
    if (result.data.status === "paid") {
      updates.paidAt = now;
    }

    await db
      .update(invoices)
      .set(updates)
      .where(and(eq(invoices.id, id), eq(invoices.businessId, businessId)));

    const [updated] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.businessId, businessId)))
      .limit(1);

    return NextResponse.json({ invoice: updated });
  } catch (error) {
    reportError("Failed to update invoice", error, { businessId });
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

/**
 * DELETE /api/dashboard/invoices/[id]
 * Soft-delete an invoice by setting status to 'cancelled'.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-invoice-delete:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const { id } = await params;

  try {
    // Verify invoice belongs to this business and is not already paid
    const [existing] = await db
      .select({ id: invoices.id, status: invoices.status })
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.businessId, businessId)))
      .limit(1);

    if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    if (existing.status === "paid") {
      return NextResponse.json({ error: "Cannot cancel a paid invoice" }, { status: 400 });
    }

    await db
      .update(invoices)
      .set({ status: "cancelled", updatedAt: new Date().toISOString() })
      .where(and(eq(invoices.id, id), eq(invoices.businessId, businessId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Failed to cancel invoice", error, { businessId });
    return NextResponse.json({ error: "Failed to cancel invoice" }, { status: 500 });
  }
}
