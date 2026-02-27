import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, calls, appointments } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { runAgent, SUPPORT_TOOLS, AGENT_PROMPTS } from "@/lib/agents";

/**
 * GET /api/agents/onboard
 *
 * Cron-triggered onboarding nudge scan.
 * Checks new clients (last 30 days) for onboarding progress.
 * Schedule: hourly (0 * * * *)
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
        eq(businesses.active, true),
        sql`${businesses.createdAt} >= ${cutoff}`,
      ),
    );

  const results = [];

  for (const client of newClients) {
    const milestones = await checkOnboardingMilestones(client.id);

    // Skip clients who have completed all milestones
    if (milestones.allComplete) continue;

    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    const message = `Check onboarding progress for this new client and send appropriate nudges:

Business: ${client.name} (${client.type})
Owner: ${client.ownerName}
Email: ${client.ownerEmail ?? "none"}
Phone: ${client.ownerPhone}
Signed Up: ${client.createdAt} (${daysSinceSignup} days ago)

ONBOARDING MILESTONES:
- Has Hume config: ${milestones.hasHumeConfig ? "YES" : "NO"}
- Has business hours set: ${milestones.hasBusinessHours ? "YES" : "NO"}
- Has received first call: ${milestones.hasFirstCall ? "YES" : "NO"}
- Has first appointment booked: ${milestones.hasFirstAppointment ? "YES" : "NO"}
- Total calls received: ${milestones.totalCalls}

Based on how many days since signup and which milestones are incomplete, decide what nudge to send (email, SMS) or whether to escalate a stalled onboarding.`;

    const result = await runAgent({
      agentName: "onboard",
      systemPrompt: AGENT_PROMPTS.onboard,
      userMessage: message,
      tools: SUPPORT_TOOLS, // Onboard uses send_email, send_sms, escalate_to_owner
      targetId: client.id,
      targetType: "client",
      inputSummary: `Onboard check: ${client.name} (${daysSinceSignup}d)`,
    });

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
