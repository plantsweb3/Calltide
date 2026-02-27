"use client";

import { useEffect, useState, useCallback } from "react";

interface Notification {
  id: string;
  source: string;
  severity: string;
  title: string;
  message: string;
  actionUrl: string | null;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  createdAt: string;
}

const severityColors: Record<string, { bg: string; text: string; dot: string }> = {
  emergency: { bg: "rgba(239,68,68,0.1)", text: "#ef4444", dot: "#ef4444" },
  critical: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b", dot: "#f59e0b" },
  warning: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6", dot: "#3b82f6" },
  info: { bg: "rgba(148,163,184,0.1)", text: "#94a3b8", dot: "#94a3b8" },
};

const sourceLabels: Record<string, string> = {
  capacity: "Capacity",
  incident: "Incidents",
  financial: "Financial",
  retention: "Retention",
  compliance: "Compliance",
  agents: "Agents",
  knowledge: "Knowledge",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [source, setSource] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (source !== "all") params.set("source", source);
    if (severity !== "all") params.set("severity", severity);
    params.set("limit", "20");
    params.set("offset", String(page * 20));
    try {
      const r = await fetch(`/api/notifications?${params}`);
      if (r.ok) {
        const data = await r.json();
        setItems(data.items ?? []);
      }
    } catch {}
    setLoading(false);
  }, [source, severity, page]);

  useEffect(() => { load(); }, [load]);

  const acknowledge = async (id: string) => {
    await fetch("/api/notifications/acknowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, acknowledged: true, acknowledgedAt: new Date().toISOString() } : n)));
  };

  const acknowledgeAll = async () => {
    await fetch("/api/notifications/acknowledge-all", { method: "POST" });
    setItems((prev) => prev.map((n) => ({ ...n, acknowledged: true, acknowledgedAt: new Date().toISOString() })));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>Notifications</h1>
          <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>System alerts and notifications from all subsystems</p>
        </div>
        <button
          onClick={acknowledgeAll}
          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--db-border)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--db-hover)"; }}
        >
          Acknowledge All
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={source}
          onChange={(e) => { setSource(e.target.value); setPage(0); }}
          className="rounded-lg px-3 py-1.5 text-sm"
          style={{ background: "var(--db-card)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
        >
          <option value="all">All Sources</option>
          {Object.entries(sourceLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={severity}
          onChange={(e) => { setSeverity(e.target.value); setPage(0); }}
          className="rounded-lg px-3 py-1.5 text-sm"
          style={{ background: "var(--db-card)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
        >
          <option value="all">All Severities</option>
          <option value="emergency">Emergency</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p style={{ color: "var(--db-text-muted)" }}>Loading...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <p style={{ color: "var(--db-text-muted)" }}>No notifications found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const colors = severityColors[n.severity] ?? severityColors.info;
            return (
              <div
                key={n.id}
                className="flex items-start gap-3 rounded-xl p-4"
                style={{
                  background: n.acknowledged ? "var(--db-card)" : colors.bg,
                  border: `1px solid ${n.acknowledged ? "var(--db-border)" : colors.dot}30`,
                  opacity: n.acknowledged ? 0.7 : 1,
                }}
              >
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: colors.dot }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                      style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
                    >
                      {sourceLabels[n.source] ?? n.source}
                    </span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {n.severity}
                    </span>
                    <span className="text-[11px]" style={{ color: "var(--db-text-muted)" }}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{n.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>{n.message}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {n.actionUrl && (
                    <a
                      href={n.actionUrl}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                      style={{ background: "var(--db-hover)", color: "var(--db-text-secondary)" }}
                    >
                      View
                    </a>
                  )}
                  {!n.acknowledged && (
                    <button
                      onClick={() => acknowledge(n.id)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
                      style={{ background: "var(--db-accent)", color: "#fff" }}
                    >
                      Ack
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-30"
          style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
        >
          Previous
        </button>
        <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>Page {page + 1}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={items.length < 20}
          className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-30"
          style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
