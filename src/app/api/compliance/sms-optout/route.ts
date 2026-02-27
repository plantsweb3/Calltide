import { NextRequest } from "next/server";
import { db } from "@/db";
import { smsOptOuts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revokeConsent } from "@/lib/compliance/consent";
import { normalizePhone } from "@/lib/compliance/sms";

/**
 * POST /api/compliance/sms-optout
 * Twilio webhook — handles STOP/START keywords
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const from = formData.get("From") as string;
  const body = ((formData.get("Body") as string) ?? "").toUpperCase().trim();

  if (!from) {
    return new Response("<Response></Response>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const normalized = normalizePhone(from);

  const stopKeywords = ["STOP", "QUIT", "END", "REVOKE", "OPT OUT", "CANCEL", "UNSUBSCRIBE"];
  const startKeywords = ["START", "YES", "UNSTOP"];

  if (stopKeywords.includes(body)) {
    // Upsert opt-out
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

    // Revoke active SMS consents
    await revokeConsent({ phoneNumber: normalized, consentType: "sms_client", method: "sms_stop" });
    await revokeConsent({ phoneNumber: normalized, consentType: "sms_caller", method: "sms_stop" });

    return new Response(
      `<Response><Message>You've been unsubscribed from Calltide messages. Reply START to resubscribe.</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } },
    );
  }

  if (startKeywords.includes(body)) {
    await db
      .update(smsOptOuts)
      .set({ reoptedInAt: new Date().toISOString() })
      .where(eq(smsOptOuts.phoneNumber, normalized));

    return new Response(
      `<Response><Message>You've been resubscribed to Calltide messages. Reply STOP to unsubscribe.</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } },
    );
  }

  return new Response("<Response></Response>", {
    headers: { "Content-Type": "text/xml" },
  });
}
