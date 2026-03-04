"use client";

import { useEffect, useState, useCallback } from "react";

interface EmailEntry {
  emailNumber: number;
  templateKey: string;
  status: string;
  sentAt: string;
  openedAt: string | null;
  clickedAt: string | null;
}

interface RetargetBusiness {
  id: string;
  name: string;
  type: string;
  ownerName: string;
  ownerEmail: string | null;
  serviceArea: string | null;
  receptionistName: string | null;
  onboardingStatus: string;
  onboardingPaywallReachedAt: string | null;
  stripeSubscriptionStatus: string | null;
  paywallUnsubscribed: boolean;
  emails: EmailEntry[];
  lastEmailNumber: number;
  converted: boolean;
}

interface Stats {
  total: number;
  active: number;
  converted: number;
  abandoned: number;
  unsubscribed: number;
  emailsSent: number;
  opens: number;
  clicks: number;
}

const EMAIL_STATUS_COLORS: Record<string, string> = {
  sent: "#3B82F6",
  delivered: "#3B82F6",
  opened: "#F59E0B",
  clicked: "#22C55E",
  bounced: "#EF4444",
  failed: "#EF4444",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function EmailDots({ emails, lastEmailNumber }: { emails: EmailEntry[]; lastEmailNumber: number }) {
  const emailMap: Record<number, EmailEntry> = {};
  for (const e of emails) emailMap[e.emailNumber] = e;

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4].map((num) => {
        const e = emailMap[num];
        if (!e) {
          return (
            <div
              key={num}
              className="h-3 w-3 rounded-full"
              style={{ background: num <= lastEmailNumber + 1 ? "var(--db-border)" : "var(--db-hover)", opacity: 0.5 }}
              title={`Email ${num}: not sent`}
            />
          );
        }
        const color = EMAIL_STATUS_COLORS[e.status] || "#9CA3AF";
        return (
          <div
            key={num}
            className="relative group"
          >
            <div
              className="h-3 w-3 rounded-full cursor-pointer"
              style={{ background: color }}
              title={`Email ${num}: ${e.status}${e.openedAt ? " (opened)" : ""}${e.clickedAt ? " (clicked)" : ""}`}
            />
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 whitespace-nowrap rounded-lg px-3 py-2 text-xs"
              style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
            >
              <p className="font-medium">Email {num}</p>
              <p style={{ color: "var(--db-text-muted)" }}>
                {e.status} · {timeAgo(e.sentAt)}
              </p>
              {e.openedAt && <p style={{ color: "#F59E0B" }}>Opened {timeAgo(e.openedAt)}</p>}
              {e.clickedAt && <p style={{ color: "#22C55E" }}>Clicked {timeAgo(e.clickedAt)}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RetargetingPage() {
  const [data, setData] = useState<RetargetBusiness[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "converted" | "abandoned" | "unsubscribed">("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/retargeting");
      if (res.ok) {
        const json = await res.json();
        setData(json.businesses || []);
        setStats(json.stats || null);
      }
    } catch {
      // Ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = data.filter((biz) => {
    switch (filter) {
      case "active": return biz.onboardingStatus === "paywall_reached" && !biz.converted;
      case "converted": return biz.converted;
      case "abandoned": return biz.onboardingStatus === "abandoned";
      case "unsubscribed": return biz.paywallUnsubscribed;
      default: return true;
    }
  });

  const openRate = stats && stats.emailsSent > 0 ? Math.round((stats.opens / stats.emailsSent) * 100) : 0;
  const clickRate = stats && stats.emailsSent > 0 ? Math.round((stats.clicks / stats.emailsSent) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--db-text)" }}>Paywall Retargeting</h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          Email sequence for businesses that completed setup but didn&apos;t pay
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Active", value: stats.active, color: "#3B82F6" },
            { label: "Converted", value: stats.converted, color: "#22C55E" },
            { label: "Abandoned", value: stats.abandoned, color: "#EF4444" },
            { label: "Emails Sent", value: stats.emailsSent, color: "#8B5CF6" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl p-4"
              style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
            >
              <p className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{card.label}</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Engagement row */}
      {stats && stats.emailsSent > 0 && (
        <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--db-text-muted)" }}>
          <span>Open rate: <strong style={{ color: "var(--db-text)" }}>{openRate}%</strong></span>
          <span>Click rate: <strong style={{ color: "var(--db-text)" }}>{clickRate}%</strong></span>
          <span>Unsubscribed: <strong style={{ color: "var(--db-text)" }}>{stats.unsubscribed}</strong></span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: "all" as const, label: "All", count: data.length },
          { key: "active" as const, label: "Active", count: data.filter((b) => b.onboardingStatus === "paywall_reached" && !b.converted).length },
          { key: "converted" as const, label: "Converted", count: data.filter((b) => b.converted).length },
          { key: "abandoned" as const, label: "Abandoned", count: data.filter((b) => b.onboardingStatus === "abandoned").length },
          { key: "unsubscribed" as const, label: "Unsubscribed", count: data.filter((b) => b.paywallUnsubscribed).length },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              background: filter === tab.key ? "var(--db-accent)" : "var(--db-surface)",
              color: filter === tab.key ? "#fff" : "var(--db-text-muted)",
              border: `1px solid ${filter === tab.key ? "var(--db-accent)" : "var(--db-border)"}`,
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
      >
        {loading ? (
          <div className="p-8 text-center" style={{ color: "var(--db-text-muted)" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--db-text-muted)" }}>No businesses in retarget pipeline</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--db-border)" }}>
                  {["Business", "Trade", "Receptionist", "Emails", "Status", "Paywall At", "Last Activity"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((biz) => {
                  const statusLabel = biz.converted ? "converted" : biz.paywallUnsubscribed ? "unsubscribed" : biz.onboardingStatus?.replace("_", " ");
                  const statusColor = biz.converted ? "#22C55E" : biz.paywallUnsubscribed ? "#9CA3AF" : biz.onboardingStatus === "abandoned" ? "#EF4444" : "#F59E0B";
                  return (
                    <tr key={biz.id} className="transition-colors hover:opacity-80" style={{ borderBottom: "1px solid var(--db-border)" }}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{biz.name}</p>
                          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{biz.ownerName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm capitalize" style={{ color: "var(--db-text)" }}>
                        {biz.type?.replace("_", " ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--db-text)" }}>
                        {biz.receptionistName || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <EmailDots emails={biz.emails} lastEmailNumber={biz.lastEmailNumber} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{
                            background: `${statusColor}20`,
                            color: statusColor,
                          }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor }} />
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--db-text-muted)" }}>
                        {biz.onboardingPaywallReachedAt
                          ? new Date(biz.onboardingPaywallReachedAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--db-text-muted)" }}>
                        {biz.emails.length > 0
                          ? timeAgo(biz.emails[biz.emails.length - 1].sentAt)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
