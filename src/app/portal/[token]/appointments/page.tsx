"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Appointment {
  id: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  notes: string | null;
  createdAt: string;
}

export default function PortalAppointments() {
  const params = useParams();
  const token = params.token as string;

  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [actionId, setActionId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const [upRes, pastRes] = await Promise.all([
        fetch(`/api/portal/${token}/appointments?filter=upcoming`),
        fetch(`/api/portal/${token}/appointments?filter=past`),
      ]);
      if (upRes.ok) {
        const data = await upRes.json();
        setUpcoming(data.appointments || []);
      }
      if (pastRes.ok) {
        const data = await pastRes.json();
        setPast(data.appointments || []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(appointmentId: string, action: "confirm" | "cancel", reason?: string) {
    setActionLoading(true);
    setActionId(appointmentId);
    try {
      const res = await fetch(`/api/portal/${token}/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) {
        setShowCancelModal(null);
        setCancelReason("");
        await fetchAppointments();
      }
    } catch {
      // Silent fail
    } finally {
      setActionLoading(false);
      setActionId(null);
    }
  }

  const appointments = tab === "upcoming" ? upcoming : past;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Appointments
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          View and manage your appointments.
        </p>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("upcoming")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === "upcoming"
              ? "bg-navy text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Upcoming ({upcoming.filter((a) => a.status !== "cancelled").length})
        </button>
        <button
          onClick={() => setTab("past")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === "past"
              ? "bg-navy text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Past ({past.length})
        </button>
      </div>

      {/* Appointment list */}
      {appointments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">
            {tab === "upcoming"
              ? "No upcoming appointments."
              : "No past appointments."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {apt.service}
                    </h3>
                    <StatusBadge status={apt.status} />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(apt.date)} at {formatTime(apt.time)}
                  </p>
                  {apt.duration && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {apt.duration} min
                    </p>
                  )}
                  {apt.notes && (
                    <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">
                      {apt.notes}
                    </p>
                  )}
                </div>

                {/* Actions for upcoming appointments */}
                {tab === "upcoming" && apt.status !== "cancelled" && apt.status !== "completed" && (
                  <div className="flex gap-2 flex-shrink-0">
                    {apt.status !== "confirmed" && (
                      <button
                        onClick={() => handleAction(apt.id, "confirm")}
                        disabled={actionLoading && actionId === apt.id}
                        className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        Confirm
                      </button>
                    )}
                    <button
                      onClick={() => setShowCancelModal(apt.id)}
                      disabled={actionLoading && actionId === apt.id}
                      className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Cancel modal */}
              {showCancelModal === apt.id && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    Are you sure you want to cancel this appointment?
                  </p>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Reason for cancellation (optional)"
                    className="w-full text-sm border border-red-200 rounded-lg p-2 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleAction(apt.id, "cancel", cancelReason)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading && actionId === apt.id ? "Cancelling..." : "Yes, Cancel"}
                    </button>
                    <button
                      onClick={() => {
                        setShowCancelModal(null);
                        setCancelReason("");
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-white text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Keep Appointment
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-500",
    no_show: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatTime(time: string): string {
  try {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display}:${m} ${ampm}`;
  } catch {
    return time;
  }
}
