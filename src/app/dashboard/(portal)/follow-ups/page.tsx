"use client";

import { useEffect, useState, useCallback } from "react";
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

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchFollowUps = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (tab !== "all") params.set("status", tab);
      const res = await fetch(`/api/dashboard/follow-ups?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFollowUps(data.followUps || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tab]);

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
          {row.customerName || row.customerPhone || "—"}
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
          {row.status === "pending" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => updateStatus(row.id, "in_progress")}
              disabled={updating === row.id}
            >
              Start
            </Button>
          )}
          {(row.status === "pending" || row.status === "in_progress") && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => updateStatus(row.id, "completed")}
              disabled={updating === row.id}
            >
              Done
            </Button>
          )}
          {row.status !== "dismissed" && row.status !== "completed" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateStatus(row.id, "dismissed")}
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
      />

      {/* Tab filters */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: "var(--db-surface)" }}>
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
        />
      )}
    </div>
  );
}
