"use client";

type BadgeVariant = "success" | "danger" | "warning" | "info" | "neutral" | "accent";

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string; dot?: string }> = {
  success: { bg: "var(--db-success-bg)", color: "var(--db-success)", dot: "var(--db-success)" },
  danger: { bg: "var(--db-danger-bg)", color: "var(--db-danger)", dot: "var(--db-danger)" },
  warning: { bg: "var(--db-warning-bg)", color: "var(--db-warning)", dot: "var(--db-warning)" },
  info: { bg: "var(--db-info-bg)", color: "var(--db-info)", dot: "var(--db-info)" },
  neutral: { bg: "var(--db-hover)", color: "var(--db-text-muted)" },
  accent: { bg: "rgba(197,154,39,0.12)", color: "var(--db-accent)" },
};

/** Map common status strings to badge variants */
export function statusToVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    // Call statuses
    completed: "success",
    missed: "danger",
    in_progress: "info",
    voicemail: "warning",
    // Appointment statuses
    confirmed: "success",
    cancelled: "danger",
    no_show: "warning",
    pending: "info",
    scheduled: "info",
    // Estimate statuses
    won: "success",
    lost: "danger",
    expired: "danger",
    sent: "info",
    follow_up: "warning",
    new: "accent",
    draft: "neutral",
    // Invoice statuses
    paid: "success",
    overdue: "danger",
    // Referral statuses
    signed_up: "info",
    activated: "success",
    credited: "success",
    // Generic
    active: "success",
    inactive: "neutral",
    suspended: "danger",
    past_due: "warning",
    grace_period: "warning",
    canceled: "neutral",
  };
  return map[status] ?? "neutral";
}

export default function StatusBadge({ label, variant = "neutral", dot = false, className = "" }: StatusBadgeProps) {
  const s = variantStyles[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${className}`}
      style={{ background: s.bg, color: s.color }}
    >
      {dot && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: s.dot || s.color }}
        />
      )}
      {label.replace(/_/g, " ")}
    </span>
  );
}
