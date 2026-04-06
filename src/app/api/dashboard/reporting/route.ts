import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { calls, appointments, customers, estimates, outboundCalls, callQaScores } from "@/db/schema";
import { eq, and, sql, gte, lte, count, desc } from "drizzle-orm";
import { DEMO_BUSINESS_ID } from "../demo-data";
import { reportError } from "@/lib/error-reporting";
import { rateLimit, RATE_LIMITS, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json(getDemoReporting());
  }

  const rl = await rateLimit(`dashboard-reporting-${businessId}`, RATE_LIMITS.standard);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const now = new Date();

    // ── Read optional from/to date range params ──
    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Validate YYYY-MM-DD format and that it parses to a real date
    const isValidDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + "T00:00:00Z").getTime());

    const hasCustomRange = fromParam && toParam && isValidDate(fromParam) && isValidDate(toParam);

    // Primary range: use custom from/to if provided, otherwise default 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const rangeFrom = hasCustomRange ? fromParam : thirtyDaysAgo.toISOString().slice(0, 10);
    // Add one day to 'to' so that the entire end date is included in gte/lte comparisons
    const rangeTo = hasCustomRange ? toParam + "T23:59:59" : null;

    // Extended range for daily volume + estimate pipeline: custom range or 90-day default
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(now.getDate() - 90);
    const extendedFrom = hasCustomRange ? fromParam : ninetyDaysAgo.toISOString().slice(0, 10);
    const extendedTo = rangeTo;

    // ── Calls by hour of day ──
    const callsByHour = await db
      .select({
        hour: sql<number>`cast(strftime('%H', ${calls.createdAt}) as integer)`.as("hour"),
        total: count(),
      })
      .from(calls)
      .where(and(eq(calls.businessId, businessId), gte(calls.createdAt, rangeFrom), ...(rangeTo ? [lte(calls.createdAt, rangeTo)] : [])))
      .groupBy(sql`strftime('%H', ${calls.createdAt})`)
      .orderBy(sql`hour`);

    // ── Calls by day of week ──
    const callsByDay = await db
      .select({
        day: sql<number>`cast(strftime('%w', ${calls.createdAt}) as integer)`.as("day"),
        total: count(),
      })
      .from(calls)
      .where(and(eq(calls.businessId, businessId), gte(calls.createdAt, rangeFrom), ...(rangeTo ? [lte(calls.createdAt, rangeTo)] : [])))
      .groupBy(sql`strftime('%w', ${calls.createdAt})`)
      .orderBy(sql`day`);

    // ── Daily call volume ──
    const dailyVolume = await db
      .select({
        date: sql<string>`date(${calls.createdAt})`.as("date"),
        total: count(),
        missed: sql<number>`sum(case when ${calls.status} = 'missed' then 1 else 0 end)`,
        answered: sql<number>`sum(case when ${calls.status} = 'completed' then 1 else 0 end)`,
      })
      .from(calls)
      .where(and(eq(calls.businessId, businessId), gte(calls.createdAt, extendedFrom), ...(extendedTo ? [lte(calls.createdAt, extendedTo)] : [])))
      .groupBy(sql`date(${calls.createdAt})`)
      .orderBy(sql`date(${calls.createdAt})`);

    // ── Call duration distribution ──
    const durationBuckets = await db
      .select({
        bucket: sql<string>`case
          when ${calls.duration} < 60 then 'under_1min'
          when ${calls.duration} < 180 then '1_3min'
          when ${calls.duration} < 300 then '3_5min'
          when ${calls.duration} < 600 then '5_10min'
          else 'over_10min'
        end`.as("bucket"),
        total: count(),
      })
      .from(calls)
      .where(and(
        eq(calls.businessId, businessId),
        gte(calls.createdAt, rangeFrom),
        ...(rangeTo ? [lte(calls.createdAt, rangeTo)] : []),
        sql`${calls.duration} IS NOT NULL`,
      ))
      .groupBy(sql`bucket`);

    // ── Language breakdown ──
    const languageBreakdown = await db
      .select({
        language: calls.language,
        total: count(),
      })
      .from(calls)
      .where(and(eq(calls.businessId, businessId), gte(calls.createdAt, rangeFrom), ...(rangeTo ? [lte(calls.createdAt, rangeTo)] : [])))
      .groupBy(calls.language);

    // ── Missed call recovery rate ──
    const [recoveryStats] = await db
      .select({
        totalMissed: sql<number>`sum(case when ${calls.status} = 'missed' then 1 else 0 end)`,
        recovered: sql<number>`sum(case when ${calls.status} = 'missed' and ${calls.recoveryStatus} = 'recovered' then 1 else 0 end)`,
        smsSent: sql<number>`sum(case when ${calls.status} = 'missed' and ${calls.recoveryStatus} IS NOT NULL then 1 else 0 end)`,
      })
      .from(calls)
      .where(and(eq(calls.businessId, businessId), gte(calls.createdAt, rangeFrom), ...(rangeTo ? [lte(calls.createdAt, rangeTo)] : [])));

    // ── Top services booked ──
    const topServices = await db
      .select({
        service: appointments.service,
        total: count(),
      })
      .from(appointments)
      .where(and(
        eq(appointments.businessId, businessId),
        gte(appointments.createdAt, rangeFrom),
        ...(rangeTo ? [lte(appointments.createdAt, rangeTo)] : []),
        sql`${appointments.service} IS NOT NULL`,
      ))
      .groupBy(appointments.service)
      .orderBy(desc(count()))
      .limit(8);

    // ── Estimate pipeline ──
    const estimatePipeline = await db
      .select({
        status: estimates.status,
        total: count(),
        value: sql<number>`coalesce(sum(${estimates.amount}), 0)`,
      })
      .from(estimates)
      .where(and(eq(estimates.businessId, businessId), gte(estimates.createdAt, extendedFrom), ...(extendedTo ? [lte(estimates.createdAt, extendedTo)] : [])))
      .groupBy(estimates.status);

    // ── Estimate close rate ──
    const wonCount = estimatePipeline.find(e => e.status === "won")?.total ?? 0;
    const lostCount = estimatePipeline.find(e => e.status === "lost")?.total ?? 0;
    const closeRate = (wonCount + lostCount) > 0
      ? Math.round((wonCount / (wonCount + lostCount)) * 100)
      : null;

    // ── Outbound call summary ──
    const outboundByType = await db
      .select({
        callType: outboundCalls.callType,
        total: count(),
        answered: sql<number>`sum(case when ${outboundCalls.status} = 'completed' then 1 else 0 end)`,
      })
      .from(outboundCalls)
      .where(and(eq(outboundCalls.businessId, businessId), gte(outboundCalls.createdAt, rangeFrom), ...(rangeTo ? [lte(outboundCalls.createdAt, rangeTo)] : [])))
      .groupBy(outboundCalls.callType);

    const outboundTotal = outboundByType.reduce((s, o) => s + o.total, 0);
    const outboundAnswered = outboundByType.reduce((s, o) => s + (o.answered ?? 0), 0);
    const outboundSummary = {
      total: outboundTotal,
      answered: outboundAnswered,
      answerRate: outboundTotal > 0 ? Math.round((outboundAnswered / outboundTotal) * 100) : 0,
      byType: outboundByType,
    };

    // ── New vs repeat callers ──
    const [callerStats] = await db
      .select({
        total: count(),
        repeat: sql<number>`sum(case when ${customers.isRepeat} = 1 then 1 else 0 end)`,
      })
      .from(customers)
      .where(and(eq(customers.businessId, businessId), gte(customers.lastCallAt, rangeFrom), ...(rangeTo ? [lte(customers.lastCallAt, rangeTo)] : [])));

    // ── AI coaching insights (QA scores) ──
    const qaScores = await db
      .select({
        score: callQaScores.score,
        breakdown: callQaScores.breakdown,
        flags: callQaScores.flags,
        fixRecommendation: callQaScores.fixRecommendation,
      })
      .from(callQaScores)
      .where(and(eq(callQaScores.businessId, businessId), gte(callQaScores.createdAt, rangeFrom), ...(rangeTo ? [lte(callQaScores.createdAt, rangeTo)] : [])));

    const avgQaScore = qaScores.length > 0
      ? Math.round(qaScores.reduce((s, q) => s + q.score, 0) / qaScores.length)
      : null;

    // Aggregate breakdown averages
    const breakdownTotals = { greeting: 0, languageMatch: 0, needCapture: 0, actionTaken: 0, accuracy: 0, sentiment: 0 };
    let breakdownCount = 0;
    for (const q of qaScores) {
      if (q.breakdown) {
        breakdownTotals.greeting += q.breakdown.greeting;
        breakdownTotals.languageMatch += q.breakdown.languageMatch;
        breakdownTotals.needCapture += q.breakdown.needCapture;
        breakdownTotals.actionTaken += q.breakdown.actionTaken;
        breakdownTotals.accuracy += q.breakdown.accuracy;
        breakdownTotals.sentiment += q.breakdown.sentiment;
        breakdownCount++;
      }
    }
    const avgBreakdown = breakdownCount > 0
      ? {
          greeting: Math.round(breakdownTotals.greeting / breakdownCount),
          languageMatch: Math.round(breakdownTotals.languageMatch / breakdownCount),
          needCapture: Math.round(breakdownTotals.needCapture / breakdownCount),
          actionTaken: Math.round(breakdownTotals.actionTaken / breakdownCount),
          accuracy: Math.round(breakdownTotals.accuracy / breakdownCount),
          sentiment: Math.round(breakdownTotals.sentiment / breakdownCount),
        }
      : null;

    // Find weakest area for coaching suggestion
    let coachingSuggestion: string | null = null;
    if (avgBreakdown) {
      const areas = Object.entries(avgBreakdown) as [string, number][];
      const weakest = areas.reduce((min, curr) => curr[1] < min[1] ? curr : min);
      const areaLabels: Record<string, string> = {
        greeting: "greeting quality",
        languageMatch: "language matching",
        needCapture: "capturing customer needs",
        actionTaken: "taking appropriate action",
        accuracy: "information accuracy",
        sentiment: "customer sentiment handling",
      };
      if (weakest[1] < 80) {
        coachingSuggestion = `Focus on improving ${areaLabels[weakest[0]] || weakest[0]} (avg: ${weakest[1]}%)`;
      }
    }

    // Common flags
    const flagCounts: Record<string, number> = {};
    for (const q of qaScores) {
      if (q.flags) {
        for (const flag of q.flags) {
          flagCounts[flag] = (flagCounts[flag] ?? 0) + 1;
        }
      }
    }
    const topFlags = Object.entries(flagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([flag, count]) => ({ flag, count }));

    // Recent fix recommendations
    const recentRecs = qaScores
      .filter((q) => q.fixRecommendation)
      .slice(0, 3)
      .map((q) => q.fixRecommendation!);

    const aiCoaching = {
      avgScore: avgQaScore,
      totalScored: qaScores.length,
      avgBreakdown,
      coachingSuggestion,
      topFlags,
      recentRecommendations: recentRecs,
    };

    return NextResponse.json({
      callsByHour: padHours(callsByHour),
      callsByDay: padDays(callsByDay),
      dailyVolume,
      durationBuckets: normalizeBuckets(durationBuckets),
      languageBreakdown,
      recoveryStats: {
        totalMissed: recoveryStats?.totalMissed ?? 0,
        recovered: recoveryStats?.recovered ?? 0,
        smsSent: recoveryStats?.smsSent ?? 0,
        rate: recoveryStats?.totalMissed
          ? Math.round(((recoveryStats.recovered ?? 0) / recoveryStats.totalMissed) * 100)
          : 0,
      },
      topServices,
      estimatePipeline,
      closeRate,
      outboundSummary,
      callerStats: {
        total: callerStats?.total ?? 0,
        repeat: callerStats?.repeat ?? 0,
        new: (callerStats?.total ?? 0) - (callerStats?.repeat ?? 0),
      },
      aiCoaching,
    });
  } catch (error) {
    reportError("Reporting API error", error as Error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function padHours(data: { hour: number; total: number }[]) {
  const map = new Map(data.map((d) => [d.hour, d.total]));
  return Array.from({ length: 24 }, (_, i) => ({ hour: i, total: map.get(i) ?? 0 }));
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function padDays(data: { day: number; total: number }[]) {
  const map = new Map(data.map((d) => [d.day, d.total]));
  return Array.from({ length: 7 }, (_, i) => ({ day: i, label: DAY_LABELS[i], total: map.get(i) ?? 0 }));
}

const BUCKET_ORDER = ["under_1min", "1_3min", "3_5min", "5_10min", "over_10min"];
const BUCKET_LABELS: Record<string, string> = {
  under_1min: "< 1 min", "1_3min": "1-3 min", "3_5min": "3-5 min", "5_10min": "5-10 min", over_10min: "10+ min",
};
function normalizeBuckets(data: { bucket: string; total: number }[]) {
  const map = new Map(data.map((d) => [d.bucket, d.total]));
  return BUCKET_ORDER.map((b) => ({ bucket: b, label: BUCKET_LABELS[b], total: map.get(b) ?? 0 }));
}

function getDemoReporting() {
  return {
    callsByHour: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      total: i >= 7 && i <= 19 ? Math.floor(Math.random() * 8) + 2 : Math.floor(Math.random() * 2),
    })),
    callsByDay: [
      { day: 0, label: "Sun", total: 4 }, { day: 1, label: "Mon", total: 18 },
      { day: 2, label: "Tue", total: 15 }, { day: 3, label: "Wed", total: 20 },
      { day: 4, label: "Thu", total: 17 }, { day: 5, label: "Fri", total: 14 },
      { day: 6, label: "Sat", total: 7 },
    ],
    dailyVolume: [],
    durationBuckets: [
      { bucket: "under_1min", label: "< 1 min", total: 8 },
      { bucket: "1_3min", label: "1-3 min", total: 25 },
      { bucket: "3_5min", label: "3-5 min", total: 35 },
      { bucket: "5_10min", label: "5-10 min", total: 18 },
      { bucket: "over_10min", label: "10+ min", total: 6 },
    ],
    languageBreakdown: [
      { language: "en", total: 72 }, { language: "es", total: 23 },
    ],
    recoveryStats: { totalMissed: 12, recovered: 8, smsSent: 12, rate: 67 },
    topServices: [
      { service: "AC Repair", total: 15 }, { service: "Plumbing Emergency", total: 12 },
      { service: "Water Heater", total: 8 }, { service: "Drain Cleaning", total: 6 },
    ],
    estimatePipeline: [
      { status: "new", total: 5, value: 12500 }, { status: "sent", total: 8, value: 24000 },
      { status: "won", total: 12, value: 35000 }, { status: "lost", total: 3, value: 8000 },
    ],
    callerStats: { total: 45, repeat: 18, new: 27 },
    closeRate: 80,
    outboundSummary: {
      total: 34,
      answered: 26,
      answerRate: 76,
      byType: [
        { callType: "appointment_reminder", total: 18, answered: 15 },
        { callType: "estimate_followup", total: 10, answered: 7 },
        { callType: "seasonal_reminder", total: 6, answered: 4 },
      ],
    },
    aiCoaching: {
      avgScore: 87,
      totalScored: 92,
      avgBreakdown: {
        greeting: 92,
        languageMatch: 95,
        needCapture: 85,
        actionTaken: 88,
        accuracy: 82,
        sentiment: 90,
      },
      coachingSuggestion: "Focus on improving information accuracy (avg: 82%)",
      topFlags: [
        { flag: "pricing_question_deferred", count: 8 },
        { flag: "long_hold_time", count: 4 },
      ],
      recentRecommendations: [
        "Add pricing information for common services to knowledge base",
        "Improve emergency detection for HVAC-specific terms",
      ],
    },
  };
}
