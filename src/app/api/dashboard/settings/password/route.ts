import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, validatePassword } from "@/lib/password";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { isSessionInvalidated } from "@/lib/session-check";

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(1, "New password is required"),
});

export async function GET(req: NextRequest) {
  try {
    const accountId = req.headers.get("x-account-id");
    if (!accountId) {
      return NextResponse.json({ hasPassword: false, passwordChangedAt: null });
    }

    const [account] = await db
      .select({
        passwordHash: accounts.passwordHash,
        passwordChangedAt: accounts.passwordChangedAt,
      })
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    if (!account) {
      return NextResponse.json({ hasPassword: false, passwordChangedAt: null });
    }

    return NextResponse.json({
      hasPassword: !!account.passwordHash,
      passwordChangedAt: account.passwordChangedAt,
    });
  } catch (error) {
    reportError("Get password status error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`pwd-change:${ip}`, RATE_LIMITS.passwordChange);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const accountId = req.headers.get("x-account-id");
    if (!accountId) {
      return NextResponse.json({ error: "Account not found" }, { status: 400 });
    }

    // Reject sessions issued before a password change
    const sessionIat = req.headers.get("x-session-iat");
    if (await isSessionInvalidated(accountId, sessionIat)) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    // Validate new password strength
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
    }

    const [account] = await db
      .select({ passwordHash: accounts.passwordHash })
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // If account already has a password, require current password
    if (account.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }
      const valid = await verifyPassword(currentPassword, account.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }
    }

    const newHash = await hashPassword(newPassword);
    await db
      .update(accounts)
      .set({
        passwordHash: newHash,
        passwordChangedAt: new Date().toISOString(),
      })
      .where(eq(accounts.id, accountId));

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Change password error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
