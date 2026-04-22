"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import MetricCard from "../../_components/metric-card";
import ActivityFeed from "../../_components/activity-feed";
import QuickActions from "../../_components/quick-actions";
import StatusBadge from "../../_components/status-badge";
import { MetricCardSkeleton } from "@/components/skeleton";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  prospects: { total: number; byStatus: Record<string, number> };
  audit: { total: number; answered: number; missed: number };
  outreach: { total: number; opened: number; clicked: number };
  demos: { total: number; scheduled: number; completed: number; converted: number };
  businesses: number;
  calls: { total: number; completed: number };
  compliance?: { totalConsents: number; dsarPending: number; dsarTotal: number; disclosureRate: number };
  outbound?: { total: number; completed: number; answered: number; scheduled: number };
  accounts?: { total: number; multiLocation: number; totalLocations: number; locationMrr: number };
}

interface MetricsData {
  callsByDay: Array<{ date: string; count: number }>;
  prospectsByDay: Array<{ date: string; count: number }>;
  auditsByDay: Array<{ date: string; count: number }>;
}

interface BillingData {
  current: { mrr: number; arr: number; customerCount: number };
  planMix?: Record<string, { count: number; mrr: number }>;
}

interface OpsData {
  services: Array<{
    serviceName: string;
    status: string;
    latencyMs: number | null;
    uptimePct: number | null;
  }>;
}

const tooltipStyle = {
  background: "var(--db-surface)",
  border: "1px solid var(--db-border)",
  borderRadius: 8,
  color: "var(--db-text)",
  fontSize: 12,
};

interface NotificationItem {
  id: string;
  source: string;
  severity: string;
  title: string;
  message: string;
  actionUrl: string | null;
  createdAt: string;
}

export default function OpsDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [ops, setOps] = useState<OpsData | null>(null);
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [crmStats, setCrmStats] = useState<{ totalCustomers: number; repeatRate: number; openEstimates: number; wonEstimateValue: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outreachPaused, setOutreachPaused] = useState<boolean | null>(null);
  const [outreachToggling, setOutreachToggling] = useState(false);

  const fetchAll = useCallback(() => {
    setError(null);
    fetch("/api/admin/dashboard")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError("Failed to load dashboard data"));
    fetch("/api/admin/metrics?days=30")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setMetrics)
      .catch(() => setError("Failed to load metrics"));
    fetch("/api/admin/billing")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { if (d.current) setBilling(d); })
      .catch(() => setError("Failed to load billing data"));
    fetch("/api/admin/ops")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setOps)
      .catch(() => setError("Failed to load ops data"));
    fetch("/api/notifications?unacknowledged=true&limit=10")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setAlerts(d.items ?? []))
      .catch(() => setError("Failed to load notifications"));
    fetch("/api/admin/crm-stats")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setCrmStats)
      .catch(() => setError("Failed to load CRM stats"));
    fetch("/api/admin/agents/config")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((configs: Array<{ agentName: string; enabled: boolean }>) => {
        const qualify = configs.find((c) => c.agentName === "qualify");
        setOutreachPaused(qualify ? !qualify.enabled : false);
      })
      .catch(() => setError("Failed to load agent config"));
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (!data) {
    return (
      <div className="space-y-4">
        {error ? (
          <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
            <button
              onClick={fetchAll}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="animate-pulse rounded h-7 w-48 mb-2" style={{ background: "var(--db-border)" }} />
              <div className="animate-pulse rounded h-4 w-64" style={{ background: "var(--db-border)" }} />
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <MetricCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const funnelData = [
    { name: "Scraped", value: data.prospects.byStatus["new"] ?? 0 },
    { name: "Audited", value: data.prospects.byStatus["audit_complete"] ?? 0 },
    { name: "Outreach", value: data.prospects.byStatus["outreach_active"] ?? 0 },
    { name: "Demo", value: data.prospects.byStatus["demo_booked"] ?? 0 },
    { name: "Converted", value: data.prospects.byStatus["converted"] ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>
          Mission Control
        </h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          Capta admin overview
        </p>
      </div>

      {error && (
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          <button
            onClick={fetchAll}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions />

      {/* Prospect Outreach Toggle */}
      {outreachPaused !== null && (
        <div
          className="flex items-center justify-between rounded-xl p-4"
          style={{
            background: outreachPaused
              ? "rgba(239,68,68,0.06)"
              : "rgba(34,197,94,0.06)",
            border: `1px solid ${outreachPaused ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
              style={{
                background: outreachPaused ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                color: outreachPaused ? "#ef4444" : "#22c55e",
              }}
            >
              {outreachPaused ? "\u23F8" : "\u25B6"}
            </span>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                Prospect Outreach
              </p>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                {outreachPaused
                  ? "Paused — the qualify agent is not sending outreach or booking demos"
                  : "Active — the qualify agent is running daily, sending outreach and booking demos"}
              </p>
            </div>
          </div>
          <button
            disabled={outreachToggling}
            onClick={async () => {
              setOutreachToggling(true);
              try {
                const res = await fetch("/api/admin/agents/config", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ agentName: "qualify", enabled: outreachPaused }),
                });
                if (res.ok) {
                  setOutreachPaused(!outreachPaused);
                  toast.success(outreachPaused ? "Prospect outreach resumed" : "Prospect outreach paused");
                } else {
                  toast.error("Failed to update outreach status");
                }
              } catch {
                toast.error("Failed to update outreach status");
              } finally {
                setOutreachToggling(false);
              }
            }}
            className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: outreachPaused ? "#22c55e" : "#ef4444",
              color: "#fff",
              opacity: outreachToggling ? 0.6 : 1,
            }}
          >
            {outreachToggling
              ? "Updating..."
              : outreachPaused
                ? "Resume Outreach"
                : "Pause Outreach"}
          </button>
        </div>
      )}

      {/* Revenue + Core Metric cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="MRR"
          value={billing?.current?.mrr ?? 0}
          prefix="$"
        />
        <MetricCard
          label="ARR"
          value={billing?.current?.arr ?? 0}
          prefix="$"
        />
        <MetricCard label="Active Clients" value={data.businesses} />
        <MetricCard
          label="Client Calls (30d)"
          value={data.calls.total}
        />
        <MetricCard label="Total Prospects" value={data.prospects.total} />
        <MetricCard label="Audit Calls" value={data.audit.total} />
        <MetricCard label="Emails Sent" value={data.outreach.total} />
        <MetricCard
          label="Demos Converted"
          value={data.demos.converted}
          change={
            data.demos.total > 0
              ? `${Math.round((data.demos.converted / data.demos.total) * 100)}% rate`
              : undefined
          }
          changeType="positive"
        />
      </div>

      {/* Accounts & Locations */}
      {data.accounts && data.accounts.total > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Accounts" value={data.accounts.total} />
          <MetricCard
            label="Multi-Location"
            value={data.accounts.multiLocation}
            changeType={data.accounts.multiLocation > 0 ? "positive" : "neutral"}
          />
          <MetricCard label="Total Locations" value={data.accounts.totalLocations} />
          <MetricCard
            label="Location MRR"
            value={data.accounts.locationMrr}
            prefix="$"
            changeType="positive"
          />
        </div>
      )}

      {/* CRM Health */}
      {crmStats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="CRM Customers" value={crmStats.totalCustomers} />
          <MetricCard
            label="Repeat Rate"
            value={crmStats.repeatRate}
            suffix="%"
            changeType={crmStats.repeatRate >= 30 ? "positive" : "neutral"}
          />
          <MetricCard label="Open Estimates" value={crmStats.openEstimates} />
          <MetricCard
            label="Won Estimates"
            value={crmStats.wonEstimateValue}
            prefix="$"
            changeType="positive"
          />
        </div>
      )}

      {/* Plan Mix */}
      {billing?.planMix && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard
            label="Monthly Clients"
            value={billing.planMix.monthly?.count ?? 0}
          />
          <MetricCard
            label="Annual Clients"
            value={billing.planMix.annual?.count ?? 0}
            changeType="positive"
          />
          <MetricCard
            label="Annual MRR"
            value={Math.round((billing.planMix.annual?.mrr ?? 0) / 100)}
            prefix="$"
            changeType="positive"
          />
          <MetricCard
            label="Annual %"
            value={
              (billing.planMix.monthly?.count ?? 0) + (billing.planMix.annual?.count ?? 0) > 0
                ? Math.round(
                    ((billing.planMix.annual?.count ?? 0) /
                      ((billing.planMix.monthly?.count ?? 0) + (billing.planMix.annual?.count ?? 0))) *
                      100,
                  )
                : 0
            }
            suffix="%"
            changeType="positive"
          />
        </div>
      )}

      {/* Compliance */}
      {data.compliance && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Consent Records" value={data.compliance.totalConsents} />
          <MetricCard
            label="DSAR Pending"
            value={data.compliance.dsarPending}
            changeType={data.compliance.dsarPending > 0 ? "negative" : "positive"}
          />
          <MetricCard
            label="Disclosure Rate"
            value={data.compliance.disclosureRate}
            suffix="%"
            changeType={data.compliance.disclosureRate >= 95 ? "positive" : "negative"}
          />
          <MetricCard label="Total DSARs" value={data.compliance.dsarTotal} />
        </div>
      )}

      {/* Outbound Calls */}
      {data.outbound && data.outbound.total > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Outbound Total" value={data.outbound.total} />
          <MetricCard
            label="Answered"
            value={data.outbound.answered}
            changeType="positive"
          />
          <MetricCard label="Completed" value={data.outbound.completed} />
          <MetricCard
            label="Scheduled"
            value={data.outbound.scheduled}
            changeType="neutral"
          />
        </div>
      )}

      {/* System Health Grid */}
      {ops?.services && ops.services.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>
            System Health
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {ops.services.map((svc) => (
              <div
                key={svc.serviceName}
                className="rounded-lg p-3"
                style={{
                  background: "var(--db-card)",
                  border: "1px solid var(--db-border)",
                }}
              >
                <p className="truncate text-xs font-medium" style={{ color: "var(--db-text-secondary)" }}>
                  {svc.serviceName}
                </p>
                <div className="mt-1.5">
                  <StatusBadge status={svc.status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]" style={{ color: "var(--db-text-muted)" }}>
                  <span>{svc.latencyMs != null ? `${svc.latencyMs}ms` : "\u2014"}</span>
                  <span>
                    {svc.uptimePct != null ? `${svc.uptimePct.toFixed(1)}%` : "\u2014"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div
          className="rounded-xl p-5"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
          }}
        >
          <h3 className="mb-4 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>
            Client Calls / Day
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={metrics?.callsByDay ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--db-border)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--db-text-muted)", fontSize: 11 }}
                tickFormatter={(d: string) => d.slice(5)}
              />
              <YAxis tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#D4A843"
                fill="#D4A843"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div
          className="rounded-xl p-5"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
          }}
        >
          <h3 className="mb-4 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>
            Prospect Funnel
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--db-border)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--db-text-muted)", fontSize: 11 }}
              />
              <YAxis tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#D4A843" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attention Required */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>
            Attention Required
          </h2>
          {alerts.length > 0 && (
            <a href="/admin/notifications" className="text-xs font-medium" style={{ color: "var(--db-accent)" }}>
              View all &rarr;
            </a>
          )}
        </div>
        {alerts.length === 0 ? (
          <div
            className="rounded-xl p-4 text-center text-sm"
            style={{ background: "var(--db-card)", border: "1px solid var(--db-border)", color: "var(--db-text-muted)" }}
          >
            All clear — nothing needs your attention
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 5).map((n) => {
              const color = n.severity === "emergency" ? "#ef4444" : n.severity === "critical" ? "#f59e0b" : n.severity === "warning" ? "#3b82f6" : "#94a3b8";
              return (
                <div
                  key={n.id}
                  className="flex items-center gap-3 rounded-lg p-3"
                  style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase" style={{ background: `${color}15`, color }}>{n.source}</span>
                  <span className="flex-1 truncate text-sm" style={{ color: "var(--db-text)" }}>{n.title}</span>
                  <span className="text-[11px] shrink-0" style={{ color: "var(--db-text-muted)" }}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                  {n.actionUrl && (
                    <a href={n.actionUrl} className="shrink-0 text-xs font-medium" style={{ color: "var(--db-accent)" }}>View</a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity feed */}
      <ActivityFeed />
    </div>
  );
}
