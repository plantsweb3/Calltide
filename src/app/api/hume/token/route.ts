import { NextRequest, NextResponse } from "next/server";
import { fetchAccessToken } from "hume";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`hume-token:${ip}`, RATE_LIMITS.auth);
  if (!rl.success) return rateLimitResponse(rl);

  // Require a valid dashboard or admin session (middleware now verifies signatures)
  const businessId = req.headers.get("x-business-id");
  const hasAdminCookie = req.cookies.has("capta_admin");
  if (!businessId && !hasAdminCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.HUME_API_KEY;
  const secretKey = process.env.HUME_SECRET_KEY;
  if (!apiKey || !secretKey) {
    return NextResponse.json({ error: "Hume not configured" }, { status: 500 });
  }

  const accessToken = await fetchAccessToken({
    apiKey,
    secretKey,
  });

  if (!accessToken) {
    return NextResponse.json({ error: "Failed to get access token" }, { status: 500 });
  }

  return NextResponse.json({ accessToken });
}
