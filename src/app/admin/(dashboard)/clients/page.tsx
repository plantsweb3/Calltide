"use client";

import { useEffect, useState } from "react";
import DataTable, { type Column } from "../../_components/data-table";

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

  useEffect(() => {
    fetch("/api/admin/clients")
      .then((r) => r.json())
      .then(setClients);
  }, []);

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
    { key: "name", label: "Business", sortable: true },
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
      <div>
        <h1 className="text-2xl font-semibold">Clients</h1>
        <p className="text-sm text-slate-400">
          {clients.length} businesses
        </p>
      </div>

      <DataTable columns={columns} data={clients} />
    </div>
  );
}
