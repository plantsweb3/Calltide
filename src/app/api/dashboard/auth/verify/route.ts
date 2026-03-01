import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { verifyMagicToken, signClientCookie } from "@/lib/client-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { db } from "@/db";
import { businesses, usedMagicTokens } from "@/db/schema";
import { eq, lte } from "drizzle-orm";

async function hashToken(token: string): Promise<string> {
  const encoded = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function GET(req: NextRequest) {
  const rl = await rateLimit(`auth-verify:${getClientIp(req)}`, { limit: 20, windowSeconds: 900 });
  if (!rl.success) {
    return NextResponse.redirect(new URL("/dashboard/login?error=rate_limited", req.url));
  }

  const token = req.nextUrl.searchParams.get("token");
  const secret = env.CLIENT_AUTH_SECRET;

  if (!token || !secret) {
    return NextResponse.redirect(new URL("/dashboard/login?error=invalid", req.url));
  }

  // Verify signature + expiry
  const result = await verifyMagicToken(token, secret);
  if (!result) {
    return NextResponse.redirect(new URL("/dashboard/login?error=invalid", req.url));
  }

  // Atomic single-use check: INSERT with unique constraint on token_hash
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + 16 * 60 * 1000).toISOString();

  const inserted = await db
    .insert(usedMagicTokens)
    .values({ tokenHash, expiresAt })
    .onConflictDoNothing()
    .returning({ id: usedMagicTokens.id });

  if (inserted.length === 0) {
    // Token was already used
    return NextResponse.redirect(new URL("/dashboard/login?error=expired", req.url));
  }

  // Clean up expired tokens (fire-and-forget, non-blocking)
  db.delete(usedMagicTokens)
    .where(lte(usedMagicTokens.expiresAt, new Date().toISOString()))
    .catch(() => {});

  // Look up accountId for multi-location support
  const [biz] = await db
    .select({ accountId: businesses.accountId })
    .from(businesses)
    .where(eq(businesses.id, result.businessId))
    .limit(1);

  const cookieValue = await signClientCookie(result.businessId, secret, biz?.accountId ?? undefined);

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
