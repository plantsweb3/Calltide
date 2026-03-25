"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import DataTable, { type Column } from "@/components/data-table";
import AppointmentCalendar from "@/app/dashboard/_components/appointment-calendar";
import { TableSkeleton } from "@/components/skeleton";
import ExportCsvButton from "@/app/dashboard/_components/csv-export";
import Button from "@/components/ui/button";
import StatusBadge, { statusToVariant } from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";
import ConfirmDialog from "@/components/confirm-dialog";
import DateRangePicker, { type DateRange } from "@/components/date-range-picker";
import EmptyState from "@/components/empty-state";
import PhoneLink from "@/components/phone-link";
import { formatPhone } from "@/lib/format";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";
import { useReceptionistName } from "@/app/dashboard/_hooks/use-receptionist-name";

interface Appointment {
  id: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  notes: string | null;
  createdAt: string;
  leadName: string | null;
  leadPhone: string | null;
}

function formatDateTime(date: string, time: string): string {
  const d = new Date(`${date}T${time}`);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

const STATUS_ACTIONS: Record<string, { labelKey: string; label: string; status: string; variant: "primary" | "danger" }[]> = {
  pending: [
    { labelKey: "appointments.confirm", label: "Confirm", status: "confirmed", variant: "primary" },
    { labelKey: "action.cancel", label: "Cancel", status: "cancelled", variant: "danger" },
  ],
  confirmed: [
    { labelKey: "appointments.complete", label: "Complete", status: "completed", variant: "primary" },
    { labelKey: "appointments.noShow", label: "No-Show", status: "no_show", variant: "danger" },
    { labelKey: "action.cancel", label: "Cancel", status: "cancelled", variant: "danger" },
  ],
};

export default function AppointmentsPage() {
  const [lang] = useLang();
  const receptionistName = useReceptionistName();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ status: string; label: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirmAction, setBulkConfirmAction] = useState<{ status: string; label: string } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: toISO(thirtyDaysAgo),
    to: toISO(now),
  });

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/appointments?filter=${filter}`);
      if (!res.ok) throw new Error("Failed to load appointments");
      const data = await res.json();
      setAppointments(data.appointments);
      setSelectedIds(new Set());
    } catch {
      setError("Failed to load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Client-side date filter for list view
  const filteredAppointments = appointments.filter((a) => {
    if (filter === "upcoming") return true; // Calendar shows all upcoming
    return a.date >= dateRange.from && a.date <= dateRange.to;
  });

  async function updateStatus(apptId: string, newStatus: string) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/dashboard/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: apptId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update appointment");
      toast.success(`Appointment ${newStatus.replace(/_/g, " ")}`);
      // Update local state
      setAppointments((prev) =>
        prev.map((a) => (a.id === apptId ? { ...a, status: newStatus } : a))
      );
      if (selected?.id === apptId) {
        setSelected((prev) => prev ? { ...prev, status: newStatus } : null);
      }
      setConfirmAction(null);
    } catch {
      toast.error("Failed to update appointment status");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBulkStatus(status: string) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setBulkLoading(true);
    try {
      const res = await fetch("/api/dashboard/appointments/bulk-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
      });
      if (!res.ok) throw new Error("Failed to update appointments");
      const data = await res.json();
      toast.success(`${data.updated} appointment${data.updated !== 1 ? "s" : ""} ${status.replace(/_/g, " ")}`);

      // Update local state
      setAppointments((prev) =>
        prev.map((a) => (selectedIds.has(a.id) ? { ...a, status } : a))
      );
      setSelectedIds(new Set());
      setBulkConfirmAction(null);
    } catch {
      toast.error("Failed to update appointments");
    } finally {
      setBulkLoading(false);
    }
  }

  function handleAction(action: { status: string; label: string }) {
    if (action.status === "cancelled" || action.status === "no_show") {
      setConfirmAction(action);
    } else {
      updateStatus(selected!.id, action.status);
    }
  }

  const columns: Column<Appointment>[] = [
    {
      key: "dateTime",
      label: `${t("appointments.date", lang)} & ${t("appointments.time", lang)}`,
      render: (row) => formatDateTime(row.date, row.time),
    },
    { key: "service", label: t("appointments.service", lang) },
    {
      key: "caller",
      label: t("appointments.customer", lang),
      render: (row) => row.leadName ? (
        <div>
          <span style={{ color: "var(--db-text)" }}>{row.leadName}</span>
          {row.leadPhone && <div className="mt-0.5"><PhoneLink phone={row.leadPhone} className="text-xs font-medium hover:underline" /></div>}
        </div>
      ) : row.leadPhone ? (
        <PhoneLink phone={row.leadPhone} className="text-sm font-medium hover:underline" />
      ) : "\u2014",
    },
    {
      key: "status",
      label: t("appointments.status", lang),
      render: (row) => (
        <StatusBadge label={row.status} variant={statusToVariant(row.status)} />
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => {
        const actions = STATUS_ACTIONS[row.status];
        if (!actions) return null;
        return (
          <div className="flex items-center gap-1">
            {actions.map((a) => (
              <Button
                key={a.status}
                size="sm"
                variant={a.variant === "danger" ? "ghost" : "primary"}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(row);
                  if (a.status === "cancelled" || a.status === "no_show") {
                    setConfirmAction(a);
                  } else {
                    updateStatus(row.id, a.status);
                  }
                }}
              >
                {t(a.labelKey, lang)}
              </Button>
            ))}
          </div>
        );
      },
    },
  ];

  const showListView = view === "list" || filter === "past";

  return (
    <div>
      <PageHeader
        title={t("appointments.title", lang)}
        actions={
          <div className="flex items-center gap-3">
            {filter === "past" && (
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            )}
            <ExportCsvButton
              data={filteredAppointments}
              columns={[
                { header: "Date", accessor: (r) => r.date },
                { header: "Time", accessor: (r) => r.time },
                { header: "Service", accessor: (r) => r.service },
                { header: "Customer", accessor: (r) => r.leadName || r.leadPhone },
                { header: "Status", accessor: (r) => r.status },
                { header: "Notes", accessor: (r) => r.notes },
              ]}
              filename="appointments"
            />
            {filter === "upcoming" && (
              <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--db-border)" }}>
                <button
                  onClick={() => setView("calendar")}
                  className="px-3 py-2 transition-colors"
                  style={{
                    background: view === "calendar" ? "var(--db-accent)" : "var(--db-card)",
                    color: view === "calendar" ? "#fff" : "var(--db-text-muted)",
                  }}
                  title="Calendar view"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </button>
                <button
                  onClick={() => setView("list")}
                  className="px-3 py-2 transition-colors"
                  style={{
                    background: view === "list" ? "var(--db-accent)" : "var(--db-card)",
                    color: view === "list" ? "#fff" : "var(--db-text-muted)",
                  }}
                  title="List view"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--db-border)" }}>
              <button
                onClick={() => { setFilter("upcoming"); setView("calendar"); setSelectedIds(new Set()); }}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: filter === "upcoming" ? "var(--db-accent)" : "var(--db-card)",
                  color: filter === "upcoming" ? "#fff" : "var(--db-text-muted)",
                }}
              >
                {t("appointments.upcoming", lang)}
              </button>
              <button
                onClick={() => { setFilter("past"); setView("list"); setSelectedIds(new Set()); }}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: filter === "past" ? "var(--db-accent)" : "var(--db-card)",
                  color: filter === "past" ? "#fff" : "var(--db-text-muted)",
                }}
              >
                {t("appointments.past", lang)}
              </button>
            </div>
          </div>
        }
      />

      {error && (
        <div role="alert" aria-live="assertive" className="rounded-xl p-4 mb-4 flex items-center justify-between" style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)" }}>
          <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
          <Button variant="danger" size="sm" onClick={fetchAppointments}>{t("action.retry", lang)}</Button>
        </div>
      )}

      {loading && appointments.length === 0 && !error && <TableSkeleton rows={5} />}

      {!loading && appointments.length === 0 && (
        <EmptyState
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
          title={t("empty.noAppointments", lang, { name: receptionistName })}
          description="When your AI receptionist books appointments, they'll appear here."
          action={{ label: "Customize Scheduling", href: "/dashboard/settings#receptionist" }}
        />
      )}

      {filteredAppointments.length > 0 && view === "calendar" && filter === "upcoming" && (
        <AppointmentCalendar
          appointments={filteredAppointments}
          onSelect={(appt) => setSelected(appt)}
        />
      )}

      {filteredAppointments.length > 0 && showListView && (
        <DataTable
          columns={columns}
          data={filteredAppointments}
          onRowClick={(row) => setSelected(row)}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-xl px-5 py-3"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
            {selectedIds.size} selected
          </span>
          <div className="h-5 w-px" style={{ background: "var(--db-border)" }} />
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setBulkConfirmAction({ status: "completed", label: t("appointments.complete", lang) });
            }}
          >
            {t("appointments.complete", lang)} ({selectedIds.size})
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setBulkConfirmAction({ status: "no_show", label: t("appointments.noShow", lang) });
            }}
          >
            {t("appointments.noShow", lang)} ({selectedIds.size})
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setBulkConfirmAction({ status: "cancelled", label: t("action.cancel", lang) });
            }}
          >
            {t("action.cancel", lang)} ({selectedIds.size})
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1 rounded-lg transition-colors ml-1"
            style={{ color: "var(--db-text-muted)" }}
            title="Clear selection"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selected && !confirmAction && !bulkConfirmAction && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="modal-content db-card w-full max-w-lg rounded-xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape") setSelected(null); }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 id="modal-title" className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
                  {selected.service}
                </h3>
                <p className="text-sm mt-1" style={{ color: "var(--db-text-muted)" }}>
                  {formatDateTime(selected.date, selected.time)}
                  {selected.duration > 0 && ` \u00B7 ${selected.duration} min`}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1 rounded-lg transition-colors"
                style={{ color: "var(--db-text-muted)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium uppercase tracking-wider w-20" style={{ color: "var(--db-text-muted)" }}>{t("appointments.status", lang)}</span>
                <StatusBadge label={selected.status} variant={statusToVariant(selected.status)} dot />
              </div>
              {(selected.leadName || selected.leadPhone) && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium uppercase tracking-wider w-20" style={{ color: "var(--db-text-muted)" }}>{t("appointments.customer", lang)}</span>
                  <span className="text-sm" style={{ color: "var(--db-text)" }}>
                    {selected.leadName || ""}{selected.leadName && selected.leadPhone ? " \u00B7 " : ""}{formatPhone(selected.leadPhone)}
                  </span>
                </div>
              )}
              {selected.notes && (
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider block mb-1" style={{ color: "var(--db-text-muted)" }}>{t("appointments.notes", lang)}</span>
                  <p className="text-sm rounded-lg p-3" style={{ background: "var(--db-hover)", color: "var(--db-text-secondary)" }}>
                    {selected.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {STATUS_ACTIONS[selected.status] && (
              <div className="flex items-center gap-2 pt-2" style={{ borderTop: "1px solid var(--db-border)" }}>
                {STATUS_ACTIONS[selected.status].map((action) => (
                  <Button
                    key={action.status}
                    variant={action.variant}
                    onClick={() => handleAction(action)}
                    disabled={actionLoading}
                  >
                    {t(action.labelKey, lang)}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm destructive action (single) */}
      <ConfirmDialog
        open={!!confirmAction}
        title={`${confirmAction?.label} Appointment?`}
        description={
          confirmAction?.status === "cancelled"
            ? "This will cancel the appointment. The customer will be notified via SMS."
            : "This will mark the appointment as a no-show."
        }
        confirmLabel={confirmAction?.label || "Confirm"}
        variant="danger"
        loading={actionLoading}
        onConfirm={() => {
          if (selected && confirmAction) {
            updateStatus(selected.id, confirmAction.status);
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Confirm destructive bulk action */}
      <ConfirmDialog
        open={!!bulkConfirmAction}
        title={`${bulkConfirmAction?.label} ${selectedIds.size} Appointment${selectedIds.size !== 1 ? "s" : ""}?`}
        description={
          bulkConfirmAction?.status === "cancelled"
            ? `This will cancel ${selectedIds.size} appointment${selectedIds.size !== 1 ? "s" : ""}. Customers will be notified.`
            : bulkConfirmAction?.status === "no_show"
            ? `This will mark ${selectedIds.size} appointment${selectedIds.size !== 1 ? "s" : ""} as no-show.`
            : `This will mark ${selectedIds.size} appointment${selectedIds.size !== 1 ? "s" : ""} as completed.`
        }
        confirmLabel={bulkConfirmAction?.label || "Confirm"}
        variant={bulkConfirmAction?.status === "completed" ? "primary" : "danger"}
        loading={bulkLoading}
        onConfirm={() => {
          if (bulkConfirmAction) {
            handleBulkStatus(bulkConfirmAction.status);
          }
        }}
        onCancel={() => setBulkConfirmAction(null)}
      />
    </div>
  );
}
