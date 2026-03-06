"use client";

import { useState, useEffect } from "react";

interface FeedbackItem {
  id: string;
  businessId: string;
  businessName: string | null;
  type: string;
  category: string;
  title: string;
  description: string;
  status: string;
  adminResponse: string | null;
  adminRespondedAt: string | null;
  priority: string | null;
  votes: number;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
}

const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  acknowledged: "#8b5cf6",
  in_progress: "#f59e0b",
  resolved: "#22c55e",
  declined: "#94a3b8",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#94a3b8",
  medium: "#3b82f6",
  high: "#f59e0b",
  critical: "#ef4444",
};

const STATUS_OPTIONS = ["new", "acknowledged", "in_progress", "resolved", "declined"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, new: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  function fetchFeedback() {
    setError(null);
    const url = filter ? `/api/admin/feedback?status=${filter}` : "/api/admin/feedback";
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        setItems(d.items || []);
        setStats(d.stats || { total: 0, new: 0, inProgress: 0, resolved: 0 });
      })
      .catch(() => setError("Failed to load feedback"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setLoading(true);
    fetchFeedback();
  }, [filter]);

  async function updateItem(id: string, updates: Record<string, string>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data.item } : i)));
        if (updates.adminResponse) {
          setRespondingTo(null);
          setResponseText("");
        }
      }
    } catch {
      setError("Failed to update feedback");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--db-accent)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>Client Feedback</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          Review and respond to client feedback, feature requests, and bug reports.
        </p>
      </div>

      {error && (
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          <button onClick={() => { setError(null); setLoading(true); fetchFeedback(); }} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>Retry</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total },
          { label: "New", value: stats.new, color: "#3b82f6" },
          { label: "In Progress", value: stats.inProgress, color: "#f59e0b" },
          { label: "Resolved", value: stats.resolved, color: "#22c55e" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg p-4" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
            <p className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{s.label}</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: s.color ?? "var(--db-text)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("")}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            background: filter === "" ? "var(--db-accent)" : "var(--db-hover)",
            color: filter === "" ? "#fff" : "var(--db-text-muted)",
          }}
        >
          All
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors"
            style={{
              background: filter === s ? "var(--db-accent)" : "var(--db-hover)",
              color: filter === s ? "#fff" : "var(--db-text-muted)",
            }}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Feedback list */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-lg p-8 text-center" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
            <p style={{ color: "var(--db-text-muted)" }}>No feedback items found.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg p-4"
              style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{item.title}</h3>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                      style={{ background: `${STATUS_COLORS[item.status] ?? "#94a3b8"}20`, color: STATUS_COLORS[item.status] ?? "#94a3b8" }}
                    >
                      {item.status.replace(/_/g, " ")}
                    </span>
                    {item.priority && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                        style={{ background: `${PRIORITY_COLORS[item.priority] ?? "#94a3b8"}20`, color: PRIORITY_COLORS[item.priority] ?? "#94a3b8" }}
                      >
                        {item.priority}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
                    {item.businessName || "Unknown"} &middot; {item.type.replace(/_/g, " ")} &middot; {item.category} &middot; {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-2 text-sm" style={{ color: "var(--db-text-secondary)" }}>{item.description}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1">
                  <select
                    value={item.status}
                    onChange={(e) => updateItem(item.id, { status: e.target.value })}
                    className="rounded px-2 py-1 text-[10px] outline-none"
                    style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                  <select
                    value={item.priority ?? "medium"}
                    onChange={(e) => updateItem(item.id, { priority: e.target.value })}
                    className="rounded px-2 py-1 text-[10px] outline-none"
                    style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Admin response */}
              {item.adminResponse && (
                <div className="mt-3 rounded-lg p-3" style={{ background: "var(--db-hover)" }}>
                  <p className="text-xs font-medium" style={{ color: "var(--db-accent)" }}>Admin Response</p>
                  <p className="mt-1 text-sm" style={{ color: "var(--db-text)" }}>{item.adminResponse}</p>
                </div>
              )}

              {/* Respond button / form */}
              {respondingTo === item.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write a response to the client..."
                    rows={3}
                    className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateItem(item.id, { adminResponse: responseText })}
                      disabled={saving || !responseText.trim()}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                      style={{ background: "var(--db-accent)" }}
                    >
                      {saving ? "Saving..." : "Send Response"}
                    </button>
                    <button
                      onClick={() => { setRespondingTo(null); setResponseText(""); }}
                      className="rounded-lg px-3 py-1.5 text-xs"
                      style={{ color: "var(--db-text-muted)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setRespondingTo(item.id); setResponseText(item.adminResponse ?? ""); }}
                  className="mt-2 text-xs font-medium"
                  style={{ color: "var(--db-accent)" }}
                >
                  {item.adminResponse ? "Edit Response" : "Respond"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
