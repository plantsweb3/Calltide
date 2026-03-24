import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { technicians, appointments } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";
import { z } from "zod";

/**
 * GET /api/dashboard/technicians
 * List technicians for the business, including today's appointment count.
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-techs:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const today = new Date().toISOString().slice(0, 10);

    const techs = await db
      .select({
        id: technicians.id,
        businessId: technicians.businessId,
        name: technicians.name,
        phone: technicians.phone,
        email: technicians.email,
        skills: technicians.skills,
        googleCalendarId: technicians.googleCalendarId,
        isActive: technicians.isActive,
        isOnCall: technicians.isOnCall,
        color: technicians.color,
        sortOrder: technicians.sortOrder,
        createdAt: technicians.createdAt,
        updatedAt: technicians.updatedAt,
        todayJobs: sql<number>`(
          SELECT COUNT(*) FROM appointments
          WHERE appointments.technician_id = technicians.id
            AND appointments.date = ${today}
            AND appointments.status NOT IN ('cancelled')
        )`.as("today_jobs"),
      })
      .from(technicians)
      .where(eq(technicians.businessId, businessId))
      .orderBy(technicians.sortOrder);

    return NextResponse.json({ technicians: techs });
  } catch (err) {
    reportError("Failed to fetch technicians", err, { businessId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const createTechSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(254).optional(),
  skills: z.array(z.string().max(100)).max(20).optional(),
  color: z.string().max(20).optional(),
});

/**
 * POST /api/dashboard/technicians
 * Add a new technician.
 */
export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-techs-create:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  const parsed = createTechSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  try {
    // Cap at 50 technicians per business
    const [countRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(technicians)
      .where(and(eq(technicians.businessId, businessId), eq(technicians.isActive, true)));

    if ((countRow?.count ?? 0) >= 50) {
      return NextResponse.json({ error: "Maximum 50 active technicians allowed" }, { status: 400 });
    }

    const [tech] = await db.insert(technicians).values({
      businessId,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      skills: parsed.data.skills || [],
      color: parsed.data.color || null,
    }).returning();

    return NextResponse.json({ technician: tech });
  } catch (err) {
    reportError("Failed to create technician", err, { businessId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
