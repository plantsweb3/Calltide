import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businessPartners } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { DEMO_BUSINESS_ID } from "../../demo-data";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

const updateSchema = z.object({
  partnerName: z.string().min(1).max(200).optional(),
  partnerTrade: z.string().min(1).max(100).optional(),
  partnerPhone: z.string().min(10).max(20).optional(),
  partnerContactName: z.string().max(200).optional().nullable(),
  partnerEmail: z.string().email().max(200).optional().nullable(),
  language: z.enum(["en", "es"]).optional(),
  relationship: z.enum(["preferred", "trusted", "occasional"]).optional(),
  notes: z.string().max(500).optional().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`partners-put:${businessId}`, RATE_LIMITS.write);
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

  const data = result.data;

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.partnerName !== undefined) updates.partnerName = data.partnerName;
    if (data.partnerTrade !== undefined) updates.partnerTrade = data.partnerTrade;
    if (data.partnerPhone !== undefined) updates.partnerPhone = data.partnerPhone.replace(/\D/g, "");
    if (data.partnerContactName !== undefined) updates.partnerContactName = data.partnerContactName;
    if (data.partnerEmail !== undefined) updates.partnerEmail = data.partnerEmail;
    if (data.language !== undefined) updates.language = data.language;
    if (data.relationship !== undefined) updates.relationship = data.relationship;
    if (data.notes !== undefined) updates.notes = data.notes;

    const [updated] = await db
      .update(businessPartners)
      .set(updates)
      .where(and(eq(businessPartners.id, id), eq(businessPartners.businessId, businessId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json({ partner: updated });
  } catch (error) {
    reportError("Failed to update partner", error, { businessId });
    return NextResponse.json({ error: "Failed to update partner" }, { status: 500 });
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

  const rl = await rateLimit(`partners-delete:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true, message: "Demo mode — changes not saved" });
  }

  const { id } = await params;

  try {
    // Soft delete — set active to false
    const [deleted] = await db
      .update(businessPartners)
      .set({ active: false, updatedAt: new Date().toISOString() })
      .where(and(eq(businessPartners.id, id), eq(businessPartners.businessId, businessId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Failed to delete partner", error, { businessId });
    return NextResponse.json({ error: "Failed to delete partner" }, { status: 500 });
  }
}
