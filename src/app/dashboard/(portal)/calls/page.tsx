"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import DataTable, { type Column } from "@/components/data-table";
import CallTranscript from "@/app/dashboard/_components/call-transcript";
import { useReceptionistName } from "@/app/dashboard/_hooks/use-receptionist-name";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";
import { TableSkeleton } from "@/components/skeleton";
import AudioPlayer from "@/app/dashboard/_components/audio-player";
import ExportCsvButton from "@/app/dashboard/_components/csv-export";
import Button from "@/components/ui/button";
import StatusBadge, { statusToVariant } from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import PhoneLink from "@/components/phone-link";
import { formatPhone } from "@/lib/format";

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


const callTypeKeys: Record<string, string> = {
  appointment_reminder: "calls.appointmentReminder",
  estimate_followup: "calls.estimateFollowUp",
  seasonal_reminder: "calls.seasonalReminder",
};

export default function CallsPage() {
  const [lang] = useLang();
  const receptionistName = useReceptionistName();
  const searchParams = useSearchParams();
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

  // Filter state — initialize outcome from URL param if present
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOutcome, setFilterOutcome] = useState(() => searchParams.get("outcome") || "");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

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
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setCalls(data.calls);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError(t("error.failedToLoad", lang));
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
      label: t("billing.date", lang),
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "caller",
      label: t("calls.caller", lang),
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
      label: t("calls.duration", lang),
      render: (row) => formatDuration(row.duration),
    },
    {
      key: "language",
      label: t("calls.language", lang),
      render: (row) => {
        const langCode = (row.language || "-").toUpperCase();
        return (
          <span
            className="rounded px-1.5 py-0.5 text-xs font-medium"
            style={{
              background: row.language === "es" ? "var(--db-warning-bg)" : "var(--db-info-bg)",
              color: row.language === "es" ? "var(--db-warning)" : "var(--db-info)",
            }}
          >
            {langCode}
          </span>
        );
      },
    },
    {
      key: "status",
      label: t("calls.outcome", lang),
      render: (row) => (
        <StatusBadge label={row.status} variant={statusToVariant(row.status)} />
      ),
    },
    {
      key: "callBack",
      label: "",
      render: (row) => {
        if (!row.callerPhone) return null;
        const isMessage = row.outcome === "message_taken";
        return (
          <span onClick={(e) => e.stopPropagation()} className="inline-flex">
            <a
              href={`tel:${row.callerPhone}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
              style={{
                background: isMessage ? "var(--db-warning-bg)" : "var(--db-hover)",
                color: isMessage ? "var(--db-warning)" : "var(--db-accent)",
                border: isMessage ? "1px solid var(--db-warning)" : "none",
              }}
              title={t("calls.callBack", lang)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {isMessage ? t("calls.callBack", lang) : ""}
            </a>
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("calls.title", lang)}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(["inbound", "outbound"] as const).map((tabKey) => (
                <button
                  key={tabKey}
                  onClick={() => setTab(tabKey)}
                  className="db-tab"
                  data-active={tab === tabKey}
                >
                  {tabKey === "inbound" ? t("calls.inbound", lang) : t("calls.outbound", lang)}
                </button>
              ))}
            </div>
            {tab === "inbound" && (
              <>
                <input
                  key={tab}
                  type="text"
                  placeholder={t("calls.search", lang)}
                  defaultValue={search}
                  onChange={(e) => {
                    const val = e.target.value;
                    clearTimeout(searchTimer.current);
                    searchTimer.current = setTimeout(() => {
                      setSearch(val);
                      setPage(1);
                    }, 300);
                  }}
                  className="db-input w-full sm:w-64"
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
              title={t("calls.noCalls", lang)}
              description={t("calls.outboundEmptyDesc", lang, { name: receptionistName })}
              action={{ label: t("action.settings", lang), href: "/dashboard/settings#integrations" }}
            />
          ) : (
            <DataTable
              columns={[
                {
                  key: "callType" as keyof OutboundCall,
                  label: t("calls.allTypes", lang),
                  render: (row: OutboundCall) => (
                    <StatusBadge label={callTypeKeys[row.callType] ? t(callTypeKeys[row.callType], lang) : row.callType} variant={statusToVariant(row.status)} />
                  ),
                },
                {
                  key: "customerPhone" as keyof OutboundCall,
                  label: t("calls.phone", lang),
                  render: (row: OutboundCall) => (
                    <PhoneLink phone={row.customerPhone} className="text-sm font-medium hover:underline" />
                  ),
                },
                {
                  key: "status" as keyof OutboundCall,
                  label: t("calls.outcome", lang),
                  render: (row: OutboundCall) => (
                    <StatusBadge label={row.outcome ?? row.status} variant={statusToVariant(row.status)} />
                  ),
                },
                {
                  key: "duration" as keyof OutboundCall,
                  label: t("calls.duration", lang),
                  render: (row: OutboundCall) => (
                    <span className="text-sm tabular-nums" style={{ color: "var(--db-text-muted)" }}>
                      {row.duration != null ? formatDuration(row.duration) : "\u2014"}
                    </span>
                  ),
                },
                {
                  key: "scheduledFor" as keyof OutboundCall,
                  label: t("status.scheduled", lang),
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
      <div className="mb-4">
        {/* Mobile filter toggle */}
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="md:hidden flex items-center gap-2 mb-2 px-3 py-2 rounded-xl text-sm font-medium w-full"
          style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          {t("calls.filters", lang)}
          {(filterStatus || filterOutcome || filterLanguage || filterDateFrom || filterDateTo) && (
            <span className="rounded-full px-1.5 py-0.5 text-xs font-bold" style={{ background: "var(--db-accent)", color: "white" }}>
              {[filterStatus, filterOutcome, filterLanguage, filterDateFrom, filterDateTo].filter(Boolean).length}
            </span>
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto" style={{ transform: filtersOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Filter controls — hidden on mobile unless toggled */}
        <div className={`${filtersOpen ? "block" : "hidden"} md:block`}>
          <div
            className="flex flex-wrap items-center gap-2 p-3 rounded-xl"
            style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
          >
            {/* Date presets */}
            {[
              { label: t("calls.datePresets.today", lang), days: 0 },
              { label: t("calls.datePresets.7d", lang), days: 6 },
              { label: t("calls.datePresets.30d", lang), days: 29 },
            ].map((preset) => {
              const today = new Date().toISOString().split("T")[0];
              const from = preset.days === 0
                ? today
                : new Date(Date.now() - preset.days * 86400000).toISOString().split("T")[0];
              const active = filterDateFrom === from && filterDateTo === today;
              return (
                <button
                  key={preset.label}
                  onClick={() => { setFilterDateFrom(from); setFilterDateTo(today); setPage(1); }}
                  className="db-tab"
                  data-active={active}
                >
                  {preset.label}
                </button>
              );
            })}
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
                {t("sms.from", lang)}
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
                className="db-input px-2 py-1.5 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
                {t("sms.to", lang)}
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
                className="db-input px-2 py-1.5 text-xs"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="db-select text-xs"
            >
              <option value="">{t("calls.allStatuses", lang)}</option>
              <option value="completed">{t("status.completed", lang)}</option>
              <option value="missed">{t("status.missed", lang)}</option>
              <option value="voicemail">{t("calls.voicemail", lang)}</option>
              <option value="in_progress">{t("status.inProgress", lang)}</option>
            </select>
            <select
              value={filterOutcome}
              onChange={(e) => { setFilterOutcome(e.target.value); setPage(1); }}
              className="db-select text-xs"
            >
              <option value="">{t("calls.allOutcomes", lang)}</option>
              <option value="appointment_booked">{t("calls.bookedAppointment", lang)}</option>
              <option value="estimate_requested">{t("calls.estimateRequested", lang)}</option>
              <option value="message_taken">{t("calls.messageTaken", lang)}</option>
              <option value="transfer">{t("calls.transferred", lang)}</option>
              <option value="no_action">{t("calls.noAction", lang)}</option>
            </select>
            <select
              value={filterLanguage}
              onChange={(e) => { setFilterLanguage(e.target.value); setPage(1); }}
              className="db-select text-xs"
            >
              <option value="">{t("calls.language", lang)}</option>
              <option value="en">{t("misc.english", lang)}</option>
              <option value="es">{t("misc.spanish", lang)}</option>
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
                className="rounded-xl px-2 py-1.5 text-xs font-medium transition-colors"
                style={{ color: "var(--db-accent)" }}
              >
                {t("action.clearFilters", lang)}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" aria-live="assertive" className="rounded-xl p-4 mb-4 flex items-center justify-between" style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)" }}>
          <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
          <Button variant="danger" size="sm" onClick={fetchCalls}>
            {t("action.retry", lang)}
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
          title={t("calls.noCalls", lang)}
          description={t("empty.noCalls", lang, { name: receptionistName })}
          action={{ label: t("overview.forwardNumber", lang), href: "/dashboard/settings#general" }}
        />
      )}

      {!loading && calls.length === 0 && search && (
        <div className="db-card rounded-xl p-12 text-center">
          <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
            {t("calls.noMatching", lang)}
          </p>
        </div>
      )}

      {calls.length > 0 && (<>
        {/* Mobile card view */}
        <div className="space-y-3 md:hidden">
          {calls.map((call) => (
            <button
              key={call.id}
              onClick={() => setSelectedCall(call)}
              className="w-full text-left rounded-xl p-4 transition-colors"
              style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
                  {call.leadName || formatPhone(call.callerPhone)}
                </span>
                <span className="text-xs tabular-nums" style={{ color: "var(--db-text-muted)" }}>
                  {formatDuration(call.duration)}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge label={call.status} variant={statusToVariant(call.status)} />
                {call.outcome && (
                  <StatusBadge label={call.outcome.replace(/_/g, " ")} variant={statusToVariant(call.outcome)} />
                )}
                {call.language === "es" && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--db-warning-bg)", color: "var(--db-warning)" }}
                  >
                    ES
                  </span>
                )}
              </div>
              {call.summary && (
                <p className="mt-2 text-xs line-clamp-2" style={{ color: "var(--db-text-muted)" }}>
                  {call.summary}
                </p>
              )}
              <p className="mt-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
                {formatDate(call.createdAt)}
              </p>
            </button>
          ))}
          {/* Mobile pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
            >
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                {t("action.prev", lang)}
              </Button>
              <span className="text-xs tabular-nums" style={{ color: "var(--db-text-muted)" }}>
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                {t("action.next", lang)}
              </Button>
            </div>
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block">
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
                    {receptionistName}&apos;s {t("calls.summary", lang)}
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
                    {t("calls.playAudio", lang)}
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
                    {t("calls.recoveryTimeline", lang)}
                  </p>
                  <div className="mt-2 space-y-0">
                    {row.recoveryTimeline.map((step, i) => {
                      const dotColor =
                        step.status === "missed" ? "var(--db-warning)"
                          : step.status === "recovered" ? "var(--db-success)"
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
                                  className="rounded px-1.5 py-0.5 text-xs font-bold uppercase"
                                  style={{ background: "var(--db-success-bg)", color: "var(--db-success)" }}
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
                      {t("calls.jobIntake", lang)}
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
                      className="rounded-xl p-3 space-y-1.5"
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
                    background: "var(--db-accent-bg)",
                    color: "var(--db-accent)",
                  }}
                >
                  {row.transcript ? t("calls.transcript", lang) : t("calls.summary", lang)}
                </Button>
              )}

              {!row.summary && (
                <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
                  {t("action.noData", lang)}
                </p>
              )}
            </div>
          ); }}
        />
        </div>
      </>)}

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
