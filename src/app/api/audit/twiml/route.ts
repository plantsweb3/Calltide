import { NextRequest } from "next/server";
import twilio from "twilio";
import { reportWarning } from "@/lib/error-reporting";

export async function POST(req: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    reportWarning("TWILIO_AUTH_TOKEN is not set — rejecting audit TwiML request");
    return new Response("Webhook auth not configured", { status: 500 });
  }

  // Validate Twilio signature
  const signature = req.headers.get("x-twilio-signature") || "";
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/audit/twiml`;

  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = String(value);
  }

  const valid = twilio.validateRequest(authToken, signature, url, params);
  if (!valid) {
    reportWarning("Invalid Twilio signature on audit TwiML request");
    return new Response("Forbidden", { status: 403 });
  }

  // 3-second pause then hangup — just enough to detect if a human answers
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="3"/>
  <Hangup/>
</Response>`;

  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
