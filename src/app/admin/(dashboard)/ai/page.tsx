"use client";

import { useEffect, useState } from "react";
import MetricCard from "../../_components/metric-card";
import StatusBadge from "../../_components/status-badge";
import DataTable, { type Column } from "../../_components/data-table";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

interface AIData {
  quality: {
    totalCalls: number;
    avgDuration: number;
    completionRate: number;
    transferRate: number;
    positiveRate: number;
    neutralRate: number;
    negativeRate: number;
  };
  sentimentBreakdown: Array<{ sentiment: string; count: number }>;
  escalations: {
    stats: { total: number; open: number; inProgress: number; resolved: number };
    log: Array<{
      id: string;
      callId: string | null;
      customerId: string;
      businessName: string | null;
      reason: string;
      resolutionStatus: string;
      assignedTo: string | null;
      notes: string | null;
      resolvedAt: string | null;
      createdAt: string;
    }>;
  };
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#22c55e",
  neutral: "#64748b",
  negative: "#ef4444",
  unknown: "#334155",
};

export default function AIPerformancePage() {
  const [data, setData] = useState<AIData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/ai")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError("Failed to load AI performance data"));
  }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          </div>
        )}
        {!error && (
          <div className="flex h-64 items-center justify-center">
            <p style={{ color: "var(--db-text-muted)" }}>Loading AI performance data...</p>
          </div>
        )}
      </div>
    );
  }

  function formatDuration(seconds: number): string {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const escalationColumns: Column<AIData["escalations"]["log"][0]>[] = [
    {
      key: "businessName",
      label: "Business",
      render: (row) => (
        <span className="font-medium" style={{ color: "var(--db-text)" }}>{row.businessName || "—"}</span>
      ),
    },
    {
      key: "reason",
      label: "Reason",
      render: (row) => (
        <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{row.reason}</span>
      ),
    },
    {
      key: "resolutionStatus",
      label: "Status",
      render: (row) => <StatusBadge status={row.resolutionStatus} />,
    },
    {
      key: "assignedTo",
      label: "Assigned",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{row.assignedTo || "Unassigned"}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
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
        <h1 className="text-2xl font-semibold">AI Performance</h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>Quality metrics and escalation tracking</p>
      </div>

      {/* Quality metric cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Total Calls Handled" value={data.quality.totalCalls} />
        <MetricCard
          label="Completion Rate"
          value={`${data.quality.completionRate}%`}
          changeType={data.quality.completionRate > 80 ? "positive" : "neutral"}
        />
        <MetricCard
          label="Transfer Rate"
          value={`${data.quality.transferRate}%`}
          changeType={data.quality.transferRate < 10 ? "positive" : "negative"}
        />
        <MetricCard label="Avg Duration" value={formatDuration(data.quality.avgDuration)} />
      </div>

      {/* Sentiment + Escalation stats */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sentiment pie */}
        <div className="rounded-xl p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <h3 className="mb-4 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>Sentiment Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.sentimentBreakdown}
                dataKey="count"
                nameKey="sentiment"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(props: PieLabelRenderProps) => {
                  const sentiment = String((props as PieLabelRenderProps & { sentiment?: string }).sentiment ?? "");
                  const pct = ((Number(props.percent) || 0) * 100).toFixed(0);
                  return `${sentiment} ${pct}%`;
                }}
                labelLine={false}
              >
                {data.sentimentBreakdown.map((entry, index) => (
                  <Cell key={index} fill={SENTIMENT_COLORS[entry.sentiment] || "#334155"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--db-surface)",
                  border: "1px solid var(--db-border)",
                  borderRadius: 8,
                  color: "var(--db-text)",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-4 text-xs">
            <span style={{ color: "#4ade80" }}>Positive: {data.quality.positiveRate}%</span>
            <span style={{ color: "var(--db-text-muted)" }}>Neutral: {data.quality.neutralRate}%</span>
            <span style={{ color: "#f87171" }}>Negative: {data.quality.negativeRate}%</span>
          </div>
        </div>

        {/* Escalation summary */}
        <div className="rounded-xl p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <h3 className="mb-4 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>Escalation Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg p-3" style={{ border: "1px solid var(--db-border)" }}>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Total</p>
              <p className="mt-1 text-2xl font-semibold">{data.escalations.stats.total}</p>
            </div>
            <div className="rounded-lg p-3" style={{ border: "1px solid var(--db-border)" }}>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Open</p>
              <p className="mt-1 text-2xl font-semibold" style={{ color: "#60a5fa" }}>{data.escalations.stats.open}</p>
            </div>
            <div className="rounded-lg p-3" style={{ border: "1px solid var(--db-border)" }}>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>In Progress</p>
              <p className="mt-1 text-2xl font-semibold" style={{ color: "#fbbf24" }}>{data.escalations.stats.inProgress}</p>
            </div>
            <div className="rounded-lg p-3" style={{ border: "1px solid var(--db-border)" }}>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Resolved</p>
              <p className="mt-1 text-2xl font-semibold" style={{ color: "#4ade80" }}>{data.escalations.stats.resolved}</p>
            </div>
          </div>
          {data.escalations.stats.total > 0 && (
            <div className="mt-4">
              <div className="flex h-2 overflow-hidden rounded-full" style={{ background: "var(--db-hover)" }}>
                <div
                  style={{ width: `${(data.escalations.stats.resolved / data.escalations.stats.total) * 100}%`, background: "#22c55e" }}
                />
                <div
                  style={{ width: `${(data.escalations.stats.inProgress / data.escalations.stats.total) * 100}%`, background: "#f59e0b" }}
                />
                <div
                  style={{ width: `${(data.escalations.stats.open / data.escalations.stats.total) * 100}%`, background: "#3b82f6" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Configuration */}
      <div className="rounded-xl p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
        <h3 className="mb-4 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>AI Configuration</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg p-3" style={{ border: "1px solid var(--db-border)" }}>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Language Model</p>
            <p className="mt-1 text-sm font-medium font-mono" style={{ color: "var(--db-text)" }}>
              {process.env.NEXT_PUBLIC_CLAUDE_MODEL ?? "claude-sonnet-4-5"}
            </p>
          </div>
          <div className="rounded-lg p-3" style={{ border: "1px solid var(--db-border)" }}>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Voice Engine</p>
            <p className="mt-1 text-sm font-medium" style={{ color: "var(--db-text)" }}>Hume EVI</p>
          </div>
          <div className="rounded-lg p-3" style={{ border: "1px solid var(--db-border)" }}>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Languages</p>
            <p className="mt-1 text-sm font-medium" style={{ color: "var(--db-text)" }}>English, Spanish (bilingual)</p>
          </div>
          <div className="rounded-lg p-3" style={{ border: "1px solid var(--db-border)" }}>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Max Response Tokens</p>
            <p className="mt-1 text-sm font-medium" style={{ color: "var(--db-text)" }}>150</p>
          </div>
          <div className="rounded-lg p-3" style={{ border: "1px solid var(--db-border)" }}>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Summary Generation</p>
            <p className="mt-1 text-sm font-medium" style={{ color: "#4ade80" }}>Active</p>
          </div>
          <div className="rounded-lg p-3" style={{ border: "1px solid var(--db-border)" }}>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Sentiment Analysis</p>
            <p className="mt-1 text-sm font-medium" style={{ color: "#4ade80" }}>Active</p>
          </div>
        </div>
      </div>

      {/* Escalation table */}
      <div>
        <h3 className="mb-3 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>Escalation Log</h3>
        <DataTable columns={escalationColumns} data={data.escalations.log} />
      </div>
    </div>
  );
}
