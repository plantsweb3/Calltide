"use client";

import { useEffect, useState } from "react";

export default function PaymentBanner() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/billing")
      .then((r) => r.json())
      .then((d) => setStatus(d.status ?? "active"))
      .catch(() => setStatus("active"));
  }, []);

  if (!status || !["past_due", "grace_period"].includes(status)) return null;

  const isGrace = status === "grace_period";

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4"
      style={{
        background: isGrace ? "rgba(251,191,36,0.08)" : "rgba(248,113,113,0.08)",
        border: `1px solid ${isGrace ? "rgba(251,191,36,0.2)" : "rgba(248,113,113,0.2)"}`,
      }}
    >
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke={isGrace ? "#fbbf24" : "#f87171"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <p className="flex-1 text-sm" style={{ color: isGrace ? "#fbbf24" : "#f87171" }}>
        {isGrace
          ? "Your payment is overdue. Please update your payment method to keep your service running."
          : "Your payment has failed. Update your payment method to avoid service interruption."}
      </p>
      <a
        href="/dashboard/billing"
        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
        style={{ background: isGrace ? "#f59e0b" : "#ef4444" }}
      >
        Update Payment
      </a>
    </div>
  );
}
