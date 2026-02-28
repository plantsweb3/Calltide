import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { handleEmailWebhook } from "@/lib/outreach/email";
import { reportWarning } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * Verify SVIX webhook signature (HMAC-SHA256).
 * Secret format from Resend: "whsec_<base64-key>"
 */
function verifySvixSignature(
  secret: string,
  svixId: string,
  svixTimestamp: string,
  body: string,
  signatureHeader: string,
): boolean {
  // Resend SVIX secrets are prefixed with "whsec_" — strip it to get the base64 key
  const rawKey = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const keyBytes = Buffer.from(rawKey, "base64");
  const toSign = `${svixId}.${svixTimestamp}.${body}`;
  const expected = createHmac("sha256", keyBytes).update(toSign).digest("base64");

  // signatureHeader may contain multiple signatures: "v1,<sig1> v1,<sig2>"
  const signatures = signatureHeader.split(" ");
  return signatures.some((s) => {
    const parts = s.split(",");
    return parts.length === 2 && parts[1] === expected;
  });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`email-webhook:${ip}`, RATE_LIMITS.webhook);
  if (!rl.success) return rateLimitResponse(rl);

  // Read raw body for signature verification
  const rawBody = await req.text();

  // Validate webhook signature — require RESEND_WEBHOOK_SECRET in production
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    reportWarning("RESEND_WEBHOOK_SECRET is not set — rejecting email webhook");
    return NextResponse.json({ error: "Webhook auth not configured" }, { status: 500 });
  }

  {
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      reportWarning("Missing SVIX headers on email webhook");
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
    }

    // Reject stale timestamps (older than 5 minutes)
    const ts = parseInt(svixTimestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > 300) {
      reportWarning("Stale email webhook timestamp");
      return NextResponse.json({ error: "Stale webhook" }, { status: 401 });
    }

    // Verify cryptographic signature
    if (!verifySvixSignature(webhookSecret, svixId, svixTimestamp, rawBody, svixSignature)) {
      reportWarning("Invalid SVIX signature on email webhook");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Basic structural validation
  if (!body || typeof body !== "object" || !body.type) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  await handleEmailWebhook(body);
  return NextResponse.json({ success: true });
}
