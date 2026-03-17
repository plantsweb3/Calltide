"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useReceptionistName } from "@/app/dashboard/_hooks/use-receptionist-name";
import { TableSkeleton } from "@/components/skeleton";
import ExportCsvButton from "@/app/dashboard/_components/csv-export";
import DataTable, { type Column } from "@/components/data-table";
import Button from "@/components/ui/button";
import StatusBadge from "@/components/ui/status-badge";

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  language: string;
  tags: string[];
  totalCalls: number;
  totalAppointments: number;
  totalEstimates: number;
  lastCallAt: string | null;
  isRepeat: boolean;
  createdAt: string;
}

export default function CustomersPage() {
  const receptionistName = useReceptionistName();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
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
  }, [page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function formatPhone(p: string) {
    const digits = p.replace(/\D/g, "");
    if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    if (digits.length === 11 && digits[0] === "1") return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return p;
  }

  const columns: Column<Customer>[] = [
    {
      key: "name",
      label: "Name",
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
      label: "Phone",
      render: (c) => (
        <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
          {formatPhone(c.phone)}
        </span>
      ),
    },
    {
      key: "totalCalls",
      label: "Calls",
      render: (c) => (
        <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{c.totalCalls}</span>
      ),
    },
    {
      key: "totalAppointments",
      label: "Appts",
      render: (c) => (
        <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{c.totalAppointments}</span>
      ),
    },
    {
      key: "lastCallAt",
      label: "Last Call",
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
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
            >
              {tag}
            </span>
          ))}
          {(c.tags || []).length > 3 && (
            <span className="text-[10px]" style={{ color: "var(--db-text-muted)" }}>
              +{c.tags.length - 3}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--db-text)" }}>
            Customers
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--db-text-muted)" }}>
            {total} total customers
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            Import CSV
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
              { header: "Tags", accessor: (r) => r.tags.join("; ") },
            ]}
            filename="customers"
          />
          <Button onClick={() => setShowAddModal(true)}>
            + Add Customer
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full max-w-md rounded-lg border px-4 py-2 text-sm"
          style={{
            background: "var(--db-surface)",
            borderColor: "var(--db-border)",
            color: "var(--db-text)",
          }}
        />
      </div>

      {error && (
        <div className="db-card mb-4 flex items-center justify-between p-4" style={{ borderColor: "var(--db-danger)" }}>
          <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
          <Button variant="danger" size="sm" onClick={fetchCustomers}>Retry</Button>
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
            {search ? "No customers match your search" : "No customers yet"}
          </p>
          <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: "var(--db-text-muted)" }}>
            {search
              ? "Try a different search term."
              : `Your customer list builds automatically as ${receptionistName} takes calls.`}
          </p>
          {!search && (
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>
              Add Customer Manually
            </Button>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={customers}
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
    </div>
  );
}

function AddCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
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
      toast.success("Customer added successfully");
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
          Add Customer
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>Name *</label>
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
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>Phone *</label>
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
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>Email (optional)</label>
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
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Add Customer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
