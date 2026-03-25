"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import DataTable, { type Column } from "@/components/data-table";
import { TableSkeleton } from "@/components/skeleton";
import { useReceptionistName } from "@/app/dashboard/_hooks/use-receptionist-name";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";
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
  const [lang] = useLang();
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
      label: t("billing.date", lang),
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "direction",
      label: t("calls.direction", lang),
      render: (row) => {
        const isIn = row.direction === "inbound";
        return (
          <StatusBadge label={isIn ? t("sms.in", lang) : t("sms.out", lang)} variant={isIn ? "info" : "success"} />
        );
      },
    },
    {
      key: "fromNumber",
      label: t("sms.from", lang),
      render: (row) => formatPhone(row.fromNumber),
    },
    {
      key: "toNumber",
      label: t("sms.to", lang),
      render: (row) => formatPhone(row.toNumber),
    },
    {
      key: "body",
      label: t("sms.fullMessage", lang),
      render: (row) => (
        <span className="block max-w-xs truncate" title={row.body}>
          {row.body}
        </span>
      ),
    },
    {
      key: "status",
      label: t("billing.status", lang),
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
        title={t("sms.title", lang)}
        actions={
          <>
            <input
              type="text"
              placeholder={t("sms.search", lang)}
              defaultValue={search}
              onChange={(e) => {
                const val = e.target.value;
                clearTimeout(searchTimer.current);
                searchTimer.current = setTimeout(() => {
                  setSearch(val);
                  setPage(1);
                }, 300);
              }}
              className="rounded-lg px-4 py-2 text-sm outline-none transition-all duration-200 w-full sm:w-64"
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
        <div role="alert" aria-live="assertive" className="rounded-xl p-4 mb-4 flex items-center justify-between" style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)" }}>
          <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
          <Button variant="danger" size="sm" onClick={fetchMessages}>
            {t("action.retry", lang)}
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
          title={t("sms.noMessages", lang)}
          description={`SMS confirmations and reminders will show up here as ${receptionistName} handles calls.`}
          action={{ label: t("sms.viewSettings", lang), href: "/dashboard/settings#notifications" }}
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
                {t("sms.fullMessage", lang)}
              </p>
              <p
                className="whitespace-pre-wrap text-sm"
                style={{ color: "var(--db-text-secondary)" }}
              >
                {row.body}
              </p>
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                  {t("sms.from", lang)}: {formatPhone(row.fromNumber)}
                </span>
                <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                  {t("sms.to", lang)}: {formatPhone(row.toNumber)}
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
