#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────
# Brand drift check — flags raw hex color values in component files
# outside the allowed source-of-truth paths. Guardrail against the
# three-palette drift problem that prompted the brand system v2.
#
# Allowed to contain raw hex:
#   - src/design/tokens.ts      (canonical)
#   - src/design/*              (any future token files)
#   - src/app/globals.css       (Tailwind theme bridge)
#   - src/components/marketing/industrial/palette.ts (brand subset)
#   - src/app/opengraph-image.tsx  (Satori/ImageResponse needs literals)
#   - src/app/setup/setup.module.css  (CSS module — can't reference TS tokens)
#
# Everything else should reference tokens by name (C.navy, var(--db-text), etc.)
#
# Exit 0 = clean. Exit 1 = drift found.
# ────────────────────────────────────────────────────────────────

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Files that are allowed to carry raw hex values.
ALLOWLIST=(
  "src/design/"
  "src/components/marketing/industrial/palette.ts"
  "src/app/globals.css"
  "src/app/opengraph-image.tsx"
  "src/app/setup/setup.module.css"
)

# Build a grep --exclude glob for the allowlist.
EXCLUDES=""
for p in "${ALLOWLIST[@]}"; do
  EXCLUDES="$EXCLUDES --exclude-dir=$(dirname "$p")"
done

# Search component + page files for raw 6-char hex codes outside allowlist.
# Matches `#RRGGBB`, `#RRGGBBAA` (case-insensitive). Allows comments like
# "// #D4A843" if the line isn't a style-value line.
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
    | grep -v "^Binary" \
    | grep -v "^\s*//" \
    | grep -v "^\s*\*" \
    || true
)

if [ -n "$VIOLATIONS" ]; then
  COUNT=$(echo "$VIOLATIONS" | wc -l | tr -d ' ')
  echo ""
  echo "✗ Brand drift — $COUNT raw hex value(s) outside tokens:"
  echo ""
  echo "$VIOLATIONS" | head -40
  if [ "$COUNT" -gt 40 ]; then
    echo ""
    echo "...and $(($COUNT - 40)) more. Run the grep manually to see all."
  fi
  echo ""
  echo "Fix: reference tokens from src/design/tokens.ts or"
  echo "     src/components/marketing/industrial/palette.ts (C.navy, C.gold, etc.)."
  echo "     For CSS vars use var(--db-text) / var(--color-navy)."
  echo ""
  exit 1
fi

echo "✓ Brand drift check clean. No raw hex outside tokens."
