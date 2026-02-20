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

  const fetchMessages = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
    });

    const res = await fetch(`/api/dashboard/sms?${params}`);
    const data = await res.json();
    setMessages(data.messages);
    setTotal(data.total);
    setTotalPages(data.totalPages);
  }, [page]);

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
      <h1 className="mb-6 text-2xl font-semibold">SMS Log</h1>

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
    </div>
  );
}
