"use client";

import { useEffect, useState } from "react";
import MetricCard from "@/components/metric-card";
import AnimatedCounter from "@/app/dashboard/_components/animated-counter";
import ActivityFeed from "@/app/dashboard/_components/activity-feed";
import WeeklySummary from "@/app/dashboard/_components/weekly-summary";
import BusinessInsights from "@/app/dashboard/_components/business-insights";
import LoadingSpinner from "@/app/dashboard/_components/loading-spinner";

interface Overview {
  callsToday: number;
  appointmentsThisWeek: number;
  missedCallsSaved: number;
  totalCalls: number;
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
  }>;
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
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/overview")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Failed to load dashboard data"));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
        <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return <LoadingSpinner />;
  }

  const isEnhanced = !!data.revenueThisMonth;

  if (
    !isEnhanced &&
    data.totalCalls === 0 &&
    data.callsToday === 0 &&
    data.appointmentsThisWeek === 0
  ) {
    return (
      <div>
        <h1
          className="mb-6 text-2xl font-semibold"
          style={{ fontFamily: "var(--font-body), system-ui, sans-serif", color: "var(--db-text)" }}
        >
          Overview
        </h1>
        <div
          className="rounded-xl p-12 text-center"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
            boxShadow: "var(--db-card-shadow)",
          }}
        >
          <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>
            Welcome to Calltide
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--db-text-muted)" }}>
            Your AI receptionist is ready. Once calls start coming in,
            you&apos;ll see your metrics here.
          </p>
        </div>
      </div>
    );
  }

  // ── Enhanced Demo Dashboard ──
  if (isEnhanced) {
    return (
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-body), system-ui, sans-serif", color: "var(--db-text)" }}
          >
            {getGreeting()}, {data.businessName?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
            Here&apos;s how your AI receptionist is performing
          </p>
        </div>

        {/* Revenue Hero Banner */}
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
              This month, Calltide earned you
            </p>
            <p
              className="mt-1 text-4xl font-bold tracking-tight"
              style={{ color: "var(--db-accent)" }}
            >
              <AnimatedCounter value={data.revenueThisMonth!} prefix="$" duration={1500} />
            </p>
            <div className="mt-3 flex items-center gap-4 flex-wrap">
              <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
                <strong style={{ color: "#4ade80" }}>{data.roiMultiple}x</strong> return on your $497/mo
              </span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}
              >
                +${data.revenueSaved?.toLocaleString()} recovered from missed calls
              </span>
            </div>
            {/* ROI progress bar */}
            <div className="mt-4 w-full max-w-md">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>$497 investment</span>
                <span className="text-xs font-medium" style={{ color: "var(--db-accent)" }}>${data.revenueThisMonth?.toLocaleString()} earned</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "var(--db-border)" }}>
                <div
                  className="h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min((data.roiMultiple! / 10) * 100, 100)}%`,
                    background: "linear-gradient(90deg, var(--db-accent) 0%, #4ade80 100%)",
                  }}
                />
              </div>
            </div>
          </div>
          {/* Decorative gradient blob */}
          <div
            className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-[0.06]"
            style={{ background: "var(--db-accent)" }}
          />
        </div>

        {/* Revenue Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Revenue Captured"
            value={data.revenueThisMonth!}
            prefix="$"
            change={
              data.revenueChange != null && data.revenueChange !== 0
                ? `${data.revenueChange > 0 ? "+" : ""}${data.revenueChange}% vs last month`
                : undefined
            }
            changeType={data.revenueChange != null && data.revenueChange > 0 ? "positive" : data.revenueChange != null && data.revenueChange < 0 ? "negative" : "neutral"}
          />
          <MetricCard
            label="Recovered from Missed"
            value={data.revenueSaved!}
            prefix="$"
            change={
              data.missedCallsRecoveredCount
                ? `${data.missedCallsRecoveredCount} call${data.missedCallsRecoveredCount === 1 ? "" : "s"} saved`
                : undefined
            }
            changeType="positive"
          />
          <MetricCard
            label="Cost Per Lead"
            value={data.costPerLead!}
            prefix="$"
            decimals={2}
            change="vs $52 avg on Google Ads"
            changeType="positive"
          />
          <MetricCard
            label="Appointments Booked"
            value={data.appointmentsThisWeek}
            change="This week"
            changeType="neutral"
          />
        </div>

        {/* Activity Feed + Weekly Summary */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {data.activityFeed && <ActivityFeed events={data.activityFeed} />}
          </div>
          <div className="lg:col-span-2">
            {data.weeklySummary && <WeeklySummary data={data.weeklySummary} />}
          </div>
        </div>

        {/* Estimate Pipeline + Customer Insights */}
        {(data.estimatePipeline || data.customerInsights) && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {data.estimatePipeline && (
              <div
                className="rounded-xl p-5"
                style={{ background: "var(--db-card)", border: "1px solid var(--db-border)", boxShadow: "var(--db-card-shadow)" }}
              >
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
                  Estimate Pipeline
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Active Pipeline", value: `$${data.estimatePipeline.totalPipelineValue.toLocaleString()}`, color: "var(--db-accent)" },
                    { label: "Won This Month", value: `$${data.estimatePipeline.wonThisMonth.value.toLocaleString()}`, color: "#4ade80" },
                    { label: "Won Deals", value: String(data.estimatePipeline.wonThisMonth.count), color: "#4ade80" },
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
                    const colors: Record<string, string> = { new: "#3b82f6", sent: "#6366f1", follow_up: "#f59e0b", won: "#22c55e", lost: "#ef4444" };
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
                style={{ background: "var(--db-card)", border: "1px solid var(--db-border)", boxShadow: "var(--db-card-shadow)" }}
              >
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
                  Customer Insights
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Total Customers</p>
                    <p className="text-lg font-bold" style={{ color: "var(--db-text)" }}>{data.customerInsights.totalCustomers}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Repeat Rate</p>
                    <p className="text-lg font-bold" style={{ color: "var(--db-accent)" }}>{data.customerInsights.repeatRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Repeat Callers</p>
                    <p className="text-lg font-bold" style={{ color: "var(--db-text)" }}>{data.customerInsights.repeatCallers}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>New This Month</p>
                    <p className="text-lg font-bold" style={{ color: "#4ade80" }}>{data.customerInsights.newThisMonth}</p>
                  </div>
                </div>
                {data.customerInsights.topByCallCount.length > 0 && (
                  <div>
                    <p className="text-xs mb-2" style={{ color: "var(--db-text-muted)" }}>Top Callers</p>
                    {data.customerInsights.topByCallCount.map((c, i) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{c.name || c.phone}</span>
                        <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{c.totalCalls} calls</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Insights + Bilingual */}
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
            {/* Quick Stats */}
            <div
              className="rounded-xl p-5 transition-colors duration-300"
              style={{
                background: "var(--db-card)",
                border: "1px solid var(--db-border)",
                boxShadow: "var(--db-card-shadow)",
              }}
            >
              <h3
                className="mb-4 text-sm font-semibold uppercase tracking-wider"
                style={{ color: "var(--db-text-muted)" }}
              >
                All Time
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>Total Calls Handled</span>
                  <span className="text-lg font-semibold tabular-nums" style={{ color: "var(--db-text)" }}>
                    <AnimatedCounter value={data.totalCalls} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>Calls Today</span>
                  <span className="text-lg font-semibold tabular-nums" style={{ color: "var(--db-text)" }}>
                    <AnimatedCounter value={data.callsToday} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>Missed Calls Saved</span>
                  <span className="text-lg font-semibold tabular-nums" style={{ color: "#4ade80" }}>
                    <AnimatedCounter value={data.missedCallsSaved} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Basic Dashboard (real clients) ──
  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-body), system-ui, sans-serif", color: "var(--db-text)" }}
        >
          {getGreeting()}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          Here&apos;s your AI receptionist summary
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Calls Today" value={data.callsToday} />
        <MetricCard label="Appointments This Week" value={data.appointmentsThisWeek} />
        <MetricCard
          label="Missed Calls Saved"
          value={data.missedCallsSaved}
          changeType={data.missedCallsSaved > 0 ? "positive" : "neutral"}
          change={data.missedCallsSaved > 0 ? "Recovered by AI" : undefined}
        />
        <MetricCard label="Total Calls" value={data.totalCalls} />
      </div>

      {/* Activity Feed + Weekly Summary (when available) */}
      {(data.activityFeed || data.weeklySummary) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {data.activityFeed && (
            <div className="lg:col-span-3">
              <ActivityFeed events={data.activityFeed} />
            </div>
          )}
          {data.weeklySummary && (
            <div className="lg:col-span-2">
              <WeeklySummary data={data.weeklySummary} />
            </div>
          )}
        </div>
      )}

      {/* Insights (when available) */}
      {data.insights && (
        <BusinessInsights
          insights={data.insights}
          bilingualStats={data.bilingualStats}
        />
      )}
    </div>
  );
}
