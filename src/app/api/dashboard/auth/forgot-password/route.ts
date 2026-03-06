import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { hashResetToken } from "@/lib/password";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { getResend } from "@/lib/email/client";

const forgotSchema = z.object({
  email: z.string().email("Valid email is required"),
});

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`pwd-reset:${ip}`, RATE_LIMITS.passwordReset);
  if (!rl.success) return rateLimitResponse(rl);

  const genericResponse = { message: "If an account exists with that email, you'll receive a password reset link." };

  try {
    const body = await req.json();
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const normalizedEmail = parsed.data.email.toLowerCase().trim();

    const [account] = await db
      .select({ id: accounts.id, ownerName: accounts.ownerName })
      .from(accounts)
      .where(eq(accounts.ownerEmail, normalizedEmail))
      .limit(1);

    if (!account) {
      return NextResponse.json(genericResponse);
    }

    // Generate reset token
    const rawToken = crypto.randomUUID();
    const hashedToken = await hashResetToken(rawToken);
    const expiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS).toISOString();

    await db
      .update(accounts)
      .set({ passwordResetToken: hashedToken, passwordResetExpiry: expiry })
      .where(eq(accounts.id, account.id));

    // Send reset email
    const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

    const resend = getResend();
    await resend.emails.send({
      from: env.OUTREACH_FROM_EMAIL ?? "Calltide <hello@contact.calltide.app>",
      to: normalizedEmail,
      subject: "Reset your Calltide password",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #1A1D24; margin-bottom: 8px;">Reset your password</h2>
          <p style="color: #475569; margin-bottom: 24px;">
            Hi ${account.ownerName || "there"}, we received a request to reset your Calltide password. Click the button below to set a new one. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #C59A27; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Reset Password
          </a>
          <p style="color: #94A3B8; font-size: 13px; margin-top: 32px;">
            If you didn't request this, you can safely ignore this email. Your password won't be changed.
          </p>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
          <p style="color: #94A3B8; font-size: 12px;">
            &copy; Calltide &mdash; AI Receptionist for Home Services
          </p>
        </div>
      `,
    });

    return NextResponse.json(genericResponse);
  } catch (error) {
    reportError("Forgot password error", error);
    return NextResponse.json(genericResponse);
  }
}
