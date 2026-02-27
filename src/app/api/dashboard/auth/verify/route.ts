import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyMagicToken, signClientCookie } from "@/lib/client-auth";

// Single-use token store: tracks consumed tokens until they'd expire naturally (15 min)
const usedTokens = new Map<string, number>();
const TOKEN_TTL = 16 * 60 * 1000; // 16 min (slightly longer than token expiry)
let lastTokenCleanup = Date.now();
function cleanupUsedTokens() {
  const now = Date.now();
  if (now - lastTokenCleanup < 60_000) return;
  lastTokenCleanup = now;
  for (const [t, exp] of usedTokens) {
    if (exp < now) usedTokens.delete(t);
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const secret = env.CLIENT_AUTH_SECRET;

  if (!token || !secret) {
    return NextResponse.redirect(new URL("/dashboard/login?error=invalid", req.url));
  }

  cleanupUsedTokens();

  // Check if token was already used
  if (usedTokens.has(token)) {
    return NextResponse.redirect(new URL("/dashboard/login?error=expired", req.url));
  }

  const result = await verifyMagicToken(token, secret);
  if (!result) {
    return NextResponse.redirect(new URL("/dashboard/login?error=invalid", req.url));
  }

  // Mark token as used
  usedTokens.set(token, Date.now() + TOKEN_TTL);

  const cookieValue = await signClientCookie(result.businessId, secret);

  const response = NextResponse.redirect(new URL("/dashboard", req.url));
  response.cookies.set("calltide_client", cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
}
