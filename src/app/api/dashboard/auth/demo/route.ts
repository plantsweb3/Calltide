import { NextRequest, NextResponse } from "next/server";
import { signClientCookie } from "@/lib/client-auth";
import { reportWarning } from "@/lib/error-reporting";

const DEMO_BUSINESS_ID = "demo-client-001";

export async function GET(req: NextRequest) {
  const secret = process.env.CLIENT_AUTH_SECRET;
  if (!secret) {
    reportWarning("CLIENT_AUTH_SECRET is not set");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const cookieValue = await signClientCookie(DEMO_BUSINESS_ID, secret);

  const response = NextResponse.redirect(new URL("/dashboard", req.url));
  response.cookies.set("calltide_client", cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
