import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, calls, appointments, outreachLog } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { runAgent, SUPPORT_TOOLS, AGENT_PROMPTS } from "@/lib/agents";
import { canContactToday, logOutreach } from "@/lib/outreach";
import { createHandoff } from "@/lib/agents/handoffs";

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
    const milestones = await checkOnboardingMilestones(client.id);

    // Skip clients who have completed all milestones
    if (milestones.allComplete) continue;

    // Outreach conflict prevention — skip if already contacted today
    if (!(await canContactToday(client.id))) continue;

    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    const onboardingStep = client.onboardingStep ?? 1;
    const skippedSteps = (client.onboardingSkippedSteps as number[]) ?? [];

    const message = `Check onboarding progress for this new client and send appropriate nudges:

Business: ${client.name} (${client.type})
Owner: ${client.ownerName}
Email: ${client.ownerEmail ?? "none"}
Phone: ${client.ownerPhone}
Signed Up: ${client.createdAt} (${daysSinceSignup} days ago)

ONBOARDING WIZARD:
- Current step: ${onboardingStep} of 8
- Skipped steps: ${skippedSteps.length > 0 ? skippedSteps.join(", ") : "none"}

ONBOARDING MILESTONES:
- Has Hume config: ${milestones.hasHumeConfig ? "YES" : "NO"}
- Has business hours set: ${milestones.hasBusinessHours ? "YES" : "NO"}
- Has received first call: ${milestones.hasFirstCall ? "YES" : "NO"}
- Has first appointment booked: ${milestones.hasFirstAppointment ? "YES" : "NO"}
- Total calls received: ${milestones.totalCalls}

Based on how many days since signup, current wizard step, and which milestones are incomplete, decide what nudge to send (email, SMS) or whether to escalate a stalled onboarding. If they skipped the test call (step 7), specifically recommend testing their receptionist.`;

    const result = await runAgent({
      agentName: "onboard",
      systemPrompt: AGENT_PROMPTS.onboard,
      userMessage: message,
      tools: SUPPORT_TOOLS, // Onboard uses send_email, send_sms, escalate_to_owner
      targetId: client.id,
      targetType: "client",
      inputSummary: `Onboard check: ${client.name} (${daysSinceSignup}d)`,
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

    results.push({ businessId: client.id, name: client.name, daysSinceSignup, ...result });
  }

  return NextResponse.json({ processed: results.length, results });
}

async function checkOnboardingMilestones(businessId: string) {
  const [callCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(calls)
    .where(eq(calls.businessId, businessId));

  const [aptCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(eq(appointments.businessId, businessId));

  const [biz] = await db
    .select({
      humeConfigId: businesses.humeConfigId,
      businessHours: businesses.businessHours,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  const totalCalls = callCount?.count ?? 0;
  const totalApts = aptCount?.count ?? 0;
  const hasHumeConfig = !!biz?.humeConfigId;
  const hasBusinessHours = !!biz?.businessHours && Object.keys(biz.businessHours).length > 0;

  return {
    hasHumeConfig,
    hasBusinessHours,
    hasFirstCall: totalCalls > 0,
    hasFirstAppointment: totalApts > 0,
    totalCalls,
    allComplete: hasHumeConfig && hasBusinessHours && totalCalls > 0 && totalApts > 0,
  };
}
