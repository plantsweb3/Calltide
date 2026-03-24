import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { followUps } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

const updateFollowUpSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "dismissed"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  assignedTo: z.string().max(100).optional().nullable(),
  dueDate: z.string().optional(),
  description: z.string().max(2000).optional(),
  title: z.string().min(1).max(200).optional(),
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

  const result = updateFollowUpSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  try {
    const data = result.data;
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (data.status) updates.status = data.status;
    if (data.priority) updates.priority = data.priority;
    if (data.assignedTo !== undefined) updates.assignedTo = data.assignedTo;
    if (data.dueDate) updates.dueDate = data.dueDate;
    if (data.description !== undefined) updates.description = data.description;
    if (data.title) updates.title = data.title;

    // Track completion time
    if (data.status === "completed") {
      updates.completedAt = now;
    }

    await db
      .update(followUps)
      .set(updates)
      .where(and(eq(followUps.id, id), eq(followUps.businessId, businessId)));

    const [updated] = await db
      .select()
      .from(followUps)
      .where(and(eq(followUps.id, id), eq(followUps.businessId, businessId)))
      .limit(1);

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    reportError("Failed to update follow-up", error, { businessId });
    return NextResponse.json({ error: "Failed to update follow-up" }, { status: 500 });
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
      .update(followUps)
      .set({ status: "dismissed", updatedAt: now })
      .where(and(eq(followUps.id, id), eq(followUps.businessId, businessId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Failed to dismiss follow-up", error, { businessId });
    return NextResponse.json({ error: "Failed to dismiss follow-up" }, { status: 500 });
  }
}
