import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const markPaidSchema = z.object({
  paymentMethod: z.enum(["cash", "check", "zelle", "venmo", "other", "stripe"]).optional().default("cash"),
  notes: z.string().max(500).optional(),
});

/**
 * POST /api/dashboard/invoices/[id]/mark-paid
 * Manually mark an invoice as paid (for cash, check, or other offline payments).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-invoice-mark-paid:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const { id } = await params;

  let body: unknown = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = markPaidSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  try {
    // Verify invoice belongs to this business
    const [existing] = await db
      .select({ id: invoices.id, status: invoices.status })
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.businessId, businessId)))
      .limit(1);

    if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    if (existing.status === "paid") {
      return NextResponse.json({ error: "Invoice is already marked as paid" }, { status: 400 });
    }

    if (existing.status === "cancelled") {
      return NextResponse.json({ error: "Cannot mark a cancelled invoice as paid" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      status: "paid",
      paidAt: now,
      paymentMethod: result.data.paymentMethod,
      updatedAt: now,
    };

    if (result.data.notes) {
      updates.notes = result.data.notes;
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

    return NextResponse.json({
      success: true,
      invoice: updated,
      message: "Invoice marked as paid",
    });
  } catch (error) {
    reportError("Failed to mark invoice as paid", error, { businessId });
    return NextResponse.json({ error: "Failed to mark invoice as paid" }, { status: 500 });
  }
}
