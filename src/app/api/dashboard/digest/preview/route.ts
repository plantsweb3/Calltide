import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { aggregateDailyDigest } from "@/lib/digest/aggregator";
import { formatDigestSMS, formatDigestEmail } from "@/lib/digest/formatter";
import { reportError } from "@/lib/error-reporting";

const DEMO_BUSINESS_ID = "demo-business-id";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const data = await aggregateDailyDigest(businessId, tz);
    const sms = formatDigestSMS(data, biz.name, ownerName, receptionistName);
    const email = formatDigestEmail(data, biz.name, ownerName, receptionistName);

    return NextResponse.json({ sms, email, data });
  } catch (error) {
    reportError("Failed to generate digest preview", error, { businessId });
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}
