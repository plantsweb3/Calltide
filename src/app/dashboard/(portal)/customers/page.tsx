"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/dashboard/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--db-text)" }}>
            Customers
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--db-text-muted)" }}>
            {total} total customers
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ background: "var(--db-accent)" }}
        >
          + Add Customer
        </button>
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

      {/* Table */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--db-border)", background: "var(--db-surface)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: "var(--db-accent)" }} />
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>
              {search ? "No customers match your search" : "No customers yet"}
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--db-text-muted)" }}>
              {search
                ? "Try a different search term."
                : "Your customer list builds automatically as María takes calls."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--db-border)" }}>
                {["Name", "Phone", "Calls", "Appts", "Last Call", "Tags"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: "1px solid var(--db-border)" }}
                  onClick={() => router.push(`/dashboard/customers/${c.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--db-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                        {c.name || "Unknown"}
                      </span>
                      {c.isRepeat && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={{ background: "var(--db-accent)", color: "#fff" }}
                        >
                          REPEAT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--db-text-secondary)" }}>
                    {c.phone}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--db-text-secondary)" }}>
                    {c.totalCalls}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--db-text-secondary)" }}>
                    {c.totalAppointments}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--db-text-muted)" }}>
                    {formatDate(c.lastCallAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {(c.tags || []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded px-1.5 py-0.5 text-[10px]"
                          style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-40"
            style={{ background: "var(--db-hover)", color: "var(--db-text)" }}
          >
            Previous
          </button>
          <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg px-3 py-1.5 text-sm disabled:opacity-40"
            style={{ background: "var(--db-hover)", color: "var(--db-text)" }}
          >
            Next
          </button>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            fetchCustomers();
          }}
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
      onCreated();
    } catch {
      setError("Failed to create customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-md rounded-xl p-6"
        style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--db-text)" }}>
          Add Customer
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
          />
          <input
            type="tel"
            placeholder="Phone *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg px-4 py-2 text-sm"
              style={{ background: "var(--db-hover)", color: "var(--db-text)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: "var(--db-accent)" }}
            >
              {saving ? "Saving..." : "Add Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
