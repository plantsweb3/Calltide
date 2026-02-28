"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

interface DSARRequest {
  id: string;
  requestedBy: string;
  requestType: string;
  status: string;
  dataDescription: string | null;
  verifiedAt: string | null;
  processingStartedAt: string | null;
  completedAt: string | null;
  deletedRecords: Record<string, number> | null;
  denialReason: string | null;
  createdAt: string;
}

interface DSARDetail {
  request: DSARRequest;
  recordCounts: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  received: "#f59e0b",
  verified: "#3b82f6",
  processing: "#8b5cf6",
  completed: "#22c55e",
  denied: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  received: "Received",
  verified: "Verified",
  processing: "Processing",
  completed: "Completed",
  denied: "Denied",
};

export default function DSARPage() {
  const [requests, setRequests] = useState<DSARRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DSARDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newForm, setNewForm] = useState({ requestedBy: "", requestType: "ccpa" as string, dataDescription: "" });

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dsar");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch {
      toast.error("Failed to load DSAR requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const fetchDetail = async (id: string) => {
    setDetailLoading(true);
    setSelectedId(id);
    try {
      const res = await fetch(`/api/admin/dsar/${id}`);
      if (res.ok) {
        setDetail(await res.json());
      }
    } catch {
      toast.error("Failed to load request details");
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, denialReason?: string) => {
    try {
      const res = await fetch(`/api/admin/dsar/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, denialReason }),
      });
      if (res.ok) {
        toast.success(`Status updated to ${status}`);
        fetchRequests();
        if (selectedId === id) fetchDetail(id);
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const executeDeletion = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/dsar/${id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Deletion complete — ${Object.values(data.deletedRecords as Record<string, number>).reduce((a, b) => a + b, 0)} records deleted`);
        setShowDeleteConfirm(false);
        fetchRequests();
        fetchDetail(id);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to execute deletion");
      }
    } catch {
      toast.error("Failed to execute deletion");
    }
  };

  const createRequest = async () => {
    if (!newForm.requestedBy.trim()) return;
    try {
      const res = await fetch("/api/admin/dsar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      if (res.ok) {
        toast.success("DSAR request created");
        setShowNewModal(false);
        setNewForm({ requestedBy: "", requestType: "ccpa", dataDescription: "" });
        fetchRequests();
      }
    } catch {
      toast.error("Failed to create request");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-body), system-ui, sans-serif", color: "var(--db-text)" }}
          >
            Data Subject Access Requests
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
            Manage GDPR/CCPA data deletion and access requests
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="rounded-lg px-4 py-2.5 text-sm font-medium"
          style={{ background: "var(--db-accent)", color: "#fff" }}
        >
          New DSAR Request
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
        {/* Request list */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
        >
          {loading ? (
            <div className="p-8 text-center" style={{ color: "var(--db-text-muted)" }}>Loading...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center" style={{ color: "var(--db-text-muted)" }}>
              No DSAR requests yet
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--db-border)" }}>
              {requests.map((r) => (
                <button
                  key={r.id}
                  onClick={() => fetchDetail(r.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
                  style={{
                    background: selectedId === r.id ? "var(--db-hover)" : "transparent",
                  }}
                  onMouseEnter={(e) => { if (selectedId !== r.id) e.currentTarget.style.background = "var(--db-hover)"; }}
                  onMouseLeave={(e) => { if (selectedId !== r.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--db-text)" }}>
                      {r.requestedBy}
                    </p>
                    <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                      {r.requestType.toUpperCase()} &middot; {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: `${STATUS_COLORS[r.status]}20`,
                      color: STATUS_COLORS[r.status],
                    }}
                  >
                    {STATUS_LABELS[r.status] || r.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div
          className="rounded-xl p-5 space-y-5"
          style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
        >
          {!detail && !detailLoading && (
            <p className="text-sm text-center py-8" style={{ color: "var(--db-text-muted)" }}>
              Select a request to view details
            </p>
          )}

          {detailLoading && (
            <p className="text-sm text-center py-8" style={{ color: "var(--db-text-muted)" }}>Loading...</p>
          )}

          {detail && !detailLoading && (
            <>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
                  {detail.request.requestedBy}
                </h3>
                <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
                  Type: {detail.request.requestType.toUpperCase()} &middot;
                  Status: {STATUS_LABELS[detail.request.status]} &middot;
                  Created: {new Date(detail.request.createdAt).toLocaleString()}
                </p>
                {detail.request.dataDescription && (
                  <p className="text-xs mt-2" style={{ color: "var(--db-text-secondary)" }}>
                    {detail.request.dataDescription}
                  </p>
                )}
              </div>

              {/* Record counts */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--db-text-muted)" }}>
                  Records Found
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(detail.recordCounts).map(([table, count]) => (
                    <div
                      key={table}
                      className="rounded-lg p-2 text-center"
                      style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)" }}
                    >
                      <p className="text-lg font-bold" style={{ color: "var(--db-text)" }}>{count}</p>
                      <p className="text-[10px]" style={{ color: "var(--db-text-muted)" }}>{table}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-2 font-medium" style={{ color: "var(--db-text)" }}>
                  Total: {Object.values(detail.recordCounts).reduce((a, b) => a + b, 0)} records
                </p>
              </div>

              {/* Completed — show deleted records */}
              {detail.request.status === "completed" && detail.request.deletedRecords && (
                <div
                  className="rounded-lg p-3"
                  style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
                >
                  <p className="text-xs font-medium" style={{ color: "#22c55e" }}>
                    Deletion completed at {detail.request.completedAt ? new Date(detail.request.completedAt).toLocaleString() : "—"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
                    Deleted: {Object.entries(detail.request.deletedRecords).map(([t, c]) => `${c} ${t}`).join(", ")}
                  </p>
                </div>
              )}

              {/* Denied */}
              {detail.request.status === "denied" && detail.request.denialReason && (
                <div
                  className="rounded-lg p-3"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <p className="text-xs font-medium" style={{ color: "#ef4444" }}>Denial Reason</p>
                  <p className="text-xs mt-1" style={{ color: "var(--db-text)" }}>{detail.request.denialReason}</p>
                </div>
              )}

              {/* Actions */}
              {detail.request.status !== "completed" && detail.request.status !== "denied" && (
                <div className="flex flex-wrap gap-2">
                  {detail.request.status === "received" && (
                    <button
                      onClick={() => updateStatus(detail.request.id, "verified")}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium"
                      style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}
                    >
                      Verify
                    </button>
                  )}
                  {(detail.request.status === "verified" || detail.request.status === "received") && (
                    <button
                      onClick={() => updateStatus(detail.request.id, "processing")}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium"
                      style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.2)" }}
                    >
                      Start Processing
                    </button>
                  )}
                  {(detail.request.status === "processing" || detail.request.status === "verified") && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                    >
                      Execute Deletion
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const reason = prompt("Denial reason:");
                      if (reason) updateStatus(detail.request.id, "denied", reason);
                    }}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium"
                    style={{ color: "var(--db-text-muted)", border: "1px solid var(--db-border)" }}
                  >
                    Deny
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* New DSAR Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowNewModal(false)}>
          <div
            className="rounded-xl p-6 w-full max-w-md space-y-4"
            style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>New DSAR Request</h3>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                Phone or Email
              </label>
              <input
                type="text"
                value={newForm.requestedBy}
                onChange={(e) => setNewForm({ ...newForm, requestedBy: e.target.value })}
                placeholder="e.g. +15125551234 or email@example.com"
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>Type</label>
              <select
                value={newForm.requestType}
                onChange={(e) => setNewForm({ ...newForm, requestType: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
              >
                <option value="ccpa">CCPA</option>
                <option value="gdpr">GDPR</option>
                <option value="manual">Manual</option>
                <option value="offboarding">Offboarding</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                Description (optional)
              </label>
              <textarea
                value={newForm.dataDescription}
                onChange={(e) => setNewForm({ ...newForm, dataDescription: e.target.value })}
                rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowNewModal(false)}
                className="rounded-lg px-4 py-2 text-sm"
                style={{ color: "var(--db-text-muted)" }}
              >
                Cancel
              </button>
              <button
                onClick={createRequest}
                disabled={!newForm.requestedBy.trim()}
                className="rounded-lg px-4 py-2 text-sm font-medium"
                style={{ background: "var(--db-accent)", color: "#fff", opacity: newForm.requestedBy.trim() ? 1 : 0.5 }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="rounded-xl p-6 w-full max-w-md space-y-4"
            style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold" style={{ color: "#ef4444" }}>Confirm Data Deletion</h3>
            <p className="text-sm" style={{ color: "var(--db-text)" }}>
              This will permanently delete <strong>{Object.values(detail.recordCounts).reduce((a, b) => a + b, 0)}</strong> records
              across <strong>{Object.keys(detail.recordCounts).filter((k) => detail.recordCounts[k] > 0).length}</strong> tables
              for <strong>{detail.request.requestedBy}</strong>.
            </p>
            <p className="text-xs" style={{ color: "#f87171" }}>
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg px-4 py-2 text-sm"
                style={{ color: "var(--db-text-muted)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => executeDeletion(detail.request.id)}
                className="rounded-lg px-4 py-2 text-sm font-medium"
                style={{ background: "#ef4444", color: "#fff" }}
              >
                Delete All Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
