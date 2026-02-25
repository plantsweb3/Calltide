import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { calls, appointments, smsMessages, businesses, leads } from "@/db/schema";
import { eq, and, sql, gte, lte, count, desc, or, inArray } from "drizzle-orm";
import { DEMO_BUSINESS_ID, DEMO_OVERVIEW } from "../demo-data";

export async function GET(req: NextRequest) {
  const businessId = req.headers.get("x-business-id");
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (businessId === DEMO_BUSINESS_ID) {
    return NextResponse.json(DEMO_OVERVIEW);
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  // Start of this week (Monday)
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diff);
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  // Start of this month
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  // Start of last month (for comparison)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStart = lastMonth.toISOString().slice(0, 10);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

  // ── Get business info (for avgJobValue and name) ──
  const [biz] = await db
    .select({ name: businesses.name, avgJobValue: businesses.avgJobValue })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  const avgJobValue = biz?.avgJobValue || 250;

  // ── Basic counts (always returned) ──
  const [callsToday] = await db
    .select({ count: count() })
    .from(calls)
    .where(and(eq(calls.businessId, businessId), sql`date(${calls.createdAt}) = ${today}`));

  const [appointmentsThisWeekResult] = await db
    .select({ count: count() })
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, businessId),
        or(eq(appointments.status, "confirmed"), eq(appointments.status, "completed")),
        gte(appointments.date, weekStartStr),
        lte(appointments.date, weekEndStr),
      ),
    );

  const [missedCallsSaved] = await db
    .select({ count: count() })
    .from(calls)
    .where(
      and(
        eq(calls.businessId, businessId),
        eq(calls.status, "missed"),
        sql`${calls.summary} IS NOT NULL`,
      ),
    );

  const [totalCallsResult] = await db
    .select({ count: count() })
    .from(calls)
    .where(eq(calls.businessId, businessId));

  const basicResponse = {
    callsToday: callsToday.count,
    appointmentsThisWeek: appointmentsThisWeekResult.count,
    missedCallsSaved: missedCallsSaved.count,
    totalCalls: totalCallsResult.count,
  };

  // ── Enhanced metrics (wrapped so basic always returns) ──
  try {

  // Revenue this month = appointments booked this month × avgJobValue
  const [appointmentsThisMonth] = await db
    .select({ count: count() })
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, businessId),
        or(eq(appointments.status, "confirmed"), eq(appointments.status, "completed")),
        gte(appointments.date, monthStart),
      ),
    );

  const [appointmentsLastMonth] = await db
    .select({ count: count() })
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, businessId),
        or(eq(appointments.status, "confirmed"), eq(appointments.status, "completed")),
        gte(appointments.date, lastMonthStart),
        lte(appointments.date, lastMonthEnd),
      ),
    );

  const revenueThisMonth = appointmentsThisMonth.count * avgJobValue;
  const revenueLastMonth = appointmentsLastMonth.count * avgJobValue;
  const revenueChange = revenueLastMonth > 0
    ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : revenueThisMonth > 0 ? 100 : 0;

  // Missed calls that got recovered (missed call → later appointment booked for same lead)
  const missedCallsRecoveredRows = await db
    .select({ id: calls.id, leadId: calls.leadId })
    .from(calls)
    .where(
      and(
        eq(calls.businessId, businessId),
        eq(calls.status, "missed"),
        sql`${calls.leadId} IS NOT NULL`,
      ),
    );

  let missedCallsRecoveredCount = 0;
  let revenueSaved = 0;
  if (missedCallsRecoveredRows.length > 0) {
    const leadIds = missedCallsRecoveredRows
      .map((c) => c.leadId)
      .filter((id): id is string => !!id);

    if (leadIds.length > 0) {
      const [recovered] = await db
        .select({ count: count() })
        .from(appointments)
        .where(
          and(
            eq(appointments.businessId, businessId),
            or(eq(appointments.status, "confirmed"), eq(appointments.status, "completed")),
            inArray(appointments.leadId, leadIds),
          ),
        );
      missedCallsRecoveredCount = recovered.count;
      revenueSaved = missedCallsRecoveredCount * avgJobValue;
    }
  }

  const monthlyPlanCost = 497;
  const roiMultiple = monthlyPlanCost > 0
    ? Math.round((revenueThisMonth / monthlyPlanCost) * 10) / 10
    : 0;
  const costPerLead = appointmentsThisMonth.count > 0
    ? Math.round((monthlyPlanCost / appointmentsThisMonth.count) * 100) / 100
    : 0;

  // ── Weekly summary ──
  const weekCallRows = await db
    .select({
      id: calls.id,
      language: calls.language,
      duration: calls.duration,
      status: calls.status,
      createdAt: calls.createdAt,
    })
    .from(calls)
    .where(
      and(
        eq(calls.businessId, businessId),
        sql`date(${calls.createdAt}) >= ${weekStartStr}`,
        sql`date(${calls.createdAt}) <= ${weekEndStr}`,
      ),
    );

  const weekAppointments = await db
    .select({ service: appointments.service })
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, businessId),
        gte(appointments.date, weekStartStr),
        lte(appointments.date, weekEndStr),
      ),
    );

  // Language breakdown
  const enCalls = weekCallRows.filter((c) => c.language !== "es").length;
  const esCalls = weekCallRows.filter((c) => c.language === "es").length;

  // Average call duration
  const durations = weekCallRows.map((c) => c.duration).filter((d): d is number => d != null && d > 0);
  const avgCallDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  // Busiest hour
  const hourCounts: Record<number, number> = {};
  for (const c of weekCallRows) {
    const h = new Date(c.createdAt).getHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  }
  const busiestHourNum = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const busiestHour = busiestHourNum != null
    ? `${parseInt(busiestHourNum) % 12 || 12}${parseInt(busiestHourNum) >= 12 ? "PM" : "AM"} - ${(parseInt(busiestHourNum) + 1) % 12 || 12}${(parseInt(busiestHourNum) + 1) >= 12 ? "PM" : "AM"}`
    : "N/A";

  // Top service
  const serviceCounts: Record<string, number> = {};
  for (const a of weekAppointments) {
    serviceCounts[a.service] = (serviceCounts[a.service] || 0) + 1;
  }
  const sortedServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);
  const topServiceName = sortedServices[0]?.[0] || "N/A";
  const topServicePct = weekAppointments.length > 0
    ? Math.round(((sortedServices[0]?.[1] || 0) / weekAppointments.length) * 100)
    : 0;
  const trendingService = sortedServices[1]?.[0] || sortedServices[0]?.[0] || "N/A";

  // Missed recovered this week
  const weekMissed = weekCallRows.filter((c) => c.status === "missed");
  const weekMissedRecovered = weekMissed.length; // simplified: we count missed that have summary

  const estimatedWeekRevenue = weekAppointments.length * avgJobValue;

  const weeklySummary = {
    totalCalls: weekCallRows.length,
    appointmentsBooked: weekAppointments.length,
    estimatedRevenue: estimatedWeekRevenue,
    missedCallsRecovered: missedCallsRecoveredCount,
    avgCallDuration,
    busiestHour,
    trendingService,
    topService: { name: topServiceName, percentage: topServicePct },
    languageBreakdown: { en: enCalls, es: esCalls },
  };

  // ── Activity feed (last 20 events: calls + SMS merged by time) ──
  const recentCalls = await db
    .select({
      id: calls.id,
      status: calls.status,
      callerPhone: calls.callerPhone,
      language: calls.language,
      duration: calls.duration,
      createdAt: calls.createdAt,
      leadName: leads.name,
    })
    .from(calls)
    .leftJoin(leads, eq(calls.leadId, leads.id))
    .where(eq(calls.businessId, businessId))
    .orderBy(desc(calls.createdAt))
    .limit(15);

  const recentSms = await db
    .select({
      id: smsMessages.id,
      direction: smsMessages.direction,
      toNumber: smsMessages.toNumber,
      body: smsMessages.body,
      templateType: smsMessages.templateType,
      createdAt: smsMessages.createdAt,
    })
    .from(smsMessages)
    .where(eq(smsMessages.businessId, businessId))
    .orderBy(desc(smsMessages.createdAt))
    .limit(10);

  const recentAppointments = await db
    .select({
      id: appointments.id,
      service: appointments.service,
      date: appointments.date,
      time: appointments.time,
      createdAt: appointments.createdAt,
      leadName: leads.name,
    })
    .from(appointments)
    .leftJoin(leads, eq(appointments.leadId, leads.id))
    .where(eq(appointments.businessId, businessId))
    .orderBy(desc(appointments.createdAt))
    .limit(10);

  type FeedEvent = {
    id: string;
    time: string;
    type: string;
    title: string;
    description: string;
    person: string;
    language?: string;
    value?: number;
    recovered?: boolean;
    urgent?: boolean;
  };

  const feedEvents: FeedEvent[] = [];

  for (const c of recentCalls) {
    const person = c.leadName || c.callerPhone || "Unknown";
    if (c.status === "completed") {
      feedEvents.push({
        id: c.id,
        time: c.createdAt,
        type: "call_completed",
        title: "Call Handled",
        description: `${Math.round((c.duration || 0) / 60)}min call${c.language === "es" ? " (Spanish)" : ""}`,
        person,
        language: c.language || undefined,
        value: avgJobValue,
      });
    } else if (c.status === "missed") {
      feedEvents.push({
        id: c.id,
        time: c.createdAt,
        type: "call_missed",
        title: "Missed Call",
        description: "AI sent follow-up SMS automatically",
        person,
        language: c.language || undefined,
        urgent: true,
      });
    }
  }

  for (const s of recentSms) {
    feedEvents.push({
      id: s.id,
      time: s.createdAt,
      type: s.direction === "outbound" ? "sms_sent" : "sms_received",
      title: s.direction === "outbound" ? "SMS Sent" : "SMS Received",
      description: s.body.length > 60 ? s.body.slice(0, 60) + "..." : s.body,
      person: s.toNumber,
    });
  }

  for (const a of recentAppointments) {
    feedEvents.push({
      id: a.id,
      time: a.createdAt,
      type: "appointment_booked",
      title: "Appointment Booked",
      description: `${a.service} on ${a.date} at ${a.time}`,
      person: a.leadName || "Unknown",
      value: avgJobValue,
    });
  }

  // Sort by time descending, take top 20
  feedEvents.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const activityFeed = feedEvents.slice(0, 20);

  // ── Bilingual stats ──
  const [totalCallsForLang] = await db
    .select({ count: count() })
    .from(calls)
    .where(and(eq(calls.businessId, businessId), sql`${calls.language} IS NOT NULL`));

  const [spanishCalls] = await db
    .select({ count: count() })
    .from(calls)
    .where(and(eq(calls.businessId, businessId), eq(calls.language, "es")));

  const bilingualStats = {
    spanishCalls: spanishCalls.count,
    totalCalls: totalCallsForLang.count,
    percentage: totalCallsForLang.count > 0
      ? Math.round((spanishCalls.count / totalCallsForLang.count) * 100)
      : 0,
  };

  // ── AI Insights (generated from data patterns) ──
  const insights: Array<{ text: string; icon: string }> = [];

  if (busiestHourNum != null) {
    insights.push({
      text: `Your busiest time is ${busiestHour}. Consider staffing accordingly.`,
      icon: "clock",
    });
  }

  if (bilingualStats.percentage >= 15) {
    insights.push({
      text: `${bilingualStats.percentage}% of your callers speak Spanish. Your bilingual AI is capturing revenue competitors miss.`,
      icon: "globe",
    });
  }

  if (missedCallsRecoveredCount > 0) {
    insights.push({
      text: `${missedCallsRecoveredCount} missed calls were recovered into appointments worth ~$${revenueSaved.toLocaleString()}.`,
      icon: "recovery",
    });
  }

  if (topServiceName !== "N/A") {
    insights.push({
      text: `"${topServiceName}" is your most requested service at ${topServicePct}% of bookings.`,
      icon: "trending",
    });
  }

  if (avgCallDuration > 0) {
    insights.push({
      text: `Average call duration is ${Math.round(avgCallDuration / 60)}m ${avgCallDuration % 60}s — your AI handles calls efficiently.`,
      icon: "speed",
    });
  }

  // Ensure at least one insight
  if (insights.length === 0) {
    insights.push({
      text: "Your AI receptionist is ready and learning. Insights will appear as more calls come in.",
      icon: "sparkle",
    });
  }

  return NextResponse.json({
    ...basicResponse,
    // Enhanced fields
    businessName: biz?.name,
    revenueThisMonth,
    revenueSaved,
    costPerLead,
    roiMultiple,
    weeklySummary,
    activityFeed,
    insights,
    bilingualStats,
  });

  } catch (err) {
    console.error("Enhanced metrics failed, returning basic:", err);
    return NextResponse.json(basicResponse);
  }
}
