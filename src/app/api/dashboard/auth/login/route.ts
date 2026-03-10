import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { accounts, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { env } from "@/lib/env";
import { signClientCookie } from "@/lib/client-auth";
import { verifyPassword } from "@/lib/password";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const MAX_FAILED_ATTEMPTS = 5;
const SESSION_24H = 24 * 60 * 60 * 1000;
const SESSION_30D = 30 * 24 * 60 * 60 * 1000;

const GENERIC_ERROR = "Invalid email or password";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email, password, rememberMe } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit per email+IP combo
    const rl = await rateLimit(`pwd-login:${normalizedEmail}:${ip}`, RATE_LIMITS.passwordLogin);
    if (!rl.success) return rateLimitResponse(rl);

    // Look up account by email
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.ownerEmail, normalizedEmail))
      .limit(1);

    if (!account || !account.passwordHash) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    // Check lockout
    if (account.lockedUntil) {
      const lockExpiry = new Date(account.lockedUntil).getTime();
      if (lockExpiry > Date.now()) {
        const minutesLeft = Math.ceil((lockExpiry - Date.now()) / 60_000);
        return NextResponse.json(
          { error: `Account temporarily locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.` },
          { status: 423 },
        );
      }
      // Lock expired, reset
      await db.update(accounts).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(accounts.id, account.id));
    }

    // Verify password
    const valid = await verifyPassword(password, account.passwordHash);
    if (!valid) {
      const attempts = (account.failedLoginAttempts ?? 0) + 1;
      const updates: Record<string, unknown> = { failedLoginAttempts: attempts };
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
      }
      await db.update(accounts).set(updates).where(eq(accounts.id, account.id));

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        return NextResponse.json(
          { error: "Too many failed attempts. Account locked for 30 minutes." },
          { status: 423 },
        );
      }
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    // Success — reset failed attempts
    await db.update(accounts).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(accounts.id, account.id));

    // Find primary business for this account
    const [primaryBiz] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.accountId, account.id), eq(businesses.isPrimaryLocation, true)))
      .limit(1);

    // Fallback: any business linked to this account
    const businessId = primaryBiz?.id ?? (
      await db
        .select({ id: businesses.id })
        .from(businesses)
        .where(eq(businesses.accountId, account.id))
        .limit(1)
    )[0]?.id;

    if (!businessId) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    // Sign cookie with appropriate TTL
    const maxAge = rememberMe ? SESSION_30D : SESSION_24H;
    const secret = env.CLIENT_AUTH_SECRET;
    const cookieValue = await signClientCookie(businessId, secret, account.id, maxAge);

    const response = NextResponse.json({ success: true });
    response.cookies.set("capta_client", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: maxAge / 1000,
      path: "/",
    });

    return response;
  } catch (error) {
    reportError("Password login error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
