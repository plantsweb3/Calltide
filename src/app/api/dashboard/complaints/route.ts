import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { complaintTickets, customers } from "@/db/schema";
import { eq, and, desc, gte, lte, count } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`complaints-get:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const { searchParams } = new URL(req.url);
  const page = Math.min(Math.max(1, parseInt(searchParams.get("page") || "1")), 10000);
  const status = searchParams.get("status"); // open, investigating, resolved, closed
  const severity = searchParams.get("severity"); // low, medium, high, critical
  const from = searchParams.get("from"); // ISO date
  const to = searchParams.get("to"); // ISO date

  try {
    const conditions = [eq(complaintTickets.businessId, businessId)];

    if (status) {
      const validStatuses = ["open", "investigating", "resolved", "closed"];
      if (validStatuses.includes(status)) {
        conditions.push(eq(complaintTickets.status, status));
      }
    }

    if (severity) {
      const validSeverities = ["low", "medium", "high", "critical"];
      if (validSeverities.includes(severity)) {
        conditions.push(eq(complaintTickets.severity, severity));
      }
    }

    if (from) {
      conditions.push(gte(complaintTickets.createdAt, from));
    }

    if (to) {
      conditions.push(lte(complaintTickets.createdAt, to));
    }

    const where = and(...conditions);

    const [totalResult] = await db
      .select({ count: count() })
      .from(complaintTickets)
      .where(where);

    const rows = await db
      .select({
        complaint: complaintTickets,
        customerName: customers.name,
        customerPhone: customers.phone,
      })
      .from(complaintTickets)
      .leftJoin(customers, eq(complaintTickets.customerId, customers.id))
      .where(where)
      .orderBy(desc(complaintTickets.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

    const result = rows.map((r) => ({
      ...r.complaint,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
    }));

    return NextResponse.json({
      complaints: result,
      total: totalResult.count,
      page,
      totalPages: Math.ceil(totalResult.count / PAGE_SIZE),
    });
  } catch (error) {
    reportError("Failed to fetch complaints", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 });
  }
}

const createComplaintSchema = z.object({
  customerId: z.string().optional(),
  callId: z.string().optional(),
  customerPhone: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  category: z.enum(["service_quality", "billing", "scheduling", "communication", "other"]).optional(),
  description: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`complaints-post:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = createComplaintSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      { error: `${firstError.path.join(".")}: ${firstError.message}` },
      { status: 400 },
    );
  }

  try {
    const data = result.data;
    const [created] = await db.insert(complaintTickets).values({
      businessId,
      customerId: data.customerId || null,
      callId: data.callId || null,
      customerPhone: data.customerPhone || null,
      severity: data.severity || "medium",
      category: data.category || "other",
      description: data.description,
    }).returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    reportError("Failed to create complaint", error, { businessId });
    return NextResponse.json({ error: "Failed to create complaint" }, { status: 500 });
  }
}
