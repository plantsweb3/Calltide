"use client";

import { useEffect, useState, useCallback } from "react";
import MetricCard from "../../_components/metric-card";
import DataTable, { type Column } from "../../_components/data-table";
import StatusBadge from "../../_components/status-badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type Tab = "status" | "utilization" | "growth" | "costs" | "playbook";

function fmt(cents: number): string {
  return `$${(cents / 100).toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const TIER_ORDER = ["seed", "growth", "scale", "enterprise", "hypergrowth"];

export default function CapacityPage() {
  const [tab, setTab] = useState<Tab>("status");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    fetch("/api/capacity/status")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError("Failed to load capacity data"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "status", label: "Real-Time Status" },
    { key: "utilization", label: "Provider Utilization" },
    { key: "growth", label: "Growth Modeling" },
    { key: "costs", label: "Cost Projections" },
    { key: "playbook", label: "Scaling Playbook" },
  ];

  if (loading && !error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p style={{ color: "var(--db-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Capacity Planning</h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          Infrastructure monitoring, provider utilization, and scaling readiness
        </p>
      </div>

      {error && (
        <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
        </div>
      )}

      <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--db-hover)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              background: tab === t.key ? "var(--db-card)" : "transparent",
              color: tab === t.key ? "var(--db-text)" : "var(--db-text-muted)",
              boxShadow: tab === t.key ? "0 1px 2px rgba(0,0,0,0.05)" : undefined,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "status" && <StatusTab data={data} />}
      {tab === "utilization" && <UtilizationTab data={data} />}
      {tab === "growth" && <GrowthTab data={data} />}
      {tab === "costs" && <CostsTab data={data} />}
      {tab === "playbook" && <PlaybookTab data={data} />}
    </div>
  );
}

// ── Tab 1: Real-Time Status ──

function StatusTab({ data }: { data: any }) {
  if (!data) return null;
  const concurrentPct = data.concurrentLimit > 0 ? (data.concurrent / data.concurrentLimit) * 100 : 0;
  const concurrentColor = concurrentPct >= 85 ? "#ef4444" : concurrentPct >= 70 ? "#f59e0b" : "#4ade80";

  const providers = [
    { name: "Hume", status: getProviderStatus(data.snapshot?.humeMinutesMtd, data.providerLimits?.hume?.monthlyMinutes) },
    { name: "Anthropic", status: getProviderStatus(data.snapshot?.anthropicSpendMtd, data.providerLimits?.anthropic?.monthlySpendLimit) },
    { name: "Turso", status: getProviderStatus(data.snapshot?.tursoRowReadsMtd, data.providerLimits?.turso?.rowReadLimit) },
    { name: "Twilio", status: data.snapshot?.twilioSuccessRate >= 99 ? "operational" : data.snapshot?.twilioSuccessRate >= 95 ? "degraded" : "down" },
    { name: "Vercel", status: "operational" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Active Clients" value={data.activeClients} />
        <MetricCard label="Current Tier" value={data.tier?.toUpperCase() ?? "—"} />
        <MetricCard label="Calls Today" value={data.snapshot?.callsToday ?? 0} />
        <MetricCard label="Active Alerts" value={data.alerts?.length ?? 0} />
      </div>

      {/* Concurrent Calls Gauge */}
      <div className="rounded-xl p-6" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium" style={{ color: "var(--db-text)" }}>Live Concurrent Calls</h3>
          <span className="text-3xl font-bold" style={{ color: concurrentColor }}>
            {data.concurrent} <span className="text-sm font-normal" style={{ color: "var(--db-text-muted)" }}>/ {data.concurrentLimit}</span>
          </span>
        </div>
        <div className="h-4 rounded-full overflow-hidden" style={{ background: "var(--db-hover)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(concurrentPct, 100)}%`, background: concurrentColor }}
          />
        </div>
      </div>

      {/* Provider Health Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {providers.map((p) => (
          <div key={p.name} className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>{p.name}</p>
            <StatusBadge status={p.status} />
          </div>
        ))}
      </div>

      {/* Recent Alerts */}
      {data.alerts?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2" style={{ color: "var(--db-text)" }}>Active Alerts</h3>
          <div className="space-y-2">
            {data.alerts.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg px-4 py-2" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <StatusBadge status={a.severity} />
                <span className="flex-1 text-sm" style={{ color: "var(--db-text)" }}>{a.message}</span>
                <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{new Date(a.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Provider Utilization ──

function UtilizationTab({ data }: { data: any }) {
  if (!data) return null;
  const snapshot = data.snapshot;
  const limits = data.providerLimits;

  const metrics = [
    { provider: "Hume", metric: "Monthly Minutes", current: snapshot?.humeMinutesMtd ?? 0, limit: limits?.hume?.monthlyMinutes ?? 1200, unit: "min" },
    { provider: "Hume", metric: "Concurrent Limit", current: data.concurrent, limit: limits?.hume?.concurrentLimit ?? 10, unit: "" },
    { provider: "Anthropic", metric: "Monthly Spend", current: snapshot?.anthropicSpendMtd ?? 0, limit: limits?.anthropic?.monthlySpendLimit ?? 50000, unit: "¢", isCents: true },
    { provider: "Turso", metric: "Row Reads", current: snapshot?.tursoRowReadsMtd ?? 0, limit: limits?.turso?.rowReadLimit ?? 2500000000, unit: "" },
    { provider: "Turso", metric: "Row Writes", current: snapshot?.tursoRowWritesMtd ?? 0, limit: limits?.turso?.rowWriteLimit ?? 10000000, unit: "" },
  ];

  return (
    <div className="space-y-4">
      {metrics.map((m, i) => {
        const pct = m.limit > 0 ? (m.current / m.limit) * 100 : 0;
        const color = pct >= 85 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#4ade80";
        return (
          <div key={i} className="rounded-lg p-4" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{m.provider}</span>
                <span className="text-xs ml-2" style={{ color: "var(--db-text-muted)" }}>{m.metric}</span>
              </div>
              <span className="text-sm font-mono" style={{ color }}>
                {m.isCents ? fmt(m.current) : m.current.toLocaleString()} / {m.isCents ? fmt(m.limit) : m.limit.toLocaleString()} {m.unit}
                <span className="ml-2">({pct.toFixed(1)}%)</span>
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--db-hover)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
            </div>
          </div>
        );
      })}

      {(data.snapshots?.length ?? 0) > 1 && (
        <ChartCard title="Hume Minutes (MTD) — Last 30 Days">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={(data.snapshots ?? []).slice(-30)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--db-border)" />
              <XAxis dataKey="date" tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }} />
              <Area type="monotone" dataKey="humeMinutesMtd" name="Minutes" stroke="#C59A27" fill="rgba(197,154,39,0.1)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}

// ── Tab 3: Growth Modeling ──

function GrowthTab({ data }: { data: any }) {
  if (!data) return null;

  const clientChart = (data.snapshots ?? []).slice(-90).map((s: any) => ({
    date: s.date,
    clients: s.activeClients,
    calls: s.callsToday,
  }));

  const breachColumns: Column<any>[] = [
    { key: "provider", label: "Provider", render: (r) => <span className="font-medium" style={{ color: "var(--db-text)" }}>{r.provider}</span> },
    { key: "metric", label: "Metric", render: (r) => <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{r.metric}</span> },
    { key: "current", label: "Current", render: (r) => <span className="text-sm font-mono" style={{ color: "var(--db-text)" }}>{r.current.toLocaleString()}</span> },
    { key: "limit", label: "Limit", render: (r) => <span className="text-sm font-mono" style={{ color: "var(--db-text-muted)" }}>{r.limit.toLocaleString()}</span> },
    {
      key: "breachDate",
      label: "Projected Breach",
      render: (r) => {
        if (!r.breachDate) return <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>No breach projected</span>;
        const d = new Date(r.breachDate);
        const daysAway = Math.max(0, Math.floor((d.getTime() - Date.now()) / 86400000));
        const color = daysAway <= 3 ? "#ef4444" : daysAway <= 7 ? "#f59e0b" : "#3b82f6";
        return <span className="text-sm font-medium" style={{ color }}>{d.toLocaleDateString()} ({daysAway}d)</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <MetricCard label="Active Clients" value={data.activeClients} />
        <MetricCard label="Current Tier" value={data.tier?.toUpperCase() ?? "—"} />
        <MetricCard label="Est. Peak Concurrent" value={data.estimatedPeak ?? 0} />
      </div>

      {clientChart.length > 1 && (
        <ChartCard title="Client Count + Daily Calls">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={clientChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--db-border)" />
              <XAxis dataKey="date" tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis yAxisId="left" tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="clients" name="Clients" stroke="#C59A27" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="calls" name="Calls/Day" stroke="#60a5fa" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div>
        <h3 className="text-sm font-medium mb-2" style={{ color: "var(--db-text)" }}>Breach Projections</h3>
        <DataTable columns={breachColumns} data={data.breachProjections ?? []} />
      </div>
    </div>
  );
}

// ── Tab 4: Cost Projections ──

function CostsTab({ data }: { data: any }) {
  if (!data) return null;
  const cost = data.costEstimate ?? { hume: 0, anthropic: 0, twilio: 0, turso: 0, vercel: 0, total: 0 };

  const breakdown = [
    { provider: "Hume", cost: cost.hume, color: "#C59A27" },
    { provider: "Anthropic", cost: cost.anthropic, color: "#8b5cf6" },
    { provider: "Twilio", cost: cost.twilio, color: "#ef4444" },
    { provider: "Turso", cost: cost.turso, color: "#3b82f6" },
    { provider: "Vercel", cost: cost.vercel, color: "#4ade80" },
  ];

  // What-if projections
  const projections = [10, 25, 50, 100, 200, 500, 1000].map((clients) => {
    const callsPerMonth = clients * 10 * 30;
    const minutes = callsPerMonth * 2.5;
    const h = Math.round(minutes * 5);
    const a = Math.round(callsPerMonth * 3);
    const t = Math.round(minutes * 1.3 + callsPerMonth * 0.5);
    const tu = clients <= 50 ? 500 : clients <= 500 ? 2900 : 9900;
    const v = clients <= 50 ? 0 : 2000;
    const total = h + a + t + tu + v;
    const revenue = clients * 49700;
    return { id: String(clients), clients, total, revenue, margin: revenue - total, marginPct: revenue > 0 ? ((revenue - total) / revenue * 100) : 0 };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <MetricCard label="Est. Monthly Cost" value={cost.total / 100} prefix="$" />
        <MetricCard label="Active Clients" value={data.activeClients} />
        <MetricCard label="Cost per Client" value={data.activeClients > 0 ? Math.round(cost.total / data.activeClients) / 100 : 0} prefix="$" />
      </div>

      {/* Cost Breakdown */}
      <div className="rounded-xl p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
        <h3 className="text-sm font-medium mb-4" style={{ color: "var(--db-text)" }}>Cost Breakdown</h3>
        <div className="space-y-3">
          {breakdown.map((b) => {
            const pct = cost.total > 0 ? (b.cost / cost.total) * 100 : 0;
            return (
              <div key={b.provider}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: "var(--db-text)" }}>{b.provider}</span>
                  <span className="text-sm font-mono" style={{ color: "var(--db-text)" }}>{fmt(b.cost)} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--db-hover)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: b.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* What-if Table */}
      <div>
        <h3 className="text-sm font-medium mb-2" style={{ color: "var(--db-text)" }}>What-If Calculator</h3>
        <DataTable
          columns={[
            { key: "clients", label: "Clients", render: (r) => <span className="font-medium" style={{ color: "var(--db-text)" }}>{r.clients}</span> },
            { key: "total", label: "Est. Cost", render: (r) => <span className="text-sm font-mono" style={{ color: "var(--db-text)" }}>{fmt(r.total)}</span> },
            { key: "revenue", label: "Revenue", render: (r) => <span className="text-sm font-mono" style={{ color: "var(--db-text)" }}>{fmt(r.revenue)}</span> },
            { key: "margin", label: "Margin", render: (r) => <span className="text-sm font-mono" style={{ color: r.margin > 0 ? "#4ade80" : "#f87171" }}>{fmt(r.margin)}</span> },
            {
              key: "marginPct",
              label: "Margin %",
              render: (r) => {
                const color = r.marginPct >= 80 ? "#4ade80" : r.marginPct >= 60 ? "#fbbf24" : "#f87171";
                return <span className="text-sm font-medium" style={{ color }}>{r.marginPct.toFixed(1)}%</span>;
              },
            },
          ]}
          data={projections}
        />
      </div>
    </div>
  );
}

// ── Tab 5: Scaling Playbook ──

function PlaybookTab({ data }: { data: any }) {
  if (!data) return null;
  const playbook = data.playbook ?? [];
  const currentTier = data.tier ?? "seed";
  const currentTierIndex = TIER_ORDER.indexOf(currentTier);

  const tierGroups = TIER_ORDER.map((tier) => ({
    tier,
    label: tier.charAt(0).toUpperCase() + tier.slice(1),
    range: playbook.find((p: any) => p.tier === tier)?.clientRange ?? "",
    items: playbook.filter((p: any) => p.tier === tier),
    isCurrent: tier === currentTier,
    isPast: TIER_ORDER.indexOf(tier) < currentTierIndex,
  }));

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto">
        {tierGroups.map((g) => (
          <div
            key={g.tier}
            className="flex-shrink-0 rounded-lg px-4 py-2 text-xs font-medium"
            style={{
              background: g.isCurrent ? "rgba(197,154,39,0.15)" : g.isPast ? "rgba(74,222,128,0.1)" : "var(--db-hover)",
              color: g.isCurrent ? "#C59A27" : g.isPast ? "#4ade80" : "var(--db-text-muted)",
              border: g.isCurrent ? "1px solid rgba(197,154,39,0.3)" : "1px solid transparent",
            }}
          >
            {g.label} ({g.range})
          </div>
        ))}
      </div>

      {tierGroups.map((g) => (
        <div key={g.tier}>
          <h3
            className="text-sm font-medium mb-3 flex items-center gap-2"
            style={{ color: g.isCurrent ? "#C59A27" : "var(--db-text)" }}
          >
            <StatusBadge status={g.tier} />
            {g.label} Tier
            {g.isCurrent && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(197,154,39,0.15)", color: "#C59A27" }}>Current</span>}
          </h3>
          <div className="space-y-2">
            {g.items.map((item: any) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg px-4 py-3"
                style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
              >
                <div
                  className="mt-0.5 h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center"
                  style={{
                    borderColor: item.completed ? "#4ade80" : "var(--db-border)",
                    background: item.completed ? "rgba(74,222,128,0.1)" : "transparent",
                  }}
                >
                  {item.completed && <span style={{ color: "#4ade80", fontSize: 10 }}>✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "var(--db-text)" }}>{item.action}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{item.provider}</span>
                    {item.planRequired && <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>Plan: {item.planRequired}</span>}
                    {item.estimatedMonthlyCost && <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{item.estimatedMonthlyCost}/mo</span>}
                  </div>
                </div>
                <StatusBadge status={item.priority} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Shared ──

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
      <h3 className="text-sm font-medium mb-4" style={{ color: "var(--db-text)" }}>{title}</h3>
      {children}
    </div>
  );
}

function getProviderStatus(current: number | undefined, limit: number | undefined): string {
  if (!current || !limit || limit <= 0) return "operational";
  const pct = (current / limit) * 100;
  if (pct >= 95) return "down";
  if (pct >= 70) return "degraded";
  return "operational";
}
