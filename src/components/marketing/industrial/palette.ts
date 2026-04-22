/**
 * Industrial palette — Brand Kit (March 2026).
 *
 * Keys mirror the legacy Field Manual palette so migrating pages is a
 * single import swap. Values are the brand-kit industrial colors:
 * Navy + Catch Gold + Truck White + Midnight + Action Green.
 */
export const C = {
  paper: "#F8FAFC",       // Truck White — default light background
  paperDark: "#F1F5F9",   // slate-100 — subtle section differentiation
  paperDarker: "#E2E8F0", // slate-200 — deeper bands
  ink: "#0F1729",         // Midnight — primary text
  inkMuted: "#475569",    // slate-600 — secondary text
  inkSoft: "#64748B",     // slate-500 — tertiary / meta
  navy: "#1B2A4A",        // Capta Navy — primary brand color
  navyLight: "#263556",   // navy hover
  midnight: "#0F1729",    // deepest dark background
  amber: "#D4A843",       // Catch Gold — legacy key name; reads as gold here
  amberInk: "#A17D1F",    // darker gold for emphasis text on light bg
  amberHover: "#A17D1F",  // gold hover (darker)
  amberSoft: "#F5E6BC",   // gold tint
  forest: "#16A34A",      // Action Green — success states only
  rule: "#E2E8F0",        // slate-200 — standard borders
  ruleSoft: "#F1F5F9",    // slate-100 — subtle dividers
  white: "#FFFFFF",
};

export const FONT_SANS = "var(--font-inter), system-ui, sans-serif";
export const FONT_MONO = "var(--font-mono), ui-monospace, Menlo, monospace";
// Legacy alias: serif no longer used in marketing per brand kit. Some
// components still import this — points to Inter so there's no regression
// if a legacy reference slips through.
export const FONT_SERIF = FONT_SANS;
