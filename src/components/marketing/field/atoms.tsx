"use client";

import React from "react";
import { C, FONT_SERIF, FONT_MONO } from "./palette";

/* ────────────────────────────────────────────────────────────────
   Typography primitives
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
  return (
    <Tag
      className={className}
      style={{
        fontFamily: FONT_SERIF,
        fontOpticalSizing: "auto",
        fontVariationSettings: '"SOFT" 30, "WONK" 0',
        ...style,
      }}
    >
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
  const textColor = tone === "dark" ? "rgba(248,245,238,0.7)" : C.inkMuted;
  return (
    <div
      style={{
        color: textColor,
        fontSize: 12,
        letterSpacing: "0.22em",
        fontWeight: 600,
        textTransform: "uppercase",
      }}
      className="flex items-center gap-3"
    >
      <span
        aria-hidden
        style={{ width: 24, height: 1, background: C.amber, display: "inline-block" }}
      />
      <span>{children}</span>
    </div>
  );
}

export function Rule({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      style={{ borderTop: `1px solid ${C.rule}` }}
      className={`mx-auto max-w-[1280px] px-6 sm:px-10 ${className}`}
    />
  );
}

/* ────────────────────────────────────────────────────────────────
   Buttons
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
  size?: "md" | "lg";
  onClick?: (e: React.MouseEvent) => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const pad = size === "lg" ? "14px 24px" : "10px 18px";
  const fs = size === "lg" ? 15 : 14;
  const baseStyle: React.CSSProperties = {
    background: C.navy,
    color: C.white,
    fontSize: fs,
    fontWeight: 600,
    padding: pad,
    borderRadius: 4,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    transition: "background 150ms cubic-bezier(0.2, 0, 0, 1)",
    letterSpacing: "-0.005em",
    border: `1px solid ${C.navy}`,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    textDecoration: "none",
  };
  const contents = (
    <>
      {children}
      <span style={{ fontSize: fs - 2, opacity: 0.9 }}>→</span>
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        style={baseStyle}
        onClick={onClick}
        onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = C.navyLight)}
        onMouseLeave={(e) => !disabled && (e.currentTarget.style.background = C.navy)}
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
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = C.navyLight)}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.background = C.navy)}
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
}: {
  href?: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  size?: "md" | "lg";
}) {
  const pad = size === "lg" ? "13px 22px" : "10px 18px";
  const fs = size === "lg" ? 15 : 14;
  const baseStyle: React.CSSProperties = {
    background: "transparent",
    color: C.ink,
    fontSize: fs,
    fontWeight: 600,
    padding: pad,
    borderRadius: 4,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: `1px solid ${C.ink}`,
    transition: "all 150ms cubic-bezier(0.2, 0, 0, 1)",
    textDecoration: "none",
    cursor: "pointer",
  };
  if (href) {
    return (
      <a
        href={href}
        style={baseStyle}
        onClick={onClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = C.ink;
          e.currentTarget.style.color = C.white;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = C.ink;
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
        e.currentTarget.style.background = C.ink;
        e.currentTarget.style.color = C.white;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = C.ink;
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
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        textDecoration: "underline",
        textUnderlineOffset: 3,
        textDecorationColor: C.rule,
        textDecorationThickness: 1,
      }}
    >
      {children}
      <span style={{ fontSize: 14 }}>→</span>
    </a>
  );
}

/* ────────────────────────────────────────────────────────────────
   Page frame — wraps the paper background + subtle texture
   ──────────────────────────────────────────────────────────────── */

export function FieldFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: C.paper,
        color: C.ink,
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        fontFeatureSettings: '"ss01", "cv11"',
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/></svg>")`,
        backgroundRepeat: "repeat",
      }}
      className="min-h-screen overflow-x-hidden"
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Serif display heading — the signature editorial h1/h2
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
        fontFamily: FONT_SERIF,
        fontOpticalSizing: "auto",
        fontVariationSettings: '"SOFT" 30, "WONK" 0',
        fontSize: "clamp(44px, 6.5vw, 88px)",
        lineHeight: 0.95,
        letterSpacing: "-0.025em",
        fontWeight: 500,
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
        fontFamily: FONT_SERIF,
        fontOpticalSizing: "auto",
        fontVariationSettings: '"SOFT" 30, "WONK" 0',
        fontSize: "clamp(36px, 4.2vw, 60px)",
        lineHeight: 1,
        letterSpacing: "-0.02em",
        fontWeight: 500,
        color: tone === "dark" ? C.paper : C.ink,
        ...style,
      }}
    >
      {children}
    </h2>
  );
}
