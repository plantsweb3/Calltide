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
    const map: Record<string, string> = {
      completed: "bg-green-500/10 text-green-400",
      confirmed: "bg-green-500/10 text-green-400",
      missed: "bg-amber-500/10 text-amber-400",
      no_show: "bg-amber-500/10 text-amber-400",
      failed: "bg-red-500/10 text-red-400",
      cancelled: "bg-red-500/10 text-red-400",
    };
    return map[status] || "bg-slate-700 text-slate-300";
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-500">Loading client...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-slate-500">Client not found</p>
        <Link href="/admin/clients" className="text-sm text-blue-400 hover:text-blue-300">
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
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/clients" className="hover:text-slate-300">
          Customers
        </Link>
        <span>/</span>
        <span className="text-slate-200">{business.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{business.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-slate-400">
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
            <span className="text-xs text-slate-400">
              Churn risk: {business.churnRisk.score}/10
            </span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <p className="text-xs text-slate-500">Total Calls</p>
          <p className="mt-1 text-lg font-semibold">{business.stats.calls.total}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <p className="text-xs text-slate-500">Completed</p>
          <p className="mt-1 text-lg font-semibold text-green-400">{business.stats.calls.completed}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <p className="text-xs text-slate-500">Missed</p>
          <p className="mt-1 text-lg font-semibold text-amber-400">{business.stats.calls.missed}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <p className="text-xs text-slate-500">Avg Duration</p>
          <p className="mt-1 text-lg font-semibold">{formatDuration(business.stats.calls.avgDuration)}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <p className="text-xs text-slate-500">Appointments</p>
          <p className="mt-1 text-lg font-semibold">{business.stats.appointments.total}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <p className="text-xs text-slate-500">SMS Sent</p>
          <p className="mt-1 text-lg font-semibold">{business.stats.sms.sent}</p>
        </div>
      </div>

      {/* Churn risk factors */}
      {business.churnRisk && business.churnRisk.score > 3 && (
        <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 p-4">
          <p className="text-sm font-medium text-amber-400">
            Churn Risk: {business.churnRisk.score}/10
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(business.churnRisk.factors as string[]).map((f, i) => (
              <span
                key={i}
                className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-b-2 border-green-500 text-slate-100"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 text-xs text-slate-500">({t.count})</span>
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
              <p className="py-8 text-center text-xs text-slate-500">No calls yet</p>
            )}
            {callsData.calls.map((call) => (
              <div key={call.id} className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200">
                    {call.leadName || call.callerPhone || "Unknown"}
                  </span>
                  <span className="text-xs text-slate-500">{formatDate(call.createdAt)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusColor(call.status)}`}>
                    {call.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-slate-500">{formatDuration(call.duration)}</span>
                  {call.language && <span className="text-xs text-slate-500">{call.language.toUpperCase()}</span>}
                  {call.sentiment && (
                    <span className={`text-xs ${
                      call.sentiment === "positive" ? "text-green-400" :
                      call.sentiment === "negative" ? "text-red-400" : "text-slate-500"
                    }`}>
                      {call.sentiment}
                    </span>
                  )}
                  <span className="text-xs text-slate-600">{call.direction}</span>
                </div>
                {call.summary && (
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">{call.summary}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bookings Tab */}
        {tab === "bookings" && (
          <div className="space-y-2">
            {appointmentsData.appointments.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-500">No bookings yet</p>
            )}
            {appointmentsData.appointments.map((apt) => (
              <div key={apt.id} className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200">{apt.service}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusColor(apt.status)}`}>
                    {apt.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {apt.date} at {apt.time} · {apt.leadName || "—"}
                </p>
                {apt.notes && <p className="mt-1 text-xs text-slate-500">{apt.notes}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Communications Tab */}
        {tab === "communications" && (
          <div className="space-y-2">
            {smsData.messages.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-500">No SMS messages yet</p>
            )}
            {smsData.messages.map((msg) => (
              <div key={msg.id} className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      msg.direction === "outbound" ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"
                    }`}>
                      {msg.direction}
                    </span>
                    <span className="text-xs text-slate-400">{msg.leadName || msg.toNumber}</span>
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(msg.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-300">{msg.body}</p>
                {msg.templateType && (
                  <span className="mt-1 inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">
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
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs text-slate-500">Completion Rate</p>
                <p className="mt-1 text-lg font-semibold">
                  {business.stats.calls.total > 0
                    ? `${Math.round((business.stats.calls.completed / business.stats.calls.total) * 100)}%`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs text-slate-500">Avg Call Duration</p>
                <p className="mt-1 text-lg font-semibold">{formatDuration(business.stats.calls.avgDuration)}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs text-slate-500">Bookings Created</p>
                <p className="mt-1 text-lg font-semibold">{business.stats.appointments.total}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs text-slate-500">SMS Automated</p>
                <p className="mt-1 text-lg font-semibold">{business.stats.sms.sent}</p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">
                Detailed AI performance analytics per customer coming soon. View system-wide AI metrics on the{" "}
                <Link href="/admin/ai" className="text-blue-400 hover:text-blue-300">
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
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-slate-600"
              />
              <button
                onClick={addNote}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500"
              >
                Add
              </button>
            </div>

            {/* Notes list */}
            {notes.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-500">No notes yet</p>
            )}
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
                <p className="text-sm text-slate-200">{note.noteText}</p>
                <p className="mt-2 text-xs text-slate-500">
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
