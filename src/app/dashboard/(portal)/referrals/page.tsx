"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import LoadingSpinner from "@/app/dashboard/_components/loading-spinner";
import Button from "@/components/ui/button";
import StatusBadge, { statusToVariant } from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";
import EmptyState from "@/components/empty-state";

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
  const [lang] = useLang();
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReferrals = useCallback(() => {
    setError(null);
    fetch("/api/dashboard/referrals")
      .then((r) => {
        if (!r.ok) throw new Error("load failed");
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
    toast.success(type === "code" ? t("toast.referralCodeCopied", lang) : t("toast.shareLinkCopied", lang));
    setTimeout(() => setCopied(null), 2000);
  }

  if (error) {
    return (
      <div role="alert" aria-live="assertive" className="rounded-xl p-4 flex items-center justify-between" style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)" }}>
        <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
        <button
          onClick={loadReferrals}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}
        >
          {t("action.retry", lang)}
        </button>
      </div>
    );
  }

  if (!data) {
    return <LoadingSpinner message={t("referrals.loadingReferrals", lang)} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("referrals.title", lang)}
        description={t("referrals.description", lang)}
        actions={
          <Link href="/dashboard/partners" className="text-sm font-medium" style={{ color: "var(--db-accent)" }}>
            {t("referrals.partnerNetwork", lang)} &rarr;
          </Link>
        }
      />

      {data.referralCode ? (
        <>
          {/* Referral Code + Link */}
          <div className="db-card rounded-xl p-6 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--db-text-muted)" }}>
                {t("referrals.yourCode", lang)}
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
                  {copied === "code" ? t("action.copied", lang) : t("referrals.copyLink", lang)}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--db-text-muted)" }}>
                {t("referrals.shareThisLink", lang)}
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value={data.shareLink ?? ""}
                  className="db-input flex-1 font-mono"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => data.shareLink && copyToClipboard(data.shareLink, "link")}
                >
                  {copied === "link" ? t("action.copied", lang) : t("referrals.copyLink", lang)}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger-grid">
            {[
              { label: t("referrals.earned", lang), value: data.stats.totalReferred },
              { label: t("status.active", lang), value: data.stats.active },
              { label: t("referrals.reward", lang), value: `$${data.stats.creditsEarned}` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="db-card rounded-xl p-4 text-center"
              >
                <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--db-text)" }}>
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
                {t("referrals.yourReferrals", lang)}
              </h2>
              <div
                className="rounded-xl overflow-hidden overflow-x-auto"
                style={{ border: "1px solid var(--db-border)" }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--db-hover)" }}>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{t("referrals.date", lang)}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{t("referrals.status", lang)}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{t("referrals.credit", lang)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.referrals.map((ref) => {
                      return (
                        <tr key={ref.id} className="db-table-row" style={{ borderTop: "1px solid var(--db-border)" }}>
                          <td className="px-4 py-3 tabular-nums" style={{ color: "var(--db-text-secondary)" }}>
                            {new Date(ref.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge label={ref.status} variant={statusToVariant(ref.status)} dot />
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums" style={{ color: "var(--db-text-secondary)" }}>
                            {ref.creditApplied ? (
                              <span style={{ color: "var(--db-success)" }}>{t("referrals.applied", lang, { amount: `$${ref.creditAmount}` })}</span>
                            ) : ref.status === "activated" ? (
                              <span style={{ color: "var(--db-warning)" }}>{t("referrals.pending", lang, { amount: `$${ref.creditAmount}` })}</span>
                            ) : (
                              "\u2014"
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
        </>
      ) : (
        <EmptyState
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          title={t("referrals.noCodeYet", lang)}
          description={t("referrals.codeBeingSetUp", lang)}
        />
      )}
    </div>
  );
}
