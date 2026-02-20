interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export default function MetricCard({
  label,
  value,
  change,
  changeType = "neutral",
}: MetricCardProps) {
  const changeColor =
    changeType === "positive"
      ? "text-green-400"
      : changeType === "negative"
        ? "text-red-400"
        : "text-slate-400";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-100">{value}</p>
      {change && (
        <p className={`mt-1 text-sm ${changeColor}`}>{change}</p>
      )}
    </div>
  );
}
