import { NextRequest, NextResponse } from "next/server";
import { TRADE_PROFILES, calculateROI, type TradeType } from "@/lib/receptionist/trade-profiles";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

/**
 * GET /api/setup/trade-data/[tradeType]
 * Return trade profile data (services, ROI) — public, cached.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tradeType: string }> },
) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`setup-trade:${ip}`, { limit: 60, windowSeconds: 60 });
  if (!rl.success) return rateLimitResponse(rl);

  const { tradeType } = await params;

  if (!TRADE_PROFILES[tradeType as TradeType]) {
    return NextResponse.json({ error: "Unknown trade type" }, { status: 404 });
  }

  const profile = TRADE_PROFILES[tradeType as TradeType];
  const roi = calculateROI(tradeType as TradeType);

  return NextResponse.json(
    {
      type: tradeType,
      label: profile.label,
      commonServices: profile.commonServices,
      avgJobValue: profile.avgJobValue,
      roi,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    },
  );
}
