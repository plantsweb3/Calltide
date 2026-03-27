import { NextRequest } from "next/server";
import twilio from "twilio";
import { reportWarning } from "@/lib/error-reporting";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST /api/webhooks/twilio/status
 *
 * Twilio calls this as a statusCallback when a call's status changes
 * (e.g. during warm transfers). We acknowledge the callback so Twilio
 * doesn't retry, and log the status for debugging.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`twilio-status:${ip}`, RATE_LIMITS.webhook);
  if (!rl.success) return rateLimitResponse(rl);

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    reportWarning("TWILIO_AUTH_TOKEN not set — rejecting status webhook");
    return new Response("OK", { status: 200 });
  }

  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = String(value);
  }

  // Validate Twilio signature
  const signature = req.headers.get("x-twilio-signature") || "";
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`;
  const valid = twilio.validateRequest(authToken, signature, url, params);
  if (!valid) {
    reportWarning("Invalid Twilio signature on status webhook");
    return new Response("Forbidden", { status: 403 });
  }

  const callSid = params.CallSid || "unknown";
  const callStatus = params.CallStatus || "unknown";

  console.log(`[twilio/status] callSid=${callSid} status=${callStatus}`);

  return new Response("OK", { status: 200 });
}
