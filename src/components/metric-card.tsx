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
      ? "#4ade80"
      : changeType === "negative"
        ? "#f87171"
        : "var(--db-text-muted)";

  return (
    <div
      className="rounded-xl p-5 transition-colors duration-300"
      style={{
        background: "var(--db-card)",
        border: "1px solid var(--db-border)",
        boxShadow: "var(--db-card-shadow)",
      }}
    >
      <p className="text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold" style={{ color: "var(--db-text)" }}>
        {value}
      </p>
      {change && (
        <p className="mt-1 text-sm" style={{ color: changeColor }}>
          {change}
        </p>
      )}
    </div>
  );
}
