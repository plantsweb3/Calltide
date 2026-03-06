"use client";

import { useEffect, useState, useCallback } from "react";

interface PipelineBusiness {
  id: string;
  name: string;
  type: string;
  ownerName: string;
  ownerEmail: string;
  serviceArea: string | null;
  receptionistName: string | null;
  onboardingStep: number;
  onboardingStatus: string;
  onboardingStartedAt: string | null;
  onboardingPaywallReachedAt: string | null;
  updatedAt: string;
  createdAt: string;
}

const STEP_LABELS: Record<number, string> = {
  1: "Business Info",
  2: "Name Receptionist",
  3: "Personality",
  4: "Teach Business",
  5: "Test Call",
  6: "Paywall",
  7: "Payment",
  8: "Phone Setup",
};

const STATUS_COLORS: Record<string, string> = {
  not_started: "#9CA3AF",
  in_progress: "#3B82F6",
  paywall_reached: "#F59E0B",
  abandoned: "#EF4444",
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

export default function OnboardingPipelinePage() {
  const [businesses, setBusinesses] = useState<PipelineBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/admin/onboarding-pipeline${params}`);
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses || []);
      }
    } catch {
      // Ignore
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const counts = {
    all: businesses.length,
    in_progress: businesses.filter((b) => b.onboardingStatus === "in_progress").length,
    paywall_reached: businesses.filter((b) => b.onboardingStatus === "paywall_reached").length,
    not_started: businesses.filter((b) => b.onboardingStatus === "not_started").length,
    abandoned: businesses.filter((b) => b.onboardingStatus === "abandoned").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--db-text)" }}>Onboarding Pipeline</h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          Businesses in the onboarding flow
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: "", label: "All", count: counts.all },
          { key: "in_progress", label: "In Progress", count: counts.in_progress },
          { key: "paywall_reached", label: "At Paywall", count: counts.paywall_reached },
          { key: "not_started", label: "Not Started", count: counts.not_started },
          { key: "abandoned", label: "Abandoned", count: counts.abandoned },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              background: statusFilter === tab.key ? "var(--db-accent)" : "var(--db-surface)",
              color: statusFilter === tab.key ? "#fff" : "var(--db-text-muted)",
              border: `1px solid ${statusFilter === tab.key ? "var(--db-accent)" : "var(--db-border)"}`,
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
        ) : businesses.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--db-text-muted)" }}>No businesses in pipeline</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--db-border)" }}>
                  {["Business", "Trade", "City", "Receptionist", "Step", "Status", "Started", "Last Activity"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {businesses.map((biz) => (
                  <tr key={biz.id} className="transition-colors hover:opacity-80" style={{ borderBottom: "1px solid var(--db-border)" }}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{biz.name}</p>
                        <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{biz.ownerName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize" style={{ color: "var(--db-text)" }}>
                      {biz.type?.replace(/_/g, " ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--db-text-muted)" }}>
                      {biz.serviceArea || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--db-text)" }}>
                      {biz.receptionistName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                          {biz.onboardingStep || 1}/8
                        </span>
                        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                          {STEP_LABELS[biz.onboardingStep || 1]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          background: `${STATUS_COLORS[biz.onboardingStatus] || "#9CA3AF"}20`,
                          color: STATUS_COLORS[biz.onboardingStatus] || "#9CA3AF",
                        }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLORS[biz.onboardingStatus] || "#9CA3AF" }} />
                        {biz.onboardingStatus?.replace(/_/g, " ") || "not started"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--db-text-muted)" }}>
                      {biz.onboardingStartedAt
                        ? new Date(biz.onboardingStartedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--db-text-muted)" }}>
                      {biz.updatedAt ? timeAgo(biz.updatedAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
