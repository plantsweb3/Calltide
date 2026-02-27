"use client";

import { useCallback, useEffect, useState } from "react";
import MetricCard from "../../_components/metric-card";
import DataTable, { type Column } from "../../_components/data-table";
import StatusBadge from "../../_components/status-badge";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface QaScore {
  callId: string;
  score: number;
  flags: string[];
  fixRecommendation: string | null;
  summary: string | null;
  createdAt: string;
}

interface ClientRow {
  id: string;
  name: string;
  healthScore: number;
  lastNpsScore: number | null;
  qaGrade: string | null;
  callVolumeTrend: string;
  active: boolean;
  createdAt: string;
  isNewClient: boolean;
  callCount: number;
  avgQaScore: number | null;
  qaFlags: number;
  daysIn: number;
  qaScores: QaScore[];
}

interface NpsResponse {
  id: string;
  businessName: string;
  score: number;
  classification: string;
  feedback: string | null;
  followUpAction: string | null;
  escalated: boolean;
  createdAt: string;
}

interface TopReferrer {
  businessName: string;
  referralsMade: number;
  conversions: number;
  creditsEarned: number;
}

interface ReferralActivity {
  id: string;
  referrerName: string;
  status: string;
  createdAt: string;
}

interface SuccessData {
  summary: {
    activeClients: number;
    avgHealthScore: number;
    nps: { promoters: number; passives: number; detractors: number };
    referrals: { total: number; converted: number };
  };
  clients: ClientRow[];
  npsResponses: NpsResponse[];
  referralStats: {
    codesIssued: number;
    linksVisited: number;
    signedUp: number;
    activated: number;
    topReferrers: TopReferrer[];
    recentActivity: ReferralActivity[];
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type Tab = "health" | "onboarding" | "nps" | "referrals";

const TABS: { key: Tab; label: string }[] = [
  { key: "health", label: "Client Health" },
  { key: "onboarding", label: "Onboarding QA" },
  { key: "nps", label: "NPS Responses" },
  { key: "referrals", label: "Referrals" },
];

function healthColor(score: number): string {
  if (score > 70) return "#4ade80";
  if (score >= 50) return "#fbbf24";
  return "#ef4444";
}

function gradeColor(grade: string | null): string {
  if (!grade) return "var(--db-text-muted)";
  const g = grade.toUpperCase();
  if (g === "A" || g === "A+") return "#4ade80";
  if (g === "B" || g === "B+") return "#60a5fa";
  if (g === "C" || g === "C+") return "#fbbf24";
  return "#ef4444";
}

function npsColor(score: number): string {
  if (score >= 9) return "#4ade80";
  if (score >= 7) return "#fbbf24";
  return "#ef4444";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ClientSuccessPage() {
  const [data, setData] = useState<SuccessData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("health");

  /* Health tab filters */
  const [healthFilter, setHealthFilter] = useState<"all" | "at-risk" | "promoters" | "new">("all");

  /* NPS tab filter */
  const [npsFilter, setNpsFilter] = useState<"all" | "promoter" | "passive" | "detractor">("all");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/client-success");
      if (!res.ok) throw new Error("Failed to load client success data");
      const json: SuccessData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Loading */
  if (!data && !error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p style={{ color: "var(--db-text-muted)" }}>Loading client success...</p>
      </div>
    );
  }

  /* Error */
  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p style={{ color: "#f87171" }}>{error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchData();
          }}
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ background: "var(--db-accent)", color: "#fff" }}
        >
          Retry
        </button>
      </div>
    );
  }

  /* Data is guaranteed non-null past this point */
  const d = data!;
  const { summary } = d;

  /* ---- Derived: health score change type ---- */
  const avgHealthChangeType: "positive" | "neutral" | "negative" =
    summary.avgHealthScore > 70
      ? "positive"
      : summary.avgHealthScore >= 50
        ? "neutral"
        : "negative";

  /* ---- Derived: NPS text ---- */
  const npsText = `${summary.nps.promoters}P / ${summary.nps.passives}Pa / ${summary.nps.detractors}D`;

  /* ---- Derived: referral conversion rate ---- */
  const refConvRate =
    summary.referrals.total > 0
      ? Math.round((summary.referrals.converted / summary.referrals.total) * 100)
      : 0;

  /* ---- Filtered client lists ---- */
  const healthClients = [...d.clients]
    .filter((c) => {
      if (healthFilter === "at-risk") return c.healthScore < 50;
      if (healthFilter === "promoters") return c.lastNpsScore !== null && c.lastNpsScore >= 9;
      if (healthFilter === "new") return c.isNewClient;
      return true;
    })
    .sort((a, b) => a.healthScore - b.healthScore);

  const onboardingClients = d.clients
    .filter((c) => c.daysIn <= 7)
    .sort((a, b) => a.daysIn - b.daysIn);

  const filteredNps = d.npsResponses.filter((r) => {
    if (npsFilter === "promoter") return r.classification === "promoter";
    if (npsFilter === "passive") return r.classification === "passive";
    if (npsFilter === "detractor") return r.classification === "detractor";
    return true;
  });

  /* ================================================================ */
  /*  Column definitions                                               */
  /* ================================================================ */

  /* --- Health table --- */
  const healthColumns: Column<ClientRow>[] = [
    {
      key: "name",
      label: "Business Name",
      render: (row) => (
        <span className="font-medium" style={{ color: "var(--db-text)" }}>
          {row.name}
        </span>
      ),
    },
    {
      key: "healthScore",
      label: "Health Score",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div
            className="h-2 flex-1 rounded-full overflow-hidden"
            style={{ background: "var(--db-hover)", maxWidth: 100 }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(row.healthScore, 100)}%`,
                background: healthColor(row.healthScore),
              }}
            />
          </div>
          <span
            className="text-xs font-medium tabular-nums"
            style={{ color: healthColor(row.healthScore) }}
          >
            {row.healthScore}
          </span>
        </div>
      ),
    },
    {
      key: "lastNpsScore",
      label: "Last NPS",
      render: (row) =>
        row.lastNpsScore !== null ? (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              background:
                row.lastNpsScore >= 9
                  ? "rgba(74,222,128,0.1)"
                  : row.lastNpsScore >= 7
                    ? "rgba(251,191,36,0.1)"
                    : "rgba(239,68,68,0.1)",
              color: npsColor(row.lastNpsScore),
            }}
          >
            {row.lastNpsScore}
          </span>
        ) : (
          <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            --
          </span>
        ),
    },
    {
      key: "qaGrade",
      label: "QA Grade",
      render: (row) => (
        <span
          className="text-sm font-semibold"
          style={{ color: gradeColor(row.qaGrade) }}
        >
          {row.qaGrade || "--"}
        </span>
      ),
    },
    {
      key: "callVolumeTrend",
      label: "Call Volume Trend",
      render: (row) => {
        const isUp = row.callVolumeTrend.startsWith("\u2191");
        const isDown = row.callVolumeTrend.startsWith("\u2193");
        return (
          <span
            className="text-xs font-medium"
            style={{
              color: isUp ? "#4ade80" : isDown ? "#ef4444" : "var(--db-text-muted)",
            }}
          >
            {row.callVolumeTrend}
          </span>
        );
      },
    },
    {
      key: "active",
      label: "Status",
      render: (row) => <StatusBadge status={row.active ? "active" : "churned"} />,
    },
  ];

  /* --- Onboarding QA table --- */
  const onboardingColumns: Column<ClientRow>[] = [
    {
      key: "name",
      label: "Business Name",
      render: (row) => (
        <span className="font-medium" style={{ color: "var(--db-text)" }}>
          {row.name}
        </span>
      ),
    },
    {
      key: "callCount",
      label: "Call Count",
      render: (row) => (
        <span className="text-sm tabular-nums" style={{ color: "var(--db-text)" }}>
          {row.callCount}
        </span>
      ),
    },
    {
      key: "avgQaScore",
      label: "Avg QA Score",
      render: (row) =>
        row.avgQaScore !== null ? (
          <span
            className="text-sm font-medium tabular-nums"
            style={{ color: healthColor(row.avgQaScore) }}
          >
            {row.avgQaScore.toFixed(1)}
          </span>
        ) : (
          <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            --
          </span>
        ),
    },
    {
      key: "qaFlags",
      label: "Flags",
      render: (row) => (
        <span
          className="text-sm tabular-nums"
          style={{ color: row.qaFlags > 0 ? "#ef4444" : "var(--db-text-muted)" }}
        >
          {row.qaFlags}
        </span>
      ),
    },
    {
      key: "qaGrade",
      label: "Grade So Far",
      render: (row) => (
        <span
          className="text-sm font-semibold"
          style={{ color: gradeColor(row.qaGrade) }}
        >
          {row.qaGrade || "--"}
        </span>
      ),
    },
    {
      key: "daysIn",
      label: "Days In",
      render: (row) => (
        <span className="text-sm tabular-nums" style={{ color: "var(--db-text-secondary)" }}>
          {row.daysIn}
        </span>
      ),
    },
  ];

  /* --- NPS table --- */
  const npsColumns: Column<NpsResponse>[] = [
    {
      key: "createdAt",
      label: "Date",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "businessName",
      label: "Business Name",
      render: (row) => (
        <span className="text-sm" style={{ color: "var(--db-text)" }}>
          {row.businessName}
        </span>
      ),
    },
    {
      key: "score",
      label: "Score",
      render: (row) => (
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
          style={{
            background:
              row.score >= 9
                ? "rgba(74,222,128,0.15)"
                : row.score >= 7
                  ? "rgba(251,191,36,0.15)"
                  : "rgba(239,68,68,0.15)",
            color: npsColor(row.score),
          }}
        >
          {row.score}
        </span>
      ),
    },
    {
      key: "classification",
      label: "Classification",
      render: (row) => {
        const styles: Record<string, { bg: string; color: string }> = {
          promoter: { bg: "rgba(74,222,128,0.1)", color: "#4ade80" },
          passive: { bg: "rgba(251,191,36,0.1)", color: "#fbbf24" },
          detractor: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
        };
        const s = styles[row.classification] || {
          bg: "var(--db-hover)",
          color: "var(--db-text-muted)",
        };
        return (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
            style={{ background: s.bg, color: s.color }}
          >
            {row.classification}
          </span>
        );
      },
    },
    {
      key: "feedback",
      label: "Feedback",
      render: (row) => (
        <span
          className="block max-w-[220px] truncate text-xs"
          style={{ color: "var(--db-text-secondary)" }}
          title={row.feedback || undefined}
        >
          {row.feedback || "--"}
        </span>
      ),
    },
    {
      key: "followUpAction",
      label: "Action Taken",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-secondary)" }}>
          {row.followUpAction || "--"}
        </span>
      ),
    },
    {
      key: "escalated",
      label: "Escalated",
      render: (row) => (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={
            row.escalated
              ? { background: "rgba(239,68,68,0.1)", color: "#ef4444" }
              : { background: "rgba(74,222,128,0.1)", color: "#4ade80" }
          }
        >
          {row.escalated ? "Yes" : "No"}
        </span>
      ),
    },
  ];

  /* --- Referrers table --- */
  const referrerColumns: Column<TopReferrer & { id: string }>[] = [
    {
      key: "businessName",
      label: "Business Name",
      render: (row) => (
        <span className="font-medium" style={{ color: "var(--db-text)" }}>
          {row.businessName}
        </span>
      ),
    },
    {
      key: "referralsMade",
      label: "Referrals Made",
      render: (row) => (
        <span className="text-sm tabular-nums" style={{ color: "var(--db-text)" }}>
          {row.referralsMade}
        </span>
      ),
    },
    {
      key: "conversions",
      label: "Conversions",
      render: (row) => (
        <span className="text-sm tabular-nums" style={{ color: "#4ade80" }}>
          {row.conversions}
        </span>
      ),
    },
    {
      key: "creditsEarned",
      label: "Credits Earned",
      render: (row) => (
        <span className="text-sm font-medium tabular-nums" style={{ color: "var(--db-text)" }}>
          ${row.creditsEarned.toFixed(2)}
        </span>
      ),
    },
  ];

  /* ================================================================ */
  /*  Expanded onboarding row                                          */
  /* ================================================================ */

  function renderOnboardingExpanded(row: ClientRow) {
    if (!row.qaScores || row.qaScores.length === 0) {
      return (
        <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
          No individual call QA data yet.
        </p>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-xs font-medium" style={{ color: "var(--db-text-secondary)" }}>
          Individual Call QA Scores
        </p>
        {row.qaScores.map((qa) => {
          const flagged = qa.score < 70;
          return (
            <div
              key={qa.callId}
              className="flex flex-wrap items-start gap-4 rounded-lg p-3"
              style={{
                background: flagged ? "rgba(239,68,68,0.06)" : "var(--db-surface)",
                border: flagged
                  ? "1px solid rgba(239,68,68,0.2)"
                  : "1px solid var(--db-border)",
              }}
            >
              <div className="flex-shrink-0">
                <span className="text-[10px]" style={{ color: "var(--db-text-muted)" }}>
                  {formatDateTime(qa.createdAt)}
                </span>
              </div>
              <div className="flex-shrink-0">
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: healthColor(qa.score) }}
                >
                  {qa.score}
                </span>
              </div>
              {qa.flags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {qa.flags.map((flag, i) => (
                    <span
                      key={i}
                      className="rounded px-1.5 py-0.5 text-[10px]"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              )}
              {qa.fixRecommendation && (
                <p className="text-xs" style={{ color: "var(--db-text-secondary)" }}>
                  {qa.fixRecommendation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>
          Client Success
        </h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          Health scores, QA, NPS, and referrals
        </p>
      </div>

      {/* Summary metric cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Active Clients" value={summary.activeClients} />
        <MetricCard
          label="Avg Health Score"
          value={summary.avgHealthScore}
          changeType={avgHealthChangeType}
        />
        <MetricCard label="NPS Distribution" value={npsText} />
        <MetricCard
          label="Total Referrals"
          value={summary.referrals.total}
          suffix={` (${refConvRate}% conv)`}
        />
      </div>

      {/* Tab navigation */}
      <div
        className="flex gap-1 rounded-xl p-1 w-fit"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={
              activeTab === tab.key
                ? { background: "var(--db-accent)", color: "#fff" }
                : { background: "var(--db-hover)", color: "var(--db-text-muted)" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  TAB 1: Client Health                                         */}
      {/* ============================================================ */}
      {activeTab === "health" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "all", label: "All" },
                { key: "at-risk", label: "At Risk" },
                { key: "promoters", label: "Promoters" },
                { key: "new", label: "New" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setHealthFilter(f.key)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                style={
                  healthFilter === f.key
                    ? { background: "var(--db-accent)", color: "#fff" }
                    : { background: "var(--db-hover)", color: "var(--db-text-muted)" }
                }
              >
                {f.label}
              </button>
            ))}
          </div>

          <DataTable columns={healthColumns} data={healthClients} />
        </div>
      )}

      {/* ============================================================ */}
      {/*  TAB 2: Onboarding QA                                         */}
      {/* ============================================================ */}
      {activeTab === "onboarding" && (
        <div className="space-y-4">
          {onboardingClients.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{
                background: "var(--db-card)",
                border: "1px solid var(--db-border)",
              }}
            >
              <p style={{ color: "var(--db-text-muted)" }}>
                No clients in their first 7 days right now.
              </p>
            </div>
          ) : (
            <DataTable
              columns={onboardingColumns}
              data={onboardingClients}
              expandedContent={renderOnboardingExpanded}
            />
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/*  TAB 3: NPS Responses                                         */}
      {/* ============================================================ */}
      {activeTab === "nps" && (
        <div className="space-y-4">
          {/* NPS filter buttons */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "all", label: "All" },
                { key: "promoter", label: "Promoters" },
                { key: "passive", label: "Passives" },
                { key: "detractor", label: "Detractors" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setNpsFilter(f.key)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                style={
                  npsFilter === f.key
                    ? { background: "var(--db-accent)", color: "#fff" }
                    : { background: "var(--db-hover)", color: "var(--db-text-muted)" }
                }
              >
                {f.label}
              </button>
            ))}
          </div>

          <DataTable columns={npsColumns} data={filteredNps} />
        </div>
      )}

      {/* ============================================================ */}
      {/*  TAB 4: Referrals                                             */}
      {/* ============================================================ */}
      {activeTab === "referrals" && (
        <div className="space-y-6">
          {/* Funnel stat cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Codes Issued", value: d.referralStats.codesIssued },
              { label: "Links Visited", value: d.referralStats.linksVisited },
              { label: "Signed Up", value: d.referralStats.signedUp },
              { label: "Activated", value: d.referralStats.activated },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-5"
                style={{
                  background: "var(--db-card)",
                  border: "1px solid var(--db-border)",
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--db-text-secondary)" }}
                >
                  {stat.label}
                </p>
                <p
                  className="mt-2 text-3xl font-semibold tabular-nums"
                  style={{ color: "var(--db-text)" }}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Top referrers table */}
          <div>
            <h3
              className="mb-3 text-sm font-medium"
              style={{ color: "var(--db-text-secondary)" }}
            >
              Top Referrers
            </h3>
            <DataTable
              columns={referrerColumns}
              data={d.referralStats.topReferrers.map((r, i) => ({
                ...r,
                id: `ref-${i}`,
              }))}
            />
          </div>

          {/* Recent referral activity */}
          <div>
            <h3
              className="mb-3 text-sm font-medium"
              style={{ color: "var(--db-text-secondary)" }}
            >
              Recent Activity
            </h3>
            {d.referralStats.recentActivity.length === 0 ? (
              <div
                className="rounded-xl p-6 text-center"
                style={{
                  background: "var(--db-card)",
                  border: "1px solid var(--db-border)",
                }}
              >
                <p style={{ color: "var(--db-text-muted)" }}>No recent referral activity.</p>
              </div>
            ) : (
              <div
                className="divide-y rounded-xl overflow-hidden"
                style={{
                  background: "var(--db-card)",
                  border: "1px solid var(--db-border)",
                  borderColor: "var(--db-border)",
                }}
              >
                {d.referralStats.recentActivity.map((activity) => {
                  const statusStyle: Record<string, { bg: string; color: string }> = {
                    visited: { bg: "rgba(96,165,250,0.1)", color: "#60a5fa" },
                    signed_up: { bg: "rgba(251,191,36,0.1)", color: "#fbbf24" },
                    activated: { bg: "rgba(74,222,128,0.1)", color: "#4ade80" },
                  };
                  const s = statusStyle[activity.status] || {
                    bg: "var(--db-hover)",
                    color: "var(--db-text-muted)",
                  };

                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between px-4 py-3 transition-colors"
                      style={{ borderColor: "var(--db-border)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--db-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--db-text)" }}
                        >
                          {activity.referrerName}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: s.bg, color: s.color }}
                        >
                          {activity.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: "var(--db-text-muted)" }}
                      >
                        {formatDateTime(activity.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
