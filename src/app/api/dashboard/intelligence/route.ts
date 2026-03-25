import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  calls,
  customers,
  receptionistCustomResponses,
  knowledgeGaps,
  callQaScores,
  appointments,
  businesses,
} from "@/db/schema";
import { eq, and, count, desc, sql, gte } from "drizzle-orm";
import { DEMO_BUSINESS_ID } from "../demo-data";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`dashboard-intelligence-${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const isDemoMode = businessId === DEMO_BUSINESS_ID;

    // ── Business info ──
    const [biz] = await db
      .select({
        name: businesses.name,
        receptionistName: businesses.receptionistName,
        createdAt: businesses.createdAt,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    const receptionistName = biz?.receptionistName || "Maria";
    const createdAt = biz?.createdAt || new Date().toISOString();
    const daysLearning = Math.max(
      1,
      Math.floor(
        (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    // ── Total calls ──
    const [totalCallsRow] = await db
      .select({ count: count() })
      .from(calls)
      .where(eq(calls.businessId, businessId));

    // ── Calls by language ──
    const callLangRows = await db
      .select({
        language: calls.language,
        cnt: count(),
      })
      .from(calls)
      .where(eq(calls.businessId, businessId))
      .groupBy(calls.language);

    const languageBreakdown: Record<string, number> = {};
    for (const r of callLangRows) {
      languageBreakdown[r.language || "en"] =
        (languageBreakdown[r.language || "en"] || 0) + r.cnt;
    }

    // ── Calls by hour ──
    const allCalls = await db
      .select({ createdAt: calls.createdAt })
      .from(calls)
      .where(eq(calls.businessId, businessId));

    const hourCounts = new Array(24).fill(0);
    for (const c of allCalls) {
      const h = new Date(c.createdAt).getHours();
      hourCounts[h]++;
    }

    // ── Monthly call trends (last 6 months) ──
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsStr = sixMonthsAgo.toISOString().slice(0, 10);

    const monthlyCallRows = await db
      .select({
        month: sql<string>`strftime('%Y-%m', ${calls.createdAt})`,
        cnt: count(),
      })
      .from(calls)
      .where(
        and(
          eq(calls.businessId, businessId),
          gte(calls.createdAt, sixMonthsStr)
        )
      )
      .groupBy(sql`strftime('%Y-%m', ${calls.createdAt})`)
      .orderBy(sql`strftime('%Y-%m', ${calls.createdAt})`);

    // ── Customers ──
    const [totalCustomersRow] = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.businessId, businessId));

    // Tier distribution
    const tierRows = await db
      .select({
        tier: customers.tier,
        cnt: count(),
      })
      .from(customers)
      .where(eq(customers.businessId, businessId))
      .groupBy(customers.tier);

    const tierDistribution: Record<string, number> = {};
    for (const r of tierRows) {
      tierDistribution[r.tier || "new"] = r.cnt;
    }

    // Top 5 customers by calls
    const topCustomers = await db
      .select({
        name: customers.name,
        phone: customers.phone,
        totalCalls: customers.totalCalls,
        tier: customers.tier,
      })
      .from(customers)
      .where(eq(customers.businessId, businessId))
      .orderBy(desc(customers.totalCalls))
      .limit(5);

    // Repeat rate
    const [repeatRow] = await db
      .select({ count: count() })
      .from(customers)
      .where(
        and(eq(customers.businessId, businessId), eq(customers.isRepeat, true))
      );

    const repeatRate =
      totalCustomersRow.count > 0
        ? Math.round((repeatRow.count / totalCustomersRow.count) * 100)
        : 0;

    // ── Custom responses ──
    const customResponseRows = await db
      .select({
        category: receptionistCustomResponses.category,
        cnt: count(),
      })
      .from(receptionistCustomResponses)
      .where(
        and(
          eq(receptionistCustomResponses.businessId, businessId),
          eq(receptionistCustomResponses.active, true)
        )
      )
      .groupBy(receptionistCustomResponses.category);

    const customResponsesByCategory: Record<string, number> = {};
    let totalCustomResponses = 0;
    for (const r of customResponseRows) {
      customResponsesByCategory[r.category] = r.cnt;
      totalCustomResponses += r.cnt;
    }

    // ── Knowledge gaps ──
    const gapStatusRows = await db
      .select({
        status: knowledgeGaps.status,
        cnt: count(),
      })
      .from(knowledgeGaps)
      .where(eq(knowledgeGaps.businessId, businessId))
      .groupBy(knowledgeGaps.status);

    const gapCounts: Record<string, number> = {};
    for (const r of gapStatusRows) {
      gapCounts[r.status] = r.cnt;
    }

    const recentGaps = await db
      .select({
        id: knowledgeGaps.id,
        question: knowledgeGaps.question,
        status: knowledgeGaps.status,
        createdAt: knowledgeGaps.createdAt,
      })
      .from(knowledgeGaps)
      .where(eq(knowledgeGaps.businessId, businessId))
      .orderBy(desc(knowledgeGaps.createdAt))
      .limit(10);

    // ── QA Scores ──
    const [avgQaRow] = await db
      .select({
        avg: sql<number>`COALESCE(AVG(${callQaScores.score}), 0)`,
      })
      .from(callQaScores)
      .where(eq(callQaScores.businessId, businessId));

    // QA breakdown averages
    const qaBreakdownRows = await db
      .select({ breakdown: callQaScores.breakdown })
      .from(callQaScores)
      .where(eq(callQaScores.businessId, businessId));

    const breakdownSums = {
      greeting: 0,
      languageMatch: 0,
      needCapture: 0,
      actionTaken: 0,
      accuracy: 0,
      sentiment: 0,
    };
    let breakdownCount = 0;
    for (const r of qaBreakdownRows) {
      if (r.breakdown) {
        breakdownSums.greeting += r.breakdown.greeting || 0;
        breakdownSums.languageMatch += r.breakdown.languageMatch || 0;
        breakdownSums.needCapture += r.breakdown.needCapture || 0;
        breakdownSums.actionTaken += r.breakdown.actionTaken || 0;
        breakdownSums.accuracy += r.breakdown.accuracy || 0;
        breakdownSums.sentiment += r.breakdown.sentiment || 0;
        breakdownCount++;
      }
    }
    const avgBreakdown =
      breakdownCount > 0
        ? {
            greeting: Math.round(breakdownSums.greeting / breakdownCount),
            languageMatch: Math.round(
              breakdownSums.languageMatch / breakdownCount
            ),
            needCapture: Math.round(
              breakdownSums.needCapture / breakdownCount
            ),
            actionTaken: Math.round(
              breakdownSums.actionTaken / breakdownCount
            ),
            accuracy: Math.round(breakdownSums.accuracy / breakdownCount),
            sentiment: Math.round(breakdownSums.sentiment / breakdownCount),
          }
        : null;

    // Weekly QA trend (last 12 weeks)
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
    const twelveWeeksStr = twelveWeeksAgo.toISOString().slice(0, 10);

    const weeklyQaRows = await db
      .select({
        week: sql<string>`strftime('%Y-W%W', ${callQaScores.createdAt})`,
        avg: sql<number>`AVG(${callQaScores.score})`,
      })
      .from(callQaScores)
      .where(
        and(
          eq(callQaScores.businessId, businessId),
          gte(callQaScores.createdAt, twelveWeeksStr)
        )
      )
      .groupBy(sql`strftime('%Y-W%W', ${callQaScores.createdAt})`)
      .orderBy(sql`strftime('%Y-W%W', ${callQaScores.createdAt})`);

    const weeklyQaTrend = weeklyQaRows.map((r) => ({
      week: r.week,
      avg: Math.round(r.avg),
    }));

    // ── Top services ──
    const serviceRows = await db
      .select({
        service: appointments.service,
        cnt: count(),
      })
      .from(appointments)
      .where(eq(appointments.businessId, businessId))
      .groupBy(appointments.service)
      .orderBy(desc(count()))
      .limit(5);

    // ── Bilingual percentage ──
    const totalCalls = totalCallsRow.count;
    const spanishCalls = languageBreakdown["es"] || 0;
    const bilingualPercent =
      totalCalls > 0 ? Math.round((spanishCalls / totalCalls) * 100) : 0;

    return NextResponse.json({
      receptionistName,
      daysLearning,
      totalCalls,
      totalCustomers: totalCustomersRow.count,
      totalCustomResponses,
      avgQaScore: Math.round(avgQaRow.avg),
      languageBreakdown,
      hourCounts,
      monthlyTrend: monthlyCallRows.map((r) => ({
        month: r.month,
        count: r.cnt,
      })),
      tierDistribution,
      topCustomers,
      repeatRate,
      customResponsesByCategory,
      gapCounts,
      recentGaps,
      avgBreakdown,
      weeklyQaTrend,
      topServices: serviceRows.map((r) => ({
        name: r.service,
        count: r.cnt,
      })),
      bilingualPercent,
      isDemoMode,
    });
  } catch (err) {
    reportError("Intelligence API failed", err, { businessId });
    return NextResponse.json(
      { error: "Failed to load intelligence data" },
      { status: 500 }
    );
  }
}
