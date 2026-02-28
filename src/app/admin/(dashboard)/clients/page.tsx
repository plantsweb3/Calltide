"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import DataTable, { type Column } from "../../_components/data-table";
import AddClientModal from "../../_components/add-client-modal";
import { TableSkeleton } from "@/components/skeleton";

interface Client {
  id: string;
  name: string;
  type: string;
  ownerName: string;
  ownerPhone: string;
  active: boolean;
  planType: string;
  mrr: number;
  createdAt: string;
  calls: { totalCalls: number; completedCalls: number; missedCalls: number };
  appointments: { totalAppointments: number; confirmed: number; completed: number };
  health: "green" | "amber" | "red";
}

const healthColors = {
  green: "bg-green-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/clients");
      if (!res.ok) throw new Error("Failed to load clients");
      const data = await res.json();
      setClients(data);
    } catch {
      setError("Failed to load clients. Please try again.");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && c.type !== typeFilter) return false;
    if (statusFilter === "active" && !c.active) return false;
    if (statusFilter === "inactive" && c.active) return false;
    return true;
  });

  const types = Array.from(new Set(clients.map((c) => c.type)));

  const columns: Column<Client>[] = [
    {
      key: "health",
      label: "",
      render: (row) => (
        <div
          className={`h-2.5 w-2.5 rounded-full ${healthColors[row.health]}`}
          title={`Health: ${row.health}`}
        />
      ),
    },
    {
      key: "name",
      label: "Business",
      sortable: true,
      render: (row) => (
        <Link
          href={`/admin/clients/${row.id}`}
          className="text-left font-medium"
          style={{ color: "var(--db-accent)" }}
        >
          {row.name}
        </Link>
      ),
    },
    { key: "type", label: "Type", sortable: true },
    {
      key: "planType",
      label: "Plan",
      render: (row) => (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={
            row.planType === "annual"
              ? { background: "rgba(74,222,128,0.1)", color: "#4ade80" }
              : { background: "var(--db-hover)", color: "var(--db-text-muted)" }
          }
        >
          {row.planType === "annual" ? "Annual" : "Monthly"}
        </span>
      ),
    },
    { key: "ownerName", label: "Owner" },
    {
      key: "calls",
      label: "Calls",
      render: (row) => (
        <span className="text-xs">
          {row.calls.completedCalls}/{row.calls.totalCalls}
        </span>
      ),
    },
    {
      key: "appointments",
      label: "Appointments",
      render: (row) => (
        <span className="text-xs">{row.appointments.totalAppointments}</span>
      ),
    },
    {
      key: "active",
      label: "Status",
      render: (row) => (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={
            row.active
              ? { background: "rgba(74,222,128,0.1)", color: "#4ade80" }
              : { background: "rgba(248,113,113,0.1)", color: "#f87171" }
          }
        >
          {row.active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
            {filteredClients.length} of {clients.length} businesses
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          style={{ background: "var(--db-accent)", color: "#fff" }}
        >
          Add Client
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search businesses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            border: "1px solid var(--db-border)",
            background: "var(--db-card)",
            color: "var(--db-text)",
          }}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            border: "1px solid var(--db-border)",
            background: "var(--db-card)",
            color: "var(--db-text)",
          }}
        >
          <option value="">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            border: "1px solid var(--db-border)",
            background: "var(--db-card)",
            color: "var(--db-text)",
          }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          <button
            onClick={fetchClients}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}
          >
            Retry
          </button>
        </div>
      )}

      {loading && clients.length === 0 && !error ? (
        <TableSkeleton rows={6} />
      ) : (
        <DataTable columns={columns} data={filteredClients} />
      )}

      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onComplete={() => {
            toast.success("Client added successfully");
            fetchClients();
          }}
        />
      )}
    </div>
  );
}
