"use client";

import { useEffect, useState, useCallback } from "react";
import MetricCard from "../../_components/metric-card";
import DataTable, { type Column } from "../../_components/data-table";
import { MetricCardSkeleton, TableSkeleton } from "@/components/skeleton";
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

const PIE_COLORS = ["#C59A27", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#22c55e",
  neutral: "#64748b",
  negative: "#ef4444",
  unknown: "#334155",
};

export default function CallAnalyticsPage() {
  const [data, setData] = useState<CallAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setError(null);
    fetch("/api/admin/calls")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError("Failed to load call analytics"));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!data) {
    return (
      <div className="space-y-4">
        {error ? (
          <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
            <button
              onClick={fetchData}
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <MetricCardSkeleton key={i} />
              ))}
            </div>
            <TableSkeleton rows={5} />
          </div>
        )}
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
        <span className="text-sm" style={{ color: "var(--db-text)" }}>{row.businessName || "—"}</span>
      ),
    },
    {
      key: "callerPhone",
      label: "Caller",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{row.callerPhone || "—"}</span>
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
        const statusStyles: Record<string, { background: string; color: string }> = {
          completed: { background: "rgba(74,222,128,0.1)", color: "#4ade80" },
          missed: { background: "rgba(251,191,36,0.1)", color: "#fbbf24" },
          failed: { background: "rgba(239,68,68,0.1)", color: "#ef4444" },
          in_progress: { background: "rgba(96,165,250,0.1)", color: "#60a5fa" },
        };
        const style = statusStyles[row.status] || { background: "var(--db-hover)", color: "var(--db-text-secondary)" };
        return (
          <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={style}>
            {row.status.replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      key: "duration",
      label: "Duration",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{row.duration ? formatDuration(row.duration) : "—"}</span>
      ),
    },
    {
      key: "sentiment",
      label: "Sentiment",
      render: (row) => (
        <span className="text-xs" style={{
          color: row.sentiment === "positive" ? "#4ade80" :
                 row.sentiment === "negative" ? "#ef4444" : "var(--db-text-muted)"
        }}>
          {row.sentiment || "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Time",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
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
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>All-platform call metrics and trends</p>
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
        <div className="rounded-xl p-5 lg:col-span-2" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <h3 className="mb-4 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>Call Volume (30 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.volumeByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--db-border)" />
              <XAxis dataKey="date" tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", borderRadius: 8, color: "var(--db-text)", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="count" stroke="#C59A27" fill="#C59A27" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Language pie */}
        <div className="rounded-xl p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <h3 className="mb-4 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>Language Distribution</h3>
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
                contentStyle={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", borderRadius: 8, color: "var(--db-text)", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sentiment bars */}
      <div className="rounded-xl p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
        <h3 className="mb-4 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>Sentiment Breakdown</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.sentimentBreakdown} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--db-border)" />
            <XAxis type="number" tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} />
            <YAxis dataKey="sentiment" type="category" tick={{ fill: "var(--db-text-muted)", fontSize: 11 }} width={80} />
            <Tooltip
              contentStyle={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", borderRadius: 8, color: "var(--db-text)", fontSize: 12 }}
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
        <h3 className="mb-3 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>Recent Calls</h3>
        <DataTable columns={callColumns} data={data.recentCalls} />
      </div>
    </div>
  );
}
