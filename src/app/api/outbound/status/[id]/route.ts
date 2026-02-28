import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { handleOutboundStatusCallback } from "@/lib/outbound/engine";
import { reportWarning } from "@/lib/error-reporting";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: outboundCallId } = await params;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!authToken) {
    reportWarning("TWILIO_AUTH_TOKEN not set — rejecting outbound status callback");
    return NextResponse.json({ error: "Webhook auth not configured" }, { status: 500 });
  }

  const formData = await req.formData();
  const formParams: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    formParams[key] = String(value);
  }

  // Validate Twilio signature
  const signature = req.headers.get("x-twilio-signature") || "";
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/outbound/status/${outboundCallId}`;
  const valid = twilio.validateRequest(authToken, signature, url, formParams);
  if (!valid) {
    reportWarning("Invalid Twilio signature on outbound status callback");
    return new Response("Forbidden", { status: 403 });
  }

  const callSid = formParams.CallSid;
  const callStatus = formParams.CallStatus;

  if (!callSid || !callStatus) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await handleOutboundStatusCallback(outboundCallId, {
    CallSid: callSid,
    CallStatus: callStatus,
    CallDuration: formParams.CallDuration ?? undefined,
    AnsweredBy: formParams.AnsweredBy ?? undefined,
  });

  return NextResponse.json({ success: true });
}
