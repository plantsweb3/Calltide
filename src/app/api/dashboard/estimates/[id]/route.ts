import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { estimates, customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { DEMO_BUSINESS_ID, DEMO_ESTIMATES } from "../../demo-data";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`estimates-get:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const { id } = await params;

  if (businessId === DEMO_BUSINESS_ID) {
    const estimate = DEMO_ESTIMATES.find((e) => e.id === id);
    if (!estimate) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(estimate);
  }

  try {
    const [row] = await db
      .select({
        estimate: estimates,
        customerName: customers.name,
        customerPhone: customers.phone,
      })
      .from(estimates)
      .leftJoin(customers, eq(estimates.customerId, customers.id))
      .where(and(eq(estimates.id, id), eq(estimates.businessId, businessId)))
      .limit(1);

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      ...row.estimate,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
    });
  } catch (error) {
    reportError("Failed to fetch estimate", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch estimate" }, { status: 500 });
  }
}

const updateEstimateSchema = z.object({
  status: z.enum(["new", "sent", "follow_up", "won", "lost", "expired"]).optional(),
  amount: z.number().min(0).optional(),
  notes: z.string().max(500).optional().or(z.literal("")),
  lostReason: z.string().max(100).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`estimates-put:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  const { id } = await params;

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true, message: "Demo mode — not saved" });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = updateEstimateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  try {
    const data = result.data;
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (data.status) updates.status = data.status;
    if (data.amount !== undefined) updates.amount = data.amount;
    if (data.notes !== undefined) updates.notes = data.notes || null;

    // Handle status transitions
    if (data.status === "won") {
      updates.wonAt = now;
      updates.nextFollowUpAt = null;
    } else if (data.status === "lost") {
      updates.lostAt = now;
      updates.lostReason = data.lostReason || null;
      updates.nextFollowUpAt = null;
    } else if (data.status === "expired") {
      updates.nextFollowUpAt = null;
    }

    await db
      .update(estimates)
      .set(updates)
      .where(and(eq(estimates.id, id), eq(estimates.businessId, businessId)));

    const [updated] = await db.select().from(estimates).where(and(eq(estimates.id, id), eq(estimates.businessId, businessId))).limit(1);
    return NextResponse.json(updated);
  } catch (error) {
    reportError("Failed to update estimate", error, { businessId });
    return NextResponse.json({ error: "Failed to update estimate" }, { status: 500 });
  }
}
