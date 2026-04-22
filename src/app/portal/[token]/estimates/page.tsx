"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Estimate {
  id: string;
  service: string | null;
  description: string | null;
  status: string;
  amount: number | null;
  notes: string | null;
  lineItems: LineItem[] | null;
  subtotal: number | null;
  taxRate: number | null;
  taxAmount: number | null;
  validUntil: string | null;
  createdAt: string;
}

export default function PortalEstimates() {
  const params = useParams();
  const token = params.token as string;

  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchEstimates();
  }, [token]);

  async function fetchEstimates() {
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/${token}/estimates`);
      if (res.ok) {
        const data = await res.json();
        setEstimates(data.estimates || []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(estimateId: string) {
    setAcceptingId(estimateId);
    try {
      const res = await fetch(`/api/portal/${token}/estimates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimateId }),
      });
      if (res.ok) {
        await fetchEstimates();
      }
    } catch {
      // Silent fail
    } finally {
      setAcceptingId(null);
    }
  }

  const openEstimates = estimates.filter((e) =>
    ["new", "sent", "follow_up"].includes(e.status)
  );
  const closedEstimates = estimates.filter(
    (e) => !["new", "sent", "follow_up"].includes(e.status)
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        {[1, 2].map((i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Estimates
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Review and accept estimates for proposed work.
        </p>
      </div>

      {estimates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No estimates yet.</p>
        </div>
      ) : (
        <>
          {/* Open estimates */}
          {openEstimates.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Open Estimates
              </h3>
              {openEstimates.map((est) => (
                <EstimateCard
                  key={est.id}
                  estimate={est}
                  isExpanded={expandedId === est.id}
                  onToggle={() =>
                    setExpandedId(expandedId === est.id ? null : est.id)
                  }
                  onAccept={() => handleAccept(est.id)}
                  isAccepting={acceptingId === est.id}
                  showActions
                />
              ))}
            </div>
          )}

          {/* Closed estimates */}
          {closedEstimates.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Past Estimates
              </h3>
              {closedEstimates.map((est) => (
                <EstimateCard
                  key={est.id}
                  estimate={est}
                  isExpanded={expandedId === est.id}
                  onToggle={() =>
                    setExpandedId(expandedId === est.id ? null : est.id)
                  }
                  onAccept={() => {}}
                  isAccepting={false}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EstimateCard({
  estimate,
  isExpanded,
  onToggle,
  onAccept,
  isAccepting,
  showActions,
}: {
  estimate: Estimate;
  isExpanded: boolean;
  onToggle: () => void;
  onAccept: () => void;
  isAccepting: boolean;
  showActions: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-gray-900">
                {estimate.service || "Estimate"}
              </h4>
              <StatusBadge status={estimate.status} />
            </div>
            {estimate.amount !== null && (
              <p className="text-lg font-bold text-gray-900 mt-1">
                ${estimate.amount.toFixed(2)}
              </p>
            )}
            {estimate.description && (
              <p className="text-sm text-gray-600 mt-1">
                {estimate.description}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Created {formatDate(estimate.createdAt)}
              {estimate.validUntil && (
                <span>
                  {" "}
                  &middot; Valid until {formatDate(estimate.validUntil)}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {showActions && (
              <button
                onClick={onAccept}
                disabled={isAccepting}
                className="px-4 py-2 text-sm font-medium bg-navy text-white rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50"
              >
                {isAccepting ? "Accepting..." : "Accept"}
              </button>
            )}
            {(estimate.lineItems?.length || estimate.notes) && (
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
          {estimate.lineItems && estimate.lineItems.length > 0 && (
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
                  {estimate.lineItems.map((item, i) => (
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
              {(estimate.subtotal || estimate.taxAmount) && (
                <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                  {estimate.subtotal !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-800">
                        ${estimate.subtotal!.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {estimate.taxAmount !== null && estimate.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        Tax
                        {estimate.taxRate ? ` (${estimate.taxRate}%)` : ""}
                      </span>
                      <span className="text-gray-800">
                        ${estimate.taxAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {estimate.amount !== null && (
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">
                        ${estimate.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {estimate.notes && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{estimate.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    sent: "bg-blue-100 text-blue-700",
    follow_up: "bg-amber-100 text-amber-700",
    won: "bg-green-100 text-green-700",
    lost: "bg-gray-100 text-gray-500",
    expired: "bg-gray-100 text-gray-500",
  };

  const labels: Record<string, string> = {
    new: "New",
    sent: "Sent",
    follow_up: "Follow Up",
    won: "Accepted",
    lost: "Declined",
    expired: "Expired",
  };

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {labels[status] || status.replace(/_/g, " ")}
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
