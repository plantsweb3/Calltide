"use client";

import { useEffect, useState } from "react";
import MetricCard from "../../_components/metric-card";
import DataTable, { type Column } from "../../_components/data-table";

interface DigestStats {
  totalCalls: number;
  afterHoursCalls: number;
  appointmentsBooked: number;
  estimatedRevenue: number;
  emergencyCalls: number;
  newCustomers: number;
  busiestDay: string;
  busiestDayCount: number;
  prevWeekCalls: number;
  wowChangePercent: number;
  savedEstimate: number;
}

interface Digest {
  id: string;
  businessId: string;
  businessName: string | null;
  receptionistName: string | null;
  weekStartDate: string;
  weekEndDate: string;
  stats: DigestStats;
  emailSentAt: string | null;
  smsSentAt: string | null;
  createdAt: string;
}

interface PageData {
  digests: Digest[];
  stats: {
    totalSent: number;
    sentLastWeek: number;
    enabledClients: number;
  };
}

export default function DigestsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekFilter, setWeekFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin/digests")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p style={{ color: "var(--db-text-muted)" }}>Loading digests...</p>
      </div>
    );
  }

  // Get unique weeks for filter
  const weeks = [...new Set(data.digests.map((d) => d.weekStartDate))].sort().reverse();

  const filtered = weekFilter
    ? data.digests.filter((d) => d.weekStartDate === weekFilter)
    : data.digests;

  const columns: Column<Digest>[] = [
    {
      key: "businessName",
      label: "Business",
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
            {row.businessName ?? "Unknown"}
          </p>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {row.receptionistName ?? "Maria"}
          </p>
        </div>
      ),
    },
    {
      key: "weekStartDate",
      label: "Week",
      sortable: true,
      render: (row) => {
        const start = new Date(row.weekStartDate + "T12:00:00");
        const end = new Date(row.weekEndDate + "T12:00:00");
        return (
          <span className="text-xs tabular-nums" style={{ color: "var(--db-text-secondary)" }}>
            {start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – {end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        );
      },
    },
    {
      key: "totalCalls",
      label: "Calls",
      sortable: true,
      render: (row) => (
        <span className="text-sm tabular-nums font-medium" style={{ color: "var(--db-text)" }}>
          {row.stats.totalCalls}
        </span>
      ),
    },
    {
      key: "appointmentsBooked",
      label: "Appts",
      render: (row) => (
        <span className="text-sm tabular-nums" style={{ color: "#4ade80" }}>
          {row.stats.appointmentsBooked}
        </span>
      ),
    },
    {
      key: "estimatedRevenue",
      label: "Est. Revenue",
      sortable: true,
      render: (row) => (
        <span className="text-sm tabular-nums font-medium" style={{ color: "#D4A843" }}>
          ${Math.round(row.stats.estimatedRevenue).toLocaleString()}
        </span>
      ),
    },
    {
      key: "afterHoursCalls",
      label: "After-Hours",
      render: (row) => (
        <span className="text-sm tabular-nums" style={{ color: "#fbbf24" }}>
          {row.stats.afterHoursCalls}
        </span>
      ),
    },
    {
      key: "wowChangePercent",
      label: "WoW",
      render: (row) => {
        const pct = row.stats.wowChangePercent;
        return (
          <span
            className="text-xs font-medium"
            style={{ color: pct > 0 ? "#4ade80" : pct < 0 ? "#f87171" : "#94a3b8" }}
          >
            {pct > 0 ? `+${pct}%` : pct < 0 ? `${pct}%` : "—"}
          </span>
        );
      },
    },
    {
      key: "delivery",
      label: "Delivered",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.emailSentAt && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}
            >
              Email
            </span>
          )}
          {row.smsSentAt && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}
            >
              SMS
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>
          Weekly Digests
        </h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          Performance reports sent to clients every Monday
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Total Sent" value={data.stats.totalSent} />
        <MetricCard label="Sent Last Week" value={data.stats.sentLastWeek} />
        <MetricCard label="Clients Enabled" value={data.stats.enabledClients} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={weekFilter}
          onChange={(e) => setWeekFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ border: "1px solid var(--db-border)", background: "var(--db-card)", color: "var(--db-text)" }}
        >
          <option value="">All Weeks</option>
          {weeks.map((w) => {
            const d = new Date(w + "T12:00:00");
            return (
              <option key={w} value={w}>
                Week of {d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </option>
            );
          })}
        </select>
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
          {filtered.length} digests
        </span>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filtered} />
    </div>
  );
}
