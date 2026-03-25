"use client";

import { useEffect, useState } from "react";

export default function PaymentBanner() {
  const [status, setStatus] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/billing")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        setStatus(d.stripeSubscriptionStatus ?? d.status ?? "active");
        if (d.trialEndsAt) setTrialEndsAt(d.trialEndsAt);
      })
      .catch(() => setStatus("active"));
  }, []);

  if (!status) return null;

  // Trial banner
  if (status === "trialing" && trialEndsAt) {
    const daysLeft = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000));
    return (
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4"
        style={{
          background: "var(--db-accent-bg)",
          border: "1px solid var(--db-accent)",
        }}
      >
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--db-accent)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <p className="flex-1 text-sm" style={{ color: "var(--db-accent)" }}>
          {daysLeft === 0
            ? "Your free trial ends today."
            : daysLeft === 1
              ? "Your free trial ends tomorrow."
              : `Your free trial ends in ${daysLeft} days.`}
        </p>
        <a
          href="/dashboard/billing"
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium"
          style={{ background: "var(--db-accent-bg)", color: "var(--db-accent)", border: "1px solid var(--db-accent)" }}
        >
          View billing
        </a>
      </div>
    );
  }

  // Payment issue banners
  if (!["past_due", "grace_period"].includes(status)) return null;

  const isGrace = status === "grace_period";

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4"
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
          ? "Your payment is overdue. Please update your payment method to keep your service running."
          : "Your payment has failed. Update your payment method to avoid service interruption."}
      </p>
      <a
        href="/dashboard/billing"
        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
        style={{ background: isGrace ? "var(--db-warning-alt)" : "var(--db-danger)" }}
      >
        Update Payment
      </a>
    </div>
  );
}
