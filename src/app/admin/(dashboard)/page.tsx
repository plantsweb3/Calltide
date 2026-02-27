"use client";

import { useEffect, useState } from "react";
import MetricCard from "../_components/metric-card";
import ActivityFeed from "../_components/activity-feed";
import QuickActions from "../_components/quick-actions";
import StatusBadge from "../_components/status-badge";
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
}

interface MetricsData {
  callsByDay: Array<{ date: string; count: number }>;
  prospectsByDay: Array<{ date: string; count: number }>;
  auditsByDay: Array<{ date: string; count: number }>;
}

interface BillingData {
  current: { mrr: number; arr: number; customerCount: number };
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

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [ops, setOps] = useState<OpsData | null>(null);
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
    fetch("/api/admin/metrics?days=30")
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => {});
    fetch("/api/admin/billing")
      .then((r) => r.json())
      .then(setBilling)
      .catch(() => {});
    fetch("/api/admin/ops")
      .then((r) => r.json())
      .then(setOps)
      .catch(() => {});
    fetch("/api/notifications?unacknowledged=true&limit=10")
      .then((r) => r.json())
      .then((d) => setAlerts(d.items ?? []))
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p style={{ color: "var(--db-text-muted)" }}>Loading dashboard...</p>
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
          Calltide admin overview
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Revenue + Core Metric cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="MRR"
          value={billing?.current.mrr ?? 0}
          prefix="$"
        />
        <MetricCard
          label="ARR"
          value={billing?.current.arr ?? 0}
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
                stroke="#C59A27"
                fill="#C59A27"
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
              <Bar dataKey="value" fill="#C59A27" radius={[4, 4, 0, 0]} />
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
