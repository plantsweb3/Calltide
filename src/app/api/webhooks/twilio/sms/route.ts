import { NextRequest } from "next/server";
import twilio from "twilio";
import { db } from "@/db";
import { businesses, smsMessages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { findOrCreateLead } from "@/lib/ai/context-builder";
import { reportWarning } from "@/lib/error-reporting";

export async function POST(req: NextRequest) {
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

  // Flag for owner notification
  if (biz.ownerEmail) {
    console.log(`[notify] Email notification pending for ${biz.ownerName} <${biz.ownerEmail}> — inbound SMS from ${from}`);
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
