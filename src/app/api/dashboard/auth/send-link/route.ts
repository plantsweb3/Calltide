import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/lib/env";
import { generateMagicLink } from "@/lib/client-auth";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const [business] = await db
      .select({ id: businesses.id, name: businesses.name })
      .from(businesses)
      .where(eq(businesses.ownerEmail, email.toLowerCase().trim()));

    if (!business) {
      return NextResponse.json({ error: "No account found for this email" }, { status: 404 });
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
      from: "Calltide <hello@calltide.com>",
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

    return NextResponse.json({ message: "Check your email for a login link" });
  } catch (error) {
    console.error("Send magic link error:", error);
    return NextResponse.json({ error: "Failed to send login link" }, { status: 500 });
  }
}
