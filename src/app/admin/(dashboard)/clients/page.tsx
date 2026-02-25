"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable, { type Column } from "../../_components/data-table";
import AddClientModal from "../../_components/add-client-modal";
import ClientDetail from "../../_components/client-detail";

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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchClients = useCallback(async () => {
    const res = await fetch("/api/admin/clients");
    const data = await res.json();
    setClients(data);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

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
        <button
          onClick={() => setSelectedClient(row)}
          className="text-left font-medium text-blue-400 hover:text-blue-300"
        >
          {row.name}
        </button>
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
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-slate-400">
            {clients.length} businesses
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500"
        >
          Add Client
        </button>
      </div>

      <DataTable columns={columns} data={clients} />

      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onComplete={fetchClients}
        />
      )}

      {selectedClient && (
        <ClientDetail
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
}
