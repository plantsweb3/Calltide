"use client";

/**
 * Internal design system catalog.
 *
 * Not linked from the marketing nav. Lives at /design for developers
 * and designers to reference while building new surfaces.
 * Always reads from the latest industrial primitives — if something
 * breaks here, the primitive broke.
 */

import { useState } from "react";
import {
  C,
  Mono,
  Kicker,
  Rule,
  CatalogMarker,
  PrimaryButton,
  SecondaryButton,
  TertiaryLink,
  FieldFrame,
  DisplayH1,
  DisplayH2,
  Stamp,
  Serial,
  SpecRow,
  SpecSheet,
  Band,
} from "@/components/marketing/industrial";

export default function DesignCatalog() {
  return (
    <FieldFrame>
      <main id="main" style={{ color: C.ink }}>
        <Band tone="light" size="lg">
          <div style={{ marginBottom: 32 }}>
            <CatalogMarker section="∞ · Design" rev="2026.04" />
          </div>
          <Kicker>Internal</Kicker>
          <DisplayH1 style={{ marginTop: 24 }}>
            Capta
            <br />
            <span
              style={{
                borderBottom: `4px solid ${C.gold}`,
                paddingBottom: 6,
                display: "inline-block",
                lineHeight: 1,
              }}
            >
              design system
            </span>
          </DisplayH1>
          <p
            className="mt-8 max-w-[640px]"
            style={{ fontSize: 19, lineHeight: 1.55, color: C.inkMuted, fontWeight: 500 }}
          >
            Every brand primitive rendered live. Read <code style={codeStyle}>BRAND.md</code> at
            the repo root first — it explains the metaphor, the palette rationale, and the
            do / do-not rules. This page is the live inventory.
          </p>
        </Band>

        <Rule weight="heavy" />

        <ColorSection />
        <Rule />
        <TypographySection />
        <Rule />
        <SpacingStrokeSection />
        <Rule />
        <ButtonSection />
        <Rule />
        <DisplaySection />
        <Rule />
        <StampSection />
        <Rule />
        <SerialSection />
        <Rule />
        <SpecSheetSection />
        <Rule />
        <KickerSection />
        <Rule />
        <PatternsSection />
        <Rule />
        <BandSection />
        <Rule />
        <DoNotSection />
      </main>
    </FieldFrame>
  );
}

/* ────────────────────────────────────────────────────────────────
   Shared chrome
   ──────────────────────────────────────────────────────────────── */

const codeStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono), ui-monospace, Menlo, monospace",
  fontSize: 13,
  background: C.paperDark,
  padding: "2px 6px",
  borderRadius: 0,
  color: C.ink,
  fontWeight: 600,
};

function Section({
  title,
  num,
  children,
}: {
  title: string;
  num: string;
  children: React.ReactNode;
}) {
  return (
    <Band tone="light">
      <div className="flex items-baseline gap-4 mb-8">
        <Serial n={num} size="lg" />
        <h2
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: C.ink,
            letterSpacing: "-0.025em",
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </Band>
  );
}

function Card({
  children,
  tone = "light",
  compact = false,
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
  compact?: boolean;
}) {
  const isDark = tone === "dark";
  return (
    <div
      style={{
        background: isDark ? C.navy : C.white,
        border: `1px solid ${isDark ? C.navy : C.ink}`,
        padding: compact ? 16 : 24,
        position: "relative",
      }}
    >
      <Stamp />
      {children}
    </div>
  );
}

function Snippet({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <pre
        style={{
          fontFamily: "var(--font-mono), ui-monospace, Menlo, monospace",
          fontSize: 12,
          background: C.midnight,
          color: C.paper,
          padding: 14,
          borderRadius: 0,
          overflow: "auto",
          lineHeight: 1.5,
          border: `1px solid ${C.midnight}`,
        }}
      >
        <code>{children}</code>
      </pre>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(children);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: copied ? C.gold : "rgba(248,250,252,0.1)",
          color: copied ? C.midnight : C.paper,
          border: `1px solid ${copied ? C.gold : "rgba(248,250,252,0.2)"}`,
          padding: "4px 10px",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Sections
   ──────────────────────────────────────────────────────────────── */

function ColorSection() {
  const swatches: { name: keyof typeof C; role: string }[] = [
    { name: "navy", role: "Primary — structure, inverse surfaces" },
    { name: "midnight", role: "Deepest dark, body ink on light" },
    { name: "gold", role: "Point accent — CTA, price, stamp, dot" },
    { name: "goldDark", role: "Gold hover + emphasis text on light" },
    { name: "paper", role: "Default light surface (Truck White)" },
    { name: "white", role: "Elevated surfaces (cards)" },
    { name: "ink", role: "Primary text on light" },
    { name: "inkMuted", role: "Secondary body (AA)" },
    { name: "inkSoft", role: "Tertiary meta only (large)" },
    { name: "success", role: "Booked / Approved states only" },
    { name: "danger", role: "Destructive + error" },
  ];
  return (
    <Section title="Color" num="01">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0" style={{ border: `1px solid ${C.ink}` }}>
        {swatches.map((s, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const lastRow = row === Math.floor((swatches.length - 1) / 4);
          return (
            <div
              key={s.name}
              style={{
                borderRight: col !== 3 ? `1px solid ${C.ink}` : "none",
                borderBottom: !lastRow ? `1px solid ${C.ink}` : "none",
                background: C.white,
                padding: 16,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: 72,
                  background: C[s.name] as string,
                  border: s.name === "white" || s.name === "paper" ? `1px solid ${C.rule}` : "none",
                }}
              />
              <Mono style={{ display: "block", marginTop: 10, fontSize: 12, fontWeight: 800, color: C.ink }}>
                {String(s.name)}
              </Mono>
              <Mono style={{ display: "block", fontSize: 10, color: C.inkSoft, marginTop: 2 }}>
                {C[s.name]}
              </Mono>
              <div style={{ fontSize: 11, color: C.inkMuted, marginTop: 6, fontWeight: 500 }}>
                {s.role}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function TypographySection() {
  return (
    <Section title="Typography" num="02">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div style={{ fontSize: "clamp(44px, 5vw, 72px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.035em", color: C.ink }}>
            Display XL
          </div>
          <Mono style={{ fontSize: 11, color: C.inkSoft, marginTop: 12 }}>
            Inter · 900 · 88/0.95 · tracking -0.035em
          </Mono>
        </Card>
        <Card>
          <div style={{ fontSize: "clamp(34px, 4vw, 56px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em", color: C.ink }}>
            Display LG
          </div>
          <Mono style={{ fontSize: 11, color: C.inkSoft, marginTop: 12 }}>
            Inter · 900 · 56/1.0 · tracking -0.03em
          </Mono>
        </Card>
        <Card>
          <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", color: C.ink }}>
            Heading LG
          </div>
          <Mono style={{ fontSize: 11, color: C.inkSoft, marginTop: 12 }}>Inter · 800 · 24/1.15</Mono>
        </Card>
        <Card>
          <div style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.5, color: C.ink }}>
            Body LG — the sub-headline register. Reads at 18–19 px, weight 500, line 1.5.
            Carries tone on light backgrounds.
          </div>
          <Mono style={{ fontSize: 11, color: C.inkSoft, marginTop: 12 }}>Inter · 500 · 19/1.5</Mono>
        </Card>
        <Card>
          <Mono style={{ fontSize: 28, fontWeight: 900, color: C.ink, letterSpacing: "-0.02em" }}>
            $497.00
          </Mono>
          <Mono style={{ fontSize: 11, color: C.inkSoft, marginTop: 12, display: "block" }}>
            JetBrains Mono · tabular-nums · money / phone / time
          </Mono>
        </Card>
        <Card>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: C.gold,
              fontWeight: 800,
            }}
          >
            Meta · all caps · tracked
          </div>
          <Mono style={{ fontSize: 11, color: C.inkSoft, marginTop: 12 }}>
            Inter · 800 · 12/1.4 · tracking 0.22em
          </Mono>
        </Card>
      </div>
    </Section>
  );
}

function SpacingStrokeSection() {
  const spaces = [4, 8, 12, 16, 24, 32, 48, 64];
  const strokes = [1, 2, 4];
  return (
    <Section title="Spacing + Stroke" num="03">
      <div className="grid gap-10 lg:grid-cols-2">
        <Card>
          <Mono style={{ fontSize: 11, color: C.gold, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Spacing · 8-pt grid
          </Mono>
          <div className="mt-4 flex flex-col gap-3">
            {spaces.map((s) => (
              <div key={s} className="flex items-center gap-4">
                <Mono style={{ width: 40, fontSize: 12, color: C.inkMuted }}>{s}px</Mono>
                <div style={{ height: 12, width: s * 2, background: C.navy }} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <Mono style={{ fontSize: 11, color: C.gold, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Stroke · 1 / 2 / 4 only
          </Mono>
          <div className="mt-4 flex flex-col gap-5">
            {strokes.map((w) => (
              <div key={w} className="flex items-center gap-4">
                <Mono style={{ width: 40, fontSize: 12, color: C.inkMuted }}>{w}px</Mono>
                <div style={{ flex: 1, height: w, background: C.ink }} />
              </div>
            ))}
            <div className="flex items-center gap-4 mt-2">
              <Mono style={{ width: 40, fontSize: 12, color: C.gold, fontWeight: 800 }}>stamp</Mono>
              <div style={{ width: 56, height: 4, background: C.gold }} />
            </div>
          </div>
        </Card>
      </div>
    </Section>
  );
}

function ButtonSection() {
  return (
    <Section title="Buttons" num="04">
      <div className="flex flex-col gap-8">
        <div>
          <Mono style={{ fontSize: 11, color: C.gold, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Primary · gold · &quot;Get Capta →&quot;
          </Mono>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <PrimaryButton href="#" size="sm">Get Capta</PrimaryButton>
            <PrimaryButton href="#">Get Capta</PrimaryButton>
            <PrimaryButton href="#" size="lg">Get Capta</PrimaryButton>
          </div>
          <Snippet>{`<PrimaryButton href={setupHref} size="lg">Get Capta</PrimaryButton>`}</Snippet>
        </div>

        <div>
          <Mono style={{ fontSize: 11, color: C.gold, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Secondary · outline
          </Mono>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <SecondaryButton href="#">Get a free call audit</SecondaryButton>
            <SecondaryButton href="#" size="lg">Get a free call audit</SecondaryButton>
          </div>
          <Snippet>{`<SecondaryButton href="/audit" size="lg">Get a free call audit</SecondaryButton>`}</Snippet>
        </div>

        <div>
          <Mono style={{ fontSize: 11, color: C.gold, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Tertiary · underline link
          </Mono>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <TertiaryLink href="#">See pricing</TertiaryLink>
            <TertiaryLink href="#">Read the brand book</TertiaryLink>
          </div>
          <Snippet>{`<TertiaryLink href="/pricing">See pricing</TertiaryLink>`}</Snippet>
        </div>
      </div>
    </Section>
  );
}

function DisplaySection() {
  return (
    <Section title="Display headings" num="05">
      <div className="flex flex-col gap-10">
        <div>
          <DisplayH1>
            Never miss a call again.
          </DisplayH1>
          <Snippet>{`<DisplayH1>Never miss a call again.</DisplayH1>`}</Snippet>
        </div>
        <div>
          <DisplayH2>What $497 a month replaces.</DisplayH2>
          <Snippet>{`<DisplayH2>What $497 a month replaces.</DisplayH2>`}</Snippet>
        </div>
      </div>
    </Section>
  );
}

function StampSection() {
  return (
    <Section title="Stamp" num="06">
      <p style={{ fontSize: 15, color: C.inkMuted, maxWidth: 640, marginBottom: 24, fontWeight: 500 }}>
        The gold mark at the top-left of a card. The Catch metaphor made structural.
        Never larger than 56×4. Never a decoration — always a structural edge mark.
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { w: 40, h: 4, label: "40 × 4" },
          { w: 56, h: 4, label: "56 × 4 (default)" },
          { w: 80, h: 4, label: "80 × 4" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: C.white,
              border: `1px solid ${C.ink}`,
              padding: 24,
              position: "relative",
              minHeight: 140,
            }}
          >
            <Stamp width={s.w} height={s.h} />
            <Mono style={{ fontSize: 11, color: C.inkSoft, fontWeight: 700 }}>{s.label}</Mono>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Snippet>{`<Stamp width={56} height={4} position="top-left" />`}</Snippet>
      </div>
    </Section>
  );
}

function SerialSection() {
  return (
    <Section title="Serial" num="07">
      <p style={{ fontSize: 15, color: C.inkMuted, maxWidth: 640, marginBottom: 24, fontWeight: 500 }}>
        Mono gold ordinal. Catalog identity. Use on cards, rows, invoices, job cards.
      </p>
      <div className="flex flex-wrap items-baseline gap-8">
        <div>
          <Serial n="01" size="lg" />
          <Mono style={{ display: "block", fontSize: 10, color: C.inkSoft, marginTop: 4 }}>size=&quot;lg&quot;</Mono>
        </div>
        <div>
          <Serial n={42} size="md" />
          <Mono style={{ display: "block", fontSize: 10, color: C.inkSoft, marginTop: 4 }}>size=&quot;md&quot;</Mono>
        </div>
        <div>
          <Serial n="INV-0001" size="sm" />
          <Mono style={{ display: "block", fontSize: 10, color: C.inkSoft, marginTop: 4 }}>size=&quot;sm&quot;</Mono>
        </div>
        <div>
          <Serial n="04" size="md" tone="muted" />
          <Mono style={{ display: "block", fontSize: 10, color: C.inkSoft, marginTop: 4 }}>tone=&quot;muted&quot;</Mono>
        </div>
      </div>
      <div className="mt-6">
        <Snippet>{`<Serial n={42} size="lg" />`}</Snippet>
      </div>
    </Section>
  );
}

function SpecSheetSection() {
  return (
    <Section title="Spec sheet" num="08">
      <p style={{ fontSize: 15, color: C.inkMuted, maxWidth: 640, marginBottom: 24, fontWeight: 500 }}>
        Labeled data rows inside a ruled container. The shared atom for pricing,
        settings, summaries, invoices, job cards.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <SpecSheet>
          <SpecRow label="Plan" value="Flat" />
          <SpecRow label="Price" value="$497/mo" />
          <SpecRow label="Billing" value="Monthly · Annual" />
          <SpecRow label="Calls" value="Unlimited" />
          <SpecRow label="Languages" value="EN · ES" />
        </SpecSheet>
        <SpecSheet tone="dark">
          <SpecRow tone="dark" label="Status" value="Active" />
          <SpecRow tone="dark" label="Next bill" value="May 22, 2026" />
          <SpecRow tone="dark" label="Amount" value="$497.00" />
          <SpecRow tone="dark" label="Card" value="····4242" />
        </SpecSheet>
      </div>
      <div className="mt-6">
        <Snippet>{`<SpecSheet>
  <SpecRow label="Plan" value="Flat" />
  <SpecRow label="Price" value="$497/mo" />
</SpecSheet>`}</Snippet>
      </div>
    </Section>
  );
}

function KickerSection() {
  return (
    <Section title="Kicker + CatalogMarker" num="09">
      <div className="flex flex-col gap-8">
        <Card>
          <Kicker>Pricing</Kicker>
          <div className="mt-8">
            <CatalogMarker section="01 · Pricing" rev="2026.04" />
          </div>
        </Card>
        <Snippet>{`<Kicker>Pricing</Kicker>
<CatalogMarker section="01 · Pricing" rev="2026.04" />`}</Snippet>
      </div>
    </Section>
  );
}

function PatternsSection() {
  return (
    <Section title="Patterns" num="10">
      <p style={{ fontSize: 15, color: C.inkMuted, maxWidth: 640, marginBottom: 24, fontWeight: 500 }}>
        Primitives composed into real screens. Copy and paste.
      </p>

      <div className="flex flex-col gap-10">
        {/* Invoice row */}
        <div>
          <Mono style={{ fontSize: 11, color: C.gold, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
            Invoice row
          </Mono>
          <div style={{ border: `1px solid ${C.ink}`, background: C.white }}>
            {[
              { n: "INV-0001", customer: "Reyes HVAC", date: "Apr 22", amount: "$1,240.00", status: "Paid" },
              { n: "INV-0002", customer: "Salinas Plumbing", date: "Apr 19", amount: "$680.00", status: "Sent" },
              { n: "INV-0003", customer: "Calloway Electric", date: "Apr 18", amount: "$2,800.00", status: "Draft" },
            ].map((row, i) => (
              <div
                key={row.n}
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 1fr 100px 120px 80px",
                  gap: 16,
                  padding: "14px 18px",
                  alignItems: "center",
                  borderBottom: i < 2 ? `1px solid ${C.ruleSoft}` : "none",
                }}
              >
                <Serial n={row.n} size="sm" />
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{row.customer}</div>
                <Mono style={{ fontSize: 12, color: C.inkMuted }}>{row.date}</Mono>
                <Mono style={{ fontSize: 14, fontWeight: 800, color: C.ink, textAlign: "right" }}>{row.amount}</Mono>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: row.status === "Paid" ? C.success : row.status === "Sent" ? C.gold : C.inkSoft,
                  }}
                >
                  {row.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job card */}
        <div>
          <Mono style={{ fontSize: 11, color: C.gold, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
            Job card
          </Mono>
          <div
            style={{
              border: `1px solid ${C.ink}`,
              background: C.white,
              padding: 24,
              position: "relative",
              maxWidth: 520,
            }}
          >
            <Stamp />
            <div className="flex items-center justify-between">
              <Serial n="JC-0042" size="md" />
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.danger,
                }}
              >
                Urgent
              </div>
            </div>
            <div className="mt-4" style={{ fontSize: 18, fontWeight: 800, color: C.ink, letterSpacing: "-0.015em" }}>
              Drain clog · 4521 Oak Lane
            </div>
            <div className="mt-1" style={{ fontSize: 13, color: C.inkMuted, fontWeight: 500 }}>
              Maria López · (210) 555-0182 · Spanish
            </div>
            <div className="mt-4" style={{ borderTop: `1px solid ${C.ruleSoft}` }}>
              <SpecRow label="ETA" value="Today 2:15 PM" />
              <SpecRow label="Tech" value="Juan" />
              <SpecRow label="Scope" value="Kitchen main line" />
              <SpecRow label="Estimate" value="$280 – $420" />
            </div>
          </div>
        </div>

        {/* Call log row */}
        <div>
          <Mono style={{ fontSize: 11, color: C.gold, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
            Call log row
          </Mono>
          <div style={{ border: `1px solid ${C.ink}`, background: C.white }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "60px 100px 1fr 80px 60px 100px",
                gap: 12,
                padding: "10px 18px",
                background: C.paperDark,
                borderBottom: `1px solid ${C.ink}`,
              }}
            >
              {["№", "Time", "Caller", "Dur.", "Lang", "Status"].map((h) => (
                <div key={h} style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: C.inkMuted }}>
                  {h}
                </div>
              ))}
            </div>
            {[
              { n: 1, time: "2:04 PM", caller: "Unknown · (512) 555-0142", dur: "1:47", lang: "EN", status: "Booked" },
              { n: 2, time: "11:17 AM", caller: "Maria López", dur: "2:12", lang: "ES", status: "Booked" },
              { n: 3, time: "8:42 AM", caller: "Unknown · (830) 555-9821", dur: "0:48", lang: "EN", status: "Missed" },
            ].map((row, i) => (
              <div
                key={row.n}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 100px 1fr 80px 60px 100px",
                  gap: 12,
                  padding: "12px 18px",
                  alignItems: "center",
                  borderBottom: i < 2 ? `1px solid ${C.ruleSoft}` : "none",
                  background: i % 2 === 1 ? C.paperDark : "transparent",
                }}
              >
                <Serial n={row.n} size="sm" />
                <Mono style={{ fontSize: 12, color: C.inkMuted }}>{row.time}</Mono>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{row.caller}</div>
                <Mono style={{ fontSize: 12, color: C.inkMuted }}>{row.dur}</Mono>
                <Mono style={{ fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: "0.1em" }}>
                  {row.lang}
                </Mono>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: row.status === "Booked" ? C.success : C.danger,
                  }}
                >
                  {row.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Receipt / spec summary */}
        <div>
          <Mono style={{ fontSize: 11, color: C.gold, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
            Subscription receipt
          </Mono>
          <div style={{ maxWidth: 420 }}>
            <div
              style={{
                border: `1px solid ${C.ink}`,
                background: C.white,
                padding: "20px 24px",
                position: "relative",
              }}
            >
              <Stamp />
              <div className="flex items-baseline justify-between">
                <Serial n="SUB-2026-04" size="sm" />
                <Mono style={{ fontSize: 11, color: C.inkMuted }}>Apr 22, 2026</Mono>
              </div>
              <div className="mt-4" style={{ fontSize: 18, fontWeight: 800, color: C.ink, letterSpacing: "-0.015em" }}>
                Monthly subscription · Capta
              </div>
              <div className="mt-3" style={{ borderTop: `1px solid ${C.ruleSoft}` }}>
                <SpecRow label="Plan" value="Flat · Unlimited" />
                <SpecRow label="Billing" value="Monthly" />
                <SpecRow label="Amount" value="$497.00" />
                <SpecRow label="Card" value="···· 4242" />
                <SpecRow label="Status" value={<span style={{ color: C.success }}>Paid</span>} mono={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function BandSection() {
  return (
    <>
      <Band tone="paper">
        <div className="flex items-baseline gap-4 mb-4">
          <Serial n="10" size="lg" />
          <h2 style={{ fontSize: 26, fontWeight: 900, color: C.ink, letterSpacing: "-0.025em" }}>
            Bands
          </h2>
        </div>
        <p style={{ fontSize: 15, color: C.inkMuted, maxWidth: 640, fontWeight: 500 }}>
          Full-width tone sections. Alternate <code style={codeStyle}>light</code>, <code style={codeStyle}>paper</code>,
          and <code style={codeStyle}>dark</code> to create vertical rhythm.
        </p>
      </Band>
      <Band tone="dark">
        <Kicker tone="dark">Dark moment</Kicker>
        <h3
          className="mt-6"
          style={{
            fontSize: "clamp(28px, 3vw, 40px)",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            color: C.paper,
          }}
        >
          This is a dark band.
          <br />
          <span
            style={{
              borderBottom: `4px solid ${C.gold}`,
              paddingBottom: 4,
              display: "inline-block",
              lineHeight: 1,
            }}
          >
            Use sparingly.
          </span>
        </h3>
        <div className="mt-6">
          <Snippet>{`<Band tone="dark">
  <Kicker tone="dark">Dark moment</Kicker>
  ...
</Band>`}</Snippet>
        </div>
      </Band>
    </>
  );
}

function DoNotSection() {
  const rules: { rule: string; why: string }[] = [
    { rule: "Don't reference hex values directly", why: "Use tokens.ts. Stylelint will flag." },
    { rule: "Don't use italic display type", why: "Magazine flourish — not industrial." },
    { rule: "Don't paint full sentences gold", why: "Gold is a point accent, not a color wash." },
    { rule: "Don't round corners > 4 px", why: "Industrial bias. Sharp edges." },
    { rule: "Don't use drop shadows as structure", why: "Strokes over shadows." },
    { rule: "Don't use Action Green for decoration", why: "Success states only (Booked / Approved)." },
    { rule: "Don't ship a serif anywhere in marketing", why: "Non-negotiable per Brand Kit." },
    { rule: "Don't write \"Start Free Trial\" as CTA", why: "Always \"Get Capta →\"." },
    { rule: "Don't add gradients, glows, or shimmer", why: "Industrial not refined SaaS." },
    { rule: "Don't use inkSoft on body < 18 px", why: "Fails AA contrast." },
  ];
  return (
    <Band tone="light" size="lg">
      <div className="flex items-baseline gap-4 mb-8">
        <Serial n="11" size="lg" />
        <h2 style={{ fontSize: 26, fontWeight: 900, color: C.ink, letterSpacing: "-0.025em" }}>
          Do not
        </h2>
      </div>
      <div
        className="grid md:grid-cols-2"
        style={{ border: `1px solid ${C.ink}` }}
      >
        {rules.map((r, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const lastRow = row === Math.floor((rules.length - 1) / 2);
          return (
            <div
              key={r.rule}
              style={{
                padding: 20,
                borderRight: col === 0 ? `1px solid ${C.ink}` : "none",
                borderBottom: !lastRow ? `1px solid ${C.ink}` : "none",
                background: C.white,
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  style={{
                    color: C.danger,
                    fontWeight: 900,
                    fontSize: 18,
                    flexShrink: 0,
                    fontFamily: "var(--font-mono), ui-monospace, Menlo, monospace",
                  }}
                >
                  ✕
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, letterSpacing: "-0.005em" }}>
                    {r.rule}
                  </div>
                  <div className="mt-1" style={{ fontSize: 13, color: C.inkMuted, fontWeight: 500 }}>
                    {r.why}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Band>
  );
}
