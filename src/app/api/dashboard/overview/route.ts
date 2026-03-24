import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { calls, appointments, smsMessages, businesses, leads, estimates, customers } from "@/db/schema";
import { eq, and, sql, gte, lte, count, desc, or, inArray, isNull } from "drizzle-orm";
import { DEMO_BUSINESS_ID, DEMO_OVERVIEW } from "../demo-data";
import { reportError } from "@/lib/error-reporting";
import { getMrrForPlan } from "@/lib/stripe-prices";
import type { PlanType } from "@/lib/stripe-prices";

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
    .select({
      name: businesses.name,
      avgJobValue: businesses.avgJobValue,
      businessHours: businesses.businessHours,
      greeting: businesses.greeting,
      hasPricingEnabled: businesses.hasPricingEnabled,
      setupChecklistDismissed: businesses.setupChecklistDismissed,
      tourCompleted: businesses.tourCompleted,
      createdAt: businesses.createdAt,
      healthScore: businesses.healthScore,
      planType: businesses.planType,
    })
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

  // Detect first call — show celebration when totalCalls is 1-3 (fresh milestone)
  let firstCallCelebration: {
    show: boolean;
    callId?: string;
    callerName?: string;
    duration?: number;
    service?: string;
  } | undefined;

  if (totalCallsResult.count >= 1 && totalCallsResult.count <= 3) {
    const [firstCall] = await db
      .select({
        id: calls.id,
        duration: calls.duration,
        createdAt: calls.createdAt,
        leadId: calls.leadId,
      })
      .from(calls)
      .where(and(eq(calls.businessId, businessId), eq(calls.status, "completed")))
      .orderBy(calls.createdAt)
      .limit(1);

    if (firstCall) {
      let callerName: string | undefined;
      if (firstCall.leadId) {
        const [lead] = await db
          .select({ name: leads.name })
          .from(leads)
          .where(eq(leads.id, firstCall.leadId))
          .limit(1);
        callerName = lead?.name || undefined;
      }

      // Check if call was within last 7 days (show celebration for a week)
      const callAge = Date.now() - new Date(firstCall.createdAt).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (callAge < sevenDays) {
        firstCallCelebration = {
          show: true,
          callId: firstCall.id,
          callerName,
          duration: firstCall.duration || undefined,
        };
      }
    }
  }

  // ── Revenue metrics (always calculated for all clients) ──
  // After-hours calls this week
  const [afterHoursWeek] = await db
    .select({ count: count() })
    .from(calls)
    .where(
      and(
        eq(calls.businessId, businessId),
        eq(calls.isAfterHours, true),
        sql`date(${calls.createdAt}) >= ${weekStartStr}`,
        sql`date(${calls.createdAt}) <= ${weekEndStr}`,
      ),
    );

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

  // After-hours calls this month
  const [afterHoursMonth] = await db
    .select({ count: count() })
    .from(calls)
    .where(
      and(
        eq(calls.businessId, businessId),
        eq(calls.isAfterHours, true),
        gte(calls.createdAt, monthStart),
      ),
    );

  // Spanish calls this month
  const [spanishCallsMonth] = await db
    .select({ count: count() })
    .from(calls)
    .where(
      and(
        eq(calls.businessId, businessId),
        eq(calls.language, "es"),
        gte(calls.createdAt, monthStart),
      ),
    );

  // "Maria saved you" = missed recovered + after-hours × 25% conversion + Spanish × 25% conversion
  const afterHoursSaved = Math.round((afterHoursMonth.count) * avgJobValue * 0.25);
  const spanishSaved = Math.round((spanishCallsMonth.count) * avgJobValue * 0.25);
  const mariaSavedYou = revenueSaved + afterHoursSaved + spanishSaved;

  const planType = (biz?.planType === "annual" ? "annual" : "monthly") as PlanType;
  const monthlyPlanCost = getMrrForPlan(planType) / 100;
  const roiMultiple = monthlyPlanCost > 0
    ? Math.round((revenueThisMonth / monthlyPlanCost) * 10) / 10
    : 0;
  const costPerLead = appointmentsThisMonth.count > 0
    ? Math.round((monthlyPlanCost / appointmentsThisMonth.count) * 100) / 100
    : 0;

  const basicResponse = {
    callsToday: callsToday.count,
    appointmentsThisWeek: appointmentsThisWeekResult.count,
    missedCallsSaved: missedCallsSaved.count,
    totalCalls: totalCallsResult.count,
    firstCallCelebration,
    businessName: biz?.name,
    businessHours: biz?.businessHours,
    greeting: biz?.greeting,
    hasPricing: biz?.hasPricingEnabled ?? false,
    setupChecklistDismissed: biz?.setupChecklistDismissed ?? false,
    tourCompleted: biz?.tourCompleted ?? false,
    createdAt: biz?.createdAt,
    healthScore: biz?.healthScore ?? 50,
    // Revenue — always available for all clients
    revenueThisMonth,
    revenueChange,
    revenueSaved,
    missedCallsRecoveredCount,
    costPerLead,
    roiMultiple,
    afterHoursThisWeek: afterHoursWeek.count,
    mariaSavedYou,
    mariaSavedBreakdown: {
      missedRecovered: revenueSaved,
      afterHours: afterHoursSaved,
      afterHoursCount: afterHoursMonth.count,
      spanish: spanishSaved,
      spanishCount: spanishCallsMonth.count,
    },
  };

  // ── Enhanced metrics (wrapped so basic always returns) ──
  try {

  // Abandoned call recovery stats (SMS recovery for < 15s calls)
  const [abandonedTotal] = await db
    .select({ count: count() })
    .from(calls)
    .where(
      and(
        eq(calls.businessId, businessId),
        eq(calls.isAbandoned, true),
      ),
    );

  const [abandonedRecovered] = await db
    .select({ count: count() })
    .from(calls)
    .where(
      and(
        eq(calls.businessId, businessId),
        eq(calls.isAbandoned, true),
        eq(calls.recoveryStatus, "callback_requested"),
      ),
    );

  const abandonedCallRecovery = {
    total: abandonedTotal.count,
    smsSent: 0,
    callbackRequested: abandonedRecovered.count,
    conversionRate: abandonedTotal.count > 0
      ? Math.round((abandonedRecovered.count / abandonedTotal.count) * 100)
      : 0,
  };

  // Count SMS sent separately
  const [abandonedSmsSent] = await db
    .select({ count: count() })
    .from(calls)
    .where(
      and(
        eq(calls.businessId, businessId),
        eq(calls.isAbandoned, true),
        sql`${calls.recoveryStatus} IS NOT NULL`,
      ),
    );
  abandonedCallRecovery.smsSent = abandonedSmsSent.count;

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
      leadId: calls.leadId,
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
    chainId?: string;
    automationChain?: string[];
    isRecent?: boolean;
  };

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const feedEvents: FeedEvent[] = [];

  // Build a map of leadId → events for chain grouping
  const leadEventMap: Record<string, string[]> = {};

  for (const c of recentCalls) {
    const person = c.leadName || c.callerPhone || "Unknown";
    const chainId = c.leadId || c.id;
    const isRecent = c.createdAt > fiveMinAgo;

    if (c.status === "completed") {
      const chain = ["Call Answered"];
      // Check if this call led to an appointment
      const appt = recentAppointments.find((a) => a.leadName === c.leadName && c.leadName);
      if (appt) chain.push("Appointment Booked");
      if (c.language === "es") chain.unshift("Language Detected");

      feedEvents.push({
        id: c.id,
        time: c.createdAt,
        type: "call_completed",
        title: "Call Handled",
        description: `${Math.round((c.duration || 0) / 60)}min call${c.language === "es" ? " (Spanish)" : ""}`,
        person,
        language: c.language || undefined,
        value: avgJobValue,
        chainId,
        automationChain: chain,
        isRecent,
      });
      if (c.leadId) {
        if (!leadEventMap[c.leadId]) leadEventMap[c.leadId] = [];
        leadEventMap[c.leadId].push(c.id);
      }
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
        chainId,
        automationChain: ["Missed Call", "SMS Sent"],
        isRecent,
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
      isRecent: s.createdAt > fiveMinAgo,
    });
  }

  for (const a of recentAppointments) {
    const chainId = a.leadName || a.id;
    feedEvents.push({
      id: a.id,
      time: a.createdAt,
      type: "appointment_booked",
      title: "Appointment Booked",
      description: `${a.service} on ${a.date} at ${a.time}`,
      person: a.leadName || "Unknown",
      value: avgJobValue,
      chainId,
      automationChain: ["Call Answered", "Appointment Booked"],
      isRecent: a.createdAt > fiveMinAgo,
    });
  }

  // Sort by time descending, take top 20
  feedEvents.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // Determine newest event header text
  const newestEvent = feedEvents[0];
  const newestIsVeryRecent = newestEvent && newestEvent.time > twoMinAgo;

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

  // ── Estimate pipeline ──
  const estimateRows = await db
    .select({ status: estimates.status, amount: estimates.amount })
    .from(estimates)
    .where(eq(estimates.businessId, businessId));

  const estimatePipeline: Record<string, { count: number; value: number }> = {
    new: { count: 0, value: 0 },
    sent: { count: 0, value: 0 },
    follow_up: { count: 0, value: 0 },
    won: { count: 0, value: 0 },
    lost: { count: 0, value: 0 },
  };
  for (const e of estimateRows) {
    if (estimatePipeline[e.status]) {
      estimatePipeline[e.status].count++;
      estimatePipeline[e.status].value += e.amount || 0;
    }
  }
  const totalPipelineValue = estimatePipeline.new.value + estimatePipeline.sent.value + estimatePipeline.follow_up.value;

  // Won this month
  const [wonThisMonth] = await db
    .select({ count: count(), value: sql<number>`COALESCE(SUM(${estimates.amount}), 0)` })
    .from(estimates)
    .where(and(eq(estimates.businessId, businessId), eq(estimates.status, "won"), gte(estimates.wonAt, monthStart)));

  // ── Customer insights ──
  const [totalCustomers] = await db
    .select({ count: count() })
    .from(customers)
    .where(and(eq(customers.businessId, businessId), isNull(customers.deletedAt)));

  const [repeatCallers] = await db
    .select({ count: count() })
    .from(customers)
    .where(and(eq(customers.businessId, businessId), eq(customers.isRepeat, true), isNull(customers.deletedAt)));

  const [newCustomersThisMonth] = await db
    .select({ count: count() })
    .from(customers)
    .where(and(eq(customers.businessId, businessId), gte(customers.firstCallAt, monthStart), isNull(customers.deletedAt)));

  const topCustomers = await db
    .select({ name: customers.name, phone: customers.phone, totalCalls: customers.totalCalls })
    .from(customers)
    .where(and(eq(customers.businessId, businessId), isNull(customers.deletedAt)))
    .orderBy(desc(customers.totalCalls))
    .limit(3);

  const customerInsights = {
    totalCustomers: totalCustomers.count,
    repeatCallers: repeatCallers.count,
    repeatRate: totalCustomers.count > 0 ? Math.round((repeatCallers.count / totalCustomers.count) * 100) : 0,
    newThisMonth: newCustomersThisMonth.count,
    topByCallCount: topCustomers,
  };

  // ── Booking rate ──
  // Calls where caller wanted to schedule (booked or estimate) vs total completed calls
  const [bookedCalls] = await db
    .select({ count: count() })
    .from(calls)
    .where(
      and(
        eq(calls.businessId, businessId),
        or(eq(calls.outcome, "appointment_booked"), eq(calls.outcome, "estimate_requested")),
        gte(calls.createdAt, monthStart),
      ),
    );
  const [completedCalls] = await db
    .select({ count: count() })
    .from(calls)
    .where(
      and(
        eq(calls.businessId, businessId),
        eq(calls.status, "completed"),
        gte(calls.createdAt, monthStart),
      ),
    );
  const bookingRate = completedCalls.count > 0
    ? Math.round((bookedCalls.count / completedCalls.count) * 100)
    : null;

  return NextResponse.json({
    ...basicResponse,
    // Enhanced fields (additional insights beyond revenue)
    weeklySummary,
    activityFeed,
    newestEventText: newestIsVeryRecent && newestEvent ? newestEvent.title : null,
    insights,
    bilingualStats,
    estimatePipeline: {
      ...estimatePipeline,
      totalPipelineValue,
      wonThisMonth: { count: wonThisMonth.count, value: wonThisMonth.value },
    },
    customerInsights,
    abandonedCallRecovery,
    bookingRate,
  });

  } catch (err) {
    reportError("Enhanced metrics failed", err, { businessId });
    return NextResponse.json(basicResponse);
  }
}
