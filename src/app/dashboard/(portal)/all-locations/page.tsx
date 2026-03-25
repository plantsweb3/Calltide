"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/app/dashboard/_components/loading-spinner";

interface LocationStat {
  id: string;
  name: string;
  locationName: string;
  active: boolean;
  calls: number;
  completedCalls: number;
}

interface AllLocationsData {
  locations: LocationStat[];
  totals: {
    calls: number;
    completedCalls: number;
    missedCalls: number;
    appointments: number;
    confirmedAppointments: number;
    customers: number;
  };
}

export default function AllLocationsPage() {
  const [data, setData] = useState<AllLocationsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/overview/all-locations")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Multi-location overview not available"));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl p-4" style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)" }}>
        <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
      </div>
    );
  }

  if (!data) return <LoadingSpinner message="Loading all locations..." />;

  const { totals, locations } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>
          All Locations
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          Aggregate stats across {locations.length} locations (last 30 days)
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Total Calls" value={totals.calls} />
        <StatCard label="Completed" value={totals.completedCalls} accent />
        <StatCard label="Missed" value={totals.missedCalls} />
        <StatCard label="Appointments" value={totals.appointments} />
        <StatCard label="Confirmed" value={totals.confirmedAppointments} accent />
        <StatCard label="Customers" value={totals.customers} />
      </div>

      {/* Per-location breakdown */}
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
      >
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
          Per Location
        </h3>
        <div className="space-y-2">
          {locations.map((loc) => {
            const rate = loc.calls > 0 ? Math.round((loc.completedCalls / loc.calls) * 100) : 0;
            return (
              <div
                key={loc.id}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: "var(--db-hover)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: loc.active ? "var(--db-success)" : "var(--db-text-muted)" }}
                  />
                  <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                    {loc.locationName}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: "var(--db-text-muted)" }}>
                  <span>{loc.calls} calls</span>
                  <span>{loc.completedCalls} completed</span>
                  <span
                    className="font-medium"
                    style={{ color: rate >= 50 ? "var(--db-success)" : "var(--db-danger)" }}
                  >
                    {rate}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
    >
      <p className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
        {label}
      </p>
      <p
        className="mt-1 text-xl font-bold"
        style={{ color: accent ? "var(--db-accent)" : "var(--db-text)" }}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}
