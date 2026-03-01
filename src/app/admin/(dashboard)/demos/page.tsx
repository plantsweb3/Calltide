"use client";

import { useState, useEffect } from "react";

interface DemoMetrics {
  totalDemos: number;
  todayDemos: number;
  avgDuration: number;
  conversionRate: number;
  phaseFunnel: {
    started: number;
    reachedROI: number;
    reachedRoleplay: number;
    reachedClose: number;
    converted: number;
  };
  topTrades: { trade: string; count: number }[];
  topPainPoints: { pain: string; count: number }[];
  avgMonthlyLoss: number;
  languageBreakdown: { language: string; count: number }[];
  businessSizes: { size: string; count: number }[];
  recentDemos: {
    id: string;
    startedAt: string;
    durationSeconds: number | null;
    businessType: string | null;
    businessName: string | null;
    businessSize: string | null;
    reachedROI: boolean;
    reachedRoleplay: boolean;
    reachedClose: boolean;
    convertedToSignup: boolean;
    language: string | null;
    estimatedMonthlyLoss: number | null;
  }[];
}

function MetricBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg p-4" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
      <p className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: "var(--db-text)" }}>{value}</p>
      {sub && <p className="mt-0.5 text-xs" style={{ color: "var(--db-text-muted)" }}>{sub}</p>}
    </div>
  );
}

function FunnelBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: "var(--db-text)" }}>{label}</span>
        <span style={{ color: "var(--db-text-muted)" }}>{count} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "var(--db-border)" }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, background: "var(--db-accent)" }}
        />
      </div>
    </div>
  );
}

function PhaseBadge({ reached }: { reached: boolean }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ background: reached ? "#22C55E" : "var(--db-border)" }}
    />
  );
}

export default function AdminDemosPage() {
  const [metrics, setMetrics] = useState<DemoMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/demos")
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--db-accent)" }} />
      </div>
    );
  }

  if (!metrics) {
    return <p className="py-20 text-center" style={{ color: "var(--db-text-muted)" }}>Failed to load demo analytics.</p>;
  }

  const f = metrics.phaseFunnel;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>Demo Analytics</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          Live Maria demo performance on the landing page.
        </p>
      </div>

      {/* Top-level metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricBox label="Total Demos" value={metrics.totalDemos} />
        <MetricBox label="Today" value={metrics.todayDemos} sub="demos started" />
        <MetricBox label="Avg Duration" value={`${Math.round(metrics.avgDuration)}s`} sub={`${Math.round(metrics.avgDuration / 60)}m ${Math.round(metrics.avgDuration % 60)}s`} />
        <MetricBox label="Conversion Rate" value={`${metrics.conversionRate}%`} sub="demo → signup" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Phase Funnel */}
        <div className="rounded-lg p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--db-text)" }}>Phase Funnel</h2>
          <div className="space-y-3">
            <FunnelBar label="Started" count={f.started} total={f.started} />
            <FunnelBar label="Reached ROI" count={f.reachedROI} total={f.started} />
            <FunnelBar label="Reached Roleplay" count={f.reachedRoleplay} total={f.started} />
            <FunnelBar label="Reached Close" count={f.reachedClose} total={f.started} />
            <FunnelBar label="Converted" count={f.converted} total={f.started} />
          </div>
        </div>

        {/* Top Trades */}
        <div className="rounded-lg p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--db-text)" }}>Top Business Types</h2>
          {metrics.topTrades.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>No trade data yet.</p>
          ) : (
            <div className="space-y-2">
              {metrics.topTrades.map((t) => (
                <div key={t.trade} className="flex items-center justify-between text-sm">
                  <span className="capitalize" style={{ color: "var(--db-text)" }}>{t.trade.replace(/_/g, " ")}</span>
                  <span className="font-medium" style={{ color: "var(--db-accent)" }}>{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pain Points */}
        <div className="rounded-lg p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--db-text)" }}>Top Pain Points</h2>
          {metrics.topPainPoints.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>No pain point data yet.</p>
          ) : (
            <div className="space-y-2">
              {metrics.topPainPoints.map((p) => (
                <div key={p.pain} className="flex items-center justify-between text-sm">
                  <span className="capitalize" style={{ color: "var(--db-text)" }}>{p.pain}</span>
                  <span className="font-medium" style={{ color: "var(--db-accent)" }}>{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Language + Size Breakdown */}
        <div className="rounded-lg p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--db-text)" }}>Breakdown</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Language</p>
              {metrics.languageBreakdown.map((l) => (
                <div key={l.language} className="flex items-center justify-between text-sm">
                  <span className="uppercase" style={{ color: "var(--db-text)" }}>{l.language}</span>
                  <span style={{ color: "var(--db-text-muted)" }}>{l.count}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-2 text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Business Size</p>
              {metrics.businessSizes.map((s) => (
                <div key={s.size} className="flex items-center justify-between text-sm">
                  <span className="capitalize" style={{ color: "var(--db-text)" }}>{s.size}</span>
                  <span style={{ color: "var(--db-text-muted)" }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
          {metrics.avgMonthlyLoss > 0 && (
            <div className="mt-4 rounded-lg p-3" style={{ background: "var(--db-hover)" }}>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Avg Estimated Monthly Loss</p>
              <p className="text-lg font-bold" style={{ color: "var(--db-accent)" }}>${metrics.avgMonthlyLoss.toLocaleString()}/mo</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Demos Table */}
      <div className="rounded-lg" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
        <div className="border-b p-4" style={{ borderColor: "var(--db-border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>Recent Demos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--db-border)" }}>
                <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Business</th>
                <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Trade</th>
                <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Duration</th>
                <th className="px-4 py-2 text-center text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Phases</th>
                <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Est. Loss</th>
                <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Lang</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentDemos.map((d) => (
                <tr key={d.id} style={{ borderBottom: "1px solid var(--db-border)" }}>
                  <td className="px-4 py-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
                    {new Date(d.startedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2" style={{ color: "var(--db-text)" }}>
                    {d.businessName || "—"}
                    {d.businessSize && <span className="ml-1 text-xs" style={{ color: "var(--db-text-muted)" }}>({d.businessSize})</span>}
                  </td>
                  <td className="px-4 py-2 capitalize" style={{ color: "var(--db-text)" }}>
                    {d.businessType?.replace(/_/g, " ") || "—"}
                  </td>
                  <td className="px-4 py-2 tabular-nums" style={{ color: "var(--db-text)" }}>
                    {d.durationSeconds != null ? `${Math.floor(d.durationSeconds / 60)}:${String(d.durationSeconds % 60).padStart(2, "0")}` : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-1.5">
                      <PhaseBadge reached={d.reachedROI} />
                      <PhaseBadge reached={d.reachedRoleplay} />
                      <PhaseBadge reached={d.reachedClose} />
                      {d.convertedToSignup && (
                        <span className="ml-1 text-[10px] font-bold text-green-400">CONV</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 tabular-nums" style={{ color: d.estimatedMonthlyLoss ? "var(--db-accent)" : "var(--db-text-muted)" }}>
                    {d.estimatedMonthlyLoss ? `$${d.estimatedMonthlyLoss.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-2 uppercase" style={{ color: "var(--db-text-muted)" }}>
                    {d.language || "en"}
                  </td>
                </tr>
              ))}
              {metrics.recentDemos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center" style={{ color: "var(--db-text-muted)" }}>
                    No demos yet. Once visitors talk to Maria on the landing page, data will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
