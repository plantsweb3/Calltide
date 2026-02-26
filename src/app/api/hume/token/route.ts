import { NextRequest, NextResponse } from "next/server";
import { fetchAccessToken } from "hume";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`hume-token:${ip}`, RATE_LIMITS.auth);
  if (!rl.success) return rateLimitResponse(rl);
  const accessToken = await fetchAccessToken({
    apiKey: String(process.env.HUME_API_KEY),
    secretKey: String(process.env.HUME_SECRET_KEY),
  });

  if (!accessToken) {
    return NextResponse.json({ error: "Failed to get access token" }, { status: 500 });
  }

  return NextResponse.json({ accessToken });
}
