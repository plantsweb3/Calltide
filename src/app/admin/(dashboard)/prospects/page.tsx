"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable, { type Column } from "../../_components/data-table";
import ProspectDetail from "../../_components/prospect-detail";
import ScrapeModal from "../../_components/scrape-modal";
import ImportModal from "../../_components/import-modal";

interface Prospect {
  id: string;
  businessName: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  vertical?: string;
  rating?: number;
  leadScore?: number;
  status: string;
  auditResult?: string;
  source: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  "new",
  "audit_scheduled",
  "audit_complete",
  "outreach_active",
  "outreach_paused",
  "demo_booked",
  "converted",
  "disqualified",
];

const statusColors: Record<string, { bg: string; text: string }> = {
  new: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8" },
  audit_scheduled: { bg: "rgba(251,191,36,0.15)", text: "#fbbf24" },
  audit_complete: { bg: "rgba(96,165,250,0.15)", text: "#60a5fa" },
  outreach_active: { bg: "rgba(168,85,247,0.15)", text: "#a855f7" },
  outreach_paused: { bg: "rgba(251,191,36,0.15)", text: "#fbbf24" },
  demo_booked: { bg: "rgba(74,222,128,0.15)", text: "#4ade80" },
  converted: { bg: "rgba(74,222,128,0.2)", text: "#4ade80" },
  disqualified: { bg: "rgba(248,113,113,0.15)", text: "#f87171" },
};
const defaultStatusColor = { bg: "var(--db-hover)", text: "var(--db-text-muted)" };

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showScrape, setShowScrape] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const fetchProspects = useCallback(async () => {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      sortBy,
      sortOrder,
    });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/prospects?${params}`);
    const data = await res.json();
    setProspects(data.data);
    setPagination((prev) => ({ ...prev, ...data.pagination }));
  }, [pagination.page, pagination.limit, sortBy, sortOrder, search, statusFilter]);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  function handleSort(key: string) {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
  }

  async function handleBulkAudit(ids: string[]) {
    await fetch("/api/audit/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospectIds: ids }),
    });
    setSelectedIds(new Set());
    fetchProspects();
  }

  async function handleBulkOutreach(ids: string[]) {
    await fetch("/api/outreach/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospectIds: ids }),
    });
    setSelectedIds(new Set());
    fetchProspects();
  }

  async function handleBulkDisqualify(ids: string[]) {
    await fetch("/api/prospects/bulk-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action: "change_status", status: "disqualified" }),
    });
    setSelectedIds(new Set());
    fetchProspects();
  }

  const columns: Column<Prospect>[] = [
    {
      key: "businessName",
      label: "Business",
      sortable: true,
      render: (row) => (
        <button
          onClick={() => setDetailId(row.id)}
          className="text-left font-medium"
          style={{ color: "var(--db-accent)" }}
        >
          {row.businessName}
        </button>
      ),
    },
    { key: "city", label: "City", sortable: true },
    { key: "vertical", label: "Vertical", sortable: true },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => {
        const sc = statusColors[row.status] ?? defaultStatusColor;
        return (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: sc.bg, color: sc.text }}
          >
            {row.status.replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      key: "auditResult",
      label: "Audit",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{row.auditResult ?? "\u2014"}</span>
      ),
    },
    {
      key: "leadScore",
      label: "Score",
      sortable: true,
      render: (row) => (
        <span className="text-xs">{row.leadScore ?? 0}</span>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      sortable: true,
      render: (row) => (
        <span className="text-xs">{row.rating ?? "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Prospects</h1>
          <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
            {pagination.total} total prospects
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="rounded-lg px-3 py-2 text-sm transition-colors"
            style={{ border: "1px solid var(--db-border)", color: "var(--db-text-secondary)" }}
          >
            Import CSV
          </button>
          <button
            onClick={() => setShowScrape(true)}
            className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{ background: "var(--db-accent)", color: "#fff" }}
          >
            Scrape New
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search businesses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none w-64"
          style={{ background: "var(--db-hover)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--db-hover)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={prospects}
        pagination={{
          ...pagination,
          onPageChange: (p) =>
            setPagination((prev) => ({ ...prev, page: p })),
        }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={[
          { label: "Schedule Audit", onClick: handleBulkAudit },
          { label: "Start Outreach", onClick: handleBulkOutreach },
          { label: "Disqualify", onClick: handleBulkDisqualify },
        ]}
      />

      {/* Slide-over detail panel */}
      {detailId && (
        <ProspectDetail
          prospectId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}

      {/* Modals */}
      {showScrape && (
        <ScrapeModal
          onClose={() => setShowScrape(false)}
          onComplete={fetchProspects}
        />
      )}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onComplete={fetchProspects}
        />
      )}
    </div>
  );
}
