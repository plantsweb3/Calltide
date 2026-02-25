"use client";

import { useEffect, useState } from "react";

interface ClientInfo {
  id: string;
  name: string;
  type: string;
  ownerName: string;
  ownerPhone: string;
  active: boolean;
}

interface Call {
  id: string;
  callerPhone: string | null;
  status: string;
  duration: number | null;
  language: string | null;
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

export default function ClientDetail({
  client,
  onClose,
}: {
  client: ClientInfo;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"calls" | "appointments">("calls");
  const [calls, setCalls] = useState<Call[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [callsTotal, setCallsTotal] = useState(0);
  const [aptsTotal, setAptsTotal] = useState(0);

  useEffect(() => {
    fetch(`/api/admin/clients/${client.id}/calls?limit=50`)
      .then((r) => r.json())
      .then((d) => {
        setCalls(d.calls);
        setCallsTotal(d.total);
      });

    fetch(`/api/admin/clients/${client.id}/appointments?limit=50`)
      .then((r) => r.json())
      .then((d) => {
        setAppointments(d.appointments);
        setAptsTotal(d.total);
      });
  }, [client.id]);

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

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-[480px] flex-col border-l border-slate-800 bg-slate-900 shadow-2xl">
      {/* Header */}
      <div className="border-b border-slate-800 px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="truncate text-lg font-semibold">{client.name}</h2>
          <button
            onClick={onClose}
            className="text-lg text-slate-400 hover:text-slate-200"
          >
            &times;
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-slate-500">Type</p>
            <p className="capitalize text-slate-200">{client.type}</p>
          </div>
          <div>
            <p className="text-slate-500">Owner</p>
            <p className="text-slate-200">{client.ownerName}</p>
          </div>
          <div>
            <p className="text-slate-500">Phone</p>
            <p className="text-slate-200">{client.ownerPhone}</p>
          </div>
          <div>
            <p className="text-slate-500">Status</p>
            <p className={client.active ? "text-green-400" : "text-red-400"}>
              {client.active ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setTab("calls")}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "calls"
              ? "border-b-2 border-green-500 text-slate-100"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Calls ({callsTotal})
        </button>
        <button
          onClick={() => setTab("appointments")}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "appointments"
              ? "border-b-2 border-green-500 text-slate-100"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Appointments ({aptsTotal})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "calls" && (
          <div className="space-y-2">
            {calls.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-500">
                No calls yet
              </p>
            )}
            {calls.map((call) => (
              <div
                key={call.id}
                className="rounded-lg bg-slate-800 px-3 py-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200">
                    {call.leadName || call.callerPhone || "Unknown"}
                  </span>
                  <span className="text-slate-500">
                    {formatDate(call.createdAt)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusColor(call.status)}`}
                  >
                    {call.status.replace("_", " ")}
                  </span>
                  <span className="text-slate-500">
                    {formatDuration(call.duration)}
                  </span>
                  {call.language && (
                    <span className="text-slate-500">
                      {call.language.toUpperCase()}
                    </span>
                  )}
                </div>
                {call.summary && (
                  <p className="mt-1.5 leading-relaxed text-slate-400">
                    {call.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "appointments" && (
          <div className="space-y-2">
            {appointments.length === 0 && (
              <p className="py-8 text-center text-xs text-slate-500">
                No appointments yet
              </p>
            )}
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="rounded-lg bg-slate-800 px-3 py-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200">
                    {apt.service}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusColor(apt.status)}`}
                  >
                    {apt.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-slate-400">
                  {apt.date} at {apt.time} &middot;{" "}
                  {apt.leadName || "\u2014"}
                </p>
                {apt.notes && (
                  <p className="mt-1 text-slate-500">{apt.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
