import { NextRequest, NextResponse } from "next/server";
import { handleEmailWebhook } from "@/lib/outreach/email";
import { reportWarning } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`email-webhook:${ip}`, RATE_LIMITS.webhook);
  if (!rl.success) return rateLimitResponse(rl);

  // Validate webhook signature if Resend webhook secret is configured
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
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
  }

  let body;
  try {
    body = await req.json();
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
