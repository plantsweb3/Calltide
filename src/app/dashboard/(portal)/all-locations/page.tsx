"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/app/dashboard/_components/loading-spinner";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

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
  const [lang] = useLang();
  const [data, setData] = useState<AllLocationsData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/overview/all-locations")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl p-4" style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)" }}>
        <p className="text-sm" style={{ color: "var(--db-danger)" }}>{t("allLocations.loadError", lang)}</p>
      </div>
    );
  }

  if (!data) return <LoadingSpinner message={t("allLocations.loading", lang)} />;

  const { totals, locations } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>
          {t("allLocations.title", lang)}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          {t("allLocations.subtitle", lang, { count: locations.length })}
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label={t("allLocations.totalCalls", lang)} value={totals.calls} />
        <StatCard label={t("allLocations.completed", lang)} value={totals.completedCalls} accent />
        <StatCard label={t("allLocations.missed", lang)} value={totals.missedCalls} />
        <StatCard label={t("allLocations.appointments", lang)} value={totals.appointments} />
        <StatCard label={t("allLocations.confirmed", lang)} value={totals.confirmedAppointments} accent />
        <StatCard label={t("allLocations.customers", lang)} value={totals.customers} />
      </div>

      {/* Per-location breakdown */}
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
      >
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
          {t("allLocations.perLocation", lang)}
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
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                    {loc.locationName}
                  </span>
                  <span className="sr-only">
                    ({loc.active ? t("team.active", lang) : t("team.inactive", lang)})
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: "var(--db-text-muted)" }}>
                  <span>{loc.calls} {t("allLocations.calls", lang)}</span>
                  <span>{loc.completedCalls} {t("allLocations.completedLabel", lang)}</span>
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
