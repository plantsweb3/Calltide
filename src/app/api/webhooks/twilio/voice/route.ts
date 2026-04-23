import { NextRequest } from "next/server";
import twilio from "twilio";
import { db } from "@/db";
import { businesses, calls, leads } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { reportWarning, reportError } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/compliance/sms";
import { trackCallStart } from "@/lib/monitoring/active-calls";

/**
 * POST /api/webhooks/twilio/voice
 *
 * Twilio hits this URL when an inbound call arrives on a provisioned number.
 * Returns TwiML that connects the caller to ElevenLabs via <Connect><Stream>.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`twilio-voice:${ip}`, RATE_LIMITS.webhook);
  if (!rl.success) return rateLimitResponse(rl);

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    reportWarning("TWILIO_AUTH_TOKEN not set — rejecting voice webhook");
    return twimlSay("We're sorry, this number is not available right now. Please try again later.");
  }

  // Parse form-encoded body (Twilio sends application/x-www-form-urlencoded)
  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = String(value);
  }

  // Validate Twilio signature
  // Use the full request URL (including query params like ?queue_retry=1) because
  // Twilio signs against the complete URL it was told to request.
  const signature = req.headers.get("x-twilio-signature") || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";
  const parsedUrl = new URL(req.url);
  const requestPath = parsedUrl.pathname + parsedUrl.search;
  const url = `${appUrl}${requestPath}`;

  const valid = twilio.validateRequest(authToken, signature, url, params);
  if (!valid) {
    reportWarning("Invalid Twilio signature on inbound voice webhook", {
      url,
      signature: signature.slice(0, 10) + "...",
    });
    return new Response("Forbidden", { status: 403 });
  }

  const calledNumber = params.To || params.Called || "";
  const callerNumber = params.From || params.Caller || "";
  const callSid = params.CallSid || "";

  reportWarning("[twilio/voice] inbound call", { callSid });

  // Look up which business owns this number
  const [biz] = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      active: businesses.active,
      elevenlabsAgentId: businesses.elevenlabsAgentId,
      ownerPhone: businesses.ownerPhone,
      receptionistName: businesses.receptionistName,
      paymentStatus: businesses.paymentStatus,
    })
    .from(businesses)
    .where(and(eq(businesses.twilioNumber, calledNumber), eq(businesses.active, true)))
    .limit(1);

  if (!biz) {
    reportWarning("Inbound call to unrecognized number — no active business", {
      callSid,
      timestamp: new Date().toISOString(),
    });
    return twimlSay(
      "Thank you for calling. This number is not currently active. Please try again later.",
    );
  }

  // If payment is suspended, canceled, or in grace period, don't connect
  if (biz.paymentStatus === "suspended" || biz.paymentStatus === "canceled" || biz.paymentStatus === "grace_period") {
    return twimlSay(
      `Thank you for calling ${escapeXml(biz.name)}. We're experiencing a temporary service interruption. Please try again later or contact the business directly.`,
    );
  }

  // Spam detection: block callers who call >3 times in 5 minutes
  // Skip spam check for queue retry redirects (Twilio signature covers the full URL, so this can't be spoofed)
  const isQueueRetry = parsedUrl.searchParams.get("queue_retry") === "1";
  const normalizedCaller = normalizePhone(callerNumber);
  if (!isQueueRetry && normalizedCaller && normalizePhone(biz.ownerPhone) !== normalizedCaller) {
    const spamCheck = await rateLimit(`spam:${biz.id}:${normalizedCaller}`, {
      limit: 3,
      windowSeconds: 300,
    });
    if (!spamCheck.success) {
      reportWarning("Spam call blocked — rapid repeat caller", {
        callSid,
        businessId: biz.id,
        timestamp: new Date().toISOString(),
      });
      return twimlSay("We're sorry, please try again later.");
    }
  }

  // Check if this is the business owner calling — route to owner voice mode
  const isOwner = normalizePhone(callerNumber) === normalizePhone(biz.ownerPhone);
  if (isOwner) {
    const receptionistName = biz.receptionistName || "Maria";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";

    // Look up business language preference for owner voice mode
    let ownerLang: "en" | "es" = "en";
    try {
      const { businesses: bizTable } = await import("@/db/schema");
      const [bizRecord] = await db
        .select({ defaultLanguage: bizTable.defaultLanguage })
        .from(bizTable)
        .where(eq(bizTable.id, biz.id))
        .limit(1);
      if (bizRecord?.defaultLanguage === "es") ownerLang = "es";
    } catch {
      // Non-fatal — default to English
    }

    const twimlLang = ownerLang === "es" ? "es-MX" : "en-US";
    const voice = ownerLang === "es" ? "Polly.Mia" : "Polly.Joanna";
    const greeting = ownerLang === "es"
      ? `Hola! Soy ${escapeXml(receptionistName)}, tu asistente de oficina. En que puedo ayudarte hoy?`
      : `Hi! This is ${escapeXml(receptionistName)}, your office manager. What can I help you with?`;
    const goodbye = ownerLang === "es"
      ? "No entendi. Hasta luego!"
      : "I didn't catch that. Goodbye!";

    // Use Gather with speech input to collect owner's spoken request, then process via Maria
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${twimlLang}" voice="${voice}">${greeting}</Say>
  <Gather input="speech" speechTimeout="auto" action="${escapeXml(appUrl)}/api/webhooks/twilio/voice-owner?businessId=${escapeXml(biz.id)}" method="POST" language="${twimlLang}">
  </Gather>
  <Say language="${twimlLang}" voice="${voice}">${goodbye}</Say>
  <Hangup/>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Get ElevenLabs agent ID
  const agentId = biz.elevenlabsAgentId;
  const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;

  if (!agentId || !elevenlabsApiKey) {
    reportError("ElevenLabs not configured for inbound call", null, {
      extra: { businessId: biz.id, callSid },
    });
    return twimlSay(
      "Thank you for calling. We are unable to take your call right now. Please leave a message after the tone.",
      true,
    );
  }

  // Create call record in DB before connecting (ElevenLabs has no "call started" webhook)
  // Find or create lead
  let leadId: string | undefined;
  const normalizedCallerForLead = callerNumber?.replace(/\D/g, "");
  if (callerNumber && normalizedCallerForLead && normalizedCallerForLead.length >= 10) {
    const { findOrCreateLead } = await import("@/lib/ai/context-builder");
    const lead = await findOrCreateLead(biz.id, callerNumber);
    leadId = lead.id;
  }

  // Guard against duplicate call records on Twilio retry
  const [existingCall] = await db
    .select({ id: calls.id })
    .from(calls)
    .where(eq(calls.twilioCallSid, callSid))
    .limit(1);

  let callRecord: { id: string };
  if (existingCall) {
    callRecord = existingCall;
  } else {
    // Insert call record FIRST so concurrent count is accurate (prevents race condition
    // where two simultaneous calls both see count=2 and both proceed)
    const [created] = await db.insert(calls).values({
      businessId: biz.id,
      leadId: leadId || null,
      direction: "inbound",
      callerPhone: callerNumber,
      calledPhone: calledNumber,
      status: "in_progress",
      twilioCallSid: callSid,
      elevenlabsConversationId: undefined,
    }).returning({ id: calls.id });
    callRecord = created;
  }

  // Concurrent call queuing: count AFTER inserting this call to prevent race condition
  const [activeCallCount] = await db
    .select({ count: count() })
    .from(calls)
    .where(
      and(
        eq(calls.businessId, biz.id),
        eq(calls.status, "in_progress"),
      ),
    );
  if (activeCallCount && activeCallCount.count > 3) {
    // Over limit. Retry up to QUEUE_RETRY_MAX times, then fall back to a
    // voicemail-style message so callers aren't stuck in an infinite redirect
    // loop when all slots stay occupied.
    const QUEUE_RETRY_MAX = 3;
    const queueRetryParam = params.queue_retry || parsedUrl.searchParams.get("queue_retry") || "0";
    const queueRetry = Math.max(0, parseInt(String(queueRetryParam), 10) || 0);

    const receptionistName = biz.receptionistName || "Maria";
    const queueAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";

    if (queueRetry >= QUEUE_RETRY_MAX) {
      reportWarning("Call hit queue retry ceiling — routing to voicemail-style message", {
        businessId: biz.id,
        callSid,
        retries: queueRetry,
      });
      const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="en-US" voice="Polly.Joanna">Thank you for calling ${escapeXml(biz.name)}. All of our lines are still busy. Please send us a text at this number and ${escapeXml(receptionistName)} will get right back to you.</Say>
</Response>`;
      return new Response(fallbackTwiml, {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    const queueTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="en-US" voice="Polly.Joanna">Thank you for calling ${escapeXml(biz.name)}. This is ${escapeXml(receptionistName)}. All of our lines are currently busy. Please hold and I'll be with you shortly.</Say>
  <Pause length="20"/>
  <Redirect method="POST">${escapeXml(queueAppUrl)}/api/webhooks/twilio/voice?queue_retry=${queueRetry + 1}</Redirect>
</Response>`;
    return new Response(queueTwiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Build repeat caller context for personalized greeting
  let callerContext: string | null = null;
  if (callerNumber) {
    try {
      const { buildCallerContext } = await import("@/lib/voice/caller-context");
      callerContext = await buildCallerContext(biz.id, callerNumber);
    } catch (err) {
      // Non-fatal — proceed without caller context
      reportWarning("Failed to build caller context", {
        businessId: biz.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Track active call for live monitoring (fire-and-forget)
  trackCallStart({
    businessId: biz.id,
    callerPhone: callerNumber || "unknown",
    direction: "inbound",
    sessionId: callSid,
  }).catch((err) => reportError("Active call tracking failed", err, { businessId: biz.id }));

  // Connect to ElevenLabs via Twilio-native WebSocket endpoint.
  // This endpoint translates between Twilio Media Stream protocol and
  // ElevenLabs Convai protocol — agent_id passed as a Stream Parameter.
  const ELEVENLABS_TWILIO_WS = "wss://api.elevenlabs.io/v1/convai/twilio/inbound";

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${ELEVENLABS_TWILIO_WS}">
      <Parameter name="agent_id" value="${escapeXml(agentId)}" />
      <Parameter name="caller_phone" value="${escapeXml(callerNumber)}" />
      <Parameter name="called_phone" value="${escapeXml(calledNumber)}" />
      <Parameter name="business_id" value="${escapeXml(biz.id)}" />
      <Parameter name="call_id" value="${escapeXml(callRecord.id)}" />
      <Parameter name="caller_context" value="${escapeXml(callerContext || '')}" />
    </Stream>
  </Connect>
  <Say language="en-US" voice="Polly.Joanna">Thank you for calling. If you need further assistance, please call back.</Say>
  <Hangup/>
</Response>`;

  return new Response(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

/**
 * Return TwiML that speaks a message and hangs up.
 * Optionally records a voicemail after speaking.
 */
function twimlSay(message: string, recordVoicemail = false): Response {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";
  const voicemailTwiml = recordVoicemail
    ? `<Record maxLength="120" playBeep="true" timeout="5" transcribe="true" transcribeCallback="${escapeXml(appUrl)}/api/webhooks/twilio/transcription" recordingStatusCallback="${escapeXml(appUrl)}/api/webhooks/twilio/recording" recordingStatusCallbackMethod="POST" />`
    : "";

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="en-US" voice="Polly.Joanna">${escapeXml(message)}</Say>
  ${voicemailTwiml}
  <Hangup/>
</Response>`;

  return new Response(twiml, {
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
