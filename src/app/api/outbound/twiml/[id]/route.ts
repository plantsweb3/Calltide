import { NextRequest } from "next/server";
import twilio from "twilio";
import { db } from "@/db";
import { outboundCalls, businesses, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { reportWarning } from "@/lib/error-reporting";
import { buildOutboundPrompt, type OutboundCallType } from "@/lib/outbound/prompts";
import { appointments, estimates } from "@/db/schema";

/**
 * TwiML endpoint for outbound calls.
 * When Twilio connects the outbound call, this endpoint returns TwiML
 * that connects the call to ElevenLabs via <Connect><Stream>.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: outboundCallId } = await params;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!authToken) {
    reportWarning("TWILIO_AUTH_TOKEN not set — rejecting outbound TwiML request");
    return new Response("Webhook auth not configured", { status: 500 });
  }

  // Validate Twilio signature
  const signature = req.headers.get("x-twilio-signature") || "";
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/outbound/twiml/${outboundCallId}`;
  const formData = await req.formData();
  const formParams: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    formParams[key] = String(value);
  }

  const valid = twilio.validateRequest(authToken, signature, url, formParams);
  if (!valid) {
    reportWarning("Invalid Twilio signature on outbound TwiML request");
    return new Response("Forbidden", { status: 403 });
  }

  // Get outbound call details
  const [call] = await db
    .select()
    .from(outboundCalls)
    .where(eq(outboundCalls.id, outboundCallId));

  if (!call) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, an error occurred.</Say><Hangup/></Response>`,
      { headers: { "Content-Type": "text/xml" } },
    );
  }

  // Get business context
  const [biz] = await db.select().from(businesses).where(eq(businesses.id, call.businessId));
  if (!biz) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, an error occurred.</Say><Hangup/></Response>`,
      { headers: { "Content-Type": "text/xml" } },
    );
  }

  // Get customer name
  let customerName = "there";
  if (call.customerId) {
    const [cust] = await db
      .select({ name: customers.name })
      .from(customers)
      .where(eq(customers.id, call.customerId));
    if (cust?.name) customerName = cust.name;
  }

  // Build context based on call type
  const promptParams: Parameters<typeof buildOutboundPrompt>[0] = {
    biz: {
      id: biz.id,
      name: biz.name,
      type: biz.type,
      ownerName: biz.ownerName,
      ownerPhone: biz.ownerPhone,
      twilioNumber: biz.twilioNumber,
      services: (biz.services as string[]) ?? [],
      businessHours: (biz.businessHours as Record<string, { open: string; close: string }>) ?? {},
      language: (biz.defaultLanguage ?? "en") as "en" | "es",
      timezone: biz.timezone,
      greeting: biz.greeting ?? undefined,
      greetingEs: biz.greetingEs ?? undefined,
      serviceArea: biz.serviceArea ?? undefined,
      additionalInfo: biz.additionalInfo ?? undefined,
      personalityNotes: biz.personalityNotes ?? undefined,
    },
    callType: call.callType as OutboundCallType,
    customerName,
    language: call.language ?? "en",
  };

  // Enrich with reference data
  if (call.callType === "appointment_reminder" && call.referenceId) {
    const [appt] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, call.referenceId));
    if (appt) {
      promptParams.appointmentDate = appt.date;
      promptParams.appointmentTime = appt.time;
      promptParams.appointmentService = appt.service;
    }
  } else if (call.callType === "estimate_followup" && call.referenceId) {
    const [est] = await db
      .select()
      .from(estimates)
      .where(eq(estimates.id, call.referenceId));
    if (est) {
      promptParams.estimateService = est.service ?? undefined;
      promptParams.estimateAmount = est.amount ?? undefined;
    }
  }

  // Build the outbound system prompt for context
  const systemPrompt = buildOutboundPrompt(promptParams);

  // Use ElevenLabs for voice AI
  const agentId = biz.elevenlabsAgentId;
  const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;

  if (!agentId || !elevenlabsApiKey) {
    // Fallback: simple TwiML greeting without AI
    const lang = call.language === "es" ? "es-MX" : "en-US";
    const greeting =
      call.language === "es"
        ? `Hola ${customerName}, le llamamos de ${biz.name}. ${biz.ownerName} se comunicará con usted pronto. Gracias.`
        : `Hi ${customerName}, we're calling from ${biz.name}. ${biz.ownerName} will reach out to you shortly. Thank you.`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${lang}" voice="Polly.Joanna">${escapeXml(greeting)}</Say>
  <Pause length="1"/>
  <Hangup/>
</Response>`;

    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  }

  // Connect to ElevenLabs via WebSocket stream
  const elevenLabsWsUrl = `wss://api.elevenlabs.io/v1/convai/twilio/inbound?agent_id=${agentId}`;

  // Pass outbound context as custom parameters in the stream
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${escapeXml(elevenLabsWsUrl)}">
      <Parameter name="xi-api-key" value="${escapeXml(elevenlabsApiKey)}" />
      <Parameter name="outbound_call_id" value="${escapeXml(outboundCallId)}" />
      <Parameter name="business_id" value="${escapeXml(call.businessId)}" />
      <Parameter name="call_type" value="${escapeXml(call.callType)}" />
      <Parameter name="customer_name" value="${escapeXml(customerName)}" />
      <Parameter name="language" value="${escapeXml(call.language ?? "en")}" />
    </Stream>
  </Connect>
</Response>`;

  return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
