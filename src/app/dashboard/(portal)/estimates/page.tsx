"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeleton";
import { useReceptionistName } from "@/app/dashboard/_hooks/use-receptionist-name";
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
  expired: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8" },
};

const LOST_REASONS = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "went_with_competitor", label: "Went with competitor" },
  { value: "no_longer_needed", label: "No longer needed" },
  { value: "no_response", label: "No response" },
  { value: "other", label: "Other" },
];

export default function EstimatesPage() {
  const receptionistName = useReceptionistName();
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
      setError("Failed to load estimates. Please try again.");
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
      const label = updates.status === "won" ? "Estimate marked as won" : updates.status === "lost" ? "Estimate marked as lost" : "Estimate updated";
      toast.success(label);
      fetchEstimates();
    } catch {
      toast.error("Failed to update estimate");
    }
  }

  const [confirmFollowUpId, setConfirmFollowUpId] = useState<string | null>(null);

  async function sendFollowUp(id: string) {
    try {
      const res = await fetch(`/api/dashboard/estimates/${id}/follow-up`, { method: "POST" });
      if (!res.ok) throw new Error("Follow-up failed");
      toast.success("Follow-up SMS sent");
      fetchEstimates();
    } catch {
      toast.error("Failed to send follow-up");
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
      toast.success("Estimate converted to invoice");
      fetchEstimates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to convert estimate");
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
    { key: "new", label: "New" },
    { key: "sent", label: "Sent" },
    { key: "follow_up", label: "Follow Up" },
    { key: "won", label: "Won" },
    { key: "lost", label: "Lost" },
  ];

  return (
    <div>
      <PageHeader
        title="Estimates Pipeline"
        actions={
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg px-4 py-2 text-sm outline-none transition-all duration-300 w-full sm:w-52"
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
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: colors.text }}>
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
        <div className="db-card mb-4 flex items-center justify-between p-4" style={{ borderColor: "var(--db-danger)" }}>
          <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
          <Button variant="danger" size="sm" onClick={fetchEstimates}>Retry</Button>
        </div>
      )}

      {loading && estimates.length === 0 && !error ? (
        <TableSkeleton rows={5} />
      ) : estimates.length === 0 ? (
        <div className="db-card py-16 text-center">
          <svg className="mx-auto mb-4" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--db-text-muted)" }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>No estimates yet</p>
          <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: "var(--db-text-muted)" }}>
            Estimates are auto-created when callers request quotes through {receptionistName}.
          </p>
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "customerName",
              label: "Customer",
              render: (row) => (
                <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                  {row.customerName || "Unknown"}
                </span>
              ),
            },
            {
              key: "service",
              label: "Service",
              render: (row) => <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{row.service || "\u2014"}</span>,
            },
            {
              key: "amount",
              label: "Amount",
              render: (row) => <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{formatCurrency(row.amount)}</span>,
            },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusBadge label={row.status} variant={statusToVariant(row.status)} />,
            },
            {
              key: "createdAt",
              label: "Created",
              render: (row) => <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>{formatDate(row.createdAt)}</span>,
            },
            {
              key: "nextFollowUpAt",
              label: "Next Follow-Up",
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
                <p className="text-sm italic" style={{ color: "var(--db-text-muted)" }}>Notes: {est.notes}</p>
              )}
              <div className="flex items-center gap-3 text-xs" style={{ color: "var(--db-text-muted)" }}>
                <span>Follow-ups sent: {est.followUpCount}</span>
                {est.lastFollowUpAt && <span>Last: {formatDate(est.lastFollowUpAt)}</span>}
                {est.customerPhone && <span>Phone: {est.customerPhone}</span>}
              </div>
              <div className="flex gap-2 pt-2">
                {["new", "sent", "follow_up"].includes(est.status) && (
                  <>
                    <Button size="sm" onClick={() => setConfirmFollowUpId(est.id)}>Send Follow-Up</Button>
                    {est.amount && est.amount > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => convertToInvoice(est.id)}
                        disabled={convertingId === est.id}
                        style={{ background: "rgba(197,154,39,0.12)", color: "var(--db-accent)" }}
                      >
                        {convertingId === est.id ? "Converting..." : "Convert to Invoice"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setShowWonModal(est.id); setWonAmount(est.amount?.toString() || ""); }}
                      style={{ background: "var(--db-success-bg)", color: "var(--db-success)" }}
                    >
                      Mark Won
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setShowLostModal(est.id)}>Mark Lost</Button>
                  </>
                )}
                {est.status === "won" && est.wonAt && (
                  <span className="text-xs font-medium" style={{ color: "var(--db-success)" }}>
                    Won on {formatDate(est.wonAt)} — {formatCurrency(est.amount)}
                  </span>
                )}
                {est.status === "lost" && (
                  <span className="text-xs font-medium" style={{ color: "var(--db-danger)" }}>
                    Lost: {est.lostReason?.replace(/_/g, " ") || "no reason"}
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
            <h3 id="follow-up-dialog-title" className="text-lg font-semibold mb-2" style={{ color: "var(--db-text)" }}>Send Follow-Up SMS?</h3>
            <p className="text-sm mb-4" style={{ color: "var(--db-text-muted)" }}>This will send a follow-up text message to the customer.</p>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmFollowUpId(null)}>Cancel</Button>
              <Button className="flex-1" onClick={() => { sendFollowUp(confirmFollowUpId); setConfirmFollowUpId(null); }}>Send SMS</Button>
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
            <h3 id="won-dialog-title" className="text-lg font-semibold mb-4" style={{ color: "var(--db-text)" }}>Mark as Won</h3>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>Final Amount ($)</label>
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
              <Button variant="secondary" className="flex-1" onClick={() => setShowWonModal(null)}>Cancel</Button>
              <Button
                className="flex-1"
                style={{ background: "var(--db-success)", color: "#fff" }}
                onClick={() => {
                  updateEstimate(showWonModal, { status: "won", amount: parseFloat(wonAmount) || 0 });
                  setShowWonModal(null);
                }}
              >
                Confirm Won
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
            <h3 id="lost-dialog-title" className="text-lg font-semibold mb-4" style={{ color: "var(--db-text)" }}>Mark as Lost</h3>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>Reason</label>
            <select
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
              style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
              autoFocus
            >
              {LOST_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowLostModal(null)}>Cancel</Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  updateEstimate(showLostModal, { status: "lost", lostReason });
                  setShowLostModal(null);
                }}
              >
                Confirm Lost
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
