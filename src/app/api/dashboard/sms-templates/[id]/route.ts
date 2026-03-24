import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { smsTemplates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bodyEn: z.string().min(1).max(500).optional(),
  bodyEs: z.string().min(1).max(500).optional(),
  isActive: z.boolean().optional(),
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

  const result = updateTemplateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  try {
    const data = result.data;
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };

    if (data.name !== undefined) updates.name = data.name;
    if (data.bodyEn !== undefined) updates.bodyEn = data.bodyEn;
    if (data.bodyEs !== undefined) updates.bodyEs = data.bodyEs;
    if (data.isActive !== undefined) updates.isActive = data.isActive;

    await db
      .update(smsTemplates)
      .set(updates)
      .where(and(eq(smsTemplates.id, id), eq(smsTemplates.businessId, businessId)));

    const [updated] = await db
      .select()
      .from(smsTemplates)
      .where(and(eq(smsTemplates.id, id), eq(smsTemplates.businessId, businessId)))
      .limit(1);

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    reportError("Failed to update SMS template", error, { businessId });
    return NextResponse.json({ error: "Failed to update SMS template" }, { status: 500 });
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
    const [existing] = await db
      .select({ id: smsTemplates.id })
      .from(smsTemplates)
      .where(and(eq(smsTemplates.id, id), eq(smsTemplates.businessId, businessId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db
      .delete(smsTemplates)
      .where(and(eq(smsTemplates.id, id), eq(smsTemplates.businessId, businessId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Failed to delete SMS template", error, { businessId });
    return NextResponse.json({ error: "Failed to delete SMS template" }, { status: 500 });
  }
}
