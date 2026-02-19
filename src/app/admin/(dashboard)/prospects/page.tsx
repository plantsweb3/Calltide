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

const statusColors: Record<string, string> = {
  new: "bg-slate-600",
  audit_scheduled: "bg-amber-600",
  audit_complete: "bg-blue-600",
  outreach_active: "bg-purple-600",
  outreach_paused: "bg-amber-600",
  demo_booked: "bg-green-600",
  converted: "bg-green-500",
  disqualified: "bg-red-600",
};

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
          className="text-left text-blue-400 hover:text-blue-300 font-medium"
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
      render: (row) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${statusColors[row.status] ?? "bg-slate-600"}`}
        >
          {row.status.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "auditResult",
      label: "Audit",
      render: (row) => (
        <span className="text-xs text-slate-400">{row.auditResult ?? "—"}</span>
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
          <p className="text-sm text-slate-400">
            {pagination.total} total prospects
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Import CSV
          </button>
          <button
            onClick={() => setShowScrape(true)}
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-500 transition-colors"
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
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-green-500 w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-green-500"
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
