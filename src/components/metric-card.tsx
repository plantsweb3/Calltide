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
  /** Optional catalog serial (e.g. "01"). Displayed top-right. */
  serial?: string;
  /** Disable the gold stamp (rare — used for minor/secondary metrics). */
  stampless?: boolean;
}

export default function MetricCard({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  change,
  changeType = "neutral",
  serial,
  stampless = false,
}: MetricCardProps) {
  const changeColor =
    changeType === "positive"
      ? "var(--db-success)"
      : changeType === "negative"
        ? "var(--db-danger)"
        : "var(--db-text-muted)";

  const isNumber = typeof value === "number";

  return (
    <div className="db-card relative p-5" style={{ paddingTop: stampless ? undefined : 22 }}>
      {!stampless && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 40,
            height: 3,
            background: "var(--db-accent)",
          }}
        />
      )}
      {serial && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            fontFamily: "var(--font-mono), ui-monospace, Menlo, monospace",
            fontVariantNumeric: "tabular-nums",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.14em",
            color: "var(--db-accent)",
          }}
        >
          {serial}
        </span>
      )}
      <p
        className="font-semibold"
        style={{
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--db-text-secondary)",
        }}
      >
        {label}
      </p>
      <p
        className="mt-2 font-semibold"
        style={{
          fontFamily: "var(--font-mono), ui-monospace, Menlo, monospace",
          fontVariantNumeric: "tabular-nums",
          fontSize: 30,
          letterSpacing: "-0.02em",
          color: "var(--db-text)",
          fontWeight: 800,
        }}
      >
        {isNumber ? (
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        ) : (
          `${prefix}${value}${suffix}`
        )}
      </p>
      {change && (
        <p
          className="mt-1.5 font-semibold"
          style={{
            fontSize: 11,
            color: changeColor,
            letterSpacing: "0.02em",
          }}
        >
          {change}
        </p>
      )}
    </div>
  );
}
