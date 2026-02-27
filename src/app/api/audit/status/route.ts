import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { handleAuditStatusCallback } from "@/lib/outreach/audit";
import { reportWarning } from "@/lib/error-reporting";

export async function POST(req: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    reportWarning("TWILIO_AUTH_TOKEN is not set — rejecting audit status callback");
    return NextResponse.json({ error: "Webhook auth not configured" }, { status: 500 });
  }

  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = String(value);
  }

  // Validate Twilio signature
  const signature = req.headers.get("x-twilio-signature") || "";
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/audit/status`;
  const valid = twilio.validateRequest(authToken, signature, url, params);
  if (!valid) {
    reportWarning("Invalid Twilio signature on audit status callback");
    return new Response("Forbidden", { status: 403 });
  }

  const callSid = params.CallSid;
  const callStatus = params.CallStatus;

  if (!callSid || !callStatus) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await handleAuditStatusCallback({
    CallSid: callSid,
    CallStatus: callStatus,
    CallDuration: params.CallDuration ?? undefined,
    AnsweredBy: params.AnsweredBy ?? undefined,
  });

  return NextResponse.json({ success: true });
}
