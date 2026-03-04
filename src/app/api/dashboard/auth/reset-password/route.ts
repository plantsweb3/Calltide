import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, validatePassword, hashResetToken } from "@/lib/password";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`pwd-reset-submit:${ip}`, { limit: 10, windowSeconds: 900 });
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { email, token, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = await hashResetToken(token);

    // Look up account
    const [account] = await db
      .select({
        id: accounts.id,
        passwordResetToken: accounts.passwordResetToken,
        passwordResetExpiry: accounts.passwordResetExpiry,
      })
      .from(accounts)
      .where(eq(accounts.ownerEmail, normalizedEmail))
      .limit(1);

    if (!account || !account.passwordResetToken || !account.passwordResetExpiry) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    // Verify token matches
    if (account.passwordResetToken !== hashedToken) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    // Check expiry
    if (new Date(account.passwordResetExpiry).getTime() < Date.now()) {
      return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 400 });
    }

    // Hash new password and update
    const passwordHash = await hashPassword(password);
    await db
      .update(accounts)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        passwordChangedAt: new Date().toISOString(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(accounts.id, account.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    reportError("Reset password error", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
