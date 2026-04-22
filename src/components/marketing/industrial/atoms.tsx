"use client";

import React from "react";
import { C, FONT_MONO } from "./palette";

/* ────────────────────────────────────────────────────────────────
   Typography primitives
   ────────────────────────────────────────────────────────────────

   Serif is a compatibility shim — marketing is Inter-only per brand
   kit, but legacy pages still import `Serif`. It renders plain Inter
   so those imports don't break during migration.
   ──────────────────────────────────────────────────────────────── */

export function Serif({
  children,
  className = "",
  style = {},
  as: Tag = "span",
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p" | "em" | "strong" | "blockquote";
}) {
  // Strip Fraunces-specific variation settings if passed through.
  const { fontVariationSettings: _fvs, fontStyle: _fs, ...rest } = style;
  return (
    <Tag className={className} style={rest}>
      {children}
    </Tag>
  );
}

export function Mono({
  children,
  className = "",
  style = {},
  as: Tag = "span",
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: "span" | "p" | "div";
}) {
  return (
    <Tag
      className={className}
      style={{
        fontFamily: FONT_MONO,
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

/* ────────────────────────────────────────────────────────────────
   Section labels + dividers
   ──────────────────────────────────────────────────────────────── */

export function Kicker({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <div
      style={{
        color: C.amber,
        fontSize: 12,
        letterSpacing: "0.22em",
        fontWeight: 800,
        textTransform: "uppercase",
      }}
      className="flex items-center gap-4"
    >
      <span
        aria-hidden
        style={{ width: 40, height: 4, background: C.amber, display: "inline-block" }}
      />
      <span style={{ color: tone === "dark" ? C.amber : C.amber }}>{children}</span>
    </div>
  );
}

export function Rule({
  className = "",
  weight = "soft",
}: {
  className?: string;
  weight?: "soft" | "heavy";
}) {
  const border = weight === "heavy" ? `2px solid ${C.ink}` : `1px solid ${C.rule}`;
  return (
    <div
      aria-hidden
      style={{ borderTop: border }}
      className={`mx-auto max-w-[1280px] px-6 sm:px-10 ${className}`}
    />
  );
}

/* ────────────────────────────────────────────────────────────────
   Catalog marker — spec-sheet metadata strip. Lives at the top of
   a hero. Signals "this is documentation" rather than "marketing."
   ──────────────────────────────────────────────────────────────── */

export function CatalogMarker({
  section,
  rev = "2026.04",
  tone = "light",
}: {
  section: string;
  rev?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className="hidden sm:flex items-center justify-between"
      style={{
        fontFamily: "var(--font-mono), ui-monospace, Menlo, monospace",
        fontSize: 11,
        color: tone === "dark" ? "rgba(248,250,252,0.55)" : C.inkSoft,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
      }}
    >
      <span>§ {section}</span>
      <span>Cat · Rev {rev}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Buttons — gold primary, navy outline, text tertiary
   ──────────────────────────────────────────────────────────────── */

export function PrimaryButton({
  href,
  children,
  size = "md",
  onClick,
  type,
  disabled,
}: {
  href?: string;
  children: React.ReactNode;
  size?: "md" | "lg" | "sm";
  onClick?: (e: React.MouseEvent) => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const pad = size === "lg" ? "15px 24px" : size === "sm" ? "9px 16px" : "12px 20px";
  const fs = size === "lg" ? 16 : size === "sm" ? 13 : 14;
  const baseStyle: React.CSSProperties = {
    background: C.amber,
    color: C.midnight,
    fontSize: fs,
    fontWeight: 800,
    padding: pad,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: `1px solid ${C.amber}`,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    textDecoration: "none",
    transition: "background 150ms",
    letterSpacing: "-0.005em",
  };
  const contents = (
    <>
      {children}
      <span style={{ fontWeight: 700 }}>→</span>
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        style={baseStyle}
        onClick={onClick}
        onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = C.amberHover)}
        onMouseLeave={(e) => !disabled && (e.currentTarget.style.background = C.amber)}
      >
        {contents}
      </a>
    );
  }
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      style={baseStyle}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = C.amberHover)}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.background = C.amber)}
    >
      {contents}
    </button>
  );
}

export function SecondaryButton({
  href,
  children,
  onClick,
  size = "md",
  tone = "light",
}: {
  href?: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  size?: "md" | "lg";
  tone?: "light" | "dark";
}) {
  const pad = size === "lg" ? "14px 22px" : "11px 18px";
  const fs = size === "lg" ? 16 : 14;
  const isDark = tone === "dark";
  const baseStyle: React.CSSProperties = {
    background: "transparent",
    color: isDark ? C.white : C.ink,
    fontSize: fs,
    fontWeight: 700,
    padding: pad,
    border: `1px solid ${isDark ? "rgba(248,250,252,0.55)" : C.ink}`,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    cursor: "pointer",
    letterSpacing: "-0.005em",
    transition: "all 150ms",
  };
  if (href) {
    return (
      <a
        href={href}
        style={baseStyle}
        onClick={onClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isDark ? C.white : C.ink;
          e.currentTarget.style.color = isDark ? C.ink : C.white;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = isDark ? C.white : C.ink;
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={baseStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDark ? C.white : C.ink;
        e.currentTarget.style.color = isDark ? C.ink : C.white;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = isDark ? C.white : C.ink;
      }}
    >
      {children}
    </button>
  );
}

export function TertiaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      style={{
        color: C.ink,
        fontSize: 14,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        textDecoration: "underline",
        textUnderlineOffset: 4,
        textDecorationColor: C.amber,
        textDecorationThickness: 2,
      }}
    >
      {children}
      <span style={{ fontSize: 14 }}>→</span>
    </a>
  );
}

/* ────────────────────────────────────────────────────────────────
   Page frame
   ──────────────────────────────────────────────────────────────── */

export function FieldFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: C.paper,
        color: C.ink,
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        fontFeatureSettings: '"ss01", "cv11"',
      }}
      className="min-h-screen overflow-x-hidden"
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Display headings — Inter 900 tracking-tight
   ──────────────────────────────────────────────────────────────── */

export function DisplayH1({
  children,
  tone = "light",
  style = {},
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
  style?: React.CSSProperties;
}) {
  return (
    <h1
      style={{
        fontSize: "clamp(44px, 6.5vw, 88px)",
        lineHeight: 0.95,
        letterSpacing: "-0.035em",
        fontWeight: 900,
        color: tone === "dark" ? C.paper : C.ink,
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

export function DisplayH2({
  children,
  tone = "light",
  style = {},
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
  style?: React.CSSProperties;
}) {
  return (
    <h2
      style={{
        fontSize: "clamp(34px, 4.2vw, 56px)",
        lineHeight: 1,
        letterSpacing: "-0.03em",
        fontWeight: 900,
        color: tone === "dark" ? C.paper : C.ink,
        ...style,
      }}
    >
      {children}
    </h2>
  );
}
