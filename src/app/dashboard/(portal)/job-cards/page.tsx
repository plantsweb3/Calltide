"use client";

import { useEffect, useState, useCallback } from "react";
import { TableSkeleton } from "@/components/skeleton";

interface OwnerResponse {
  id: string;
  direction: string;
  messageType: string;
  messageText: string | null;
  rawReply: string | null;
  parsedAction: string | null;
  parsedAmount: number | null;
  createdAt: string;
}

interface CustomerNotification {
  id: string;
  notificationType: string;
  recipientPhone: string;
  messageText: string;
  sentAt: string;
}

interface JobCard {
  id: string;
  callId: string | null;
  callerName: string | null;
  callerPhone: string | null;
  callerEmail: string | null;
  jobTypeKey: string | null;
  jobTypeLabel: string | null;
  scopeLevel: string | null;
  scopeDescription: string | null;
  estimateMode: string | null;
  estimateMin: number | null;
  estimateMax: number | null;
  estimateUnit: string | null;
  estimateConfidence: string | null;
  estimateCalculationJson: Record<string, unknown> | null;
  status: string | null;
  ownerResponse: string | null;
  ownerAdjustedMin: number | null;
  ownerAdjustedMax: number | null;
  ownerRespondedAt: string | null;
  customerNotifiedAt: string | null;
  reminderSentAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  responses: OwnerResponse[];
  notifications: CustomerNotification[];
}

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  adjusted: number;
  expired: number;
  siteVisit: number;
  awaitingAdjustment: number;
  responseRate: number;
  avgResponseTimeMinutes: number | null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending_review: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24", label: "Pending" },
  confirmed: { bg: "rgba(34,197,94,0.15)", text: "#4ade80", label: "Confirmed" },
  adjusted: { bg: "rgba(99,102,241,0.15)", text: "#818cf8", label: "Adjusted" },
  awaiting_adjustment: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24", label: "Awaiting Adj." },
  site_visit_requested: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa", label: "Site Visit" },
  expired: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8", label: "Expired" },
};

const CONFIDENCE_COLORS: Record<string, { bg: string; text: string }> = {
  ballpark: { bg: "rgba(245,158,11,0.15)", text: "#fbbf24" },
  estimated: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
  no_match: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8" },
};

export default function JobCardsPage() {
  const [cards, setCards] = useState<JobCard[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/dashboard/job-cards?${params}`);
      if (!res.ok) throw new Error("Failed to load job cards");
      const data = await res.json();
      setCards(data.cards || []);
      setTotalPages(data.totalPages || 0);
    } catch {
      setError("Failed to load job cards. Please try again.");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/job-cards/stats");
      if (!res.ok) return;
      setStats(await res.json());
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    fetchCards();
    fetchStats();
  }, [fetchCards, fetchStats]);

  function formatDate(d: string | null) {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function formatCurrency(n: number | null) {
    if (n == null) return "\u2014";
    return n >= 1000 ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : `$${n.toFixed(0)}`;
  }

  const statCards = [
    { key: null, label: "All", count: stats?.total || 0 },
    { key: "pending_review", label: "Pending", count: stats?.pending || 0 },
    { key: "confirmed", label: "Confirmed", count: stats?.confirmed || 0 },
    { key: "adjusted", label: "Adjusted", count: stats?.adjusted || 0 },
    { key: "site_visit_requested", label: "Site Visit", count: stats?.siteVisit || 0 },
    { key: "expired", label: "Expired", count: stats?.expired || 0 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)", fontFamily: "var(--font-body), system-ui, sans-serif" }}>
          Job Cards
        </h1>
        {stats != null && (
          <div className="flex items-center gap-4 text-sm" style={{ color: "var(--db-text-muted)" }}>
            <span>Response rate: <strong style={{ color: "var(--db-text)" }}>{stats.responseRate}%</strong></span>
            {stats.avgResponseTimeMinutes != null && (
              <span>Avg response: <strong style={{ color: "var(--db-text)" }}>{stats.avgResponseTimeMinutes}min</strong></span>
            )}
          </div>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statCards.map((sc) => {
          const isActive = statusFilter === sc.key;
          return (
            <button
              key={sc.key || "all"}
              onClick={() => { setStatusFilter(sc.key); setPage(1); }}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                background: isActive ? "var(--db-accent)" : "var(--db-surface)",
                color: isActive ? "#fff" : "var(--db-text-muted)",
                border: `1px solid ${isActive ? "var(--db-accent)" : "var(--db-border)"}`,
              }}
            >
              {sc.label} ({sc.count})
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 mb-4 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
          {error}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : cards.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--db-text-muted)" }}>
          <p className="text-lg mb-2">No job cards yet</p>
          <p className="text-sm">Job cards are created automatically when Maria completes an intake during a call.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => {
            const expanded = expandedId === card.id;
            const sc = STATUS_COLORS[card.status || "pending_review"] || STATUS_COLORS.pending_review;
            const cc = CONFIDENCE_COLORS[card.estimateConfidence || "no_match"] || CONFIDENCE_COLORS.no_match;

            return (
              <div
                key={card.id}
                className="rounded-xl overflow-hidden transition-shadow"
                style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
              >
                {/* Card header */}
                <button
                  className="w-full text-left p-4 flex items-center gap-4"
                  onClick={() => setExpandedId(expanded ? null : card.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate" style={{ color: "var(--db-text)" }}>
                        {card.callerName || "Unknown caller"}
                      </span>
                      {card.callerPhone && (
                        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                          ({card.callerPhone})
                        </span>
                      )}
                    </div>
                    <div className="text-sm truncate" style={{ color: "var(--db-text-muted)" }}>
                      {card.scopeDescription || card.jobTypeLabel || "Service requested"}
                    </div>
                  </div>

                  {/* Estimate range */}
                  <div className="text-right shrink-0">
                    {card.estimateMin != null && card.estimateMax != null ? (
                      <div className="font-semibold" style={{ color: "var(--db-text)" }}>
                        {formatCurrency(card.ownerAdjustedMin || card.estimateMin)}&ndash;{formatCurrency(card.ownerAdjustedMax || card.estimateMax)}
                      </div>
                    ) : (
                      <div className="text-sm" style={{ color: "var(--db-text-muted)" }}>No estimate</div>
                    )}
                    <div className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
                      {formatDate(card.createdAt)}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex gap-2 shrink-0">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {sc.label}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: cc.bg, color: cc.text }}
                    >
                      {card.estimateConfidence || "no match"}
                    </span>
                  </div>

                  {/* Chevron */}
                  <svg
                    width={16} height={16} viewBox="0 0 24 24" fill="none"
                    stroke="var(--db-text-muted)" strokeWidth={2}
                    style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div className="px-4 pb-4 space-y-4" style={{ borderTop: "1px solid var(--db-border)" }}>
                    {/* Job details */}
                    <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
                      <Detail label="Job Type" value={card.jobTypeLabel} />
                      <Detail label="Scope" value={card.scopeLevel} />
                      <Detail label="Estimate Mode" value={card.estimateMode} />
                      <Detail label="Unit" value={card.estimateUnit} />
                    </div>

                    {card.scopeDescription && (
                      <div>
                        <div className="text-xs mb-1" style={{ color: "var(--db-text-muted)" }}>Description</div>
                        <div className="text-sm" style={{ color: "var(--db-text)" }}>{card.scopeDescription}</div>
                      </div>
                    )}

                    {/* Calculation breakdown */}
                    {card.estimateMode === "advanced" && card.estimateCalculationJson && (
                      <div>
                        <div className="text-xs mb-1" style={{ color: "var(--db-text-muted)" }}>Calculation Breakdown</div>
                        <div className="p-3 rounded-lg text-sm font-mono" style={{ background: "var(--db-surface)" }}>
                          {formatCalculation(card.estimateCalculationJson)}
                        </div>
                      </div>
                    )}

                    {/* Owner response */}
                    {card.ownerRespondedAt && (
                      <div className="p-3 rounded-lg" style={{ background: "rgba(34,197,94,0.08)" }}>
                        <div className="text-xs mb-1" style={{ color: "#4ade80" }}>Owner Response</div>
                        <div className="text-sm" style={{ color: "var(--db-text)" }}>
                          {card.ownerResponse === "confirmed" && "Estimate confirmed"}
                          {card.ownerResponse === "adjusted" && `Adjusted to ${formatCurrency(card.ownerAdjustedMin)}\u2013${formatCurrency(card.ownerAdjustedMax)}`}
                          {card.ownerResponse === "site_visit" && "Site visit requested"}
                          <span className="ml-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
                            {formatDate(card.ownerRespondedAt)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Customer notification */}
                    {card.customerNotifiedAt && (
                      <div className="p-3 rounded-lg" style={{ background: "rgba(59,130,246,0.08)" }}>
                        <div className="text-xs mb-1" style={{ color: "#60a5fa" }}>Customer Notified</div>
                        <div className="text-sm" style={{ color: "var(--db-text)" }}>
                          {formatDate(card.customerNotifiedAt)}
                        </div>
                      </div>
                    )}

                    {/* Response timeline */}
                    {card.responses.length > 0 && (
                      <div>
                        <div className="text-xs mb-2" style={{ color: "var(--db-text-muted)" }}>Response Timeline</div>
                        <div className="space-y-2">
                          {card.responses.map((r) => (
                            <div key={r.id} className="flex items-start gap-2 text-xs">
                              <span
                                className="px-1.5 py-0.5 rounded shrink-0"
                                style={{
                                  background: r.direction === "inbound" ? "rgba(34,197,94,0.15)" : "rgba(59,130,246,0.15)",
                                  color: r.direction === "inbound" ? "#4ade80" : "#60a5fa",
                                }}
                              >
                                {r.direction === "inbound" ? "Owner" : "System"}
                              </span>
                              <span style={{ color: "var(--db-text)" }}>
                                {r.rawReply || r.messageType}
                              </span>
                              <span className="ml-auto shrink-0" style={{ color: "var(--db-text-muted)" }}>
                                {formatDate(r.createdAt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded text-sm"
            style={{
              background: "var(--db-surface)",
              color: page === 1 ? "var(--db-text-muted)" : "var(--db-text)",
              border: "1px solid var(--db-border)",
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm" style={{ color: "var(--db-text-muted)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded text-sm"
            style={{
              background: "var(--db-surface)",
              color: page === totalPages ? "var(--db-text-muted)" : "var(--db-text)",
              border: "1px solid var(--db-border)",
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs" style={{ color: "var(--db-text-muted)" }}>{label}</div>
      <div className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
        {value || "\u2014"}
      </div>
    </div>
  );
}

function formatCalculation(calc: Record<string, unknown>): string {
  const lines: string[] = [];
  const baseRate = calc.base_rate as number;
  const baseUnits = calc.base_units as number;
  const baseUnit = calc.base_unit as string;

  if (baseRate && baseUnits) {
    lines.push(`Base: $${baseRate}/${baseUnit} \u00D7 ${baseUnits} = $${(baseRate * baseUnits).toLocaleString()}`);
  }

  const additional = calc.additional as Array<{ label: string; amount: number }> | undefined;
  if (additional) {
    for (const add of additional) {
      lines.push(`+ ${add.label}: $${add.amount.toLocaleString()}`);
    }
  }

  const multipliers = calc.multipliers_applied as Array<{ label: string; value: number }> | undefined;
  if (multipliers) {
    for (const m of multipliers) {
      lines.push(`\u00D7 ${m.label}: ${m.value}`);
    }
  }

  return lines.join("\n") || "No breakdown available";
}
