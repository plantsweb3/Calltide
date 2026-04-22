/** Shared brand and company constants */

// Brand Kit — Catch Gold #D4A843. Keep in sync with src/design/tokens.ts.
// Inline email HTML can't reference CSS vars, so the hex lives here as the
// single source of truth for every email template.
export const BRAND_COLOR = "#D4A843";
export const BRAND_COLOR_HOVER = "#A17D1F";
// Dark container surfaces used across transactional emails.
export const BRAND_NAVY = "#1B2A4A";
export const BRAND_MIDNIGHT = "#0F1729";
export const BRAND_INK = "#0F1729";
export const BRAND_INK_MUTED = "#475569";
export const BRAND_PAPER = "#F8FAFC";
export const BRAND_RULE = "#E2E8F0";
export const BRAND_SUCCESS = "#16A34A";
export const BRAND_DANGER = "#DC2626";

export const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS ?? "Capta LLC, PO Box 1247, San Marcos, TX 78667";
export const COMPANY_NAME = "Capta";

export const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://captahq.com";
