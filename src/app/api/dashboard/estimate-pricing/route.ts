import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businesses, pricingRanges } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { DEMO_BUSINESS_ID } from "../demo-data";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

const createSchema = z.object({
  mode: z.enum(["quick", "advanced"]).default("quick"),
  jobTypeKey: z.string().min(1).max(100),
  jobTypeLabel: z.string().min(1).max(200),
  jobTypeLabelEs: z.string().max(200).optional().nullable(),
  tradeType: z.string().min(1).max(50),
  scopeLevel: z.enum(["residential", "commercial", "all"]).default("residential"),
  minPrice: z.number().min(0).optional().nullable(),
  maxPrice: z.number().min(0).optional().nullable(),
  unit: z.enum(["per_job", "per_hour", "per_sqft", "per_unit", "per_room"]).default("per_job"),
  formulaJson: z.object({
    base_rate: z.number(),
    base_unit: z.string(),
    base_unit_variable: z.string(),
    additional_rates: z.array(z.object({ rate: z.number(), unit: z.string(), variable: z.string(), label: z.string() })),
    multipliers: z.array(z.object({ label: z.string(), value: z.number(), condition: z.string() })),
    variables_needed: z.array(z.string()),
    margin_range: z.tuple([z.number(), z.number()]),
  }).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`estimate-pricing-get:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ ranges: [], mode: "quick" });
  }

  try {
    const [biz] = await db
      .select({ estimateMode: businesses.estimateMode })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    const rows = await db
      .select()
      .from(pricingRanges)
      .where(
        and(
          eq(pricingRanges.businessId, businessId),
          eq(pricingRanges.active, true),
        ),
      )
      .orderBy(pricingRanges.sortOrder);

    return NextResponse.json({ ranges: rows, mode: biz?.estimateMode || "quick" });
  } catch (error) {
    reportError("Failed to fetch estimate pricing", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch estimate pricing" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`estimate-pricing-post:${businessId}`, RATE_LIMITS.write);
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
      .insert(pricingRanges)
      .values({
        businessId,
        mode: data.mode,
        jobTypeKey: data.jobTypeKey,
        jobTypeLabel: data.jobTypeLabel,
        jobTypeLabelEs: data.jobTypeLabelEs ?? null,
        tradeType: data.tradeType,
        scopeLevel: data.scopeLevel,
        minPrice: data.minPrice ?? null,
        maxPrice: data.maxPrice ?? null,
        unit: data.unit,
        formulaJson: data.formulaJson ?? null,
        sortOrder: data.sortOrder,
      })
      .returning();

    return NextResponse.json({ range: created }, { status: 201 });
  } catch (error) {
    reportError("Failed to create estimate pricing", error, { businessId });
    return NextResponse.json({ error: "Failed to create pricing range" }, { status: 500 });
  }
}
