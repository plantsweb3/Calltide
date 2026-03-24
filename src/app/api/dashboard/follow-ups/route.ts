import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { followUps, customers } from "@/db/schema";
import { eq, and, desc, gte, lte, count } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.min(Math.max(1, parseInt(searchParams.get("page") || "1")), 10000);
  const status = searchParams.get("status"); // pending, in_progress, completed, dismissed
  const priority = searchParams.get("priority"); // low, normal, high, urgent
  const from = searchParams.get("from"); // ISO date
  const to = searchParams.get("to"); // ISO date

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

    const where = and(...conditions);

    const [totalResult] = await db
      .select({ count: count() })
      .from(followUps)
      .where(where);

    const rows = await db
      .select({
        followUp: followUps,
        customerName: customers.name,
        customerPhone: customers.phone,
      })
      .from(followUps)
      .leftJoin(customers, eq(followUps.customerId, customers.id))
      .where(where)
      .orderBy(desc(followUps.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

    const result = rows.map((r) => ({
      ...r.followUp,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
    }));

    return NextResponse.json({
      followUps: result,
      total: totalResult.count,
      page,
      totalPages: Math.ceil(totalResult.count / PAGE_SIZE),
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
