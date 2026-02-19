import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { demos, prospects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  const [existing] = await db.select().from(demos).where(eq(demos.id, id));
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Partial<typeof demos.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };
  if (body.status) updates.status = body.status;
  if (body.outcome) updates.outcome = body.outcome;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.revenue !== undefined) updates.revenue = body.revenue;

  const [updated] = await db
    .update(demos)
    .set(updates)
    .where(eq(demos.id, id))
    .returning();

  // If demo converted, update prospect status
  if (body.outcome === "signed" && existing.prospectId) {
    await db
      .update(prospects)
      .set({ status: "converted", updatedAt: new Date().toISOString() })
      .where(eq(prospects.id, existing.prospectId));
  }

  await logActivity({
    type: "demo_updated",
    entityType: "demo",
    entityId: id,
    title: `Demo updated: ${body.status ?? ""} ${body.outcome ?? ""}`.trim(),
  });

  return NextResponse.json(updated);
}
