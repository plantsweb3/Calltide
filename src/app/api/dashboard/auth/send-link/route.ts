import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { db } from "@/db";
import { accounts, businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { env } from "@/lib/env";
import { generateMagicLink } from "@/lib/client-auth";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

const sendLinkSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per minute per IP
  const ip = getClientIp(req);
  const rl = await rateLimit(`send-link:${ip}`, RATE_LIMITS.auth);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body = await req.json();
    const parsed = sendLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const email = parsed.data.email;

    // Always return the same response regardless of whether the email exists
    // to prevent user enumeration attacks
    const genericResponse = { message: "If this email is registered, you'll receive a login link shortly" };

    const normalizedEmail = email.toLowerCase().trim();

    // First check businesses directly
    let [business] = await db
      .select({ id: businesses.id, name: businesses.name })
      .from(businesses)
      .where(eq(businesses.ownerEmail, normalizedEmail));

    // If not found, check accounts table for multi-location owners
    if (!business) {
      const [account] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.ownerEmail, normalizedEmail))
        .limit(1);

      if (account) {
        // Find the primary location for this account
        const [primaryBiz] = await db
          .select({ id: businesses.id, name: businesses.name })
          .from(businesses)
          .where(and(eq(businesses.accountId, account.id), eq(businesses.isPrimaryLocation, true)))
          .limit(1);

        if (primaryBiz) business = primaryBiz;
      }
    }

    if (!business) {
      return NextResponse.json(genericResponse);
    }

    const secret = env.CLIENT_AUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
    }

    const link = await generateMagicLink(
      business.id,
      email,
      env.NEXT_PUBLIC_APP_URL,
      secret,
    );

    const resend = new Resend(env.RESEND_API_KEY);
    await resend.emails.send({
      from: env.OUTREACH_FROM_EMAIL ?? "Calltide <hello@contact.calltide.app>",
      to: email,
      subject: "Your Calltide login link",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #f1f5f9; margin-bottom: 8px;">Sign in to Calltide</h2>
          <p style="color: #94a3b8; margin-bottom: 24px;">
            Click the button below to access your ${business.name} dashboard. This link expires in 15 minutes.
          </p>
          <a href="${link}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
            Sign In
          </a>
          <p style="color: #64748b; font-size: 13px; margin-top: 32px;">
            If you didn't request this link, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json(genericResponse);
  } catch (error) {
    reportError("Send magic link error", error);
    return NextResponse.json({ error: "Failed to send login link" }, { status: 500 });
  }
}
