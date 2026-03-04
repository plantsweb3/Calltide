import { NextRequest } from "next/server";
import twilio from "twilio";
import { db } from "@/db";
import { smsOptOuts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revokeConsent } from "@/lib/compliance/consent";
import { normalizePhone } from "@/lib/compliance/sms";
import { reportWarning } from "@/lib/error-reporting";

const STOP_KEYWORDS = ["STOP", "QUIT", "END", "REVOKE", "OPT OUT", "CANCEL", "UNSUBSCRIBE"];
const START_KEYWORDS = ["START", "YES", "UNSTOP"];

/**
 * POST /api/compliance/sms-optout
 * Twilio webhook — handles STOP/START keywords
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    params[key] = String(value);
  }

  // Verify Twilio signature
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (authToken) {
    const signature = req.headers.get("x-twilio-signature") || "";
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/compliance/sms-optout`;
    if (!twilio.validateRequest(authToken, signature, url, params)) {
      reportWarning("Invalid Twilio signature on sms-optout webhook");
      return new Response("Forbidden", { status: 403 });
    }
  }

  const from = params.From || "";
  const body = (params.Body ?? "").toUpperCase().trim();

  if (!from) {
    return twiml("");
  }

  const normalized = normalizePhone(from);

  if (STOP_KEYWORDS.includes(body)) {
    await db
      .insert(smsOptOuts)
      .values({
        phoneNumber: normalized,
        optedOutAt: new Date().toISOString(),
        optedOutMethod: "sms_stop",
      })
      .onConflictDoUpdate({
        target: smsOptOuts.phoneNumber,
        set: {
          optedOutAt: new Date().toISOString(),
          optedOutMethod: "sms_stop",
          reoptedInAt: null,
        },
      });

    await revokeConsent({ phoneNumber: normalized, consentType: "sms_client", method: "sms_stop" });
    await revokeConsent({ phoneNumber: normalized, consentType: "sms_caller", method: "sms_stop" });

    return twiml("You've been unsubscribed from Calltide messages. Reply START to resubscribe.");
  }

  if (START_KEYWORDS.includes(body)) {
    await db
      .update(smsOptOuts)
      .set({ reoptedInAt: new Date().toISOString() })
      .where(eq(smsOptOuts.phoneNumber, normalized));

    return twiml("You've been resubscribed to Calltide messages. Reply STOP to unsubscribe.");
  }

  return twiml("");
}

function twiml(message: string): Response {
  const body = message
    ? `<Response><Message>${message}</Message></Response>`
    : `<Response></Response>`;
  return new Response(body, { headers: { "Content-Type": "text/xml" } });
}
