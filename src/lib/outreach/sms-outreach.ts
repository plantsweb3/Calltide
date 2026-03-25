import { getTwilioClient } from "@/lib/twilio/client";
import { env } from "@/lib/env";
import { db } from "@/db";
import { prospectOutreach, prospects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

const MARKETING_URL = env.NEXT_PUBLIC_MARKETING_URL ?? "https://captahq.com";

/** Humanize vertical name. "plumbing" → "plumbing", null → "service" */
function tradeName(vertical?: string): string {
  if (!vertical) return "service";
  return vertical.toLowerCase().replace(/_/g, " ");
}

const smsTemplates: Record<string, (businessName: string, vertical?: string) => string> = {
  // MISSED SEQUENCE — 3 SMS (days 0, 3, 7)
  missed_sms_1: (name, v) =>
    `${name} — we just called and it went to voicemail. Every missed ${tradeName(v)} call = $200-500 lost. Capta answers 24/7, books the job on the call, follows up on estimates, and speaks Spanish. Not an answering service — it actually books the work. Reply YES to learn more. STOP to opt out.`,

  missed_sms_2: (name, v) =>
    `${name} — how many ${tradeName(v)} calls go to voicemail when you're on a job? Capta catches them all, books appointments, sends reminders so customers don't no-show, and auto-requests Google reviews. Like a full office manager for less than one lost job/month. Reply YES or visit ${MARKETING_URL}. STOP to opt out.`,

  missed_sms_3: (name, v) =>
    `Last text ${name}. If missed ${tradeName(v)} calls are costing you jobs — Capta answers 24/7, books work on the call, chases open estimates, and you can text it from the job site to manage your schedule. 14-day free trial. Reply YES. STOP to opt out.`,

  // ANSWERED SEQUENCE — 1 SMS (day 3)
  answered_sms_1: (name, v) =>
    `${name} — you answered when we called, nice! But what about nights, weekends, and when you're on a job? Capta handles overflow ${tradeName(v)} calls, books the job on the call, follows up on estimates, and requests Google reviews automatically. Reply YES for a quick demo. STOP to opt out.`,
};

export function getSmsTemplate(
  key: string,
  businessName: string,
  vertical?: string,
): string | null {
  const factory = smsTemplates[key];
  return factory ? factory(businessName, vertical) : null;
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
