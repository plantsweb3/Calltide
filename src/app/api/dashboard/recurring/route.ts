import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { recurringRules, customers } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

const PAGE_SIZE = 25;

/**
 * Calculate the next occurrence date based on frequency and anchor settings.
 */
function calculateNextOccurrence(
  frequency: string,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null,
  preferredTime?: string | null,
): string {
  const now = new Date();
  const next = new Date(now);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;

    case "weekly":
      if (dayOfWeek !== undefined && dayOfWeek !== null) {
        const currentDay = next.getDay();
        let daysUntil = dayOfWeek - currentDay;
        if (daysUntil <= 0) daysUntil += 7;
        next.setDate(next.getDate() + daysUntil);
      } else {
        next.setDate(next.getDate() + 7);
      }
      break;

    case "biweekly":
      if (dayOfWeek !== undefined && dayOfWeek !== null) {
        const currentDay = next.getDay();
        let daysUntil = dayOfWeek - currentDay;
        if (daysUntil <= 0) daysUntil += 7;
        next.setDate(next.getDate() + daysUntil + 7); // add extra week for biweekly
      } else {
        next.setDate(next.getDate() + 14);
      }
      break;

    case "monthly":
      next.setMonth(next.getMonth() + 1);
      if (dayOfMonth !== undefined && dayOfMonth !== null) {
        next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      }
      break;

    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      if (dayOfMonth !== undefined && dayOfMonth !== null) {
        next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      }
      break;

    case "annually":
      next.setFullYear(next.getFullYear() + 1);
      break;

    default:
      next.setDate(next.getDate() + 7);
  }

  // Set preferred time if provided
  if (preferredTime) {
    const [hours, minutes] = preferredTime.split(":").map(Number);
    if (!isNaN(hours)) next.setHours(hours);
    if (!isNaN(minutes)) next.setMinutes(minutes);
    next.setSeconds(0, 0);
  } else {
    next.setHours(9, 0, 0, 0);
  }

  return next.toISOString();
}

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`recurring-get:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const { searchParams } = new URL(req.url);
  const page = Math.min(Math.max(1, parseInt(searchParams.get("page") || "1")), 10000);
  const activeOnly = searchParams.get("active") !== "false";

  try {
    const conditions = [eq(recurringRules.businessId, businessId)];

    if (activeOnly) {
      conditions.push(eq(recurringRules.isActive, true));
    }

    const where = and(...conditions);

    const [totalResult] = await db
      .select({ count: count() })
      .from(recurringRules)
      .where(where);

    const rows = await db
      .select({
        rule: recurringRules,
        customerName: customers.name,
        customerPhone: customers.phone,
      })
      .from(recurringRules)
      .leftJoin(customers, eq(recurringRules.customerId, customers.id))
      .where(where)
      .orderBy(desc(recurringRules.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

    const result = rows.map((r) => ({
      ...r.rule,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
    }));

    return NextResponse.json({
      rules: result,
      total: totalResult.count,
      page,
      totalPages: Math.ceil(totalResult.count / PAGE_SIZE),
    });
  } catch (error) {
    reportError("Failed to fetch recurring rules", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch recurring rules" }, { status: 500 });
  }
}

const createRecurringSchema = z.object({
  customerId: z.string().min(1),
  service: z.string().min(1).max(200),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "quarterly", "annually"]),
  dayOfWeek: z.number().int().min(0).max(6).optional(), // 0=Sunday
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/).optional(), // HH:mm
  technicianId: z.string().optional(),
  duration: z.number().int().min(15).max(480).optional(), // 15 min to 8 hours
  notes: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`recurring-post:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = createRecurringSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      { error: `${firstError.path.join(".")}: ${firstError.message}` },
      { status: 400 },
    );
  }

  try {
    const data = result.data;

    // Verify customer belongs to this business
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, data.customerId), eq(customers.businessId, businessId)))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const nextOccurrence = calculateNextOccurrence(
      data.frequency,
      data.dayOfWeek,
      data.dayOfMonth,
      data.preferredTime,
    );

    const [created] = await db.insert(recurringRules).values({
      businessId,
      customerId: data.customerId,
      service: data.service,
      frequency: data.frequency,
      dayOfWeek: data.dayOfWeek ?? null,
      dayOfMonth: data.dayOfMonth ?? null,
      preferredTime: data.preferredTime || null,
      technicianId: data.technicianId || null,
      duration: data.duration || 60,
      notes: data.notes || null,
      nextOccurrence,
    }).returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    reportError("Failed to create recurring rule", error, { businessId });
    return NextResponse.json({ error: "Failed to create recurring rule" }, { status: 500 });
  }
}
