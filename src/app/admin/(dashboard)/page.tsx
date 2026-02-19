"use client";

import { useEffect, useState } from "react";
import MetricCard from "../_components/metric-card";
import ActivityFeed from "../_components/activity-feed";
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

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData);
    fetch("/api/admin/metrics?days=30")
      .then((r) => r.json())
      .then(setMetrics);
  }, []);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-500">Loading dashboard...</p>
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
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-400">Calltide outreach overview</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Total Prospects" value={data.prospects.total} />
        <MetricCard label="Audit Calls" value={data.audit.total} />
        <MetricCard label="Emails Sent" value={data.outreach.total} />
        <MetricCard label="Demos Booked" value={data.demos.total} />
        <MetricCard label="Active Clients" value={data.businesses} />
        <MetricCard
          label="Client Calls (30d)"
          value={data.calls.total}
        />
        <MetricCard
          label="Email Open Rate"
          value={
            data.outreach.total > 0
              ? `${Math.round((data.outreach.opened / data.outreach.total) * 100)}%`
              : "—"
          }
        />
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

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 text-sm font-medium text-slate-300">
            Client Calls / Day
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={metrics?.callsByDay ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={(d: string) => d.slice(5)}
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  color: "#e2e8f0",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 text-sm font-medium text-slate-300">
            Prospect Funnel
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  color: "#e2e8f0",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity feed */}
      <ActivityFeed />
    </div>
  );
}
