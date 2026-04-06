"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import DataTable, { type Column } from "@/components/data-table";
import Button from "@/components/ui/button";
import StatusBadge from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import { TableSkeleton } from "@/components/skeleton";
import PhoneLink from "@/components/phone-link";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

interface Complaint {
  id: string;
  businessId: string;
  customerId: string | null;
  callId: string | null;
  customerPhone: string | null;
  customerName: string | null;
  severity: string;
  category: string;
  description: string;
  status: string;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const severityColors: Record<string, string> = {
  low: "var(--db-text-muted)",
  medium: "#3b82f6",
  high: "var(--db-warning-alt)",
  critical: "var(--db-danger)",
};

function complaintStatusVariant(status: string): "info" | "warning" | "success" | "neutral" {
  const map: Record<string, "info" | "warning" | "success" | "neutral"> = {
    open: "info",
    investigating: "warning",
    resolved: "success",
    closed: "neutral",
  };
  return map[status] ?? "neutral";
}

export default function ComplaintsPage() {
  const [lang] = useLang();

  const STATUS_TABS = [
    { key: "all", label: t("complaints.all", lang) },
    { key: "open", label: t("complaints.status.open", lang) },
    { key: "investigating", label: t("complaints.status.investigating", lang) },
    { key: "resolved", label: t("complaints.status.resolved", lang) },
  ] as const;

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState<Complaint | null>(null);

  const fetchComplaints = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (tab !== "all") params.set("status", tab);
      params.set("page", String(page));
      const res = await fetch(`/api/dashboard/complaints?${params}`);
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
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
    fetchComplaints();
  }, [fetchComplaints]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [tab]);

  async function updateStatus(id: string, status: string, resolution?: string) {
    setUpdating(id);
    try {
      const body: Record<string, string> = { status };
      if (resolution) body.resolution = resolution;
      const res = await fetch(`/api/dashboard/complaints/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(t("complaints.updated", lang));
        await fetchComplaints();
      } else {
        toast.error(t("complaints.updateFailed", lang));
      }
    } catch {
      toast.error(t("complaints.updateFailed", lang));
    } finally {
      setUpdating(null);
    }
  }

  const openCount = complaints.filter((c) => c.status === "open").length;
  const criticalCount = complaints.filter((c) => c.severity === "critical" || c.severity === "high").length;

  const columns: Column<Complaint>[] = [
    {
      key: "severity",
      label: t("complaints.col.severity", lang),
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
            style={{ background: severityColors[row.severity] || severityColors.medium }}
          />
          <span className="text-xs font-medium capitalize">
            {t(`complaints.severity.${row.severity}`, lang)}
          </span>
        </div>
      ),
    },
    {
      key: "customerName",
      label: t("complaints.col.customer", lang),
      sortable: true,
      render: (row) => (
        <div>
          <span style={{ color: "var(--db-text)" }}>
            {row.customerName || "\u2014"}
          </span>
          {row.customerPhone && (
            <div className="mt-0.5">
              <PhoneLink phone={row.customerPhone} className="text-xs font-medium hover:underline" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: t("complaints.col.date", lang),
      sortable: true,
      render: (row) => (
        <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          {new Date(row.createdAt).toLocaleDateString(
            lang === "es" ? "es-MX" : "en-US",
            { month: "short", day: "numeric", year: "numeric" },
          )}
        </span>
      ),
    },
    {
      key: "category",
      label: t("complaints.col.category", lang),
      sortable: true,
      render: (row) => (
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize"
          style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
        >
          {t(`complaints.category.${row.category}`, lang)}
        </span>
      ),
    },
    {
      key: "description",
      label: t("complaints.col.description", lang),
      render: (row) => (
        <p
          className="text-sm truncate max-w-[240px]"
          style={{ color: "var(--db-text)" }}
          title={row.description}
        >
          {row.description}
        </p>
      ),
    },
    {
      key: "status",
      label: t("complaints.col.status", lang),
      sortable: true,
      render: (row) => (
        <StatusBadge
          label={t(`complaints.status.${row.status}`, lang)}
          variant={complaintStatusVariant(row.status)}
          dot
        />
      ),
    },
    {
      key: "resolution",
      label: t("complaints.col.resolution", lang),
      render: (row) =>
        row.resolution ? (
          <p
            className="text-xs truncate max-w-[180px]"
            style={{ color: "var(--db-text-muted)" }}
            title={row.resolution}
          >
            {row.resolution}
          </p>
        ) : (
          <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {"\u2014"}
          </span>
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
            onClick={(e) => { e.stopPropagation(); setDetailComplaint(row); }}
          >
            {t("action.edit", lang)}
          </Button>
          {row.status === "open" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => { e.stopPropagation(); updateStatus(row.id, "investigating"); }}
              disabled={updating === row.id}
            >
              {t("complaints.investigate", lang)}
            </Button>
          )}
          {row.status === "investigating" && (
            <Button
              size="sm"
              variant="primary"
              onClick={(e) => { e.stopPropagation(); setDetailComplaint(row); }}
              disabled={updating === row.id}
            >
              {t("complaints.resolve", lang)}
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
        title={t("complaints.title", lang)}
        description={
          openCount > 0
            ? `${t("complaints.openCount", lang, { n: openCount })}${criticalCount > 0 ? ` ${t("complaints.criticalCount", lang, { n: criticalCount })}` : ""}`
            : t("complaints.allResolved", lang)
        }
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            {t("complaints.reportIssue", lang)}
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--db-surface)" }}>
          {STATUS_TABS.map((tab_item) => (
            <button
              key={tab_item.key}
              onClick={() => setTab(tab_item.key)}
              className="px-4 py-2 text-sm font-medium rounded-md transition-all"
              style={{
                background: tab === tab_item.key ? "var(--db-card)" : "transparent",
                color: tab === tab_item.key ? "var(--db-text)" : "var(--db-text-muted)",
                boxShadow: tab === tab_item.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {tab_item.label}
            </button>
          ))}
        </div>
      </div>

      {complaints.length === 0 ? (
        <EmptyState
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          }
          title={
            tab === "all"
              ? t("complaints.emptyAll", lang)
              : t("complaints.emptyFiltered", lang)
          }
          description={t("complaints.emptyDescription", lang)}
          action={{
            label: t("complaints.reportIssue", lang),
            onClick: () => setShowCreateModal(true),
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={complaints}
          onRowClick={(row) => setDetailComplaint(row)}
          pagination={{
            page,
            totalPages,
            total,
            onPageChange: setPage,
          }}
          prevLabel={t("complaints.prev", lang)}
          nextLabel={t("complaints.next", lang)}
        />
      )}

      {showCreateModal && (
        <CreateComplaintModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchComplaints();
          }}
        />
      )}

      {detailComplaint && (
        <ComplaintDetailModal
          complaint={detailComplaint}
          onClose={() => setDetailComplaint(null)}
          onSaved={() => {
            setDetailComplaint(null);
            fetchComplaints();
          }}
        />
      )}
    </div>
  );
}

// ── Create Complaint Modal ──

function CreateComplaintModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [lang] = useLang();
  const [customerPhone, setCustomerPhone] = useState("");
  const [category, setCategory] = useState("other");
  const [severity, setSeverity] = useState("medium");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError(t("complaints.form.descriptionRequired", lang));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body: Record<string, string> = {
        description: description.trim(),
        category,
        severity,
      };
      if (customerPhone.trim()) {
        body.customerPhone = customerPhone.trim();
      }
      const res = await fetch("/api/dashboard/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("complaints.createFailed", lang));
        return;
      }
      toast.success(t("complaints.created", lang));
      onCreated();
    } catch {
      setError(t("complaints.createFailed", lang));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="db-modal-backdrop"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-complaint-title"
        className="modal-content w-full max-w-lg rounded-xl p-6"
        style={{
          background: "var(--db-surface)",
          border: "1px solid var(--db-border)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="create-complaint-title"
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--db-text)" }}
        >
          {t("complaints.reportIssue", lang)}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="db-label">
              {t("complaints.form.customerPhone", lang)}
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder={t("complaints.form.phonePlaceholder", lang)}
              className="db-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="db-label">
                {t("complaints.form.category", lang)} *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="db-select"
              >
                <option value="service_quality">{t("complaints.category.service_quality", lang)}</option>
                <option value="billing">{t("complaints.category.billing", lang)}</option>
                <option value="scheduling">{t("complaints.category.scheduling", lang)}</option>
                <option value="communication">{t("complaints.category.communication", lang)}</option>
                <option value="other">{t("complaints.category.other", lang)}</option>
              </select>
            </div>
            <div>
              <label className="db-label">
                {t("complaints.form.severity", lang)} *
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="db-select"
              >
                <option value="low">{t("complaints.severity.low", lang)}</option>
                <option value="medium">{t("complaints.severity.medium", lang)}</option>
                <option value="high">{t("complaints.severity.high", lang)}</option>
                <option value="critical">{t("complaints.severity.critical", lang)}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="db-label">
              {t("complaints.form.description", lang)} *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="db-input"
              style={{ resize: "vertical" }}
              placeholder={t("complaints.form.descriptionPlaceholder", lang)}
              autoFocus
            />
          </div>
          {error && <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              {t("action.cancel", lang)}
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? t("action.saving", lang) : t("action.submit", lang)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Complaint Detail / Update Modal ──

function ComplaintDetailModal({
  complaint,
  onClose,
  onSaved,
}: {
  complaint: Complaint;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [lang] = useLang();
  const [status, setStatus] = useState(complaint.status);
  const [severity, setSeverity] = useState(complaint.severity);
  const [category, setCategory] = useState(complaint.category);
  const [resolution, setResolution] = useState(complaint.resolution || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((status === "resolved" || status === "closed") && !resolution.trim()) {
      setError(t("complaints.form.resolutionRequired", lang));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body: Record<string, string> = { status, severity, category };
      if (resolution.trim()) body.resolution = resolution.trim();
      const res = await fetch(`/api/dashboard/complaints/${complaint.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("complaints.updateFailed", lang));
        return;
      }
      toast.success(t("complaints.updated", lang));
      onSaved();
    } catch {
      setError(t("complaints.updateFailed", lang));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="db-modal-backdrop"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-complaint-title"
        className="modal-content w-full max-w-lg rounded-xl p-6"
        style={{
          background: "var(--db-surface)",
          border: "1px solid var(--db-border)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="detail-complaint-title"
          className="text-lg font-semibold mb-1"
          style={{ color: "var(--db-text)" }}
        >
          {t("complaints.detailTitle", lang)}
        </h2>
        {complaint.customerName && (
          <p className="text-xs mb-2" style={{ color: "var(--db-text-muted)" }}>
            {t("complaints.customerLabel", lang)} {complaint.customerName}
            {complaint.customerPhone && (
              <> &middot; <PhoneLink phone={complaint.customerPhone} className="text-xs font-medium hover:underline" /></>
            )}
          </p>
        )}

        {/* Original description */}
        <div
          className="rounded-lg p-3 mb-4 text-sm"
          style={{ background: "var(--db-hover)", color: "var(--db-text)" }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--db-text-muted)" }}>
            {t("complaints.form.description", lang)}
          </p>
          {complaint.description}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="db-label">
                {t("complaints.form.status", lang)}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="db-select"
              >
                <option value="open">{t("complaints.status.open", lang)}</option>
                <option value="investigating">{t("complaints.status.investigating", lang)}</option>
                <option value="resolved">{t("complaints.status.resolved", lang)}</option>
                <option value="closed">{t("complaints.status.closed", lang)}</option>
              </select>
            </div>
            <div>
              <label className="db-label">
                {t("complaints.form.severity", lang)}
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="db-select"
              >
                <option value="low">{t("complaints.severity.low", lang)}</option>
                <option value="medium">{t("complaints.severity.medium", lang)}</option>
                <option value="high">{t("complaints.severity.high", lang)}</option>
                <option value="critical">{t("complaints.severity.critical", lang)}</option>
              </select>
            </div>
            <div>
              <label className="db-label">
                {t("complaints.form.category", lang)}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="db-select"
              >
                <option value="service_quality">{t("complaints.category.service_quality", lang)}</option>
                <option value="billing">{t("complaints.category.billing", lang)}</option>
                <option value="scheduling">{t("complaints.category.scheduling", lang)}</option>
                <option value="communication">{t("complaints.category.communication", lang)}</option>
                <option value="other">{t("complaints.category.other", lang)}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="db-label">
              {t("complaints.form.resolution", lang)}
              {(status === "resolved" || status === "closed") && " *"}
            </label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
              className="db-input"
              style={{ resize: "vertical" }}
              placeholder={t("complaints.form.resolutionPlaceholder", lang)}
            />
          </div>

          {/* Metadata */}
          <div className="flex gap-4 text-xs" style={{ color: "var(--db-text-muted)" }}>
            <span>{t("complaints.createdLabel", lang)} {new Date(complaint.createdAt).toLocaleDateString(lang === "es" ? "es-MX" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            {complaint.resolvedAt && (
              <span>{t("complaints.resolvedLabel", lang)} {new Date(complaint.resolvedAt).toLocaleDateString(lang === "es" ? "es-MX" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            )}
          </div>

          {error && <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              {t("action.cancel", lang)}
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? t("action.saving", lang) : t("action.save", lang)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
