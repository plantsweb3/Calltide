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

  useEffect(() => {
    fetch("/api/admin/ai")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-500">Loading AI performance data...</p>
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
        <span className="font-medium text-slate-200">{row.businessName || "—"}</span>
      ),
    },
    {
      key: "reason",
      label: "Reason",
      render: (row) => (
        <span className="text-sm text-slate-300">{row.reason}</span>
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
        <span className="text-xs text-slate-400">{row.assignedTo || "Unassigned"}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
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
        <h1 className="text-2xl font-semibold">AI Performance</h1>
        <p className="text-sm text-slate-400">Quality metrics and escalation tracking</p>
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
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 text-sm font-medium text-slate-300">Sentiment Distribution</h3>
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
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  color: "#e2e8f0",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-4 text-xs">
            <span className="text-green-400">Positive: {data.quality.positiveRate}%</span>
            <span className="text-slate-400">Neutral: {data.quality.neutralRate}%</span>
            <span className="text-red-400">Negative: {data.quality.negativeRate}%</span>
          </div>
        </div>

        {/* Escalation summary */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 text-sm font-medium text-slate-300">Escalation Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-700 p-3">
              <p className="text-xs text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-semibold">{data.escalations.stats.total}</p>
            </div>
            <div className="rounded-lg border border-slate-700 p-3">
              <p className="text-xs text-slate-500">Open</p>
              <p className="mt-1 text-2xl font-semibold text-blue-400">{data.escalations.stats.open}</p>
            </div>
            <div className="rounded-lg border border-slate-700 p-3">
              <p className="text-xs text-slate-500">In Progress</p>
              <p className="mt-1 text-2xl font-semibold text-amber-400">{data.escalations.stats.inProgress}</p>
            </div>
            <div className="rounded-lg border border-slate-700 p-3">
              <p className="text-xs text-slate-500">Resolved</p>
              <p className="mt-1 text-2xl font-semibold text-green-400">{data.escalations.stats.resolved}</p>
            </div>
          </div>
          {data.escalations.stats.total > 0 && (
            <div className="mt-4">
              <div className="flex h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="bg-green-500"
                  style={{ width: `${(data.escalations.stats.resolved / data.escalations.stats.total) * 100}%` }}
                />
                <div
                  className="bg-amber-500"
                  style={{ width: `${(data.escalations.stats.inProgress / data.escalations.stats.total) * 100}%` }}
                />
                <div
                  className="bg-blue-500"
                  style={{ width: `${(data.escalations.stats.open / data.escalations.stats.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Settings placeholder */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="mb-2 text-sm font-medium text-slate-300">AI Configuration</h3>
        <p className="text-sm text-slate-400">
          AI model settings, voice configuration, and prompt tuning tools are coming in a future update.
          Current configuration is managed through Hume AI dashboard and the Settings page.
        </p>
      </div>

      {/* Escalation table */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-300">Escalation Log</h3>
        <DataTable columns={escalationColumns} data={data.escalations.log} />
      </div>
    </div>
  );
}
