"use client";

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
  operational: { color: "text-green-400", bg: "bg-green-500/10", dot: "bg-green-500" },
  active: { color: "text-green-400", bg: "bg-green-500/10", dot: "bg-green-500" },
  degraded: { color: "text-amber-400", bg: "bg-amber-500/10", dot: "bg-amber-500" },
  "at-risk": { color: "text-amber-400", bg: "bg-amber-500/10", dot: "bg-amber-500" },
  down: { color: "text-red-400", bg: "bg-red-500/10", dot: "bg-red-500" },
  churned: { color: "text-red-400", bg: "bg-red-500/10", dot: "bg-red-500" },
  open: { color: "text-blue-400", bg: "bg-blue-500/10", dot: "bg-blue-500" },
  in_progress: { color: "text-amber-400", bg: "bg-amber-500/10", dot: "bg-amber-500" },
  resolved: { color: "text-green-400", bg: "bg-green-500/10", dot: "bg-green-500" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || {
    color: "text-slate-400",
    bg: "bg-slate-700/50",
    dot: "bg-slate-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}
