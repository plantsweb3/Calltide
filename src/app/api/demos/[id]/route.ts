import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { demos, prospects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

const patchDemoSchema = z.object({
  status: z.string().max(50).optional(),
  outcome: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  revenue: z.number().min(0).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = patchDemoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  const [existing] = await db.select().from(demos).where(eq(demos.id, id));
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Partial<typeof demos.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };
  if (parsed.data.status) updates.status = parsed.data.status;
  if (parsed.data.outcome) updates.outcome = parsed.data.outcome;
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
  if (parsed.data.revenue !== undefined) updates.revenue = parsed.data.revenue;

  const [updated] = await db
    .update(demos)
    .set(updates)
    .where(eq(demos.id, id))
    .returning();

  // If demo converted, update prospect status
  if (parsed.data.outcome === "signed" && existing.prospectId) {
    await db
      .update(prospects)
      .set({ status: "converted", updatedAt: new Date().toISOString() })
      .where(eq(prospects.id, existing.prospectId));
  }

  await logActivity({
    type: "demo_updated",
    entityType: "demo",
    entityId: id,
    title: `Demo updated: ${parsed.data.status ?? ""} ${parsed.data.outcome ?? ""}`.trim(),
  });

  return NextResponse.json(updated);
}
