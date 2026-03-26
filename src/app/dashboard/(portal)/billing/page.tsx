"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import LoadingSpinner from "@/app/dashboard/_components/loading-spinner";
import Button from "@/components/ui/button";
import StatusBadge, { statusToVariant } from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

interface BillingData {
  plan: string;
  planType: "monthly" | "annual";
  price: number;
  status: string;
  stripeSubscriptionStatus: string | null;
  trialEndsAt?: string | null;
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
  const [lang] = useLang();
  const [data, setData] = useState<BillingData | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBilling = useCallback(() => {
    setError(null);
    fetch("/api/dashboard/billing")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError(t("toast.failedToLoadBilling", lang)));
  }, []);

  useEffect(() => { loadBilling(); }, [loadBilling]);

  if (error) {
    return (
      <div role="alert" aria-live="assertive" className="rounded-xl p-4 flex items-center justify-between" style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)" }}>
        <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
        <button
          onClick={loadBilling}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}
        >
          {t("billing.retry", lang)}
        </button>
      </div>
    );
  }

  if (!data) return <LoadingSpinner message={t("billing.loadingBilling", lang)} />;

  const isPastDue = ["past_due", "grace_period"].includes(data.status);
  const isTrialing = data.stripeSubscriptionStatus === "trialing";
  const trialDaysLeft = data.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(data.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;
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
      toast.error(t("toast.couldNotOpenPortal", lang));
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
      if (!res.ok) throw new Error(json.error || t("toast.failedToSwitchPlan", lang));
      toast.success(t("toast.switchedToAnnual", lang));
      // Refresh billing data
      const refreshRes = await fetch("/api/dashboard/billing");
      const refreshData = await refreshRes.json();
      setData(refreshData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.failedToSwitchPlan", lang));
    } finally {
      setSwitchLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("billing.title", lang)}
        description={t("billing.description", lang)}
      />

      {/* Past Due Banner */}
      {isPastDue && (
        <div
          className="flex items-center gap-3 rounded-xl p-4"
          style={{
            background: "var(--db-danger-bg)",
            border: "1px solid var(--db-danger)",
          }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--db-danger)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "var(--db-danger)" }}>
              {t("billing.paymentPastDue", lang)}
            </p>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              {t("billing.paymentDeclined", lang)}
            </p>
          </div>
          {data.hasStripeCustomer && (
            <Button variant="danger" onClick={openPortal} disabled={portalLoading}>
              {portalLoading ? t("action.loading", lang) : t("billing.updatePaymentMethod", lang)}
            </Button>
          )}
        </div>
      )}

      {/* Trial Status Banner */}
      {isTrialing && data.trialEndsAt && (
        <div
          className="rounded-xl p-5"
          style={{
            background: "var(--db-accent-bg)",
            border: "1px solid var(--db-accent)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--db-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <h3 className="text-sm font-semibold" style={{ color: "var(--db-accent)" }}>
              {t("billing.freeTrial", lang)}
            </h3>
          </div>
          <p className="text-sm" style={{ color: "var(--db-text)" }}>
            {trialDaysLeft === 1
              ? t("billing.trialEndsInOneDay", lang, {
                  date: new Date(data.trialEndsAt).toLocaleDateString(lang === "es" ? "es" : "en", { month: "long", day: "numeric" }),
                })
              : t("billing.trialEndsIn", lang, {
                  days: trialDaysLeft,
                  plural: "s",
                  date: new Date(data.trialEndsAt).toLocaleDateString(lang === "es" ? "es" : "en", { month: "long", day: "numeric" }),
                })}
          </p>
        </div>
      )}

      {/* Annual Upgrade Card — only for monthly clients */}
      {isMonthly && !isPastDue && data.status === "active" && (
        <div
          className="rounded-xl p-5"
          style={{
            background: "linear-gradient(135deg, var(--db-accent-bg), transparent)",
            border: "1px solid var(--db-accent)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold" style={{ color: "var(--db-accent)" }}>
                  {t("billing.saveAnnual", lang)}
                </h3>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ background: "var(--db-success-bg)", color: "var(--db-success)" }}
                >
                  {t("billing.save20", lang)}
                </span>
              </div>
              <p className="mt-2 text-sm" style={{ color: "var(--db-text-muted)" }}>
                {t("billing.switchDesc", lang)}
              </p>
              <p className="mt-3 text-xs" style={{ color: "var(--db-text-muted)" }}>
                {t("billing.annualComparison", lang)}
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setShowSwitchConfirm(true)}
              disabled={switchLoading}
              className="shrink-0"
            >
              {switchLoading ? t("billing.switching", lang) : t("billing.switchToAnnual", lang)}
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
          {t("billing.yourPlan", lang)}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
                {data.plan}
              </p>
              {data.planType === "annual" && (
                <StatusBadge label={t("billing.annual", lang)} variant="success" />
              )}
            </div>
            <p className="text-2xl font-bold mt-1" style={{ color: "var(--db-accent)" }}>
              {fmt(data.price)}
              <span className="text-sm font-normal" style={{ color: "var(--db-text-muted)" }}>
                {t("billing.perMonth", lang)}{data.planType === "annual" ? ` ${t("billing.billedAnnually", lang)}` : ""}
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
            {t("billing.locations", lang)}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--db-hover)" }}>
              <span className="text-sm" style={{ color: "var(--db-text)" }}>{t("billing.basePlan", lang)}</span>
              <span className="text-sm font-medium font-mono" style={{ color: "var(--db-text)" }}>{fmt(data.price)}{t("billing.perMo", lang)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--db-hover)" }}>
              <span className="text-sm" style={{ color: "var(--db-text)" }}>
                {t("billing.additionalLocationsDetail", lang, {
                  count: (data.locationCount ?? 1) - 1,
                  price: fmt(data.additionalLocationPrice ?? 0),
                })}
              </span>
              <span className="text-sm font-medium font-mono" style={{ color: "var(--db-text)" }}>
                {fmt(((data.locationCount ?? 1) - 1) * (data.additionalLocationPrice ?? 0))}{t("billing.perMo", lang)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ borderTop: "1px solid var(--db-border)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>{t("billing.total", lang)}</span>
              <span className="text-sm font-bold font-mono" style={{ color: "var(--db-accent)" }}>
                {fmt(data.totalMonthly ?? data.price)}{t("billing.perMo", lang)}
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
            {t("billing.paymentMethod", lang)}
          </h3>
          {data.hasStripeCustomer && (
            <Button variant="ghost" size="sm" onClick={openPortal} disabled={portalLoading}>
              {portalLoading ? t("action.loading", lang) : t("billing.update", lang)}
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
                {t("billing.cardExpires", lang)} {String(data.cardExpMonth).padStart(2, "0")}/{data.cardExpYear}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
            {t("billing.noPaymentMethod", lang)}
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
            {t("billing.nextBillingDate", lang)}
          </h3>
          <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>
            {new Date(data.nextBillingAt).toLocaleDateString(lang === "es" ? "es" : "en", {
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
            {t("billing.invoiceHistory", lang)}
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
                    {new Date(inv.date).toLocaleDateString(lang === "es" ? "es" : "en", {
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
                  <StatusBadge label={t("invoices.paid", lang)} variant="success" dot />
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
            {portalLoading ? t("billing.openingPortal", lang) : t("billing.manageBilling", lang)}
          </Button>
        </div>
      )}

      {/* Switch to Annual Confirmation */}
      {showSwitchConfirm && (
        <div
          className="db-modal-backdrop"
          onClick={() => setShowSwitchConfirm(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="switch-confirm-title"
            className="modal-content db-card w-full max-w-md rounded-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape") setShowSwitchConfirm(false); }}
          >
            <h3 id="switch-confirm-title" className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
              {t("billing.switchToAnnualConfirm", lang)}
            </h3>
            <div className="space-y-2 text-sm" style={{ color: "var(--db-text-secondary)" }}>
              <p>{t("billing.switchConfirmDesc", lang)}</p>
              <p><strong style={{ color: "var(--db-success)" }}>{t("billing.savesYou", lang)}</strong></p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowSwitchConfirm(false)}>
                {t("action.cancel", lang)}
              </Button>
              <Button
                autoFocus
                onClick={() => { setShowSwitchConfirm(false); switchToAnnual(); }}
                disabled={switchLoading}
              >
                {switchLoading ? t("billing.switching", lang) : t("billing.confirmSwitch", lang)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

