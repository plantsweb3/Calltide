"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

interface PaymentBannerProps {
  callsHandled?: number;
  appointmentsBooked?: number;
  receptionistName?: string;
}

export default function PaymentBanner({ callsHandled, appointmentsBooked, receptionistName = "Maria" }: PaymentBannerProps) {
  const [lang] = useLang();
  const [status, setStatus] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  const [fetchedCalls, setFetchedCalls] = useState<number | undefined>(undefined);
  const [fetchedAppointments, setFetchedAppointments] = useState<number | undefined>(undefined);
  const [fetchedName, setFetchedName] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch("/api/dashboard/billing")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        const s = d.stripeSubscriptionStatus ?? d.status ?? "active";
        setStatus(s);
        if (d.trialEndsAt) setTrialEndsAt(d.trialEndsAt);
        // Fetch overview stats for trial value messaging
        if (s === "trialing") {
          fetch("/api/dashboard/overview?lang=en")
            .then((r) => r.ok ? r.json() : null)
            .then((o) => {
              if (o) {
                setFetchedCalls(o.totalCalls ?? 0);
                setFetchedAppointments(o.appointmentsThisWeek ?? 0);
                if (o.businessName) setFetchedName(o.businessName);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => setStatus("active"));
  }, []);

  if (!status) return null;

  // Trial banner with value messaging
  if (status === "trialing" && trialEndsAt) {
    const trialEnd = new Date(trialEndsAt).getTime();
    const trialStart = trialEnd - 14 * 86400000;
    const dayNum = Math.min(14, Math.max(1, Math.ceil((Date.now() - trialStart) / 86400000)));
    const daysLeft = Math.max(0, Math.ceil((trialEnd - Date.now()) / 86400000));
    const isUrgent = daysLeft <= 4;
    const totalCalls = callsHandled ?? fetchedCalls ?? 0;
    const totalAppts = appointmentsBooked ?? fetchedAppointments ?? 0;
    const name = receptionistName ?? fetchedName ?? "Maria";
    const hasActivity = totalCalls > 0 || totalAppts > 0;

    // Build the value message
    let valueText: string;
    if (isUrgent) {
      valueText = daysLeft === 0
        ? t("billing.trialEndsToday", lang)
        : daysLeft === 1
          ? t("billing.trialEndsTomorrow", lang)
          : t("billing.trialUrgent", lang, { days: daysLeft, name, calls: totalCalls });
    } else if (hasActivity) {
      valueText = t("billing.trialValue", lang, {
        day: dayNum,
        name,
        calls: totalCalls,
        appointments: totalAppts,
      });
    } else {
      valueText = t("billing.trialEndsInDays", lang, { days: daysLeft });
    }

    return (
      <div
        className="flex items-center gap-3 rounded-[4px] px-4 py-3 mb-4"
        style={{
          background: isUrgent ? "var(--db-warning-bg)" : "var(--db-accent-bg)",
          border: `1px solid ${isUrgent ? "var(--db-warning)" : "var(--db-accent)"}`,
        }}
      >
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke={isUrgent ? "var(--db-warning)" : "var(--db-accent)"}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <p className="flex-1 text-sm" style={{ color: isUrgent ? "var(--db-warning)" : "var(--db-accent)" }}>
          {valueText}
        </p>
        <a
          href="/dashboard/billing"
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium"
          style={{
            background: isUrgent ? "var(--db-warning-bg)" : "var(--db-accent-bg)",
            color: isUrgent ? "var(--db-warning)" : "var(--db-accent)",
            border: `1px solid ${isUrgent ? "var(--db-warning)" : "var(--db-accent)"}`,
          }}
        >
          {t("billing.viewBilling", lang)}
        </a>
      </div>
    );
  }

  // Payment issue banners
  if (!["past_due", "grace_period"].includes(status)) return null;

  const isGrace = status === "grace_period";

  return (
    <div
      className="flex items-center gap-3 rounded-[4px] px-4 py-3 mb-4"
      style={{
        background: isGrace ? "var(--db-warning-bg)" : "var(--db-danger-bg)",
        border: `1px solid ${isGrace ? "var(--db-warning)" : "var(--db-danger)"}`,
      }}
    >
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke={isGrace ? "var(--db-warning)" : "var(--db-danger)"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <p className="flex-1 text-sm" style={{ color: isGrace ? "var(--db-warning)" : "var(--db-danger)" }}>
        {isGrace
          ? t("billing.paymentOverdueDesc", lang)
          : t("billing.paymentFailedDesc", lang)}
      </p>
      <a
        href="/dashboard/billing"
        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
        style={{ background: isGrace ? "var(--db-warning-alt)" : "var(--db-danger)" }}
      >
        {t("billing.updatePayment", lang)}
      </a>
    </div>
  );
}
