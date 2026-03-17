"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import DataTable, { type Column } from "@/components/data-table";
import { TableSkeleton } from "@/components/skeleton";
import ExportCsvButton from "@/app/dashboard/_components/csv-export";
import Button from "@/components/ui/button";
import StatusBadge from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import MetricCard from "@/components/metric-card";

interface Invoice {
  id: string;
  amount: number;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
  smsSentAt: string | null;
  reminderCount: number;
  createdAt: string;
  customerName: string | null;
  customerPhone: string | null;
}

interface Stats {
  pending: number;
  paid: number;
  overdue: number;
}

const STATUS_VARIANT: Record<string, "info" | "accent" | "success" | "danger" | "neutral"> = {
  pending: "info",
  sent: "accent",
  paid: "success",
  overdue: "danger",
};

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString("en", { minimumFractionDigits: 2 })}`;
}

function formatDate(d: string | null): string {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, paid: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form
  const [formAmount, setFormAmount] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formDueDate, setFormDueDate] = useState("");

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/dashboard/invoices?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setInvoices(data.invoices || []);
      setStats(data.stats || { pending: 0, paid: 0, overdue: 0 });
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/dashboard/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          notes: formNotes || undefined,
          dueDate: formDueDate || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create invoice");
      toast.success("Invoice created");
      setShowCreate(false);
      setFormAmount("");
      setFormNotes("");
      setFormDueDate("");
      fetchInvoices();
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setCreating(false);
    }
  }

  const columns: Column<Invoice>[] = [
    {
      key: "customerName",
      label: "Customer",
      render: (row) => (
        <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
          {row.customerName || row.customerPhone || "N/A"}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) => (
        <span className="text-sm font-semibold font-mono" style={{ color: "var(--db-text)" }}>
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusBadge label={row.status} variant={STATUS_VARIANT[row.status] || "neutral"} />
      ),
    },
    {
      key: "dueDate",
      label: "Due Date",
      render: (row) => (
        <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          {formatDate(row.dueDate)}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (row) => (
        <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  const pipelineCards = [
    { key: null, label: "All", value: stats.pending + stats.paid + stats.overdue },
    { key: "pending", label: "Pending", value: stats.pending },
    { key: "paid", label: "Paid", value: stats.paid },
    { key: "overdue", label: "Overdue", value: stats.overdue },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        actions={
          <div className="flex items-center gap-2">
            <ExportCsvButton
              data={invoices}
              columns={[
                { header: "Customer", accessor: (r) => r.customerName || r.customerPhone },
                { header: "Amount", accessor: (r) => (r.amount / 100).toFixed(2) },
                { header: "Status", accessor: (r) => r.status },
                { header: "Due Date", accessor: (r) => r.dueDate },
                { header: "Created", accessor: (r) => r.createdAt },
                { header: "Notes", accessor: (r) => r.notes },
              ]}
              filename="invoices"
            />
            <Button onClick={() => setShowCreate(true)}>+ Create Invoice</Button>
          </div>
        }
      />

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4 stagger-grid">
        {pipelineCards.map((card) => (
          <button
            key={card.key || "all"}
            onClick={() => setStatusFilter(card.key)}
            className="text-left"
          >
            <MetricCard
              label={card.label}
              value={formatCurrency(card.value)}
            />
          </button>
        ))}
      </div>

      {loading && invoices.length === 0 && <TableSkeleton rows={5} />}

      {!loading && invoices.length === 0 && (
        <EmptyState
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          title="No invoices yet"
          description="Create your first invoice to start tracking payments."
          action={{ label: "Create Invoice", onClick: () => setShowCreate(true) }}
        />
      )}

      {invoices.length > 0 && (
        <DataTable
          columns={columns}
          data={invoices}
          expandedContent={(row) => (
            <div className="space-y-2">
              {row.notes && (
                <p className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{row.notes}</p>
              )}
              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--db-text-muted)" }}>
                {row.smsSentAt && <span>SMS sent: {formatDate(row.smsSentAt)}</span>}
                <span>Reminders: {row.reminderCount}</span>
                {row.paidAt && <span style={{ color: "#4ade80" }}>Paid: {formatDate(row.paidAt)}</span>}
              </div>
            </div>
          )}
        />
      )}

      {/* Create Invoice Modal */}
      {showCreate && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
          onKeyDown={(e) => { if (e.key === "Escape") setShowCreate(false); }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-content db-card w-full max-w-md rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--db-text)" }}>
              Create Invoice
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                  Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  autoFocus
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--db-hover)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--db-hover)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                  Notes
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional notes..."
                  rows={3}
                  className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--db-hover)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
