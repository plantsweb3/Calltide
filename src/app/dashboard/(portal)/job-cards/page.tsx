"use client";

import { useEffect, useState, useCallback } from "react";
import { TableSkeleton } from "@/components/skeleton";
import { useReceptionistName } from "@/app/dashboard/_hooks/use-receptionist-name";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import Button from "@/components/ui/button";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

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

interface Attachment {
  id: string;
  mediaUrl: string;
  mediaContentType: string | null;
  caption: string | null;
  createdAt: string;
}

interface JobCard {
  id: string;
  callId: string | null;
  jobIntakeId: string | null;
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
  photoCount: number;
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

const STATUS_COLORS: Record<string, { bg: string; text: string; i18nKey: string }> = {
  pending_review: { bg: "rgba(245,158,11,0.15)", text: "var(--db-warning)", i18nKey: "jobCards.status.pending" },
  confirmed: { bg: "var(--db-success-bg)", text: "var(--db-success)", i18nKey: "jobCards.status.confirmed" },
  adjusted: { bg: "rgba(99,102,241,0.15)", text: "#818cf8", i18nKey: "jobCards.status.adjusted" },
  awaiting_adjustment: { bg: "rgba(245,158,11,0.15)", text: "var(--db-warning)", i18nKey: "jobCards.status.awaitingAdj" },
  site_visit_requested: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa", i18nKey: "jobCards.status.siteVisit" },
  expired: { bg: "rgba(148,163,184,0.15)", text: "var(--db-text-muted)", i18nKey: "jobCards.status.expired" },
};

const CONFIDENCE_COLORS: Record<string, { bg: string; text: string }> = {
  ballpark: { bg: "rgba(245,158,11,0.15)", text: "var(--db-warning)" },
  estimated: { bg: "var(--db-success-bg)", text: "var(--db-success)" },
  no_match: { bg: "rgba(148,163,184,0.15)", text: "var(--db-text-muted)" },
};

export default function JobCardsPage() {
  const [lang] = useLang();
  const receptionistName = useReceptionistName();
  const [cards, setCards] = useState<JobCard[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [photos, setPhotos] = useState<Record<string, Attachment[]>>({});
  const [search, setSearch] = useState("");

  // Lazy-load photos when a card with photos is expanded
  useEffect(() => {
    if (!expandedId) return;
    const card = cards.find((c) => c.id === expandedId);
    if (!card || card.photoCount === 0 || !card.jobIntakeId) return;
    if (photos[card.jobIntakeId]) return; // Already loaded

    fetch(`/api/dashboard/photos/${card.jobIntakeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.attachments) {
          setPhotos((prev) => ({ ...prev, [card.jobIntakeId!]: data.attachments }));
        }
      })
      .catch(() => { /* Non-critical */ });
  }, [expandedId, cards, photos]);

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
      setError(t("jobCards.loadError", lang));
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

  const locale = lang === "es" ? "es-MX" : "en-US";

  function formatDate(d: string | null) {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString(locale, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function formatCurrency(n: number | null) {
    if (n == null) return "\u2014";
    return n >= 1000 ? `$${n.toLocaleString(locale, { maximumFractionDigits: 0 })}` : `$${n.toFixed(0)}`;
  }

  const statCards = [
    { key: null, label: t("jobCards.status.all", lang), count: stats?.total || 0 },
    { key: "pending_review", label: t("jobCards.status.pending", lang), count: stats?.pending || 0 },
    { key: "confirmed", label: t("jobCards.status.confirmed", lang), count: stats?.confirmed || 0 },
    { key: "adjusted", label: t("jobCards.status.adjusted", lang), count: stats?.adjusted || 0 },
    { key: "site_visit_requested", label: t("jobCards.status.siteVisit", lang), count: stats?.siteVisit || 0 },
    { key: "expired", label: t("jobCards.status.expired", lang), count: stats?.expired || 0 },
  ];

  return (
    <div>
      <PageHeader
        title={t("jobCards.title", lang)}
        actions={
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder={t("jobCards.searchPlaceholder", lang)}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="db-input w-full sm:w-52"
            />
            {stats != null && (
              <div className="hidden sm:flex items-center gap-4 text-sm" style={{ color: "var(--db-text-muted)" }}>
                <span>{t("jobCards.responseRate", lang)} <strong style={{ color: "var(--db-text)" }}>{stats.responseRate}%</strong></span>
                {stats.avgResponseTimeMinutes != null && (
                  <span>{t("jobCards.avgResponse", lang)} <strong style={{ color: "var(--db-text)" }}>{stats.avgResponseTimeMinutes}min</strong></span>
                )}
              </div>
            )}
          </div>
        }
      />

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
        <div role="alert" aria-live="assertive" className="p-4 mb-4 rounded-xl text-sm" style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : cards.length === 0 ? (
        <EmptyState
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
          title={t("jobCards.emptyTitle", lang)}
          description={t("jobCards.emptyDescription", lang, { name: receptionistName })}
        />
      ) : (
        <div className="space-y-3">
          {cards.filter((c) => {
            if (!search) return true;
            const s = search.toLowerCase();
            return (c.callerName || "").toLowerCase().includes(s) ||
              (c.callerPhone || "").toLowerCase().includes(s) ||
              (c.scopeDescription || "").toLowerCase().includes(s) ||
              (c.jobTypeLabel || "").toLowerCase().includes(s);
          }).map((card) => {
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
                        {card.callerName || t("jobCards.unknownCaller", lang)}
                      </span>
                      {card.callerPhone && (
                        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                          ({card.callerPhone})
                        </span>
                      )}
                    </div>
                    <div className="text-sm truncate" style={{ color: "var(--db-text-muted)" }}>
                      {card.scopeDescription || card.jobTypeLabel || t("jobCards.serviceRequested", lang)}
                    </div>
                  </div>

                  {/* Estimate range */}
                  <div className="text-right tabular-nums shrink-0">
                    {card.estimateMin != null && card.estimateMax != null ? (
                      <div className="font-semibold" style={{ color: "var(--db-text)" }}>
                        {formatCurrency(card.ownerAdjustedMin || card.estimateMin)}&ndash;{formatCurrency(card.ownerAdjustedMax || card.estimateMax)}
                      </div>
                    ) : (
                      <div className="text-sm" style={{ color: "var(--db-text-muted)" }}>{t("jobCards.noEstimate", lang)}</div>
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
                      {t(sc.i18nKey, lang)}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: cc.bg, color: cc.text }}
                    >
                      {card.estimateConfidence || t("jobCards.noMatch", lang)}
                    </span>
                    {card.photoCount > 0 && (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1"
                        style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        {card.photoCount}
                      </span>
                    )}
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
                      <Detail label={t("jobCards.serviceType", lang)} value={card.jobTypeLabel} />
                      <Detail label={t("jobCards.scope", lang)} value={card.scopeLevel} />
                      <Detail label={t("jobCards.estimateMode", lang)} value={card.estimateMode} />
                      <Detail label={t("jobCards.unit", lang)} value={card.estimateUnit} />
                    </div>

                    {card.scopeDescription && (
                      <div>
                        <div className="text-xs mb-1" style={{ color: "var(--db-text-muted)" }}>{t("jobCards.description", lang)}</div>
                        <div className="text-sm" style={{ color: "var(--db-text)" }}>{card.scopeDescription}</div>
                      </div>
                    )}

                    {/* Photos */}
                    {card.photoCount > 0 && card.jobIntakeId && (
                      <div>
                        <div className="text-xs mb-2" style={{ color: "var(--db-text-muted)" }}>
                          {t("jobCards.photos", lang)} ({card.photoCount})
                        </div>
                        {photos[card.jobIntakeId] ? (
                          <div>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                              {photos[card.jobIntakeId].map((att) => (
                                <a
                                  key={att.id}
                                  href={att.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block rounded-lg overflow-hidden aspect-square"
                                  style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={att.mediaUrl}
                                    alt={att.caption || t("jobCards.photoAlt", lang)}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </a>
                              ))}
                            </div>
                            {photos[card.jobIntakeId][0]?.caption && (
                              <div className="mt-2 text-xs italic" style={{ color: "var(--db-text-muted)" }}>
                                &ldquo;{photos[card.jobIntakeId][0].caption}&rdquo;
                              </div>
                            )}
                            {photos[card.jobIntakeId][0]?.createdAt && (
                              <div className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
                                {t("jobCards.received", lang)} {formatDate(photos[card.jobIntakeId][0].createdAt)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs" style={{ color: "var(--db-text-muted)" }}>{t("jobCards.loadingPhotos", lang)}</div>
                        )}
                      </div>
                    )}

                    {/* Calculation breakdown */}
                    {card.estimateMode === "advanced" && card.estimateCalculationJson && (
                      <div>
                        <div className="text-xs mb-1" style={{ color: "var(--db-text-muted)" }}>{t("jobCards.calcBreakdown", lang)}</div>
                        <div className="p-3 rounded-lg text-sm font-mono" style={{ background: "var(--db-surface)" }}>
                          {formatCalculation(card.estimateCalculationJson, lang)}
                        </div>
                      </div>
                    )}

                    {/* Owner response */}
                    {card.ownerRespondedAt && (
                      <div className="p-3 rounded-lg" style={{ background: "var(--db-success-bg)" }}>
                        <div className="text-xs mb-1" style={{ color: "var(--db-success)" }}>{t("jobCards.ownerResponse", lang)}</div>
                        <div className="text-sm" style={{ color: "var(--db-text)" }}>
                          {card.ownerResponse === "confirmed" && t("jobCards.estimateConfirmed", lang)}
                          {card.ownerResponse === "adjusted" && `${t("jobCards.adjustedTo", lang)} ${formatCurrency(card.ownerAdjustedMin)}\u2013${formatCurrency(card.ownerAdjustedMax)}`}
                          {card.ownerResponse === "site_visit" && t("jobCards.siteVisitRequested", lang)}
                          <span className="ml-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
                            {formatDate(card.ownerRespondedAt)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Customer notification */}
                    {card.customerNotifiedAt && (
                      <div className="p-3 rounded-lg" style={{ background: "rgba(59,130,246,0.08)" }}>
                        <div className="text-xs mb-1" style={{ color: "#60a5fa" }}>{t("jobCards.customerNotified", lang)}</div>
                        <div className="text-sm" style={{ color: "var(--db-text)" }}>
                          {formatDate(card.customerNotifiedAt)}
                        </div>
                      </div>
                    )}

                    {/* Response timeline */}
                    {card.responses.length > 0 && (
                      <div>
                        <div className="text-xs mb-2" style={{ color: "var(--db-text-muted)" }}>{t("jobCards.responseTimeline", lang)}</div>
                        <div className="space-y-2">
                          {card.responses.map((r) => (
                            <div key={r.id} className="flex items-start gap-2 text-xs">
                              <span
                                className="px-1.5 py-0.5 rounded shrink-0"
                                style={{
                                  background: r.direction === "inbound" ? "var(--db-success-bg)" : "rgba(59,130,246,0.15)",
                                  color: r.direction === "inbound" ? "var(--db-success)" : "#60a5fa",
                                }}
                              >
                                {r.direction === "inbound" ? t("jobCards.directionOwner", lang) : t("jobCards.directionSystem", lang)}
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
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            {t("jobCards.previous", lang)}
          </Button>
          <span className="px-3 py-1.5 text-sm" style={{ color: "var(--db-text-muted)" }}>
            {t("jobCards.pageOf", lang, { page, total: totalPages })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            {t("jobCards.next", lang)}
          </Button>
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

function formatCalculation(calc: Record<string, unknown>, lang: "en" | "es"): string {
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

  return lines.join("\n") || t("jobCards.noBreakdown", lang);
}
