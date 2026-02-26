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

  useEffect(() => {
    fetch("/api/admin/ops")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-500">Loading system operations...</p>
      </div>
    );
  }

  const allOperational = data.services.every((s) => s.status === "operational");

  const errorColumns: Column<OpsData["recentErrors"][0]>[] = [
    {
      key: "serviceName",
      label: "Service",
      render: (row) => (
        <span className="font-medium text-slate-200">{row.serviceName}</span>
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
        <span className="font-semibold text-red-400">{row.errorCount ?? 0}</span>
      ),
    },
    {
      key: "latencyMs",
      label: "Latency",
      render: (row) => (
        <span className="text-xs text-slate-400">
          {row.latencyMs != null ? `${row.latencyMs}ms` : "—"}
        </span>
      ),
    },
    {
      key: "uptimePct",
      label: "Uptime",
      render: (row) => (
        <span className={`text-xs ${(row.uptimePct ?? 100) < 99 ? "text-amber-400" : "text-slate-400"}`}>
          {row.uptimePct != null ? `${row.uptimePct.toFixed(1)}%` : "—"}
        </span>
      ),
    },
    {
      key: "checkedAt",
      label: "Time",
      render: (row) => (
        <span className="text-xs text-slate-500">
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
        <p className="text-sm text-slate-400">
          Infrastructure health and monitoring
        </p>
      </div>

      {/* Overall status banner */}
      <div
        className={`rounded-lg border p-4 ${
          allOperational
            ? "border-green-800/50 bg-green-950/30"
            : "border-amber-800/50 bg-amber-950/30"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`h-3 w-3 rounded-full ${
              allOperational ? "bg-green-500" : "bg-amber-500"
            }`}
          />
          <span className={`font-medium ${allOperational ? "text-green-400" : "text-amber-400"}`}>
            {allOperational ? "All Systems Operational" : "Some Systems Degraded"}
          </span>
        </div>
      </div>

      {/* Service health grid */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-300">Service Health</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.services.map((svc) => (
            <div
              key={svc.id}
              className="rounded-lg border border-slate-800 bg-slate-900 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-200">{svc.serviceName}</p>
                <StatusBadge status={svc.status} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-slate-500">Latency</p>
                  <p className="text-sm font-medium text-slate-300">
                    {svc.latencyMs != null ? `${svc.latencyMs}ms` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Errors</p>
                  <p className={`text-sm font-medium ${(svc.errorCount ?? 0) > 0 ? "text-red-400" : "text-slate-300"}`}>
                    {svc.errorCount ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Uptime</p>
                  <p className="text-sm font-medium text-slate-300">
                    {svc.uptimePct != null ? `${svc.uptimePct.toFixed(1)}%` : "—"}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-slate-600">
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
        <h2 className="mb-3 text-sm font-medium text-slate-300">Platform Stats</h2>
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
          <h2 className="mb-3 text-sm font-medium text-slate-300">Recent Errors</h2>
          <DataTable columns={errorColumns} data={data.recentErrors} />
        </div>
      )}
    </div>
  );
}
