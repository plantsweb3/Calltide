import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { DEMO_BUSINESS_ID } from "../../demo-data";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

const toggleSchema = z.object({
  enabled: z.boolean(),
});

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`pricing-toggle:${businessId}`, RATE_LIMITS.write);
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

  const result = toggleSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    await db
      .update(businesses)
      .set({
        hasPricingEnabled: result.data.enabled,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businesses.id, businessId));

    return NextResponse.json({ success: true, enabled: result.data.enabled });
  } catch (error) {
    reportError("Failed to toggle pricing", error, { businessId });
    return NextResponse.json({ error: "Failed to toggle pricing" }, { status: 500 });
  }
}
