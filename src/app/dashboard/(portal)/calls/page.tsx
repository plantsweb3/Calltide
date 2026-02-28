"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import DataTable, { type Column } from "@/components/data-table";
import CallTranscript from "@/app/dashboard/_components/call-transcript";
import { TableSkeleton } from "@/components/skeleton";

interface TranscriptLine {
  speaker: "ai" | "caller";
  text: string;
}

interface RecoveryStep {
  time: string;
  event: string;
  detail: string;
  status: "missed" | "action" | "reply" | "recovered";
}

interface Call {
  id: string;
  direction: string;
  callerPhone: string | null;
  calledPhone: string | null;
  status: string;
  duration: number | null;
  language: string | null;
  summary: string | null;
  sentiment: string | null;
  createdAt: string;
  leadName: string | null;
  transcript?: TranscriptLine[] | null;
  recoveryTimeline?: RecoveryStep[] | null;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  completed: { bg: "rgba(74,222,128,0.1)", text: "#4ade80" },
  missed: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24" },
  failed: { bg: "rgba(248,113,113,0.1)", text: "#f87171" },
  in_progress: { bg: "rgba(96,165,250,0.1)", text: "#60a5fa" },
};

interface OutboundCall {
  id: string;
  callType: string;
  customerPhone: string;
  status: string;
  outcome: string | null;
  scheduledFor: string;
  duration: number | null;
  createdAt?: string;
}

const outboundStatusColors: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: "rgba(96,165,250,0.1)", text: "#60a5fa" },
  initiated: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24" },
  completed: { bg: "rgba(74,222,128,0.1)", text: "#4ade80" },
  failed: { bg: "rgba(248,113,113,0.1)", text: "#f87171" },
  retry: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24" },
  consent_blocked: { bg: "rgba(248,113,113,0.1)", text: "#f87171" },
};

const callTypeLabels: Record<string, string> = {
  appointment_reminder: "Appointment Reminder",
  estimate_followup: "Estimate Follow-up",
  seasonal_reminder: "Seasonal Reminder",
};

export default function CallsPage() {
  const [tab, setTab] = useState<"inbound" | "outbound">("inbound");
  const [calls, setCalls] = useState<Call[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [outboundCalls, setOutboundCalls] = useState<OutboundCall[]>([]);
  const [outboundLoading, setOutboundLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/dashboard/calls?${params}`);
      if (!res.ok) throw new Error("Failed to load calls");
      const data = await res.json();
      setCalls(data.calls);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError("Failed to load call history. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  useEffect(() => {
    if (tab === "outbound" && outboundCalls.length === 0) {
      setOutboundLoading(true);
      fetch("/api/dashboard/outbound")
        .then((r) => r.json())
        .then((d) => setOutboundCalls(d.recentCalls ?? []))
        .catch(() => {})
        .finally(() => setOutboundLoading(false));
    }
  }, [tab, outboundCalls.length]);

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "-";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatRecoveryTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatPhone(phone: string | null): string {
    if (!phone) return "-";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 11 && digits[0] === "1") {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  }

  const columns: Column<Call>[] = [
    {
      key: "createdAt",
      label: "Date",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "caller",
      label: "Caller",
      render: (row) => (
        <button
          className="text-left hover:underline"
          style={{ color: "var(--db-accent)" }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCall(row);
          }}
        >
          {row.leadName || formatPhone(row.callerPhone)}
        </button>
      ),
    },
    {
      key: "duration",
      label: "Duration",
      render: (row) => formatDuration(row.duration),
    },
    {
      key: "language",
      label: "Language",
      render: (row) => {
        const lang = (row.language || "-").toUpperCase();
        return (
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              background: row.language === "es" ? "rgba(197,154,39,0.15)" : "rgba(96,165,250,0.1)",
              color: row.language === "es" ? "#C59A27" : "#60a5fa",
            }}
          >
            {lang}
          </span>
        );
      },
    },
    {
      key: "sentiment",
      label: "Sentiment",
      render: (row) => {
        if (!row.sentiment) return <span style={{ color: "var(--db-text-muted)" }}>—</span>;
        const sentimentColors: Record<string, { bg: string; text: string }> = {
          positive: { bg: "rgba(74,222,128,0.1)", text: "#4ade80" },
          neutral: { bg: "rgba(148,163,184,0.1)", text: "#94a3b8" },
          negative: { bg: "rgba(248,113,113,0.1)", text: "#f87171" },
        };
        const c = sentimentColors[row.sentiment] || { bg: "var(--db-hover)", text: "var(--db-text-secondary)" };
        return (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: c.bg, color: c.text }}
          >
            {row.sentiment}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Outcome",
      render: (row) => {
        const c = statusColors[row.status] || { bg: "var(--db-hover)", text: "var(--db-text-secondary)" };
        return (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: c.bg, color: c.text }}
          >
            {row.status.replace("_", " ")}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-body), system-ui, sans-serif", color: "var(--db-text)" }}
          >
            Calls
          </h1>
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--db-border)" }}>
            {(["inbound", "outbound"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: tab === t ? "var(--db-accent)" : "var(--db-card)",
                  color: tab === t ? "#fff" : "var(--db-text-secondary)",
                }}
              >
                {t === "inbound" ? "Inbound" : "Outbound"}
              </button>
            ))}
          </div>
        </div>
        {tab === "inbound" && (
          <input
            type="text"
            placeholder="Search by phone or name..."
            defaultValue={search}
            onChange={(e) => {
              const val = e.target.value;
              clearTimeout(searchTimer.current);
              searchTimer.current = setTimeout(() => {
                setSearch(val);
                setPage(1);
              }, 300);
            }}
            className="rounded-lg px-4 py-2 text-sm outline-none transition-all duration-300 w-full sm:w-64"
            style={{
              background: "var(--db-card)",
              border: "1px solid var(--db-border)",
              color: "var(--db-text)",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
          />
        )}
      </div>

      {tab === "outbound" && (
        <div>
          {outboundLoading ? (
            <TableSkeleton rows={4} />
          ) : outboundCalls.length === 0 ? (
            <div
              className="rounded-xl p-12 text-center"
              style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
            >
              <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>No outbound calls yet</p>
              <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: "var(--db-text-muted)" }}>
                Enable outbound calling in Settings to let María make appointment reminders, estimate follow-ups, and seasonal reminder calls.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {outboundCalls.map((c) => {
                const sc = outboundStatusColors[c.status] ?? { bg: "var(--db-hover)", text: "var(--db-text-secondary)" };
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
                  >
                    <span
                      className="rounded px-2 py-0.5 text-[10px] font-semibold shrink-0"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {callTypeLabels[c.callType] ?? c.callType}
                    </span>
                    <span className="flex-1 text-sm" style={{ color: "var(--db-text)" }}>
                      {formatPhone(c.customerPhone)}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {c.outcome ?? c.status}
                    </span>
                    {c.duration != null && (
                      <span className="text-xs tabular-nums" style={{ color: "var(--db-text-muted)" }}>
                        {formatDuration(c.duration)}
                      </span>
                    )}
                    <span className="text-xs shrink-0" style={{ color: "var(--db-text-muted)" }}>
                      {formatDate(c.scheduledFor)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "inbound" && (<>

      {error && (
        <div className="rounded-xl p-4 mb-4 flex items-center justify-between" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          <button
            onClick={fetchCalls}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}
          >
            Retry
          </button>
        </div>
      )}

      {loading && calls.length === 0 && !error && (
        <TableSkeleton rows={6} />
      )}

      {!loading && calls.length === 0 && !search && (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
            boxShadow: "var(--db-card-shadow)",
          }}
        >
          <svg className="mx-auto mb-4" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--db-text-muted)" }}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>
            No calls yet
          </p>
          <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: "var(--db-text-muted)" }}>
            When your AI receptionist handles calls, they&apos;ll show up here
            with full transcripts and summaries.
          </p>
        </div>
      )}

      {!loading && calls.length === 0 && search && (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
            No calls matching &ldquo;{search}&rdquo;
          </p>
        </div>
      )}

      {calls.length > 0 && (
        <DataTable
          columns={columns}
          data={calls}
          pagination={{
            page,
            totalPages,
            total,
            onPageChange: setPage,
          }}
          expandedContent={(row) => (
            <div className="space-y-4">
              {/* Summary */}
              {row.summary && (
                <div className="space-y-1">
                  <p
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    AI Summary
                  </p>
                  <p
                    className="whitespace-pre-wrap text-sm"
                    style={{ color: "var(--db-text-secondary)" }}
                  >
                    {row.summary}
                  </p>
                </div>
              )}

              {/* Recovery timeline for missed calls */}
              {row.recoveryTimeline && row.recoveryTimeline.length > 0 && (
                <div className="space-y-1">
                  <p
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    Recovery Timeline
                  </p>
                  <div className="mt-2 space-y-0">
                    {row.recoveryTimeline.map((step, i) => {
                      const dotColor =
                        step.status === "missed" ? "#fbbf24"
                          : step.status === "recovered" ? "#4ade80"
                            : step.status === "reply" ? "#60a5fa"
                              : "var(--db-text-muted)";
                      return (
                        <div key={i} className="flex items-start gap-3 py-1.5">
                          <div className="flex flex-col items-center">
                            <div
                              className="h-2.5 w-2.5 rounded-full shrink-0 mt-1"
                              style={{ background: dotColor }}
                            />
                            {i < row.recoveryTimeline!.length - 1 && (
                              <div className="w-px flex-1 min-h-[16px]" style={{ background: "var(--db-border)" }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs tabular-nums" style={{ color: "var(--db-text-muted)" }}>
                                {formatRecoveryTime(step.time)}
                              </span>
                              <span className="text-xs font-medium" style={{ color: "var(--db-text)" }}>
                                {step.event}
                              </span>
                              {step.status === "recovered" && (
                                <span
                                  className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                                  style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}
                                >
                                  Saved
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
                              {step.detail}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* View transcript button */}
              {(row.transcript || row.summary) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCall(row);
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: "rgba(197,154,39,0.12)",
                    color: "var(--db-accent)",
                  }}
                >
                  {row.transcript ? "View Full Transcript" : "View Call Details"}
                </button>
              )}

              {!row.summary && (
                <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
                  No summary available
                </p>
              )}
            </div>
          )}
        />
      )}

      {/* Transcript Panel */}
      {selectedCall && (
        <CallTranscript
          call={selectedCall}
          transcript={selectedCall.transcript || null}
          onClose={() => setSelectedCall(null)}
        />
      )}
      </>)}
    </div>
  );
}
