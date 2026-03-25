import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { seasonalServices } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

const DEMO_BUSINESS_ID = "demo-client-001";

const updateSchema = z.object({
  serviceName: z.string().min(1).max(100).optional(),
  reminderIntervalMonths: z.number().int().min(1).max(24).optional(),
  reminderMessage: z.string().max(500).optional(),
  seasonStart: z.number().int().min(1).max(12).nullable().optional(),
  seasonEnd: z.number().int().min(1).max(12).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Missing business ID" }, { status: 401 });
  }

  const rl = await rateLimit(`seasonal-services-put:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true });
  }

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    await db
      .update(seasonalServices)
      .set(parsed.data)
      .where(
        and(
          eq(seasonalServices.id, id),
          eq(seasonalServices.businessId, businessId),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Seasonal service PUT error", error, { businessId });
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Missing business ID" }, { status: 401 });
  }

  const rl = await rateLimit(`seasonal-services-delete:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true });
  }

  try {
    // Soft delete by deactivating
    await db
      .update(seasonalServices)
      .set({ isActive: false })
      .where(
        and(
          eq(seasonalServices.id, id),
          eq(seasonalServices.businessId, businessId),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Seasonal service DELETE error", error, { businessId });
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
