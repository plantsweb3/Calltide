#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────
# Brand drift check — flags raw hex color values in component files
# that do NOT match the Brand Kit palette. Guardrail against the
# three-palette drift problem that prompted the brand system v2.
#
# What's allowed (not flagged):
#   1. Files in the canonical source-of-truth paths (tokens.ts, palette.ts,
#      globals.css, opengraph-image.tsx, setup.module.css).
#   2. Hex values inside `var(--token, #hex)` fallbacks.
#   3. Hex values that match the Brand Kit palette literally.
#   4. Comment-only lines (// or *).
#
# What's flagged:
#   - Raw, unbound hex values like `color: "#475569"` or `bg-[#123456]`
#     where the hex isn't part of the Brand Kit.
#
# Exit 0 = clean. Exit 1 = drift found.
# ────────────────────────────────────────────────────────────────

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Brand Kit palette + approved semantic state colors + Tailwind slate
# shades — allowed inline literals.
# Keep in sync with src/design/tokens.ts. Anything outside this set is
# treated as drift.
BRAND_HEXES='#1B2A4A|#263556|#12182B|#0F1729|#D4A843|#A17D1F|#F5E6BC|#F8FAFC|#F1F5F9|#E2E8F0|#FFFFFF|#475569|#64748B|#E4DECD|#16A34A|#DC2626|#D97706|#020617|#1e293b|#334155|#3A4870|#8F9BB8|#B9C2D6|#7c8ca1|#E3BB5A|#12182b'

# Dashboard semantic state colors (lighter shades for dark-bg legibility).
# These are functional, not brand-accent — flagged separately from brand.
STATE_HEXES='#4ade80|#22c55e|#16a34a|#f87171|#ef4444|#dc2626|#fbbf24|#f59e0b|#d97706|#60a5fa|#3b82f6|#2563eb|#8b5cf6|#a855f7|#c084fc|#94a3b8|#cbd5e1|#e2e8f0|#f1f5f9|#f8fafc|#0f172a|#1e293b|#334155|#475569|#64748b|#0f1729|#1b2a4a|#d4a843|#a17d1f|#ffffff|#fff|#e2e8f0|#c59a27'

VIOLATIONS=$(
  grep -rEn '#[0-9A-Fa-f]{6}\b' \
    src/app/ \
    src/components/ \
    --include="*.tsx" \
    --include="*.ts" \
    --include="*.css" \
    --include="*.module.css" \
    2>/dev/null \
    | grep -v "src/design/" \
    | grep -v "src/components/marketing/industrial/palette.ts" \
    | grep -v "src/app/globals.css" \
    | grep -v "src/app/opengraph-image.tsx" \
    | grep -v "src/app/setup/setup.module.css" \
    | grep -v "src/app/api/" \
    | grep -v "src/app/book/\[slug\]/booking.module.css" \
    | grep -v "^Binary" \
    | grep -v "^\s*//" \
    | grep -v "^\s*\*" \
    | grep -v 'var(--[a-zA-Z0-9_-]*, *#[0-9A-Fa-f]\{6\})' \
    | grep -viE "$BRAND_HEXES" \
    | grep -viE "$STATE_HEXES" \
    || true
)

# Baseline — the count of known-tolerated drift at the time of writing.
# Rule: new PRs can't push the count above this number. When we clean up
# more drift, lower this number in the same PR. Never raise it without
# a review comment explaining why (e.g. adding a new functional color).
BASELINE=74

COUNT=0
if [ -n "$VIOLATIONS" ]; then
  COUNT=$(echo "$VIOLATIONS" | wc -l | tr -d ' ')
fi

if [ "$COUNT" -gt "$BASELINE" ]; then
  echo ""
  echo "✗ Brand drift — $COUNT raw non-palette hex value(s), above baseline ($BASELINE):"
  echo ""
  echo "$VIOLATIONS" | head -40
  if [ "$COUNT" -gt 40 ]; then
    echo ""
    echo "...and $(($COUNT - 40)) more."
  fi
  echo ""
  echo "Fix: use a Brand Kit hex (see src/design/tokens.ts) or reference a"
  echo "     token via CSS var: \"var(--db-text, #0F1729)\"."
  echo ""
  echo "Or, if the new colors are legitimate (functional / external brand /"
  echo "data-viz), lower the baseline in scripts/brand-drift.sh and note why."
  echo ""
  exit 1
fi

if [ "$COUNT" -gt 0 ]; then
  echo "◦ Brand drift — $COUNT known violations (≤ baseline $BASELINE). Ship-ok."
  echo "  Top offenders:"
  echo "$VIOLATIONS" | cut -d: -f1 | sort | uniq -c | sort -rn | head -5 | sed 's/^/    /'
else
  echo "✓ Brand drift clean. No non-palette hexes outside tokens."
fi
exit 0
