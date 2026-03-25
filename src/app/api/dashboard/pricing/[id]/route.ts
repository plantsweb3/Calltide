import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { servicePricing } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { DEMO_BUSINESS_ID } from "../../demo-data";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

const updateSchema = z.object({
  serviceName: z.string().min(1).max(100).optional(),
  priceMin: z.number().min(0).optional().nullable(),
  priceMax: z.number().min(0).optional().nullable(),
  unit: z.enum(["per_job", "per_hour", "per_sqft", "per_unit"]).optional(),
  description: z.string().max(500).optional().nullable(),
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

  const rl = await rateLimit(`pricing-put:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

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
    // Verify ownership
    const [existing] = await db
      .select({ id: servicePricing.id })
      .from(servicePricing)
      .where(and(eq(servicePricing.id, id), eq(servicePricing.businessId, businessId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Pricing entry not found" }, { status: 404 });
    }

    const data = result.data;
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.serviceName !== undefined) updates.serviceName = data.serviceName;
    if (data.priceMin !== undefined) updates.priceMin = data.priceMin;
    if (data.priceMax !== undefined) updates.priceMax = data.priceMax;
    if (data.unit !== undefined) updates.unit = data.unit;
    if (data.description !== undefined) updates.description = data.description;
    if (data.isActive !== undefined) updates.isActive = data.isActive;

    const [updated] = await db
      .update(servicePricing)
      .set(updates)
      .where(eq(servicePricing.id, id))
      .returning();

    return NextResponse.json({ pricing: updated });
  } catch (error) {
    reportError("Failed to update pricing", error, { businessId });
    return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 });
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

  const rl = await rateLimit(`pricing-delete:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true, message: "Demo mode — changes not saved" });
  }

  const { id } = await params;

  try {
    // Verify ownership
    const [existing] = await db
      .select({ id: servicePricing.id })
      .from(servicePricing)
      .where(and(eq(servicePricing.id, id), eq(servicePricing.businessId, businessId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Pricing entry not found" }, { status: 404 });
    }

    await db.delete(servicePricing).where(eq(servicePricing.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Failed to delete pricing", error, { businessId });
    return NextResponse.json({ error: "Failed to delete pricing" }, { status: 500 });
  }
}
