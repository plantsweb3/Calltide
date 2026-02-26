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
