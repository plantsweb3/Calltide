"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

const t = {
  title: "System Status",
  subtitle: "Real-time status of all Calltide services",
  services: "Service Status",
  activeIncidents: "Active Incidents",
  pastIncidents: "Past Incidents",
  uptime90: "90-Day Uptime",
  subscribe: "Subscribe to Updates",
  subscribePlaceholder: "your@email.com",
  subscribeBtn: "Subscribe",
  noActiveIncidents: "No active incidents",
  noPastIncidents: "No incidents in the last 90 days",
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
  const searchParams = useSearchParams();

  const fetchStatus = useCallback(() => {
    fetch("/api/status")
      .then((r) => r.json())
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

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FBFBFC" }}>
        <p style={{ color: "#94A3B8" }}>{text.loading}</p>
      </div>
    );
  }

  const colorMap: Record<string, string> = { green: "#4ade80", amber: "#f59e0b", red: "#ef4444" };
  const overallDotColor = colorMap[data.overallColor] ?? "#4ade80";

  return (
    <div className="min-h-screen" style={{ background: "#FBFBFC", fontFamily: "Inter, -apple-system, sans-serif" }}>
      {/* Nav */}
      <header className="border-b" style={{ borderColor: "#E2E8F0" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold" style={{ color: "#C59A27" }}>
            Calltide
          </Link>
          <div className="flex items-center gap-4">
            <Link href={text.langToggleHref} className="text-sm font-medium" style={{ color: "#475569" }}>
              {text.langToggle}
            </Link>
            <Link href="/" className="text-sm font-medium" style={{ color: "#475569" }}>
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">
        {/* Overall Status Banner */}
        <div
          className="rounded-xl p-6 text-center"
          style={{
            background: data.overallColor === "green" ? "rgba(74,222,128,0.06)" : data.overallColor === "red" ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
            border: `1px solid ${overallDotColor}33`,
          }}
        >
          <div className="flex items-center justify-center gap-3">
            <span
              className="h-3 w-3 rounded-full"
              style={{
                background: overallDotColor,
                boxShadow: `0 0 8px ${overallDotColor}80`,
                animation: data.overallColor !== "green" ? "pulse 2s infinite" : undefined,
              }}
            />
            <span className="text-xl font-semibold" style={{ color: "#1A1D24" }}>
              {data.overallStatus}
            </span>
          </div>
        </div>

        {/* Service Cards Grid */}
        <section>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "#1A1D24" }}>{text.services}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.services.map((svc) => {
              const sColor = svc.status === "operational" ? "#4ade80" : svc.status === "degraded" ? "#f59e0b" : "#ef4444";
              return (
                <div
                  key={svc.name}
                  className="rounded-xl border p-4"
                  style={{ background: "white", borderColor: "#E2E8F0" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm" style={{ color: "#1A1D24" }}>{svc.name}</span>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ background: `${sColor}15`, color: sColor }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: sColor }} />
                      {svc.status === "operational" ? text.operational : svc.status === "degraded" ? text.degraded : text.outage}
                    </span>
                  </div>
                  <div className="text-xs space-y-1" style={{ color: "#94A3B8" }}>
                    <p>Response: {svc.latencyMs != null ? `${svc.latencyMs}ms` : "—"}</p>
                    <p>Checked: {svc.checkedAt ? new Date(svc.checkedAt).toLocaleTimeString() : "—"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Active Incidents */}
        <section>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "#1A1D24" }}>{text.activeIncidents}</h2>
          {data.activeIncidents.length === 0 ? (
            <p className="text-sm" style={{ color: "#94A3B8" }}>{text.noActiveIncidents}</p>
          ) : (
            <div className="space-y-3">
              {data.activeIncidents.map((inc) => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  lang={lang}
                  expanded={expandedIncident === inc.id}
                  onToggle={() => setExpandedIncident(expandedIncident === inc.id ? null : inc.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 90-Day Uptime Bars */}
        {Object.keys(data.dailyHealth).length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "#1A1D24" }}>{text.uptime90}</h2>
            <div className="space-y-4">
              {Object.entries(data.dailyHealth).map(([service, days]) => (
                <div key={service}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: "#1A1D24" }}>{service}</span>
                    <span className="text-xs" style={{ color: "#94A3B8" }}>
                      {((days.filter((d) => d.status === "operational").length / Math.max(days.length, 1)) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex gap-px h-6 rounded overflow-hidden">
                    {days.map((d, i) => (
                      <div
                        key={i}
                        className="flex-1 min-w-[2px]"
                        title={`${d.date}: ${d.status}`}
                        style={{
                          background: d.status === "operational" ? "#4ade80" : d.status === "degraded" ? "#f59e0b" : "#ef4444",
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Past Incidents */}
        <section>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "#1A1D24" }}>{text.pastIncidents}</h2>
          {data.recentIncidents.length === 0 ? (
            <p className="text-sm" style={{ color: "#94A3B8" }}>{text.noPastIncidents}</p>
          ) : (
            <div className="space-y-3">
              {data.recentIncidents.map((inc) => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  lang={lang}
                  expanded={expandedIncident === inc.id}
                  onToggle={() => setExpandedIncident(expandedIncident === inc.id ? null : inc.id)}
                  showPostmortem
                />
              ))}
            </div>
          )}
        </section>

        {/* Subscribe Form */}
        <section className="rounded-xl p-8 text-center" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
          <h2 className="text-lg font-semibold" style={{ color: "#1A1D24" }}>{text.subscribe}</h2>
          {subscribeMsg && (
            <p className="mt-2 text-sm" style={{ color: "#C59A27" }}>{subscribeMsg}</p>
          )}
          <form onSubmit={handleSubscribe} className="mt-4 flex flex-col sm:flex-row gap-2 justify-center max-w-md mx-auto">
            <input
              type="email"
              value={subscribeEmail}
              onChange={(e) => setSubscribeEmail(e.target.value)}
              placeholder={text.subscribePlaceholder}
              required
              className="flex-1 rounded-lg border px-4 py-2.5 text-sm"
              style={{ borderColor: "#E2E8F0", outline: "none" }}
            />
            <button
              type="submit"
              disabled={subscribing}
              className="rounded-lg px-6 py-2.5 text-sm font-medium text-white"
              style={{ background: "#C59A27", opacity: subscribing ? 0.6 : 1 }}
            >
              {text.subscribeBtn}
            </button>
          </form>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm" style={{ borderColor: "#E2E8F0", color: "#94A3B8" }}>
        <p>&copy; {new Date().getFullYear()} Calltide. All rights reserved.</p>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ── Incident Card Component ──

function IncidentCard({
  incident,
  lang,
  expanded,
  onToggle,
  showPostmortem,
}: {
  incident: Incident;
  lang: string;
  expanded: boolean;
  onToggle: () => void;
  showPostmortem?: boolean;
}) {
  const sevColor = incident.severity === "critical" ? "#ef4444" : incident.severity === "major" ? "#f59e0b" : "#3b82f6";
  const title = lang === "es" && incident.titleEs ? incident.titleEs : incident.title;
  const isResolved = incident.status === "resolved" || incident.status === "postmortem";

  return (
    <div className="rounded-xl border" style={{ background: "white", borderColor: "#E2E8F0" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
        style={{ cursor: "pointer" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ background: isResolved ? "#4ade80" : sevColor }}
          />
          <div>
            <p className="font-medium text-sm" style={{ color: "#1A1D24" }}>{title}</p>
            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
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
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: `${sevColor}15`, color: sevColor }}
          >
            {incident.severity}
          </span>
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94A3B8"
            strokeWidth={2}
            style={{ transform: expanded ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "#E2E8F0" }}>
          {/* Timeline */}
          <div className="space-y-3">
            {incident.updates.map((upd) => (
              <div key={upd.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="h-2 w-2 rounded-full mt-1.5" style={{ background: "#C59A27" }} />
                  <span className="flex-1 w-px" style={{ background: "#E2E8F0" }} />
                </div>
                <div className="pb-3">
                  <p className="text-xs font-medium" style={{ color: "#475569" }}>
                    {upd.status.replace(/_/g, " ")} &middot;{" "}
                    {new Date(upd.createdAt).toLocaleString(lang === "es" ? "es" : "en", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "#1A1D24" }}>
                    {lang === "es" && upd.messageEs ? upd.messageEs : upd.message}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Postmortem */}
          {showPostmortem && incident.postmortem && (
            <div className="mt-4 rounded-lg p-4" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#C59A27" }}>{lang === "es" ? "Informe Post-Incidente" : "Postmortem"}</p>
              <div
                className="prose prose-sm max-w-none text-sm"
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
