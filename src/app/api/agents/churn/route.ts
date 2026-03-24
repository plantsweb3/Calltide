import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  businesses,
  calls,
  churnRiskScores,
  dunningState,
  callQaScores,
  npsResponses,
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { executeTool, logAgentActivity } from "@/lib/agents";
import { canContactToday, logOutreach } from "@/lib/outreach";
import {
  createHandoff,
  getHandoffsForAgent,
  completeHandoff,
} from "@/lib/agents/handoffs";
import { createNotification } from "@/lib/notifications";
import { verifyCronAuth } from "@/lib/cron-auth";
import { reportError } from "@/lib/error-reporting";

// ── Programmatic Churn Scoring ──

interface ChurnSignals {
  callsThisMonth: number;
  callsLastMonth: number;
  volumeDropPct: number;
  missedCallsThisMonth: number;
  daysSinceLastCall: number | null;
  currentScore: number | null;
  previousFactors: string | null;
  paymentStatus: string | null;
  dunningStage: string | null;
  dunningAttemptCount: number;
  avgQaScore: number | null;
  latestNpsScore: number | null;
}

interface ChurnResult {
  score: number;
  factors: string[];
  action: "none" | "check_in" | "escalate";
}

/**
 * Weighted programmatic churn scoring — replaces LLM calls.
 *
 * Weights:
 *   Volume drop    30%
 *   Days inactive  20%
 *   Missed calls   15%
 *   Payment status 15%
 *   Dunning stage  10%
 *   QA score        5%
 *   NPS score       5%
 */
function calculateChurnScore(signals: ChurnSignals): ChurnResult {
  const factors: string[] = [];
  let weighted = 0;

  // Volume drop (30%) — 0-10 scale
  let volumeScore = 0;
  if (signals.callsLastMonth > 0) {
    const dropPct = signals.volumeDropPct;
    if (dropPct <= -80) { volumeScore = 10; factors.push(`Call volume dropped ${Math.abs(dropPct)}%`); }
    else if (dropPct <= -50) { volumeScore = 7; factors.push(`Call volume dropped ${Math.abs(dropPct)}%`); }
    else if (dropPct <= -25) { volumeScore = 4; factors.push(`Call volume dropped ${Math.abs(dropPct)}%`); }
    else { volumeScore = 0; }
  } else if (signals.callsThisMonth === 0) {
    volumeScore = 5;
    factors.push("No calls this month or last month");
  }
  weighted += volumeScore * 0.3;

  // Days since last call (20%)
  let inactiveScore = 0;
  if (signals.daysSinceLastCall === null) {
    inactiveScore = 8;
    factors.push("No calls ever recorded");
  } else if (signals.daysSinceLastCall > 21) {
    inactiveScore = 10;
    factors.push(`Inactive for ${signals.daysSinceLastCall} days`);
  } else if (signals.daysSinceLastCall > 14) {
    inactiveScore = 7;
    factors.push(`No calls in ${signals.daysSinceLastCall} days`);
  } else if (signals.daysSinceLastCall > 7) {
    inactiveScore = 4;
  }
  weighted += inactiveScore * 0.2;

  // Missed calls (15%)
  let missedScore = 0;
  if (signals.callsThisMonth > 0) {
    const missedPct = signals.missedCallsThisMonth / signals.callsThisMonth;
    if (missedPct > 0.5) { missedScore = 10; factors.push(`${Math.round(missedPct * 100)}% missed call rate`); }
    else if (missedPct > 0.25) { missedScore = 6; factors.push(`${Math.round(missedPct * 100)}% missed call rate`); }
    else if (missedPct > 0.1) { missedScore = 3; }
  }
  weighted += missedScore * 0.15;

  // Payment status (15%)
  let paymentScore = 0;
  if (signals.paymentStatus === "past_due") {
    paymentScore = 8;
    factors.push("Payment past due");
  } else if (signals.paymentStatus === "canceled") {
    paymentScore = 10;
    factors.push("Subscription canceled");
  } else if (signals.paymentStatus === "unpaid") {
    paymentScore = 9;
    factors.push("Payment unpaid");
  }
  weighted += paymentScore * 0.15;

  // Dunning stage (10%)
  let dunningScore = 0;
  if (signals.dunningStage === "active") {
    dunningScore = Math.min(10, 5 + signals.dunningAttemptCount * 2);
    factors.push(`Active dunning (${signals.dunningAttemptCount} attempts)`);
  }
  weighted += dunningScore * 0.1;

  // QA score (5%) — low QA = higher churn risk
  let qaScore = 0;
  if (signals.avgQaScore !== null) {
    if (signals.avgQaScore < 50) { qaScore = 8; factors.push(`Low avg QA score: ${signals.avgQaScore}`); }
    else if (signals.avgQaScore < 70) { qaScore = 4; }
  }
  weighted += qaScore * 0.05;

  // NPS score (5%)
  let npsScore = 0;
  if (signals.latestNpsScore !== null) {
    if (signals.latestNpsScore <= 3) { npsScore = 10; factors.push(`NPS detractor: ${signals.latestNpsScore}`); }
    else if (signals.latestNpsScore <= 6) { npsScore = 5; factors.push(`NPS passive: ${signals.latestNpsScore}`); }
  }
  weighted += npsScore * 0.05;

  // Final score 0-10 (rounded to 1 decimal)
  const score = Math.round(weighted * 10) / 10;

  // Determine action
  let action: ChurnResult["action"] = "none";
  if (score >= 7) action = "escalate";
  else if (score >= 4) action = "check_in";

  return { score, factors, action };
}

// ── Check-in email template ──

function buildCheckInEmail(client: { name: string; ownerName: string }): {
  subject: string;
  body: string;
} {
  return {
    subject: `${client.name} — just checking in`,
    body: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
      <p>Hi ${client.ownerName},</p>
      <p>This is a quick check-in from Capta. We noticed your call activity has been a bit lower recently and wanted to make sure everything is running smoothly.</p>
      <p>If you're experiencing any issues or have questions about your receptionist setup, we're here to help. Just reply to this email or give us a call.</p>
      <p>Best,<br/>The Capta Team</p>
    </div>`,
  };
}

// ── Shared processing logic ──

async function processClient(
  client: {
    id: string;
    name: string;
    type: string;
    ownerName: string;
    ownerEmail: string | null;
    ownerPhone: string;
  },
  opts?: { isHandoff?: boolean; handoffBoost?: number },
) {
  const signals = await gatherClientSignals(client);
  const result = calculateChurnScore(signals);

  // Handoff boost — increase urgency
  let finalScore = result.score;
  if (opts?.handoffBoost) {
    finalScore = Math.min(10, finalScore + opts.handoffBoost);
  }
  const finalAction: ChurnResult["action"] =
    finalScore >= 7 ? "escalate" : finalScore >= 4 ? "check_in" : "none";

  // Always persist churn score
  await executeTool(
    "update_churn_score",
    {
      businessId: client.id,
      score: finalScore,
      reasoning: result.factors.length > 0
        ? result.factors.join("; ")
        : "Healthy — no risk signals detected",
    },
    "churn",
  );

  // Take action based on score
  const actionsTaken: string[] = [];

  if (finalAction === "check_in" && client.ownerEmail) {
    const email = buildCheckInEmail(client);
    const emailResult = await executeTool(
      "send_email",
      { to: client.ownerEmail, subject: email.subject, body: email.body },
      "churn",
    );
    actionsTaken.push(`send_email: ${emailResult}`);
  } else if (finalAction === "escalate") {
    const escalateResult = await executeTool(
      "escalate_to_owner",
      {
        reason: `High churn risk for ${client.name} (score: ${finalScore}/10)`,
        urgency: finalScore >= 8.5 ? "high" : "medium",
        context: `Factors: ${result.factors.join("; ")}. Payment: ${signals.paymentStatus ?? "ok"}. Calls this month: ${signals.callsThisMonth}.`,
      },
      "churn",
    );
    actionsTaken.push(`escalate_to_owner: ${escalateResult}`);

    await createNotification({
      source: "retention",
      severity: finalScore >= 8.5 ? "critical" : "warning",
      title: `High churn risk: ${client.name}`,
      message: `Score ${finalScore}/10 — ${result.factors.slice(0, 3).join("; ")}`,
      actionUrl: "/admin/client-success",
    });
  }

  // Log agent activity
  await logAgentActivity({
    agentName: "churn",
    actionType: finalAction === "escalate" ? "escalated" : finalAction === "check_in" ? "email_sent" : "resolved",
    targetId: client.id,
    targetType: "client",
    inputSummary: `Churn analysis: ${client.name}`,
    outputSummary: `Score: ${finalScore}/10. ${result.factors.join("; ") || "No risk signals."}`,
    toolsCalled: actionsTaken.map((a) => a.split(":")[0]),
    escalated: finalAction === "escalate",
    resolvedWithoutEscalation: finalAction !== "escalate" && actionsTaken.length > 0,
  });

  return { score: finalScore, action: finalAction, factors: result.factors, actionsTaken };
}

// ── Routes ──

/**
 * GET /api/agents/churn
 *
 * Cron-triggered churn prevention scan.
 * Analyzes all active clients and updates risk scores.
 * Schedule: daily at 2 PM (0 14 * * *)
 */
export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  try {
    // Get all active businesses
    const activeClients = await db
      .select()
      .from(businesses)
      .where(eq(businesses.active, true));

    const results = [];

    // Process incoming handoffs from onboard agent (stalled onboarding → churn watch)
    const incomingHandoffs = await getHandoffsForAgent("churn");
    for (const handoff of incomingHandoffs) {
      const client = activeClients.find((c) => c.id === handoff.businessId);
      if (!client) {
        // Client might not be active — fetch directly
        const [hClient] = await db
          .select()
          .from(businesses)
          .where(eq(businesses.id, handoff.businessId))
          .limit(1);
        if (!hClient) {
          await completeHandoff(handoff.id, "Business not found");
          continue;
        }

        const result = await processClient(hClient, { isHandoff: true, handoffBoost: 2 });
        await logOutreach(hClient.id, "churn_agent", "email");
        await completeHandoff(handoff.id, `Processed churn analysis for ${hClient.name}`);
        results.push({ businessId: hClient.id, name: hClient.name, handoff: true, ...result });
        continue;
      }

      const result = await processClient(client, { isHandoff: true, handoffBoost: 2 });
      await logOutreach(client.id, "churn_agent", "email");
      await completeHandoff(handoff.id, `Processed churn analysis for ${client.name}`);
      results.push({ businessId: client.id, name: client.name, handoff: true, ...result });
    }

    for (const client of activeClients) {
      // Outreach conflict prevention — skip if already contacted today
      if (!(await canContactToday(client.id))) continue;

      const result = await processClient(client);

      // Log outreach to prevent same-day duplicate contacts
      await logOutreach(client.id, "churn_agent", "email");

      // If high-risk (score >= 7), create handoff to success agent for recovery follow-up
      if (result.score >= 7) {
        await createHandoff({
          fromAgent: "churn",
          toAgent: "success",
          businessId: client.id,
          reason: "High churn risk — needs success recovery follow-up",
          context: {
            churnScore: result.score,
            factors: result.factors,
            paymentStatus: (await gatherClientSignals(client)).paymentStatus,
          },
          priority: result.score >= 8.5 ? "urgent" : "high",
          ttlHours: 48,
        });
      }

      results.push({ businessId: client.id, name: client.name, ...result });
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    reportError("[churn] Agent failed", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/agents/churn
 *
 * Manually trigger churn analysis for a specific client.
 * Body: { businessId: string }
 */
export async function POST(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

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

  const result = await processClient(client);
  return NextResponse.json(result);
}

// ── Signal Gathering (consolidated queries) ──

async function gatherClientSignals(
  client: { id: string; paymentStatus?: string | null },
): Promise<ChurnSignals> {
  const businessId = client.id;
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  // Consolidate call queries into a single query with conditional aggregation
  const [callStats] = await db
    .select({
      thisMonth: sql<number>`COALESCE(SUM(CASE WHEN ${calls.createdAt} >= ${thisMonthStart} THEN 1 ELSE 0 END), 0)`,
      lastMonth: sql<number>`COALESCE(SUM(CASE WHEN ${calls.createdAt} >= ${lastMonthStart} AND ${calls.createdAt} < ${thisMonthStart} THEN 1 ELSE 0 END), 0)`,
      missedThisMonth: sql<number>`COALESCE(SUM(CASE WHEN ${calls.createdAt} >= ${thisMonthStart} AND ${calls.status} = 'missed' THEN 1 ELSE 0 END), 0)`,
      lastCallDate: sql<string | null>`MAX(${calls.createdAt})`,
    })
    .from(calls)
    .where(eq(calls.businessId, businessId));

  const callsThisMonth = callStats?.thisMonth ?? 0;
  const callsLastMonth = callStats?.lastMonth ?? 0;

  // Volume drop percentage
  const volumeDropPct =
    callsLastMonth > 0
      ? Math.round(((callsThisMonth - callsLastMonth) / callsLastMonth) * 100)
      : 0;

  // Days since last call
  let daysSinceLastCall: number | null = null;
  if (callStats?.lastCallDate) {
    daysSinceLastCall = Math.floor(
      (now.getTime() - new Date(callStats.lastCallDate).getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  // Churn score + dunning + QA + NPS (parallel)
  const [scoreRow, activeDunning, qaAvg, latestNps] = await Promise.all([
    db
      .select({ score: churnRiskScores.score, factors: churnRiskScores.factors })
      .from(churnRiskScores)
      .where(eq(churnRiskScores.customerId, businessId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select()
      .from(dunningState)
      .where(and(eq(dunningState.businessId, businessId), eq(dunningState.status, "active")))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select({ avg: sql<number>`COALESCE(AVG(${callQaScores.score}), 0)` })
      .from(callQaScores)
      .where(eq(callQaScores.businessId, businessId))
      .then((rows) => rows[0] ?? null),
    db
      .select({ score: npsResponses.score })
      .from(npsResponses)
      .where(eq(npsResponses.businessId, businessId))
      .orderBy(desc(npsResponses.createdAt))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  return {
    callsThisMonth,
    callsLastMonth,
    volumeDropPct,
    missedCallsThisMonth: callStats?.missedThisMonth ?? 0,
    daysSinceLastCall,
    currentScore: scoreRow?.score ?? null,
    previousFactors: (scoreRow?.factors as string[])?.join("; ") ?? null,
    paymentStatus: client.paymentStatus ?? null,
    dunningStage: activeDunning?.status ?? null,
    dunningAttemptCount: activeDunning?.attemptCount ?? 0,
    avgQaScore: qaAvg?.avg ? Math.round(qaAvg.avg * 10) / 10 : null,
    latestNpsScore: latestNps?.score ?? null,
  };
}
