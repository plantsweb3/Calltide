"use client";

import { useEffect, useState } from "react";
import StatusBadge from "../../_components/status-badge";
import MetricCard from "../../_components/metric-card";
import DataTable, { type Column } from "../../_components/data-table";

interface OpsData {
  services: Array<{
    id: string;
    serviceName: string;
    status: string;
    latencyMs: number | null;
    errorCount: number | null;
    uptimePct: number | null;
    checkedAt: string;
  }>;
  systemStats: {
    totalBusinesses: number;
    totalCalls: number;
    callsToday: number;
    totalAppointments: number;
  };
  recentErrors: Array<{
    id: string;
    serviceName: string;
    status: string;
    latencyMs: number | null;
    errorCount: number | null;
    uptimePct: number | null;
    checkedAt: string;
  }>;
}

export default function OpsPage() {
  const [data, setData] = useState<OpsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/ops")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Failed to load system operations data"));
  }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          </div>
        )}
        {!error && (
          <div className="flex h-64 items-center justify-center">
            <p style={{ color: "var(--db-text-muted)" }}>Loading system operations...</p>
          </div>
        )}
      </div>
    );
  }

  const allOperational = data.services.every((s) => s.status === "operational");

  const errorColumns: Column<OpsData["recentErrors"][0]>[] = [
    {
      key: "serviceName",
      label: "Service",
      render: (row) => (
        <span className="font-medium" style={{ color: "var(--db-text)" }}>{row.serviceName}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "errorCount",
      label: "Errors",
      render: (row) => (
        <span className="font-semibold" style={{ color: "#f87171" }}>{row.errorCount ?? 0}</span>
      ),
    },
    {
      key: "latencyMs",
      label: "Latency",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
          {row.latencyMs != null ? `${row.latencyMs}ms` : "—"}
        </span>
      ),
    },
    {
      key: "uptimePct",
      label: "Uptime",
      render: (row) => (
        <span className="text-xs" style={{ color: (row.uptimePct ?? 100) < 99 ? "#fbbf24" : "var(--db-text-muted)" }}>
          {row.uptimePct != null ? `${row.uptimePct.toFixed(1)}%` : "—"}
        </span>
      ),
    },
    {
      key: "checkedAt",
      label: "Time",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
          {new Date(row.checkedAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">System Operations</h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          Infrastructure health and monitoring
        </p>
      </div>

      {/* Overall status banner */}
      <div
        className="rounded-lg p-4"
        style={
          allOperational
            ? { border: "1px solid rgba(74,222,128,0.2)", background: "rgba(74,222,128,0.05)" }
            : { border: "1px solid rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.05)" }
        }
      >
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: allOperational ? "#4ade80" : "#fbbf24" }}
          />
          <span className="font-medium" style={{ color: allOperational ? "#4ade80" : "#fbbf24" }}>
            {allOperational ? "All Systems Operational" : "Some Systems Degraded"}
          </span>
        </div>
      </div>

      {/* Service health grid */}
      <div>
        <h2 className="mb-3 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>Service Health</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.services.map((svc) => (
            <div
              key={svc.id}
              className="rounded-lg p-4"
              style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium" style={{ color: "var(--db-text)" }}>{svc.serviceName}</p>
                <StatusBadge status={svc.status} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Latency</p>
                  <p className="text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>
                    {svc.latencyMs != null ? `${svc.latencyMs}ms` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Errors</p>
                  <p className="text-sm font-medium" style={{ color: (svc.errorCount ?? 0) > 0 ? "#f87171" : "var(--db-text-secondary)" }}>
                    {svc.errorCount ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Uptime</p>
                  <p className="text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>
                    {svc.uptimePct != null ? `${svc.uptimePct.toFixed(1)}%` : "—"}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[10px]" style={{ color: "var(--db-text-muted)" }}>
                Last checked: {new Date(svc.checkedAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* System stats */}
      <div>
        <h2 className="mb-3 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>Platform Stats</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Total Businesses" value={data.systemStats.totalBusinesses} />
          <MetricCard label="Total Calls" value={data.systemStats.totalCalls} />
          <MetricCard label="Calls Today" value={data.systemStats.callsToday} />
          <MetricCard label="Total Appointments" value={data.systemStats.totalAppointments} />
        </div>
      </div>

      {/* Recent errors table */}
      {data.recentErrors.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>Recent Errors</h2>
          <DataTable columns={errorColumns} data={data.recentErrors} />
        </div>
      )}
    </div>
  );
}
