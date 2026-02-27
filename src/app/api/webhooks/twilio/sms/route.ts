import { NextRequest } from "next/server";
import twilio from "twilio";
import { db } from "@/db";
import { businesses, leads, smsMessages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { findOrCreateLead } from "@/lib/ai/context-builder";
import { reportWarning } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { handleProspectSmsKeyword } from "@/lib/outreach/sms-outreach";

const OPT_OUT_KEYWORDS = ["stop", "unsubscribe", "cancel", "quit", "end", "optout", "opt out"];
const OPT_IN_KEYWORDS = ["start", "unstop", "subscribe", "opt in", "optin"];

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`twilio-sms:${ip}`, RATE_LIMITS.webhook);
  if (!rl.success) return rateLimitResponse(rl);
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    reportWarning("TWILIO_AUTH_TOKEN is not set");
    return twimlResponse("We're unable to process your message at this time.");
  }

  // Parse form-encoded body (Twilio sends application/x-www-form-urlencoded)
  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = String(value);
  }

  // Validate Twilio signature
  const signature = req.headers.get("x-twilio-signature") || "";
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/sms`;

  const valid = twilio.validateRequest(authToken, signature, url, params);
  if (!valid) {
    reportWarning("Invalid Twilio webhook signature", {
      url,
      signature: signature.slice(0, 10) + "...",
    });
    return new Response("Forbidden", { status: 403 });
  }

  const from = params.From || "";
  const to = params.To || "";
  const body = params.Body || "";
  const messageSid = params.MessageSid || "";

  console.log("Inbound SMS received:", { from, to, messageSid });

  // Look up which business owns the To number
  const [biz] = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.twilioNumber, to), eq(businesses.active, true)))
    .limit(1);

  if (!biz) {
    console.warn("Inbound SMS to unrecognized number — no business found", {
      from,
      to,
      messageSid,
      timestamp: new Date().toISOString(),
    });
    return twimlResponse("Thank you for your message. This number is not currently active.");
  }

  // Find or create lead from the sender's phone
  const lead = await findOrCreateLead(biz.id, from);

  // Store the inbound message
  await db.insert(smsMessages).values({
    businessId: biz.id,
    leadId: lead.id,
    direction: "inbound",
    fromNumber: from,
    toNumber: to,
    body,
    twilioSid: messageSid,
    status: "received",
  });

  console.log(`Inbound SMS for ${biz.name} from ${from}: "${body.slice(0, 80)}"`);

  // Handle SMS opt-out / opt-in
  const normalizedBody = body.trim().toLowerCase();

  if (OPT_OUT_KEYWORDS.some((kw) => normalizedBody === kw)) {
    await db.update(leads).set({
      smsOptOut: true,
      updatedAt: new Date().toISOString(),
    }).where(eq(leads.id, lead.id));

    console.log(`SMS opt-out recorded for lead ${lead.id} (${from})`);
    return twimlResponse("You have been unsubscribed and will no longer receive SMS messages from us. Reply START to re-subscribe.");
  }

  if (OPT_IN_KEYWORDS.some((kw) => normalizedBody === kw)) {
    await db.update(leads).set({
      smsOptOut: false,
      updatedAt: new Date().toISOString(),
    }).where(eq(leads.id, lead.id));

    console.log(`SMS opt-in recorded for lead ${lead.id} (${from})`);
    return twimlResponse("You have been re-subscribed to SMS messages. Reply STOP to unsubscribe.");
  }

  // Also check prospect opt-out/opt-in (outreach targets)
  const prospectResult = await handleProspectSmsKeyword(from, body);
  if (prospectResult.handled) {
    console.log(`Prospect SMS ${prospectResult.action} processed`);
  }

  // Flag for owner notification
  if (biz.ownerEmail) {
    console.log(`[notify] Email notification pending for business ${biz.id ?? "unknown"} — inbound SMS`);
  }

  return twimlResponse("");
}

function twimlResponse(message: string): Response {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
