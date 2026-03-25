import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { estimates, customers } from "@/db/schema";
import { eq, and, count, desc, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { DEMO_BUSINESS_ID, DEMO_ESTIMATES } from "../demo-data";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`dashboard-estimates-${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  if (businessId === DEMO_BUSINESS_ID) {
    let filtered = DEMO_ESTIMATES;
    if (statusFilter) {
      filtered = DEMO_ESTIMATES.filter((e) => e.status === statusFilter);
    }
    // Pipeline counts
    const pipeline = {
      new: { count: 0, value: 0 },
      sent: { count: 0, value: 0 },
      follow_up: { count: 0, value: 0 },
      won: { count: 0, value: 0 },
      lost: { count: 0, value: 0 },
      expired: { count: 0, value: 0 },
    };
    for (const e of DEMO_ESTIMATES) {
      const key = e.status as keyof typeof pipeline;
      if (pipeline[key]) {
        pipeline[key].count++;
        pipeline[key].value += e.amount || 0;
      }
    }
    return NextResponse.json({ estimates: filtered, pipeline });
  }

  try {
    const conditions = [eq(estimates.businessId, businessId)];
    if (statusFilter) {
      conditions.push(eq(estimates.status, statusFilter));
    }

    const rows = await db
      .select({
        estimate: estimates,
        customerName: customers.name,
        customerPhone: customers.phone,
      })
      .from(estimates)
      .leftJoin(customers, eq(estimates.customerId, customers.id))
      .where(and(...conditions))
      .orderBy(desc(estimates.createdAt));

    // Pipeline counts via SQL GROUP BY
    const pipelineRows = await db
      .select({
        status: estimates.status,
        count: count(),
        value: sql<number>`coalesce(sum(${estimates.amount}), 0)`,
      })
      .from(estimates)
      .where(eq(estimates.businessId, businessId))
      .groupBy(estimates.status);

    const pipeline: Record<string, { count: number; value: number }> = {
      new: { count: 0, value: 0 },
      sent: { count: 0, value: 0 },
      follow_up: { count: 0, value: 0 },
      won: { count: 0, value: 0 },
      lost: { count: 0, value: 0 },
      expired: { count: 0, value: 0 },
    };
    for (const row of pipelineRows) {
      if (pipeline[row.status]) {
        pipeline[row.status].count = row.count;
        pipeline[row.status].value = Number(row.value) || 0;
      }
    }

    const formatted = rows.map((r) => ({
      ...r.estimate,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
    }));

    return NextResponse.json({ estimates: formatted, pipeline });
  } catch (error) {
    reportError("Failed to fetch estimates", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch estimates" }, { status: 500 });
  }
}

const createEstimateSchema = z.object({
  customerId: z.string().min(1),
  service: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  amount: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`dashboard-estimates-create-${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true, message: "Demo mode — not saved" });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = createEstimateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  try {
    const data = result.data;

    // Verify customer belongs to this business (prevent IDOR)
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, data.customerId), eq(customers.businessId, businessId)))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const followUpAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const [created] = await db.insert(estimates).values({
      businessId,
      customerId: data.customerId,
      service: data.service,
      description: data.description,
      amount: data.amount,
      notes: data.notes,
      status: "new",
      nextFollowUpAt: followUpAt,
    }).returning();

    // Increment totalEstimates on customer
    await db.update(customers).set({
      totalEstimates: sql`${customers.totalEstimates} + 1`,
      updatedAt: new Date().toISOString(),
    }).where(eq(customers.id, data.customerId));

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    reportError("Failed to create estimate", error, { businessId });
    return NextResponse.json({ error: "Failed to create estimate" }, { status: 500 });
  }
}
