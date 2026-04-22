"use client";

import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /**
   * Optional catalog marker rendered above the title.
   * Example: "Calls" → renders "§ CALLS · CAT · REV 2026.04"
   */
  catalog?: string;
  /**
   * Optional spec-sheet metadata row rendered below the description.
   * Pass label/value pairs — e.g. [{ label: "Total", value: "1,247" }, ...]
   */
  specs?: { label: string; value: string | ReactNode }[];
}

export default function PageHeader({
  title,
  description,
  actions,
  catalog,
  specs,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:gap-5">
      {catalog && (
        <div
          className="hidden sm:flex items-center justify-between"
          style={{
            fontFamily: "var(--font-mono), ui-monospace, Menlo, monospace",
            fontSize: 11,
            color: "var(--db-text-muted)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 600,
            paddingBottom: 4,
          }}
        >
          <span style={{ color: "var(--db-accent)", fontWeight: 800 }}>§ {catalog}</span>
          <span>CAT · REV 2026.04</span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="relative" style={{ paddingTop: 12 }}>
          {/* Gold stamp — the Catch mark made structural at page level */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 48,
              height: 3,
              background: "var(--db-accent)",
            }}
          />
          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "var(--db-text)",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {title}
          </h1>
          {description && (
            <p
              className="mt-2"
              style={{
                color: "var(--db-text-muted)",
                fontSize: 14,
                lineHeight: 1.55,
                fontWeight: 500,
                maxWidth: 640,
              }}
            >
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">{actions}</div>}
      </div>

      {specs && specs.length > 0 && (
        <div
          style={{
            borderTop: "1px solid var(--db-border)",
            borderBottom: "1px solid var(--db-border)",
            display: "grid",
            gridTemplateColumns: `repeat(${specs.length}, minmax(0, 1fr))`,
          }}
        >
          {specs.map((spec, i) => (
            <div
              key={spec.label}
              style={{
                padding: "10px 14px",
                borderRight:
                  i < specs.length - 1 ? "1px solid var(--db-border-light)" : "none",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--db-text-muted)",
                  fontWeight: 700,
                  marginBottom: 2,
                }}
              >
                {spec.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono), ui-monospace, Menlo, monospace",
                  fontVariantNumeric: "tabular-nums",
                  fontSize: 15,
                  fontWeight: 800,
                  color: "var(--db-text)",
                  letterSpacing: "-0.005em",
                }}
              >
                {spec.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
