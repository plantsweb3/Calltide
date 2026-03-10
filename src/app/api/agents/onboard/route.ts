import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, calls, appointments, outreachLog } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { executeTool, logAgentActivity } from "@/lib/agents";
import { canContactToday, logOutreach } from "@/lib/outreach";
import { createHandoff } from "@/lib/agents/handoffs";

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

// ── Nudge Decision Logic ──

interface NudgeDecision {
  action: "email" | "sms" | "escalate" | "none";
  template: string;
  subject?: string;
  body?: string;
  smsBody?: string;
}

function decideNudge(params: {
  daysSinceSignup: number;
  onboardingStep: number;
  skippedSteps: number[];
  hasFirstCall: boolean;
  hasFirstAppointment: boolean;
  hasHumeConfig: boolean;
  hasBusinessHours: boolean;
  ownerName: string;
  bizName: string;
}): NudgeDecision {
  const { daysSinceSignup, onboardingStep, skippedSteps, hasFirstCall, ownerName, bizName } = params;

  // Day 14+, inactive → escalate to owner
  if (daysSinceSignup >= 14 && !hasFirstCall) {
    return { action: "escalate", template: "stalled_onboarding" };
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
 * Schedule: hourly (0 * * * *)
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    const onboardingStep = client.onboardingStep ?? 1;
    const skippedSteps = (client.onboardingSkippedSteps as number[]) ?? [];

    const nudge = decideNudge({
      daysSinceSignup,
      onboardingStep,
      skippedSteps,
      hasFirstCall: milestones.hasFirstCall,
      hasFirstAppointment: milestones.hasFirstAppointment,
      hasHumeConfig: milestones.hasHumeConfig,
      hasBusinessHours: milestones.hasBusinessHours,
      ownerName: client.ownerName,
      bizName: client.name,
    });

    if (nudge.action === "none") continue;

    const actionsTaken: string[] = [];

    if (nudge.action === "email" && client.ownerEmail) {
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
      actionType: nudge.action === "escalate" ? "escalated" : nudge.action === "email" ? "email_sent" : "sms_sent",
      targetId: client.id,
      targetType: "client",
      inputSummary: `Onboard check: ${client.name} (${daysSinceSignup}d, step ${onboardingStep})`,
      outputSummary: `Nudge: ${nudge.template}. ${actionsTaken.map((a) => a.split(":")[0]).join(", ")}`,
      toolsCalled: actionsTaken.map((a) => a.split(":")[0]),
      escalated: nudge.action === "escalate",
      resolvedWithoutEscalation: nudge.action !== "escalate" && actionsTaken.length > 0,
    });

    // Log outreach to prevent same-day duplicate contacts
    await logOutreach(client.id, "nudge_agent", "email");

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
  client: { id: string; humeConfigId?: string | null; businessHours?: unknown },
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

  const hasHumeConfig = !!client.humeConfigId;
  const hasBusinessHours =
    !!client.businessHours &&
    typeof client.businessHours === "object" &&
    Object.keys(client.businessHours as Record<string, unknown>).length > 0;

  return {
    hasHumeConfig,
    hasBusinessHours,
    hasFirstCall: callCount > 0,
    hasFirstAppointment: aptCount > 0,
    totalCalls: callCount,
    allComplete: hasHumeConfig && hasBusinessHours && callCount > 0 && aptCount > 0,
  };
}
