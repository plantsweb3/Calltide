"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import DataTable, { type Column } from "@/components/data-table";
import Button from "@/components/ui/button";
import StatusBadge, { statusToVariant } from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import { TableSkeleton } from "@/components/skeleton";
import PhoneLink from "@/components/phone-link";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

interface Callback {
  id: string;
  callId: string | null;
  customerPhone: string;
  customerName: string | null;
  reason: string | null;
  requestedTime: string;
  status: string;
  outboundCallId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

interface CallbackStats {
  total: number;
  scheduled: number;
  calling: number;
  completed: number;
  failed: number;
  cancelled: number;
}

type TabKey = "all" | "pending" | "completed" | "overdue";

export default function CallbacksPage() {
  const [lang] = useLang();

  const STATUS_TABS: { key: TabKey; label: string }[] = [
    { key: "all", label: t("callbacks.tab.all", lang) },
    { key: "pending", label: t("callbacks.tab.pending", lang) },
    { key: "completed", label: t("callbacks.tab.completed", lang) },
    { key: "overdue", label: t("callbacks.tab.overdue", lang) },
  ];

  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  const [stats, setStats] = useState<CallbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Callback | null>(null);

  const fetchCallbacks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));

      // Map tab to API status param
      if (tab === "pending") {
        params.set("status", "scheduled");
      } else if (tab === "completed") {
        params.set("status", "completed");
      }
      // "overdue" is filtered client-side from scheduled callbacks
      // "all" sends no status filter

      const res = await fetch(`/api/dashboard/callbacks?${params}`);
      if (res.ok) {
        const data = await res.json();
        let rows: Callback[] = data.callbacks || [];

        // Client-side filter for overdue: scheduled callbacks past their requested time
        if (tab === "overdue") {
          const now = new Date();
          rows = rows.filter(
            (cb) => cb.status === "scheduled" && new Date(cb.requestedTime) < now
          );
        }

        setCallbacks(rows);
        setStats(data.stats || null);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    setLoading(true);
    fetchCallbacks();
  }, [fetchCallbacks]);

  async function updateStatus(id: string, status: "completed" | "cancelled") {
    setUpdating(id);
    try {
      const res = await fetch("/api/dashboard/callbacks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        toast.success(
          status === "completed"
            ? t("callbacks.completed", lang)
            : t("callbacks.cancelled", lang)
        );
        await fetchCallbacks();
      } else {
        const data = await res.json();
        toast.error(data.error || t("callbacks.updateFailed", lang));
      }
    } catch {
      toast.error(t("callbacks.updateFailed", lang));
    } finally {
      setUpdating(null);
    }
  }

  const scheduledCount = stats?.scheduled ?? 0;

  const columns: Column<Callback>[] = [
    {
      key: "customerName",
      label: t("callbacks.col.customer", lang),
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-medium" style={{ color: "var(--db-text)" }}>
            {row.customerName || "\u2014"}
          </span>
          <div className="mt-0.5">
            <PhoneLink
              phone={row.customerPhone}
              className="text-xs font-medium hover:underline"
            />
          </div>
        </div>
      ),
    },
    {
      key: "requestedTime",
      label: t("callbacks.col.scheduledTime", lang),
      sortable: true,
      render: (row) => {
        const dt = new Date(row.requestedTime);
        const now = new Date();
        const isOverdue = dt < now && row.status === "scheduled";
        const isToday = dt.toDateString() === now.toDateString();
        return (
          <div>
            <span
              className="text-sm font-medium"
              style={{
                color: isOverdue
                  ? "var(--db-danger)"
                  : isToday
                    ? "var(--db-warning-alt)"
                    : "var(--db-text)",
              }}
            >
              {isOverdue && (
                <span className="text-xs mr-1">
                  {t("callbacks.overdue", lang)}
                </span>
              )}
              {dt.toLocaleDateString(lang === "es" ? "es-MX" : "en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--db-text-muted)" }}
            >
              {dt.toLocaleTimeString(lang === "es" ? "es-MX" : "en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        );
      },
    },
    {
      key: "reason",
      label: t("callbacks.col.reason", lang),
      render: (row) => (
        <span
          className="text-sm"
          style={{
            color: row.reason ? "var(--db-text)" : "var(--db-text-muted)",
          }}
        >
          {row.reason
            ? row.reason.length > 60
              ? `${row.reason.slice(0, 60)}...`
              : row.reason
            : t("callbacks.noReason", lang)}
        </span>
      ),
    },
    {
      key: "status",
      label: t("callbacks.col.status", lang),
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
          {row.customerPhone && (
            <a
              href={`tel:${row.customerPhone.replace(/\D/g, "").startsWith("1") ? `+${row.customerPhone.replace(/\D/g, "")}` : `+1${row.customerPhone.replace(/\D/g, "")}`}`}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: "var(--db-success-bg)",
                color: "var(--db-success)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {t("callbacks.callBack", lang)}
            </a>
          )}
          {row.status === "scheduled" && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setRescheduleTarget(row);
                }}
              >
                {t("callbacks.reschedule", lang)}
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  updateStatus(row.id, "completed");
                }}
                disabled={updating === row.id}
              >
                {t("callbacks.complete", lang)}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  updateStatus(row.id, "cancelled");
                }}
                disabled={updating === row.id}
              >
                {t("callbacks.cancelCallback", lang)}
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <TableSkeleton />;

  return (
    <div>
      <PageHeader
        title={t("callbacks.title", lang)}
        description={
          scheduledCount > 0
            ? t("callbacks.description", lang, { n: scheduledCount })
            : t("callbacks.allCaughtUp", lang)
        }
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            {t("callbacks.scheduleCallback", lang)}
          </Button>
        }
      />

      {/* Stats bar */}
      {stats && stats.total > 0 && (
        <div className="flex flex-wrap gap-4 mb-6">
          {[
            {
              label: t("callbacks.stats.total", lang),
              value: stats.total,
              color: "var(--db-text)",
            },
            {
              label: t("callbacks.stats.scheduled", lang),
              value: stats.scheduled,
              color: "var(--db-info)",
            },
            {
              label: t("callbacks.stats.completed", lang),
              value: stats.completed,
              color: "var(--db-success)",
            },
            {
              label: t("callbacks.stats.failed", lang),
              value: stats.failed,
              color: "var(--db-danger)",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
              style={{
                background: "var(--db-surface)",
                border: "1px solid var(--db-border)",
              }}
            >
              <span
                className="text-lg font-semibold tabular-nums"
                style={{ color: stat.color }}
              >
                {stat.value}
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: "var(--db-text-muted)" }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div
          className="flex gap-1 p-1 rounded-lg"
          style={{ background: "var(--db-surface)" }}
        >
          {STATUS_TABS.map((tab_item) => (
            <button
              key={tab_item.key}
              onClick={() => {
                setTab(tab_item.key);
                setPage(1);
              }}
              className="px-4 py-2 text-sm font-medium rounded-md transition-all"
              style={{
                background:
                  tab === tab_item.key ? "var(--db-card)" : "transparent",
                color:
                  tab === tab_item.key
                    ? "var(--db-text)"
                    : "var(--db-text-muted)",
                boxShadow:
                  tab === tab_item.key
                    ? "0 1px 3px rgba(0,0,0,0.1)"
                    : "none",
              }}
            >
              {tab_item.label}
            </button>
          ))}
        </div>
      </div>

      {callbacks.length === 0 ? (
        <EmptyState
          icon={
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          }
          title={
            tab === "all"
              ? t("callbacks.emptyTitle", lang)
              : t("callbacks.emptyFiltered", lang)
          }
          description={t("callbacks.emptyDescription", lang)}
          action={{
            label: t("callbacks.scheduleCallback", lang),
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={callbacks}
          pagination={
            totalPages > 1
              ? {
                  page,
                  totalPages,
                  total,
                  onPageChange: setPage,
                }
              : undefined
          }
        />
      )}

      {showCreateModal && (
        <ScheduleCallbackModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchCallbacks();
          }}
        />
      )}

      {rescheduleTarget && (
        <RescheduleModal
          callback={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSaved={() => {
            setRescheduleTarget(null);
            fetchCallbacks();
          }}
        />
      )}
    </div>
  );
}

// ── Schedule Callback Modal ──

function ScheduleCallbackModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [lang] = useLang();
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      setError(t("callbacks.form.phoneRequired", lang));
      return;
    }
    if (!dateTime) {
      setError(t("callbacks.form.dateRequired", lang));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/callbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: phone.trim(),
          customerName: customerName.trim() || undefined,
          reason: reason.trim() || undefined,
          requestedTime: new Date(dateTime).toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("callbacks.createFailed", lang));
        return;
      }
      toast.success(t("callbacks.created", lang));
      onCreated();
    } catch {
      setError(t("callbacks.createFailed", lang));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="db-modal-backdrop"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-callback-title"
        className="modal-content w-full max-w-lg rounded-xl p-6"
        style={{
          background: "var(--db-surface)",
          border: "1px solid var(--db-border)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="schedule-callback-title"
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--db-text)" }}
        >
          {t("callbacks.scheduleCallback", lang)}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="db-label">
              {t("callbacks.form.phone", lang)} *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("callbacks.form.phonePlaceholder", lang)}
              className="db-input"
              autoFocus
            />
          </div>
          <div>
            <label className="db-label">
              {t("callbacks.form.customerName", lang)}
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t("callbacks.form.customerNamePlaceholder", lang)}
              className="db-input"
            />
          </div>
          <div>
            <label className="db-label">
              {t("callbacks.form.dateTime", lang)} *
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="db-input"
            />
          </div>
          <div>
            <label className="db-label">
              {t("callbacks.form.reason", lang)}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t("callbacks.form.reasonPlaceholder", lang)}
              className="db-input"
              style={{ resize: "vertical" }}
            />
          </div>
          {error && (
            <p className="text-sm" style={{ color: "var(--db-danger)" }}>
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              {t("action.cancel", lang)}
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving
                ? t("callbacks.scheduling", lang)
                : t("callbacks.schedule", lang)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Reschedule Modal ──

function RescheduleModal({
  callback,
  onClose,
  onSaved,
}: {
  callback: Callback;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [lang] = useLang();
  const [dateTime, setDateTime] = useState(
    callback.requestedTime
      ? callback.requestedTime.slice(0, 16)
      : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dateTime) {
      setError(t("callbacks.form.dateRequired", lang));
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Cancel the old one and create a new one with the same details
      const cancelRes = await fetch("/api/dashboard/callbacks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: callback.id, status: "cancelled" }),
      });
      if (!cancelRes.ok) {
        setError(t("callbacks.rescheduleFailed", lang));
        return;
      }

      const createRes = await fetch("/api/dashboard/callbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: callback.customerPhone,
          customerName: callback.customerName || undefined,
          reason: callback.reason || undefined,
          requestedTime: new Date(dateTime).toISOString(),
        }),
      });
      if (!createRes.ok) {
        const data = await createRes.json();
        setError(data.error || t("callbacks.rescheduleFailed", lang));
        return;
      }
      toast.success(t("callbacks.rescheduled", lang));
      onSaved();
    } catch {
      setError(t("callbacks.rescheduleFailed", lang));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="db-modal-backdrop"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-callback-title"
        className="modal-content w-full max-w-md rounded-xl p-6"
        style={{
          background: "var(--db-surface)",
          border: "1px solid var(--db-border)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="reschedule-callback-title"
          className="text-lg font-semibold mb-2"
          style={{ color: "var(--db-text)" }}
        >
          {t("callbacks.rescheduleTitle", lang)}
        </h2>
        {callback.customerName && (
          <p
            className="text-xs mb-4"
            style={{ color: "var(--db-text-muted)" }}
          >
            {callback.customerName} &middot; {callback.customerPhone}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="db-label">
              {t("callbacks.form.dateTime", lang)} *
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="db-input"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-sm" style={{ color: "var(--db-danger)" }}>
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              {t("action.cancel", lang)}
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving
                ? t("callbacks.rescheduling", lang)
                : t("callbacks.reschedule", lang)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
