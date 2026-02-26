import { getTwilioClient } from "@/lib/twilio/client";
import { env } from "@/lib/env";
import { db } from "@/db";
import { prospectOutreach, prospects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

const MARKETING_URL = env.NEXT_PUBLIC_MARKETING_URL ?? "https://calltide.app";

const smsTemplates: Record<string, (businessName: string) => string> = {
  missed_sms_1: (name) =>
    `Hi ${name}! We just tried calling and couldn't get through. Calltide is an AI receptionist that makes sure you never miss a call again — 24/7, bilingual. Interested? Reply YES for a quick demo. Reply STOP to opt out.`,
  missed_sms_2: (name) =>
    `Hey ${name}, just following up. Missing calls = missing revenue. Our AI answers, books appointments & takes messages for you. 10-min demo? Reply YES or visit ${MARKETING_URL}. Reply STOP to opt out.`,
};

export function getSmsTemplate(
  key: string,
  businessName: string,
): string | null {
  const factory = smsTemplates[key];
  return factory ? factory(businessName) : null;
}

export async function sendProspectSms(params: {
  prospectId: string;
  to: string;
  templateKey: string;
  body: string;
}): Promise<{ success: boolean; error?: string }> {
  // Check opt-out
  const [prospect] = await db
    .select()
    .from(prospects)
    .where(eq(prospects.id, params.prospectId));

  if (!prospect) return { success: false, error: "Prospect not found" };
  if (prospect.smsOptOut) return { success: false, error: "Prospect opted out of SMS" };

  try {
    const client = getTwilioClient();
    const message = await client.messages.create({
      to: params.to,
      from: env.TWILIO_PHONE_NUMBER,
      body: params.body,
    });

    await db.insert(prospectOutreach).values({
      prospectId: params.prospectId,
      channel: "sms",
      templateKey: params.templateKey,
      status: "sent",
      externalId: message.sid,
      sentAt: new Date().toISOString(),
    });

    await logActivity({
      type: "sms_sent",
      entityType: "prospect",
      entityId: params.prospectId,
      title: `SMS sent: ${params.templateKey}`,
      detail: `To: ${params.to}`,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "SMS send failed",
    };
  }
}

const PROSPECT_OPT_OUT_KEYWORDS = ["stop", "unsubscribe", "cancel", "quit", "end", "optout", "opt out"];
const PROSPECT_OPT_IN_KEYWORDS = ["start", "unstop", "subscribe", "opt in", "optin"];

/**
 * Handle SMS opt-out for prospects (outreach targets).
 * Returns true if the message was an opt-out/opt-in keyword.
 */
export async function handleProspectSmsKeyword(
  fromNumber: string,
  body: string,
): Promise<{ handled: boolean; action?: "opt_out" | "opt_in" }> {
  const normalized = body.trim().toLowerCase();

  const isOptOut = PROSPECT_OPT_OUT_KEYWORDS.some((kw) => normalized === kw);
  const isOptIn = PROSPECT_OPT_IN_KEYWORDS.some((kw) => normalized === kw);

  if (!isOptOut && !isOptIn) return { handled: false };

  const matchingProspects = await db
    .select()
    .from(prospects)
    .where(eq(prospects.phone, fromNumber));

  for (const prospect of matchingProspects) {
    await db
      .update(prospects)
      .set({
        smsOptOut: isOptOut,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(prospects.id, prospect.id));

    await logActivity({
      type: isOptOut ? "sms_opt_out" : "sms_opt_in",
      entityType: "prospect",
      entityId: prospect.id,
      title: `SMS ${isOptOut ? "opt-out" : "opt-in"}: ${prospect.businessName}`,
      detail: `Phone: ${fromNumber}`,
    });
  }

  return { handled: true, action: isOptOut ? "opt_out" : "opt_in" };
}
