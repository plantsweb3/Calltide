"use client";

import { useEffect, useState, useCallback } from "react";
import MetricCard from "../../_components/metric-card";
import DataTable, { type Column } from "@/components/data-table";
import { MetricCardSkeleton, TableSkeleton } from "@/components/skeleton";

interface OutboundCall {
  id: string;
  businessName: string | null;
  customerPhone: string;
  customerName: string | null;
  callType: string;
  status: string;
  outcome: string | null;
  scheduledFor: string;
  attemptedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  retryCount: number | null;
  language: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  completed: number;
  answered: number;
  noAnswer: number;
  failed: number;
  consentBlocked: number;
  scheduled: number;
  avgDuration: number;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: "rgba(96,165,250,0.1)", text: "#60a5fa" },
  initiated: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24" },
  ringing: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24" },
  "in-progress": { bg: "rgba(74,222,128,0.1)", text: "#4ade80" },
  completed: { bg: "rgba(74,222,128,0.1)", text: "#4ade80" },
  "no-answer": { bg: "rgba(148,163,184,0.1)", text: "#94a3b8" },
  busy: { bg: "rgba(148,163,184,0.1)", text: "#94a3b8" },
  failed: { bg: "rgba(248,113,113,0.1)", text: "#f87171" },
  canceled: { bg: "rgba(248,113,113,0.1)", text: "#f87171" },
  retry: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24" },
  consent_blocked: { bg: "rgba(248,113,113,0.1)", text: "#f87171" },
};

const CALL_TYPE_LABELS: Record<string, string> = {
  appointment_reminder: "Apt Reminder",
  estimate_followup: "Estimate F/U",
  seasonal_reminder: "Seasonal",
};

export default function AdminOutboundPage() {
  const [calls, setCalls] = useState<OutboundCall[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/outbound?page=${page}&limit=25`);
      const data = await res.json();
      setCalls(data.calls ?? []);
      setStats(data.stats ?? null);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setError("Failed to load outbound calls");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "-";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 11 && digits[0] === "1") {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  }

  const columns: Column<OutboundCall>[] = [
    {
      key: "scheduledFor",
      label: "Scheduled",
      render: (row) => formatDate(row.scheduledFor),
    },
    {
      key: "businessName",
      label: "Business",
      render: (row) => (
        <span className="truncate max-w-[140px] block" style={{ color: "var(--db-text)" }}>
          {row.businessName ?? "-"}
        </span>
      ),
    },
    {
      key: "customerPhone",
      label: "Customer",
      render: (row) => (
        <span style={{ color: "var(--db-text-secondary)" }}>
          {row.customerName ?? formatPhone(row.customerPhone)}
        </span>
      ),
    },
    {
      key: "callType",
      label: "Type",
      render: (row) => (
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
          style={{
            background: "rgba(197,154,39,0.12)",
            color: "var(--db-accent)",
          }}
        >
          {CALL_TYPE_LABELS[row.callType] ?? row.callType}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const c = STATUS_COLORS[row.status] ?? { bg: "var(--db-hover)", text: "var(--db-text-secondary)" };
        return (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: c.bg, color: c.text }}
          >
            {row.outcome ?? row.status.replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      key: "duration",
      label: "Duration",
      render: (row) => formatDuration(row.duration),
    },
    {
      key: "retryCount",
      label: "Retries",
      render: (row) => (
        <span style={{ color: "var(--db-text-muted)" }}>{row.retryCount ?? 0}</span>
      ),
    },
    {
      key: "language",
      label: "Lang",
      render: (row) => (
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            background: row.language === "es" ? "rgba(197,154,39,0.15)" : "rgba(96,165,250,0.1)",
            color: row.language === "es" ? "#D4A843" : "#60a5fa",
          }}
        >
          {(row.language ?? "en").toUpperCase()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>
          Outbound Calls
        </h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          María&apos;s outbound calling activity across all clients
        </p>
      </div>

      {error && (
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          <button onClick={fetchData} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>Retry</button>
        </div>
      )}

      {/* Stats */}
      {stats ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Total Calls" value={stats.total} />
          <MetricCard label="Answered" value={stats.answered} changeType="positive" />
          <MetricCard label="No Answer" value={stats.noAnswer} />
          <MetricCard
            label="Answer Rate"
            value={stats.completed > 0 ? Math.round((stats.answered / stats.completed) * 100) : 0}
            suffix="%"
            changeType="positive"
          />
          <MetricCard label="Failed" value={stats.failed} changeType={stats.failed > 0 ? "negative" : "neutral"} />
          <MetricCard label="Consent Blocked" value={stats.consentBlocked} changeType={stats.consentBlocked > 0 ? "negative" : "neutral"} />
          <MetricCard label="Pending" value={stats.scheduled} />
          <MetricCard label="Avg Duration" value={stats.avgDuration} suffix="s" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Table */}
      {loading && calls.length === 0 ? (
        <TableSkeleton rows={6} />
      ) : calls.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
        >
          <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>
            No outbound calls yet
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--db-text-muted)" }}>
            When clients enable outbound calling, activity will appear here.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={calls}
          pagination={{
            page,
            totalPages,
            total,
            onPageChange: setPage,
          }}
        />
      )}
    </div>
  );
}
