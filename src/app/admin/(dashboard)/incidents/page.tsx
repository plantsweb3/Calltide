"use client";

import { useEffect, useState, useCallback } from "react";
import StatusBadge from "../../_components/status-badge";
import MetricCard from "../../_components/metric-card";
import DataTable, { type Column } from "../../_components/data-table";

// ── Types ──

interface IncidentUpdate {
  id: string;
  status: string;
  message: string;
  messageEs?: string;
  isPublic: boolean;
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
  clientsAffected?: number;
  estimatedCallsImpacted?: number;
  postmortem?: string;
  postmortemEs?: string;
  postmortemPublished?: boolean;
  createdBy?: string;
  updates: IncidentUpdate[];
}

interface Subscriber {
  id: string;
  email: string;
  language: string;
  verified: boolean;
  subscribedAt: string;
  unsubscribedAt?: string;
}

type Tab = "active" | "history" | "create" | "subscribers" | "metrics";

const SERVICES = ["Twilio", "Hume", "Anthropic", "Turso", "Resend"];
const SEVERITIES = ["critical", "major", "minor", "maintenance"] as const;

// ── Page ──

export default function IncidentsPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = useCallback(() => {
    fetch("/api/admin/incidents")
      .then((r) => r.json())
      .then((d) => setIncidents(d.incidents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchSubscribers = useCallback(() => {
    fetch("/api/admin/incidents/subscribers")
      .then((r) => r.json())
      .then((d) => setSubscribers(d.subscribers ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchIncidents();
    fetchSubscribers();
  }, [fetchIncidents, fetchSubscribers]);

  const activeIncidents = incidents.filter(
    (i) => !["resolved", "postmortem"].includes(i.status),
  );
  const pastIncidents = incidents.filter((i) =>
    ["resolved", "postmortem"].includes(i.status),
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "active", label: `Active (${activeIncidents.length})` },
    { key: "history", label: "History" },
    { key: "create", label: "Create" },
    { key: "subscribers", label: `Subscribers (${subscribers.length})` },
    { key: "metrics", label: "Reliability Metrics" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Incidents</h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          Incident response, status page management, and reliability metrics
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--db-hover)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              background: tab === t.key ? "var(--db-card)" : "transparent",
              color: tab === t.key ? "var(--db-text)" : "var(--db-text-muted)",
              boxShadow: tab === t.key ? "0 1px 2px rgba(0,0,0,0.05)" : undefined,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <p style={{ color: "var(--db-text-muted)" }}>Loading incidents...</p>
        </div>
      ) : (
        <>
          {tab === "active" && (
            <ActiveTab incidents={activeIncidents} onRefresh={fetchIncidents} />
          )}
          {tab === "history" && <HistoryTab incidents={pastIncidents} onRefresh={fetchIncidents} />}
          {tab === "create" && <CreateTab onCreated={fetchIncidents} />}
          {tab === "subscribers" && (
            <SubscribersTab subscribers={subscribers} onRefresh={fetchSubscribers} />
          )}
          {tab === "metrics" && <MetricsTab incidents={incidents} />}
        </>
      )}
    </div>
  );
}

// ── Active Incidents Tab ──

function ActiveTab({ incidents, onRefresh }: { incidents: Incident[]; onRefresh: () => void }) {
  const [addingUpdate, setAddingUpdate] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateStatus, setUpdateStatus] = useState("investigating");

  const handleResolve = async (id: string) => {
    await fetch(`/api/admin/incidents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    onRefresh();
  };

  const handleAddUpdate = async (id: string) => {
    if (!updateMessage) return;
    await fetch(`/api/admin/incidents/${id}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: updateStatus, message: updateMessage, notify: true }),
    });
    setAddingUpdate(null);
    setUpdateMessage("");
    onRefresh();
  };

  if (incidents.length === 0) {
    return (
      <div className="rounded-lg p-8 text-center" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(74,222,128,0.1)" }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={2}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <p className="font-medium" style={{ color: "var(--db-text)" }}>All Clear</p>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>No active incidents</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incidents.map((inc) => {
        const sevColor = inc.severity === "critical" ? "#ef4444" : inc.severity === "major" ? "#f59e0b" : "#3b82f6";
        return (
          <div key={inc.id} className="rounded-lg" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ background: sevColor, boxShadow: `0 0 6px ${sevColor}60` }} />
                <div>
                  <p className="font-medium" style={{ color: "var(--db-text)" }}>{inc.title}</p>
                  <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                    {inc.affectedServices.join(", ")} &middot; Started {new Date(inc.startedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={inc.severity} />
                <StatusBadge status={inc.status} />
              </div>
            </div>

            {/* Timeline */}
            {inc.updates.length > 0 && (
              <div className="border-t px-4 py-3" style={{ borderColor: "var(--db-border)" }}>
                <div className="space-y-2">
                  {inc.updates.slice(0, 5).map((upd) => (
                    <div key={upd.id} className="flex items-start gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--db-accent)" }} />
                      <div>
                        <span className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
                          {upd.status} &middot; {new Date(upd.createdAt).toLocaleTimeString()}
                        </span>
                        <p style={{ color: "var(--db-text-secondary)" }}>{upd.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t flex items-center gap-2 px-4 py-3" style={{ borderColor: "var(--db-border)" }}>
              <button
                onClick={() => setAddingUpdate(addingUpdate === inc.id ? null : inc.id)}
                className="rounded px-3 py-1.5 text-xs font-medium"
                style={{ background: "var(--db-hover)", color: "var(--db-text)" }}
              >
                Add Update
              </button>
              <button
                onClick={() => handleResolve(inc.id)}
                className="rounded px-3 py-1.5 text-xs font-medium text-white"
                style={{ background: "#4ade80" }}
              >
                Resolve
              </button>
            </div>

            {/* Add Update Form */}
            {addingUpdate === inc.id && (
              <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: "var(--db-border)" }}>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="rounded border px-2 py-1 text-sm"
                  style={{ background: "var(--db-surface)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
                >
                  <option value="investigating">Investigating</option>
                  <option value="identified">Identified</option>
                  <option value="monitoring">Monitoring</option>
                </select>
                <textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  placeholder="Update message..."
                  className="w-full rounded border px-3 py-2 text-sm"
                  style={{ background: "var(--db-surface)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
                  rows={2}
                />
                <button
                  onClick={() => handleAddUpdate(inc.id)}
                  className="rounded px-3 py-1.5 text-xs font-medium text-white"
                  style={{ background: "var(--db-accent)" }}
                >
                  Post Update
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── History Tab ──

function HistoryTab({ incidents, onRefresh }: { incidents: Incident[]; onRefresh: () => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handlePublishPostmortem = async (id: string) => {
    await fetch(`/api/admin/incidents/${id}/publish-postmortem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notify: true }),
    });
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this incident permanently?")) return;
    await fetch(`/api/admin/incidents/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const columns: Column<Incident>[] = [
    {
      key: "title",
      label: "Incident",
      render: (row) => (
        <div>
          <p className="font-medium" style={{ color: "var(--db-text)" }}>{row.title}</p>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{row.affectedServices.join(", ")}</p>
        </div>
      ),
    },
    {
      key: "severity",
      label: "Severity",
      render: (row) => <StatusBadge status={row.severity} />,
    },
    {
      key: "duration",
      label: "Duration",
      render: (row) => (
        <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
          {row.duration != null ? formatDur(row.duration) : "—"}
        </span>
      ),
    },
    {
      key: "startedAt",
      label: "Date",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
          {new Date(row.startedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "postmortemPublished",
      label: "Postmortem",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.postmortem ? (
            row.postmortemPublished ? (
              <StatusBadge status="resolved" />
            ) : (
              <button
                onClick={() => handlePublishPostmortem(row.id)}
                className="rounded px-2 py-1 text-xs font-medium text-white"
                style={{ background: "var(--db-accent)" }}
              >
                Publish
              </button>
            )
          ) : (
            <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>Pending</span>
          )}
        </div>
      ),
    },
    {
      key: "id",
      label: "",
      render: (row) => (
        <div className="flex gap-1">
          <button
            onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
            className="rounded px-2 py-1 text-xs"
            style={{ color: "var(--db-text-muted)" }}
          >
            {expandedId === row.id ? "Collapse" : "Expand"}
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="rounded px-2 py-1 text-xs"
            style={{ color: "#f87171" }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <DataTable columns={columns} data={incidents} />
      {/* Expanded postmortem view */}
      {expandedId && (() => {
        const inc = incidents.find((i) => i.id === expandedId);
        if (!inc) return null;
        return (
          <div
            className="mt-2 rounded-lg p-4"
            style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--db-text)" }}>
              Timeline — {inc.title}
            </h3>
            <div className="space-y-2 mb-4">
              {inc.updates.map((upd) => (
                <div key={upd.id} className="flex gap-2 text-sm">
                  <span className="text-xs font-mono" style={{ color: "var(--db-text-muted)", minWidth: "120px" }}>
                    {new Date(upd.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <StatusBadge status={upd.status} />
                  <span style={{ color: "var(--db-text-secondary)" }}>{upd.message}</span>
                </div>
              ))}
            </div>
            {inc.postmortem && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--db-accent)" }}>Postmortem</h3>
                <div
                  className="prose prose-sm max-w-none text-sm whitespace-pre-wrap"
                  style={{ color: "var(--db-text-secondary)" }}
                >
                  {inc.postmortem}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ── Create Tab ──

function CreateTab({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    title: "",
    titleEs: "",
    severity: "minor" as string,
    affectedServices: [] as string[],
    message: "",
    messageEs: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const toggleService = (svc: string) => {
    setForm((f) => ({
      ...f,
      affectedServices: f.affectedServices.includes(svc)
        ? f.affectedServices.filter((s) => s !== svc)
        : [...f.affectedServices, svc],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message || form.affectedServices.length === 0) {
      setMsg("Fill in all required fields");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMsg("Incident created");
      setForm({ title: "", titleEs: "", severity: "minor", affectedServices: [], message: "", messageEs: "" });
      onCreated();
    } else {
      const d = await res.json();
      setMsg(d.error || "Failed to create");
    }
    setSaving(false);
  };

  const fieldStyle = {
    background: "var(--db-surface)",
    borderColor: "var(--db-border)",
    color: "var(--db-text)",
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {msg && <p className="text-sm" style={{ color: "var(--db-accent)" }}>{msg}</p>}

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--db-text)" }}>Title (EN) *</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={fieldStyle}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--db-text)" }}>Title (ES)</label>
        <input
          value={form.titleEs}
          onChange={(e) => setForm({ ...form, titleEs: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={fieldStyle}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--db-text)" }}>Severity *</label>
        <select
          value={form.severity}
          onChange={(e) => setForm({ ...form, severity: e.target.value })}
          className="rounded-lg border px-3 py-2 text-sm"
          style={fieldStyle}
        >
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--db-text)" }}>Affected Services *</label>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((svc) => (
            <button
              key={svc}
              type="button"
              onClick={() => toggleService(svc)}
              className="rounded-full px-3 py-1 text-xs font-medium border"
              style={{
                background: form.affectedServices.includes(svc) ? "var(--db-accent)" : "transparent",
                color: form.affectedServices.includes(svc) ? "white" : "var(--db-text-muted)",
                borderColor: form.affectedServices.includes(svc) ? "var(--db-accent)" : "var(--db-border)",
              }}
            >
              {svc}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--db-text)" }}>Message (EN) *</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={fieldStyle}
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--db-text)" }}>Message (ES)</label>
        <textarea
          value={form.messageEs}
          onChange={(e) => setForm({ ...form, messageEs: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={fieldStyle}
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg px-6 py-2.5 text-sm font-medium text-white"
        style={{ background: "var(--db-accent)", opacity: saving ? 0.6 : 1 }}
      >
        {saving ? "Creating..." : "Create Incident"}
      </button>
    </form>
  );
}

// ── Subscribers Tab ──

function SubscribersTab({ subscribers, onRefresh }: { subscribers: Subscriber[]; onRefresh: () => void }) {
  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/incidents/subscribers?id=${id}`, { method: "DELETE" });
    onRefresh();
  };

  const columns: Column<Subscriber>[] = [
    {
      key: "email",
      label: "Email",
      render: (row) => (
        <span className="font-medium" style={{ color: "var(--db-text)" }}>{row.email}</span>
      ),
    },
    {
      key: "language",
      label: "Language",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{row.language.toUpperCase()}</span>
      ),
    },
    {
      key: "verified",
      label: "Status",
      render: (row) => <StatusBadge status={row.verified ? "verified" : "unverified"} />,
    },
    {
      key: "subscribedAt",
      label: "Subscribed",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
          {new Date(row.subscribedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "id",
      label: "",
      render: (row) => (
        <button
          onClick={() => handleDelete(row.id)}
          className="rounded px-2 py-1 text-xs"
          style={{ color: "#f87171" }}
        >
          Remove
        </button>
      ),
    },
  ];

  if (subscribers.length === 0) {
    return (
      <div className="rounded-lg p-8 text-center" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>No subscribers yet</p>
      </div>
    );
  }

  return <DataTable columns={columns} data={subscribers} />;
}

// ── Metrics Tab ──

function MetricsTab({ incidents }: { incidents: Incident[] }) {
  const resolved = incidents.filter((i) => i.duration != null);
  const totalIncidents = incidents.length;
  const avgDuration = resolved.length > 0
    ? Math.round(resolved.reduce((sum, i) => sum + (i.duration ?? 0), 0) / resolved.length)
    : 0;

  const criticalCount = incidents.filter((i) => i.severity === "critical").length;
  const majorCount = incidents.filter((i) => i.severity === "major").length;

  // Calculate uptime percentage (approximate: assume 5-min intervals)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentIncidents = resolved.filter((i) => new Date(i.startedAt) > thirtyDaysAgo);
  const totalDowntimeSeconds = recentIncidents.reduce((sum, i) => sum + (i.duration ?? 0), 0);
  const thirtyDaySeconds = 30 * 24 * 3600;
  const uptimePct = ((1 - totalDowntimeSeconds / thirtyDaySeconds) * 100).toFixed(3);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="30-Day Uptime" value={`${uptimePct}%`} />
        <MetricCard label="MTTR" value={avgDuration > 0 ? formatDur(avgDuration) : "—"} />
        <MetricCard label="Total Incidents" value={totalIncidents} />
        <MetricCard label="Critical" value={criticalCount} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Major" value={majorCount} />
        <MetricCard label="Minor" value={incidents.filter((i) => i.severity === "minor").length} />
        <MetricCard label="Maintenance" value={incidents.filter((i) => i.severity === "maintenance").length} />
        <MetricCard label="Avg Duration" value={avgDuration > 0 ? formatDur(avgDuration) : "—"} />
      </div>

      {/* Incident timeline chart (simple bar representation) */}
      {resolved.length > 0 && (
        <div className="rounded-lg p-4" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: "var(--db-text)" }}>Incident History</h3>
          <div className="space-y-2">
            {resolved.slice(0, 20).map((inc) => {
              const sevColor = inc.severity === "critical" ? "#ef4444" : inc.severity === "major" ? "#f59e0b" : "#3b82f6";
              const maxDur = Math.max(...resolved.map((r) => r.duration ?? 0));
              const barWidth = maxDur > 0 ? Math.max(5, ((inc.duration ?? 0) / maxDur) * 100) : 5;
              return (
                <div key={inc.id} className="flex items-center gap-3">
                  <span className="text-xs w-20 flex-shrink-0" style={{ color: "var(--db-text-muted)" }}>
                    {new Date(inc.startedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                  <div
                    className="h-5 rounded"
                    style={{ background: sevColor, width: `${barWidth}%`, minWidth: "4px" }}
                    title={`${inc.title} — ${formatDur(inc.duration ?? 0)}`}
                  />
                  <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                    {formatDur(inc.duration ?? 0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDur(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
