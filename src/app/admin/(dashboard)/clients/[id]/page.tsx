"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import StatusBadge from "../../../_components/status-badge";

type Tab = "calls" | "bookings" | "communications" | "ai" | "notes";

interface BusinessDetail {
  id: string;
  name: string;
  type: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string | null;
  twilioNumber: string;
  timezone: string;
  defaultLanguage: string;
  active: boolean;
  createdAt: string;
  stats: {
    calls: { total: number; completed: number; missed: number; avgDuration: number };
    appointments: { total: number; confirmed: number; completed: number };
    sms: { total: number; sent: number; received: number };
  };
  churnRisk: { score: number; factors: string[] } | null;
}

interface Call {
  id: string;
  callerPhone: string | null;
  direction: string;
  status: string;
  duration: number | null;
  language: string | null;
  sentiment: string | null;
  summary: string | null;
  transcript: Array<{ speaker: "ai" | "caller"; text: string }> | null;
  createdAt: string;
  leadName: string | null;
}

interface Appointment {
  id: string;
  service: string;
  date: string;
  time: string;
  status: string;
  notes: string | null;
  leadName: string | null;
}

interface SmsMessage {
  id: string;
  direction: string;
  fromNumber: string;
  toNumber: string;
  body: string;
  templateType: string | null;
  status: string;
  createdAt: string;
  leadName: string | null;
}

interface Note {
  id: string;
  noteText: string;
  createdBy: string;
  createdAt: string;
}

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [tab, setTab] = useState<Tab>("calls");
  const [callsData, setCallsData] = useState<{ calls: Call[]; total: number }>({ calls: [], total: 0 });
  const [appointmentsData, setAppointmentsData] = useState<{ appointments: Appointment[]; total: number }>({ appointments: [], total: 0 });
  const [smsData, setSmsData] = useState<{ messages: SmsMessage[]; total: number }>({ messages: [], total: 0 });
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/clients/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setBusiness(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`/api/admin/clients/${id}/calls?limit=50`)
      .then((r) => r.json())
      .then(setCallsData)
      .catch(() => {});

    fetch(`/api/admin/clients/${id}/appointments?limit=50`)
      .then((r) => r.json())
      .then(setAppointmentsData)
      .catch(() => {});

    fetch(`/api/admin/clients/${id}/sms?limit=50`)
      .then((r) => r.json())
      .then(setSmsData)
      .catch(() => {});

    fetch(`/api/admin/clients/${id}/notes`)
      .then((r) => r.json())
      .then((d) => setNotes(d.notes || []))
      .catch(() => {});
  }, [id]);

  async function addNote() {
    if (!newNote.trim()) return;
    const res = await fetch(`/api/admin/clients/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteText: newNote }),
    });
    if (res.ok) {
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
      setNewNote("");
    }
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "—";
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

  const statusColor = (status: string) => {
    const map: Record<string, { background: string; color: string }> = {
      completed: { background: "rgba(74,222,128,0.1)", color: "#4ade80" },
      confirmed: { background: "rgba(74,222,128,0.1)", color: "#4ade80" },
      missed: { background: "rgba(251,191,36,0.1)", color: "#fbbf24" },
      no_show: { background: "rgba(251,191,36,0.1)", color: "#fbbf24" },
      failed: { background: "rgba(248,113,113,0.1)", color: "#f87171" },
      cancelled: { background: "rgba(248,113,113,0.1)", color: "#f87171" },
    };
    return map[status] || { background: "var(--db-hover)", color: "var(--db-text-secondary)" };
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p style={{ color: "var(--db-text-muted)" }}>Loading client...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p style={{ color: "var(--db-text-muted)" }}>Client not found</p>
        <Link href="/admin/clients" className="text-sm hover:opacity-80" style={{ color: "var(--db-accent)" }}>
          Back to Customers
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "calls", label: "Calls", count: callsData.total },
    { key: "bookings", label: "Bookings", count: appointmentsData.total },
    { key: "communications", label: "Communications", count: smsData.total },
    { key: "ai", label: "AI Performance" },
    { key: "notes", label: "Notes", count: notes.length },
  ];

  const churnLevel =
    business.churnRisk && business.churnRisk.score > 7
      ? "at-risk"
      : business.churnRisk && business.churnRisk.score > 4
        ? "degraded"
        : "operational";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--db-text-muted)" }}>
        <Link href="/admin/clients" className="hover:opacity-80" style={{ color: "var(--db-text-secondary)" }}>
          Customers
        </Link>
        <span>/</span>
        <span style={{ color: "var(--db-text)" }}>{business.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{business.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm" style={{ color: "var(--db-text-muted)" }}>
            <span className="capitalize">{business.type}</span>
            <span>·</span>
            <span>{business.ownerName}</span>
            <span>·</span>
            <span>{business.ownerPhone}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={business.active ? "active" : "churned"} />
          {business.churnRisk && (
            <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              Churn risk: {business.churnRisk.score}/10
            </span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Total Calls</p>
          <p className="mt-1 text-lg font-semibold">{business.stats.calls.total}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Completed</p>
          <p className="mt-1 text-lg font-semibold" style={{ color: "#4ade80" }}>{business.stats.calls.completed}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Missed</p>
          <p className="mt-1 text-lg font-semibold" style={{ color: "#fbbf24" }}>{business.stats.calls.missed}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Avg Duration</p>
          <p className="mt-1 text-lg font-semibold">{formatDuration(business.stats.calls.avgDuration)}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Appointments</p>
          <p className="mt-1 text-lg font-semibold">{business.stats.appointments.total}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>SMS Sent</p>
          <p className="mt-1 text-lg font-semibold">{business.stats.sms.sent}</p>
        </div>
      </div>

      {/* Churn risk factors */}
      {business.churnRisk && business.churnRisk.score > 3 && (
        <div className="rounded-lg p-4" style={{ border: "1px solid rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.05)" }}>
          <p className="text-sm font-medium" style={{ color: "#fbbf24" }}>
            Churn Risk: {business.churnRisk.score}/10
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(business.churnRisk.factors as string[]).map((f, i) => (
              <span
                key={i}
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24" }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b" style={{ borderColor: "var(--db-border)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-medium transition-colors"
            style={
              tab === t.key
                ? { borderBottom: "2px solid var(--db-accent)", color: "var(--db-text)" }
                : { color: "var(--db-text-muted)" }
            }
            onMouseEnter={(e) => {
              if (tab !== t.key) {
                e.currentTarget.style.color = "var(--db-text)";
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== t.key) {
                e.currentTarget.style.color = "var(--db-text-muted)";
              }
            }}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 text-xs" style={{ color: "var(--db-text-muted)" }}>({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {/* Calls Tab */}
        {tab === "calls" && (
          <div className="space-y-2">
            {callsData.calls.length === 0 && (
              <p className="py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No calls yet</p>
            )}
            {callsData.calls.map((call) => {
              const isExpanded = expandedCall === call.id;
              const hasTranscript = call.transcript && call.transcript.length > 0;
              return (
                <div
                  key={call.id}
                  className="rounded-lg text-sm transition-all"
                  style={{ background: "var(--db-card)", border: `1px solid ${isExpanded ? "var(--db-accent)" : "var(--db-border)"}` }}
                >
                  <button
                    className="w-full px-4 py-3 text-left"
                    onClick={() => setExpandedCall(isExpanded ? null : call.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium" style={{ color: "var(--db-text)" }}>
                        {call.leadName || call.callerPhone || "Unknown"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{formatDate(call.createdAt)}</span>
                        {hasTranscript && (
                          <span className="text-xs" style={{ color: "var(--db-accent)" }}>{isExpanded ? "▲" : "▼"}</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={statusColor(call.status)}>
                        {call.status.replace("_", " ")}
                      </span>
                      <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{formatDuration(call.duration)}</span>
                      {call.language && <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{call.language.toUpperCase()}</span>}
                      {call.sentiment && (
                        <span className="text-xs" style={{
                          color: call.sentiment === "positive" ? "#4ade80" :
                                call.sentiment === "negative" ? "#f87171" : "var(--db-text-muted)"
                        }}>
                          {call.sentiment}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{call.direction}</span>
                    </div>
                    {call.summary && (
                      <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--db-text-muted)" }}>{call.summary}</p>
                    )}
                  </button>

                  {/* Expanded transcript */}
                  {isExpanded && hasTranscript && (
                    <div className="border-t px-4 py-3" style={{ borderColor: "var(--db-border)" }}>
                      <p className="mb-2 text-xs font-medium" style={{ color: "var(--db-text-secondary)" }}>Transcript</p>
                      <div className="space-y-2">
                        {call.transcript!.map((line, i) => (
                          <div key={i} className={`flex gap-2 ${line.speaker === "ai" ? "" : "flex-row-reverse"}`}>
                            <span
                              className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                              style={
                                line.speaker === "ai"
                                  ? { background: "rgba(197,154,39,0.15)", color: "#C59A27" }
                                  : { background: "rgba(96,165,250,0.1)", color: "#60a5fa" }
                              }
                            >
                              {line.speaker === "ai" ? "AI" : "Caller"}
                            </span>
                            <p
                              className="rounded-lg px-3 py-1.5 text-xs leading-relaxed"
                              style={{
                                background: line.speaker === "ai" ? "rgba(197,154,39,0.05)" : "rgba(96,165,250,0.05)",
                                color: "var(--db-text-secondary)",
                                maxWidth: "85%",
                              }}
                            >
                              {line.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isExpanded && !hasTranscript && (
                    <div className="border-t px-4 py-3" style={{ borderColor: "var(--db-border)" }}>
                      <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>No transcript available for this call.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bookings Tab */}
        {tab === "bookings" && (
          <div className="space-y-2">
            {appointmentsData.appointments.length === 0 && (
              <p className="py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No bookings yet</p>
            )}
            {appointmentsData.appointments.map((apt) => (
              <div key={apt.id} className="rounded-lg px-4 py-3 text-sm" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-medium" style={{ color: "var(--db-text)" }}>{apt.service}</span>
                  <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={statusColor(apt.status)}>
                    {apt.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
                  {apt.date} at {apt.time} · {apt.leadName || "—"}
                </p>
                {apt.notes && <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>{apt.notes}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Communications Tab */}
        {tab === "communications" && (
          <div className="space-y-2">
            {smsData.messages.length === 0 && (
              <p className="py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No SMS messages yet</p>
            )}
            {smsData.messages.map((msg) => (
              <div key={msg.id} className="rounded-lg px-4 py-3 text-sm" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={
                      msg.direction === "outbound"
                        ? { background: "rgba(96,165,250,0.1)", color: "#60a5fa" }
                        : { background: "rgba(74,222,128,0.1)", color: "#4ade80" }
                    }>
                      {msg.direction}
                    </span>
                    <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{msg.leadName || msg.toNumber}</span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{formatDate(msg.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-xs" style={{ color: "var(--db-text-secondary)" }}>{msg.body}</p>
                {msg.templateType && (
                  <span className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px]" style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}>
                    {msg.templateType}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* AI Performance Tab */}
        {tab === "ai" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Completion Rate</p>
                <p className="mt-1 text-lg font-semibold">
                  {business.stats.calls.total > 0
                    ? `${Math.round((business.stats.calls.completed / business.stats.calls.total) * 100)}%`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Avg Call Duration</p>
                <p className="mt-1 text-lg font-semibold">{formatDuration(business.stats.calls.avgDuration)}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Bookings Created</p>
                <p className="mt-1 text-lg font-semibold">{business.stats.appointments.total}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>SMS Automated</p>
                <p className="mt-1 text-lg font-semibold">{business.stats.sms.sent}</p>
              </div>
            </div>
            <div className="rounded-lg p-4" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
              <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
                Detailed AI performance analytics per customer coming soon. View system-wide AI metrics on the{" "}
                <Link href="/admin/ai" className="hover:opacity-80" style={{ color: "var(--db-accent)" }}>
                  AI Performance
                </Link>{" "}
                page.
              </p>
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {tab === "notes" && (
          <div className="space-y-4">
            {/* Add note form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                placeholder="Add a note..."
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  border: "1px solid var(--db-border)",
                  background: "var(--db-hover)",
                  color: "var(--db-text)",
                }}
              />
              <button
                onClick={addNote}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
                style={{ background: "var(--db-accent)", color: "#fff" }}
              >
                Add
              </button>
            </div>

            {/* Notes list */}
            {notes.length === 0 && (
              <p className="py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No notes yet</p>
            )}
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg px-4 py-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <p className="text-sm" style={{ color: "var(--db-text)" }}>{note.noteText}</p>
                <p className="mt-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
                  {note.createdBy} · {formatDate(note.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
