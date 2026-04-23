import { NextRequest, NextResponse } from "next/server";
import { signClientCookie } from "@/lib/client-auth";
import { reportWarning } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const DEMO_BUSINESS_ID = "demo-client-001";
const DEMO_ACCOUNT_ID = "demo-account-001";

export async function GET(req: NextRequest) {
  if (process.env.DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rl = await rateLimit(`demo-login:${getClientIp(req)}`, { limit: 5, windowSeconds: 3600 });
  if (!rl.success) return rateLimitResponse(rl);

  const secret = process.env.CLIENT_AUTH_SECRET;
  if (!secret) {
    reportWarning("CLIENT_AUTH_SECRET is not set");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const cookieValue = await signClientCookie(DEMO_BUSINESS_ID, secret, DEMO_ACCOUNT_ID);

  const response = NextResponse.redirect(new URL("/dashboard", req.url));
  response.cookies.set("capta_client", cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
