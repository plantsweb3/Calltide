import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { receptionistCustomResponses } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const updateSchema = z.object({
  triggerText: z.string().min(1).max(200).optional(),
  responseText: z.string().max(500).optional(),
  active: z.boolean().optional(),
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

  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  // Verify ownership
  const [existing] = await db
    .select()
    .from(receptionistCustomResponses)
    .where(
      and(
        eq(receptionistCustomResponses.id, id),
        eq(receptionistCustomResponses.businessId, businessId),
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (result.data.triggerText !== undefined) updates.triggerText = result.data.triggerText;
  if (result.data.responseText !== undefined) updates.responseText = result.data.responseText;
  if (result.data.active !== undefined) updates.active = result.data.active;

  const [updated] = await db
    .update(receptionistCustomResponses)
    .set(updates)
    .where(eq(receptionistCustomResponses.id, id))
    .returning();

  return NextResponse.json(updated);
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

  // Verify ownership
  const [existing] = await db
    .select({ id: receptionistCustomResponses.id })
    .from(receptionistCustomResponses)
    .where(
      and(
        eq(receptionistCustomResponses.id, id),
        eq(receptionistCustomResponses.businessId, businessId),
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .delete(receptionistCustomResponses)
    .where(eq(receptionistCustomResponses.id, id));

  return NextResponse.json({ success: true });
}
