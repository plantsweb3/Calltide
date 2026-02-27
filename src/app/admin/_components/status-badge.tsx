"use client";

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
  operational: { color: "#4ade80", bg: "rgba(74,222,128,0.1)", dot: "#4ade80" },
  active: { color: "#4ade80", bg: "rgba(74,222,128,0.1)", dot: "#4ade80" },
  degraded: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)", dot: "#fbbf24" },
  "at-risk": { color: "#fbbf24", bg: "rgba(251,191,36,0.1)", dot: "#fbbf24" },
  down: { color: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171" },
  churned: { color: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171" },
  open: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", dot: "#60a5fa" },
  in_progress: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)", dot: "#fbbf24" },
  resolved: { color: "#4ade80", bg: "rgba(74,222,128,0.1)", dot: "#4ade80" },
  // Incident statuses
  detected: { color: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171" },
  investigating: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", dot: "#f59e0b" },
  identified: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", dot: "#f59e0b" },
  monitoring: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", dot: "#60a5fa" },
  postmortem: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", dot: "#8b5cf6" },
  // Severity levels
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", dot: "#ef4444" },
  major: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", dot: "#f59e0b" },
  minor: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", dot: "#3b82f6" },
  maintenance: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", dot: "#8b5cf6" },
  // Subscriber statuses
  verified: { color: "#4ade80", bg: "rgba(74,222,128,0.1)", dot: "#4ade80" },
  unverified: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)", dot: "#fbbf24" },
  // Compliance / Financial
  revoked: { color: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171" },
  past_due: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", dot: "#f59e0b" },
  grace_period: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", dot: "#f59e0b" },
  suspended: { color: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171" },
  canceled: { color: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171" },
  succeeded: { color: "#4ade80", bg: "rgba(74,222,128,0.1)", dot: "#4ade80" },
  failed: { color: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171" },
  recovered: { color: "#4ade80", bg: "rgba(74,222,128,0.1)", dot: "#4ade80" },
  received: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", dot: "#60a5fa" },
  processing: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", dot: "#f59e0b" },
  completed: { color: "#4ade80", bg: "rgba(74,222,128,0.1)", dot: "#4ade80" },
  denied: { color: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171" },
  pending: { color: "#f59e0b", bg: "rgba(251,191,36,0.1)", dot: "#f59e0b" },
  // Capacity
  warning: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", dot: "#f59e0b" },
  emergency: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", dot: "#ef4444" },
  seed: { color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", dot: "#8b5cf6" },
  growth: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)", dot: "#3b82f6" },
  scale: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", dot: "#f59e0b" },
  enterprise: { color: "#4ade80", bg: "rgba(74,222,128,0.1)", dot: "#4ade80" },
  hypergrowth: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", dot: "#ef4444" },
  required: { color: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171" },
  recommended: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", dot: "#60a5fa" },
};

const fallback = { color: "var(--db-text-muted)", bg: "var(--db-hover)", dot: "var(--db-text-muted)" };

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || fallback;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: config.bg, color: config.color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: config.dot }}
      />
      {status.replace(/_/g, " ")}
    </span>
  );
}
