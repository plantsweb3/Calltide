"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import MetricCard from "../../_components/metric-card";
import { MetricCardSkeleton } from "@/components/skeleton";

/* ── Types ── */

interface ActiveCall {
  id: string;
  businessId: string;
  businessName: string;
  callerPhone: string;
  customerName: string | null;
  isReturningCaller: boolean;
  direction: string;
  callType: string | null;
  language: string;
  twilioCallSid: string | null;
  sessionId: string | null;
  startedAt: string;
  lastActivityAt: string;
  status: string;
  currentIntent: string | null;
  durationSeconds: number;
}

interface RecentCall {
  id: string;
  businessId: string;
  callerPhone: string | null;
  calledPhone: string | null;
  status: string;
  duration: number | null;
  outcome: string | null;
  transferRequested: boolean | null;
  createdAt: string;
  updatedAt: string;
}

interface PeakData {
  peakConcurrent: number;
  peakTime: string | null;
  totalCalls: number;
  avgDuration: number;
}

interface LiveData {
  activeCalls: ActiveCall[];
  activeCount: number;
  activeByStatus: Record<string, number>;
  peak: PeakData;
  recentCompleted: RecentCall[];
  todayCallCount: number;
  timestamp: string;
}

/* ── Helpers ── */

const POLL_OPTIONS = [
  { label: "3s", value: 3000 },
  { label: "5s", value: 5000 },
  { label: "10s", value: 10000 },
  { label: "30s", value: 30000 },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  ringing: { bg: "rgba(251,191,36,0.15)", text: "#fbbf24", label: "Ringing" },
  in_progress: { bg: "rgba(74,222,128,0.15)", text: "#4ade80", label: "In Progress" },
  transferring: { bg: "rgba(168,85,247,0.15)", text: "#a855f7", label: "Transferring" },
  emergency: { bg: "rgba(239,68,68,0.2)", text: "#ef4444", label: "Emergency" },
};

const INTENT_LABELS: Record<string, string> = {
  booking: "Booking",
  message: "Taking Message",
  transfer: "Transfer Request",
  emergency: "Emergency",
  general: "General Inquiry",
};

function formatDuration(startedAt: string): string {
  const seconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatPhone(phone: string | null): string {
  if (!phone) return "Unknown";
  if (phone.length === 10) return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  if (phone.startsWith("+1") && phone.length === 12) {
    const n = phone.slice(2);
    return `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`;
  }
  return phone;
}

function isLongCall(startedAt: string): boolean {
  return Date.now() - new Date(startedAt).getTime() > 10 * 60 * 1000; // >10 min
}

/* ── Component ── */

export default function LiveMonitorPage() {
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState(5000);
  const [isPaused, setIsPaused] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [, setTick] = useState(0); // forces re-render for live duration counters

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/live");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(fetchData, pollInterval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [pollInterval, isPaused, fetchData]);

  // Tick every second to update live durations
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const activeCalls = data?.activeCalls ?? [];
  const emergencyCalls = activeCalls.filter((c) => c.status === "emergency" || c.currentIntent === "emergency");
  const transferringCalls = activeCalls.filter((c) => c.status === "transferring");
  const longCalls = activeCalls.filter((c) => isLongCall(c.startedAt) && c.status !== "emergency");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--db-text)" }}>
            Live Call Monitor
          </h1>
          <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
            Real-time view of all active calls across businesses
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Last updated */}
          {lastRefresh && (
            <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}

          {/* Pause/Resume */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: isPaused ? "rgba(251,191,36,0.15)" : "var(--db-hover)",
              color: isPaused ? "#fbbf24" : "var(--db-text-muted)",
              border: "1px solid var(--db-border)",
            }}
          >
            {isPaused ? "Paused" : "Live"}
          </button>

          {/* Poll interval selector */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--db-border)" }}>
            {POLL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPollInterval(opt.value)}
                className="px-2.5 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: pollInterval === opt.value ? "var(--db-accent)" : "var(--db-surface)",
                  color: pollInterval === opt.value ? "#fff" : "var(--db-text-muted)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Manual refresh */}
          <button
            onClick={fetchData}
            className="rounded-lg p-2 transition-colors"
            style={{ background: "var(--db-hover)", color: "var(--db-text-muted)", border: "1px solid var(--db-border)" }}
            title="Refresh now"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Alerts Banner */}
      {(emergencyCalls.length > 0 || transferringCalls.length > 0 || longCalls.length > 0) && (
        <div className="space-y-2">
          {emergencyCalls.map((c) => (
            <div
              key={`alert-${c.id}`}
              className="flex items-center gap-3 rounded-lg px-4 py-3 animate-pulse"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              <span style={{ color: "#ef4444", fontSize: 18 }}>!</span>
              <div className="flex-1">
                <span className="text-sm font-semibold" style={{ color: "#ef4444" }}>
                  EMERGENCY — {c.businessName}
                </span>
                <span className="text-xs ml-2" style={{ color: "var(--db-text-muted)" }}>
                  {formatPhone(c.callerPhone)} · {formatDuration(c.startedAt)}
                </span>
              </div>
            </div>
          ))}
          {transferringCalls.map((c) => (
            <div
              key={`transfer-${c.id}`}
              className="flex items-center gap-3 rounded-lg px-4 py-3"
              style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)" }}
            >
              <span style={{ color: "#a855f7", fontSize: 14 }}>&#8644;</span>
              <div className="flex-1">
                <span className="text-sm font-medium" style={{ color: "#a855f7" }}>
                  Transfer Requested — {c.businessName}
                </span>
                <span className="text-xs ml-2" style={{ color: "var(--db-text-muted)" }}>
                  {formatPhone(c.callerPhone)} · {formatDuration(c.startedAt)}
                </span>
              </div>
            </div>
          ))}
          {longCalls.map((c) => (
            <div
              key={`long-${c.id}`}
              className="flex items-center gap-3 rounded-lg px-4 py-3"
              style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)" }}
            >
              <span style={{ color: "#fbbf24", fontSize: 14 }}>&#9203;</span>
              <div className="flex-1">
                <span className="text-sm font-medium" style={{ color: "#fbbf24" }}>
                  Long Call ({formatDuration(c.startedAt)}) — {c.businessName}
                </span>
                <span className="text-xs ml-2" style={{ color: "var(--db-text-muted)" }}>
                  {formatPhone(c.callerPhone)}
                  {c.customerName && ` · ${c.customerName}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metric Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="rounded-lg p-4" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
          Error loading live data: {error}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard
            label="Active Now"
            value={data?.activeCount ?? 0}
            change={
              data?.activeByStatus
                ? Object.entries(data.activeByStatus)
                    .map(([k, v]) => `${v} ${k.replace(/_/g, " ")}`)
                    .join(", ")
                : "No active calls"
            }
          />
          <MetricCard
            label="Today's Calls"
            value={data?.todayCallCount ?? 0}
            change={`Peak: ${data?.peak.peakConcurrent ?? 0} concurrent${data?.peak.peakTime ? ` at ${data.peak.peakTime}` : ""}`}
          />
          <MetricCard
            label="Peak Concurrent"
            value={data?.peak.peakConcurrent ?? 0}
            change={data?.peak.peakTime ? `Reached at ${data.peak.peakTime}` : "No data yet"}
          />
          <MetricCard
            label="Avg Duration"
            value={data?.peak.avgDuration ? `${Math.round(data.peak.avgDuration / 60)}m` : "0m"}
            change="Today's average"
          />
        </div>
      )}

      {/* Active Calls Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--db-text)" }}>
          Active Calls ({activeCalls.length})
        </h2>
        {activeCalls.length === 0 ? (
          <div
            className="rounded-lg p-8 text-center"
            style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
          >
            <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
              No active calls right now
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeCalls.map((call) => {
              const sc = STATUS_COLORS[call.status] ?? STATUS_COLORS.in_progress;
              const isEmergency = call.status === "emergency" || call.currentIntent === "emergency";
              const isLong = isLongCall(call.startedAt);

              return (
                <div
                  key={call.id}
                  className="rounded-lg p-4"
                  style={{
                    background: "var(--db-surface)",
                    border: `1px solid ${isEmergency ? "rgba(239,68,68,0.4)" : isLong ? "rgba(251,191,36,0.3)" : "var(--db-border)"}`,
                  }}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: sc.bg, color: sc.text }}
                      >
                        {sc.label}
                      </span>
                      {call.direction === "outbound" && (
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa" }}
                        >
                          Outbound
                        </span>
                      )}
                      {call.isReturningCaller && (
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}
                        >
                          Returning
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-mono font-semibold" style={{ color: "var(--db-text)" }}>
                      {formatDuration(call.startedAt)}
                    </span>
                  </div>

                  {/* Business name */}
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--db-text)" }}>
                    {call.businessName}
                  </p>

                  {/* Caller info */}
                  <p className="text-xs mb-2" style={{ color: "var(--db-text-muted)" }}>
                    {call.customerName ? `${call.customerName} · ` : ""}
                    {formatPhone(call.callerPhone)}
                    {call.language !== "en" && (
                      <span
                        className="ml-1.5 inline-flex rounded px-1 py-0.5 text-[10px] font-medium"
                        style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
                      >
                        {call.language.toUpperCase()}
                      </span>
                    )}
                  </p>

                  {/* Current intent */}
                  {call.currentIntent && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]" style={{ color: "var(--db-text-muted)" }}>Intent:</span>
                      <span className="text-[11px] font-medium" style={{ color: "var(--db-text)" }}>
                        {INTENT_LABELS[call.currentIntent] ?? call.currentIntent}
                      </span>
                    </div>
                  )}

                  {/* Call type for outbound */}
                  {call.callType && call.direction === "outbound" && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px]" style={{ color: "var(--db-text-muted)" }}>Type:</span>
                      <span className="text-[11px] font-medium" style={{ color: "var(--db-text)" }}>
                        {call.callType.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Completed */}
      <div>
        <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--db-text)" }}>
          Recently Completed
        </h2>
        {(!data?.recentCompleted || data.recentCompleted.length === 0) ? (
          <div
            className="rounded-lg p-6 text-center"
            style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
          >
            <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>No recent calls</p>
          </div>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--db-border)" }}>
                  {["Phone", "Status", "Duration", "Outcome", "Transfer", "Completed"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-medium"
                      style={{ color: "var(--db-text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentCompleted.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--db-border)" }}>
                    <td className="px-4 py-2.5" style={{ color: "var(--db-text)" }}>
                      {formatPhone(c.callerPhone)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--db-text-muted)" }}>
                      {c.duration ? `${Math.round(c.duration / 60)}m ${c.duration % 60}s` : "—"}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--db-text-muted)" }}>
                      {c.outcome ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      {c.transferRequested ? (
                        <span className="text-[11px] font-medium" style={{ color: "#a855f7" }}>Yes</span>
                      ) : (
                        <span style={{ color: "var(--db-text-muted)" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "var(--db-text-muted)" }}>
                      {c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
