"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import DataTable, { type Column } from "@/components/data-table";
import LoadingSpinner from "@/app/dashboard/_components/loading-spinner";

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
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  function formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 11 && digits[0] === "1") {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
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
      render: (row) => {
        const isIn = row.direction === "inbound";
        return (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              background: isIn ? "rgba(96,165,250,0.1)" : "rgba(74,222,128,0.1)",
              color: isIn ? "#60a5fa" : "#4ade80",
            }}
          >
            {isIn ? "IN" : "OUT"}
          </span>
        );
      },
    },
    {
      key: "fromNumber",
      label: "From",
      render: (row) => formatPhone(row.fromNumber),
    },
    {
      key: "toNumber",
      label: "To",
      render: (row) => formatPhone(row.toNumber),
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
        const colors: Record<string, { bg: string; text: string }> = {
          sent: { bg: "rgba(96,165,250,0.1)", text: "#60a5fa" },
          delivered: { bg: "rgba(74,222,128,0.1)", text: "#4ade80" },
          failed: { bg: "rgba(248,113,113,0.1)", text: "#f87171" },
        };
        const c = colors[row.status] || { bg: "var(--db-hover)", text: "var(--db-text-secondary)" };
        return (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: c.bg, color: c.text }}
          >
            {row.status}
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
          SMS Log
        </h1>
        <input
          type="text"
          placeholder="Search by phone number..."
          defaultValue={search}
          onChange={(e) => {
            const val = e.target.value;
            clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => {
              setSearch(val);
              setPage(1);
            }, 300);
          }}
          className="rounded-lg px-4 py-2 text-sm outline-none transition-all duration-300 w-full sm:w-64"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
            color: "var(--db-text)",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
        />
      </div>

      {loading && messages.length === 0 && (
        <LoadingSpinner message="Loading messages..." />
      )}

      {!loading && messages.length === 0 && !search && (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
            boxShadow: "var(--db-card-shadow)",
          }}
        >
          <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>
            No messages yet
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--db-text-muted)" }}>
            SMS confirmations and reminders will show up here.
          </p>
        </div>
      )}

      {!loading && messages.length === 0 && search && (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
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
