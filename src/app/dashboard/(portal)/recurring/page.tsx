"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import DataTable, { type Column } from "@/components/data-table";
import { TableSkeleton } from "@/components/skeleton";
import Button from "@/components/ui/button";
import StatusBadge from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";
import ConfirmDialog from "@/components/confirm-dialog";
import EmptyState from "@/components/empty-state";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

/* ── Types ─────────────────────────────────────────────────────── */

interface RecurringRule {
  id: string;
  customerId: string;
  service: string;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  preferredTime: string | null;
  duration: number;
  notes: string | null;
  nextOccurrence: string;
  lastGenerated: string | null;
  isActive: boolean;
  createdAt: string;
  customerName: string | null;
  customerPhone: string | null;
}

interface CustomerOption {
  id: string;
  name: string | null;
  phone: string;
}

/* ── Constants ─────────────────────────────────────────────────── */

const FREQUENCIES = ["daily", "weekly", "biweekly", "monthly", "quarterly", "annually"] as const;

const DAY_KEYS = [
  "day.sunday",
  "day.monday",
  "day.tuesday",
  "day.wednesday",
  "day.thursday",
  "day.friday",
  "day.saturday",
];

/* ── Helpers ───────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Page Component ────────────────────────────────────────────── */

export default function RecurringPage() {
  const [lang] = useLang();

  // Data
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeOnly, setActiveOnly] = useState(true);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<RecurringRule | null>(null);
  const [confirmPause, setConfirmPause] = useState<RecurringRule | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  /* ── Fetch rules ───────────────────────────────────────────── */

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/dashboard/recurring?page=${page}&active=${activeOnly}`,
      );
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setRules(data.rules);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError(t("recurring.failedToLoad", lang));
    } finally {
      setLoading(false);
    }
  }, [page, activeOnly, lang]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  /* ── Pause / Resume ────────────────────────────────────────── */

  async function toggleActive(rule: RecurringRule) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/dashboard/recurring/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(t("recurring.updated", lang));
      setRules((prev) =>
        prev.map((r) =>
          r.id === rule.id ? { ...r, isActive: !r.isActive } : r,
        ),
      );
      setConfirmPause(null);
    } catch {
      toast.error(t("recurring.failedToUpdate", lang));
    } finally {
      setActionLoading(false);
    }
  }

  /* ── Delete (soft deactivate) ──────────────────────────────── */

  async function deleteRule(rule: RecurringRule) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/dashboard/recurring/${rule.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success(t("recurring.deleted", lang));
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
      setTotal((prev) => prev - 1);
      setConfirmDelete(null);
    } catch {
      toast.error(t("recurring.failedToDelete", lang));
    } finally {
      setActionLoading(false);
    }
  }

  /* ── Table columns ─────────────────────────────────────────── */

  const columns: Column<RecurringRule>[] = [
    {
      key: "customerName",
      label: t("recurring.customer", lang),
      render: (row) => (
        <span style={{ color: "var(--db-text)" }}>
          {row.customerName || row.customerPhone || "\u2014"}
        </span>
      ),
    },
    {
      key: "service",
      label: t("recurring.service", lang),
    },
    {
      key: "frequency",
      label: t("recurring.frequency", lang),
      render: (row) => (
        <span className="text-sm capitalize">
          {t(`recurring.freq.${row.frequency}`, lang)}
        </span>
      ),
    },
    {
      key: "dayOfWeek",
      label: t("recurring.dayOfWeek", lang),
      render: (row) => {
        if (row.dayOfWeek !== null && row.dayOfWeek !== undefined) {
          return t(DAY_KEYS[row.dayOfWeek], lang);
        }
        if (row.dayOfMonth !== null && row.dayOfMonth !== undefined) {
          return `${t("recurring.dayOfMonth", lang)}: ${row.dayOfMonth}`;
        }
        return "\u2014";
      },
    },
    {
      key: "preferredTime",
      label: t("recurring.preferredTime", lang),
      render: (row) => row.preferredTime || "09:00",
    },
    {
      key: "nextOccurrence",
      label: t("recurring.nextOccurrence", lang),
      render: (row) => formatDate(row.nextOccurrence),
    },
    {
      key: "isActive",
      label: t("recurring.status", lang),
      render: (row) => (
        <StatusBadge
          label={row.isActive ? t("recurring.active", lang) : t("recurring.paused", lang)}
          variant={row.isActive ? "success" : "neutral"}
          dot
        />
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={row.isActive ? "secondary" : "primary"}
            onClick={(e) => {
              e.stopPropagation();
              if (row.isActive) {
                setConfirmPause(row);
              } else {
                toggleActive(row);
              }
            }}
          >
            {row.isActive ? t("recurring.pause", lang) : t("recurring.resume", lang)}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(row);
            }}
            aria-label={t("recurring.deleteRule", lang)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </Button>
        </div>
      ),
    },
  ];

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <div>
      <PageHeader
        title={t("recurring.title", lang)}
        actions={
          <div className="flex items-center gap-3">
            {/* Active / All toggle */}
            <div className="flex">
              <button
                onClick={() => { setActiveOnly(true); setPage(1); }}
                className="db-tab"
                data-active={activeOnly}
              >
                {t("recurring.activeOnly", lang)}
              </button>
              <button
                onClick={() => { setActiveOnly(false); setPage(1); }}
                className="db-tab"
                data-active={!activeOnly}
              >
                {t("recurring.showAll", lang)}
              </button>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              {t("recurring.newRule", lang)}
            </Button>
          </div>
        }
      />

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-xl p-4 mb-4 flex items-center justify-between"
          style={{
            background: "var(--db-danger-bg)",
            border: "1px solid var(--db-danger)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--db-danger)" }}>
            {error}
          </p>
          <Button variant="danger" size="sm" onClick={fetchRules}>
            {t("action.retry", lang)}
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && rules.length === 0 && !error && <TableSkeleton rows={5} />}

      {/* Empty state */}
      {!loading && rules.length === 0 && !error && (
        <EmptyState
          icon={
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="M15 5l4 4" />
            </svg>
          }
          title={t("empty.noRecurring", lang)}
          description={t("empty.noRecurring", lang)}
          action={{
            label: t("recurring.newRule", lang),
            onClick: () => setShowCreate(true),
          }}
        />
      )}

      {/* Table */}
      {rules.length > 0 && (
        <DataTable
          columns={columns}
          data={rules}
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
          prevLabel={t("action.back", lang)}
          nextLabel={t("action.next", lang)}
        />
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateRuleModal
          lang={lang}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchRules();
          }}
        />
      )}

      {/* Confirm pause */}
      <ConfirmDialog
        open={!!confirmPause}
        title={t("recurring.confirmPause", lang)}
        description={t("recurring.confirmPauseDescription", lang)}
        confirmLabel={t("recurring.pause", lang)}
        cancelLabel={t("action.cancel", lang)}
        loadingLabel={t("recurring.pausing", lang)}
        variant="primary"
        loading={actionLoading}
        onConfirm={() => {
          if (confirmPause) toggleActive(confirmPause);
        }}
        onCancel={() => setConfirmPause(null)}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!confirmDelete}
        title={t("recurring.confirmDelete", lang)}
        description={t("recurring.confirmDeleteDescription", lang)}
        confirmLabel={t("recurring.deleteRule", lang)}
        cancelLabel={t("action.cancel", lang)}
        variant="danger"
        loading={actionLoading}
        onConfirm={() => {
          if (confirmDelete) deleteRule(confirmDelete);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

/* ── Create Rule Modal ─────────────────────────────────────────── */

function CreateRuleModal({
  lang,
  onClose,
  onCreated,
}: {
  lang: "en" | "es";
  onClose: () => void;
  onCreated: () => void;
}) {
  // Form state
  const [customerId, setCustomerId] = useState("");
  const [customerLabel, setCustomerLabel] = useState("");
  const [service, setService] = useState("");
  const [frequency, setFrequency] = useState<string>("weekly");
  const [dayOfWeek, setDayOfWeek] = useState<number | "">("");
  const [dayOfMonth, setDayOfMonth] = useState<number | "">("");
  const [preferredTime, setPreferredTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerOption[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced customer search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (customerSearch.length < 2) {
      setCustomerResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setCustomerLoading(true);
      try {
        const res = await fetch(
          `/api/dashboard/customers?search=${encodeURIComponent(customerSearch)}&page=1`,
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setCustomerResults(
          (data.customers || []).map(
            (c: { id: string; name: string | null; phone: string }) => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
            }),
          ),
        );
        setShowDropdown(true);
      } catch {
        setCustomerResults([]);
      } finally {
        setCustomerLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [customerSearch]);

  function selectCustomer(c: CustomerOption) {
    setCustomerId(c.id);
    setCustomerLabel(c.name || c.phone);
    setCustomerSearch(c.name || c.phone);
    setShowDropdown(false);
  }

  // Show dayOfWeek for weekly/biweekly, dayOfMonth for monthly/quarterly
  const showDayOfWeek = frequency === "weekly" || frequency === "biweekly";
  const showDayOfMonth = frequency === "monthly" || frequency === "quarterly";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !service.trim()) return;

    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        customerId,
        service: service.trim(),
        frequency,
        preferredTime,
      };
      if (showDayOfWeek && dayOfWeek !== "") body.dayOfWeek = dayOfWeek;
      if (showDayOfMonth && dayOfMonth !== "") body.dayOfMonth = dayOfMonth;
      if (notes.trim()) body.notes = notes.trim();

      const res = await fetch("/api/dashboard/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create");
      }
      toast.success(t("recurring.created", lang));
      onCreated();
    } catch {
      toast.error(t("recurring.failedToCreate", lang));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="db-modal-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-rule-title"
        className="modal-content db-card w-full max-w-lg rounded-xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <h3
            id="create-rule-title"
            className="text-lg font-semibold"
            style={{ color: "var(--db-text)" }}
          >
            {t("recurring.newRule", lang)}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-xl transition-colors"
            style={{ color: "var(--db-text-muted)" }}
            aria-label={t("action.close", lang)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer search */}
          <div ref={dropdownRef} className="relative">
            <label
              className="text-xs font-medium uppercase tracking-wider block mb-1"
              style={{ color: "var(--db-text-muted)" }}
            >
              {t("recurring.customer", lang)} *
            </label>
            <input
              type="text"
              className="db-input w-full"
              placeholder={t("recurring.searchCustomer", lang)}
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setCustomerId("");
                setCustomerLabel("");
              }}
              required
            />
            {/* Dropdown */}
            {showDropdown && (
              <div
                className="absolute left-0 right-0 mt-1 z-50 rounded-lg overflow-hidden shadow-lg max-h-48 overflow-y-auto"
                style={{
                  background: "var(--db-card)",
                  border: "1px solid var(--db-border)",
                }}
              >
                {customerLoading && (
                  <div
                    className="px-3 py-2 text-xs"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    {t("action.loading", lang)}
                  </div>
                )}
                {!customerLoading && customerResults.length === 0 && (
                  <div
                    className="px-3 py-2 text-xs"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    {t("recurring.noCustomersFound", lang)}
                  </div>
                )}
                {customerResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm transition-colors"
                    style={{ color: "var(--db-text)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--db-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() => selectCustomer(c)}
                  >
                    <span className="font-medium">
                      {c.name || "Unknown"}
                    </span>
                    <span
                      className="ml-2 text-xs"
                      style={{ color: "var(--db-text-muted)" }}
                    >
                      {c.phone}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {/* Selected indicator */}
            {customerId && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--db-accent)" }}
              >
                {customerLabel}
              </p>
            )}
          </div>

          {/* Service */}
          <div>
            <label
              className="text-xs font-medium uppercase tracking-wider block mb-1"
              style={{ color: "var(--db-text-muted)" }}
            >
              {t("recurring.service", lang)} *
            </label>
            <input
              type="text"
              className="db-input w-full"
              placeholder={t("recurring.servicePlaceholder", lang)}
              value={service}
              onChange={(e) => setService(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          {/* Frequency */}
          <div>
            <label
              className="text-xs font-medium uppercase tracking-wider block mb-1"
              style={{ color: "var(--db-text-muted)" }}
            >
              {t("recurring.frequency", lang)} *
            </label>
            <select
              className="db-input w-full"
              value={frequency}
              onChange={(e) => {
                setFrequency(e.target.value);
                setDayOfWeek("");
                setDayOfMonth("");
              }}
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {t(`recurring.freq.${f}`, lang)}
                </option>
              ))}
            </select>
          </div>

          {/* Day of week (weekly/biweekly) */}
          {showDayOfWeek && (
            <div>
              <label
                className="text-xs font-medium uppercase tracking-wider block mb-1"
                style={{ color: "var(--db-text-muted)" }}
              >
                {t("recurring.dayOfWeek", lang)}
              </label>
              <select
                className="db-input w-full"
                value={dayOfWeek}
                onChange={(e) =>
                  setDayOfWeek(
                    e.target.value === "" ? "" : parseInt(e.target.value),
                  )
                }
              >
                <option value="">\u2014</option>
                {DAY_KEYS.map((key, i) => (
                  <option key={i} value={i}>
                    {t(key, lang)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Day of month (monthly/quarterly) */}
          {showDayOfMonth && (
            <div>
              <label
                className="text-xs font-medium uppercase tracking-wider block mb-1"
                style={{ color: "var(--db-text-muted)" }}
              >
                {t("recurring.dayOfMonth", lang)}
              </label>
              <input
                type="number"
                className="db-input w-full"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) =>
                  setDayOfMonth(
                    e.target.value === "" ? "" : parseInt(e.target.value),
                  )
                }
                placeholder="1-31"
              />
            </div>
          )}

          {/* Preferred time */}
          <div>
            <label
              className="text-xs font-medium uppercase tracking-wider block mb-1"
              style={{ color: "var(--db-text-muted)" }}
            >
              {t("recurring.preferredTime", lang)}
            </label>
            <input
              type="time"
              className="db-input w-full"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label
              className="text-xs font-medium uppercase tracking-wider block mb-1"
              style={{ color: "var(--db-text-muted)" }}
            >
              {t("recurring.notes", lang)}
            </label>
            <textarea
              className="db-input w-full"
              rows={2}
              placeholder={t("recurring.notesPlaceholder", lang)}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
            />
          </div>

          {/* Actions */}
          <div
            className="flex items-center justify-end gap-3 pt-2"
            style={{ borderTop: "1px solid var(--db-border)" }}
          >
            <Button variant="ghost" type="button" onClick={onClose}>
              {t("action.cancel", lang)}
            </Button>
            <Button type="submit" disabled={creating || !customerId || !service.trim()}>
              {creating ? t("recurring.creating", lang) : t("recurring.newRule", lang)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
