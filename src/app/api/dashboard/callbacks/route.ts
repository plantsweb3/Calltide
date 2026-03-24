import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { callbacks } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { z } from "zod";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";

const PAGE_SIZE = 50;

/**
 * GET /api/dashboard/callbacks
 * List callbacks for this business with optional status filter and pagination.
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`dashboard-callbacks:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Math.min(Math.max(1, parseInt(searchParams.get("page") || "1")), 10000);

  try {
    const conditions = [eq(callbacks.businessId, businessId)];

    if (status && status !== "all") {
      conditions.push(eq(callbacks.status, status));
    }

    const where = and(...conditions);

    const [totalResult] = await db
      .select({ count: count() })
      .from(callbacks)
      .where(where);

    const total = totalResult?.count ?? 0;

    const rows = await db
      .select({
        id: callbacks.id,
        callId: callbacks.callId,
        customerPhone: callbacks.customerPhone,
        customerName: callbacks.customerName,
        reason: callbacks.reason,
        requestedTime: callbacks.requestedTime,
        status: callbacks.status,
        outboundCallId: callbacks.outboundCallId,
        createdAt: callbacks.createdAt,
        updatedAt: callbacks.updatedAt,
      })
      .from(callbacks)
      .where(where)
      .orderBy(desc(callbacks.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

    // Compute stats from all callbacks for this business (unfiltered)
    const allCallbacks = await db
      .select({ status: callbacks.status })
      .from(callbacks)
      .where(eq(callbacks.businessId, businessId));

    const stats = {
      total: allCallbacks.length,
      scheduled: allCallbacks.filter((c) => c.status === "scheduled").length,
      calling: allCallbacks.filter((c) => c.status === "calling").length,
      completed: allCallbacks.filter((c) => c.status === "completed").length,
      failed: allCallbacks.filter((c) => c.status === "failed").length,
      cancelled: allCallbacks.filter((c) => c.status === "cancelled").length,
    };

    return NextResponse.json({
      callbacks: rows,
      stats,
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    reportError("Failed to fetch callbacks", err, { businessId });
    return NextResponse.json({ error: "Failed to load callbacks" }, { status: 500 });
  }
}

const createCallbackSchema = z.object({
  customerPhone: z.string().min(1, "customerPhone is required").max(20),
  customerName: z.string().max(200).optional(),
  reason: z.string().max(1000).optional(),
  requestedTime: z.string().min(1, "requestedTime is required"),
});

/**
 * POST /api/dashboard/callbacks
 * Manually create a callback from the dashboard.
 */
export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`dashboard-callbacks-create:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = createCallbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  try {
    const [cb] = await db
      .insert(callbacks)
      .values({
        businessId,
        customerPhone: parsed.data.customerPhone,
        customerName: parsed.data.customerName || null,
        reason: parsed.data.reason || null,
        requestedTime: parsed.data.requestedTime,
        status: "scheduled",
      })
      .returning();

    return NextResponse.json({ callback: cb });
  } catch (err) {
    reportError("Failed to create callback", err, { businessId });
    return NextResponse.json({ error: "Failed to create callback" }, { status: 500 });
  }
}

const updateCallbackSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["scheduled", "completed", "cancelled"]),
});

/**
 * PUT /api/dashboard/callbacks
 * Update a callback status (e.g., mark as completed or cancelled).
 */
export async function PUT(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`dashboard-callbacks-update:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = updateCallbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  try {
    // Verify callback belongs to this business (prevent IDOR)
    const [existing] = await db
      .select({ id: callbacks.id })
      .from(callbacks)
      .where(and(eq(callbacks.id, parsed.data.id), eq(callbacks.businessId, businessId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Callback not found" }, { status: 404 });
    }

    await db
      .update(callbacks)
      .set({
        status: parsed.data.status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(callbacks.id, parsed.data.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    reportError("Failed to update callback", err, { businessId });
    return NextResponse.json({ error: "Failed to update callback" }, { status: 500 });
  }
}
