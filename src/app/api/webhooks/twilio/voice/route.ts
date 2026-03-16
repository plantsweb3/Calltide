import { NextRequest } from "next/server";
import twilio from "twilio";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reportWarning, reportError } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/compliance/sms";

/**
 * POST /api/webhooks/twilio/voice
 *
 * Twilio hits this URL when an inbound call arrives on a provisioned number.
 * Returns TwiML that connects the caller to Hume EVI via <Connect><Stream>.
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
  const signature = req.headers.get("x-twilio-signature") || "";
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/voice`;

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

  console.log(`[twilio/voice] inbound call: callSid=${callSid}`);

  // Look up which business owns this number
  const [biz] = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      active: businesses.active,
      humeConfigId: businesses.humeConfigId,
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

  // If payment is suspended (grace period expired), don't connect to Hume
  if (biz.paymentStatus === "suspended" || biz.paymentStatus === "canceled") {
    return twimlSay(
      `Thank you for calling ${escapeXml(biz.name)}. We're experiencing a temporary service interruption. Please try again later or contact the business directly.`,
    );
  }

  // Check if this is the business owner calling — route to owner voice mode
  const isOwner = normalizePhone(callerNumber) === normalizePhone(biz.ownerPhone);
  if (isOwner) {
    const receptionistName = biz.receptionistName || "Maria";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";
    // Use Gather with speech input to collect owner's spoken request, then process via Maria
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="en-US" voice="Polly.Joanna">Hi! This is ${escapeXml(receptionistName)}, your office manager. What can I help you with?</Say>
  <Gather input="speech" speechTimeout="auto" action="${escapeXml(appUrl)}/api/webhooks/twilio/voice-owner?businessId=${escapeXml(biz.id)}" method="POST" language="en-US">
  </Gather>
  <Say language="en-US" voice="Polly.Joanna">I didn't catch that. Goodbye!</Say>
  <Hangup/>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Get Hume credentials
  const humeConfigId = biz.humeConfigId || process.env.HUME_CONFIG_ID;
  const humeApiKey = process.env.HUME_API_KEY;

  if (!humeConfigId || !humeApiKey) {
    reportError("Hume not configured for inbound call", null, {
      extra: { businessId: biz.id, callSid },
    });
    return twimlSay(
      "Thank you for calling. We are unable to take your call right now. Please leave a message after the tone.",
      true,
    );
  }

  // Connect to Hume EVI via WebSocket stream
  const humeWsUrl = `wss://api.hume.ai/v0/evi/twilio?config_id=${humeConfigId}&api_key=${humeApiKey}`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${escapeXml(humeWsUrl)}">
      <Parameter name="called_phone" value="${escapeXml(calledNumber)}" />
      <Parameter name="caller_phone" value="${escapeXml(callerNumber)}" />
      <Parameter name="business_id" value="${escapeXml(biz.id)}" />
      <Parameter name="direction" value="inbound" />
    </Stream>
  </Connect>
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
    ? `<Record maxLength="120" playBeep="true" timeout="5" recordingStatusCallback="${escapeXml(appUrl)}/api/webhooks/twilio/recording" recordingStatusCallbackMethod="POST" />`
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
