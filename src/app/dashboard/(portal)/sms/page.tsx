"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable, { type Column } from "@/components/data-table";

interface SmsMessage {
  id: string;
  direction: string;
  fromNumber: string;
  toNumber: string;
  body: string;
  templateType: string | null;
  status: string;
  createdAt: string;
}

export default function SmsPage() {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
    });
    if (search) params.set("search", search);

    const res = await fetch(`/api/dashboard/sms?${params}`);
    const data = await res.json();
    setMessages(data.messages);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const columns: Column<SmsMessage>[] = [
    {
      key: "createdAt",
      label: "Date",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "direction",
      label: "Direction",
      render: (row) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            row.direction === "inbound"
              ? "bg-blue-500/10 text-blue-400"
              : "bg-green-500/10 text-green-400"
          }`}
        >
          {row.direction === "inbound" ? "IN" : "OUT"}
        </span>
      ),
    },
    {
      key: "fromNumber",
      label: "From",
    },
    {
      key: "toNumber",
      label: "To",
    },
    {
      key: "body",
      label: "Message",
      render: (row) => (
        <span className="block max-w-xs truncate" title={row.body}>
          {row.body}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const colors: Record<string, string> = {
          sent: "bg-blue-500/10 text-blue-400",
          delivered: "bg-green-500/10 text-green-400",
          failed: "bg-red-500/10 text-red-400",
        };
        return (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              colors[row.status] || "bg-slate-700 text-slate-300"
            }`}
          >
            {row.status}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">SMS Log</h1>
        <input
          type="text"
          placeholder="Search by phone number..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 w-64"
        />
      </div>

      {loading && messages.length === 0 && (
        <div className="flex items-center justify-center py-20 text-slate-500">
          Loading...
        </div>
      )}

      {!loading && messages.length === 0 && !search && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center">
          <p className="text-lg font-medium text-slate-300">No messages yet</p>
          <p className="mt-2 text-sm text-slate-500">
            SMS confirmations and reminders will show up here.
          </p>
        </div>
      )}

      {!loading && messages.length === 0 && search && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center">
          <p className="text-sm text-slate-500">
            No messages matching &ldquo;{search}&rdquo;
          </p>
        </div>
      )}

      {messages.length > 0 && (
        <DataTable
          columns={columns}
          data={messages}
          pagination={{
            page,
            totalPages,
            total,
            onPageChange: setPage,
          }}
        />
      )}
    </div>
  );
}
