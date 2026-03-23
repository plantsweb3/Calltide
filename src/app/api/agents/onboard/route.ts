import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, calls, appointments, outreachLog } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { executeTool, logAgentActivity } from "@/lib/agents";
import { canContactToday, logOutreach } from "@/lib/outreach";
import { createHandoff } from "@/lib/agents/handoffs";
import { verifyCronAuth } from "@/lib/cron-auth";
import { sendSMS } from "@/lib/twilio/sms";
import { reportError } from "@/lib/error-reporting";

// ── Nudge Templates (EN) ──

const TEMPLATES = {
  welcome: {
    subject: (name: string) => `Welcome to Capta, ${name}!`,
    body: (ownerName: string) => `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
      <p>Hi ${ownerName},</p>
      <p>Welcome to Capta! We're excited to have you on board.</p>
      <p>To get the most out of your AI receptionist, here are the next steps to finish your setup:</p>
      <ol>
        <li>Set your business hours so your receptionist knows when to answer</li>
        <li>Add your services so callers get accurate information</li>
        <li>Test your receptionist with a quick call</li>
      </ol>
      <p>If you need any help, just reply to this email — we're here for you.</p>
      <p>Best,<br/>The Capta Team</p>
    </div>`,
  },
  testCall: {
    sms: (name: string) =>
      `Hi ${name}! Your Capta receptionist is ready. Give it a test call to hear it in action — just call your business number. Reply HELP if you need assistance.`,
  },
  needHelp: {
    subject: (bizName: string) => `Need help getting started with ${bizName}?`,
    body: (ownerName: string) => `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
      <p>Hi ${ownerName},</p>
      <p>We noticed you haven't received any calls through Capta yet. We want to make sure everything is set up correctly.</p>
      <p>Here are a few things to check:</p>
      <ul>
        <li>Is call forwarding set up on your business line?</li>
        <li>Have you tested your receptionist with a call?</li>
        <li>Do your business hours look correct in the dashboard?</li>
      </ul>
      <p>If you'd like a hand with any of this, just reply and we'll help you get started.</p>
      <p>Best,<br/>The Capta Team</p>
    </div>`,
  },
  skippedTestCall: {
    sms: (name: string) =>
      `Hi ${name}! You're almost set up on Capta. Try calling your business number to hear your AI receptionist in action — it takes less than a minute! Reply HELP for assistance.`,
  },
} as const;

// ── Maria Onboarding SMS Templates ──
// Sent from the business's Capta number in Maria's voice

function mariaForwardingCheck(firstName: string, receptionistName: string): string {
  return `Hey ${firstName}, it's ${receptionistName}! Have you set up call forwarding yet? Text me your carrier name (AT&T, Verizon, T-Mobile, etc.) and I'll send you the exact steps.`;
}

function mariaForwardingReminder(firstName: string, twilioNumber: string, receptionistName: string): string {
  return `Hi ${firstName}! Once you forward your calls to ${twilioNumber}, I'll start answering 24/7 in English and Spanish. Need help setting it up? Just text me! — ${receptionistName}`;
}

function mariaFinalNudge(firstName: string, receptionistName: string): string {
  return `${firstName}, I'm all set and ready to go! Just need you to forward your calls so I can start answering. Want me to walk you through it? — ${receptionistName}`;
}

// ── Nudge Decision Logic ──

interface NudgeDecision {
  action: "email" | "sms" | "maria_sms" | "escalate" | "none";
  template: string;
  subject?: string;
  body?: string;
  smsBody?: string;
  /** Maria SMS requires sending from the Capta number, not the generic executeTool */
  mariaSms?: boolean;
}

function decideNudge(params: {
  daysSinceSignup: number;
  hoursSinceSignup: number;
  onboardingStep: number;
  skippedSteps: number[];
  hasFirstCall: boolean;
  hasFirstAppointment: boolean;
  hasVoiceAgent: boolean;
  hasBusinessHours: boolean;
  ownerName: string;
  bizName: string;
  receptionistName: string;
  twilioNumber: string;
  active: boolean;
}): NudgeDecision {
  const {
    daysSinceSignup, hoursSinceSignup, onboardingStep, skippedSteps,
    hasFirstCall, ownerName, bizName, receptionistName, twilioNumber, active,
  } = params;
  const firstName = ownerName.split(" ")[0] || ownerName;

  // Day 14+, inactive → escalate to owner
  if (daysSinceSignup >= 14 && !hasFirstCall) {
    return { action: "escalate", template: "stalled_onboarding" };
  }

  // ── Maria onboarding follow-ups (sent from Capta number) ──
  // Only for businesses that have a Twilio number but aren't active yet (no forwarding)
  if (twilioNumber && !active && onboardingStep >= 7) {
    // ~2 hours after signup: forwarding check
    if (hoursSinceSignup >= 2 && hoursSinceSignup < 10) {
      return {
        action: "maria_sms",
        template: "maria_forwarding_check",
        smsBody: mariaForwardingCheck(firstName, receptionistName),
        mariaSms: true,
      };
    }

    // ~12 hours: reminder with number
    if (hoursSinceSignup >= 10 && hoursSinceSignup < 24) {
      return {
        action: "maria_sms",
        template: "maria_forwarding_reminder",
        smsBody: mariaForwardingReminder(firstName, twilioNumber, receptionistName),
        mariaSms: true,
      };
    }

    // Day 2: final nudge
    if (daysSinceSignup >= 2 && daysSinceSignup < 3) {
      return {
        action: "maria_sms",
        template: "maria_final_nudge",
        smsBody: mariaFinalNudge(firstName, receptionistName),
        mariaSms: true,
      };
    }
  }

  // Skipped test call (step 7) and no calls yet → specific nudge
  if (skippedSteps.includes(7) && !hasFirstCall) {
    return {
      action: "sms",
      template: "skipped_test_call",
      smsBody: TEMPLATES.skippedTestCall.sms(ownerName),
    };
  }

  // Day 1-2, early setup → welcome email
  if (daysSinceSignup <= 2 && onboardingStep < 4) {
    return {
      action: "email",
      template: "welcome",
      subject: TEMPLATES.welcome.subject(bizName),
      body: TEMPLATES.welcome.body(ownerName),
    };
  }

  // Day 3-7, no first call → test call SMS
  if (daysSinceSignup >= 3 && daysSinceSignup <= 7 && !hasFirstCall) {
    return {
      action: "sms",
      template: "test_call",
      smsBody: TEMPLATES.testCall.sms(ownerName),
    };
  }

  // Day 7-14, no appointment → need help email
  if (daysSinceSignup >= 7 && daysSinceSignup < 14 && !hasFirstCall) {
    return {
      action: "email",
      template: "need_help",
      subject: TEMPLATES.needHelp.subject(bizName),
      body: TEMPLATES.needHelp.body(ownerName),
    };
  }

  return { action: "none", template: "none" };
}

// ── Route ──

/**
 * GET /api/agents/onboard
 *
 * Cron-triggered onboarding nudge scan.
 * Checks new clients (last 30 days) for onboarding progress.
 * Schedule: every 3 hours (0 *\/3 * * *)
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  // Get clients created in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString();

  const newClients = await db
    .select()
    .from(businesses)
    .where(
      and(
        sql`${businesses.createdAt} >= ${cutoff}`,
        sql`${businesses.onboardingCompletedAt} IS NULL`,
      ),
    );

  const results = [];

  for (const client of newClients) {
    const milestones = await checkOnboardingMilestones(client);

    // Skip clients who have completed all milestones
    if (milestones.allComplete) continue;

    // Outreach conflict prevention — skip if already contacted today
    if (!(await canContactToday(client.id))) continue;

    const msSinceSignup = Date.now() - new Date(client.createdAt).getTime();
    const daysSinceSignup = Math.floor(msSinceSignup / (1000 * 60 * 60 * 24));
    const hoursSinceSignup = Math.floor(msSinceSignup / (1000 * 60 * 60));

    const onboardingStep = client.onboardingStep ?? 1;
    const skippedSteps = (client.onboardingSkippedSteps as number[]) ?? [];

    const nudge = decideNudge({
      daysSinceSignup,
      hoursSinceSignup,
      onboardingStep,
      skippedSteps,
      hasFirstCall: milestones.hasFirstCall,
      hasFirstAppointment: milestones.hasFirstAppointment,
      hasVoiceAgent: milestones.hasVoiceAgent,
      hasBusinessHours: milestones.hasBusinessHours,
      ownerName: client.ownerName,
      bizName: client.name,
      receptionistName: client.receptionistName || "Maria",
      twilioNumber: client.twilioNumber || "",
      active: client.active,
    });

    if (nudge.action === "none") {
      // Secondary: profile completeness checks during first 7 days for active businesses
      if (client.active && daysSinceSignup <= 7 && client.twilioNumber && client.ownerPhone) {
        const profileGap = checkProfileGaps(client);
        if (profileGap) {
          try {
            await sendSMS({
              to: client.ownerPhone,
              from: client.twilioNumber,
              body: profileGap,
              businessId: client.id,
              templateType: "owner_notify",
            });
            await logOutreach(client.id, "nudge_agent", "sms");
            results.push({
              businessId: client.id,
              name: client.name,
              daysSinceSignup,
              nudge: "profile_completeness",
              actionsTaken: ["maria_sms"],
            });
          } catch (err) {
            reportError("[onboard] Profile gap SMS failed", err, { extra: { businessId: client.id } });
          }
        }
      }
      continue;
    }

    const actionsTaken: string[] = [];

    if (nudge.action === "maria_sms" && client.ownerPhone && client.twilioNumber && nudge.smsBody) {
      // Send directly from the Capta number in Maria's voice
      try {
        await sendSMS({
          to: client.ownerPhone,
          from: client.twilioNumber,
          body: nudge.smsBody,
          businessId: client.id,
          templateType: "owner_notify",
        });
        actionsTaken.push("maria_sms: sent");
      } catch (err) {
        reportError("[onboard] Maria SMS failed", err, { extra: { businessId: client.id } });
        actionsTaken.push("maria_sms: failed");
      }
    } else if (nudge.action === "email" && client.ownerEmail) {
      const emailResult = await executeTool(
        "send_email",
        { to: client.ownerEmail, subject: nudge.subject, body: nudge.body },
        "onboard",
      );
      actionsTaken.push(`send_email: ${emailResult}`);
    } else if (nudge.action === "sms" && client.ownerPhone) {
      const smsResult = await executeTool(
        "send_sms",
        { to: client.ownerPhone, body: nudge.smsBody },
        "onboard",
      );
      actionsTaken.push(`send_sms: ${smsResult}`);
    } else if (nudge.action === "escalate") {
      const escalateResult = await executeTool(
        "escalate_to_owner",
        {
          reason: `Stalled onboarding for ${client.name} — ${daysSinceSignup} days, no first call`,
          urgency: daysSinceSignup > 21 ? "high" : "medium",
          context: `Step: ${onboardingStep}/8. Skipped: ${skippedSteps.join(",") || "none"}. Calls: ${milestones.totalCalls}.`,
        },
        "onboard",
      );
      actionsTaken.push(`escalate_to_owner: ${escalateResult}`);
    }

    // Log agent activity
    await logAgentActivity({
      agentName: "onboard",
      actionType: nudge.action === "escalate" ? "escalated" : nudge.action === "maria_sms" ? "sms_sent" : nudge.action === "email" ? "email_sent" : "sms_sent",
      targetId: client.id,
      targetType: "client",
      inputSummary: `Onboard check: ${client.name} (${daysSinceSignup}d/${hoursSinceSignup}h, step ${onboardingStep})`,
      outputSummary: `Nudge: ${nudge.template}. ${actionsTaken.map((a) => a.split(":")[0]).join(", ")}`,
      toolsCalled: actionsTaken.map((a) => a.split(":")[0]),
      escalated: nudge.action === "escalate",
      resolvedWithoutEscalation: nudge.action !== "escalate" && actionsTaken.length > 0,
    });

    // Log outreach to prevent same-day duplicate contacts
    await logOutreach(client.id, "nudge_agent", nudge.action === "maria_sms" ? "sms" : "email");

    // Check total nudge attempts — if 3+ and still not onboarded, hand off to churn agent
    const [nudgeCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(outreachLog)
      .where(
        and(
          eq(outreachLog.businessId, client.id),
          eq(outreachLog.source, "nudge_agent"),
        ),
      );

    if ((nudgeCount?.count ?? 0) >= 3 && !milestones.hasFirstCall) {
      await createHandoff({
        fromAgent: "onboard",
        toAgent: "churn",
        businessId: client.id,
        reason: "Stalled onboarding after 3+ nudge attempts — no first call received",
        context: {
          daysSinceSignup,
          onboardingStep: client.onboardingStep,
          nudgeAttempts: nudgeCount?.count ?? 0,
          milestones,
        },
        priority: daysSinceSignup > 14 ? "high" : "normal",
        ttlHours: 72,
      });
    }

    results.push({
      businessId: client.id,
      name: client.name,
      daysSinceSignup,
      nudge: nudge.template,
      actionsTaken: actionsTaken.map((a) => a.split(":")[0]),
    });
  }

  return NextResponse.json({ processed: results.length, results });
}

// ── Milestone Checking (uses client object to avoid redundant biz fetch) ──

async function checkOnboardingMilestones(
  client: { id: string; humeConfigId?: string | null; elevenlabsAgentId?: string | null; businessHours?: unknown },
) {
  // Combine call + appointment counts into a single parallel batch
  const [callCount, aptCount] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(calls)
      .where(eq(calls.businessId, client.id))
      .then((rows) => rows[0]?.count ?? 0),
    db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(eq(appointments.businessId, client.id))
      .then((rows) => rows[0]?.count ?? 0),
  ]);

  const hasVoiceAgent = !!client.elevenlabsAgentId || !!client.humeConfigId;
  const hasBusinessHours =
    !!client.businessHours &&
    typeof client.businessHours === "object" &&
    Object.keys(client.businessHours as Record<string, unknown>).length > 0;

  return {
    hasVoiceAgent,
    hasBusinessHours,
    hasFirstCall: callCount > 0,
    hasFirstAppointment: aptCount > 0,
    totalCalls: callCount,
    allComplete: hasVoiceAgent && hasBusinessHours && callCount > 0 && aptCount > 0,
  };
}

// ── Profile Completeness Checks ──

interface ProfileClient {
  receptionistName: string | null;
  ownerName: string;
  serviceArea: string | null;
  businessHours: unknown;
  services: unknown;
  avgJobValue: number | null;
}

/**
 * Check for missing profile data and return a Maria-persona SMS asking about it.
 * Returns null if the profile is complete enough.
 */
function checkProfileGaps(client: ProfileClient): string | null {
  const firstName = client.ownerName?.split(" ")[0] || "there";
  const receptionistName = client.receptionistName || "Maria";

  // Check service area
  if (!client.serviceArea) {
    return `Hey ${firstName}! What areas do you serve? I want to make sure I tell callers the right info when they ask. Just text me back! — ${receptionistName}`;
  }

  // Check weekend hours
  if (client.businessHours && typeof client.businessHours === "object") {
    const hours = client.businessHours as Record<string, unknown>;
    if (!hours.Sat && !hours.Sun) {
      return `${firstName}, I don't have your weekend hours yet. Are you open on Saturdays? Just let me know and I'll make sure callers get the right info. — ${receptionistName}`;
    }
  }

  // Check services list
  const services = client.services as string[] | null;
  if (!services || services.length === 0) {
    return `Hey ${firstName}! What services do you offer? The more I know, the better I can help your callers. Just list them out and I'll remember! — ${receptionistName}`;
  }

  // Check pricing info (avg job value still at default)
  if (!client.avgJobValue || client.avgJobValue === 250) {
    return `${firstName}, do you want me to give callers ballpark pricing? Text me your main services with price ranges and I'll use that info on calls. — ${receptionistName}`;
  }

  return null;
}
