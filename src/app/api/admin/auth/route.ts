import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

const COOKIE_NAME = "calltide_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

async function signToken(payload: string): Promise<string> {
  const secret = env.ADMIN_PASSWORD ?? "calltide-default";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${payload}.${sig}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password } = body;

  if (!env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Admin auth not configured" }, { status: 500 });
  }

  if (password !== env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const payload = JSON.stringify({ role: "admin", iat: Date.now() });
  const token = await signToken(payload);

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return res;
}
