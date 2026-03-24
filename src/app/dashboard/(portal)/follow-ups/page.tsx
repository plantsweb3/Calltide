"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import DataTable, { type Column } from "@/components/data-table";
import Button from "@/components/ui/button";
import StatusBadge, { statusToVariant } from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import { TableSkeleton } from "@/components/skeleton";

interface FollowUp {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  callId: string | null;
  completedAt: string | null;
  createdAt: string;
}

const priorityColors: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f59e0b",
  normal: "#3b82f6",
  low: "#94a3b8",
};

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
] as const;

const SORT_OPTIONS = [
  { value: "dueDate", label: "Due Date" },
  { value: "priority", label: "Priority" },
  { value: "createdAt", label: "Created" },
] as const;

const DUE_DATE_FILTERS = [
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due Today" },
  { value: "this_week", label: "Due This Week" },
] as const;

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [updating, setUpdating] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [dueDateFilter, setDueDateFilter] = useState("all");
  const [overdueCount, setOverdueCount] = useState(0);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);

  const fetchFollowUps = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (tab !== "all") params.set("status", tab);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      if (dueDateFilter !== "all") params.set("dueDateFilter", dueDateFilter);
      const res = await fetch(`/api/dashboard/follow-ups?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFollowUps(data.followUps || []);
        setOverdueCount(data.overdueCount || 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tab, sortBy, sortOrder, dueDateFilter]);

  useEffect(() => {
    setLoading(true);
    fetchFollowUps();
  }, [fetchFollowUps]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      await fetch(`/api/dashboard/follow-ups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchFollowUps();
    } finally {
      setUpdating(null);
    }
  }

  const pendingCount = followUps.filter((f) => f.status === "pending").length;
  const urgentCount = followUps.filter((f) => f.priority === "urgent" || f.priority === "high").length;

  const columns: Column<FollowUp>[] = [
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ background: priorityColors[row.priority] || priorityColors.normal }}
          />
          <span className="text-xs font-medium capitalize">{row.priority}</span>
        </div>
      ),
    },
    {
      key: "title",
      label: "Follow-up",
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium truncate" style={{ color: "var(--db-text)" }}>{row.title}</p>
          {row.description && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--db-text-muted)" }}>
              {row.description.slice(0, 80)}{row.description.length > 80 ? "..." : ""}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
      sortable: true,
      render: (row) => (
        <span style={{ color: "var(--db-text)" }}>
          {row.customerName || row.customerPhone || "\u2014"}
        </span>
      ),
    },
    {
      key: "dueDate",
      label: "Due",
      sortable: true,
      render: (row) => {
        const due = new Date(row.dueDate);
        const now = new Date();
        const isOverdue = due < now && row.status !== "completed";
        const isToday = due.toDateString() === now.toDateString();
        return (
          <span
            className="text-sm font-medium"
            style={{
              color: isOverdue ? "#ef4444" : isToday ? "#f59e0b" : "var(--db-text-muted)",
            }}
          >
            {isOverdue ? "Overdue" : isToday ? "Today" : due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <StatusBadge label={row.status} variant={statusToVariant(row.status)} />
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); setEditingFollowUp(row); }}
          >
            Edit
          </Button>
          {row.status === "pending" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => { e.stopPropagation(); updateStatus(row.id, "in_progress"); }}
              disabled={updating === row.id}
            >
              Start
            </Button>
          )}
          {(row.status === "pending" || row.status === "in_progress") && (
            <Button
              size="sm"
              variant="primary"
              onClick={(e) => { e.stopPropagation(); updateStatus(row.id, "completed"); }}
              disabled={updating === row.id}
            >
              Done
            </Button>
          )}
          {row.status !== "dismissed" && row.status !== "completed" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); updateStatus(row.id, "dismissed"); }}
              disabled={updating === row.id}
            >
              Dismiss
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <TableSkeleton />;

  return (
    <div>
      <PageHeader
        title="Follow-ups"
        description={
          pendingCount > 0
            ? `${pendingCount} pending${urgentCount > 0 ? ` (${urgentCount} urgent)` : ""}`
            : "All caught up"
        }
        actions={
          overdueCount > 0 ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}
            >
              {overdueCount} overdue
            </span>
          ) : undefined
        }
      />

      {/* Controls row: Tab filters + Sort + Due Date Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Tab filters */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--db-surface)" }}>
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2 text-sm font-medium rounded-md transition-all"
              style={{
                background: tab === t.key ? "var(--db-card)" : "transparent",
                color: tab === t.key ? "var(--db-text)" : "var(--db-text-muted)",
                boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Due date filter */}
          <select
            value={dueDateFilter}
            onChange={(e) => setDueDateFilter(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium"
            style={{
              background: "var(--db-surface)",
              borderColor: "var(--db-border)",
              color: "var(--db-text)",
            }}
          >
            {DUE_DATE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                Show: {f.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium"
            style={{
              background: "var(--db-surface)",
              borderColor: "var(--db-border)",
              color: "var(--db-text)",
            }}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: "var(--db-surface)",
              borderColor: "var(--db-border)",
              color: "var(--db-text-muted)",
            }}
            title={sortOrder === "asc" ? "Ascending" : "Descending"}
          >
            {sortOrder === "asc" ? "\u2191" : "\u2193"}
          </button>
        </div>
      </div>

      {followUps.length === 0 ? (
        <EmptyState
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
          title={tab === "pending" ? "No pending follow-ups" : "No follow-ups found"}
          description="Follow-ups are automatically created when Maria takes a message during a call. You can also create them manually."
        />
      ) : (
        <DataTable
          columns={columns}
          data={followUps}
          onRowClick={(row) => setEditingFollowUp(row)}
        />
      )}

      {editingFollowUp && (
        <EditFollowUpModal
          followUp={editingFollowUp}
          onClose={() => setEditingFollowUp(null)}
          onSaved={() => {
            setEditingFollowUp(null);
            fetchFollowUps();
          }}
        />
      )}
    </div>
  );
}

// ── Edit Follow-Up Modal ──

function EditFollowUpModal({
  followUp,
  onClose,
  onSaved,
}: {
  followUp: FollowUp;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(followUp.title);
  const [description, setDescription] = useState(followUp.description || "");
  const [dueDate, setDueDate] = useState(followUp.dueDate ? followUp.dueDate.slice(0, 16) : "");
  const [priority, setPriority] = useState(followUp.priority);
  const [assignedTo, setAssignedTo] = useState(followUp.assignedTo || "");
  const [status, setStatus] = useState(followUp.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/dashboard/follow-ups/${followUp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          priority,
          assignedTo: assignedTo.trim() || null,
          status,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update follow-up");
        return;
      }
      toast.success("Follow-up updated");
      onSaved();
    } catch {
      setError("Failed to update follow-up");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-followup-title"
        className="modal-content w-full max-w-lg rounded-xl p-6"
        style={{
          background: "var(--db-surface)",
          border: "1px solid var(--db-border)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="edit-followup-title"
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--db-text)" }}
        >
          Edit Follow-up
        </h2>
        {followUp.customerName && (
          <p className="text-xs mb-4" style={{ color: "var(--db-text-muted)" }}>
            Customer: {followUp.customerName}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                Due Date
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                Assigned To
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Technician name..."
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
