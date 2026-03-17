"use client";

import AnimatedCounter from "@/app/dashboard/_components/animated-counter";

interface MetricCardProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export default function MetricCard({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  change,
  changeType = "neutral",
}: MetricCardProps) {
  const changeColor =
    changeType === "positive"
      ? "var(--db-success)"
      : changeType === "negative"
        ? "var(--db-danger)"
        : "var(--db-text-muted)";

  const isNumber = typeof value === "number";

  return (
    <div className="db-card p-5">
      <p className="text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight" style={{ color: "var(--db-text)" }}>
        {isNumber ? (
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        ) : (
          `${prefix}${value}${suffix}`
        )}
      </p>
      {change && (
        <p className="mt-1.5 text-xs font-medium" style={{ color: changeColor }}>
          {change}
        </p>
      )}
    </div>
  );
}
