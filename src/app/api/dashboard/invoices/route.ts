import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, customers } from "@/db/schema";
import { eq, and, or, like, desc, count, sql, gte, lte } from "drizzle-orm";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";
import { reportError } from "@/lib/error-reporting";

const PAGE_SIZE = 50;

/**
 * GET /api/dashboard/invoices
 * List invoices with filtering, search, and pagination.
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-invoices:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  try {
    const conditions = [eq(invoices.businessId, businessId)];

    if (status && status !== "all") {
      conditions.push(eq(invoices.status, status));
    }

    if (search) {
      const escaped = search.replace(/[%_]/g, "\\$&");
      conditions.push(
        or(
          like(customers.name, `%${escaped}%`),
          like(customers.phone, `%${escaped}%`),
          like(invoices.invoiceNumber, `%${escaped}%`),
        )!
      );
    }

    if (dateFrom) {
      conditions.push(gte(invoices.createdAt, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(invoices.createdAt, dateTo + "T23:59:59"));
    }

    const where = and(...conditions);

    const [totalResult] = await db
      .select({ count: count() })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(where);

    const total = totalResult?.count ?? 0;

    const results = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        estimateId: invoices.estimateId,
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
        smsSentAt: invoices.smsSentAt,
        reminderCount: invoices.reminderCount,
        createdAt: invoices.createdAt,
        customerId: invoices.customerId,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerEmail: customers.email,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(where)
      .orderBy(desc(invoices.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

    // Compute stats from all invoices for this business (unfiltered)
    const allInvoices = await db
      .select({
        amount: invoices.amount,
        status: invoices.status,
        paidAt: invoices.paidAt,
        dueDate: invoices.dueDate,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .where(eq(invoices.businessId, businessId));

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const stats = {
      outstanding: allInvoices
        .filter((i) => i.status === "pending" || i.status === "sent")
        .reduce((sum, i) => sum + i.amount, 0),
      overdue: allInvoices
        .filter((i) => i.status === "overdue" || (
          (i.status === "sent" || i.status === "pending") &&
          i.dueDate && new Date(i.dueDate) < now
        ))
        .reduce((sum, i) => sum + i.amount, 0),
      paidThisMonth: allInvoices
        .filter((i) => i.status === "paid" && i.paidAt && i.paidAt >= monthStart)
        .reduce((sum, i) => sum + i.amount, 0),
      avgDaysToPay: (() => {
        const paidInvoices = allInvoices.filter((i) => i.status === "paid" && i.paidAt && i.createdAt);
        if (paidInvoices.length === 0) return 0;
        const totalDays = paidInvoices.reduce((sum, i) => {
          const created = new Date(i.createdAt).getTime();
          const paid = new Date(i.paidAt!).getTime();
          return sum + Math.max(0, Math.round((paid - created) / (1000 * 60 * 60 * 24)));
        }, 0);
        return Math.round(totalDays / paidInvoices.length);
      })(),
      // Pipeline counts for tab badges
      totalCount: allInvoices.length,
      draftCount: allInvoices.filter((i) => i.status === "pending").length,
      sentCount: allInvoices.filter((i) => i.status === "sent").length,
      overdueCount: allInvoices.filter((i) =>
        i.status === "overdue" || (
          (i.status === "sent" || i.status === "pending") &&
          i.dueDate && new Date(i.dueDate) < now
        )
      ).length,
      paidCount: allInvoices.filter((i) => i.status === "paid").length,
    };

    return NextResponse.json({
      invoices: results,
      stats,
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (error) {
    reportError("Failed to fetch invoices", error, { businessId });
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 });
  }
}

const lineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
  total: z.number().min(0),
});

const createInvoiceSchema = z.object({
  customerId: z.string().optional(),
  appointmentId: z.string().optional(),
  estimateId: z.string().optional(),
  amount: z.number().positive(),
  notes: z.string().max(1000).optional(),
  dueDate: z.string().optional(),
  lineItems: z.array(lineItemSchema).optional(),
  subtotal: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  taxAmount: z.number().min(0).optional(),
});

/**
 * POST /api/dashboard/invoices
 * Create a new invoice (manual or from estimate conversion).
 */
export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-invoices-create:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  try {
    // Verify customerId belongs to this business (prevent IDOR)
    if (parsed.data.customerId) {
      const [cust] = await db.select({ id: customers.id }).from(customers)
        .where(and(eq(customers.id, parsed.data.customerId), eq(customers.businessId, businessId)))
        .limit(1);
      if (!cust) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const dueDate = parsed.data.dueDate || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split("T")[0];
    })();

    // Generate invoice number: INV-YYYYMMDD-XXXX
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const [countResult] = await db
      .select({ count: count() })
      .from(invoices)
      .where(eq(invoices.businessId, businessId));
    const seq = ((countResult?.count ?? 0) + 1).toString().padStart(4, "0");
    const invoiceNumber = `INV-${today}-${seq}`;

    const [invoice] = await db.insert(invoices).values({
      businessId,
      customerId: parsed.data.customerId || null,
      appointmentId: parsed.data.appointmentId || null,
      estimateId: parsed.data.estimateId || null,
      invoiceNumber,
      amount: parsed.data.amount,
      notes: parsed.data.notes || null,
      dueDate,
      status: "pending",
      lineItems: parsed.data.lineItems || null,
      subtotal: parsed.data.subtotal ?? null,
      taxRate: parsed.data.taxRate ?? 0,
      taxAmount: parsed.data.taxAmount ?? 0,
    }).returning();

    return NextResponse.json({ invoice });
  } catch (error) {
    reportError("Failed to create invoice", error, { businessId });
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
