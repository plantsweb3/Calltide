"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import DataTable, { type Column } from "@/components/data-table";
import CallTranscript from "@/app/dashboard/_components/call-transcript";
import { useReceptionistName } from "@/app/dashboard/_hooks/use-receptionist-name";
import { TableSkeleton } from "@/components/skeleton";
import AudioPlayer from "@/app/dashboard/_components/audio-player";
import ExportCsvButton from "@/app/dashboard/_components/csv-export";
import Button from "@/components/ui/button";
import StatusBadge, { statusToVariant } from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";

interface TranscriptLine {
  speaker: "ai" | "caller";
  text: string;
}

interface IntakeData {
  id: string;
  tradeType: string;
  scopeLevel: string;
  answersJson: Record<string, unknown> | null;
  scopeDescription: string | null;
  urgency: string;
  intakeComplete: boolean;
  createdAt: string;
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
  outcome: string | null;
  audioUrl: string | null;
  recordingUrl?: string | null;
  costCents?: number | null;
  latencyMs?: number | null;
  createdAt: string;
  leadName: string | null;
  transcript?: TranscriptLine[] | null;
  recoveryTimeline?: RecoveryStep[] | null;
}


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


const callTypeLabels: Record<string, string> = {
  appointment_reminder: "Appointment Reminder",
  estimate_followup: "Estimate Follow-up",
  seasonal_reminder: "Seasonal Reminder",
};

export default function CallsPage() {
  const receptionistName = useReceptionistName();
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
  const [intakeCache, setIntakeCache] = useState<Record<string, IntakeData[]>>({});

  // Filter state
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOutcome, setFilterOutcome] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      if (filterOutcome) params.set("outcome", filterOutcome);
      if (filterLanguage) params.set("language", filterLanguage);
      if (filterDateFrom) params.set("dateFrom", filterDateFrom);
      if (filterDateTo) params.set("dateTo", filterDateTo);

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
  }, [page, search, filterStatus, filterOutcome, filterLanguage, filterDateFrom, filterDateTo]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  // Reset search and page when switching tabs
  useEffect(() => {
    setSearch("");
    setPage(1);
  }, [tab]);

  useEffect(() => {
    if (tab === "outbound" && outboundCalls.length === 0) {
      setOutboundLoading(true);
      fetch("/api/dashboard/outbound")
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
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

  function fetchIntakes(callId: string) {
    if (intakeCache[callId]) return;
    fetch(`/api/dashboard/intakes?call_id=${callId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setIntakeCache((prev) => ({ ...prev, [callId]: d.intakes || [] })))
      .catch(() => setIntakeCache((prev) => ({ ...prev, [callId]: [] })));
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
        if (!row.sentiment) return <span style={{ color: "var(--db-text-muted)" }}>---</span>;
        const sentimentVariant: Record<string, "success" | "neutral" | "danger"> = {
          positive: "success",
          neutral: "neutral",
          negative: "danger",
        };
        return (
          <StatusBadge label={row.sentiment} variant={sentimentVariant[row.sentiment] ?? "neutral"} />
        );
      },
    },
    {
      key: "status",
      label: "Outcome",
      render: (row) => (
        <StatusBadge label={row.status} variant={statusToVariant(row.status)} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Calls"
        actions={
          <div className="flex items-center gap-2">
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
            {tab === "inbound" && (
              <>
                <input
                  key={tab}
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
                <ExportCsvButton
                  data={calls}
                  columns={[
                    { header: "Date", accessor: (r) => r.createdAt },
                    { header: "Caller", accessor: (r) => r.leadName || r.callerPhone },
                    { header: "Duration (s)", accessor: (r) => r.duration },
                    { header: "Status", accessor: (r) => r.status },
                    { header: "Sentiment", accessor: (r) => r.sentiment },
                    { header: "Summary", accessor: (r) => r.summary },
                  ]}
                  filename="calls"
                />
              </>
            )}
          </div>
        }
      />

      {tab === "outbound" && (
        <div>
          {outboundLoading ? (
            <TableSkeleton rows={4} />
          ) : outboundCalls.length === 0 ? (
            <EmptyState
              icon={
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
                  <polyline points="15 2 20 2 20 7" /><line x1="14" y1="9" x2="20" y2="2" />
                </svg>
              }
              title="No outbound calls yet"
              description={`Enable outbound calling in Settings to let ${receptionistName} make appointment reminders, estimate follow-ups, and seasonal reminder calls.`}
              action={{ label: "Outbound Settings", href: "/dashboard/settings#outbound" }}
            />
          ) : (
            <DataTable
              columns={[
                {
                  key: "callType" as keyof OutboundCall,
                  label: "Type",
                  render: (row: OutboundCall) => (
                    <StatusBadge label={callTypeLabels[row.callType] ?? row.callType} variant={statusToVariant(row.status)} />
                  ),
                },
                {
                  key: "customerPhone" as keyof OutboundCall,
                  label: "Phone",
                  render: (row: OutboundCall) => (
                    <span className="text-sm" style={{ color: "var(--db-text)" }}>{formatPhone(row.customerPhone)}</span>
                  ),
                },
                {
                  key: "status" as keyof OutboundCall,
                  label: "Outcome",
                  render: (row: OutboundCall) => (
                    <StatusBadge label={row.outcome ?? row.status} variant={statusToVariant(row.status)} />
                  ),
                },
                {
                  key: "duration" as keyof OutboundCall,
                  label: "Duration",
                  render: (row: OutboundCall) => (
                    <span className="text-sm tabular-nums" style={{ color: "var(--db-text-muted)" }}>
                      {row.duration != null ? formatDuration(row.duration) : "\u2014"}
                    </span>
                  ),
                },
                {
                  key: "scheduledFor" as keyof OutboundCall,
                  label: "Scheduled",
                  render: (row: OutboundCall) => (
                    <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>{formatDate(row.scheduledFor)}</span>
                  ),
                },
              ] as Column<OutboundCall>[]}
              data={outboundCalls}
            />
          )}
        </div>
      )}

      {tab === "inbound" && (<>

      {/* Filter Bar */}
      <div
        className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-xl"
        style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
      >
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
            From
          </label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
            className="rounded-lg px-2 py-1.5 text-xs outline-none"
            style={{
              background: "var(--db-card)",
              border: "1px solid var(--db-border)",
              color: "var(--db-text)",
            }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
            To
          </label>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
            className="rounded-lg px-2 py-1.5 text-xs outline-none"
            style={{
              background: "var(--db-card)",
              border: "1px solid var(--db-border)",
              color: "var(--db-text)",
            }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="rounded-lg px-2 py-1.5 text-xs outline-none"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
            color: "var(--db-text)",
          }}
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="missed">Missed</option>
          <option value="voicemail">Voicemail</option>
          <option value="in_progress">In Progress</option>
        </select>
        <select
          value={filterOutcome}
          onChange={(e) => { setFilterOutcome(e.target.value); setPage(1); }}
          className="rounded-lg px-2 py-1.5 text-xs outline-none"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
            color: "var(--db-text)",
          }}
        >
          <option value="">All Outcomes</option>
          <option value="appointment_booked">Booked Appointment</option>
          <option value="estimate_requested">Estimate Requested</option>
          <option value="message_taken">Message Taken</option>
          <option value="transfer">Transferred</option>
          <option value="no_action">No Action</option>
        </select>
        <select
          value={filterLanguage}
          onChange={(e) => { setFilterLanguage(e.target.value); setPage(1); }}
          className="rounded-lg px-2 py-1.5 text-xs outline-none"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
            color: "var(--db-text)",
          }}
        >
          <option value="">All Languages</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
        </select>
        {(filterStatus || filterOutcome || filterLanguage || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => {
              setFilterStatus("");
              setFilterOutcome("");
              setFilterLanguage("");
              setFilterDateFrom("");
              setFilterDateTo("");
              setPage(1);
            }}
            className="rounded-lg px-2 py-1.5 text-xs font-medium transition-colors"
            style={{ color: "var(--db-accent)" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl p-4 mb-4 flex items-center justify-between" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          <Button variant="danger" size="sm" onClick={fetchCalls}>
            Retry
          </Button>
        </div>
      )}

      {loading && calls.length === 0 && !error && (
        <TableSkeleton rows={6} />
      )}

      {!loading && calls.length === 0 && !search && (
        <EmptyState
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          }
          title="No calls yet"
          description="When your AI receptionist handles calls, they'll show up here with full transcripts and summaries."
          action={{ label: "Set Up Call Forwarding", href: "/dashboard/settings#general" }}
        />
      )}

      {!loading && calls.length === 0 && search && (
        <div className="db-card rounded-xl p-12 text-center">
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
          expandedContent={(row) => {
            // Fetch intakes for this call when expanded
            if (!intakeCache[row.id]) fetchIntakes(row.id);
            const intakes = intakeCache[row.id] || [];
            return (
            <div className="space-y-4">
              {/* Call Insights Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {row.sentiment && (
                  <StatusBadge
                    label={row.sentiment}
                    variant={row.sentiment === "positive" ? "success" : row.sentiment === "negative" ? "danger" : "neutral"}
                  />
                )}
                {row.outcome && (
                  <StatusBadge
                    label={row.outcome}
                    variant={
                      row.outcome === "appointment_booked" ? "info"
                        : row.outcome === "message_taken" ? "warning"
                        : row.outcome === "transfer" ? "accent"
                        : "neutral"
                    }
                  />
                )}
                {row.duration != null && (
                  <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                    {formatDuration(row.duration)} call
                    {row.duration < 60 ? " — quick" : row.duration < 300 ? " — typical" : " — detailed"}
                  </span>
                )}
              </div>

              {/* Summary */}
              {row.summary && (
                <div className="space-y-1">
                  <p
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    {receptionistName}&apos;s Summary
                  </p>
                  <p
                    className="whitespace-pre-wrap text-sm"
                    style={{ color: "var(--db-text-secondary)" }}
                  >
                    {row.summary}
                  </p>
                </div>
              )}

              {/* Audio recording */}
              {(row.audioUrl || row.recordingUrl) && (
                <div className="space-y-1">
                  <p
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    Recording
                  </p>
                  <AudioPlayer src={(row.audioUrl || row.recordingUrl)!} />
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

              {/* Intake Summary */}
              {intakes.length > 0 && intakes.map((intake) => (
                <div key={intake.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p
                      className="text-xs font-medium uppercase tracking-wider"
                      style={{ color: "var(--db-text-muted)" }}
                    >
                      Job Intake
                    </p>
                    <StatusBadge
                      label={intake.intakeComplete ? "Complete" : "Partial"}
                      variant={intake.intakeComplete ? "success" : "warning"}
                    />
                    <StatusBadge label={intake.scopeLevel} variant="info" />
                    {intake.urgency !== "normal" && (
                      <StatusBadge
                        label={intake.urgency}
                        variant={intake.urgency === "emergency" ? "danger" : intake.urgency === "urgent" ? "warning" : "neutral"}
                      />
                    )}
                  </div>
                  {intake.scopeDescription && (
                    <p className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
                      {intake.scopeDescription}
                    </p>
                  )}
                  {intake.answersJson && Object.keys(intake.answersJson).length > 0 && (
                    <div
                      className="rounded-lg p-3 space-y-1.5"
                      style={{ background: "var(--db-hover)" }}
                    >
                      {Object.entries(intake.answersJson).map(([key, val]) => (
                        <div key={key} className="flex gap-2 text-xs">
                          <span className="shrink-0 font-medium capitalize" style={{ color: "var(--db-text-muted)" }}>
                            {key.replace(/_/g, " ")}:
                          </span>
                          <span style={{ color: "var(--db-text-secondary)" }}>
                            {String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* View transcript button */}
              {(row.transcript || row.summary) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCall(row);
                  }}
                  style={{
                    background: "rgba(197,154,39,0.12)",
                    color: "var(--db-accent)",
                  }}
                >
                  {row.transcript ? "View Full Transcript" : "View Call Details"}
                </Button>
              )}

              {!row.summary && (
                <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
                  No summary available
                </p>
              )}
            </div>
          ); }}
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
