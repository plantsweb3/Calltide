"use client";

import { useState } from "react";
import Link from "next/link";
import EmptyState from "@/components/empty-state";
import { t, type Lang } from "@/lib/i18n/strings";

interface FeedEvent {
  id: string;
  time: string;
  type: string;
  title: string;
  description: string;
  person: string;
  language?: string;
  value?: number;
  recovered?: boolean;
  urgent?: boolean;
  chainId?: string;
  automationChain?: string[];
  isRecent?: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function EventIcon({ type, urgent, recovered }: { type: string; urgent?: boolean; recovered?: boolean }) {
  if (recovered) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--db-success-bg)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--db-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }
  if (urgent) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--db-danger-bg)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--db-danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
    );
  }
  if (type === "call_missed") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--db-warning-bg)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--db-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        </svg>
      </div>
    );
  }
  if (type === "call_completed") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--db-info-bg)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--db-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
        </svg>
      </div>
    );
  }
  if (type === "sms_sent" || type === "sms_received") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "rgba(139,92,246,0.15)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
    );
  }
  if (type === "appointment_booked") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--db-accent-bg)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--db-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
    );
  }
  return <div className="h-8 w-8 rounded-full" style={{ background: "var(--db-hover)" }} />;
}

function getRoute(type: string): string {
  if (type.startsWith("call")) return "/dashboard/calls";
  if (type.startsWith("sms")) return "/dashboard/sms";
  if (type.startsWith("appointment")) return "/dashboard/appointments";
  return "/dashboard";
}

/** Group events by chainId. Events without chainId are standalone. */
function groupByChain(events: FeedEvent[]): Array<{ chainId: string; events: FeedEvent[] }> {
  const groups: Array<{ chainId: string; events: FeedEvent[] }> = [];
  const seen = new Set<string>();

  for (const evt of events) {
    if (!evt.chainId || seen.has(evt.chainId)) {
      if (!evt.chainId) {
        groups.push({ chainId: evt.id, events: [evt] });
      } else if (seen.has(evt.chainId)) {
        const group = groups.find((g) => g.chainId === evt.chainId);
        if (group) group.events.push(evt);
      }
      continue;
    }
    seen.add(evt.chainId);
    groups.push({ chainId: evt.chainId, events: [evt] });
  }

  return groups;
}

function ChainBadge({ chain }: { chain: string[] }) {
  if (!chain || chain.length <= 1) return null;
  return (
    <div className="flex items-center gap-1 mt-1.5">
      {chain.map((step, i) => (
        <span key={i} className="flex items-center gap-1">
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-medium"
            style={{
              background: "var(--db-hover)",
              color: "var(--db-text-muted)",
            }}
          >
            {step}
          </span>
          {i < chain.length - 1 && (
            <span className="text-[9px]" style={{ color: "var(--db-text-muted)" }}>
              &rarr;
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export default function ActivityFeed({
  events,
  newestEventText,
  receptionistName,
  lang = "en",
}: {
  events: FeedEvent[];
  newestEventText?: string | null;
  receptionistName?: string;
  lang?: Lang;
}) {
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set());

  if (events.length === 0) {
    return (
      <div
        className="rounded-xl p-5 transition-colors duration-300"
        style={{
          background: "var(--db-card)",
          border: "1px solid var(--db-border)",
          boxShadow: "var(--db-card-shadow)",
        }}
      >
        <h3
          className="mb-4 text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--db-text-muted)" }}
        >
          {t("activityFeed.recentActivity", lang)}
        </h3>
        <EmptyState
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          }
          title={t("activityFeed.noRecentActivity", lang)}
          description={t("activityFeed.emptyDescription", lang)}
        />
      </div>
    );
  }

  const chains = groupByChain(events);

  function toggleChain(chainId: string) {
    setExpandedChains((prev) => {
      const next = new Set(prev);
      if (next.has(chainId)) next.delete(chainId);
      else next.add(chainId);
      return next;
    });
  }

  return (
    <div
      className="rounded-xl p-5 transition-colors duration-300"
      style={{
        background: "var(--db-card)",
        border: "1px solid var(--db-border)",
        boxShadow: "var(--db-card-shadow)",
      }}
    >
      {/* Header — "Maria just did X" when very recent */}
      {newestEventText ? (
        <div className="flex items-center gap-2 mb-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: "var(--db-accent)" }} />
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--db-accent)" }} />
          </span>
          <span className="text-sm font-semibold" style={{ color: "var(--db-accent)" }}>
            {t("activityFeed.justDid", lang, { name: receptionistName || "Maria", text: newestEventText })}
          </span>
        </div>
      ) : (
        <h3
          className="mb-4 text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--db-text-muted)" }}
        >
          {t("activityFeed.recentActivity", lang)}
        </h3>
      )}

      <div className="space-y-0">
        {chains.map((chain, ci) => {
          const primary = chain.events[0];
          const hasMultiple = chain.events.length > 1;
          const isExpanded = expandedChains.has(chain.chainId);
          const eventsToShow = hasMultiple && !isExpanded ? [primary] : chain.events;

          return (
            <div key={chain.chainId}>
              {eventsToShow.map((evt, i) => (
                <Link
                  key={evt.id}
                  href={getRoute(evt.type)}
                  className={`db-hover-bg flex gap-3 py-3 cursor-pointer transition-colors duration-150 rounded-lg px-2 -mx-2 no-underline${evt.isRecent ? " feed-pulse" : ""}`}
                  style={{
                    borderTop: ci > 0 && i === 0 ? "1px solid var(--db-border-light)" : i > 0 ? "1px solid var(--db-border-light)" : "none",
                  }}
                >
                  <div className="flex flex-col items-center">
                    <EventIcon type={evt.type} urgent={evt.urgent} recovered={evt.recovered} />
                    {/* Connecting dot for chain events */}
                    {hasMultiple && isExpanded && i < eventsToShow.length - 1 && (
                      <div className="w-0.5 flex-1 mt-1" style={{ background: "var(--db-border)" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                        {evt.person}
                      </span>
                      {evt.language && (
                        <span
                          className="rounded px-1.5 py-0.5 text-xs font-medium uppercase"
                          style={{
                            background: evt.language === "es" ? "var(--db-accent-bg)" : "var(--db-info-bg)",
                            color: evt.language === "es" ? "var(--db-accent)" : "var(--db-info)",
                          }}
                        >
                          {evt.language}
                        </span>
                      )}
                      {evt.recovered && (
                        <span
                          className="rounded px-1.5 py-0.5 text-xs font-bold uppercase"
                          style={{ background: "var(--db-success-bg)", color: "var(--db-success)" }}
                        >
                          {t("activityFeed.recovered", lang)}
                        </span>
                      )}
                      {evt.value && (
                        <span
                          className="rounded px-1.5 py-0.5 text-xs font-medium"
                          style={{ background: "var(--db-success-bg)", color: "var(--db-success)" }}
                        >
                          +${evt.value}
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
                      {evt.title}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--db-text-muted)" }}>
                      {evt.description}
                    </p>
                    {/* Automation chain badge on first event */}
                    {i === 0 && evt.automationChain && (
                      <ChainBadge chain={evt.automationChain} />
                    )}
                  </div>
                  <span className="shrink-0 text-xs tabular-nums" style={{ color: "var(--db-text-muted)" }}>
                    {formatTime(evt.time)}
                  </span>
                </Link>
              ))}
              {/* Expand/collapse for chains with multiple events */}
              {hasMultiple && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleChain(chain.chainId);
                  }}
                  className="ml-11 mb-1 text-xs font-medium transition-colors"
                  style={{ color: "var(--db-accent)" }}
                >
                  {isExpanded
                    ? t("activityFeed.showLess", lang)
                    : t(chain.events.length - 1 > 1 ? "activityFeed.moreEvents" : "activityFeed.moreEvent", lang, { count: chain.events.length - 1 })}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
