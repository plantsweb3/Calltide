"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import DataTable, { type Column } from "@/components/data-table";
import { TableSkeleton } from "@/components/skeleton";
import { useReceptionistName } from "@/app/dashboard/_hooks/use-receptionist-name";
import Button from "@/components/ui/button";
import StatusBadge from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import ExportCsvButton from "@/app/dashboard/_components/csv-export";
import { formatPhone } from "@/lib/format";

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
  const receptionistName = useReceptionistName();
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/dashboard/sms?${params}`);
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      setMessages(data.messages);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError("Failed to load SMS messages. Please try again.");
    } finally {
      setLoading(false);
    }
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
      render: (row) => {
        const isIn = row.direction === "inbound";
        return (
          <StatusBadge label={isIn ? "IN" : "OUT"} variant={isIn ? "info" : "success"} />
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
        const smsVariant: Record<string, "info" | "success" | "danger" | "neutral"> = {
          sent: "info",
          delivered: "success",
          failed: "danger",
        };
        return (
          <StatusBadge label={row.status} variant={smsVariant[row.status] ?? "neutral"} />
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="SMS Log"
        actions={
          <>
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
            <ExportCsvButton
              data={messages}
              columns={[
                { header: "Date", accessor: (r) => r.createdAt },
                { header: "Direction", accessor: (r) => r.direction },
                { header: "From", accessor: (r) => r.fromNumber },
                { header: "To", accessor: (r) => r.toNumber },
                { header: "Message", accessor: (r) => r.body },
                { header: "Status", accessor: (r) => r.status },
              ]}
              filename="sms"
            />
          </>
        }
      />

      {error && (
        <div className="rounded-xl p-4 mb-4 flex items-center justify-between" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          <Button variant="danger" size="sm" onClick={fetchMessages}>
            Retry
          </Button>
        </div>
      )}

      {loading && messages.length === 0 && !error && (
        <TableSkeleton rows={6} />
      )}

      {!loading && messages.length === 0 && !search && (
        <EmptyState
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
          title="No messages yet"
          description={`SMS confirmations and reminders will show up here as ${receptionistName} handles calls.`}
          action={{ label: "View SMS Settings", href: "/dashboard/settings#notifications" }}
        />
      )}

      {!loading && messages.length === 0 && search && (
        <div className="db-card rounded-xl p-12 text-center">
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
          expandedContent={(row) => (
            <div className="space-y-2">
              <p
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--db-text-muted)" }}
              >
                Full Message
              </p>
              <p
                className="whitespace-pre-wrap text-sm"
                style={{ color: "var(--db-text-secondary)" }}
              >
                {row.body}
              </p>
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                  From: {formatPhone(row.fromNumber)}
                </span>
                <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                  To: {formatPhone(row.toNumber)}
                </span>
                {row.templateType && (
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
                  >
                    {row.templateType}
                  </span>
                )}
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}
