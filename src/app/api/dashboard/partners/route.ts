import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businessPartners } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { DEMO_BUSINESS_ID } from "../demo-data";

const createSchema = z.object({
  partnerName: z.string().min(1).max(200),
  partnerTrade: z.string().min(1).max(100),
  partnerPhone: z.string().min(10).max(20),
  partnerContactName: z.string().max(200).optional().nullable(),
  partnerEmail: z.string().email().max(200).optional().nullable(),
  relationship: z.enum(["preferred", "trusted", "occasional"]).default("trusted"),
  notes: z.string().max(500).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({
      partners: [
        {
          id: "demo-partner-1",
          partnerName: "Rodriguez Plumbing",
          partnerTrade: "plumbing",
          partnerPhone: "2105551234",
          partnerContactName: "Carlos Rodriguez",
          partnerEmail: null,
          relationship: "preferred",
          notes: "Fast response, fair pricing",
          active: true,
          createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
        },
        {
          id: "demo-partner-2",
          partnerName: "Spark Electric Co",
          partnerTrade: "electrical",
          partnerPhone: "2105555678",
          partnerContactName: "Mike Torres",
          partnerEmail: "mike@sparkelectric.com",
          relationship: "trusted",
          notes: null,
          active: true,
          createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        },
      ],
    });
  }

  try {
    const rows = await db
      .select()
      .from(businessPartners)
      .where(and(eq(businessPartners.businessId, businessId), eq(businessPartners.active, true)));

    return NextResponse.json({ partners: rows });
  } catch (error) {
    reportError("Failed to fetch partners", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true, message: "Demo mode — changes not saved" });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = createSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      { error: `${firstError.path.join(".")}: ${firstError.message}` },
      { status: 400 },
    );
  }

  const data = result.data;

  try {
    const [created] = await db
      .insert(businessPartners)
      .values({
        businessId,
        partnerName: data.partnerName,
        partnerTrade: data.partnerTrade,
        partnerPhone: data.partnerPhone.replace(/\D/g, ""),
        partnerContactName: data.partnerContactName ?? null,
        partnerEmail: data.partnerEmail ?? null,
        relationship: data.relationship,
        notes: data.notes ?? null,
      })
      .returning();

    return NextResponse.json({ partner: created }, { status: 201 });
  } catch (error) {
    reportError("Failed to create partner", error, { businessId });
    return NextResponse.json({ error: "Failed to create partner" }, { status: 500 });
  }
}
