"use client";

/**
 * Admin status badge — collapsed to 6 semantic states, each bound
 * to a `--db-*` CSS variable from globals.css so the badges dynamically
 * theme and stay brand-aligned. Hex values in var() fallbacks are
 * intentional (for legacy browsers or when CSS vars fail to load).
 */

type StateKey = "success" | "warning" | "danger" | "info" | "special" | "neutral";

const stateStyles: Record<StateKey, { color: string; bg: string; dot: string }> = {
  success: {
    color: "var(--db-success, #16A34A)",
    bg: "var(--db-success-bg, rgba(22,163,74,0.12))",
    dot: "var(--db-success, #16A34A)",
  },
  warning: {
    color: "var(--db-warning, #f59e0b)",
    bg: "var(--db-warning-bg, rgba(245,158,11,0.12))",
    dot: "var(--db-warning, #f59e0b)",
  },
  danger: {
    color: "var(--db-danger, #DC2626)",
    bg: "var(--db-danger-bg, rgba(220,38,38,0.12))",
    dot: "var(--db-danger, #DC2626)",
  },
  info: {
    color: "var(--db-info, #60a5fa)",
    bg: "var(--db-info-bg, rgba(96,165,250,0.12))",
    dot: "var(--db-info, #60a5fa)",
  },
  special: {
    color: "var(--db-info, #8b5cf6)",
    bg: "rgba(139,92,246,0.12)",
    dot: "var(--db-info, #8b5cf6)",
  },
  neutral: {
    color: "var(--db-text-muted)",
    bg: "var(--db-hover)",
    dot: "var(--db-text-muted)",
  },
};

/** Map every business-specific status string to a semantic state. */
const statusState: Record<string, StateKey> = {
  // Success states
  operational: "success",
  active: "success",
  resolved: "success",
  verified: "success",
  succeeded: "success",
  recovered: "success",
  completed: "success",
  enterprise: "success",

  // Warning / in-progress
  degraded: "warning",
  "at-risk": "warning",
  in_progress: "warning",
  investigating: "warning",
  identified: "warning",
  past_due: "warning",
  grace_period: "warning",
  processing: "warning",
  pending: "warning",
  warning: "warning",
  scale: "warning",
  unverified: "warning",
  major: "warning",

  // Danger
  down: "danger",
  churned: "danger",
  detected: "danger",
  critical: "danger",
  revoked: "danger",
  suspended: "danger",
  canceled: "danger",
  failed: "danger",
  denied: "danger",
  emergency: "danger",
  hypergrowth: "danger",
  required: "danger",

  // Info
  open: "info",
  monitoring: "info",
  minor: "info",
  received: "info",
  recommended: "info",
  growth: "info",

  // Special (violet — rare states that don't map to the standard 4)
  postmortem: "special",
  maintenance: "special",
  seed: "special",
};

export default function StatusBadge({ status }: { status: string }) {
  const key = statusState[status] ?? "neutral";
  const styles = stateStyles[key];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: styles.bg, color: styles.color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: styles.dot }}
      />
      {status.replace(/_/g, " ")}
    </span>
  );
}
