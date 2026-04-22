"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import MetricCard from "@/components/metric-card";
import AnimatedCounter from "@/app/dashboard/_components/animated-counter";
import ActivityFeed from "@/app/dashboard/_components/activity-feed";
import WeeklySummary from "@/app/dashboard/_components/weekly-summary";
import BusinessInsights from "@/app/dashboard/_components/business-insights";
import Skeleton, { MetricCardSkeleton } from "@/components/skeleton";
import SetupChecklist from "@/app/dashboard/_components/setup-checklist";
import DashboardTour from "@/components/dashboard-tour";
import { useReceptionistName } from "@/app/dashboard/_hooks/use-receptionist-name";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t, getGreeting } from "@/lib/i18n/strings";
import { IconSparkles, IconClock, IconTarget, IconParty } from "@/components/icons";
import { IconPhone } from "@/components/marketing/icons";

interface ActionItems {
  overdueInvoices: number;
  unassignedToday: number;
  urgentFollowUps: number;
  expiredEstimates: number;
  messagesAwaitingCallback: number;
}

interface Overview {
  callsToday: number;
  appointmentsThisWeek: number;
  missedCallsSaved: number;
  totalCalls: number;
  // First call celebration
  firstCallCelebration?: {
    show: boolean;
    callId?: string;
    callerName?: string;
    duration?: number;
    service?: string;
  };
  // Enhanced
  revenueThisMonth?: number;
  revenueChange?: number;
  revenueSaved?: number;
  missedCallsRecoveredCount?: number;
  costPerLead?: number;
  roiMultiple?: number;
  businessName?: string;
  weeklySummary?: {
    totalCalls: number;
    appointmentsBooked: number;
    estimatedRevenue: number;
    missedCallsRecovered: number;
    avgCallDuration: number;
    busiestHour: string;
    trendingService: string;
    topService: { name: string; percentage: number };
    languageBreakdown: { en: number; es: number };
  };
  activityFeed?: Array<{
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
  }>;
  newestEventText?: string | null;
  insights?: Array<{ text: string; icon: string }>;
  bilingualStats?: {
    spanishCalls: number;
    totalCalls: number;
    percentage: number;
  };
  estimatePipeline?: {
    new: { count: number; value: number };
    sent: { count: number; value: number };
    follow_up: { count: number; value: number };
    won: { count: number; value: number };
    lost: { count: number; value: number };
    totalPipelineValue: number;
    wonThisMonth: { count: number; value: number };
  };
  customerInsights?: {
    totalCustomers: number;
    repeatCallers: number;
    repeatRate: number;
    newThisMonth: number;
    topByCallCount: Array<{ name: string | null; phone: string; totalCalls: number }>;
  };
  stripeSubscriptionStatus?: string | null;
  trialEndsAt?: string | null;
  healthScore?: number;
  afterHoursThisWeek?: number;
  mariaSavedYou?: number;
  mariaSavedBreakdown?: {
    missedRecovered: number;
    afterHours: number;
    afterHoursCount: number;
    spanish: number;
    spanishCount: number;
  };
  // Setup checklist data
  businessHours?: Record<string, { open?: string; close?: string; closed?: boolean }> | null;
  greeting?: string | null;
  hasPricing?: boolean;
  setupChecklistDismissed?: boolean;
  tourCompleted?: boolean;
  createdAt?: string;
}

interface ActiveCall {
  id: string;
  callerPhone: string;
  customerName: string | null;
  isReturningCaller: boolean;
  direction: string;
  language: string;
  status: string;
  currentIntent: string | null;
  startedAt: string;
  durationSeconds: number;
}

export default function OverviewPage() {
  const receptionistName = useReceptionistName();
  const [lang] = useLang();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [tourDismissed, setTourDismissed] = useState(false);
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [actionItems, setActionItems] = useState<ActionItems | null>(null);

  const fetchActiveCalls = useCallback(() => {
    fetch("/api/dashboard/active-calls")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.activeCalls) setActiveCalls(d.activeCalls); })
      .catch(() => {});
  }, []);

  const loadOverview = useCallback(() => {
    setError(null);
    fetch(`/api/dashboard/overview?lang=${lang}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError("Failed to load dashboard data"));
    fetch("/api/dashboard/action-items")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: ActionItems) => setActionItems(d))
      .catch(() => {});
  }, [lang]);

  useEffect(() => {
    loadOverview();
    fetchActiveCalls();
    const interval = setInterval(fetchActiveCalls, 10000);
    return () => clearInterval(interval);
  }, [fetchActiveCalls, loadOverview]);

  if (error) {
    return (
      <div role="alert" aria-live="assertive" className="rounded-xl p-4 flex items-center justify-between" style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)", color: "var(--db-danger)" }}>
        <p className="text-sm">{t("error.failedToLoad", lang)}</p>
        <button
          onClick={loadOverview}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}
        >
          {t("action.retry", lang)}
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading dashboard">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const hasRevenue = data.revenueThisMonth != null && data.revenueThisMonth > 0;

  const showCelebration = data.firstCallCelebration?.show && !dismissed;

  if (
    data.totalCalls === 0 &&
    data.callsToday === 0 &&
    data.appointmentsThisWeek === 0
  ) {
    const steps = [
      { label: t("overview.forwardNumber", lang), desc: t("overview.forwardNumberDesc", lang), href: "/dashboard/settings", icon: <IconPhone size={18} /> },
      { label: t("overview.customizeReceptionist", lang), desc: t("overview.customizeReceptionistDesc", lang), href: "/dashboard/settings", icon: <IconSparkles size={18} /> },
      { label: t("overview.setBusinessHours", lang), desc: t("overview.setBusinessHoursDesc", lang), href: "/dashboard/settings", icon: <IconClock size={18} /> },
      { label: t("overview.makeTestCall", lang), desc: t("overview.makeTestCallDesc", lang), icon: <IconTarget size={18} /> },
    ];

    return (
      <div className="space-y-6">
        <div>
          <div
            className="hidden sm:flex items-center justify-between mb-3"
            style={{
              fontFamily: "var(--font-mono), ui-monospace, Menlo, monospace",
              fontSize: 11,
              color: "var(--db-text-muted)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            <span style={{ color: "var(--db-accent)", fontWeight: 800 }}>§ Overview</span>
            <span>CAT · REV 2026.04</span>
          </div>
          <div className="relative" style={{ paddingTop: 12 }}>
            <span aria-hidden style={{ position: "absolute", top: 0, left: 0, width: 48, height: 3, background: "var(--db-accent)" }} />
            <h1
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: "var(--db-text)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              {getGreeting(lang)}, {t("greeting.welcome", lang)}
            </h1>
            <p
              className="mt-2"
              style={{
                color: "var(--db-text-muted)",
                fontSize: 14,
                lineHeight: 1.55,
                fontWeight: 500,
                maxWidth: 640,
              }}
            >
              {t("overview.noCallsSub", lang, { name: receptionistName })}
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-6"
          style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
            {t("overview.quickSetup", lang)}
          </h2>
          <div className="mt-4 space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--db-hover)", color: "var(--db-accent)" }}>
                  {step.icon}
                </span>
                <div className="flex-1">
                  {step.href ? (
                    <a href={step.href} className="text-sm font-semibold hover:underline" style={{ color: "var(--db-accent)" }}>
                      {step.label} &rarr;
                    </a>
                  ) : (
                    <p className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>{step.label}</p>
                  )}
                  <p className="mt-0.5 text-xs" style={{ color: "var(--db-text-muted)" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 stagger-grid">
          <MetricCard label={t("overview.callsToday", lang)} value={0} />
          <MetricCard label={t("overview.thisWeek", lang)} value={0} change={t("overview.appointmentsToday", lang)} changeType="neutral" />
          <MetricCard label={t("metric.missedSaved", lang)} value={0} />
          <MetricCard label={t("overview.totalCalls", lang)} value={0} />
        </div>
      </div>
    );
  }

  // ── Unified Dashboard (all clients) ──
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <div
          className="hidden sm:flex items-center justify-between mb-3"
          style={{
            fontFamily: "var(--font-mono), ui-monospace, Menlo, monospace",
            fontSize: 11,
            color: "var(--db-text-muted)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <span style={{ color: "var(--db-accent)", fontWeight: 800 }}>§ Overview</span>
          <span>CAT · REV 2026.04</span>
        </div>
        <div className="relative flex flex-wrap items-center gap-3" style={{ paddingTop: 12 }}>
          <span aria-hidden style={{ position: "absolute", top: 0, left: 0, width: 48, height: 3, background: "var(--db-accent)" }} />
          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "var(--db-text)",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {getGreeting(lang)}, {data.businessName?.split(" ")[0] || "there"}
          </h1>
          {data.stripeSubscriptionStatus === "trialing" && data.trialEndsAt && (() => {
            const trialEnd = new Date(data.trialEndsAt).getTime();
            const trialStart = trialEnd - 14 * 86400000;
            const dayNum = Math.min(14, Math.max(1, Math.ceil((Date.now() - trialStart) / 86400000)));
            return (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: "var(--db-accent-bg)", color: "var(--db-accent)" }}
              >
                {lang === "es" ? `Día ${dayNum} de 14` : `Day ${dayNum} of 14`}
              </span>
            );
          })()}
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          {t("overview.hereIsHowPerforming", lang, { name: receptionistName })}
        </p>
      </div>

      {/* Live Call Indicator */}
      {activeCalls.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--db-success-bg)",
            border: "1px solid var(--db-success)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <span className="text-sm font-semibold" style={{ color: "var(--db-success)" }}>
              {t("overview.liveNow", lang)} — {activeCalls.length} {activeCalls.length > 1 ? t("overview.activeCallsNowPlural", lang) : t("overview.callInProgress", lang)}
            </span>
          </div>
          <div className="space-y-1.5">
            {activeCalls.map((call) => {
              const elapsed = call.startedAt
                ? Math.floor((Date.now() - new Date(call.startedAt).getTime()) / 1000)
                : call.durationSeconds || 0;
              const mins = Math.floor(elapsed / 60);
              const secs = elapsed % 60;
              return (
                <div key={call.id} className="flex items-center gap-3 text-xs" style={{ color: "var(--db-text-muted)" }}>
                  <span className="font-medium" style={{ color: "var(--db-text)" }}>
                    {call.customerName || call.callerPhone || "Unknown"}
                  </span>
                  {call.isReturningCaller && (
                    <span className="rounded-full px-1.5 py-0.5 text-xs font-medium" style={{ background: "rgba(99,102,241,0.1)", color: "rgb(129,140,248)" }}>
                      {t("overview.returning", lang)}
                    </span>
                  )}
                  {call.currentIntent && (
                    <span className="text-xs uppercase tracking-wide" style={{ color: "var(--db-text-muted)" }}>
                      {call.currentIntent}
                    </span>
                  )}
                  <span className="ml-auto tabular-nums">
                    {mins}:{secs.toString().padStart(2, "0")}
                  </span>
                  {call.language === "es" && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: "var(--db-warning-bg)", color: "var(--db-warning)" }}
                    >
                      ES
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Big Numbers Row — Calls Today gets emphasis */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 stagger-grid" data-tour="overview-metrics">
        <div className="db-card p-5 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
            {t("overview.callsToday", lang)}
          </p>
          <p className="text-4xl font-bold mt-1" style={{ color: "var(--db-accent)" }}>
            <AnimatedCounter value={data.callsToday} />
          </p>
        </div>
        <MetricCard
          label={t("metric.appointmentsBooked", lang)}
          value={data.appointmentsThisWeek}
          change={t("metric.thisWeek", lang)}
          changeType="neutral"
        />
        <MetricCard
          label={t("metric.missedSaved", lang)}
          value={data.missedCallsSaved}
          changeType={data.missedCallsSaved > 0 ? "positive" : "neutral"}
        />
        <MetricCard
          label={t("metric.afterHoursCalls", lang)}
          value={data.afterHoursThisWeek ?? 0}
          change={t("metric.thisWeek", lang)}
          changeType={data.afterHoursThisWeek ? "positive" : "neutral"}
        />
      </div>

      {/* Action Required — what needs your attention RIGHT NOW */}
      <ActionRequiredSection items={actionItems} />

      {/* Revenue Hero Banner — shown when there are calls with revenue */}
      {hasRevenue ? (
        <div
          className="relative overflow-hidden rounded-xl p-6"
          style={{
            background: "linear-gradient(135deg, var(--db-surface) 0%, var(--db-card) 100%)",
            border: "1px solid var(--db-border)",
            boxShadow: "var(--db-card-shadow)",
          }}
        >
          <div className="relative z-10">
            <p className="text-sm font-medium" style={{ color: "var(--db-text-muted)" }}>
              {t("metric.earnedYou", lang, { name: receptionistName })}
            </p>
            <p
              className="mt-1 text-4xl font-bold tracking-tight"
              style={{ color: "var(--db-accent)" }}
            >
              <AnimatedCounter value={data.revenueThisMonth!} prefix="$" duration={1500} />
            </p>
            <div className="mt-3 flex items-center gap-4 flex-wrap">
              {data.roiMultiple != null && data.roiMultiple > 0 && (
                <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
                  <strong style={{ color: "var(--db-success)" }}>{data.roiMultiple}x</strong> {t("metric.roiReturn", lang)}
                </span>
              )}
              {data.revenueSaved != null && data.revenueSaved > 0 && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ background: "var(--db-success-bg)", color: "var(--db-success)" }}
                >
                  +${data.revenueSaved.toLocaleString()} {t("metric.recoveredFromMissed", lang)}
                </span>
              )}
            </div>
            {/* ROI progress bar */}
            {data.roiMultiple != null && data.roiMultiple > 0 && (
              <div className="mt-4 w-full max-w-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{t("metric.investment", lang)}</span>
                  <span className="text-xs font-medium" style={{ color: "var(--db-accent)" }}>${data.revenueThisMonth?.toLocaleString()} {t("metric.earned", lang)}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: "var(--db-border)" }}>
                  <div
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min((data.roiMultiple / 10) * 100, 100)}%`,
                      background: "linear-gradient(90deg, var(--db-accent) 0%, var(--db-success) 100%)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <div
            className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-[0.06]"
            style={{ background: "var(--db-accent)" }}
          />
        </div>
      ) : data.totalCalls > 0 ? (
        <div
          className="rounded-xl p-5 flex items-center gap-4"
          style={{
            background: "linear-gradient(135deg, var(--db-surface) 0%, var(--db-card) 100%)",
            border: "1px solid var(--db-border)",
          }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--db-success-bg)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--db-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
              {t("overview.mariaIsStandingBy", lang, { name: receptionistName })}
            </p>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              {t("overview.revenueEstimate", lang)}
            </p>
          </div>
        </div>
      ) : null}

      {/* First Call Celebration */}
      {showCelebration && <FirstCallBanner celebration={data.firstCallCelebration!} onDismiss={() => setDismissed(true)} receptionistName={receptionistName} />}

      {/* Setup Checklist (for newer businesses) */}
      {data.createdAt && !hasRevenue && (
        <SetupChecklist
          businessHours={data.businessHours || null}
          greeting={data.greeting || null}
          hasPricing={data.hasPricing || false}
          totalCalls={data.totalCalls}
          setupChecklistDismissed={data.setupChecklistDismissed || false}
          createdAt={data.createdAt}
        />
      )}

      {/* Revenue & ROI Metrics — secondary */}
      {(hasRevenue || (data.mariaSavedYou ?? data.revenueSaved ?? 0) > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-grid [&>*:last-child:nth-child(odd)]:sm:col-span-2 [&>*:last-child:nth-child(odd)]:lg:col-span-1">
          {hasRevenue && (
            <MetricCard
              label={t("metric.revenueCaptured", lang)}
              value={data.revenueThisMonth!}
              prefix="$"
              change={
                data.revenueChange != null && data.revenueChange !== 0
                  ? `${data.revenueChange > 0 ? "+" : ""}${data.revenueChange}% ${t("misc.lastMonth", lang)}`
                  : undefined
              }
              changeType={data.revenueChange != null && data.revenueChange > 0 ? "positive" : data.revenueChange != null && data.revenueChange < 0 ? "negative" : "neutral"}
            />
          )}
          <MariaSavedCard
            total={data.mariaSavedYou ?? data.revenueSaved ?? 0}
            breakdown={data.mariaSavedBreakdown}
            missedCallsRecoveredCount={data.missedCallsRecoveredCount ?? 0}
            receptionistName={receptionistName}
            lang={lang}
          />
          {data.costPerLead != null && data.costPerLead > 0 && (
            <MetricCard
              label={t("metric.costPerLead", lang)}
              value={data.costPerLead}
              prefix="$"
              decimals={2}
              changeType="positive"
            />
          )}
          <HealthScoreCard score={data.healthScore ?? 50} />
        </div>
      )}

      {/* Activity Feed + Weekly Summary */}
      {(data.activityFeed || data.weeklySummary) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {data.activityFeed && (
            <div className="lg:col-span-3">
              <ActivityFeed events={data.activityFeed} newestEventText={data.newestEventText} receptionistName={receptionistName} lang={lang} />
            </div>
          )}
          {data.weeklySummary && (
            <div className="lg:col-span-2">
              <WeeklySummary data={data.weeklySummary} lang={lang} />
            </div>
          )}
        </div>
      )}

      {/* Estimate Pipeline + Customer Insights */}
      {(data.estimatePipeline || data.customerInsights) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {data.estimatePipeline && (
            <div
              className="rounded-xl p-5"
              style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
            >
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
                {t("section.estimatePipeline", lang)}
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: t("metric.activePipeline", lang), value: `$${data.estimatePipeline.totalPipelineValue.toLocaleString()}`, color: "var(--db-accent)" },
                  { label: t("estimates.wonThisMonth", lang), value: `$${data.estimatePipeline.wonThisMonth.value.toLocaleString()}`, color: "var(--db-success)" },
                  { label: t("estimates.won", lang), value: String(data.estimatePipeline.wonThisMonth.count), color: "var(--db-success)" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{s.label}</p>
                    <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {(["new", "sent", "follow_up", "won", "lost"] as const).map((status) => {
                  const d = data.estimatePipeline![status];
                  const colors: Record<string, string> = { new: "#3b82f6", sent: "#6366f1", follow_up: "var(--db-warning-alt)", won: "var(--db-success)", lost: "var(--db-danger)" };
                  return (
                    <div key={status} className="flex-1 rounded-lg p-2 text-center" style={{ background: "var(--db-hover)" }}>
                      <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{status.replace(/_/g, " ")}</p>
                      <p className="text-sm font-bold" style={{ color: colors[status] }}>{d.count}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {data.customerInsights && (
            <div
              className="rounded-xl p-5"
              style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
            >
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
                {t("section.customerInsights", lang)}
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{t("metric.totalCustomers", lang)}</p>
                  <p className="text-lg font-bold" style={{ color: "var(--db-text)" }}>{data.customerInsights.totalCustomers}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{t("metric.repeatRate", lang)}</p>
                  <p className="text-lg font-bold" style={{ color: "var(--db-accent)" }}>{data.customerInsights.repeatRate}%</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{t("customers.repeatCallers", lang)}</p>
                  <p className="text-lg font-bold" style={{ color: "var(--db-text)" }}>{data.customerInsights.repeatCallers}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{t("metric.newThisMonth", lang)}</p>
                  <p className="text-lg font-bold" style={{ color: "var(--db-success)" }}>{data.customerInsights.newThisMonth}</p>
                </div>
              </div>
              {data.customerInsights.topByCallCount.length > 0 && (
                <div>
                  <p className="text-xs mb-2" style={{ color: "var(--db-text-muted)" }}>{t("dashboard.topCallers", lang)}</p>
                  {data.customerInsights.topByCallCount.map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{c.name || c.phone}</span>
                      <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{c.totalCalls} {t("dashboard.calls", lang)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Insights + Quick Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {data.insights && (
            <BusinessInsights
              insights={data.insights}
              bilingualStats={data.bilingualStats}
            />
          )}
        </div>
        <div className="lg:col-span-2">
          <div className="db-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: "var(--db-text-muted)" }}
              >
                {t("time.allTime", lang)}
              </h3>
              <Link href="/dashboard/intelligence" className="text-sm font-medium" style={{ color: "var(--db-accent)" }}>
                {t("overview.viewMariasBrain", lang, { name: receptionistName })} &rarr;
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{t("overview.totalCalls", lang)}</span>
                <span className="text-lg font-semibold tabular-nums" style={{ color: "var(--db-text)" }}>
                  <AnimatedCounter value={data.totalCalls} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{t("overview.callsToday", lang)}</span>
                <span className="text-lg font-semibold tabular-nums" style={{ color: "var(--db-text)" }}>
                  <AnimatedCounter value={data.callsToday} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{t("metric.missedSaved", lang)}</span>
                <span className="text-lg font-semibold tabular-nums" style={{ color: "var(--db-success)" }}>
                  <AnimatedCounter value={data.missedCallsSaved} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Tour — always at bottom */}
      {data.tourCompleted === false && !tourDismissed && (
        <DashboardTour onComplete={() => setTourDismissed(true)} />
      )}
    </div>
  );
}

function ActionRequiredSection({ items }: { items: ActionItems | null }) {
  const [lang] = useLang();
  if (!items) return null;

  const cards: {
    key: string;
    count: number;
    label: string;
    href: string;
    priority: "urgent" | "medium";
    icon: React.ReactNode;
  }[] = [];

  if (items.overdueInvoices > 0) {
    cards.push({
      key: "overdue",
      count: items.overdueInvoices,
      label: t("dashboard.overdueInvoices", lang),
      href: "/dashboard/invoices",
      priority: "urgent",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    });
  }

  if (items.unassignedToday > 0) {
    cards.push({
      key: "unassigned",
      count: items.unassignedToday,
      label: t("dashboard.unassignedToday", lang),
      href: "/dashboard/dispatch",
      priority: "urgent",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
      ),
    });
  }

  if (items.urgentFollowUps > 0) {
    cards.push({
      key: "followups",
      count: items.urgentFollowUps,
      label: t("dashboard.urgentFollowUps", lang),
      href: "/dashboard/follow-ups",
      priority: "urgent",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    });
  }

  if (items.expiredEstimates > 0) {
    cards.push({
      key: "estimates",
      count: items.expiredEstimates,
      label: t("dashboard.expiredEstimates", lang),
      href: "/dashboard/estimates",
      priority: "medium",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    });
  }

  if (items.messagesAwaitingCallback > 0) {
    cards.push({
      key: "messages",
      count: items.messagesAwaitingCallback,
      label: t("dashboard.messagesAwaiting", lang),
      href: "/dashboard/calls?outcome=message_taken",
      priority: "urgent",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      ),
    });
  }

  if (cards.length === 0) return null;

  return (
    <div>
      <h3
        className="mb-3 text-sm font-semibold uppercase tracking-wider"
        style={{ color: "var(--db-text-muted)" }}
      >
        {t("dashboard.actionRequired", lang)}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="db-card rounded-xl p-4 db-table-row"
            style={{
              borderLeft: `3px solid ${card.priority === "urgent" ? "var(--db-danger)" : "var(--db-warning)"}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: card.priority === "urgent" ? "var(--db-danger-bg)" : "var(--db-warning-bg)",
                  color: card.priority === "urgent" ? "var(--db-danger)" : "var(--db-warning)",
                }}
              >
                {card.icon}
              </div>
              <div className="min-w-0">
                <p
                  className="text-lg font-bold"
                  style={{ color: card.priority === "urgent" ? "var(--db-danger)" : "var(--db-warning)" }}
                >
                  {card.count}
                </p>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                  {card.label}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function HealthScoreCard({ score }: { score: number }) {
  const [lang] = useLang();
  const color = score >= 80 ? "var(--db-success)" : score >= 50 ? "var(--db-warning)" : "var(--db-danger)";
  const label = score >= 80 ? t("dashboard.healthExcellent", lang) : score >= 50 ? t("dashboard.healthGood", lang) : t("dashboard.healthNeedsAttention", lang);

  return (
    <div
      className="db-card p-5 flex flex-col items-center justify-center"
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: "var(--db-text-muted)" }}
      >
        {t("section.healthScore", lang)}
      </p>
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="var(--db-border)"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <span
          className="absolute text-lg font-bold"
          style={{ color }}
        >
          {score}
        </span>
      </div>
      <p className="mt-1 text-xs font-medium" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

function MariaSavedCard({
  total,
  breakdown,
  missedCallsRecoveredCount,
  receptionistName,
  lang: langProp,
}: {
  total: number;
  breakdown?: Overview["mariaSavedBreakdown"];
  missedCallsRecoveredCount: number;
  receptionistName: string;
  lang?: "en" | "es";
}) {
  const [langHook] = useLang();
  const lang = langProp ?? langHook;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="db-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
        {receptionistName} {t("dashboard.savedYou", lang)}
      </p>
      <p className="mt-1 text-2xl font-bold" style={{ color: "var(--db-success)" }}>
        ${total.toLocaleString()}
      </p>
      {breakdown && total > 0 ? (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-xs font-medium"
            style={{ color: "var(--db-accent)" }}
          >
            {expanded ? t("action.hideBreakdown", lang) : t("action.seeBreakdown", lang)}
          </button>
          {expanded && (
            <div className="mt-2 space-y-1.5 text-xs" style={{ color: "var(--db-text-secondary)" }}>
              {breakdown.missedRecovered > 0 && (
                <div className="flex justify-between">
                  <span>{t("metric.missedCallsRecovered", lang)} ({missedCallsRecoveredCount})</span>
                  <span className="font-medium">${breakdown.missedRecovered.toLocaleString()}</span>
                </div>
              )}
              {breakdown.afterHours > 0 && (
                <div className="flex justify-between">
                  <span>{t("metric.afterHoursCalls", lang)} ({breakdown.afterHoursCount})</span>
                  <span className="font-medium">${breakdown.afterHours.toLocaleString()}</span>
                </div>
              )}
              {breakdown.spanish > 0 && (
                <div className="flex justify-between">
                  <span>{t("intelligence.bilingualCalls", lang)} ({breakdown.spanishCount})</span>
                  <span className="font-medium">${breakdown.spanish.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        missedCallsRecoveredCount > 0 && (
          <p className="mt-1 text-xs" style={{ color: "var(--db-success)" }}>
            {t("dashboard.callsSaved", lang, { count: missedCallsRecoveredCount })}
          </p>
        )
      )}
    </div>
  );
}

function FirstCallBanner({
  celebration,
  onDismiss,
  receptionistName,
}: {
  celebration: NonNullable<Overview["firstCallCelebration"]>;
  onDismiss: () => void;
  receptionistName: string;
}) {
  const [lang] = useLang();
  const durationMin = celebration.duration ? Math.round(celebration.duration / 60) : null;

  return (
    <div
      className="relative overflow-hidden rounded-xl p-6"
      style={{
        background: "linear-gradient(135deg, var(--db-success-bg) 0%, var(--db-success-bg) 100%)",
        border: "1px solid var(--db-success)",
      }}
    >
      <button
        onClick={onDismiss}
        className="absolute right-3 top-3 text-sm"
        style={{ color: "var(--db-text-muted)" }}
        aria-label={t("action.close", lang)}
      >
        &times;
      </button>
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl"
          style={{ background: "var(--db-success-bg)" }}
        >
          <IconParty size={20} />
        </div>
        <div>
          <h3
            className="text-lg font-bold"
            style={{ color: "var(--db-success)" }}
          >
            {t("dashboard.firstCallTitle", lang, { name: receptionistName })}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--db-text-secondary)" }}>
            {t("dashboard.firstCallDesc", lang, {
              name: receptionistName,
              caller: celebration.callerName ? (lang === "es" ? ` de ${celebration.callerName}` : ` from ${celebration.callerName}`) : "",
              duration: durationMin ? ` (${durationMin} min)` : "",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
