"use client";

/**
 * Brand primitives — the stamp language made structural.
 *
 * These components encode the "stamped into steel" metaphor as
 * reusable building blocks, not page-by-page decoration.
 */

import React from "react";
import { C } from "./palette";

/* ────────────────────────────────────────────────────────────────
   Stamp — the 4×48 gold mark at the top-left of a card or band.
   Symbolizes "the lead you catch" — see Brand Kit.
   ──────────────────────────────────────────────────────────────── */

export function Stamp({
  width = 56,
  height = 4,
  position = "top-left",
}: {
  width?: number;
  height?: number;
  position?: "top-left" | "top-center" | "none";
}) {
  const left = position === "top-left" ? 0 : position === "top-center" ? "50%" : undefined;
  const transform = position === "top-center" ? "translateX(-50%)" : undefined;
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        left,
        transform,
        width,
        height,
        background: C.gold,
      }}
    />
  );
}

/* ────────────────────────────────────────────────────────────────
   Serial — mono gold ordinal. Brand the catalog.
   Use on cards, table rows, list items, invoices.
   ──────────────────────────────────────────────────────────────── */

export function Serial({
  n,
  size = "md",
  tone = "gold",
}: {
  n: number | string;
  size?: "sm" | "md" | "lg";
  tone?: "gold" | "muted";
}) {
  const fs = size === "lg" ? 26 : size === "sm" ? 12 : 18;
  const fw = size === "lg" ? 900 : size === "md" ? 800 : 700;
  const color = tone === "gold" ? C.gold : C.inkSoft;
  const value = typeof n === "number" ? String(n).padStart(2, "0") : n;
  return (
    <span
      style={{
        fontFamily: "var(--font-mono), ui-monospace, Menlo, monospace",
        fontVariantNumeric: "tabular-nums",
        fontSize: fs,
        fontWeight: fw,
        color,
        letterSpacing: "-0.01em",
        display: "inline-block",
      }}
    >
      {value}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────
   SpecRow — the atomic unit of information density.
   Used on pricing, settings, receipts, invoices, summary cards.
   ──────────────────────────────────────────────────────────────── */

export function SpecRow({
  label,
  value,
  tone = "light",
  mono = true,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "light" | "dark";
  mono?: boolean;
}) {
  const labelColor = tone === "dark" ? "rgba(248,250,252,0.6)" : C.inkSoft;
  const valueColor = tone === "dark" ? C.white : C.ink;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 24,
        padding: "10px 0",
      }}
    >
      <span
        style={{
          fontSize: 11,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: labelColor,
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: valueColor,
          letterSpacing: "-0.005em",
          fontFamily: mono ? "var(--font-mono), ui-monospace, Menlo, monospace" : undefined,
          fontVariantNumeric: mono ? "tabular-nums" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   SpecSheet — a ruled container for a vertical list of SpecRows.
   Perimeter stroke + interior hairlines, zero rounding.
   ──────────────────────────────────────────────────────────────── */

export function SpecSheet({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";
  return (
    <div
      style={{
        border: `1px solid ${isDark ? "rgba(248,250,252,0.2)" : C.ink}`,
        background: isDark ? C.midnight : C.white,
        padding: "4px 20px",
      }}
    >
      {React.Children.map(children, (child, i) => (
        <div
          style={{
            borderBottom:
              i < React.Children.count(children) - 1
                ? `1px solid ${isDark ? "rgba(248,250,252,0.08)" : C.ruleSoft}`
                : "none",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Band — a full-width section with tone. Used to establish the
   dark/light rhythm across a page.
   ──────────────────────────────────────────────────────────────── */

export function Band({
  children,
  tone = "light",
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark" | "paper";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const bg = tone === "dark" ? C.navy : tone === "paper" ? C.paperDark : C.paper;
  const color = tone === "dark" ? C.paper : C.ink;
  const pad = size === "lg" ? "py-20 sm:py-28" : size === "sm" ? "py-10 sm:py-12" : "py-16 sm:py-20";
  return (
    <section
      style={{ background: bg, color }}
      className={`${pad} ${className}`}
    >
      <div className="mx-auto max-w-[1280px] px-6 sm:px-10">{children}</div>
    </section>
  );
}
