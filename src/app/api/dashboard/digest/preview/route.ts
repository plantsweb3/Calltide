import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { aggregateDailyDigest } from "@/lib/digest/aggregator";
import { formatDigestSMS, formatDigestEmail } from "@/lib/digest/formatter";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";
import { DEMO_BUSINESS_ID } from "../../demo-data";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`digest-preview:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({
      sms: "📊 Maria's Daily Report\nQuiet day — 0 calls today.\n✅ Maria's keeping watch. Enjoy your evening!",
      email: { subject: "Maria's Daily Report", html: "<p>Preview not available in demo mode.</p>" },
      data: null,
    });
  }

  try {
    const [biz] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const tz = biz.timezone || "America/Chicago";
    const receptionistName = biz.receptionistName || "Maria";
    const ownerName = biz.ownerName?.split(" ")[0] || "there";
    const lang = (biz.defaultLanguage === "es" ? "es" : "en") as "en" | "es";

    const data = await aggregateDailyDigest(businessId, tz);
    const sms = formatDigestSMS(data, biz.name, ownerName, receptionistName, lang);
    const email = formatDigestEmail(data, biz.name, ownerName, receptionistName, lang);

    return NextResponse.json({ sms, email, data });
  } catch (error) {
    reportError("Failed to generate digest preview", error, { businessId });
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}
