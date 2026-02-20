"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable, { type Column } from "@/components/data-table";

interface Appointment {
  id: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  notes: string | null;
  createdAt: string;
  leadName: string | null;
  leadPhone: string | null;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");

  const fetchAppointments = useCallback(async () => {
    const res = await fetch(`/api/dashboard/appointments?filter=${filter}`);
    const data = await res.json();
    setAppointments(data.appointments);
  }, [filter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  function formatDateTime(date: string, time: string): string {
    const d = new Date(`${date}T${time}`);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const statusColors: Record<string, string> = {
    confirmed: "bg-green-500/10 text-green-400",
    cancelled: "bg-red-500/10 text-red-400",
    completed: "bg-blue-500/10 text-blue-400",
    no_show: "bg-amber-500/10 text-amber-400",
  };

  const columns: Column<Appointment>[] = [
    {
      key: "dateTime",
      label: "Date & Time",
      render: (row) => formatDateTime(row.date, row.time),
    },
    {
      key: "service",
      label: "Service",
    },
    {
      key: "caller",
      label: "Caller",
      render: (row) => row.leadName || row.leadPhone || "-",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            statusColors[row.status] || "bg-slate-700 text-slate-300"
          }`}
        >
          {row.status.replace("_", " ")}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Appointments</h1>
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === "upcoming"
                ? "bg-slate-700 text-slate-100"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === "past"
                ? "bg-slate-700 text-slate-100"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Past
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={appointments} />
    </div>
  );
}
