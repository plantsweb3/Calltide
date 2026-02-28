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
  accountId?: string;
  locationName?: string;
  isPrimaryLocation?: boolean;
  calls: { totalCalls: number; completedCalls: number; missedCalls: number };
  appointments: { totalAppointments: number; confirmed: number; completed: number };
  health: "green" | "amber" | "red";
}

interface AccountGroup {
  account: { id: string; companyName: string | null; ownerName: string; ownerEmail: string; locationCount: number; planType: string };
  locations: Client[];
}

interface ClientsResponse {
  accounts: AccountGroup[];
  ungrouped: Client[];
  businesses: Client[];
}

const healthColors = {
  green: "bg-green-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/clients");
      if (!res.ok) throw new Error("Failed to load clients");
      const data: ClientsResponse = await res.json();
      setClients(data.businesses ?? data);
      setAccountGroups(data.accounts ?? []);
    } catch {
      setError("Failed to load clients. Please try again.");
      setClients([]);
      setAccountGroups([]);
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

      {/* Multi-location accounts */}
      {accountGroups.filter((g) => g.locations.length > 1).length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold" style={{ color: "var(--db-text-muted)" }}>
            Multi-Location Accounts
          </h2>
          {accountGroups
            .filter((g) => g.locations.length > 1)
            .map((group) => {
              const isExpanded = expandedAccounts.has(group.account.id);
              return (
                <div
                  key={group.account.id}
                  className="rounded-xl overflow-hidden"
                  style={{ border: "1px solid var(--db-border)" }}
                >
                  <button
                    onClick={() => {
                      setExpandedAccounts((prev) => {
                        const next = new Set(prev);
                        if (next.has(group.account.id)) next.delete(group.account.id);
                        else next.add(group.account.id);
                        return next;
                      });
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                    style={{ background: "var(--db-card)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
                        {group.account.companyName || group.account.ownerName}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}
                      >
                        {group.locations.length} locations
                      </span>
                      <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                        {group.account.ownerEmail}
                      </span>
                    </div>
                    <svg
                      width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                      style={{ color: "var(--db-text-muted)", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-3 space-y-1" style={{ background: "var(--db-surface)" }}>
                      {group.locations.map((loc) => (
                        <div
                          key={loc.id}
                          className="flex items-center justify-between rounded-lg px-3 py-2"
                          style={{ background: "var(--db-hover)" }}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${healthColors[loc.health]}`} />
                            <Link
                              href={`/admin/clients/${loc.id}`}
                              className="text-sm font-medium"
                              style={{ color: "var(--db-accent)" }}
                            >
                              {loc.locationName ?? loc.name}
                            </Link>
                            {loc.isPrimaryLocation && (
                              <span className="text-[10px] font-medium" style={{ color: "var(--db-text-muted)" }}>Primary</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--db-text-muted)" }}>
                            <span>{loc.calls.totalCalls} calls</span>
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={loc.active ? { background: "rgba(74,222,128,0.1)", color: "#4ade80" } : { background: "rgba(248,113,113,0.1)", color: "#f87171" }}
                            >
                              {loc.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
