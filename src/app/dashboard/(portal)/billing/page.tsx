"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import LoadingSpinner from "@/app/dashboard/_components/loading-spinner";
import Button from "@/components/ui/button";
import StatusBadge, { statusToVariant } from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";

interface BillingData {
  plan: string;
  planType: "monthly" | "annual";
  price: number;
  status: string;
  stripeSubscriptionStatus: string | null;
  nextBillingAt: string | null;
  cardLast4: string | null;
  cardExpMonth: number | null;
  cardExpYear: number | null;
  lifetimeRevenue: number;
  hasStripeCustomer: boolean;
  locationCount?: number;
  additionalLocationPrice?: number;
  totalMonthly?: number;
  invoices: { id: string; amount: number; date: string; invoiceId: string | null }[];
}

function fmt(cents: number): string {
  return `$${(cents / 100).toLocaleString("en", { minimumFractionDigits: 2 })}`;
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/billing")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError("Failed to load billing data"));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)" }}>
        <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
        <button
          onClick={() => { setError(null); window.location.reload(); }}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return <LoadingSpinner message="Loading billing..." />;

  const isPastDue = ["past_due", "grace_period"].includes(data.status);
  const isMonthly = data.planType === "monthly";

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      }
    } catch {
      toast.error("Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  async function switchToAnnual() {
    setSwitchLoading(true);
    try {
      const res = await fetch("/api/dashboard/billing/switch-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "annual" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to switch plan");
      toast.success("Switched to annual plan! You're saving $1,200/year.");
      // Refresh billing data
      const refreshRes = await fetch("/api/dashboard/billing");
      const refreshData = await refreshRes.json();
      setData(refreshData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to switch plan");
    } finally {
      setSwitchLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Manage your subscription and payment method"
      />

      {/* Past Due Banner */}
      {isPastDue && (
        <div
          className="flex items-center gap-3 rounded-xl p-4"
          style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
          }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "#f87171" }}>
              Payment Past Due
            </p>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              Your recent payment was declined. Please update your payment method to avoid service interruption.
            </p>
          </div>
          {data.hasStripeCustomer && (
            <Button variant="danger" onClick={openPortal} disabled={portalLoading}>
              {portalLoading ? "Loading..." : "Update Payment"}
            </Button>
          )}
        </div>
      )}

      {/* Annual Upgrade Card — only for monthly clients */}
      {isMonthly && !isPastDue && data.status === "active" && (
        <div
          className="rounded-xl p-5"
          style={{
            background: "linear-gradient(135deg, rgba(197,154,39,0.08), rgba(197,154,39,0.02))",
            border: "1px solid rgba(197,154,39,0.3)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold" style={{ color: "var(--db-accent)" }}>
                  Save $1,200/year with Annual Billing
                </h3>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}
                >
                  SAVE 20%
                </span>
              </div>
              <p className="mt-2 text-sm" style={{ color: "var(--db-text-muted)" }}>
                Switch from $497/mo to $397/mo billed annually at $4,764/year.
                Same features, same service — just $100/mo less.
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: "var(--db-text-muted)" }}>
                <span>$497/mo &rarr; $397/mo</span>
                <span>|</span>
                <span>$5,964/yr &rarr; $4,764/yr</span>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => setShowSwitchConfirm(true)}
              disabled={switchLoading}
              className="shrink-0"
            >
              {switchLoading ? "Switching..." : "Switch to Annual"}
            </Button>
          </div>
        </div>
      )}

      {/* Plan Card */}
      <div className="db-card rounded-xl p-5">
        <h3
          className="mb-4 text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--db-text-muted)" }}
        >
          Your Plan
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
                {data.plan}
              </p>
              {data.planType === "annual" && (
                <StatusBadge label="Annual" variant="success" />
              )}
            </div>
            <p className="text-2xl font-bold mt-1" style={{ color: "var(--db-accent)" }}>
              {fmt(data.price)}
              <span className="text-sm font-normal" style={{ color: "var(--db-text-muted)" }}>
                /month{data.planType === "annual" ? " (billed annually)" : ""}
              </span>
            </p>
          </div>
          <StatusBadge label={data.status.replace(/_/g, " ")} variant={statusToVariant(data.status)} dot />
        </div>
      </div>

      {/* Locations Breakdown */}
      {(data.locationCount ?? 1) > 1 && (
        <div className="db-card rounded-xl p-5">
          <h3
            className="mb-4 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--db-text-muted)" }}
          >
            Locations
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--db-hover)" }}>
              <span className="text-sm" style={{ color: "var(--db-text)" }}>Base plan (1 location)</span>
              <span className="text-sm font-medium font-mono" style={{ color: "var(--db-text)" }}>{fmt(data.price)}/mo</span>
            </div>
            <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--db-hover)" }}>
              <span className="text-sm" style={{ color: "var(--db-text)" }}>
                Additional locations ({(data.locationCount ?? 1) - 1} &times; {fmt(data.additionalLocationPrice ?? 0)}/mo)
              </span>
              <span className="text-sm font-medium font-mono" style={{ color: "var(--db-text)" }}>
                {fmt(((data.locationCount ?? 1) - 1) * (data.additionalLocationPrice ?? 0))}/mo
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ borderTop: "1px solid var(--db-border)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>Total</span>
              <span className="text-sm font-bold font-mono" style={{ color: "var(--db-accent)" }}>
                {fmt(data.totalMonthly ?? data.price)}/mo
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div className="db-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--db-text-muted)" }}
          >
            Payment Method
          </h3>
          {data.hasStripeCustomer && (
            <Button variant="ghost" size="sm" onClick={openPortal} disabled={portalLoading}>
              {portalLoading ? "Loading..." : "Update"}
            </Button>
          )}
        </div>
        {data.cardLast4 ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-14 items-center justify-center rounded-lg" style={{ background: "var(--db-hover)" }}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--db-text-muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                •••• •••• •••• {data.cardLast4}
              </p>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                Expires {String(data.cardExpMonth).padStart(2, "0")}/{data.cardExpYear}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
            No payment method on file
          </p>
        )}
      </div>

      {/* Next Billing */}
      {data.nextBillingAt && (
        <div className="db-card rounded-xl p-5">
          <h3
            className="mb-2 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--db-text-muted)" }}
          >
            Next Billing Date
          </h3>
          <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>
            {new Date(data.nextBillingAt).toLocaleDateString("en", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      )}

      {/* Invoice History */}
      {data.invoices.length > 0 && (
        <div className="db-card rounded-xl p-5">
          <h3
            className="mb-4 text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--db-text-muted)" }}
          >
            Invoice History
          </h3>
          <div className="space-y-2">
            {data.invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: "var(--db-hover)" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                    {new Date(inv.date).toLocaleDateString("en", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-medium" style={{ color: "var(--db-text)" }}>
                    {fmt(inv.amount ?? 0)}
                  </span>
                  <StatusBadge label="Paid" variant="success" dot />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manage Billing */}
      {data.hasStripeCustomer && (
        <div className="flex justify-center">
          <Button size="lg" onClick={openPortal} disabled={portalLoading}>
            {portalLoading ? "Opening Portal..." : "Manage Billing in Stripe"}
          </Button>
        </div>
      )}

      {/* Switch to Annual Confirmation */}
      {showSwitchConfirm && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSwitchConfirm(false)}
          onKeyDown={(e) => { if (e.key === "Escape") setShowSwitchConfirm(false); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="switch-confirm-title"
        >
          <div
            className="modal-content db-card w-full max-w-md rounded-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="switch-confirm-title" className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
              Switch to Annual Billing?
            </h3>
            <div className="space-y-2 text-sm" style={{ color: "var(--db-text-secondary)" }}>
              <p>Your plan will change from <strong>$497/mo</strong> to <strong>$397/mo</strong> billed annually at $4,764/year.</p>
              <p>This saves you <strong style={{ color: "#4ade80" }}>$1,200/year</strong>.</p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowSwitchConfirm(false)}>
                Cancel
              </Button>
              <Button
                autoFocus
                onClick={() => { setShowSwitchConfirm(false); switchToAnnual(); }}
                disabled={switchLoading}
              >
                {switchLoading ? "Switching..." : "Confirm Switch"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

