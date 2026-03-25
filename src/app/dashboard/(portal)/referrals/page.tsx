"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import LoadingSpinner from "@/app/dashboard/_components/loading-spinner";
import Button from "@/components/ui/button";
import StatusBadge, { statusToVariant } from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";

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

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReferrals = useCallback(() => {
    setError(null);
    fetch("/api/dashboard/referrals")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setData)
      .catch(() => {
        setData({
          referralCode: null,
          shareLink: null,
          stats: { totalReferred: 0, active: 0, creditsEarned: 0 },
          referrals: [],
        });
      });
  }, []);

  useEffect(() => { loadReferrals(); }, [loadReferrals]);

  function copyToClipboard(text: string, type: "code" | "link") {
    try {
      navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers / non-HTTPS
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(type);
    toast.success(type === "code" ? "Referral code copied!" : "Share link copied!");
    setTimeout(() => setCopied(null), 2000);
  }

  if (error) {
    return (
      <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)" }}>
        <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
        <button
          onClick={loadReferrals}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return <LoadingSpinner message="Loading referrals..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Referral Program"
        description="Refer a business → they get 50% off first month → you get 1 month free ($497 credit)"
      />

      {/* Referral Code + Link */}
      <div className="db-card rounded-xl p-6 space-y-4">
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyToClipboard(data.referralCode!, "code")}
                >
                  {copied === "code" ? "Copied!" : "Copy"}
                </Button>
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => data.shareLink && copyToClipboard(data.shareLink, "link")}
                >
                  {copied === "link" ? "Copied!" : "Copy"}
                </Button>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger-grid">
        {[
          { label: "Referred", value: data.stats.totalReferred },
          { label: "Active", value: data.stats.active },
          { label: "Credits Earned", value: `$${data.stats.creditsEarned}` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="db-card rounded-xl p-4 text-center"
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
                  return (
                    <tr key={ref.id} style={{ borderTop: "1px solid var(--db-border)" }}>
                      <td className="px-4 py-3 tabular-nums" style={{ color: "var(--db-text-secondary)" }}>
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge label={ref.status} variant={statusToVariant(ref.status)} dot />
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--db-text-secondary)" }}>
                        {ref.creditApplied ? (
                          <span style={{ color: "var(--db-success)" }}>${ref.creditAmount} applied</span>
                        ) : ref.status === "activated" ? (
                          <span style={{ color: "var(--db-warning)" }}>${ref.creditAmount} pending</span>
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
