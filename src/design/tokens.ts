/**
 * Capta design tokens — single source of truth.
 *
 * Every brand decision defined once. Every surface consumes these.
 * Hex values should not exist outside this file (enforced by stylelint).
 *
 * Anchored to the Capta Brand Kit (March 2026):
 *   Navy #1B2A4A · Catch Gold #D4A843 · Truck White #F8FAFC ·
 *   Midnight #0F1729 · Action Green #16A34A.
 */

/* ────────────────────────────────────────────────────────────────
   COLOR
   ──────────────────────────────────────────────────────────────── */

export const C = {
  // Brand — primary
  navy: "#1B2A4A",
  navyLight: "#263556",
  navyDeep: "#12182B",
  midnight: "#0F1729",

  // Brand — accent
  gold: "#D4A843",
  goldDark: "#A17D1F",
  goldSoft: "#F5E6BC",

  // Surfaces
  paper: "#F8FAFC",      // Truck White — default light surface
  paperDark: "#F1F5F9",  // slate-100 — subtle band differentiation
  paperDarker: "#E2E8F0",// slate-200 — deeper bands
  white: "#FFFFFF",

  // Text
  ink: "#0F1729",        // = Midnight, primary text
  inkMuted: "#475569",   // slate-600 — secondary text (AA body)
  inkSoft: "#64748B",    // slate-500 — tertiary meta (AA large only)

  // Strokes
  rule: "#E2E8F0",       // slate-200 — hairline
  ruleSoft: "#F1F5F9",   // slate-100 — interior dividers

  // State (Action Green strictly for Booked/Approved)
  success: "#16A34A",
  successBg: "rgba(22,163,74,0.08)",
  danger: "#DC2626",
  dangerBg: "rgba(220,38,38,0.08)",
  warning: "#D97706",
  warningBg: "rgba(217,119,6,0.08)",

  // Legacy aliases — kept so existing imports don't break during migration.
  // New code should use the canonical names above.
  amber: "#D4A843",
  amberInk: "#A17D1F",
  amberHover: "#A17D1F",
  amberSoft: "#F5E6BC",
  forest: "#16A34A",
} as const;

/* ────────────────────────────────────────────────────────────────
   TYPOGRAPHY
   ──────────────────────────────────────────────────────────────── */

export const FONT = {
  sans: "var(--font-inter), system-ui, sans-serif",
  mono: "var(--font-mono), ui-monospace, Menlo, monospace",
  // Legacy alias — marketing is Inter-only per Brand Kit. Any code importing
  // FONT_SERIF gets Inter.
  serif: "var(--font-inter), system-ui, sans-serif",
} as const;

export const TYPE = {
  display: {
    xl: { size: "clamp(44px, 6.5vw, 88px)", line: 0.95, track: "-0.035em", weight: 900 },
    lg: { size: "clamp(34px, 4.2vw, 56px)", line: 1.0, track: "-0.03em", weight: 900 },
    md: { size: "clamp(28px, 3vw, 40px)", line: 1.05, track: "-0.025em", weight: 900 },
  },
  heading: {
    lg: { size: 24, line: 1.15, track: "-0.02em", weight: 800 },
    md: { size: 20, line: 1.2, track: "-0.015em", weight: 800 },
    sm: { size: 16, line: 1.25, track: "-0.01em", weight: 700 },
  },
  body: {
    lg: { size: 19, line: 1.5, weight: 500 },
    md: { size: 16, line: 1.55, weight: 500 },
    sm: { size: 14, line: 1.55, weight: 500 },
    xs: { size: 13, line: 1.5, weight: 500 },
  },
  meta: {
    md: { size: 12, line: 1.4, weight: 600, track: "0.14em", upper: true },
    sm: { size: 11, line: 1.4, weight: 700, track: "0.22em", upper: true },
  },
} as const;

/* ────────────────────────────────────────────────────────────────
   SPACE — 8-pt grid
   ──────────────────────────────────────────────────────────────── */

export const SPACE = {
  s0: 0,
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 24,
  s6: 32,
  s7: 40,
  s8: 48,
  s10: 64,
  s12: 96,
  s14: 128,
} as const;

/* ────────────────────────────────────────────────────────────────
   STROKE — 1 / 2 / 4 px only. Industrial bias.
   ──────────────────────────────────────────────────────────────── */

export const STROKE = {
  hairline: 1,
  medium: 2,
  heavy: 4,
} as const;

/* ────────────────────────────────────────────────────────────────
   RADIUS — sharp-edge bias, max 4px
   ──────────────────────────────────────────────────────────────── */

export const RADIUS = {
  none: 0,
  xs: 2,
  sm: 4,
} as const;

/* ────────────────────────────────────────────────────────────────
   MOTION
   ──────────────────────────────────────────────────────────────── */

export const MOTION = {
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
  ease: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

/* ────────────────────────────────────────────────────────────────
   LAYOUT
   ──────────────────────────────────────────────────────────────── */

export const LAYOUT = {
  containerMax: 1280,
  containerNarrow: 880,
} as const;
