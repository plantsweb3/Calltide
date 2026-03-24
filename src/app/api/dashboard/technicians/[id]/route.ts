import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { technicians } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";
import { z } from "zod";

const updateTechSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().max(254).optional().nullable(),
  skills: z.array(z.string().max(100)).max(20).optional(),
  isActive: z.boolean().optional(),
  isOnCall: z.boolean().optional(),
  color: z.string().max(20).optional().nullable(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  isUnavailable: z.boolean().optional(),
  unavailableReason: z.string().max(200).optional().nullable(),
  unavailableUntil: z.string().max(30).optional().nullable(),
});

/**
 * PUT /api/dashboard/technicians/:id
 * Update a technician.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const rl = await rateLimit(`dashboard-tech-update:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = updateTechSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  try {
    // Verify ownership
    const [existing] = await db
      .select({ id: technicians.id })
      .from(technicians)
      .where(and(eq(technicians.id, id), eq(technicians.businessId, businessId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Technician not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    const data = parsed.data;

    if (data.name !== undefined) updates.name = data.name;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.email !== undefined) updates.email = data.email;
    if (data.skills !== undefined) updates.skills = data.skills;
    if (data.isActive !== undefined) updates.isActive = data.isActive;
    if (data.isOnCall !== undefined) updates.isOnCall = data.isOnCall;
    if (data.color !== undefined) updates.color = data.color;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;
    if (data.isUnavailable !== undefined) updates.isUnavailable = data.isUnavailable;
    if (data.unavailableReason !== undefined) updates.unavailableReason = data.unavailableReason;
    if (data.unavailableUntil !== undefined) updates.unavailableUntil = data.unavailableUntil;

    await db
      .update(technicians)
      .set(updates)
      .where(and(eq(technicians.id, id), eq(technicians.businessId, businessId)));

    const [updated] = await db
      .select()
      .from(technicians)
      .where(and(eq(technicians.id, id), eq(technicians.businessId, businessId)))
      .limit(1);

    return NextResponse.json({ technician: updated });
  } catch (err) {
    reportError("Failed to update technician", err, { businessId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/dashboard/technicians/:id
 * Soft-delete: set isActive=false.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const rl = await rateLimit(`dashboard-tech-delete:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    // Verify ownership
    const [existing] = await db
      .select({ id: technicians.id })
      .from(technicians)
      .where(and(eq(technicians.id, id), eq(technicians.businessId, businessId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Technician not found" }, { status: 404 });
    }

    await db
      .update(technicians)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(and(eq(technicians.id, id), eq(technicians.businessId, businessId)));

    return NextResponse.json({ success: true });
  } catch (err) {
    reportError("Failed to delete technician", err, { businessId });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
