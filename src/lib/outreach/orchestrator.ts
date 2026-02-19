import { db } from "@/db";
import { prospects, prospectOutreach } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { sendOutreachEmail } from "./email";
import { getEmailTemplate } from "./email-templates";
import { sendProspectSms, getSmsTemplate } from "./sms-outreach";
import { logActivity } from "@/lib/activity";

/**
 * Sequence state machine — decides what to send next based on:
 * - prospect.status
 * - prospect.auditResult (answered | missed | voicemail | failed)
 * - what outreach has already been sent
 *
 * Missed call flow:  SMS1 → (wait 1d) → Email1 → (wait 2d) → Email2 → (wait 3d) → Email3
 * Answered flow:     Email1 only
 * Voicemail flow:    same as missed
 */

const MISSED_SEQUENCE = [
  { channel: "sms", key: "missed_sms_1", delayDays: 0 },
  { channel: "email", key: "missed_call_1", delayDays: 1 },
  { channel: "sms", key: "missed_sms_2", delayDays: 3 },
  { channel: "email", key: "missed_call_2", delayDays: 5 },
  { channel: "email", key: "missed_call_3", delayDays: 7 },
];

const ANSWERED_SEQUENCE = [
  { channel: "email", key: "answered_1", delayDays: 1 },
];

function getSequence(auditResult: string | null) {
  if (auditResult === "answered") return ANSWERED_SEQUENCE;
  return MISSED_SEQUENCE; // missed, voicemail, or null
}

function daysSince(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return (now - then) / (1000 * 60 * 60 * 24);
}

export async function getNextStep(prospectId: string) {
  const [prospect] = await db
    .select()
    .from(prospects)
    .where(eq(prospects.id, prospectId));

  if (!prospect) return null;

  const sequence = getSequence(prospect.auditResult);

  // Get all sent outreach for this prospect
  const sentOutreach = await db
    .select()
    .from(prospectOutreach)
    .where(eq(prospectOutreach.prospectId, prospectId))
    .orderBy(desc(prospectOutreach.sentAt));

  const sentKeys = new Set(sentOutreach.map((o) => o.templateKey));

  // Find the first step not yet sent
  for (const step of sequence) {
    if (sentKeys.has(step.key)) continue;

    // Check if enough time has passed since the last outreach
    if (sentOutreach.length > 0) {
      const lastSent = sentOutreach[0].sentAt;
      if (daysSince(lastSent) < step.delayDays) {
        return { status: "waiting", nextStep: step, prospect };
      }
    }

    return { status: "ready", nextStep: step, prospect };
  }

  return { status: "complete", prospect };
}

export async function executeNextStep(
  prospectId: string,
): Promise<{ success: boolean; action?: string; error?: string }> {
  const result = await getNextStep(prospectId);
  if (!result) return { success: false, error: "Prospect not found" };
  if (result.status === "waiting")
    return { success: false, error: "Waiting for delay period" };
  if (result.status === "complete")
    return { success: true, action: "sequence_complete" };

  const { nextStep, prospect } = result;

  if (!nextStep) return { success: false, error: "No next step" };

  if (nextStep.channel === "email") {
    if (!prospect.email) {
      return { success: false, error: "No email address" };
    }
    const template = getEmailTemplate(nextStep.key, prospect.businessName);
    if (!template) return { success: false, error: `Template not found: ${nextStep.key}` };

    const emailResult = await sendOutreachEmail({
      prospectId,
      to: prospect.email,
      subject: template.subject,
      html: template.html,
      templateKey: nextStep.key,
    });

    return emailResult.success
      ? { success: true, action: `email:${nextStep.key}` }
      : { success: false, error: emailResult.error };
  }

  if (nextStep.channel === "sms") {
    if (!prospect.phone) {
      return { success: false, error: "No phone number" };
    }
    const body = getSmsTemplate(nextStep.key, prospect.businessName);
    if (!body) return { success: false, error: `SMS template not found: ${nextStep.key}` };

    const smsResult = await sendProspectSms({
      prospectId,
      to: prospect.phone,
      templateKey: nextStep.key,
      body,
    });

    return smsResult.success
      ? { success: true, action: `sms:${nextStep.key}` }
      : { success: false, error: smsResult.error };
  }

  return { success: false, error: "Unknown channel" };
}

export async function startOutreachForProspect(prospectId: string) {
  await db
    .update(prospects)
    .set({ status: "outreach_active", updatedAt: new Date().toISOString() })
    .where(eq(prospects.id, prospectId));

  await logActivity({
    type: "outreach_started",
    entityType: "prospect",
    entityId: prospectId,
    title: "Outreach sequence started",
  });

  return executeNextStep(prospectId);
}

export async function pauseOutreachForProspect(prospectId: string) {
  await db
    .update(prospects)
    .set({ status: "outreach_paused", updatedAt: new Date().toISOString() })
    .where(eq(prospects.id, prospectId));

  await logActivity({
    type: "outreach_paused",
    entityType: "prospect",
    entityId: prospectId,
    title: "Outreach sequence paused",
  });
}
