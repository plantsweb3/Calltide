import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyMagicToken, signClientCookie } from "@/lib/client-auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const secret = env.CLIENT_AUTH_SECRET;

  if (!token || !secret) {
    return NextResponse.redirect(new URL("/dashboard/login?error=invalid", req.url));
  }

  const result = await verifyMagicToken(token, secret);
  if (!result) {
    return NextResponse.redirect(new URL("/dashboard/login?error=invalid", req.url));
  }

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
