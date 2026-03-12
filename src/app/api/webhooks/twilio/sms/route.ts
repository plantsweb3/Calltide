import { NextRequest } from "next/server";
import twilio from "twilio";
import { db } from "@/db";
import { businesses, leads, calls, smsMessages } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { findOrCreateLead } from "@/lib/ai/context-builder";
import { reportWarning, reportError } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { handleProspectSmsKeyword } from "@/lib/outreach/sms-outreach";
import { detectOwnerReply } from "@/lib/notifications/owner-reply-handler";
import { processInboundPhotos } from "@/lib/photos/receive";
import { logActivity } from "@/lib/activity";
import { sendSMS } from "@/lib/twilio/sms";
import { normalizePhone } from "@/lib/compliance/sms";
import { env } from "@/lib/env";
import { getResend } from "@/lib/email/client";

const OPT_OUT_KEYWORDS = ["stop", "unsubscribe", "cancel", "quit", "end", "optout", "opt out"];
const OPT_IN_KEYWORDS = ["start", "unstop", "subscribe", "opt in", "optin"];

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`twilio-sms:${ip}`, RATE_LIMITS.webhook);
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
  // Cap body length to prevent memory abuse (SMS max is 1600 chars, MMS can be longer)
  const body = (params.Body || "").slice(0, 4000).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  const messageSid = params.MessageSid || "";

  // Validate phone numbers match E.164 format
  if (from && !/^\+?[1-9]\d{1,14}$/.test(from)) {
    reportWarning("Inbound SMS with invalid From number", { messageSid });
    return twimlResponse("");
  }

  console.log("Inbound SMS received:", { messageSid });

  // Look up which business owns the To number
  let [biz] = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.twilioNumber, to), eq(businesses.active, true)))
    .limit(1);

  // If no active business, check for inactive business where sender is the owner
  // This enables onboarding-via-SMS (owner texts before activating)
  let isOnboarding = false;
  if (!biz) {
    const normalizedFrom = normalizePhone(from);
    const [inactiveBiz] = await db
      .select()
      .from(businesses)
      .where(and(eq(businesses.twilioNumber, to), eq(businesses.active, false)))
      .limit(1);

    if (inactiveBiz && normalizePhone(inactiveBiz.ownerPhone) === normalizedFrom) {
      biz = inactiveBiz;
      isOnboarding = true;
    } else {
      reportWarning("Inbound SMS to unrecognized number — no business found", {
        messageSid,
        timestamp: new Date().toISOString(),
      });
      return twimlResponse("Thank you for your message. This number is not currently active.");
    }
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

  // Handle SMS opt-out / opt-in (skip for business owner)
  const normalizedBody = body.trim().toLowerCase();
  const isOwner = normalizePhone(from) === normalizePhone(biz.ownerPhone);

  if (!isOwner && OPT_OUT_KEYWORDS.some((kw) => normalizedBody === kw)) {
    await db.update(leads).set({
      smsOptOut: true,
      updatedAt: new Date().toISOString(),
    }).where(eq(leads.id, lead.id));

    console.log(`SMS opt-out recorded for lead ${lead.id}`);
    return twimlResponse("You have been unsubscribed and will no longer receive SMS messages from us. Reply START to re-subscribe.");
  }

  if (!isOwner && OPT_IN_KEYWORDS.some((kw) => normalizedBody === kw)) {
    await db.update(leads).set({
      smsOptOut: false,
      updatedAt: new Date().toISOString(),
    }).where(eq(leads.id, lead.id));

    console.log(`SMS opt-in recorded for lead ${lead.id}`);
    return twimlResponse("You have been re-subscribed to SMS messages. Reply STOP to unsubscribe.");
  }

  // Handle inbound MMS photos — check BEFORE owner reply detection
  const rawNumMedia = parseInt(params.NumMedia || "0", 10);
  const numMedia = Number.isNaN(rawNumMedia) ? 0 : Math.min(Math.max(rawNumMedia, 0), 10);
  if (numMedia > 0) {
    try {
      const mediaUrls: string[] = [];
      const mediaTypes: string[] = [];
      for (let i = 0; i < numMedia; i++) {
        if (params[`MediaUrl${i}`]) mediaUrls.push(params[`MediaUrl${i}`]);
        if (params[`MediaContentType${i}`]) mediaTypes.push(params[`MediaContentType${i}`]);
      }

      const photoResult = await processInboundPhotos({
        fromPhone: from,
        toPhone: to,
        numMedia,
        mediaUrls,
        mediaTypes,
        bodyText: body || null,
        businessId: biz.id,
      });

      if (photoResult.matched) {
        // Photos matched to an intake — already handled (confirmations sent)
        return twimlResponse("");
      }
      // No match — fall through to regular SMS handling
    } catch (err) {
      reportError("Inbound MMS processing failed", err, { extra: { businessId: biz.id } });
      // Fall through to regular SMS handling
    }
  }

  // Handle owner replies to job card notifications (1=confirm, 2=adjust, 3=site visit)
  // Must be checked BEFORE callback/prospect handlers to intercept numeric replies
  try {
    const ownerReply = await detectOwnerReply(from, to, body);
    if (ownerReply.handled && ownerReply.responseMessage) {
      // Send confirmation back to owner
      if (biz.twilioNumber) {
        sendSMS({
          to: from,
          from: biz.twilioNumber,
          body: ownerReply.responseMessage,
          businessId: biz.id,
          templateType: "owner_notify",
        }).catch((err) =>
          reportError("Owner reply confirmation SMS failed", err, { extra: { businessId: biz.id } })
        );
      }
      return twimlResponse("");
    }
  } catch (err) {
    reportError("Owner reply detection failed", err, { extra: { businessId: biz.id } });
  }

  // Handle missed call recovery YES/SÍ replies
  const CALLBACK_KEYWORDS = ["yes", "si", "sí", "yeah", "yep", "please", "por favor"];
  if (CALLBACK_KEYWORDS.some((kw) => normalizedBody === kw || normalizedBody === kw + "!")) {
    const recoveryHandled = await handleCallbackRequest(biz, lead, from);
    if (recoveryHandled) {
      return twimlResponse("Great! We'll have someone reach out to you shortly. Thank you!");
    }
  }

  // Also check prospect opt-out/opt-in (outreach targets)
  const prospectResult = await handleProspectSmsKeyword(from, body);
  if (prospectResult.handled) {
    console.log(`Prospect SMS ${prospectResult.action} processed`);
  }

  // Check if this is a learning response (owner replying to a knowledge gap question)
  if (isOwner && body.trim().length > 0) {
    try {
      const { handleLearningResponse } = await import("@/lib/maria/learning");
      const wasLearning = await handleLearningResponse(biz.id, body.trim());
      if (wasLearning) {
        return twimlResponse("");
      }
    } catch (err) {
      reportError("Learning response check failed", err, { extra: { businessId: biz.id } });
    }
  }

  // Owner conversational SMS — route through Maria's chat engine
  // Triggers for active business owners AND onboarding owners (isOnboarding)
  if ((isOwner || isOnboarding) && body.trim().length > 0 && process.env.ANTHROPIC_API_KEY) {
    // Fire-and-forget: respond immediately to Twilio, process chat in background
    // Twilio has a 15s timeout — Maria's chat can take longer
    (async () => {
      try {
        const { chat: mariaChat } = await import("@/lib/maria/chat-engine");
        const result = await mariaChat(biz.id, body.trim(), "sms", isOnboarding ? "onboarding" : undefined);

        if (result.reply) {
          // Cap length and strip control characters before sending
          const replyBody = result.reply.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, 1500);
          await sendSMS({
            to: from,
            from: biz.twilioNumber,
            body: replyBody,
            businessId: biz.id,
            templateType: "owner_notify",
          });
        }
      } catch (err) {
        reportError("Owner SMS → Maria chat failed", err, { extra: { businessId: biz.id } });
      }
    })();
    return twimlResponse("");
  }

  // Notify business owner of inbound SMS from customers (fire-and-forget)
  // Skip if the message came from the owner themselves
  if (biz.ownerEmail && !isOwner) {
    notifyOwnerOfSms(biz.id, biz.name, biz.ownerEmail, body).catch((err) =>
      reportError("Failed to send inbound SMS notification email", err, { extra: { businessId: biz.id } })
    );
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

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

async function handleCallbackRequest(
  biz: { id: string; name: string; ownerPhone: string; twilioNumber: string; receptionistName: string | null },
  lead: { id: string },
  callerPhone: string,
): Promise<boolean> {
  try {
    // Find the most recent abandoned call from this caller to this business with recovery SMS sent
    const [abandonedCall] = await db
      .select()
      .from(calls)
      .where(
        and(
          eq(calls.businessId, biz.id),
          eq(calls.callerPhone, callerPhone),
          eq(calls.isAbandoned, true),
          eq(calls.recoveryStatus, "sms_sent"),
        ),
      )
      .orderBy(desc(calls.createdAt))
      .limit(1);

    if (!abandonedCall) return false;

    const receptionistName = biz.receptionistName || "Maria";
    const callTime = new Date(abandonedCall.createdAt);
    const timeStr = callTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Chicago",
    });

    // Update call recovery status
    await db.update(calls).set({
      recoveryStatus: "callback_requested",
      updatedAt: new Date().toISOString(),
    }).where(eq(calls.id, abandonedCall.id));

    // Alert business owner
    await sendSMS({
      to: biz.ownerPhone,
      from: biz.twilioNumber,
      body: `Missed call recovery: ${callerPhone} wants a callback. They called at ${timeStr} and hung up after ${abandonedCall.duration || 0} seconds. — ${receptionistName}`,
      businessId: biz.id,
      leadId: lead.id,
      templateType: "owner_notify",
    });

    // Log activity
    await logActivity({
      type: "missed_call_recovery",
      entityType: "call",
      entityId: abandonedCall.id,
      title: `Callback requested from abandoned call`,
      detail: `Caller ${callerPhone} replied YES to recovery SMS. Owner notified.`,
    });

    return true;
  } catch (err) {
    reportError("handleCallbackRequest failed", err, { extra: { businessId: biz.id } });
    return false;
  }
}

async function notifyOwnerOfSms(businessId: string, businessName: string, ownerEmail: string, messageBody: string): Promise<void> {
  if (!env.RESEND_API_KEY) return;
  const resend = getResend();
  const from = env.OUTREACH_FROM_EMAIL ?? "Capta <hello@contact.capta.app>";
  const preview = escapeHtml(messageBody).slice(0, 300);

  await resend.emails.send({
    from,
    to: ownerEmail,
    subject: `New SMS received — ${escapeHtml(businessName)}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="margin-bottom:24px;"><span style="font-size:20px;font-weight:700;color:#C59A27;">Capta</span></div>
  <p style="color:#475569;">You received a new text message for <strong>${escapeHtml(businessName)}</strong>:</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;">
    <p style="color:#1e293b;margin:0;white-space:pre-wrap;">${preview}</p>
  </div>
  <a href="${env.NEXT_PUBLIC_APP_URL}/dashboard/messages" style="display:inline-block;background:#C59A27;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:500;">View in Dashboard</a>
</div>`,
  });
}
