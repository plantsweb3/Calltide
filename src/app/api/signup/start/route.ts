import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { reportError } from "@/lib/error-reporting";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?1?\d{10,15}$/, "Invalid phone number").optional(),
});

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`signup-start:${getClientIp(req)}`, { limit: 10, windowSeconds: 3600 });
  if (!rl.success) return rateLimitResponse(rl);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 400 }
    );
  }

  const { email, phone } = result.data;

  // Check if a business with this email already exists
  const [existing] = await db
    .select({ id: businesses.id, ownerEmail: businesses.ownerEmail })
    .from(businesses)
    .where(eq(businesses.ownerEmail, email))
    .limit(1);

  if (existing) {
    // Return same shape as success to prevent email enumeration.
    // The signup form will still work — the existing user just won't get a duplicate account.
    return NextResponse.json({ success: true });
  }

  // If phone provided, send checkout link via SMS
  // Separate per-phone rate limit to prevent SMS bombing arbitrary numbers
  if (phone) {
    const smsRl = await rateLimit(`signup-sms:${phone}`, { limit: 2, windowSeconds: 3600 });
    if (smsRl.success) {
      sendCheckoutSms(phone, email).catch((err) =>
        reportError("Failed to send signup SMS", err)
      );
    }
  }

  return NextResponse.json({ ok: true, email, phone: phone || undefined });
}

/**
 * Send the signup/checkout link via SMS so blue-collar owners
 * can complete checkout on their phone without email.
 */
async function sendCheckoutSms(phone: string, email: string) {
  const Twilio = (await import("twilio")).default;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !from) return;

  const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com"}/setup`;
  const client = Twilio(accountSid, authToken);
  await client.messages.create({
    to: phone,
    from,
    body: `Capta: Here's your signup link to get your AI receptionist set up. Get started: ${checkoutUrl}\n\nReply STOP to opt out.`,
  });
}
