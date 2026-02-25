"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable, { type Column } from "@/components/data-table";

interface Call {
  id: string;
  direction: string;
  callerPhone: string | null;
  calledPhone: string | null;
  status: string;
  duration: number | null;
  language: string | null;
  summary: string | null;
  sentiment: string | null;
  createdAt: string;
  leadName: string | null;
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
    });
    if (search) params.set("search", search);

    const res = await fetch(`/api/dashboard/calls?${params}`);
    const data = await res.json();
    setCalls(data.calls);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

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

  const columns: Column<Call>[] = [
    {
      key: "createdAt",
      label: "Date",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "caller",
      label: "Caller",
      render: (row) => row.leadName || row.callerPhone || "-",
    },
    {
      key: "duration",
      label: "Duration",
      render: (row) => formatDuration(row.duration),
    },
    {
      key: "language",
      label: "Language",
      render: (row) => (row.language || "-").toUpperCase(),
    },
    {
      key: "status",
      label: "Outcome",
      render: (row) => {
        const colors: Record<string, string> = {
          completed: "bg-green-500/10 text-green-400",
          missed: "bg-amber-500/10 text-amber-400",
          failed: "bg-red-500/10 text-red-400",
          in_progress: "bg-blue-500/10 text-blue-400",
        };
        return (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              colors[row.status] || "bg-slate-700 text-slate-300"
            }`}
          >
            {row.status.replace("_", " ")}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Calls</h1>
        <input
          type="text"
          placeholder="Search by phone or name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 w-64"
        />
      </div>

      {loading && calls.length === 0 && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          Loading...
        </div>
      )}

      {!loading && calls.length === 0 && !search && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center">
          <p className="text-lg font-medium text-slate-300">No calls yet</p>
          <p className="mt-2 text-sm text-slate-500">
            When your AI receptionist handles calls, they&apos;ll show up here
            with full transcripts and summaries.
          </p>
        </div>
      )}

      {!loading && calls.length === 0 && search && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center">
          <p className="text-sm text-slate-500">
            No calls matching &ldquo;{search}&rdquo;
          </p>
        </div>
      )}

      {calls.length > 0 && (
        <DataTable
          columns={columns}
          data={calls}
          pagination={{
            page,
            totalPages,
            total,
            onPageChange: setPage,
          }}
          expandedContent={(row) =>
            row.summary ? (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Summary
                </p>
                <p className="whitespace-pre-wrap text-sm text-slate-300">
                  {row.summary}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No summary available</p>
            )
          }
        />
      )}
    </div>
  );
}
