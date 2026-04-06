"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import Link from "next/link";
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
  const [showCompose, setShowCompose] = useState(false);
  const [composePhone, setComposePhone] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [sending, setSending] = useState(false);

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
      setError(t("toast.failedToLoadSms", lang));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  async function handleSendSms() {
    if (!composePhone.trim() || !composeMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/dashboard/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: composePhone.trim(),
          message: composeMessage.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send");
      }
      toast.success(t("toast.smsSent", lang));
      setShowCompose(false);
      setComposePhone("");
      setComposeMessage("");
      fetchMessages();
    } catch (err) {
      const msg = err instanceof Error && err.message.includes("opted out")
        ? t("sms.optedOut", lang)
        : t("toast.failedToSendSms", lang);
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

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
            <Link href="/dashboard/sms-templates" className="text-sm font-medium" style={{ color: "var(--db-accent)" }}>
              {t("sms.viewTemplates", lang)} &rarr;
            </Link>
            <Button onClick={() => setShowCompose(true)}>
              {t("sms.newMessage", lang)}
            </Button>
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
              className="db-input w-full sm:w-64"
            />
            <ExportCsvButton
              data={messages}
              columns={[
                { header: t("sms.csvDate", lang), accessor: (r) => r.createdAt },
                { header: t("sms.csvDirection", lang), accessor: (r) => r.direction },
                { header: t("sms.csvFrom", lang), accessor: (r) => r.fromNumber },
                { header: t("sms.csvTo", lang), accessor: (r) => r.toNumber },
                { header: t("sms.csvMessage", lang), accessor: (r) => r.body },
                { header: t("sms.csvStatus", lang), accessor: (r) => r.status },
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
          description={t("sms.smsDescription", lang, { name: receptionistName })}
          action={{ label: t("sms.viewSettings", lang), href: "/dashboard/settings#general" }}
        />
      )}

      {!loading && messages.length === 0 && search && (
        <div className="db-card rounded-xl p-12 text-center">
          <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
            {t("sms.noMatchingMessages", lang, { query: search })}
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
                    className="rounded px-1.5 py-0.5 text-xs font-medium"
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

      {/* Compose SMS Modal */}
      {showCompose && (
        <div
          className="db-modal-backdrop"
          onClick={() => setShowCompose(false)}
          onKeyDown={(e) => { if (e.key === "Escape") setShowCompose(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="compose-sms-title"
            className="modal-content w-full max-w-md rounded-xl p-6"
            style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="compose-sms-title" className="text-lg font-semibold mb-4" style={{ color: "var(--db-text)" }}>
              {t("sms.composeSms", lang)}
            </h3>

            <label className="db-label">{t("sms.phoneNumber", lang)}</label>
            <input
              type="tel"
              value={composePhone}
              onChange={(e) => setComposePhone(e.target.value)}
              placeholder={t("sms.phonePlaceholder", lang)}
              className="db-input mb-3"
              autoFocus
            />

            <label className="db-label">{t("sms.message", lang)}</label>
            <textarea
              value={composeMessage}
              onChange={(e) => setComposeMessage(e.target.value.slice(0, 1600))}
              placeholder={t("sms.messagePlaceholder", lang)}
              rows={4}
              className="db-input mb-1"
              style={{ resize: "vertical" }}
            />
            <p className="text-xs mb-4 text-right" style={{ color: "var(--db-text-muted)" }}>
              {t("sms.charCount", lang, { count: composeMessage.length })}
            </p>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowCompose(false)}>
                {t("action.cancel", lang)}
              </Button>
              <Button
                className="flex-1"
                disabled={!composePhone.trim() || !composeMessage.trim() || sending}
                onClick={handleSendSms}
              >
                {sending ? t("sms.sending", lang) : t("sms.send", lang)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
