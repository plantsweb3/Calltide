"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable, { type Column } from "@/components/data-table";
import AppointmentCalendar from "@/app/dashboard/_components/appointment-calendar";
import LoadingSpinner from "@/app/dashboard/_components/loading-spinner";

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
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/appointments?filter=${filter}`);
      if (!res.ok) throw new Error("Failed to load appointments");
      const data = await res.json();
      setAppointments(data.appointments);
    } catch {
      setError("Failed to load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
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

  const statusColors: Record<string, { bg: string; text: string }> = {
    confirmed: { bg: "rgba(74,222,128,0.1)", text: "#4ade80" },
    cancelled: { bg: "rgba(248,113,113,0.1)", text: "#f87171" },
    completed: { bg: "rgba(96,165,250,0.1)", text: "#60a5fa" },
    no_show: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24" },
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
          style={{ fontFamily: "var(--font-body), system-ui, sans-serif", color: "var(--db-text)" }}
        >
          Appointments
        </h1>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          {filter === "upcoming" && (
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--db-border)" }}
            >
              <button
                onClick={() => setView("calendar")}
                className="px-3 py-2 transition-colors"
                style={{
                  background: view === "calendar" ? "var(--db-accent)" : "var(--db-card)",
                  color: view === "calendar" ? "#fff" : "var(--db-text-muted)",
                }}
                title="Calendar view"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </button>
              <button
                onClick={() => setView("list")}
                className="px-3 py-2 transition-colors"
                style={{
                  background: view === "list" ? "var(--db-accent)" : "var(--db-card)",
                  color: view === "list" ? "#fff" : "var(--db-text-muted)",
                }}
                title="List view"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* Filter toggle */}
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--db-border)" }}
          >
            <button
              onClick={() => { setFilter("upcoming"); setView("calendar"); }}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: filter === "upcoming" ? "var(--db-accent)" : "var(--db-card)",
                color: filter === "upcoming" ? "#fff" : "var(--db-text-muted)",
              }}
            >
              Upcoming
            </button>
            <button
              onClick={() => { setFilter("past"); setView("list"); }}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: filter === "past" ? "var(--db-accent)" : "var(--db-card)",
                color: filter === "past" ? "#fff" : "var(--db-text-muted)",
              }}
            >
              Past
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
        </div>
      )}

      {loading && appointments.length === 0 && !error && (
        <LoadingSpinner message="Loading appointments..." />
      )}

      {!loading && appointments.length === 0 && (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
            boxShadow: "var(--db-card-shadow)",
          }}
        >
          <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>
            No {filter} appointments
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--db-text-muted)" }}>
            When your AI receptionist books appointments, they&apos;ll appear here.
          </p>
        </div>
      )}

      {appointments.length > 0 && view === "calendar" && filter === "upcoming" && (
        <AppointmentCalendar appointments={appointments} />
      )}

      {appointments.length > 0 && (view === "list" || filter === "past") && (
        <DataTable columns={columns} data={appointments} />
      )}
    </div>
  );
}
