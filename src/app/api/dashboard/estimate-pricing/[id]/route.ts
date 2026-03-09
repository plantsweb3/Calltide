import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { pricingRanges } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { DEMO_BUSINESS_ID } from "../../demo-data";

const updateSchema = z.object({
  mode: z.enum(["quick", "advanced"]).optional(),
  jobTypeKey: z.string().min(1).max(100).optional(),
  jobTypeLabel: z.string().min(1).max(200).optional(),
  jobTypeLabelEs: z.string().max(200).optional().nullable(),
  scopeLevel: z.enum(["residential", "commercial", "all"]).optional(),
  minPrice: z.number().min(0).optional().nullable(),
  maxPrice: z.number().min(0).optional().nullable(),
  unit: z.enum(["per_job", "per_hour", "per_sqft", "per_unit", "per_room"]).optional(),
  formulaJson: z.any().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true, message: "Demo mode — changes not saved" });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = updateSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      { error: `${firstError.path.join(".")}: ${firstError.message}` },
      { status: 400 },
    );
  }

  try {
    const [updated] = await db
      .update(pricingRanges)
      .set({
        ...result.data,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(pricingRanges.id, id),
          eq(pricingRanges.businessId, businessId),
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ range: updated });
  } catch (error) {
    reportError("Failed to update estimate pricing", error, { businessId });
    return NextResponse.json({ error: "Failed to update pricing range" }, { status: 500 });
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

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true, message: "Demo mode — changes not saved" });
  }

  const { id } = await params;

  try {
    // Soft-delete by setting active = false
    const [deleted] = await db
      .update(pricingRanges)
      .set({ active: false, updatedAt: new Date().toISOString() })
      .where(
        and(
          eq(pricingRanges.id, id),
          eq(pricingRanges.businessId, businessId),
        ),
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Failed to delete estimate pricing", error, { businessId });
    return NextResponse.json({ error: "Failed to delete pricing range" }, { status: 500 });
  }
}
