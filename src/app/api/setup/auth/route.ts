import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { setupSessions, businesses, accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { signClientCookie } from "@/lib/client-auth";
import { hashPassword } from "@/lib/password";
import { reportError } from "@/lib/error-reporting";
import { cookies } from "next/headers";

const SETUP_COOKIE = "capta_setup";
const CLIENT_COOKIE = "capta_client";
const SESSION_30D = 30 * 24 * 60 * 60 * 1000;

/**
 * POST /api/setup/auth
 *
 * After Stripe checkout completes, the setup flow calls this to:
 * 1. Verify the setup session is converted (has businessId)
 * 2. Generate a password for the account if none exists
 * 3. Set the capta_client cookie so the user can access /dashboard
 * 4. Return the businessId + generated password for the celebration screen
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`setup-auth:${ip}`, { limit: 30, windowSeconds: 3600 });
  if (!rl.success) return rateLimitResponse(rl);

  const cookieStore = await cookies();
  const setupToken = cookieStore.get(SETUP_COOKIE)?.value;
  if (!setupToken) {
    return NextResponse.json({ error: "No setup session" }, { status: 401 });
  }

  try {
    // Find the setup session
    const [session] = await db
      .select()
      .from(setupSessions)
      .where(
        and(
          eq(setupSessions.token, setupToken),
          eq(setupSessions.status, "converted"),
        ),
      )
      .limit(1);

    if (!session || !session.businessId) {
      return NextResponse.json({ error: "Session not converted yet" }, { status: 404 });
    }

    // Load the business to get accountId
    const [biz] = await db
      .select({
        id: businesses.id,
        accountId: businesses.accountId,
        ownerEmail: businesses.ownerEmail,
      })
      .from(businesses)
      .where(eq(businesses.id, session.businessId))
      .limit(1);

    if (!biz || !biz.accountId) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Generate a temporary password if the account doesn't have one
    let generatedPassword: string | null = null;
    const [account] = await db
      .select({ id: accounts.id, passwordHash: accounts.passwordHash })
      .from(accounts)
      .where(eq(accounts.id, biz.accountId))
      .limit(1);

    if (account && !account.passwordHash) {
      // Generate a random 12-char password
      const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
      generatedPassword = Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map((b) => chars[b % chars.length])
        .join("");

      const hash = await hashPassword(generatedPassword);
      await db
        .update(accounts)
        .set({ passwordHash: hash, updatedAt: new Date().toISOString() })
        .where(eq(accounts.id, account.id));
    }

    // Sign and set the client cookie
    const secret = process.env.CLIENT_AUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
    }

    const cookieValue = await signClientCookie(biz.id, secret, biz.accountId, SESSION_30D);

    const response = NextResponse.json({
      success: true,
      businessId: biz.id,
      email: biz.ownerEmail,
      generatedPassword,
    });

    response.cookies.set(CLIENT_COOKIE, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_30D / 1000,
      path: "/",
    });

    return response;
  } catch (err) {
    reportError("[setup/auth] Failed to authenticate setup session", err);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
