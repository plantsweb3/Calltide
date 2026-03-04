import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const COOKIE_NAME = "calltide_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

async function signToken(payload: string): Promise<string> {
  const secret = env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD is required for token signing");
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
  // Rate limit: 5 attempts per minute per IP
  const ip = getClientIp(req);
  const rl = await rateLimit(`admin-auth:${ip}`, RATE_LIMITS.auth);
  if (!rl.success) return rateLimitResponse(rl);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  if (!env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Admin auth not configured" }, { status: 500 });
  }

  const a = Buffer.from(parsed.data.password);
  const b = Buffer.from(env.ADMIN_PASSWORD);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const payload = JSON.stringify({ role: "admin", iat: Date.now(), exp: Date.now() + COOKIE_MAX_AGE * 1000 });
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
