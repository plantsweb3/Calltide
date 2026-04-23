import { NextRequest, NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const businessId = req.headers.get("x-business-id") ?? req.cookies.get("capta_client")?.value ?? "anonymous";
  const rl = await rateLimit(`auth-logout:${businessId}`, RATE_LIMITS.write);
  if (!rl.success) return rateLimitResponse(rl);
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.set("capta_client", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
