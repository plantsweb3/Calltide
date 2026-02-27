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

  const clients = await Promise.all(
    activeBusinesses.map(async (biz) => {
      // Call volume: last 7 days
      const [last7] = await db
        .select({ count: sql<number>`count(*)` })
        .from(calls)
        .where(
          and(
            eq(calls.businessId, biz.id),
            gte(calls.createdAt, sevenDaysAgo)
          )
        );

      // Call volume: prior 7 days (8-14 days ago)
      const [prior7] = await db
        .select({ count: sql<number>`count(*)` })
        .from(calls)
        .where(
          and(
            eq(calls.businessId, biz.id),
            gte(calls.createdAt, fourteenDaysAgo),
            sql`${calls.createdAt} < ${sevenDaysAgo}`
          )
        );

      const recentCalls = last7?.count ?? 0;
      const priorCalls = prior7?.count ?? 0;

      let callVolumeTrend = "\u2014"; // em dash
      if (priorCalls > 0) {
        const pctChange = Math.round(
          ((recentCalls - priorCalls) / priorCalls) * 100
        );
        if (pctChange > 0) callVolumeTrend = `\u2191${pctChange}%`;
        else if (pctChange < 0)
          callVolumeTrend = `\u2193${Math.abs(pctChange)}%`;
      } else if (recentCalls > 0) {
        callVolumeTrend = `\u2191100%`;
      }

      const createdDate = new Date(biz.createdAt);
      const daysIn = Math.floor(
        (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const isNewClient = createdDate.toISOString() >= thirtyDaysAgo.replace(" ", "T");

      // New client metrics
      let callCount: number | undefined;
      let avgQaScore: number | undefined;
      let qaFlags: number | undefined;

      if (isNewClient) {
        callCount = recentCalls;

        const [avgQaResult] = await db
          .select({ avg: sql<number>`avg(${callQaScores.score})` })
          .from(callQaScores)
          .where(
            and(
              eq(callQaScores.businessId, biz.id),
              eq(callQaScores.isFirstWeek, true)
            )
          );
        avgQaScore =
          avgQaResult?.avg != null ? Math.round(avgQaResult.avg) : undefined;

        const [qaFlagResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(callQaScores)
          .where(
            and(
              eq(callQaScores.businessId, biz.id),
              sql`${callQaScores.score} < 70`
            )
          );
        qaFlags = qaFlagResult?.count ?? 0;
      }

      // Recent QA scores
      const qaScores = await db
        .select({
          callId: callQaScores.callId,
          score: callQaScores.score,
          flags: callQaScores.flags,
          fixRecommendation: callQaScores.fixRecommendation,
          summary: callQaScores.summary,
          createdAt: callQaScores.createdAt,
        })
        .from(callQaScores)
        .where(eq(callQaScores.businessId, biz.id))
        .orderBy(desc(callQaScores.createdAt))
        .limit(20);

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
        ...(isNewClient
          ? { callCount, avgQaScore, qaFlags }
          : {}),
        daysIn,
        qaScores,
      };
    })
  );

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
