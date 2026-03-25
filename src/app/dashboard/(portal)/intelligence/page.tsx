"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import MetricCard from "@/components/metric-card";
import { PageSkeleton } from "@/components/skeleton";
import { useReceptionistName } from "@/app/dashboard/_hooks/use-receptionist-name";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

interface IntelligenceData {
  receptionistName: string;
  daysLearning: number;
  totalCalls: number;
  totalCustomers: number;
  totalCustomResponses: number;
  avgQaScore: number;
  languageBreakdown: Record<string, number>;
  hourCounts: number[];
  monthlyTrend: Array<{ month: string; count: number }>;
  tierDistribution: Record<string, number>;
  topCustomers: Array<{
    name: string | null;
    phone: string;
    totalCalls: number;
    tier: string | null;
  }>;
  repeatRate: number;
  customResponsesByCategory: Record<string, number>;
  gapCounts: Record<string, number>;
  recentGaps: Array<{
    id: string;
    question: string;
    status: string;
    createdAt: string;
  }>;
  avgBreakdown: {
    greeting: number;
    languageMatch: number;
    needCapture: number;
    actionTaken: number;
    accuracy: number;
    sentiment: number;
  } | null;
  weeklyQaTrend: Array<{ week: string; avg: number }>;
  topServices: Array<{ name: string; count: number }>;
  bilingualPercent: number;
}

const TIER_COLORS: Record<string, string> = {
  hot: "#ef4444",
  warm: "#f59e0b",
  cold: "#3b82f6",
  dormant: "#94a3b8",
  new: "#8b5cf6",
  loyal: "#22c55e",
  vip: "#d4a843",
  "at-risk": "#f97316",
};

const CATEGORY_LABELS: Record<string, string> = {
  faq: "FAQs",
  off_limits: "Off Limits",
  phrase: "Custom Phrases",
  emergency_keyword: "Emergency Keywords",
};

const GAP_STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  answered: "#22c55e",
  dismissed: "#94a3b8",
  asked: "#3b82f6",
  auto_created: "#8b5cf6",
};

export default function IntelligencePage() {
  const [lang] = useLang();
  const receptionistName = useReceptionistName();
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadIntelligence = useCallback(() => {
    setError(null);
    fetch("/api/dashboard/intelligence")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Failed to load intelligence data"));
  }, []);

  useEffect(() => { loadIntelligence(); }, [loadIntelligence]);

  if (error) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="rounded-xl p-4 flex items-center justify-between"
        style={{
          background: "var(--db-danger-bg)",
          border: "1px solid var(--db-danger)",
          color: "var(--db-danger)",
        }}
      >
        <p className="text-sm">{error}</p>
        <button
          onClick={loadIntelligence}
          className="rounded-lg px-3 py-1.5 text-xs font-medium"
          style={{ color: "var(--db-danger)" }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return <PageSkeleton />;

  const maxHour = Math.max(...data.hourCounts, 1);
  const totalTierCount = Object.values(data.tierDistribution).reduce(
    (a, b) => a + b,
    0
  );
  const maxMonthly = Math.max(...data.monthlyTrend.map((m) => m.count), 1);
  const maxQa = Math.max(...data.weeklyQaTrend.map((w) => w.avg), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>
          {t("intelligence.title", lang, { name: receptionistName })}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          {t("intelligence.subtitle", lang, { name: receptionistName })}
        </p>
      </div>

      {/* A. Stats Hero — 4 MetricCards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 stagger-grid">
        <MetricCard label={t("intelligence.callsHandled", lang)} value={data.totalCalls} />
        <MetricCard label={t("intelligence.customersServed", lang)} value={data.totalCustomers} />
        <MetricCard label={t("intelligence.faqsMastered", lang)} value={data.totalCustomResponses} />
        <MetricCard
          label={t("intelligence.avgQaScore", lang)}
          value={data.avgQaScore}
          suffix="/100"
          changeType={
            data.avgQaScore >= 80
              ? "positive"
              : data.avgQaScore >= 50
                ? "neutral"
                : "negative"
          }
          change={
            data.avgQaScore >= 80
              ? "Excellent"
              : data.avgQaScore >= 50
                ? "Good"
                : "Needs attention"
          }
        />
      </div>

      {/* Learning banner */}
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{
          background: "linear-gradient(135deg, var(--db-surface) 0%, var(--db-card) 100%)",
          border: "1px solid var(--db-border)",
        }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: "rgba(212,168,67,0.12)" }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--db-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
            <line x1="9" y1="21" x2="15" y2="21" />
          </svg>
        </div>
        <p className="text-sm" style={{ color: "var(--db-text)" }}>
          <strong style={{ color: "var(--db-accent)" }}>{receptionistName}</strong>{" "}
          has been learning for{" "}
          <strong>{data.daysLearning} day{data.daysLearning !== 1 ? "s" : ""}</strong>{" "}
          — handling calls, building customer profiles, and mastering your FAQs.
        </p>
      </div>

      {/* B. Knowledge Mastery + C. Quality Trends */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Knowledge Mastery */}
        <div className="db-card p-5">
          <h3
            className="mb-4 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--db-text-muted)" }}
          >
            {t("intelligence.knowledgeMastery", lang)}
          </h3>

          {/* Custom responses by category */}
          <div className="space-y-3 mb-5">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
              const cnt = data.customResponsesByCategory[key] || 0;
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
                    {label}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      background:
                        cnt > 0 ? "var(--db-success-bg)" : "var(--db-hover)",
                      color: cnt > 0 ? "var(--db-success)" : "var(--db-text-muted)",
                    }}
                  >
                    {cnt}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Knowledge gaps */}
          <div
            className="rounded-lg p-4"
            style={{ background: "var(--db-hover)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--db-text-muted)" }}
              >
                {t("intelligence.knowledgeGaps", lang)}
              </p>
              <div className="flex gap-2">
                {(["pending", "answered", "dismissed"] as const).map((s) => (
                  <span
                    key={s}
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      background: `${GAP_STATUS_COLORS[s]}20`,
                      color: GAP_STATUS_COLORS[s],
                    }}
                  >
                    {data.gapCounts[s] || 0} {s}
                  </span>
                ))}
              </div>
            </div>
            {data.recentGaps.length > 0 ? (
              <div className="space-y-2">
                {data.recentGaps.slice(0, 5).map((gap) => (
                  <div
                    key={gap.id}
                    className="flex items-start gap-2"
                  >
                    <span
                      className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                      style={{
                        background: GAP_STATUS_COLORS[gap.status] || "var(--db-text-muted)",
                      }}
                    />
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--db-text-secondary)" }}
                    >
                      {gap.question}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                No knowledge gaps detected yet.
              </p>
            )}
          </div>

          {/* Teach button */}
          <Link
            href="/dashboard/settings"
            className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition"
            style={{
              background: "var(--db-accent)",
              color: "#fff",
            }}
          >
            {t("intelligence.teach", lang, { name: receptionistName })} &rarr;
          </Link>
        </div>

        {/* Quality Trends */}
        <div className="db-card p-5">
          <h3
            className="mb-4 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--db-text-muted)" }}
          >
            {t("intelligence.qualityTrends", lang)}
          </h3>

          {/* QA breakdown bars */}
          {data.avgBreakdown ? (
            <div className="space-y-3 mb-5">
              {(
                [
                  { key: "greeting", label: "Greeting" },
                  { key: "languageMatch", label: "Language Match" },
                  { key: "needCapture", label: "Need Capture" },
                  { key: "actionTaken", label: "Action Taken" },
                  { key: "accuracy", label: "Accuracy" },
                  { key: "sentiment", label: "Sentiment" },
                ] as const
              ).map((item) => {
                const val =
                  data.avgBreakdown![
                    item.key as keyof NonNullable<IntelligenceData["avgBreakdown"]>
                  ];
                return (
                  <div key={item.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs"
                        style={{ color: "var(--db-text-secondary)" }}
                      >
                        {item.label}
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "var(--db-text)" }}
                      >
                        {val}/100
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full"
                      style={{ background: "var(--db-border)" }}
                    >
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{
                          width: `${val}%`,
                          background:
                            val >= 80
                              ? "var(--db-success)"
                              : val >= 50
                                ? "var(--db-warning-alt)"
                                : "var(--db-danger)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs mb-5" style={{ color: "var(--db-text-muted)" }}>
              QA scores will appear after calls are analyzed.
            </p>
          )}

          {/* Weekly QA trend */}
          {data.weeklyQaTrend.length > 0 && (
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--db-text-muted)" }}
              >
                {t("intelligence.weeklyTrend", lang)}
              </p>
              <div className="flex items-end gap-1" style={{ height: "80px" }}>
                {data.weeklyQaTrend.map((w, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t transition-all duration-500"
                    style={{
                      height: `${(w.avg / maxQa) * 100}%`,
                      background: "var(--db-accent)",
                      minHeight: "4px",
                    }}
                    title={`${w.week}: ${w.avg}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* D. Customer Intelligence + E. Business Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Customer Intelligence */}
        <div className="db-card p-5">
          <h3
            className="mb-4 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--db-text-muted)" }}
          >
            {t("intelligence.customerIntelligence", lang)}
          </h3>

          {/* Top 5 customers */}
          {data.topCustomers.length > 0 && (
            <div className="mb-5">
              <p
                className="text-xs mb-2"
                style={{ color: "var(--db-text-muted)" }}
              >
                {t("intelligence.topCallers", lang)}
              </p>
              {data.topCustomers.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm"
                      style={{ color: "var(--db-text)" }}
                    >
                      {c.name || c.phone}
                    </span>
                    {c.tier && (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{
                          background: `${TIER_COLORS[c.tier] || "var(--db-text-muted)"}15`,
                          color: TIER_COLORS[c.tier] || "var(--db-text-muted)",
                        }}
                      >
                        {c.tier}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-sm font-medium tabular-nums"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    {c.totalCalls} calls
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tier distribution bar */}
          {totalTierCount > 0 && (
            <div className="mb-4">
              <p
                className="text-xs mb-2"
                style={{ color: "var(--db-text-muted)" }}
              >
                {t("intelligence.customerTiers", lang)}
              </p>
              <div className="flex rounded-full overflow-hidden h-3">
                {Object.entries(data.tierDistribution).map(([tier, cnt]) =>
                  cnt > 0 ? (
                    <div
                      key={tier}
                      className="transition-all duration-500"
                      style={{
                        width: `${(cnt / totalTierCount) * 100}%`,
                        background: TIER_COLORS[tier] || "var(--db-text-muted)",
                      }}
                      title={`${tier}: ${cnt}`}
                    />
                  ) : null
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {Object.entries(data.tierDistribution).map(
                  ([tier, cnt]) =>
                    cnt > 0 && (
                      <span
                        key={tier}
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--db-text-muted)" }}
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{
                            background: TIER_COLORS[tier] || "var(--db-text-muted)",
                          }}
                        />
                        {tier} ({cnt})
                      </span>
                    )
                )}
              </div>
            </div>
          )}

          {/* Repeat rate */}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
              {t("intelligence.repeatCallerRate", lang)}
            </span>
            <span
              className="text-lg font-bold"
              style={{ color: "var(--db-accent)" }}
            >
              {data.repeatRate}%
            </span>
          </div>
        </div>

        {/* Business Insights */}
        <div className="db-card p-5">
          <h3
            className="mb-4 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--db-text-muted)" }}
          >
            {t("intelligence.businessInsights", lang)}
          </h3>

          {/* Top services */}
          {data.topServices.length > 0 && (
            <div className="mb-5">
              <p
                className="text-xs mb-2"
                style={{ color: "var(--db-text-muted)" }}
              >
                {t("intelligence.topServices", lang)}
              </p>
              {data.topServices.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1"
                >
                  <span
                    className="text-sm"
                    style={{ color: "var(--db-text)" }}
                  >
                    {s.name}
                  </span>
                  <span
                    className="text-sm font-medium tabular-nums"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Busiest hours heatmap */}
          <div className="mb-5">
            <p
              className="text-xs mb-2"
              style={{ color: "var(--db-text-muted)" }}
            >
              {t("intelligence.busiestHours", lang)}
            </p>
            <div className="grid grid-cols-12 gap-0.5">
              {data.hourCounts.map((cnt, h) => {
                const intensity = maxHour > 0 ? cnt / maxHour : 0;
                return (
                  <div
                    key={h}
                    className="aspect-square rounded-sm transition-all"
                    style={{
                      background:
                        intensity > 0
                          ? `rgba(197,154,39,${0.15 + intensity * 0.85})`
                          : "var(--db-hover)",
                    }}
                    title={`${h % 12 || 12}${h >= 12 ? "PM" : "AM"}: ${cnt} calls`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span
                className="text-[9px]"
                style={{ color: "var(--db-text-muted)" }}
              >
                12AM
              </span>
              <span
                className="text-[9px]"
                style={{ color: "var(--db-text-muted)" }}
              >
                12PM
              </span>
              <span
                className="text-[9px]"
                style={{ color: "var(--db-text-muted)" }}
              >
                11PM
              </span>
            </div>
          </div>

          {/* Bilingual percentage */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
              {t("intelligence.bilingualCalls", lang)}
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--db-accent)" }}
            >
              {data.bilingualPercent}%
            </span>
          </div>

          {/* Monthly volume trend */}
          {data.monthlyTrend.length > 0 && (
            <div>
              <p
                className="text-xs mb-2"
                style={{ color: "var(--db-text-muted)" }}
              >
                {t("intelligence.monthlyVolume", lang)}
              </p>
              <div className="flex items-end gap-1" style={{ height: "64px" }}>
                {data.monthlyTrend.map((m, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t transition-all duration-500"
                    style={{
                      height: `${(m.count / maxMonthly) * 100}%`,
                      background: "var(--db-accent)",
                      minHeight: "4px",
                    }}
                    title={`${m.month}: ${m.count}`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {data.monthlyTrend.map((m, i) => (
                  <span
                    key={i}
                    className="flex-1 text-center text-[9px]"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    {m.month.slice(5)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
