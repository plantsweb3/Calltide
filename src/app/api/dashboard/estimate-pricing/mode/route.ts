import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { reportError } from "@/lib/error-reporting";
import { DEMO_BUSINESS_ID } from "../../demo-data";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

const modeSchema = z.object({
  estimateMode: z.enum(["quick", "advanced", "both"]),
});

export async function PUT(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`estimate-pricing-mode:${businessId}`, RATE_LIMITS.write);
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

  const result = modeSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      { error: `${firstError.path.join(".")}: ${firstError.message}` },
      { status: 400 },
    );
  }

  try {
    await db
      .update(businesses)
      .set({
        estimateMode: result.data.estimateMode,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businesses.id, businessId));

    return NextResponse.json({ success: true, estimateMode: result.data.estimateMode });
  } catch (error) {
    reportError("Failed to update estimate mode", error, { businessId });
    return NextResponse.json({ error: "Failed to update estimate mode" }, { status: 500 });
  }
}
