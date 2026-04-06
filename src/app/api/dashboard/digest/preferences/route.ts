import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import { DEMO_BUSINESS_ID } from "../../demo-data";

const updateSchema = z.object({
  digestPreference: z.enum(["sms", "email", "both", "none"]).optional(),
  digestTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format").optional(),
});

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`digest-preferences-get:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({
      digestPreference: "sms",
      digestTime: "18:00",
    });
  }

  try {
    const [biz] = await db
      .select({
        digestPreference: businesses.digestPreference,
        digestTime: businesses.digestTime,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json(biz);
  } catch (error) {
    reportError("Failed to fetch digest preferences", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`digest-preferences-put:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({ success: true });
  }

  try {
    const body = await req.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const parsed = result.data;
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (parsed.digestPreference !== undefined) updates.digestPreference = parsed.digestPreference;
    if (parsed.digestTime !== undefined) updates.digestTime = parsed.digestTime;

    await db.update(businesses).set(updates).where(eq(businesses.id, businessId));

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Failed to update digest preferences", error, { businessId });
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
