import { NextRequest, NextResponse } from "next/server";
import { getRecentReferrals } from "@/lib/referrals/partners";
import { reportError } from "@/lib/error-reporting";
import { DEMO_BUSINESS_ID } from "../../demo-data";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`partners-referrals-get:${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json({
      referrals: [
        {
          id: "demo-ref-1",
          partnerId: "demo-partner-1",
          partnerName: "Rodriguez Plumbing",
          partnerTrade: "plumbing",
          callerName: "Sarah Miller",
          callerPhone: "2105559999",
          requestedTrade: "plumbing",
          jobDescription: "Kitchen sink leaking",
          referralMethod: "partner_notified",
          partnerNotified: true,
          outcome: "connected",
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          id: "demo-ref-2",
          partnerId: "demo-partner-2",
          partnerName: "Spark Electric Co",
          partnerTrade: "electrical",
          callerName: "Juan Hernandez",
          callerPhone: "2105558888",
          requestedTrade: "electrical",
          jobDescription: "Panel upgrade needed",
          referralMethod: "info_shared",
          partnerNotified: false,
          outcome: "pending",
          createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        },
      ],
      total: 2,
    });
  }

  try {
    const referrals = await getRecentReferrals(businessId);
    return NextResponse.json({ referrals, total: referrals.length });
  } catch (error) {
    reportError("Failed to fetch partner referrals", error, { businessId });
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}
