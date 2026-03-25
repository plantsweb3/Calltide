import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { servicePricing } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { DEMO_BUSINESS_ID, DEMO_PRICING } from "../demo-data";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

const createSchema = z.object({
  serviceName: z.string().min(1).max(100),
  priceMin: z.number().min(0).optional().nullable(),
  priceMax: z.number().min(0).optional().nullable(),
  unit: z.enum(["per_job", "per_hour", "per_sqft", "per_unit"]).default("per_job"),
  description: z.string().max(500).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ pricing: DEMO_PRICING });
  }

  const rl = await rateLimit(`dashboard-pricing-${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const rows = await db
      .select()
      .from(servicePricing)
      .where(
        and(
          eq(servicePricing.businessId, businessId),
          eq(servicePricing.isActive, true),
        ),
      );

    return NextResponse.json({ pricing: rows });
  } catch (error) {
    reportError("Failed to fetch pricing", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch pricing" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`dashboard-pricing-create-${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

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
      .insert(servicePricing)
      .values({
        businessId,
        serviceName: data.serviceName,
        priceMin: data.priceMin ?? null,
        priceMax: data.priceMax ?? null,
        unit: data.unit,
        description: data.description ?? null,
      })
      .returning();

    return NextResponse.json({ pricing: created }, { status: 201 });
  } catch (error) {
    reportError("Failed to create pricing", error, { businessId });
    return NextResponse.json({ error: "Failed to create pricing" }, { status: 500 });
  }
}
