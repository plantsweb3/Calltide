import { NextRequest } from "next/server";
import twilio from "twilio";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { reportWarning, reportError } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST /api/webhooks/twilio/voice-owner
 *
 * Handles the owner's spoken input from Twilio's <Gather input="speech">.
 * Transcribes the speech, feeds it to Maria's chat engine, and speaks the response back.
 * Loops until the owner hangs up.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`twilio-voice-owner:${ip}`, RATE_LIMITS.webhook);
  if (!rl.success) return rateLimitResponse(rl);

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    reportWarning("TWILIO_AUTH_TOKEN not set — rejecting owner voice webhook");
    return twimlSay("Configuration error. Please try again later.");
  }

  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = String(value);
  }

  // Validate Twilio signature
  const signature = req.headers.get("x-twilio-signature") || "";
  const fullUrl = new URL(req.url);
  const businessId = fullUrl.searchParams.get("businessId") || params.businessId || "";
  // Use the canonical URL Twilio used to sign — must match exactly including query params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";
  const validationUrl = `${appUrl}/api/webhooks/twilio/voice-owner?businessId=${encodeURIComponent(businessId)}`;

  const valid = twilio.validateRequest(authToken, signature, validationUrl, params);
  if (!valid) {
    reportWarning("Invalid Twilio signature on owner voice webhook", {
      url: validationUrl,
      signature: signature.slice(0, 10) + "...",
    });
    return new Response("Forbidden", { status: 403 });
  }

  if (!businessId) {
    return twimlSay("I'm sorry, I couldn't identify your business. Please try again.");
  }

  // Look up business language preference
  let bizLang: "en" | "es" = "en";
  try {
    const [biz] = await db
      .select({ defaultLanguage: businesses.defaultLanguage })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);
    if (biz?.defaultLanguage === "es") bizLang = "es";
  } catch {
    // Non-fatal — default to English
  }

  // Get the speech transcription from Twilio
  const speechResult = params.SpeechResult || "";
  const confidence = parseFloat(params.Confidence || "0");

  if (!speechResult || confidence < 0.3) {
    const retryMsg = bizLang === "es"
      ? "No entendí bien. ¿Podrías repetirlo?"
      : "I didn't quite catch that. Could you repeat that?";
    return twimlSay(retryMsg, true, businessId, bizLang);
  }

  try {
    // Process through Maria's chat engine — same engine as SMS
    const { chat: mariaChat } = await import("@/lib/maria/chat-engine");
    const result = await mariaChat(businessId, speechResult, "sms");

    if (!result.reply) {
      const fallbackMsg = bizLang === "es"
        ? "No estoy segura de cómo ayudarte con eso. ¿Hay algo más?"
        : "I'm not sure how to help with that. Is there anything else?";
      return twimlSay(fallbackMsg, true, businessId, bizLang);
    }

    // Speak the response and loop for next input
    return twimlSayAndGather(result.reply, businessId, bizLang);
  } catch (err) {
    reportError("Owner voice call — Maria chat failed", err, { extra: { businessId } });
    const errorMsg = bizLang === "es"
      ? "Tuve un problema procesando eso. ¿Hay algo más en lo que pueda ayudarte?"
      : "I ran into an issue processing that. Is there anything else I can help with?";
    return twimlSay(errorMsg, true, businessId, bizLang);
  }
}

function twimlSay(message: string, continueLoop = false, businessId?: string, lang: "en" | "es" = "en"): Response {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";
  const twimlLang = lang === "es" ? "es-MX" : "en-US";
  const voice = lang === "es" ? "Polly.Mia" : "Polly.Joanna";
  const goodbyeMsg = lang === "es" ? "No escuche nada. Hasta luego!" : "I didn't hear anything. Goodbye!";

  let twiml: string;
  if (continueLoop && businessId) {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${twimlLang}" voice="${voice}">${escapeXml(message)}</Say>
  <Gather input="speech" speechTimeout="auto" action="${escapeXml(appUrl)}/api/webhooks/twilio/voice-owner?businessId=${escapeXml(businessId)}" method="POST" language="${twimlLang}">
  </Gather>
  <Say language="${twimlLang}" voice="${voice}">${escapeXml(goodbyeMsg)}</Say>
  <Hangup/>
</Response>`;
  } else {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${twimlLang}" voice="${voice}">${escapeXml(message)}</Say>
  <Hangup/>
</Response>`;
  }

  return new Response(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

function twimlSayAndGather(message: string, businessId: string, lang: "en" | "es" = "en"): Response {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://captahq.com";
  const twimlLang = lang === "es" ? "es-MX" : "en-US";
  const voice = lang === "es" ? "Polly.Mia" : "Polly.Joanna";
  const promptMsg = lang === "es"
    ? "Hay algo mas? Si no, que tengas un buen dia!"
    : "Is there anything else? If not, have a great day!";

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${twimlLang}" voice="${voice}">${escapeXml(message)}</Say>
  <Gather input="speech" speechTimeout="auto" action="${escapeXml(appUrl)}/api/webhooks/twilio/voice-owner?businessId=${escapeXml(businessId)}" method="POST" language="${twimlLang}">
  </Gather>
  <Say language="${twimlLang}" voice="${voice}">${escapeXml(promptMsg)}</Say>
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
