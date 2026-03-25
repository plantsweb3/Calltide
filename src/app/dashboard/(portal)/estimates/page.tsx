"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeleton";
import { useReceptionistName } from "@/app/dashboard/_hooks/use-receptionist-name";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";
import ExportCsvButton from "@/app/dashboard/_components/csv-export";
import StatusBadge, { statusToVariant } from "@/components/ui/status-badge";
import Button from "@/components/ui/button";
import DataTable, { type Column } from "@/components/data-table";
import PageHeader from "@/components/page-header";

interface Estimate {
  id: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  callId: string | null;
  service: string | null;
  description: string | null;
  status: string;
  amount: number | null;
  followUpCount: number;
  lastFollowUpAt: string | null;
  nextFollowUpAt: string | null;
  wonAt: string | null;
  lostAt: string | null;
  lostReason: string | null;
  notes: string | null;
  createdAt: string;
}

interface Pipeline {
  [status: string]: { count: number; value: number };
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
  sent: { bg: "rgba(99,102,241,0.15)", text: "#818cf8" },
  follow_up: { bg: "rgba(245,158,11,0.15)", text: "var(--db-warning)" },
  won: { bg: "var(--db-success-bg)", text: "var(--db-success)" },
  lost: { bg: "var(--db-danger-bg)", text: "var(--db-danger)" },
  expired: { bg: "rgba(148,163,184,0.15)", text: "var(--db-text-muted)" },
};

const LOST_REASONS = [
  { value: "too_expensive", i18nKey: "estimates.lostReasons.tooExpensive" as const, label: null },
  { value: "went_with_competitor", i18nKey: "estimates.lostReasons.competitor" as const, label: null },
  { value: "no_longer_needed", i18nKey: "estimates.lostReasons.noLongerNeeded" as const, label: null },
  { value: "no_response", i18nKey: "estimates.lostReasons.noResponse" as const, label: null },
  { value: "other", i18nKey: "estimates.lostReasons.other" as const, label: null },
];

export default function EstimatesPage() {
  const receptionistName = useReceptionistName();
  const [lang] = useLang();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showWonModal, setShowWonModal] = useState<string | null>(null);
  const [showLostModal, setShowLostModal] = useState<string | null>(null);
  const [wonAmount, setWonAmount] = useState("");
  const [lostReason, setLostReason] = useState("no_response");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const fetchEstimates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/dashboard/estimates?${params}`);
      if (!res.ok) throw new Error("Failed to load estimates");
      const data = await res.json();
      setEstimates(data.estimates || []);
      setPipeline(data.pipeline || {});
    } catch {
      setError(t("toast.failedToLoadEstimates", lang));
      setEstimates([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchEstimates(); }, [fetchEstimates]);

  async function updateEstimate(id: string, updates: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/dashboard/estimates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Update failed");
      const label = updates.status === "won" ? t("toast.estimateMarkedWon", lang) : updates.status === "lost" ? t("toast.estimateMarkedLost", lang) : t("toast.estimateUpdated", lang);
      toast.success(label);
      fetchEstimates();
    } catch {
      toast.error(t("toast.failedToUpdateEstimate", lang));
    }
  }

  const [confirmFollowUpId, setConfirmFollowUpId] = useState<string | null>(null);

  async function sendFollowUp(id: string) {
    try {
      const res = await fetch(`/api/dashboard/estimates/${id}/follow-up`, { method: "POST" });
      if (!res.ok) throw new Error("Follow-up failed");
      toast.success(t("toast.followUpSmsSent", lang));
      fetchEstimates();
    } catch {
      toast.error(t("toast.failedToSendFollowUp", lang));
    }
  }

  async function convertToInvoice(id: string) {
    setConvertingId(id);
    try {
      const res = await fetch(`/api/dashboard/estimates/${id}/convert`, { method: "POST" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Conversion failed");
      }
      await res.json();
      toast.success(t("toast.estimateConvertedToInvoice", lang));
      fetchEstimates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.failedToConvertEstimate", lang));
    } finally {
      setConvertingId(null);
    }
  }

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function formatCurrency(n: number | null) {
    if (n == null) return "—";
    return `$${n.toLocaleString()}`;
  }

  const pipelineCards = [
    { key: "new", label: t("estimates.new", lang) },
    { key: "sent", label: t("estimates.sent", lang) },
    { key: "follow_up", label: t("estimates.followUp", lang) },
    { key: "won", label: t("estimates.won", lang) },
    { key: "lost", label: t("estimates.lost", lang) },
  ];

  return (
    <div>
      <PageHeader
        title={t("estimates.title", lang)}
        actions={
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t("estimates.searchPlaceholder", lang)}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg px-4 py-2 text-sm outline-none transition-all duration-200 w-full sm:w-52"
              style={{
                background: "var(--db-card)",
                border: "1px solid var(--db-border)",
                color: "var(--db-text)",
              }}
            />
            <ExportCsvButton
              data={estimates}
              columns={[
                { header: "Customer", accessor: (r) => r.customerName || r.customerPhone },
                { header: "Service", accessor: (r) => r.service },
                { header: "Amount", accessor: (r) => r.amount },
                { header: "Status", accessor: (r) => r.status },
                { header: "Created", accessor: (r) => r.createdAt },
                { header: "Notes", accessor: (r) => r.notes },
              ]}
              filename="estimates"
            />
          </div>
        }
      />

      {/* Pipeline Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-5 stagger-grid">
        {pipelineCards.map((card) => {
          const data = pipeline[card.key] || { count: 0, value: 0 };
          const isActive = statusFilter === card.key;
          const colors = STATUS_COLORS[card.key];
          return (
            <button
              key={card.key}
              onClick={() => setStatusFilter(isActive ? null : card.key)}
              aria-pressed={isActive}
              className="db-card p-4 text-left transition-all"
              style={{
                ...(isActive && { borderColor: colors.text, background: colors.bg }),
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text }}>
                {card.label}
              </p>
              <p className="text-2xl font-bold mt-1 tracking-tight" style={{ color: "var(--db-text)" }}>
                {data.count}
              </p>
              {data.value > 0 && (
                <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
                  {formatCurrency(data.value)}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div role="alert" aria-live="assertive" className="db-card mb-4 flex items-center justify-between p-4" style={{ borderColor: "var(--db-danger)" }}>
          <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
          <Button variant="danger" size="sm" onClick={fetchEstimates}>{t("action.retry", lang)}</Button>
        </div>
      )}

      {loading && estimates.length === 0 && !error ? (
        <TableSkeleton rows={5} />
      ) : estimates.length === 0 ? (
        <div className="db-card py-16 text-center">
          <svg className="mx-auto mb-4" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--db-text-muted)" }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>{t("empty.noEstimates", lang, { name: receptionistName })}</p>
          <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: "var(--db-text-muted)" }}>
            {t("estimates.autoCreated", lang, { name: receptionistName })}
          </p>
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "customerName",
              label: t("estimates.customer", lang),
              render: (row) => (
                <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                  {row.customerName || t("dispatch.unknown", lang)}
                </span>
              ),
            },
            {
              key: "service",
              label: t("estimates.service", lang),
              render: (row) => <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{row.service || "\u2014"}</span>,
            },
            {
              key: "amount",
              label: t("estimates.amount", lang),
              render: (row) => <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{formatCurrency(row.amount)}</span>,
            },
            {
              key: "status",
              label: t("estimates.status", lang),
              render: (row) => <StatusBadge label={row.status} variant={statusToVariant(row.status)} />,
            },
            {
              key: "createdAt",
              label: t("estimates.created", lang),
              render: (row) => <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>{formatDate(row.createdAt)}</span>,
            },
            {
              key: "nextFollowUpAt",
              label: t("estimates.nextFollowUp", lang),
              render: (row) => <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>{formatDate(row.nextFollowUpAt)}</span>,
            },
          ] as Column<Estimate>[]}
          data={estimates.filter((e) =>
            !search || (e.customerName || "").toLowerCase().includes(search.toLowerCase())
          )}
          expandedContent={(est) => (
            <div className="space-y-3">
              {est.description && (
                <p className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{est.description}</p>
              )}
              {est.notes && (
                <p className="text-sm italic" style={{ color: "var(--db-text-muted)" }}>{t("estimates.notes", lang)}: {est.notes}</p>
              )}
              <div className="flex items-center gap-3 text-xs" style={{ color: "var(--db-text-muted)" }}>
                <span>{t("estimates.followUpsSent", lang)}: {est.followUpCount}</span>
                {est.lastFollowUpAt && <span>{t("estimates.last", lang)}: {formatDate(est.lastFollowUpAt)}</span>}
                {est.customerPhone && <span>{t("misc.phone", lang)}: {est.customerPhone}</span>}
              </div>
              <div className="flex gap-2 pt-2">
                {["new", "sent", "follow_up"].includes(est.status) && (
                  <>
                    <Button size="sm" onClick={() => setConfirmFollowUpId(est.id)}>{t("estimates.sendFollowUp", lang)}</Button>
                    {est.amount && est.amount > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => convertToInvoice(est.id)}
                        disabled={convertingId === est.id}
                        style={{ background: "var(--db-accent-bg)", color: "var(--db-accent)" }}
                      >
                        {convertingId === est.id ? t("estimates.converting", lang) : t("estimates.convertToInvoice", lang)}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setShowWonModal(est.id); setWonAmount(est.amount?.toString() || ""); }}
                      style={{ background: "var(--db-success-bg)", color: "var(--db-success)" }}
                    >
                      {t("estimates.markWon", lang)}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setShowLostModal(est.id)}>{t("estimates.markLost", lang)}</Button>
                  </>
                )}
                {est.status === "won" && est.wonAt && (
                  <span className="text-xs font-medium" style={{ color: "var(--db-success)" }}>
                    {t("estimates.wonOn", lang, { date: formatDate(est.wonAt) })} — {formatCurrency(est.amount)}
                  </span>
                )}
                {est.status === "lost" && (
                  <span className="text-xs font-medium" style={{ color: "var(--db-danger)" }}>
                    {t("estimates.lost", lang)}: {est.lostReason?.replace(/_/g, " ") || t("estimates.lostNoReason", lang)}
                  </span>
                )}
              </div>
            </div>
          )}
        />
      )}

      {/* Follow-Up Confirmation */}
      {confirmFollowUpId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setConfirmFollowUpId(null)}
          onKeyDown={(e) => { if (e.key === "Escape") setConfirmFollowUpId(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="follow-up-dialog-title"
            className="modal-content w-full max-w-sm rounded-xl p-6"
            style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="follow-up-dialog-title" className="text-lg font-semibold mb-2" style={{ color: "var(--db-text)" }}>{t("estimates.sendFollowUpSms", lang)}</h3>
            <p className="text-sm mb-4" style={{ color: "var(--db-text-muted)" }}>{t("estimates.sendFollowUpDesc", lang)}</p>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmFollowUpId(null)}>{t("action.cancel", lang)}</Button>
              <Button className="flex-1" onClick={() => { sendFollowUp(confirmFollowUpId); setConfirmFollowUpId(null); }}>{t("estimates.sendSms", lang)}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Won Modal */}
      {showWonModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowWonModal(null)}
          onKeyDown={(e) => { if (e.key === "Escape") setShowWonModal(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="won-dialog-title"
            className="modal-content w-full max-w-sm rounded-xl p-6"
            style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="won-dialog-title" className="text-lg font-semibold mb-4" style={{ color: "var(--db-text)" }}>{t("estimates.markAsWon", lang)}</h3>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>{t("estimates.finalAmount", lang)}</label>
            <input
              type="number"
              min="0"
              value={wonAmount}
              onChange={(e) => setWonAmount(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
              style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowWonModal(null)}>{t("action.cancel", lang)}</Button>
              <Button
                className="flex-1"
                style={{ background: "var(--db-success)", color: "#fff" }}
                onClick={() => {
                  updateEstimate(showWonModal, { status: "won", amount: parseFloat(wonAmount) || 0 });
                  setShowWonModal(null);
                }}
              >
                {t("estimates.confirmWon", lang)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lost Modal */}
      {showLostModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowLostModal(null)}
          onKeyDown={(e) => { if (e.key === "Escape") setShowLostModal(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lost-dialog-title"
            className="modal-content w-full max-w-sm rounded-xl p-6"
            style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="lost-dialog-title" className="text-lg font-semibold mb-4" style={{ color: "var(--db-text)" }}>{t("estimates.markAsLost", lang)}</h3>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>{t("estimates.reason", lang)}</label>
            <select
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
              style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
              autoFocus
            >
              {LOST_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{t(r.i18nKey, lang)}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowLostModal(null)}>{t("action.cancel", lang)}</Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  updateEstimate(showLostModal, { status: "lost", lostReason });
                  setShowLostModal(null);
                }}
              >
                {t("estimates.confirmLost", lang)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
