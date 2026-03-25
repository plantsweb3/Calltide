"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useReceptionistName } from "@/app/dashboard/_hooks/use-receptionist-name";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";
import { TableSkeleton } from "@/components/skeleton";
import ExportCsvButton from "@/app/dashboard/_components/csv-export";
import DataTable, { type Column } from "@/components/data-table";
import Button from "@/components/ui/button";
import StatusBadge from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";
import PhoneLink from "@/components/phone-link";
import { formatPhone } from "@/lib/format";

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  address: string | null;
  language: string;
  tags: string[];
  totalCalls: number;
  totalAppointments: number;
  totalEstimates: number;
  lastCallAt: string | null;
  isRepeat: boolean;
  createdAt: string;
  leadScore: number | null;
  tier: string | null;
}

const LEAD_TIER_CONFIG: Record<string, { label: string; bg: string; fg: string }> = {
  hot: { label: "Hot", bg: "var(--db-danger-bg)", fg: "var(--db-danger)" },
  warm: { label: "Warm", bg: "rgba(245,158,11,0.12)", fg: "var(--db-warning-alt)" },
  cold: { label: "Cold", bg: "rgba(59,130,246,0.12)", fg: "#3b82f6" },
  dormant: { label: "Dormant", bg: "rgba(148,163,184,0.12)", fg: "var(--db-text-muted)" },
  new: { label: "New", bg: "rgba(96,165,250,0.12)", fg: "#60a5fa" },
  loyal: { label: "Loyal", bg: "var(--db-success-bg)", fg: "var(--db-success)" },
  vip: { label: "VIP", bg: "rgba(250,204,21,0.12)", fg: "var(--db-warning)" },
  "at-risk": { label: "At Risk", bg: "var(--db-danger-bg)", fg: "var(--db-danger)" },
};

const TIER_FILTER_OPTIONS = [
  { value: "", key: "customers.allTiers" as const },
  { value: "hot", key: "customers.hot" as const },
  { value: "warm", key: "customers.warm" as const },
  { value: "cold", key: "customers.cold" as const },
  { value: "dormant", key: "customers.dormant" as const },
] as const;

const SORT_OPTIONS = [
  { value: "lastCallDate", key: "customers.lastCall" as const },
  { value: "name", key: "customers.name" as const },
  { value: "leadScore", key: "customers.leadScore" as const },
] as const;

export default function CustomersPage() {
  const receptionistName = useReceptionistName();
  const [lang] = useLang();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState("");
  const [sortBy, setSortBy] = useState("lastCallDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMergeModal, setShowMergeModal] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (tierFilter) params.set("tier", tierFilter);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      const res = await fetch(`/api/dashboard/customers?${params}`);
      if (!res.ok) throw new Error("Failed to load customers");
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load customers. Please try again.");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, tierFilter, sortBy, sortOrder]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function formatDate(d: string | null) {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function handleMergeClick() {
    if (selectedIds.size === 2) {
      setShowMergeModal(true);
    }
  }

  const columns: Column<Customer>[] = [
    {
      key: "name",
      label: t("customers.name", lang),
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
            {c.name || "Unknown"}
          </span>
          {c.isRepeat && <StatusBadge label="Repeat" variant="accent" />}
        </div>
      ),
    },
    {
      key: "phone",
      label: t("customers.phone", lang),
      render: (c) => (
        <PhoneLink phone={c.phone} className="text-sm font-medium hover:underline" />
      ),
    },
    {
      key: "leadScore",
      label: t("customers.leadScore", lang),
      sortable: true,
      render: (c) => {
        const score = c.leadScore ?? 0;
        const tierConf = LEAD_TIER_CONFIG[c.tier || "new"] || LEAD_TIER_CONFIG.new;
        return (
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase"
              style={{ background: tierConf.bg, color: tierConf.fg }}
            >
              {tierConf.label}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-12 h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--db-hover)" }}
              >
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${score}%`,
                    background: score >= 70 ? "var(--db-success)" : score >= 40 ? "var(--db-warning)" : "var(--db-danger)",
                  }}
                />
              </span>
              <span className="text-xs font-medium tabular-nums" style={{ color: "var(--db-text-muted)" }}>
                {score}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "totalCalls",
      label: t("customers.totalCalls", lang),
      render: (c) => (
        <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{c.totalCalls}</span>
      ),
    },
    {
      key: "totalAppointments",
      label: t("metric.appointments", lang),
      render: (c) => (
        <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{c.totalAppointments}</span>
      ),
    },
    {
      key: "lastCallAt",
      label: t("customers.lastCall", lang),
      sortable: true,
      render: (c) => (
        <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>{formatDate(c.lastCallAt)}</span>
      ),
    },
    {
      key: "tags",
      label: "Tags",
      render: (c) => (
        <div className="flex gap-1">
          {(c.tags || []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
            >
              {tag}
            </span>
          ))}
          {(c.tags || []).length > 3 && (
            <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              +{c.tags.length - 3}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("customers.title", lang)}
        description={`${total} ${t("metric.totalCustomers", lang).toLowerCase()}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.size === 2 && (
              <Button variant="secondary" size="sm" onClick={handleMergeClick}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 6L12 2L16 6" /><path d="M12 2V15" /><circle cx="6" cy="20" r="2" /><circle cx="18" cy="20" r="2" /><path d="M12 15C12 18 6 18 6 18" /><path d="M12 15C12 18 18 18 18 18" />
                </svg>
                {t("customers.mergeCustomers", lang)} ({selectedIds.size})
              </Button>
            )}
            <Link
              href="/dashboard/import?type=customers"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: "var(--db-hover)",
                border: "1px solid var(--db-border)",
                color: "var(--db-text-muted)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {t("nav.import", lang)} CSV
            </Link>
            <ExportCsvButton
              data={customers}
              columns={[
                { header: "Name", accessor: (r) => r.name },
                { header: "Phone", accessor: (r) => r.phone },
                { header: "Email", accessor: (r) => r.email },
                { header: "Calls", accessor: (r) => r.totalCalls },
                { header: "Appointments", accessor: (r) => r.totalAppointments },
                { header: "Last Call", accessor: (r) => r.lastCallAt },
                { header: "Lead Score", accessor: (r) => r.leadScore },
                { header: "Tier", accessor: (r) => r.tier },
                { header: "Tags", accessor: (r) => r.tags.join("; ") },
              ]}
              filename="customers"
            />
            <Button onClick={() => setShowAddModal(true)}>
              + {t("customers.addCustomer", lang)}
            </Button>
          </div>
        }
      />

      {/* Search + Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder={t("customers.search", lang)}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full max-w-md rounded-lg border px-4 py-2 text-sm"
          style={{
            background: "var(--db-surface)",
            borderColor: "var(--db-border)",
            color: "var(--db-text)",
          }}
        />

        <select
          value={tierFilter}
          onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-xs font-medium"
          style={{
            background: "var(--db-surface)",
            borderColor: "var(--db-border)",
            color: "var(--db-text)",
          }}
        >
          {TIER_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{t(opt.key, lang)}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-xs font-medium"
          style={{
            background: "var(--db-surface)",
            borderColor: "var(--db-border)",
            color: "var(--db-text)",
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>Sort: {t(opt.key, lang)}</option>
          ))}
        </select>

        <button
          onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
          className="rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors"
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

      {error && (
        <div role="alert" aria-live="assertive" className="db-card mb-4 flex items-center justify-between p-4" style={{ borderColor: "var(--db-danger)" }}>
          <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
          <Button variant="danger" size="sm" onClick={fetchCustomers}>{t("action.retry", lang)}</Button>
        </div>
      )}

      {loading && customers.length === 0 && !error ? (
        <TableSkeleton rows={6} />
      ) : customers.length === 0 ? (
        <div className="db-card py-16 text-center">
          <svg className="mx-auto mb-4" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--db-text-muted)" }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>
            {search ? "No customers match your search" : t("empty.noCustomers", lang, { name: receptionistName })}
          </p>
          <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: "var(--db-text-muted)" }}>
            {search
              ? ""
              : t("empty.noCustomers", lang, { name: receptionistName })}
          </p>
          {!search && (
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>
              {t("customers.addCustomer", lang)}
            </Button>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={customers}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(c) => router.push(`/dashboard/customers/${c.id}`)}
          pagination={totalPages > 1 ? {
            page,
            totalPages,
            total,
            onPageChange: setPage,
          } : undefined}
          emptyMessage={search ? "No customers match your search" : "No customers yet"}
        />
      )}

      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => { setShowAddModal(false); fetchCustomers(); }}
        />
      )}

      {showMergeModal && selectedIds.size === 2 && (
        <MergeCustomerModal
          customers={customers.filter((c) => selectedIds.has(c.id))}
          onClose={() => setShowMergeModal(false)}
          onMerged={() => {
            setShowMergeModal(false);
            setSelectedIds(new Set());
            fetchCustomers();
          }}
        />
      )}
    </div>
  );
}

// ── Add Customer Modal ──

function AddCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [lang] = useLang();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Name and phone are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), email: email.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create customer");
        return;
      }
      toast.success(t("toast.customerAdded", lang));
      onCreated();
    } catch {
      setError("Failed to create customer");
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
        aria-labelledby="add-customer-title"
        className="modal-content w-full max-w-md rounded-xl p-6"
        style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-customer-title" className="text-lg font-semibold mb-4" style={{ color: "var(--db-text)" }}>
          {t("customers.addCustomerTitle", lang)}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>{t("customers.nameLabel", lang)}</label>
            <input
              type="text"
              placeholder="John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>{t("customers.phoneLabel", lang)}</label>
            <input
              type="tel"
              placeholder="(512) 555-1234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>{t("customers.emailOptional", lang)}</label>
            <input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
            />
          </div>
          {error && <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              {t("action.cancel", lang)}
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? t("action.saving", lang) : t("customers.addCustomer", lang)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Merge Customer Modal ──

function MergeCustomerModal({
  customers,
  onClose,
  onMerged,
}: {
  customers: Customer[];
  onClose: () => void;
  onMerged: () => void;
}) {
  const [lang] = useLang();
  const [a, b] = customers;
  const [primaryId, setPrimaryId] = useState(a.id);
  const [keepFields, setKeepFields] = useState<Record<string, string>>({
    name: a.name ? a.id : b.id,
    phone: a.id,
    email: a.email ? a.id : b.id,
    address: a.address ? a.id : b.id,
  });
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState("");

  function getFieldValue(field: keyof Customer, customer: Customer): string {
    const val = customer[field];
    if (val == null) return "\u2014";
    return String(val);
  }

  const MERGE_FIELDS = [
    { key: "name" as const, label: "Name" },
    { key: "phone" as const, label: "Phone" },
    { key: "email" as const, label: "Email" },
    { key: "address" as const, label: "Address" },
  ];

  // The primary customer is the one whose ID matches primaryId
  // The secondary gets soft-deleted
  // But we want the primary to receive the chosen field values
  // The merge endpoint does primary-wins on fields, so we set primaryId to the one with the preferred fields
  // Actually, the merge endpoint auto-merges with primary-wins logic. For simplicity,
  // we let the user choose which customer is primary and trust the server merge.
  // If user wants specific field values, we can do a follow-up PUT after merge.

  async function handleMerge(e: React.FormEvent) {
    e.preventDefault();
    setMerging(true);
    setError("");

    const secondaryId = primaryId === a.id ? b.id : a.id;

    try {
      const res = await fetch("/api/dashboard/customers/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryId, secondaryId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to merge customers");
        return;
      }

      // After merge, update the primary with the chosen field values
      const primaryCustomer = primaryId === a.id ? a : b;
      const secondaryCustomer = primaryId === a.id ? b : a;
      const updates: Record<string, string | null> = {};

      for (const field of MERGE_FIELDS) {
        const chosenCustomerId = keepFields[field.key];
        const chosenCustomer = chosenCustomerId === a.id ? a : b;
        const chosenValue = chosenCustomer[field.key];
        // Only update if the chosen value differs from what the primary already has
        if (chosenCustomer.id !== primaryId && chosenValue) {
          updates[field.key] = String(chosenValue);
        }
      }

      if (Object.keys(updates).length > 0) {
        await fetch(`/api/dashboard/customers/${primaryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
      }

      toast.success(t("toast.customersMerged", lang));
      onMerged();
    } catch {
      setError("Failed to merge customers");
    } finally {
      setMerging(false);
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
        aria-labelledby="merge-customers-title"
        className="modal-content w-full max-w-2xl rounded-xl p-6"
        style={{
          background: "var(--db-surface)",
          border: "1px solid var(--db-border)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="merge-customers-title" className="text-lg font-semibold mb-1" style={{ color: "var(--db-text)" }}>
          {t("customers.mergeCustomers", lang)}
        </h2>
        <p className="text-xs mb-5" style={{ color: "var(--db-text-muted)" }}>
          Choose which customer record to keep as primary. Select which field values to preserve.
        </p>

        <form onSubmit={handleMerge}>
          {/* Primary selector */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {[a, b].map((cust) => (
              <button
                key={cust.id}
                type="button"
                onClick={() => setPrimaryId(cust.id)}
                className="rounded-lg border p-3 text-left transition-all"
                style={{
                  borderColor: primaryId === cust.id ? "var(--db-accent)" : "var(--db-border)",
                  background: primaryId === cust.id ? "rgba(212,168,67,0.06)" : "var(--db-bg)",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
                    {cust.name || "Unknown"}
                  </span>
                  {primaryId === cust.id && (
                    <span
                      className="rounded px-1.5 py-0.5 text-xs font-semibold uppercase"
                      style={{ background: "rgba(212,168,67,0.15)", color: "var(--db-accent)" }}
                    >
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                  {cust.phone} {cust.email ? `\u00B7 ${cust.email}` : ""}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
                  {cust.totalCalls} calls \u00B7 {cust.totalAppointments} appts
                </p>
              </button>
            ))}
          </div>

          {/* Field-by-field selection */}
          <div className="rounded-lg border overflow-hidden mb-5" style={{ borderColor: "var(--db-border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--db-border)", background: "var(--db-hover)" }}>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase" style={{ color: "var(--db-text-muted)" }}>
                    Field
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold uppercase" style={{ color: "var(--db-text-muted)" }}>
                    {a.name || "Customer A"}
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold uppercase" style={{ color: "var(--db-text-muted)" }}>
                    {b.name || "Customer B"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {MERGE_FIELDS.map((field) => (
                  <tr key={field.key} style={{ borderBottom: "1px solid var(--db-border)" }}>
                    <td className="px-4 py-2 font-medium" style={{ color: "var(--db-text)" }}>
                      {field.label}
                    </td>
                    {[a, b].map((cust) => (
                      <td key={cust.id} className="px-4 py-2 text-center">
                        <label className="flex items-center justify-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`merge-${field.key}`}
                            checked={keepFields[field.key] === cust.id}
                            onChange={() => setKeepFields((prev) => ({ ...prev, [field.key]: cust.id }))}
                            style={{ accentColor: "var(--db-accent)" }}
                          />
                          <span className="text-xs" style={{ color: "var(--db-text)" }}>
                            {getFieldValue(field.key, cust)}
                          </span>
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="text-sm mb-3" style={{ color: "var(--db-danger)" }}>{error}</p>}

          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              {t("action.cancel", lang)}
            </Button>
            <Button type="submit" disabled={merging} className="flex-1">
              {merging ? t("action.loading", lang) : t("customers.mergeCustomers", lang)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
