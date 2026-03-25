"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import DataTable, { type Column } from "@/components/data-table";
import { TableSkeleton } from "@/components/skeleton";
import ExportCsvButton from "@/app/dashboard/_components/csv-export";
import Button from "@/components/ui/button";
import StatusBadge, { statusToVariant } from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import MetricCard from "@/components/metric-card";
import ConfirmDialog from "@/components/confirm-dialog";
import LineItemsEditor, {
  type LineItem,
  calculateSubtotal,
  calculateTaxAmount,
  calculateTotal,
} from "@/app/dashboard/_components/line-items-editor";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

/* ─── Types ─── */

interface Invoice {
  id: string;
  invoiceNumber: string | null;
  estimateId: string | null;
  amount: number;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentLinkUrl: string | null;
  notes: string | null;
  lineItems: LineItem[] | null;
  subtotal: number | null;
  taxRate: number | null;
  taxAmount: number | null;
  smsSentAt: string | null;
  reminderCount: number;
  createdAt: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
}

interface Stats {
  outstanding: number;
  overdue: number;
  paidThisMonth: number;
  avgDaysToPay: number;
  totalCount: number;
  draftCount: number;
  sentCount: number;
  overdueCount: number;
  paidCount: number;
}

interface Customer {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
}

/* ─── Helpers ─── */

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string | null): string {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(invoice: Invoice): boolean {
  if (invoice.status === "paid" || invoice.status === "cancelled") return false;
  if (!invoice.dueDate) return false;
  return new Date(invoice.dueDate) < new Date();
}

/* ─── Tab Filter Config ─── */

type TabKey = "all" | "pending" | "sent" | "overdue" | "paid";

/* ─── Page Component ─── */

export default function InvoicesPage() {
  const [lang] = useLang();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats>({
    outstanding: 0, overdue: 0, paidThisMonth: 0, avgDaysToPay: 0,
    totalCount: 0, draftCount: 0, sentCount: 0, overdueCount: 0, paidCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Invoice | null>(null);
  const [showEdit, setShowEdit] = useState<Invoice | null>(null);

  // Action states
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [markPaidId, setMarkPaidId] = useState<string | null>(null);
  const [markPaidMethod, setMarkPaidMethod] = useState("cash");
  const [markPaidLoading, setMarkPaidLoading] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Create form state
  const [creating, setCreating] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formLineItems, setFormLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: 0, total: 0 },
  ]);
  const [formTaxRate, setFormTaxRate] = useState(0);
  const [formNotes, setFormNotes] = useState("");
  const [formDueDate, setFormDueDate] = useState("");

  // Edit form state
  const [editLineItems, setEditLineItems] = useState<LineItem[]>([]);
  const [editTaxRate, setEditTaxRate] = useState(0);
  const [editNotes, setEditNotes] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editCustomerId, setEditCustomerId] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Date filter state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /* ─── Tab and payment method config (needs lang) ─── */

  const TABS: { key: TabKey; label: string }[] = [
    { key: "all", label: t("invoices.all", lang) },
    { key: "pending", label: t("invoices.draft", lang) },
    { key: "sent", label: t("status.sent", lang) },
    { key: "overdue", label: t("invoices.overdue", lang) },
    { key: "paid", label: t("invoices.paid", lang) },
  ];

  const PAYMENT_METHODS = [
    { value: "cash", label: t("invoices.paymentMethods.cash", lang) },
    { value: "check", label: t("invoices.paymentMethods.check", lang) },
    { value: "zelle", label: "Zelle" },
    { value: "venmo", label: "Venmo" },
    { value: "stripe", label: t("invoices.paymentMethods.card", lang) },
    { value: "other", label: "Other" },
  ];

  /* ─── Data fetching ─── */

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("status", activeTab);
      if (search) params.set("search", search);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", page.toString());

      const res = await fetch(`/api/dashboard/invoices?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setInvoices(data.invoices || []);
      setStats(data.stats || stats);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load invoices. Please try again.");
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, page, dateFrom, dateTo]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // Fetch customers for the create form
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/customers?page=1");
      if (!res.ok) return;
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (showCreate || showEdit) fetchCustomers();
  }, [showCreate, showEdit, fetchCustomers]);

  /* ─── Actions ─── */

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const subtotal = calculateSubtotal(formLineItems);
    const taxAmount = calculateTaxAmount(subtotal, formTaxRate);
    const total = calculateTotal(subtotal, taxAmount);

    if (total <= 0) {
      toast.error("Invoice total must be greater than $0");
      return;
    }

    // Require at least one line item with a description
    const validItems = formLineItems.filter((i) => i.description.trim());
    if (validItems.length === 0) {
      toast.error("Add at least one line item with a description");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/dashboard/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: formCustomerId || undefined,
          amount: total,
          notes: formNotes || undefined,
          dueDate: formDueDate || undefined,
          lineItems: validItems,
          subtotal,
          taxRate: formTaxRate,
          taxAmount,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create invoice");
      }
      toast.success("Invoice created");
      resetCreateForm();
      fetchInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setCreating(false);
    }
  }

  function resetCreateForm() {
    setShowCreate(false);
    setFormCustomerId("");
    setFormLineItems([{ description: "", quantity: 1, unit_price: 0, total: 0 }]);
    setFormTaxRate(0);
    setFormNotes("");
    setFormDueDate("");
  }

  async function handleSend(invoiceId: string) {
    setSendingId(invoiceId);
    try {
      const res = await fetch(`/api/dashboard/invoices/${invoiceId}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      toast.success("Invoice sent to customer via SMS");
      fetchInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invoice");
    } finally {
      setSendingId(null);
    }
  }

  async function handleMarkPaid() {
    if (!markPaidId) return;
    setMarkPaidLoading(true);
    try {
      const res = await fetch(`/api/dashboard/invoices/${markPaidId}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: markPaidMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark as paid");
      toast.success("Invoice marked as paid");
      setMarkPaidId(null);
      fetchInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark as paid");
    } finally {
      setMarkPaidLoading(false);
    }
  }

  async function handleCancel() {
    if (!cancelId) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/dashboard/invoices/${cancelId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel");
      toast.success("Invoice cancelled");
      setCancelId(null);
      fetchInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel invoice");
    } finally {
      setCancelLoading(false);
    }
  }

  function openEdit(invoice: Invoice) {
    setShowEdit(invoice);
    setEditLineItems(invoice.lineItems || [{ description: "", quantity: 1, unit_price: 0, total: 0 }]);
    setEditTaxRate(invoice.taxRate || 0);
    setEditNotes(invoice.notes || "");
    setEditDueDate(invoice.dueDate || "");
    setEditCustomerId(invoice.customerId || "");
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!showEdit) return;

    const subtotal = calculateSubtotal(editLineItems);
    const taxAmount = calculateTaxAmount(subtotal, editTaxRate);
    const total = calculateTotal(subtotal, taxAmount);

    if (total <= 0) {
      toast.error("Invoice total must be greater than $0");
      return;
    }

    setEditSaving(true);
    try {
      const validItems = editLineItems.filter((i) => i.description.trim());
      const res = await fetch(`/api/dashboard/invoices/${showEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          notes: editNotes || undefined,
          dueDate: editDueDate || undefined,
          lineItems: validItems.length > 0 ? validItems : undefined,
          subtotal,
          taxRate: editTaxRate,
          taxAmount,
          customerId: editCustomerId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      toast.success("Invoice updated");
      setShowEdit(null);
      fetchInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update invoice");
    } finally {
      setEditSaving(false);
    }
  }

  /* ─── Tab counts ─── */

  function tabBadge(key: TabKey): string | undefined {
    switch (key) {
      case "all": return stats.totalCount ? String(stats.totalCount) : undefined;
      case "pending": return stats.draftCount ? String(stats.draftCount) : undefined;
      case "sent": return stats.sentCount ? String(stats.sentCount) : undefined;
      case "overdue": return stats.overdueCount ? String(stats.overdueCount) : undefined;
      case "paid": return stats.paidCount ? String(stats.paidCount) : undefined;
      default: return undefined;
    }
  }

  /* ─── Table columns ─── */

  const columns: Column<Invoice>[] = [
    {
      key: "invoiceNumber",
      label: "Invoice #",
      render: (row) => (
        <span className="text-sm font-mono font-medium" style={{ color: "var(--db-text)" }}>
          {row.invoiceNumber || row.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
      render: (row) => (
        <div>
          <span className="text-sm font-medium block" style={{ color: "var(--db-text)" }}>
            {row.customerName || "No customer"}
          </span>
          {row.customerPhone && (
            <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              {row.customerPhone}
            </span>
          )}
        </div>
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
      render: (row) => {
        const effectiveStatus = isOverdue(row) ? "overdue" : row.status;
        return <StatusBadge label={effectiveStatus} variant={statusToVariant(effectiveStatus)} dot />;
      },
    },
    {
      key: "dueDate",
      label: "Due Date",
      render: (row) => {
        const overdue = isOverdue(row);
        return (
          <span className="text-sm" style={{ color: overdue ? "var(--db-danger)" : "var(--db-text-muted)" }}>
            {formatDate(row.dueDate)}
            {overdue && <span className="ml-1 text-xs font-semibold uppercase">overdue</span>}
          </span>
        );
      },
    },
    {
      key: "smsSentAt",
      label: "Sent",
      render: (row) => (
        <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          {row.smsSentAt ? formatDate(row.smsSentAt) : "\u2014"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Send */}
          {row.status !== "paid" && row.status !== "cancelled" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleSend(row.id)}
              disabled={sendingId === row.id}
              title="Send invoice to customer"
            >
              {sendingId === row.id ? (
                <span className="text-xs">Sending...</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </Button>
          )}
          {/* Mark Paid */}
          {row.status !== "paid" && row.status !== "cancelled" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setMarkPaidId(row.id); setMarkPaidMethod("cash"); }}
              title="Mark as paid"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </Button>
          )}
          {/* Edit */}
          {row.status !== "paid" && row.status !== "cancelled" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openEdit(row)}
              title="Edit invoice"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </Button>
          )}
          {/* Cancel */}
          {row.status !== "paid" && row.status !== "cancelled" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCancelId(row.id)}
              title="Cancel invoice"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Button>
          )}
        </div>
      ),
    },
  ];

  /* ─── Render ─── */

  const inputStyle = {
    background: "var(--db-hover)",
    border: "1px solid var(--db-border)",
    color: "var(--db-text)",
  };

  return (
    <div>
      <PageHeader
        title={t("invoices.title", lang)}
        description="Create, send, and track payments from your customers."
        actions={
          <div className="flex items-center gap-2">
            <ExportCsvButton
              data={invoices}
              columns={[
                { header: "Invoice #", accessor: (r) => r.invoiceNumber },
                { header: "Customer", accessor: (r) => r.customerName || r.customerPhone },
                { header: "Amount", accessor: (r) => r.amount.toFixed(2) },
                { header: "Status", accessor: (r) => r.status },
                { header: "Due Date", accessor: (r) => r.dueDate },
                { header: "Paid At", accessor: (r) => r.paidAt },
                { header: "Created", accessor: (r) => r.createdAt },
                { header: "Notes", accessor: (r) => r.notes },
              ]}
              filename="invoices"
            />
            <Button onClick={() => setShowCreate(true)}>+ {t("invoices.newInvoice", lang)}</Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4 stagger-grid">
        <MetricCard
          label="Outstanding"
          value={formatCurrency(stats.outstanding)}
        />
        <MetricCard
          label="Overdue"
          value={formatCurrency(stats.overdue)}
          changeType={stats.overdue > 0 ? "negative" : "neutral"}
          change={stats.overdueCount > 0 ? `${stats.overdueCount} invoice${stats.overdueCount > 1 ? "s" : ""}` : undefined}
        />
        <MetricCard
          label="Paid This Month"
          value={formatCurrency(stats.paidThisMonth)}
          changeType="positive"
        />
        <MetricCard
          label="Avg. Days to Pay"
          value={stats.avgDaysToPay > 0 ? `${stats.avgDaysToPay}d` : "\u2014"}
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div role="alert" aria-live="assertive" className="rounded-xl p-4 mb-4 flex items-center justify-between" style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)" }}>
          <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
          <Button variant="danger" size="sm" onClick={fetchInvoices}>{t("action.retry", lang)}</Button>
        </div>
      )}

      {/* Tab Filters */}
      <div
        className="flex items-center gap-1 mb-4 p-1 rounded-xl overflow-x-auto"
        style={{ background: "var(--db-hover)" }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const badge = tabBadge(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background: isActive ? "var(--db-card)" : "transparent",
                color: isActive ? "var(--db-text)" : "var(--db-text-muted)",
                boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {tab.label}
              {badge && (
                <span
                  className="inline-flex items-center justify-center rounded-full px-1.5 min-w-[20px] h-5 text-xs font-bold"
                  style={{
                    background: isActive ? "var(--db-accent)" : "var(--db-border)",
                    color: isActive ? "#fff" : "var(--db-text-muted)",
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Date Range + Search */}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="rounded-lg px-2 py-1.5 text-xs outline-none"
              style={{
                background: "var(--db-card)",
                border: "1px solid var(--db-border)",
                color: "var(--db-text)",
              }}
              title="From date"
            />
            <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="rounded-lg px-2 py-1.5 text-xs outline-none"
              style={{
                background: "var(--db-card)",
                border: "1px solid var(--db-border)",
                color: "var(--db-text)",
              }}
              title="To date"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
                className="text-xs font-medium px-1.5"
                style={{ color: "var(--db-accent)" }}
                title="Clear date filter"
              >
                Clear
              </button>
            )}
          </div>
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="rounded-lg px-3 py-1.5 text-sm outline-none transition-all w-44"
            style={{
              background: "var(--db-card)",
              border: "1px solid var(--db-border)",
              color: "var(--db-text)",
            }}
          />
        </div>
      </div>

      {/* Loading / Empty / Data */}
      {loading && invoices.length === 0 && <TableSkeleton rows={5} />}

      {!loading && invoices.length === 0 && (
        <EmptyState
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          title="No invoices yet"
          description="Create your first invoice to start tracking payments and collecting money from customers."
          action={{ label: "Create Invoice", onClick: () => setShowCreate(true) }}
        />
      )}

      {invoices.length > 0 && (
        <DataTable
          columns={columns}
          data={invoices}
          pagination={totalPages > 1 ? {
            page,
            totalPages,
            total,
            onPageChange: setPage,
          } : undefined}
          expandedContent={(row) => (
            <div className="space-y-3">
              {/* Line items preview */}
              {row.lineItems && row.lineItems.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
                    Line Items
                  </p>
                  {row.lineItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span style={{ color: "var(--db-text-secondary)" }}>
                        {item.description} <span style={{ color: "var(--db-text-muted)" }}>x{item.quantity}</span>
                      </span>
                      <span className="font-mono tabular-nums" style={{ color: "var(--db-text)" }}>
                        ${item.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {row.taxRate != null && row.taxRate > 0 && (
                    <div className="flex items-center justify-between text-sm pt-1 border-t" style={{ borderColor: "var(--db-border)" }}>
                      <span style={{ color: "var(--db-text-muted)" }}>Tax ({row.taxRate}%)</span>
                      <span className="font-mono tabular-nums" style={{ color: "var(--db-text)" }}>
                        ${(row.taxAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {row.notes && (
                <p className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{row.notes}</p>
              )}
              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--db-text-muted)" }}>
                {row.smsSentAt && <span>SMS sent: {formatDate(row.smsSentAt)}</span>}
                {row.reminderCount > 0 && <span>Reminders: {row.reminderCount}</span>}
                {row.paidAt && (
                  <span style={{ color: "var(--db-success)" }}>
                    Paid: {formatDate(row.paidAt)}
                    {row.paymentMethod && ` via ${row.paymentMethod}`}
                  </span>
                )}
                {row.estimateId && (
                  <span style={{ color: "var(--db-accent)" }}>Converted from estimate</span>
                )}
                {row.paymentLinkUrl && (
                  <a
                    href={row.paymentLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: "var(--db-accent)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Payment link
                  </a>
                )}
              </div>
            </div>
          )}
        />
      )}

      {/* ─── Create Invoice Modal ─── */}
      {showCreate && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => resetCreateForm()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-invoice-title"
            className="modal-content db-card w-full max-w-2xl rounded-xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape") resetCreateForm(); }}
          >
            <h3 id="create-invoice-title" className="text-lg font-semibold mb-5" style={{ color: "var(--db-text)" }}>
              {t("invoices.newInvoice", lang)}
            </h3>
            <form onSubmit={handleCreate} className="space-y-5">
              {/* Customer selection */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                    Customer
                  </label>
                  <select
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={inputStyle}
                  >
                    <option value="">No customer selected</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.phone}{c.name ? ` (${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
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
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--db-text-muted)" }}>
                  Line Items
                </label>
                <LineItemsEditor
                  items={formLineItems}
                  onChange={setFormLineItems}
                  taxRate={formTaxRate}
                  onTaxRateChange={setFormTaxRate}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                  Notes
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Payment terms, special instructions..."
                  rows={2}
                  className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" type="button" onClick={resetCreateForm}>
                  {t("action.cancel", lang)}
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : t("invoices.newInvoice", lang)}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit Invoice Modal ─── */}
      {showEdit && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowEdit(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-invoice-title"
            className="modal-content db-card w-full max-w-2xl rounded-xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape") setShowEdit(null); }}
          >
            <h3 id="edit-invoice-title" className="text-lg font-semibold mb-1" style={{ color: "var(--db-text)" }}>
              {t("invoices.editInvoice", lang)}
            </h3>
            <p className="text-sm mb-5" style={{ color: "var(--db-text-muted)" }}>
              {showEdit.invoiceNumber || showEdit.id.slice(0, 8).toUpperCase()}
            </p>
            <form onSubmit={handleEditSave} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                    Customer
                  </label>
                  <select
                    value={editCustomerId}
                    onChange={(e) => setEditCustomerId(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={inputStyle}
                  >
                    <option value="">No customer selected</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.phone}{c.name ? ` (${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--db-text-muted)" }}>
                  Line Items
                </label>
                <LineItemsEditor
                  items={editLineItems}
                  onChange={setEditLineItems}
                  taxRate={editTaxRate}
                  onTaxRateChange={setEditTaxRate}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Payment terms, special instructions..."
                  rows={2}
                  className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" type="button" onClick={() => setShowEdit(null)}>
                  {t("action.cancel", lang)}
                </Button>
                <Button type="submit" disabled={editSaving}>
                  {editSaving ? "Saving..." : t("action.save", lang)}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Mark Paid Modal ─── */}
      {markPaidId && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setMarkPaidId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mark-paid-title"
            className="modal-content db-card w-full max-w-sm rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape") setMarkPaidId(null); }}
          >
            <h3 id="mark-paid-title" className="text-lg font-semibold mb-4" style={{ color: "var(--db-text)" }}>
              {t("invoices.markPaid", lang)}
            </h3>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
              Payment Method
            </label>
            <select
              value={markPaidMethod}
              onChange={(e) => setMarkPaidMethod(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm mb-4 outline-none"
              style={inputStyle}
              autoFocus
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setMarkPaidId(null)}>
                {t("action.cancel", lang)}
              </Button>
              <Button
                className="flex-1"
                onClick={handleMarkPaid}
                disabled={markPaidLoading}
                style={{ background: "var(--db-success)", color: "#fff" }}
              >
                {markPaidLoading ? "Saving..." : t("invoices.recordPayment", lang)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Cancel Confirmation ─── */}
      <ConfirmDialog
        open={!!cancelId}
        title="Cancel Invoice"
        description="This will cancel the invoice. This action cannot be undone. The customer will no longer be able to pay via the payment link."
        confirmLabel="Cancel Invoice"
        variant="danger"
        loading={cancelLoading}
        onConfirm={handleCancel}
        onCancel={() => setCancelId(null)}
      />
    </div>
  );
}
