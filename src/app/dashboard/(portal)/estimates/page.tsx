"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeleton";
import { useReceptionistName } from "@/app/dashboard/_hooks/use-receptionist-name";
import ExportCsvButton from "@/app/dashboard/_components/csv-export";

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
  new: { bg: "#dbeafe", text: "#1e40af" },
  sent: { bg: "#e0e7ff", text: "#3730a3" },
  follow_up: { bg: "#fef3c7", text: "#92400e" },
  won: { bg: "#dcfce7", text: "#166534" },
  lost: { bg: "#fee2e2", text: "#991b1b" },
  expired: { bg: "#f3f4f6", text: "#6b7280" },
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

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  const [error, setError] = useState<string | null>(null);

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--db-text)" }}>
          Estimates Pipeline
        </h1>
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

      {/* Pipeline Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-5">
        {pipelineCards.map((card) => {
          const data = pipeline[card.key] || { count: 0, value: 0 };
          const isActive = statusFilter === card.key;
          const colors = STATUS_COLORS[card.key];
          return (
            <button
              key={card.key}
              onClick={() => setStatusFilter(isActive ? null : card.key)}
              aria-label={`Filter by ${card.label}: ${data.count} estimates${data.value > 0 ? `, ${formatCurrency(data.value)} total` : ""}`}
              aria-pressed={isActive}
              className="rounded-xl border p-4 text-left transition-all"
              style={{
                background: isActive ? colors.bg : "var(--db-surface)",
                borderColor: isActive ? colors.text : "var(--db-border)",
              }}
            >
              <p className="text-xs font-medium uppercase" style={{ color: colors.text }}>
                {card.label}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: "var(--db-text)" }}>
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
        <div className="rounded-xl p-4 mb-4 flex items-center justify-between" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          <button
            onClick={fetchEstimates}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {loading && estimates.length === 0 && !error ? (
        <TableSkeleton rows={5} />
      ) : (
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--db-border)", background: "var(--db-surface)" }}
      >
        {estimates.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="mx-auto mb-4" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--db-text-muted)" }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>
              No estimates yet
            </p>
            <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: "var(--db-text-muted)" }}>
              Estimates are auto-created when callers request quotes through {receptionistName}.
            </p>
            <a
              href="/dashboard/help/estimates"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: "var(--db-accent)", color: "#fff" }}
            >
              Learn How Estimates Work
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--db-border)" }}>
                {["Customer", "Service", "Amount", "Status", "Created", "Next Follow-Up"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {estimates.map((est) => {
                const colors = STATUS_COLORS[est.status] || STATUS_COLORS.new;
                const isExpanded = expandedId === est.id;
                return (
                  <tr key={est.id}>
                    <td colSpan={6} className="p-0">
                      {/* Row */}
                      <div
                        className="grid cursor-pointer transition-colors px-4 py-3"
                        style={{ gridTemplateColumns: "1fr 1fr 0.7fr 0.7fr 0.7fr 0.8fr", borderBottom: "1px solid var(--db-border)" }}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Collapse" : "Expand"} estimate for ${est.customerName || "Unknown"}`}
                        onClick={() => setExpandedId(isExpanded ? null : est.id)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedId(isExpanded ? null : est.id); } }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--db-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                          {est.customerName || "Unknown"}
                        </span>
                        <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
                          {est.service || "—"}
                        </span>
                        <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                          {formatCurrency(est.amount)}
                        </span>
                        <span>
                          <span
                            className="rounded px-2 py-0.5 text-[10px] font-medium"
                            style={{ background: colors.bg, color: colors.text }}
                          >
                            {est.status.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </span>
                        <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>
                          {formatDate(est.createdAt)}
                        </span>
                        <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>
                          {formatDate(est.nextFollowUpAt)}
                        </span>
                      </div>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div
                          className="px-6 py-4 space-y-3"
                          style={{ background: "var(--db-hover)", borderBottom: "1px solid var(--db-border)" }}
                        >
                          {est.description && (
                            <p className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
                              {est.description}
                            </p>
                          )}
                          {est.notes && (
                            <p className="text-sm italic" style={{ color: "var(--db-text-muted)" }}>
                              Notes: {est.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--db-text-muted)" }}>
                            <span>Follow-ups sent: {est.followUpCount}</span>
                            {est.lastFollowUpAt && <span>Last: {formatDate(est.lastFollowUpAt)}</span>}
                            {est.customerPhone && <span>Phone: {est.customerPhone}</span>}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            {["new", "sent", "follow_up"].includes(est.status) && (
                              <>
                                <button
                                  onClick={() => sendFollowUp(est.id)}
                                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                                  style={{ background: "var(--db-accent)" }}
                                >
                                  Send Follow-Up
                                </button>
                                <button
                                  onClick={() => { setShowWonModal(est.id); setWonAmount(est.amount?.toString() || ""); }}
                                  className="rounded-lg px-3 py-1.5 text-xs font-medium"
                                  style={{ background: "#dcfce7", color: "#166534" }}
                                >
                                  Mark Won
                                </button>
                                <button
                                  onClick={() => setShowLostModal(est.id)}
                                  className="rounded-lg px-3 py-1.5 text-xs font-medium"
                                  style={{ background: "#fee2e2", color: "#991b1b" }}
                                >
                                  Mark Lost
                                </button>
                              </>
                            )}
                            {est.status === "won" && est.wonAt && (
                              <span className="text-xs font-medium" style={{ color: "#166534" }}>
                                Won on {formatDate(est.wonAt)} — {formatCurrency(est.amount)}
                              </span>
                            )}
                            {est.status === "lost" && (
                              <span className="text-xs font-medium" style={{ color: "#991b1b" }}>
                                Lost: {est.lostReason?.replace(/_/g, " ") || "no reason"}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      )}

      {/* Won Modal */}
      {showWonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl p-6" style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "var(--db-text)" }}>Mark as Won</h3>
            <label className="block text-sm mb-1" style={{ color: "var(--db-text-muted)" }}>Final Amount ($)</label>
            <input
              type="number"
              value={wonAmount}
              onChange={(e) => setWonAmount(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
              style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowWonModal(null)} className="flex-1 rounded-lg px-4 py-2 text-sm" style={{ background: "var(--db-hover)", color: "var(--db-text)" }}>
                Cancel
              </button>
              <button
                onClick={() => {
                  updateEstimate(showWonModal, { status: "won", amount: parseFloat(wonAmount) || 0 });
                  setShowWonModal(null);
                }}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ background: "#16a34a" }}
              >
                Confirm Won
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lost Modal */}
      {showLostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl p-6" style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "var(--db-text)" }}>Mark as Lost</h3>
            <label className="block text-sm mb-1" style={{ color: "var(--db-text-muted)" }}>Reason</label>
            <select
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
              style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
            >
              {LOST_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowLostModal(null)} className="flex-1 rounded-lg px-4 py-2 text-sm" style={{ background: "var(--db-hover)", color: "var(--db-text)" }}>
                Cancel
              </button>
              <button
                onClick={() => {
                  updateEstimate(showLostModal, { status: "lost", lostReason });
                  setShowLostModal(null);
                }}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ background: "#dc2626" }}
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
