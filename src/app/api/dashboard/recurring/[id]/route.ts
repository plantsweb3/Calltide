import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { recurringRules } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

const updateRecurringSchema = z.object({
  service: z.string().min(1).max(200).optional(),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "quarterly", "annually"]).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  technicianId: z.string().optional().nullable(),
  duration: z.number().int().min(15).max(480).optional(),
  notes: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
  nextOccurrence: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = updateRecurringSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  try {
    const data = result.data;
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (data.service !== undefined) updates.service = data.service;
    if (data.frequency !== undefined) updates.frequency = data.frequency;
    if (data.dayOfWeek !== undefined) updates.dayOfWeek = data.dayOfWeek;
    if (data.dayOfMonth !== undefined) updates.dayOfMonth = data.dayOfMonth;
    if (data.preferredTime !== undefined) updates.preferredTime = data.preferredTime;
    if (data.technicianId !== undefined) updates.technicianId = data.technicianId;
    if (data.duration !== undefined) updates.duration = data.duration;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.isActive !== undefined) updates.isActive = data.isActive;
    if (data.nextOccurrence !== undefined) updates.nextOccurrence = data.nextOccurrence;

    await db
      .update(recurringRules)
      .set(updates)
      .where(and(eq(recurringRules.id, id), eq(recurringRules.businessId, businessId)));

    const [updated] = await db
      .select()
      .from(recurringRules)
      .where(and(eq(recurringRules.id, id), eq(recurringRules.businessId, businessId)))
      .limit(1);

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    reportError("Failed to update recurring rule", error, { businessId });
    return NextResponse.json({ error: "Failed to update recurring rule" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const now = new Date().toISOString();

    await db
      .update(recurringRules)
      .set({ isActive: false, updatedAt: now })
      .where(and(eq(recurringRules.id, id), eq(recurringRules.businessId, businessId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Failed to deactivate recurring rule", error, { businessId });
    return NextResponse.json({ error: "Failed to deactivate recurring rule" }, { status: 500 });
  }
}
