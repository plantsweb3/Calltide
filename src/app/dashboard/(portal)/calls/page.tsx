"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable, { type Column } from "@/components/data-table";
import CallTranscript from "@/app/dashboard/_components/call-transcript";

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

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
    });
    if (search) params.set("search", search);

    const res = await fetch(`/api/dashboard/calls?${params}`);
    const data = await res.json();
    setCalls(data.calls);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

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
          {row.leadName || row.callerPhone || "-"}
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
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-serif), serif", color: "var(--db-text)" }}
        >
          Calls
        </h1>
        <input
          type="text"
          placeholder="Search by phone or name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded-lg px-4 py-2 text-sm outline-none transition-colors duration-300 w-full sm:w-64"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
            color: "var(--db-text)",
          }}
        />
      </div>

      {loading && calls.length === 0 && (
        <div
          className="flex items-center justify-center py-20"
          style={{ color: "var(--db-text-muted)" }}
        >
          Loading...
        </div>
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
          <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>
            No calls yet
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--db-text-muted)" }}>
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
    </div>
  );
}
