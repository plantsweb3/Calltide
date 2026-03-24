"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string | null;
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
  createdAt: string;
}

export default function PortalInvoices() {
  const params = useParams();
  const token = params.token as string;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [token]);

  async function fetchInvoices() {
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/${token}/invoices`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }

  const outstanding = invoices.filter((i) =>
    ["pending", "sent", "overdue"].includes(i.status)
  );
  const paid = invoices.filter((i) => i.status === "paid");
  const other = invoices.filter(
    (i) => !["pending", "sent", "overdue", "paid"].includes(i.status)
  );
  const outstandingTotal = outstanding.reduce((sum, i) => sum + i.amount, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Invoices
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          View invoices and make payments.
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No invoices yet.</p>
        </div>
      ) : (
        <>
          {/* Outstanding summary */}
          {outstanding.length > 0 && (
            <div className="bg-gradient-to-r from-[#1B2A4A] to-[#243758] rounded-xl p-5 text-white shadow-lg">
              <p className="text-sm font-medium text-white/70">
                Outstanding Balance
              </p>
              <p className="text-3xl font-bold mt-1">
                ${outstandingTotal.toFixed(2)}
              </p>
              <p className="text-sm text-white/60 mt-1">
                {outstanding.length} invoice
                {outstanding.length !== 1 ? "s" : ""} pending
              </p>
            </div>
          )}

          {/* Outstanding invoices */}
          {outstanding.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Outstanding
              </h3>
              {outstanding.map((inv) => (
                <InvoiceCard
                  key={inv.id}
                  invoice={inv}
                  isExpanded={expandedId === inv.id}
                  onToggle={() =>
                    setExpandedId(expandedId === inv.id ? null : inv.id)
                  }
                />
              ))}
            </div>
          )}

          {/* Paid invoices */}
          {paid.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Paid
              </h3>
              {paid.map((inv) => (
                <InvoiceCard
                  key={inv.id}
                  invoice={inv}
                  isExpanded={expandedId === inv.id}
                  onToggle={() =>
                    setExpandedId(expandedId === inv.id ? null : inv.id)
                  }
                />
              ))}
            </div>
          )}

          {/* Other invoices (cancelled, etc.) */}
          {other.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Other
              </h3>
              {other.map((inv) => (
                <InvoiceCard
                  key={inv.id}
                  invoice={inv}
                  isExpanded={expandedId === inv.id}
                  onToggle={() =>
                    setExpandedId(expandedId === inv.id ? null : inv.id)
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function InvoiceCard({
  invoice,
  isExpanded,
  onToggle,
}: {
  invoice: Invoice;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isOutstanding = ["pending", "sent", "overdue"].includes(
    invoice.status
  );
  const isOverdue = invoice.status === "overdue";

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
        isOverdue ? "border-red-200" : "border-gray-200"
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-gray-900">
                {invoice.invoiceNumber
                  ? `Invoice #${invoice.invoiceNumber}`
                  : "Invoice"}
              </h4>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-lg font-bold text-gray-900 mt-1">
              ${invoice.amount.toFixed(2)}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
              <span>Created {formatDate(invoice.createdAt)}</span>
              {invoice.dueDate && (
                <span
                  className={isOverdue ? "text-red-500 font-medium" : ""}
                >
                  Due {formatDate(invoice.dueDate)}
                </span>
              )}
              {invoice.paidAt && (
                <span className="text-green-600">
                  Paid {formatDate(invoice.paidAt)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isOutstanding && invoice.paymentLinkUrl && (
              <a
                href={invoice.paymentLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium bg-[#D4A843] text-white rounded-lg hover:bg-[#c49a38] transition-colors shadow-sm"
              >
                Pay Now
              </a>
            )}
            {(invoice.lineItems?.length || invoice.notes) && (
              <button
                onClick={onToggle}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={isExpanded ? "Collapse details" : "Expand details"}
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-4 sm:px-5 py-4 bg-gray-50">
          {invoice.lineItems && invoice.lineItems.length > 0 && (
            <div className="mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium text-right">Qty</th>
                    <th className="pb-2 font-medium text-right">Price</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 text-gray-800">
                        {item.description}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        ${item.unit_price.toFixed(2)}
                      </td>
                      <td className="py-2 text-right font-medium text-gray-800">
                        ${item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(invoice.subtotal || invoice.taxAmount) && (
                <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                  {invoice.subtotal !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-800">
                        ${invoice.subtotal!.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {invoice.taxAmount !== null && invoice.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        Tax
                        {invoice.taxRate ? ` (${invoice.taxRate}%)` : ""}
                      </span>
                      <span className="text-gray-800">
                        ${invoice.taxAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">
                      ${invoice.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {invoice.notes && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}

          {invoice.paymentMethod && invoice.paidAt && (
            <div className="mt-3 bg-green-50 rounded-lg p-3 border border-green-100">
              <p className="text-xs font-medium text-green-700">
                Paid via {invoice.paymentMethod} on{" "}
                {formatDate(invoice.paidAt)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
