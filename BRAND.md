# Capta Brand System

The source of truth for every design decision. Read this before writing any
user-facing surface. Anchored to the official Capta Brand Kit (March 2026).

---

## The metaphor

Capta is **"the Catch."** The heavy geometric C is the secure structure —
the net, the hook — protecting the high-value lead, which is the **gold dot**
at the center.

Every brand decision ladders down from that metaphor:

- **Navy `#1B2A4A`** is the structure — strong, industrial, safe.
- **Catch Gold `#D4A843`** is the lead — the thing you caught. It's
  a *point* accent, not a color wash. Use sparingly: CTAs, price numerals,
  active states, stamps, the logo dot, key data.
- **Truck White `#F8FAFC`** is the workbench — the surface on which the
  work happens.
- **Midnight `#0F1729`** is night, off-hours, after 5 p.m. — the moments
  Capta earns its keep.
- **Action Green `#16A34A`** is "Booked." "Approved." "Paid." Nothing else.

The archetype is **The Expert Tradesman** — technically deep, practically
smart, earns trust through competence. Built by tradespeople, for
tradespeople.

---

## Voice

- Primary VP: **"Never miss a call again."**
- Canonical pitch: **"She answers. She quotes. She follows up. You do the work."**
- Speak like an experienced business manager talking to a crew lead.
- Lexicon: dispatch, estimate, job site, revenue, capture, crew, truck, off-hours.
- Forbidden: tech jargon ("AI LLM," "omnichannel"), corporate fluff
  ("synergize"), startup-cute ("oopsie!"), magazine-editorial italics.

**CTA copy:** always "Get Capta →". Never "Start Free Trial." 14-day trial
is messaged as a benefit beside the CTA, not as the CTA itself.

---

## Design tokens

The canonical source is `src/design/tokens.ts`. Every hex value, every
font stack, every spacing unit lives there. Anything outside that file
referencing a raw hex is a lint error.

```
src/design/tokens.ts          — canonical tokens (TS exports)
src/components/marketing/industrial/palette.ts  — brand subset re-exported
                                                  for component consumption
```

### Color — minimum knowledge

| Token         | Hex        | Use                                    |
|---------------|------------|----------------------------------------|
| `navy`        | `#1B2A4A`  | Primary brand, dark backgrounds, body ink inverse |
| `midnight`    | `#0F1729`  | Deepest backgrounds, primary text on light |
| `gold`        | `#D4A843`  | CTA buttons, prices, active states, stamps, logo dot |
| `goldDark`    | `#A17D1F`  | Gold hover, emphasis text on light     |
| `paper`       | `#F8FAFC`  | Default light surface (Truck White)    |
| `white`       | `#FFFFFF`  | Elevated surfaces, cards                |
| `ink`         | `#0F1729`  | Primary text on light                  |
| `inkMuted`    | `#475569`  | Secondary body (AA compliant)          |
| `inkSoft`     | `#64748B`  | Tertiary meta (11–12 px upper only)    |
| `rule`        | `#E2E8F0`  | Hairline borders                       |
| `success`     | `#16A34A`  | **Booked / Approved states only**      |

### Typography — Inter only

- Display: Inter weight 900, tracking `-0.025em` to `-0.035em`, line 0.95–1.0.
- Body: Inter weight 400/500/600, line 1.5–1.6.
- Mono: JetBrains Mono for money, phone numbers, timestamps, catalog
  markers, serials. Always `font-variant-numeric: tabular-nums`.

**No serifs anywhere in marketing or product.** Non-negotiable.

### Spacing — 8-pt grid

`0 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128`. Every vertical gap,
every horizontal padding, every section margin lands on this grid.

### Stroke

- `hairline` = 1 px (default borders, interior dividers).
- `medium` = 2 px (major section rules, headline accents).
- `heavy` = 4 px (gold stamps, active-state underlines).

### Radius

- `none` = 0 px (default — sharp-edge industrial bias).
- `xs` = 2 px (tight refinements).
- `sm` = 4 px (max — buttons, inputs).

Nothing rounds more than 4 px. Industrial signage doesn't have rounded corners.

### Motion

- `fast` = 150 ms (buttons, toggles).
- `normal` = 200 ms (panels, modals).
- `slow` = 300 ms (page transitions — rare in marketing, which is static).
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` — Apple-style deceleration.

---

## Primitives

All in `src/components/marketing/industrial/`. Import through the barrel:

```ts
import {
  C, Mono, Kicker, Rule, CatalogMarker,
  PrimaryButton, SecondaryButton, TertiaryLink,
  FieldFrame, DisplayH1, DisplayH2,
  Stamp, Serial, SpecRow, SpecSheet, Band,
  Nav, Footer, DemoCtaPair, SkipLink, IndustrialDemoWidget
} from "@/components/marketing/industrial";
```

- **`<Kicker>`** — gold rule + uppercase mono label, 40×4.
- **`<Rule weight="heavy|soft">`** — section separator. Heavy = 2 px ink; soft = 1 px slate-200.
- **`<CatalogMarker>`** — spec-sheet metadata strip (`§ 01 · PAGE · CAT · REV 2026.04`).
- **`<Stamp>`** — 4×56 gold mark at the top-left of a card.
- **`<Serial n={01} />`** — mono gold ordinal. The catalog identity.
- **`<SpecRow>` / `<SpecSheet>`** — labeled data rows in a ruled container.
- **`<Band tone="dark|light|paper">`** — full-width section with brand tone.
- **`<PrimaryButton>`** — gold fill, Midnight text, **"Get Capta →"** copy.
- **`<DisplayH1>` / `<DisplayH2>`** — Inter 900 tracking-tight display type.

---

## Surface rules

1. **Marketing + homepage + /audit + /setup:** industrial primitives only.
2. **Dashboard + admin:** `--db-*` palette (aliased to brand navy family as of
   April 2026). Reuse Serial + SpecRow primitives where it makes sense —
   job cards, invoices, settings.
3. **Blog + help + legal + status:** can use globals.css Tailwind aliases,
   but only the brand-kit-aligned ones (navy, gold, truck-white, action-green).
4. **Error pages:** use Band + DisplayH1.
5. **Every page has a `<CatalogMarker>` at the top of its hero** (industrial
   surfaces only).

---

## Do NOT

- Reference hex values directly in components (use tokens).
- Use italic display type (magazine flourish — not industrial).
- Paint entire sentences gold (gold = point accent).
- Use rounded-corner radius > 4 px.
- Use drop shadows as the primary structural device (use strokes).
- Use `Action Green` for decorative checkmarks (state states only).
- Ship a serif font anywhere in marketing.
- Write "Start Free Trial" as a CTA (use "Get Capta →").
- Add gradients, glows, or shimmer.
- Use `inkSoft` on body text smaller than 18 px (fails AA).

---

## When you're about to make a design decision, ask

1. **Does this honor the Catch metaphor?** (Navy = structure, gold = lead caught.)
2. **Is this earning its gold?** (Gold should appear at most once per viewport
   as a point accent.)
3. **Does this feel stamped into steel?** (Sharp edges, heavy weight, precise
   alignment — or is it drifting magazine?)
4. **Is the plane hierarchy visible?** (Can you tell at 3 ft away where a
   card starts and the page ends? If not, push contrast tiers.)
5. **Would a 45-year-old HVAC owner trust this?** (Not a design reviewer.
   Not a founder. The actual buyer.)

---

## Version

- 1.0 — March 10, 2026: Capta Brand Kit published.
- 2.0 — April 22, 2026: industrial primitives, token system, setup +
  audit migrations, dashboard palette aligned to brand navy.
