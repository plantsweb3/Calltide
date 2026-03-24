import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { followUps, customers } from "@/db/schema";
import { eq, and, desc, asc, gte, lte, lt, count, sql } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`dashboard-follow-ups-${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const { searchParams } = new URL(req.url);
  const page = Math.min(Math.max(1, parseInt(searchParams.get("page") || "1")), 1000);
  const status = searchParams.get("status"); // pending, in_progress, completed, dismissed
  const priority = searchParams.get("priority"); // low, normal, high, urgent
  const from = searchParams.get("from"); // ISO date
  const to = searchParams.get("to"); // ISO date
  const sortBy = searchParams.get("sortBy"); // dueDate, priority, createdAt
  const sortOrder = searchParams.get("sortOrder"); // asc, desc
  const dueDateFilter = searchParams.get("dueDateFilter"); // overdue, today, this_week, all

  try {
    const conditions = [eq(followUps.businessId, businessId)];

    if (status) {
      const validStatuses = ["pending", "in_progress", "completed", "dismissed"];
      if (validStatuses.includes(status)) {
        conditions.push(eq(followUps.status, status));
      }
    }

    if (priority) {
      const validPriorities = ["low", "normal", "high", "urgent"];
      if (validPriorities.includes(priority)) {
        conditions.push(eq(followUps.priority, priority));
      }
    }

    if (from) {
      conditions.push(gte(followUps.dueDate, from));
    }

    if (to) {
      conditions.push(lte(followUps.dueDate, to));
    }

    // Due date filter
    if (dueDateFilter && dueDateFilter !== "all") {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      if (dueDateFilter === "overdue") {
        conditions.push(lt(followUps.dueDate, now.toISOString()));
        // Exclude completed follow-ups from overdue
        conditions.push(sql`${followUps.status} != 'completed'`);
      } else if (dueDateFilter === "today") {
        conditions.push(gte(followUps.dueDate, todayStart));
        conditions.push(lt(followUps.dueDate, todayEnd));
      } else if (dueDateFilter === "this_week") {
        const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();
        conditions.push(gte(followUps.dueDate, todayStart));
        conditions.push(lt(followUps.dueDate, weekEnd));
      }
    }

    const where = and(...conditions);

    const [totalResult] = await db
      .select({ count: count() })
      .from(followUps)
      .where(where);

    // Determine sort column and direction
    const sortDir = sortOrder === "asc" ? asc : desc;
    let orderByClause;
    if (sortBy === "dueDate") {
      orderByClause = sortDir(followUps.dueDate);
    } else if (sortBy === "priority") {
      // Custom priority order: urgent=0, high=1, normal=2, low=3
      orderByClause = sortOrder === "asc"
        ? sql`CASE ${followUps.priority} WHEN 'low' THEN 0 WHEN 'normal' THEN 1 WHEN 'high' THEN 2 WHEN 'urgent' THEN 3 ELSE 1 END ASC`
        : sql`CASE ${followUps.priority} WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 WHEN 'low' THEN 3 ELSE 2 END DESC`;
    } else {
      orderByClause = sortDir(followUps.createdAt);
    }

    const rows = await db
      .select({
        followUp: followUps,
        customerName: customers.name,
        customerPhone: customers.phone,
      })
      .from(followUps)
      .leftJoin(customers, eq(followUps.customerId, customers.id))
      .where(where)
      .orderBy(orderByClause)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

    const result = rows.map((r) => ({
      ...r.followUp,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
    }));

    // Also compute overdue count for the badge (always across all statuses except completed)
    const overdueConditions = [
      eq(followUps.businessId, businessId),
      lt(followUps.dueDate, new Date().toISOString()),
      sql`${followUps.status} != 'completed'`,
      sql`${followUps.status} != 'dismissed'`,
    ];
    const [overdueResult] = await db
      .select({ count: count() })
      .from(followUps)
      .where(and(...overdueConditions));

    return NextResponse.json({
      followUps: result,
      total: totalResult.count,
      page,
      totalPages: Math.ceil(totalResult.count / PAGE_SIZE),
      overdueCount: overdueResult.count,
    });
  } catch (error) {
    reportError("Failed to fetch follow-ups", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch follow-ups" }, { status: 500 });
  }
}

const createFollowUpSchema = z.object({
  customerId: z.string().optional(),
  callId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().min(1), // ISO datetime
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  assignedTo: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`dashboard-follow-ups-write-${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = createFollowUpSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      { error: `${firstError.path.join(".")}: ${firstError.message}` },
      { status: 400 },
    );
  }

  try {
    const data = result.data;

    // Validate customerId belongs to this business (prevent IDOR)
    if (data.customerId) {
      const [cust] = await db.select({ id: customers.id }).from(customers)
        .where(and(eq(customers.id, data.customerId), eq(customers.businessId, businessId))).limit(1);
      if (!cust) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const [created] = await db.insert(followUps).values({
      businessId,
      customerId: data.customerId || null,
      callId: data.callId || null,
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate,
      priority: data.priority || "normal",
      assignedTo: data.assignedTo || null,
    }).returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    reportError("Failed to create follow-up", error, { businessId });
    return NextResponse.json({ error: "Failed to create follow-up" }, { status: 500 });
  }
}
