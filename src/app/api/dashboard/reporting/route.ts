import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { calls, appointments, customers, estimates } from "@/db/schema";
import { eq, and, sql, gte, count, desc } from "drizzle-orm";
import { DEMO_BUSINESS_ID } from "../demo-data";
import { reportError } from "@/lib/error-reporting";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json(getDemoReporting());
  }

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const thirtyDaysStr = thirtyDaysAgo.toISOString().slice(0, 10);
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(now.getDate() - 90);
    const ninetyDaysStr = ninetyDaysAgo.toISOString().slice(0, 10);

    // ── Calls by hour of day (last 30 days) ──
    const callsByHour = await db
      .select({
        hour: sql<number>`cast(strftime('%H', ${calls.createdAt}) as integer)`.as("hour"),
        total: count(),
      })
      .from(calls)
      .where(and(eq(calls.businessId, businessId), gte(calls.createdAt, thirtyDaysStr)))
      .groupBy(sql`strftime('%H', ${calls.createdAt})`)
      .orderBy(sql`hour`);

    // ── Calls by day of week (last 30 days) ──
    const callsByDay = await db
      .select({
        day: sql<number>`cast(strftime('%w', ${calls.createdAt}) as integer)`.as("day"),
        total: count(),
      })
      .from(calls)
      .where(and(eq(calls.businessId, businessId), gte(calls.createdAt, thirtyDaysStr)))
      .groupBy(sql`strftime('%w', ${calls.createdAt})`)
      .orderBy(sql`day`);

    // ── Daily call volume (last 90 days) ──
    const dailyVolume = await db
      .select({
        date: sql<string>`date(${calls.createdAt})`.as("date"),
        total: count(),
        missed: sql<number>`sum(case when ${calls.status} = 'missed' then 1 else 0 end)`,
        answered: sql<number>`sum(case when ${calls.status} = 'completed' then 1 else 0 end)`,
      })
      .from(calls)
      .where(and(eq(calls.businessId, businessId), gte(calls.createdAt, ninetyDaysStr)))
      .groupBy(sql`date(${calls.createdAt})`)
      .orderBy(sql`date(${calls.createdAt})`);

    // ── Call duration distribution (last 30 days) ──
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
        gte(calls.createdAt, thirtyDaysStr),
        sql`${calls.duration} IS NOT NULL`,
      ))
      .groupBy(sql`bucket`);

    // ── Language breakdown (last 30 days) ──
    const languageBreakdown = await db
      .select({
        language: calls.language,
        total: count(),
      })
      .from(calls)
      .where(and(eq(calls.businessId, businessId), gte(calls.createdAt, thirtyDaysStr)))
      .groupBy(calls.language);

    // ── Missed call recovery rate (last 30 days) ──
    const [recoveryStats] = await db
      .select({
        totalMissed: sql<number>`sum(case when ${calls.status} = 'missed' then 1 else 0 end)`,
        recovered: sql<number>`sum(case when ${calls.status} = 'missed' and ${calls.recoveryStatus} = 'recovered' then 1 else 0 end)`,
        smsSent: sql<number>`sum(case when ${calls.status} = 'missed' and ${calls.recoveryStatus} IS NOT NULL then 1 else 0 end)`,
      })
      .from(calls)
      .where(and(eq(calls.businessId, businessId), gte(calls.createdAt, thirtyDaysStr)));

    // ── Top services booked (last 30 days) ──
    const topServices = await db
      .select({
        service: appointments.service,
        total: count(),
      })
      .from(appointments)
      .where(and(
        eq(appointments.businessId, businessId),
        gte(appointments.createdAt, thirtyDaysStr),
        sql`${appointments.service} IS NOT NULL`,
      ))
      .groupBy(appointments.service)
      .orderBy(desc(count()))
      .limit(8);

    // ── Estimate pipeline (last 30 days) ──
    const estimatePipeline = await db
      .select({
        status: estimates.status,
        total: count(),
        value: sql<number>`coalesce(sum(${estimates.amount}), 0)`,
      })
      .from(estimates)
      .where(and(eq(estimates.businessId, businessId), gte(estimates.createdAt, ninetyDaysStr)))
      .groupBy(estimates.status);

    // ── Estimate close rate ──
    const wonCount = estimatePipeline.find(e => e.status === "won")?.total ?? 0;
    const lostCount = estimatePipeline.find(e => e.status === "lost")?.total ?? 0;
    const closeRate = (wonCount + lostCount) > 0
      ? Math.round((wonCount / (wonCount + lostCount)) * 100)
      : null;

    // ── New vs repeat callers (last 30 days) ──
    const [callerStats] = await db
      .select({
        total: count(),
        repeat: sql<number>`sum(case when ${customers.isRepeat} = 1 then 1 else 0 end)`,
      })
      .from(customers)
      .where(and(eq(customers.businessId, businessId), gte(customers.lastCallAt, thirtyDaysStr)));

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
      callerStats: {
        total: callerStats?.total ?? 0,
        repeat: callerStats?.repeat ?? 0,
        new: (callerStats?.total ?? 0) - (callerStats?.repeat ?? 0),
      },
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
  };
}
