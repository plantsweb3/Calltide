"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CaptaSpinner from "@/components/capta-spinner";

// ── Types ──

interface ServiceStatus {
  name: string;
  status: string;
  latencyMs: number | null;
  checkedAt: string;
}

interface IncidentUpdate {
  id: string;
  status: string;
  message: string;
  messageEs?: string;
  createdAt: string;
}

interface Incident {
  id: string;
  title: string;
  titleEs?: string;
  status: string;
  severity: string;
  affectedServices: string[];
  startedAt: string;
  resolvedAt?: string;
  duration?: number;
  postmortem?: string;
  postmortemEs?: string;
  updates: IncidentUpdate[];
}

interface StatusData {
  overallStatus: string;
  overallColor: string;
  services: ServiceStatus[];
  activeIncidents: Incident[];
  recentIncidents: Incident[];
  dailyHealth: Record<string, Array<{ date: string; status: string }>>;
}

// ── Text ──

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Phone Answering": "Inbound call handling & voice AI",
  "SMS & Notifications": "Text messages & email alerts",
  "Dashboard & CRM": "Client portal, data & reporting",
  "AI Intelligence": "Call summaries & smart features",
};

const t = {
  title: "System Status",
  subtitle: "Real-time status of all Capta services",
  services: "Service Status",
  activeIncidents: "Active Incidents",
  pastIncidents: "Past Incidents",
  uptimeHeading: "Uptime over the past 90 days.",
  daysAgo: "90 days ago",
  uptimeSuffix: " % uptime",
  today: "Today",
  subscribe: "Get notified",
  subscribeDesc: "Subscribe to email notifications when Capta creates, updates, or resolves an incident.",
  subscribePlaceholder: "your@email.com",
  subscribeBtn: "Subscribe",
  noActiveIncidents: "No active incidents — all systems running normally.",
  noPastIncidents: "No incidents in the last 90 days.",
  operational: "Operational",
  degraded: "Degraded",
  outage: "Outage",
  allOperational: "All Systems Operational",
  postmortem: "Postmortem",
  loading: "Loading status...",
  langToggle: "Español",
  langToggleHref: "/es/status",
  verifiedMsg: "Email verified! You'll receive status updates.",
  unsubscribedMsg: "You've been unsubscribed from status updates.",
  verifyFailedMsg: "Verification failed. Please try again.",
  subscribedMsg: "Check your email to confirm your subscription.",
  categoryDescriptions: CATEGORY_DESCRIPTIONS,
};

export default function StatusPage() {
  return (
    <Suspense>
      <StatusPageInner lang="en" t={t} />
    </Suspense>
  );
}

export function StatusPageInner({ lang, t: text }: { lang: string; t: typeof t }) {
  const [data, setData] = useState<StatusData | null>(null);
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeMsg, setSubscribeMsg] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<{ service: string; day: { date: string; status: string }; x: number; y: number } | null>(null);
  const searchParams = useSearchParams();

  const fetchStatus = useCallback(() => {
    fetch("/api/status")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    if (searchParams.get("verified") === "true") setSubscribeMsg(text.verifiedMsg);
    else if (searchParams.get("verified") === "false") setSubscribeMsg(text.verifyFailedMsg);
    else if (searchParams.get("unsubscribed") === "true") setSubscribeMsg(text.unsubscribedMsg);
  }, [searchParams, text]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail || subscribing) return;
    setSubscribing(true);
    try {
      const res = await fetch("/api/status/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscribeEmail, language: lang }),
      });
      const json = await res.json();
      setSubscribeMsg(json.message || json.error || text.subscribedMsg);
      if (res.ok) setSubscribeEmail("");
    } catch {
      setSubscribeMsg("Something went wrong. Please try again.");
    }
    setSubscribing(false);
  };

  // ── Loading ──
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8FAFC" }}>
        <div className="flex items-center gap-3">
          <CaptaSpinner size={20} />
          <p className="text-sm" style={{ color: "#64748B" }}>{text.loading}</p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    green: "var(--db-success, #16A34A)",
    amber: "var(--db-warning, #f59e0b)",
    red: "var(--db-danger, #DC2626)",
  };
  const overallDotColor = statusColors[data.overallColor] ?? "var(--db-success, #16A34A)";

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      {/* ── Header ── */}
      <header style={{ borderBottom: "1px solid #E2E8F0" }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="6" fill="#D4A843" />
              <path d="M7 8.5C7 7.67 7.67 7 8.5 7h7c.83 0 1.5.67 1.5 1.5v0c0 .83-.67 1.5-1.5 1.5h-7C7.67 10 7 9.33 7 8.5zM7 12c0-.83.67-1.5 1.5-1.5h3c.83 0 1.5.67 1.5 1.5v0c0 .83-.67 1.5-1.5 1.5h-3C7.67 13.5 7 12.83 7 12zM7 15.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5v0c0 .83-.67 1.5-1.5 1.5h-5C7.67 17 7 16.33 7 15.5z" fill="white"/>
            </svg>
            <span className="text-lg font-bold tracking-tight" style={{ color: "#0F1729" }}>
              Capta <span className="font-normal" style={{ color: "#64748B" }}>Status</span>
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href={text.langToggleHref} className="text-sm" style={{ color: "#64748B" }}>
              {text.langToggle}
            </Link>
            <a
              href="#subscribe"
              className="text-sm font-medium"
              style={{ color: "#D4A843" }}
            >
              {text.subscribe}
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 space-y-12">
        {/* ── Overall Status Banner ── */}
        <div
          className="rounded-2xl px-8 py-7"
          style={{
            background: data.overallColor === "green"
              ? "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(34,197,94,0.02) 100%)"
              : data.overallColor === "red"
                ? "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)"
                : "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)",
            border: `1px solid ${overallDotColor}20`,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${overallDotColor}12` }}
            >
              {data.overallColor === "green" ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={overallDotColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={overallDotColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: "#0F1729" }}>
                {data.overallStatus}
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: "#64748B" }}>
                {text.subtitle}
              </p>
            </div>
            {data.overallColor !== "green" && (
              <div className="ml-auto">
                <span
                  className="block h-3 w-3 rounded-full"
                  style={{
                    background: overallDotColor,
                    boxShadow: `0 0 0 0 ${overallDotColor}`,
                    animation: "status-pulse 2s infinite",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Active Incidents ── */}
        {data.activeIncidents.length > 0 && (
          <section>
            <SectionHeading>{text.activeIncidents}</SectionHeading>
            <div className="space-y-3">
              {data.activeIncidents.map((inc) => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  lang={lang}
                  text={text}
                  expanded={expandedIncident === inc.id}
                  onToggle={() => setExpandedIncident(expandedIncident === inc.id ? null : inc.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Component Status — Individual bordered rows with uptime bars ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <SectionHeading>{text.services}</SectionHeading>
          </div>

          {/* "Uptime over the past 90 days" label */}
          {Object.keys(data.dailyHealth).length > 0 && (
            <p className="text-right text-sm mb-3" style={{ color: "#64748B" }}>
              {text.uptimeHeading}
            </p>
          )}

          <div className="space-y-0 rounded-xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
            {data.services.map((svc, idx) => {
              const sColor = svc.status === "operational" ? "var(--db-success, #16A34A)" : svc.status === "degraded" ? "var(--db-warning, #f59e0b)" : "var(--db-danger, #DC2626)";
              const days = data.dailyHealth[svc.name] || [];
              const uptimePct = days.length > 0
                ? ((days.filter((d) => d.status === "operational").length / days.length) * 100).toFixed(2)
                : null;

              return (
                <div
                  key={svc.name}
                  className="px-6 py-5"
                  style={{
                    background: "white",
                    borderTop: idx > 0 ? "1px solid #E2E8F0" : undefined,
                  }}
                >
                  {/* Name + description + status text */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-bold text-[15px]" style={{ color: "#0F1729" }}>{svc.name}</span>
                      {text.categoryDescriptions?.[svc.name] && (
                        <span className="ml-2 text-xs" style={{ color: "#64748B" }}>{text.categoryDescriptions[svc.name]}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium" style={{ color: sColor }}>
                      {svc.status === "operational" ? text.operational : svc.status === "degraded" ? text.degraded : text.outage}
                    </span>
                  </div>

                  {/* 90-day uptime bar */}
                  {days.length > 0 && (
                    <>
                      <div className="flex gap-[2px] h-[34px]">
                        {days.map((d, i) => {
                          const barColor = d.status === "operational" ? "var(--db-success, #16A34A)" : d.status === "degraded" ? "var(--db-warning, #f59e0b)" : "var(--db-danger, #DC2626)";
                          return (
                            <div
                              key={i}
                              className="flex-1 min-w-[2px] rounded-[1px] cursor-pointer transition-opacity"
                              style={{
                                background: barColor,
                                opacity: hoveredDay && hoveredDay.service === svc.name && hoveredDay.day.date !== d.date ? 0.3 : 1,
                              }}
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredDay({ service: svc.name, day: d, x: rect.left + rect.width / 2, y: rect.top });
                              }}
                              onMouseLeave={() => setHoveredDay(null)}
                            />
                          );
                        })}
                      </div>

                      {/* "90 days ago ── XX.XX % uptime ── Today" */}
                      <div className="flex items-center mt-1.5 text-xs" style={{ color: "#64748B" }}>
                        <span className="shrink-0">{text.daysAgo}</span>
                        <span className="flex-1 mx-3 h-px" style={{ background: "#E2E8F0" }} />
                        <span className="shrink-0 tabular-nums">{uptimePct}{text.uptimeSuffix}</span>
                        <span className="flex-1 mx-3 h-px" style={{ background: "#E2E8F0" }} />
                        <span className="shrink-0">{text.today}</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── No Active Incidents Note ── */}
        {data.activeIncidents.length === 0 && (
          <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--db-success, #16A34A)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-sm" style={{ color: "#64748B" }}>{text.noActiveIncidents}</span>
          </div>
        )}

        {/* ── Past Incidents ── */}
        <section>
          <SectionHeading>{text.pastIncidents}</SectionHeading>
          {data.recentIncidents.length === 0 ? (
            <p className="text-sm" style={{ color: "#64748B" }}>{text.noPastIncidents}</p>
          ) : (
            <div className="space-y-3">
              {data.recentIncidents.map((inc) => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  lang={lang}
                  text={text}
                  expanded={expandedIncident === inc.id}
                  onToggle={() => setExpandedIncident(expandedIncident === inc.id ? null : inc.id)}
                  showPostmortem
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Subscribe ── */}
        <section id="subscribe" className="scroll-mt-20">
          <div
            className="rounded-2xl p-8"
            style={{ background: "white", border: "1px solid #E2E8F0" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "rgba(197,154,39,0.08)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold" style={{ color: "#0F1729" }}>{text.subscribe}</h2>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "#64748B" }}>
                  {text.subscribeDesc}
                </p>
                {subscribeMsg && (
                  <p className="mt-3 text-sm font-medium" style={{ color: "#D4A843" }}>{subscribeMsg}</p>
                )}
                <form onSubmit={handleSubscribe} className="mt-4 flex gap-2">
                  <input
                    type="email"
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    placeholder={text.subscribePlaceholder}
                    required
                    className="flex-1 rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
                    style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="cta-gold rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
                  >
                    {text.subscribeBtn}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid #E2E8F0" }}>
        <div className="mx-auto max-w-4xl px-6 py-6 flex items-center justify-between">
          <p className="text-xs" style={{ color: "#64748B" }}>
            &copy; {new Date().getFullYear()} Capta
          </p>
          <div className="flex items-center gap-5">
            <Link href="/" className="text-xs" style={{ color: "#64748B" }}>Home</Link>
            <Link href="/help" className="text-xs" style={{ color: "#64748B" }}>Help</Link>
            <Link href="/legal/privacy" className="text-xs" style={{ color: "#64748B" }}>Privacy</Link>
            <Link href="/legal/terms" className="text-xs" style={{ color: "#64748B" }}>Terms</Link>
          </div>
        </div>
      </footer>

      {/* ── Uptime bar tooltip ── */}
      {hoveredDay && (
        <div
          className="fixed z-50 pointer-events-none rounded-lg px-3 py-2 shadow-lg"
          style={{
            left: Math.max(8, Math.min(hoveredDay.x - 80, typeof window !== "undefined" ? window.innerWidth - 170 : 600)),
            top: hoveredDay.y - 52,
            background: "#0F1729",
            border: "1px solid #334155",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: hoveredDay.day.status === "operational" ? "var(--db-success, #16A34A)" : hoveredDay.day.status === "degraded" ? "var(--db-warning, #f59e0b)" : "var(--db-danger, #DC2626)",
              }}
            />
            <span className="text-xs font-medium text-white">
              {new Date(hoveredDay.day.date + "T12:00:00").toLocaleDateString(lang === "es" ? "es" : "en", { month: "short", day: "numeric" })}
            </span>
            <span className="text-xs capitalize" style={{ color: "#64748B" }}>
              {hoveredDay.day.status}
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes status-pulse {
          0% { box-shadow: 0 0 0 0 currentColor; }
          70% { box-shadow: 0 0 0 8px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>
    </div>
  );
}

// ── Section Heading ──

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <h2 className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "#64748B" }}>
        {children}
      </h2>
      <div className="flex-1 h-px" style={{ background: "#E2E8F0" }} />
    </div>
  );
}

// ── Incident Card ──

function IncidentCard({
  incident,
  lang,
  text,
  expanded,
  onToggle,
  showPostmortem,
}: {
  incident: Incident;
  lang: string;
  text: typeof t;
  expanded: boolean;
  onToggle: () => void;
  showPostmortem?: boolean;
}) {
  const sevColors: Record<string, string> = {
    critical: "var(--db-danger, #DC2626)",
    major: "var(--db-warning, #f59e0b)",
    minor: "#3b82f6",
    maintenance: "#6366f1",
  };
  const sevColor = sevColors[incident.severity] ?? "#64748B";
  const title = lang === "es" && incident.titleEs ? incident.titleEs : incident.title;
  const isResolved = incident.status === "resolved" || incident.status === "postmortem";

  const statusLabels: Record<string, string> = {
    detected: lang === "es" ? "Detectado" : "Detected",
    investigating: lang === "es" ? "Investigando" : "Investigating",
    identified: lang === "es" ? "Identificado" : "Identified",
    monitoring: lang === "es" ? "Monitoreando" : "Monitoring",
    resolved: lang === "es" ? "Resuelto" : "Resolved",
    postmortem: lang === "es" ? "Postmortem" : "Postmortem",
  };

  return (
    <div
      className="rounded-xl overflow-hidden transition-shadow"
      style={{ background: "white", border: `1px solid ${isResolved ? "#E2E8F0" : sevColor + "30"}` }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ background: isResolved ? "var(--db-success, #16A34A)" : sevColor }}
          />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: "#0F1729" }}>{title}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "#64748B" }}>
              {incident.affectedServices.join(", ")} &middot;{" "}
              {new Date(incident.startedAt).toLocaleDateString(lang === "es" ? "es" : "en", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              {incident.duration != null && ` · ${formatDurationClient(incident.duration)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
            style={{ background: `${isResolved ? "var(--db-success, #16A34A)" : sevColor}10`, color: isResolved ? "var(--db-success, #16A34A)" : sevColor }}
          >
            {statusLabels[incident.status] || incident.status}
          </span>
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#64748B"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: expanded ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-1" style={{ borderTop: "1px solid #E2E8F0" }}>
          {/* Timeline */}
          <div className="mt-3 space-y-0">
            {incident.updates.map((upd, i) => {
              const isLast = i === incident.updates.length - 1;
              return (
                <div key={upd.id} className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ background: i === 0 ? "#D4A843" : "#CBD5E1" }}
                    />
                    {!isLast && <span className="flex-1 w-px mt-1" style={{ background: "#E2E8F0" }} />}
                  </div>
                  <div className={isLast ? "" : "pb-4"}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold capitalize" style={{ color: "#475569" }}>
                        {upd.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px]" style={{ color: "#64748B" }}>
                        {new Date(upd.createdAt).toLocaleString(lang === "es" ? "es" : "en", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm mt-0.5 leading-relaxed" style={{ color: "#475569" }}>
                      {lang === "es" && upd.messageEs ? upd.messageEs : upd.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Postmortem */}
          {showPostmortem && incident.postmortem && (
            <div className="mt-5 rounded-lg p-4" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <p className="text-xs font-bold uppercase tracking-[0.1em] mb-3" style={{ color: "#D4A843" }}>
                {text.postmortem}
              </p>
              <div
                className="prose prose-sm max-w-none text-sm leading-relaxed"
                style={{ color: "#475569" }}
                dangerouslySetInnerHTML={{
                  __html: simpleMarkdown(lang === "es" && incident.postmortemEs ? incident.postmortemEs : incident.postmortem),
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Utilities ──

function formatDurationClient(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function simpleMarkdown(md: string): string {
  return escapeHtml(md)
    .replace(/^### (.+)$/gm, '<h4 style="font-weight:600;margin:12px 0 4px;color:#1e293b;">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="font-weight:600;margin:16px 0 8px;color:#1e293b;">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n- /g, "<br>• ")
    .replace(/\n/g, "<br>");
}
