import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  businesses,
  calls,
  callQaScores,
  npsResponses,
  referrals,
  clientSuccessLog,
  churnRiskScores,
} from "@/db/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";

/**
 * GET /api/admin/client-success (admin auth required)
 * Returns client-success dashboard data: summary, clients, NPS, referral stats.
 */
export async function GET() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  // ── Summary ──

  const [activeCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(businesses)
    .where(eq(businesses.active, true));

  const [avgHealthResult] = await db
    .select({ avg: sql<number>`avg(${businesses.healthScore})` })
    .from(businesses)
    .where(eq(businesses.active, true));

  const npsGroups = await db
    .select({
      classification: npsResponses.classification,
      count: sql<number>`count(*)`,
    })
    .from(npsResponses)
    .groupBy(npsResponses.classification);

  const npsMap: Record<string, number> = {};
  for (const row of npsGroups) {
    npsMap[row.classification] = row.count;
  }

  const [totalReferralsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(referrals);

  const [convertedReferralsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(referrals)
    .where(eq(referrals.status, "activated"));

  const summary = {
    activeClients: activeCountResult?.count ?? 0,
    avgHealthScore: Math.round(avgHealthResult?.avg ?? 0),
    nps: {
      promoters: npsMap["promoter"] ?? 0,
      passives: npsMap["passive"] ?? 0,
      detractors: npsMap["detractor"] ?? 0,
    },
    referrals: {
      total: totalReferralsResult?.count ?? 0,
      converted: convertedReferralsResult?.count ?? 0,
    },
  };

  // ── Clients ──

  const activeBusinesses = await db
    .select()
    .from(businesses)
    .where(eq(businesses.active, true))
    .orderBy(desc(businesses.createdAt));

  // Batch: call volume last 7 days per business
  const last7Rows = await db
    .select({ businessId: calls.businessId, count: sql<number>`count(*)` })
    .from(calls)
    .where(gte(calls.createdAt, sevenDaysAgo))
    .groupBy(calls.businessId);
  const last7Map = new Map(last7Rows.map((r) => [r.businessId, r.count]));

  // Batch: call volume prior 7 days (8-14 days ago) per business
  const prior7Rows = await db
    .select({ businessId: calls.businessId, count: sql<number>`count(*)` })
    .from(calls)
    .where(and(gte(calls.createdAt, fourteenDaysAgo), sql`${calls.createdAt} < ${sevenDaysAgo}`))
    .groupBy(calls.businessId);
  const prior7Map = new Map(prior7Rows.map((r) => [r.businessId, r.count]));

  // Batch: avg QA score for first week per business
  const avgQaRows = await db
    .select({ businessId: callQaScores.businessId, avg: sql<number>`avg(${callQaScores.score})` })
    .from(callQaScores)
    .where(eq(callQaScores.isFirstWeek, true))
    .groupBy(callQaScores.businessId);
  const avgQaMap = new Map(avgQaRows.map((r) => [r.businessId, r.avg]));

  // Batch: QA flags (score < 70) per business
  const qaFlagRows = await db
    .select({ businessId: callQaScores.businessId, count: sql<number>`count(*)` })
    .from(callQaScores)
    .where(sql`${callQaScores.score} < 70`)
    .groupBy(callQaScores.businessId);
  const qaFlagMap = new Map(qaFlagRows.map((r) => [r.businessId, r.count]));

  // Batch: recent QA scores per business (all, then group in-memory)
  const allQaScores = await db
    .select({
      businessId: callQaScores.businessId,
      callId: callQaScores.callId,
      score: callQaScores.score,
      flags: callQaScores.flags,
      fixRecommendation: callQaScores.fixRecommendation,
      summary: callQaScores.summary,
      createdAt: callQaScores.createdAt,
    })
    .from(callQaScores)
    .orderBy(desc(callQaScores.createdAt));

  const qaScoresMap = new Map<string, typeof allQaScores>();
  for (const qa of allQaScores) {
    const list = qaScoresMap.get(qa.businessId) ?? [];
    if (list.length < 20) list.push(qa);
    qaScoresMap.set(qa.businessId, list);
  }

  const clients = activeBusinesses.map((biz) => {
    const recentCalls = last7Map.get(biz.id) ?? 0;
    const priorCalls = prior7Map.get(biz.id) ?? 0;

    let callVolumeTrend = "\u2014";
    if (priorCalls > 0) {
      const pctChange = Math.round(((recentCalls - priorCalls) / priorCalls) * 100);
      if (pctChange > 0) callVolumeTrend = `\u2191${pctChange}%`;
      else if (pctChange < 0) callVolumeTrend = `\u2193${Math.abs(pctChange)}%`;
    } else if (recentCalls > 0) {
      callVolumeTrend = `\u2191100%`;
    }

    const createdDate = new Date(biz.createdAt);
    const daysIn = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const isNewClient = createdDate.toISOString() >= thirtyDaysAgo.replace(" ", "T");

    let callCount: number | undefined;
    let avgQaScore: number | undefined;
    let qaFlags: number | undefined;

    if (isNewClient) {
      callCount = recentCalls;
      const rawAvg = avgQaMap.get(biz.id);
      avgQaScore = rawAvg != null ? Math.round(rawAvg) : undefined;
      qaFlags = qaFlagMap.get(biz.id) ?? 0;
    }

    const qaScores = qaScoresMap.get(biz.id) ?? [];

    return {
      id: biz.id,
      name: biz.name,
      healthScore: biz.healthScore,
      lastNpsScore: biz.lastNpsScore,
      qaGrade: biz.onboardingQaGrade,
      callVolumeTrend,
      active: biz.active,
      createdAt: biz.createdAt,
      isNewClient,
      ...(isNewClient ? { callCount, avgQaScore, qaFlags } : {}),
      daysIn,
      qaScores,
    };
  });

  // ── NPS Responses ──

  const npsResponsesList = await db
    .select({
      id: npsResponses.id,
      businessName: businesses.name,
      score: npsResponses.score,
      classification: npsResponses.classification,
      feedback: npsResponses.feedback,
      followUpAction: npsResponses.followUpAction,
      escalated: npsResponses.escalated,
      createdAt: npsResponses.createdAt,
    })
    .from(npsResponses)
    .leftJoin(businesses, eq(npsResponses.businessId, businesses.id))
    .orderBy(desc(npsResponses.createdAt))
    .limit(100);

  // ── Referral Stats ──

  const [codesIssuedResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(businesses)
    .where(sql`${businesses.referralCode} is not null`);

  const [linksVisitedResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(referrals)
    .where(eq(referrals.status, "pending"));

  const [signedUpResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(referrals)
    .where(eq(referrals.status, "signed_up"));

  const [activatedResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(referrals)
    .where(eq(referrals.status, "activated"));

  // Top referrers
  const topReferrers = await db
    .select({
      businessId: referrals.referrerBusinessId,
      name: businesses.name,
      referralCount: sql<number>`count(*)`,
      activatedCount: sql<number>`sum(case when ${referrals.status} = 'activated' then 1 else 0 end)`,
      totalCredits: sql<number>`sum(case when ${referrals.referrerCreditApplied} = 1 then ${referrals.referrerCreditAmount} else 0 end)`,
    })
    .from(referrals)
    .leftJoin(
      businesses,
      eq(referrals.referrerBusinessId, businesses.id)
    )
    .groupBy(referrals.referrerBusinessId)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  // Recent referral activity
  const recentActivity = await db
    .select({
      id: referrals.id,
      referrerName: businesses.name,
      status: referrals.status,
      createdAt: referrals.createdAt,
    })
    .from(referrals)
    .leftJoin(
      businesses,
      eq(referrals.referrerBusinessId, businesses.id)
    )
    .orderBy(desc(referrals.createdAt))
    .limit(20);

  const referralStats = {
    codesIssued: codesIssuedResult?.count ?? 0,
    linksVisited: linksVisitedResult?.count ?? 0,
    signedUp: signedUpResult?.count ?? 0,
    activated: activatedResult?.count ?? 0,
    topReferrers: topReferrers.map((r) => ({
      businessId: r.businessId,
      name: r.name,
      referralCount: r.referralCount,
      activatedCount: r.activatedCount ?? 0,
      totalCredits: r.totalCredits ?? 0,
    })),
    recentActivity,
  };

  return NextResponse.json({
    summary,
    clients,
    npsResponses: npsResponsesList,
    referralStats,
  });
}
