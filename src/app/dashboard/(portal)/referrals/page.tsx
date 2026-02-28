"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import LoadingSpinner from "@/app/dashboard/_components/loading-spinner";

interface ReferralData {
  referralCode: string | null;
  shareLink: string | null;
  stats: { totalReferred: number; active: number; creditsEarned: number };
  referrals: Array<{
    id: string;
    status: string;
    creditAmount: number;
    creditApplied: boolean;
    signedUpAt: string | null;
    activatedAt: string | null;
    createdAt: string;
  }>;
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending: { bg: "rgba(148,163,184,0.15)", color: "#94a3b8" },
  signed_up: { bg: "rgba(96,165,250,0.15)", color: "#60a5fa" },
  activated: { bg: "rgba(74,222,128,0.15)", color: "#4ade80" },
  churned: { bg: "rgba(248,113,113,0.15)", color: "#f87171" },
  expired: { bg: "rgba(148,163,184,0.15)", color: "#94a3b8" },
};

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/referrals")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Failed to load referral data"));
  }, []);

  function copyToClipboard(text: string, type: "code" | "link") {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(type === "code" ? "Referral code copied!" : "Share link copied!");
    setTimeout(() => setCopied(null), 2000);
  }

  if (error) {
    return (
      <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
        <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
      </div>
    );
  }

  if (!data) {
    return <LoadingSpinner message="Loading referrals..." />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>
          Referral Program
        </h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          Refer a business &rarr; they get 50% off first month &rarr; you get 1 month free ($497 credit)
        </p>
      </div>

      {/* Referral Code + Link */}
      <div
        className="rounded-xl p-6 space-y-4"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
      >
        {data.referralCode ? (
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--db-text-muted)" }}>
                Your Referral Code
              </p>
              <div className="flex items-center gap-3">
                <code
                  className="rounded-lg px-4 py-2.5 text-lg font-bold tracking-wide"
                  style={{ background: "var(--db-hover)", color: "var(--db-accent)" }}
                >
                  {data.referralCode}
                </code>
                <button
                  onClick={() => copyToClipboard(data.referralCode!, "code")}
                  className="rounded-lg px-3 py-2 text-sm transition-colors"
                  style={{ background: "var(--db-hover)", color: "var(--db-text-secondary)", border: "1px solid var(--db-border)" }}
                >
                  {copied === "code" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--db-text-muted)" }}>
                Share This Link
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value={data.shareLink ?? ""}
                  className="flex-1 rounded-lg px-4 py-2.5 text-sm font-mono"
                  style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                />
                <button
                  onClick={() => data.shareLink && copyToClipboard(data.shareLink, "link")}
                  className="rounded-lg px-3 py-2 text-sm transition-colors"
                  style={{ background: "var(--db-hover)", color: "var(--db-text-secondary)", border: "1px solid var(--db-border)" }}
                >
                  {copied === "link" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <p style={{ color: "var(--db-text-muted)" }}>
            No referral code assigned yet. Contact support.
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Referred", value: data.stats.totalReferred },
          { label: "Active", value: data.stats.active },
          { label: "Credits Earned", value: `$${data.stats.creditsEarned}` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4 text-center"
            style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
          >
            <p className="text-2xl font-bold" style={{ color: "var(--db-text)" }}>
              {stat.value}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Referral List */}
      {data.referrals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-medium" style={{ color: "var(--db-text)" }}>
            Your Referrals
          </h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--db-border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--db-hover)" }}>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Credit</th>
                </tr>
              </thead>
              <tbody>
                {data.referrals.map((ref) => {
                  const style = STATUS_STYLES[ref.status] ?? STATUS_STYLES.pending;
                  return (
                    <tr key={ref.id} style={{ borderTop: "1px solid var(--db-border)" }}>
                      <td className="px-4 py-3 tabular-nums" style={{ color: "var(--db-text-secondary)" }}>
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ background: style.bg, color: style.color }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.color }} />
                          {ref.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--db-text-secondary)" }}>
                        {ref.creditApplied ? (
                          <span style={{ color: "#4ade80" }}>${ref.creditAmount} applied</span>
                        ) : ref.status === "activated" ? (
                          <span style={{ color: "#fbbf24" }}>${ref.creditAmount} pending</span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
