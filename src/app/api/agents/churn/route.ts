import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, calls, churnRiskScores, dunningState, callQaScores, npsResponses } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { runAgent, CHURN_TOOLS, AGENT_PROMPTS } from "@/lib/agents";
import { canContactToday, logOutreach } from "@/lib/outreach";

/**
 * GET /api/agents/churn
 *
 * Cron-triggered churn prevention scan.
 * Analyzes all active clients and updates risk scores.
 * Schedule: daily at 2 PM (0 14 * * *)
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

  // Get all active businesses
  const activeClients = await db
    .select()
    .from(businesses)
    .where(eq(businesses.active, true));

  const results = [];

  for (const client of activeClients) {
    // Outreach conflict prevention — skip if already contacted today
    if (!(await canContactToday(client.id))) continue;

    // Gather health signals for this client
    const signals = await gatherClientSignals(client.id);

    const message = `Analyze this client for churn risk and take appropriate action:

Business: ${client.name} (${client.type})
Owner: ${client.ownerName}
Email: ${client.ownerEmail ?? "none"}
Phone: ${client.ownerPhone}
Active Since: ${client.createdAt}

HEALTH SIGNALS:
- Calls this month: ${signals.callsThisMonth}
- Calls last month: ${signals.callsLastMonth}
- Call volume change: ${signals.volumeChange}
- Missed calls this month: ${signals.missedCallsThisMonth}
- Last call date: ${signals.lastCallDate ?? "never"}
- Current churn score: ${signals.currentScore ?? "unscored"}
- Previous score factors: ${signals.previousFactors ?? "none"}
- Payment status: ${signals.paymentStatus ?? "unknown"}
- Dunning stage: ${signals.dunningStage ?? "none"}
- Dunning attempt count: ${signals.dunningAttemptCount ?? 0}
- Average QA score: ${signals.avgQaScore ?? "no data"}
- Latest NPS score: ${signals.latestNpsScore ?? "no data"}

Based on these signals, update the churn risk score and take appropriate action (check-in email, escalation, or no action).`;

    const result = await runAgent({
      agentName: "churn",
      systemPrompt: AGENT_PROMPTS.churn,
      userMessage: message,
      tools: CHURN_TOOLS,
      targetId: client.id,
      targetType: "client",
      inputSummary: `Churn analysis: ${client.name}`,
    });

    // Log outreach to prevent same-day duplicate contacts
    await logOutreach(client.id, "churn_agent", "email");
    results.push({ businessId: client.id, name: client.name, ...result });
  }

  return NextResponse.json({ processed: results.length, results });
}

/**
 * POST /api/agents/churn
 *
 * Manually trigger churn analysis for a specific client.
 * Body: { businessId: string }
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { businessId } = body;

  if (!businessId || typeof businessId !== "string") {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }

  const [client] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!client) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const signals = await gatherClientSignals(client.id);

  const message = `Analyze this client for churn risk:

Business: ${client.name} (${client.type})
Owner: ${client.ownerName}, Email: ${client.ownerEmail ?? "none"}
Calls this month: ${signals.callsThisMonth}, Last month: ${signals.callsLastMonth}
Change: ${signals.volumeChange}
Missed calls: ${signals.missedCallsThisMonth}
Last call: ${signals.lastCallDate ?? "never"}
Current score: ${signals.currentScore ?? "unscored"}`;

  const result = await runAgent({
    agentName: "churn",
    systemPrompt: AGENT_PROMPTS.churn,
    userMessage: message,
    tools: CHURN_TOOLS,
    targetId: businessId,
    targetType: "client",
    inputSummary: `Churn analysis: ${client.name}`,
  });

  return NextResponse.json(result);
}

async function gatherClientSignals(businessId: string) {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = thisMonthStart;

  // Calls this month
  const [thisMonth] = await db
    .select({ count: sql<number>`count(*)` })
    .from(calls)
    .where(
      sql`${calls.businessId} = ${businessId} AND ${calls.createdAt} >= ${thisMonthStart}`,
    );

  // Calls last month
  const [lastMonth] = await db
    .select({ count: sql<number>`count(*)` })
    .from(calls)
    .where(
      sql`${calls.businessId} = ${businessId} AND ${calls.createdAt} >= ${lastMonthStart} AND ${calls.createdAt} < ${lastMonthEnd}`,
    );

  // Missed calls this month
  const [missed] = await db
    .select({ count: sql<number>`count(*)` })
    .from(calls)
    .where(
      sql`${calls.businessId} = ${businessId} AND ${calls.status} = 'missed' AND ${calls.createdAt} >= ${thisMonthStart}`,
    );

  // Last call date
  const [lastCall] = await db
    .select({ createdAt: calls.createdAt })
    .from(calls)
    .where(eq(calls.businessId, businessId))
    .orderBy(desc(calls.createdAt))
    .limit(1);

  // Current churn score
  const [score] = await db
    .select({ score: churnRiskScores.score, factors: churnRiskScores.factors })
    .from(churnRiskScores)
    .where(eq(churnRiskScores.customerId, businessId))
    .limit(1);

  const callsThisMonth = thisMonth?.count ?? 0;
  const callsLastMonth = lastMonth?.count ?? 0;
  const volumeChange = callsLastMonth > 0
    ? `${Math.round(((callsThisMonth - callsLastMonth) / callsLastMonth) * 100)}%`
    : "N/A (no last month data)";

  // Payment status
  const [business] = await db
    .select({ paymentStatus: businesses.paymentStatus })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  const [activeDunning] = await db
    .select()
    .from(dunningState)
    .where(and(eq(dunningState.businessId, businessId), eq(dunningState.status, "active")))
    .limit(1);

  // Average QA score (from Retention system)
  const [qaAvg] = await db
    .select({ avg: sql<number>`COALESCE(AVG(${callQaScores.score}), 0)` })
    .from(callQaScores)
    .where(eq(callQaScores.businessId, businessId));

  // Latest NPS score (from Retention system)
  const [latestNps] = await db
    .select({ score: npsResponses.score })
    .from(npsResponses)
    .where(eq(npsResponses.businessId, businessId))
    .orderBy(desc(npsResponses.createdAt))
    .limit(1);

  return {
    callsThisMonth,
    callsLastMonth,
    volumeChange,
    missedCallsThisMonth: missed?.count ?? 0,
    lastCallDate: lastCall?.createdAt ?? null,
    currentScore: score?.score ?? null,
    previousFactors: (score?.factors as string[])?.join("; ") ?? null,
    paymentStatus: business?.paymentStatus ?? null,
    dunningStage: activeDunning?.status ?? null,
    dunningAttemptCount: activeDunning?.attemptCount ?? 0,
    avgQaScore: qaAvg?.avg ? Math.round(qaAvg.avg * 10) / 10 : null,
    latestNpsScore: latestNps?.score ?? null,
  };
}
