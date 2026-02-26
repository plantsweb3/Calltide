"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import DataTable, { type Column } from "../../_components/data-table";
import AddClientModal from "../../_components/add-client-modal";

interface Client {
  id: string;
  name: string;
  type: string;
  ownerName: string;
  ownerPhone: string;
  active: boolean;
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchClients = useCallback(async () => {
    const res = await fetch("/api/admin/clients");
    const data = await res.json();
    setClients(data);
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
          className="text-left font-medium text-blue-400 hover:text-blue-300"
        >
          {row.name}
        </Link>
      ),
    },
    { key: "type", label: "Type", sortable: true },
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
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            row.active
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
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
          <p className="text-sm text-slate-400">
            {filteredClients.length} of {clients.length} businesses
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500"
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
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-slate-600"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-600"
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
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-600"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <DataTable columns={columns} data={filteredClients} />

      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onComplete={fetchClients}
        />
      )}
    </div>
  );
}
