import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { technicians } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

/**
 * GET /api/dashboard/technicians
 * List technicians for the business.
 */
export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-techs:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  const techs = await db
    .select()
    .from(technicians)
    .where(and(eq(technicians.businessId, businessId), eq(technicians.isActive, true)))
    .orderBy(technicians.sortOrder);

  return NextResponse.json({ technicians: techs });
}

const createTechSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  skills: z.array(z.string()).optional(),
  color: z.string().optional(),
});

/**
 * POST /api/dashboard/technicians
 * Add a new technician.
 */
export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`dashboard-techs-create:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  const parsed = createTechSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
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
}
