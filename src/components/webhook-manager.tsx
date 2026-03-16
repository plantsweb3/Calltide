"use client";

import { useState, useEffect, useCallback } from "react";

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  status: string;
  failureCount: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastFailureReason: string | null;
  createdAt: string;
}

const ALL_EVENTS = [
  { value: "appointment.created", label: "Appointment Created" },
  { value: "appointment.cancelled", label: "Appointment Cancelled" },
  { value: "appointment.rescheduled", label: "Appointment Rescheduled" },
  { value: "call.completed", label: "Call Completed" },
  { value: "customer.created", label: "Customer Created" },
  { value: "estimate.created", label: "Estimate Created" },
  { value: "message.taken", label: "Message Taken" },
];

export default function WebhookManager() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; status: string; error?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEndpoints = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/webhooks");
      if (res.ok) setEndpoints(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEndpoints(); }, [fetchEndpoints]);

  async function handleAdd() {
    if (!newUrl || newEvents.length === 0) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, events: newEvents }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create webhook");
        return;
      }
      const data = await res.json();
      setCreatedSecret(data.secret);
      setShowAdd(false);
      setNewUrl("");
      setNewEvents([]);
      fetchEndpoints();
    } catch {
      setError("Network error");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/dashboard/webhooks/${id}`, { method: "DELETE" });
      setEndpoints((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // silent
    }
  }

  async function handleToggle(id: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/dashboard/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setEndpoints((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: newStatus, failureCount: newStatus === "active" ? 0 : e.failureCount } : e)),
        );
      }
    } catch {
      // silent
    }
  }

  async function handleTest(id: string) {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await fetch(`/api/dashboard/webhooks/${id}/test`, { method: "POST" });
      const data = await res.json();
      setTestResult({ id, status: data.status, error: data.error });
    } catch {
      setTestResult({ id, status: "failed", error: "Network error" });
    } finally {
      setTestingId(null);
    }
  }

  function toggleEvent(event: string) {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  }

  const statusColors: Record<string, string> = {
    active: "#4ade80",
    paused: "#fbbf24",
  };

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "var(--db-card)",
        border: "1px solid var(--db-border)",
        boxShadow: "var(--db-card-shadow)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--db-text-muted)" }}
        >
          Webhooks
        </h3>
        {!showAdd && endpoints.length < 5 && (
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ background: "var(--db-accent)", color: "#fff" }}
          >
            + Add Endpoint
          </button>
        )}
      </div>

      <p className="text-xs mb-4" style={{ color: "var(--db-text-secondary)" }}>
        Send real-time event data to your systems. Connect to Zapier, Make, or any URL that accepts webhooks.
      </p>

      {/* Created secret banner */}
      {createdSecret && (
        <div
          className="rounded-lg p-3 mb-4 text-sm"
          style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "var(--db-text)" }}
        >
          <div className="font-semibold mb-1">Signing Secret (shown once):</div>
          <code className="text-xs break-all" style={{ color: "var(--db-accent)" }}>{createdSecret}</code>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { navigator.clipboard.writeText(createdSecret); }}
              className="rounded px-2 py-1 text-xs font-medium"
              style={{ background: "var(--db-hover)", color: "var(--db-text)" }}
            >
              Copy
            </button>
            <button
              onClick={() => setCreatedSecret(null)}
              className="rounded px-2 py-1 text-xs font-medium"
              style={{ color: "var(--db-text-muted)" }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg p-3 mb-4 text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
          {error}
        </div>
      )}

      {/* Add endpoint form */}
      {showAdd && (
        <div
          className="rounded-lg p-4 mb-4 space-y-3"
          style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
        >
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
              Endpoint URL
            </label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/..."
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{
                background: "var(--db-bg)",
                border: "1px solid var(--db-border)",
                color: "var(--db-text)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--db-text-muted)" }}>
              Events
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_EVENTS.map((ev) => (
                <button
                  key={ev.value}
                  onClick={() => toggleEvent(ev.value)}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                  style={{
                    background: newEvents.includes(ev.value) ? "var(--db-accent)" : "var(--db-hover)",
                    color: newEvents.includes(ev.value) ? "#fff" : "var(--db-text-muted)",
                  }}
                >
                  {ev.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={adding || !newUrl || newEvents.length === 0}
              className="rounded-lg px-4 py-2 text-xs font-medium disabled:opacity-50"
              style={{ background: "var(--db-accent)", color: "#fff" }}
            >
              {adding ? "Creating..." : "Create Endpoint"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewUrl(""); setNewEvents([]); setError(null); }}
              className="rounded-lg px-4 py-2 text-xs font-medium"
              style={{ color: "var(--db-text-muted)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Endpoints list */}
      {loading ? (
        <div className="text-sm py-6 text-center" style={{ color: "var(--db-text-muted)" }}>Loading...</div>
      ) : endpoints.length === 0 && !showAdd ? (
        <div className="text-sm py-6 text-center" style={{ color: "var(--db-text-muted)" }}>
          No webhook endpoints configured.
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <div
              key={ep.id}
              className="rounded-lg p-3"
              style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0"
                    style={{ background: statusColors[ep.status] || "#94a3b8" }}
                  />
                  <span className="text-xs font-medium truncate" style={{ color: "var(--db-text)" }}>
                    {ep.url}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleTest(ep.id)}
                    disabled={testingId === ep.id}
                    className="rounded px-2 py-1 text-[11px] font-medium"
                    style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
                  >
                    {testingId === ep.id ? "..." : "Test"}
                  </button>
                  <button
                    onClick={() => handleToggle(ep.id, ep.status)}
                    className="rounded px-2 py-1 text-[11px] font-medium"
                    style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
                  >
                    {ep.status === "active" ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => handleDelete(ep.id)}
                    className="rounded px-2 py-1 text-[11px] font-medium"
                    style={{ color: "#ef4444" }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-1">
                {(ep.events as string[]).map((ev) => (
                  <span
                    key={ev}
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
                  >
                    {ev}
                  </span>
                ))}
              </div>

              {ep.failureCount > 0 && (
                <div className="text-[11px] mt-1" style={{ color: "#f59e0b" }}>
                  {ep.failureCount} consecutive failure{ep.failureCount > 1 ? "s" : ""}
                  {ep.lastFailureReason ? ` — ${ep.lastFailureReason}` : ""}
                </div>
              )}

              {testResult?.id === ep.id && (
                <div
                  className="text-[11px] mt-1"
                  style={{ color: testResult.status === "delivered" ? "#4ade80" : "#ef4444" }}
                >
                  Test: {testResult.status}{testResult.error ? ` — ${testResult.error}` : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Coming Soon integrations */}
      <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--db-border)" }}>
        <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--db-text-muted)" }}>
          Native Integrations
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: "Zapier", desc: "Connect via webhook URL above" },
            { name: "ServiceTitan", desc: "Coming Soon" },
            { name: "Jobber", desc: "Coming Soon" },
          ].map((integration) => (
            <div
              key={integration.name}
              className="rounded-lg p-3 text-center"
              style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
            >
              <div className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                {integration.name}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--db-text-muted)" }}>
                {integration.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
