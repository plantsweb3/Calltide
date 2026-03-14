import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, customers } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

/**
 * GET /api/dashboard/invoices
 * List invoices for the business.
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-invoices:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const statusFilter = status && status !== "all"
    ? eq(invoices.status, status)
    : undefined;

  const results = await db
    .select({
      id: invoices.id,
      amount: invoices.amount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      paidAt: invoices.paidAt,
      notes: invoices.notes,
      smsSentAt: invoices.smsSentAt,
      reminderCount: invoices.reminderCount,
      createdAt: invoices.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(
      and(
        eq(invoices.businessId, businessId),
        statusFilter,
      ),
    )
    .orderBy(desc(invoices.createdAt))
    .limit(50);

  const stats = {
    pending: results.filter((i) => i.status === "pending" || i.status === "sent").reduce((sum, i) => sum + i.amount, 0),
    paid: results.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0),
    overdue: results.filter((i) => i.status === "overdue").reduce((sum, i) => sum + i.amount, 0),
  };

  return NextResponse.json({ invoices: results, stats });
}

const createInvoiceSchema = z.object({
  customerId: z.string().optional(),
  appointmentId: z.string().optional(),
  amount: z.number().positive(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
});

/**
 * POST /api/dashboard/invoices
 * Create a new invoice.
 */
export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-invoices-create:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const body = await req.json();
  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  const dueDate = parsed.data.dueDate || (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  })();

  const [invoice] = await db.insert(invoices).values({
    businessId,
    customerId: parsed.data.customerId || null,
    appointmentId: parsed.data.appointmentId || null,
    amount: parsed.data.amount,
    notes: parsed.data.notes || null,
    dueDate,
    status: "pending",
  }).returning();

  return NextResponse.json({ invoice });
}
