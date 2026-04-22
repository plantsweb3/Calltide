/**
 * Industrial palette — Capta Brand Kit (March 2026).
 *
 * Single source of truth for brand-kit colors.
 * Legacy aliases preserved so prior imports don't break.
 */

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
  paper: "#F8FAFC",       // Truck White — default light background
  paperDark: "#F1F5F9",   // slate-100 — subtle section differentiation
  paperDarker: "#E2E8F0", // slate-200 — deeper bands
  white: "#FFFFFF",

  // Text
  ink: "#0F1729",         // primary text
  inkMuted: "#475569",    // slate-600 — secondary body (AA)
  inkSoft: "#64748B",     // slate-500 — tertiary meta (AA large only)

  // Strokes
  rule: "#E2E8F0",        // slate-200 — hairline
  ruleSoft: "#F1F5F9",    // slate-100 — interior dividers

  // State — Action Green strictly for Booked/Approved per Brand Kit
  success: "#16A34A",
  successBg: "rgba(22,163,74,0.08)",
  danger: "#DC2626",
  dangerBg: "rgba(220,38,38,0.08)",
  warning: "#D97706",
  warningBg: "rgba(217,119,6,0.08)",

  // Legacy aliases — kept for migration compat; new code should use
  // the canonical names above.
  amber: "#D4A843",       // = gold
  amberInk: "#A17D1F",    // = goldDark (used as emphasis text on light bg)
  amberHover: "#A17D1F",
  amberSoft: "#F5E6BC",
  forest: "#16A34A",      // = success
};

export const FONT_SANS = "var(--font-inter), system-ui, sans-serif";
export const FONT_MONO = "var(--font-mono), ui-monospace, Menlo, monospace";
// Legacy alias — no serifs in marketing per Brand Kit. Any code importing
// FONT_SERIF gets Inter.
export const FONT_SERIF = FONT_SANS;
