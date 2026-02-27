"use client";

import { useEffect, useState } from "react";
import MetricCard from "../../_components/metric-card";
import DataTable, { type Column } from "../../_components/data-table";
import StatusBadge from "../../_components/status-badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

type Tab = "revenue" | "payments" | "costs" | "forecast";

function fmt(cents: number): string {
  return `$${(cents / 100).toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function FinancialsPage() {
  const [tab, setTab] = useState<Tab>("revenue");

  const tabs: { key: Tab; label: string }[] = [
    { key: "revenue", label: "Revenue Overview" },
    { key: "payments", label: "Payment Health" },
    { key: "costs", label: "Cost Analysis" },
    { key: "forecast", label: "Forecasting" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Financials</h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          Revenue, payment health, cost analysis, and forecasting
        </p>
      </div>

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

      {tab === "revenue" && <RevenueTab />}
      {tab === "payments" && <PaymentsTab />}
      {tab === "costs" && <CostsTab />}
      {tab === "forecast" && <ForecastTab />}
    </div>
  );
}

// ── Revenue Tab ──

function RevenueTab() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/admin/financials?tab=revenue").then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data) return <Loading />;

  const chartData = (data.snapshots ?? []).slice(-90).map((s: any) => ({
    date: s.date,
    mrr: s.mrr / 100,
  }));

  const movementData = (data.movements ?? []).map((m: any) => ({
    month: m.month,
    new: m.newMrr / 100,
    churned: -(m.churnedMrr / 100),
    recovered: m.recoveredMrr / 100,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="MRR" value={data.mrr / 100} prefix="$" />
        <MetricCard label="ARR" value={data.arr / 100} prefix="$" />
        <MetricCard label="Active Clients" value={data.activeClients} />
        <MetricCard
          label="MRR Growth"
          value={`${data.mrrGrowthPct}%`}
          change={data.mrrGrowthPct > 0 ? "Month-over-month" : "Month-over-month"}
          changeType={data.mrrGrowthPct > 0 ? "positive" : data.mrrGrowthPct < 0 ? "negative" : "neutral"}
        />
      </div>

      {chartData.length > 1 && (
        <ChartCard title="MRR Trend">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--db-border)" />
              <XAxis dataKey="date" tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "MRR"]} contentStyle={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }} />
              <Area type="monotone" dataKey="mrr" stroke="#C59A27" fill="rgba(197,154,39,0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {movementData.length > 0 && (
        <ChartCard title="MRR Movements">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={movementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--db-border)" />
              <XAxis dataKey="month" tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }} />
              <Legend />
              <Bar dataKey="new" name="New" fill="#4ade80" />
              <Bar dataKey="recovered" name="Recovered" fill="#60a5fa" />
              <Bar dataKey="churned" name="Churned" fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}

// ── Payments Tab ──

function PaymentsTab() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/admin/financials?tab=payments").then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data) return <Loading />;

  const atRiskColumns: Column<any>[] = [
    { key: "name", label: "Business", render: (r) => <span className="font-medium" style={{ color: "var(--db-text)" }}>{r.name}</span> },
    { key: "mrr", label: "MRR", render: (r) => <span className="text-sm font-mono" style={{ color: "var(--db-text)" }}>{fmt(r.mrr ?? 49700)}</span> },
    { key: "paymentStatus", label: "Status", render: (r) => <StatusBadge status={r.paymentStatus} /> },
    {
      key: "daysPastDue",
      label: "Days Past Due",
      render: (r) => {
        const days = r.firstFailedAt ? Math.floor((Date.now() - new Date(r.firstFailedAt).getTime()) / 86400000) : 0;
        return <span className="text-sm" style={{ color: days > 7 ? "#f87171" : "#f59e0b" }}>{days}d</span>;
      },
    },
    {
      key: "dunningStage",
      label: "Dunning Stage",
      render: (r) => {
        const stages = [r.email1SentAt && "E1", r.email2SentAt && "E2", r.smsSentAt && "SMS", r.email3SentAt && "E3"].filter(Boolean);
        return <span className="text-xs font-mono" style={{ color: "var(--db-text-muted)" }}>{stages.join(" → ") || "—"}</span>;
      },
    },
    { key: "lastFailureCode", label: "Failure", render: (r) => <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{r.lastFailureCode ?? "—"}</span> },
  ];

  const eventColumns: Column<any>[] = [
    { key: "businessName", label: "Business", render: (r) => <span className="text-sm" style={{ color: "var(--db-text)" }}>{r.businessName ?? "—"}</span> },
    { key: "eventType", label: "Event", render: (r) => <StatusBadge status={r.eventType === "payment_succeeded" ? "succeeded" : r.eventType === "payment_failed" ? "failed" : r.eventType} /> },
    { key: "amount", label: "Amount", render: (r) => <span className="text-sm font-mono" style={{ color: "var(--db-text)" }}>{r.amount ? fmt(r.amount) : "—"}</span> },
    { key: "createdAt", label: "Date", render: (r) => <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{new Date(r.createdAt).toLocaleDateString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Past Due Clients" value={data.pastDueClients?.length ?? 0} />
        <MetricCard label="MRR at Risk" value={(data.mrrAtRisk ?? 0) / 100} prefix="$" />
        <MetricCard label="Recovery Rate" value={`${data.recoveryRate ?? 0}%`} />
        <MetricCard label="Avg Days to Recover" value={data.avgDaysToRecover ?? 0} suffix=" days" />
      </div>

      {data.pastDueClients?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2" style={{ color: "var(--db-text)" }}>At-Risk Clients</h3>
          <DataTable columns={atRiskColumns} data={data.pastDueClients} />
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium mb-2" style={{ color: "var(--db-text)" }}>Recent Payment Events</h3>
        <DataTable columns={eventColumns} data={data.recentEvents ?? []} />
      </div>
    </div>
  );
}

// ── Costs Tab ──

function CostsTab() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/admin/financials?tab=costs").then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data) return <Loading />;

  const columns: Column<any>[] = [
    { key: "businessName", label: "Business", render: (r) => <span className="font-medium" style={{ color: "var(--db-text)" }}>{r.businessName ?? "—"}</span> },
    { key: "callMinutes", label: "Minutes", render: (r) => <span className="text-sm font-mono" style={{ color: "var(--db-text)" }}>{Math.round(r.callMinutes ?? 0)}</span> },
    { key: "callCount", label: "Calls", render: (r) => <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{r.callCount}</span> },
    { key: "totalCost", label: "Cost", render: (r) => <span className="text-sm font-mono" style={{ color: "var(--db-text)" }}>{fmt(r.totalCost ?? 0)}</span> },
    { key: "revenue", label: "Revenue", render: (r) => <span className="text-sm font-mono" style={{ color: "var(--db-text)" }}>{fmt(r.revenue ?? 0)}</span> },
    {
      key: "marginPct",
      label: "Margin",
      render: (r) => {
        const pct = r.marginPct ?? 0;
        const color = pct >= 80 ? "#4ade80" : pct >= 60 ? "#fbbf24" : "#f87171";
        return <span className="text-sm font-medium" style={{ color }}>{pct.toFixed(1)}%</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <MetricCard label="Total Monthly Cost" value={(data.totalMonthlyCost ?? 0) / 100} prefix="$" />
        <MetricCard label="Avg Cost / Client" value={(data.avgCostPerClient ?? 0) / 100} prefix="$" />
        <MetricCard
          label="Avg Margin"
          value={`${data.avgMarginPct ?? 0}%`}
          changeType={(data.avgMarginPct ?? 0) >= 70 ? "positive" : "negative"}
          change={data.month !== "N/A" ? `Month: ${data.month}` : undefined}
        />
      </div>

      <DataTable columns={columns} data={data.clients ?? []} />
    </div>
  );
}

// ── Forecast Tab ──

function ForecastTab() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/admin/financials?tab=forecast").then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data) return <Loading />;

  // Sample projections at 30-day intervals
  const projectionData = (data.projections ?? [])
    .filter((_: any, i: number) => i % 5 === 0 || i === 90)
    .map((p: any) => ({
      day: `Day ${p.day}`,
      optimistic: p.optimistic / 100,
      base: p.base / 100,
      pessimistic: p.pessimistic / 100,
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Current MRR" value={(data.currentMrr ?? 0) / 100} prefix="$" />
        <MetricCard label="Monthly Churn Rate" value={`${data.monthlyChurnRate ?? 0}%`} changeType={data.monthlyChurnRate > 5 ? "negative" : "positive"} />
        <MetricCard label="Avg Monthly Signups" value={data.avgMonthlySignups ?? 0} />
        <MetricCard label="Recovery Rate" value={`${data.recoveryRate ?? 0}%`} />
      </div>

      {projectionData.length > 1 && (
        <ChartCard title="90-Day MRR Projection">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--db-border)" />
              <XAxis dataKey="day" tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} contentStyle={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }} />
              <Legend />
              <Line type="monotone" dataKey="optimistic" name="Optimistic" stroke="#4ade80" strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="base" name="Base" stroke="#C59A27" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pessimistic" name="Pessimistic" stroke="#f87171" strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}

// ── Shared Components ──

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
      <h3 className="text-sm font-medium mb-4" style={{ color: "var(--db-text)" }}>{title}</h3>
      {children}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <p style={{ color: "var(--db-text-muted)" }}>Loading...</p>
    </div>
  );
}
