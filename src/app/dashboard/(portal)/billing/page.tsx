"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/app/dashboard/_components/loading-spinner";

interface BillingData {
  plan: string;
  price: number;
  status: string;
  stripeSubscriptionStatus: string | null;
  nextBillingAt: string | null;
  cardLast4: string | null;
  cardExpMonth: number | null;
  cardExpYear: number | null;
  lifetimeRevenue: number;
  hasStripeCustomer: boolean;
  invoices: { id: string; amount: number; date: string; invoiceId: string | null }[];
}

function fmt(cents: number): string {
  return `$${(cents / 100).toLocaleString("en", { minimumFractionDigits: 2 })}`;
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/billing")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return <LoadingSpinner message="Loading billing..." />;

  const isPastDue = ["past_due", "grace_period"].includes(data.status);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      }
    } catch {
      // silently fail
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-body), system-ui, sans-serif", color: "var(--db-text)" }}
        >
          Billing
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          Manage your subscription and payment method
        </p>
      </div>

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
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: "#ef4444" }}
            >
              {portalLoading ? "Loading..." : "Update Payment"}
            </button>
          )}
        </div>
      )}

      {/* Plan Card */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "var(--db-card)",
          border: "1px solid var(--db-border)",
          boxShadow: "var(--db-card-shadow)",
        }}
      >
        <h3
          className="mb-4 text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--db-text-muted)" }}
        >
          Your Plan
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
              {data.plan}
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: "var(--db-accent)" }}>
              {fmt(data.price)}<span className="text-sm font-normal" style={{ color: "var(--db-text-muted)" }}>/month</span>
            </p>
          </div>
          <StatusPill status={data.status} />
        </div>
      </div>

      {/* Payment Method */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "var(--db-card)",
          border: "1px solid var(--db-border)",
          boxShadow: "var(--db-card-shadow)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--db-text-muted)" }}
          >
            Payment Method
          </h3>
          {data.hasStripeCustomer && (
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="text-xs font-medium"
              style={{ color: "var(--db-accent)" }}
            >
              {portalLoading ? "Loading..." : "Update"}
            </button>
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
        <div
          className="rounded-xl p-5"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
            boxShadow: "var(--db-card-shadow)",
          }}
        >
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
        <div
          className="rounded-xl p-5"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
            boxShadow: "var(--db-card-shadow)",
          }}
        >
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
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#4ade80" }} />
                    Paid
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manage Billing */}
      {data.hasStripeCustomer && (
        <div className="flex justify-center">
          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="rounded-xl px-6 py-3 text-sm font-medium transition-colors"
            style={{
              background: "var(--db-accent)",
              color: "#ffffff",
            }}
          >
            {portalLoading ? "Opening Portal..." : "Manage Billing in Stripe"}
          </button>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: "rgba(74,222,128,0.1)", color: "#4ade80", label: "Active" },
    past_due: { bg: "rgba(248,113,113,0.1)", color: "#f87171", label: "Past Due" },
    grace_period: { bg: "rgba(251,191,36,0.1)", color: "#fbbf24", label: "Grace Period" },
    suspended: { bg: "rgba(248,113,113,0.1)", color: "#f87171", label: "Suspended" },
    canceled: { bg: "rgba(248,113,113,0.1)", color: "#f87171", label: "Canceled" },
  };
  const c = config[status] ?? config.active;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
      style={{ background: c.bg, color: c.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
      {c.label}
    </span>
  );
}
