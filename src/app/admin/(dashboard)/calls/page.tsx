"use client";

import { useEffect, useState } from "react";
import MetricCard from "../../_components/metric-card";
import DataTable, { type Column } from "../../_components/data-table";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

interface CallAnalytics {
  stats: {
    totalCalls: number;
    completedCalls: number;
    missedCalls: number;
    failedCalls: number;
    avgDuration: number;
  };
  volumeByDay: Array<{ date: string; count: number }>;
  languageBreakdown: Array<{ language: string; count: number }>;
  sentimentBreakdown: Array<{ sentiment: string; count: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
  recentCalls: Array<{
    id: string;
    businessName: string | null;
    callerPhone: string | null;
    direction: string;
    status: string;
    duration: number | null;
    language: string | null;
    sentiment: string | null;
    summary: string | null;
    createdAt: string;
  }>;
}

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#22c55e",
  neutral: "#64748b",
  negative: "#ef4444",
  unknown: "#334155",
};

export default function CallAnalyticsPage() {
  const [data, setData] = useState<CallAnalytics | null>(null);

  useEffect(() => {
    fetch("/api/admin/calls")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-500">Loading call analytics...</p>
      </div>
    );
  }

  const completionRate =
    data.stats.totalCalls > 0
      ? Math.round((data.stats.completedCalls / data.stats.totalCalls) * 100)
      : 0;

  function formatDuration(seconds: number): string {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const callColumns: Column<CallAnalytics["recentCalls"][0]>[] = [
    {
      key: "businessName",
      label: "Business",
      render: (row) => (
        <span className="text-sm text-slate-200">{row.businessName || "—"}</span>
      ),
    },
    {
      key: "callerPhone",
      label: "Caller",
      render: (row) => (
        <span className="text-xs text-slate-400">{row.callerPhone || "—"}</span>
      ),
    },
    {
      key: "direction",
      label: "Dir",
      render: (row) => (
        <span className={`text-xs ${row.direction === "inbound" ? "text-blue-400" : "text-green-400"}`}>
          {row.direction}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const colors: Record<string, string> = {
          completed: "bg-green-500/10 text-green-400",
          missed: "bg-amber-500/10 text-amber-400",
          failed: "bg-red-500/10 text-red-400",
          in_progress: "bg-blue-500/10 text-blue-400",
        };
        return (
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${colors[row.status] || "bg-slate-700 text-slate-300"}`}>
            {row.status.replace("_", " ")}
          </span>
        );
      },
    },
    {
      key: "duration",
      label: "Duration",
      render: (row) => (
        <span className="text-xs text-slate-400">{row.duration ? formatDuration(row.duration) : "—"}</span>
      ),
    },
    {
      key: "sentiment",
      label: "Sentiment",
      render: (row) => (
        <span className={`text-xs ${
          row.sentiment === "positive" ? "text-green-400" :
          row.sentiment === "negative" ? "text-red-400" : "text-slate-500"
        }`}>
          {row.sentiment || "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Time",
      render: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Call Analytics</h1>
        <p className="text-sm text-slate-400">All-platform call metrics and trends</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <MetricCard label="Total Calls" value={data.stats.totalCalls} />
        <MetricCard label="Completed" value={data.stats.completedCalls} />
        <MetricCard label="Missed" value={data.stats.missedCalls} />
        <MetricCard
          label="Completion Rate"
          value={`${completionRate}%`}
          changeType={completionRate > 80 ? "positive" : completionRate > 50 ? "neutral" : "negative"}
        />
        <MetricCard label="Avg Duration" value={formatDuration(data.stats.avgDuration)} />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Volume chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-medium text-slate-300">Call Volume (30 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.volumeByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="count" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Language pie */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 text-sm font-medium text-slate-300">Language Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.languageBreakdown}
                dataKey="count"
                nameKey="language"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(props: PieLabelRenderProps) => {
                  const lang = String((props as PieLabelRenderProps & { language?: string }).language || "?").toUpperCase();
                  const pct = ((Number(props.percent) || 0) * 100).toFixed(0);
                  return `${lang} ${pct}%`;
                }}
                labelLine={false}
              >
                {data.languageBreakdown.map((_entry, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sentiment bars */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="mb-4 text-sm font-medium text-slate-300">Sentiment Breakdown</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.sentimentBreakdown} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
            <YAxis dataKey="sentiment" type="category" tick={{ fill: "#64748b", fontSize: 11 }} width={80} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.sentimentBreakdown.map((entry, index) => (
                <Cell key={index} fill={SENTIMENT_COLORS[entry.sentiment] || "#334155"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent calls table */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-300">Recent Calls</h3>
        <DataTable columns={callColumns} data={data.recentCalls} />
      </div>
    </div>
  );
}
