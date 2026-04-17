"use client";

/**
 * ROI calculator — Field Manual direction.
 * Feels like a tax-refund estimator, not a marketing toy.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { PHONE, PHONE_TEL, type Lang } from "@/lib/marketing/translations";
import {
  C,
  Mono,
  Kicker,
  Rule,
  PrimaryButton,
  FieldFrame,
  FieldNav,
  FieldFooter,
  DisplayH1,
  DisplayH2,
  SkipLink,
} from "@/components/marketing/field";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS + MATH
   ═══════════════════════════════════════════════════════════════ */

const TRADES = [
  { value: "plumber", avgJob: 450 },
  { value: "hvac", avgJob: 500 },
  { value: "electrician", avgJob: 350 },
  { value: "roofer", avgJob: 800 },
  { value: "landscaper", avgJob: 250 },
  { value: "general_contractor", avgJob: 600 },
  { value: "other", avgJob: 400 },
] as const;
type TradeValue = (typeof TRADES)[number]["value"];

const COVERAGES = ["none", "voicemail", "answering_service"] as const;
type CoverageValue = (typeof COVERAGES)[number];

const WEEKS_PER_MONTH = 4.33;
const CONVERSION_RATE = 0.25;
const CAPTA_COST = 497;

/* ═══════════════════════════════════════════════════════════════
   COPY
   ═══════════════════════════════════════════════════════════════ */

type Copy = {
  hero: { kicker: string; h1a: string; h1b: string; sub: string };
  inputs: {
    kicker: string;
    h2: string;
    tradeLabel: string;
    tradeHint: string;
    trades: Record<TradeValue, string>;
    jobLabel: string;
    jobHint: string;
    missedLabel: string;
    missedHint: (n: number) => string;
    coverageLabel: string;
    coverageHint: string;
    coverages: Record<CoverageValue, string>;
    coverageNotes: Record<CoverageValue, string>;
  };
  output: {
    kicker: string;
    h2: string;
    costLabel: string;
    costNote: string;
    recoveredLabel: string;
    recoveredNote: string;
    captaLabel: string;
    captaNote: string;
    netLabel: string;
    netNote: string;
    breakEvenLabel: (n: number) => string;
    assumptionsLabel: string;
    assumptions: string[];
  };
  math: {
    kicker: string;
    h2: string;
    paragraphs: string[];
  };
  cta: { kicker: string; h2: string; sub: string; primary: string };
};

const COPY: Record<Lang, Copy> = {
  en: {
    hero: {
      kicker: "ROI calculator",
      h1a: "What every missed call",
      h1b: "actually costs you.",
      sub:
        "Move the four sliders. The ledger runs in real time. No email, no signup — this is math, not a lead magnet.",
    },
    inputs: {
      kicker: "Inputs",
      h2: "Four questions.",
      tradeLabel: "Your trade",
      tradeHint: "We'll set a realistic starting average. You can override below.",
      trades: {
        plumber: "Plumbing",
        hvac: "HVAC",
        electrician: "Electrical",
        roofer: "Roofing",
        landscaper: "Landscaping",
        general_contractor: "General contracting",
        other: "Other",
      },
      jobLabel: "Average job value",
      jobHint: "Ticket size for a booked job in your trade. Pre-tax, pre-tip.",
      missedLabel: "Missed calls per week",
      missedHint: (n) => `${Math.round(n * WEEKS_PER_MONTH)} per month at this rate`,
      coverageLabel: "Current after-hours coverage",
      coverageHint: "What happens today when the phone rings and you can't pick up.",
      coverages: {
        none: "Nothing — it just rings out",
        voicemail: "Voicemail",
        answering_service: "Answering service",
      },
      coverageNotes: {
        none: "With no after-hours coverage, roughly 100% of those callers are lost.",
        voicemail: "80% of callers never leave a voicemail. The ones who do often want an answer that night.",
        answering_service: "Answering services book ~10% of inbound calls. They take messages. They can't quote, book, or text.",
      },
    },
    output: {
      kicker: "Ledger",
      h2: "Monthly impact.",
      costLabel: "Revenue lost now",
      costNote: "From missed calls at a 25% close rate, pre-Capta.",
      recoveredLabel: "Recovered with Capta",
      recoveredNote: "Same calls, answered instead of missed.",
      captaLabel: "Capta plan",
      captaNote: "Flat. Unlimited calls. No per-minute billing.",
      netLabel: "Net, monthly",
      netNote: "After the plan. Assumes every call becomes an answered call.",
      breakEvenLabel: (n) => `Pays for itself after ${n} answered call${n === 1 ? "" : "s"} per month.`,
      assumptionsLabel: "Assumptions",
      assumptions: [
        "25% close rate on phone leads (industry median; higher for HVAC emergencies, lower for landscaping).",
        "4.33 weeks per month. Missed calls assumed evenly distributed.",
        "Capta assumed to catch 100% of missed calls — in practice Maria answers every call, so this is the ceiling, not a stretch.",
      ],
    },
    math: {
      kicker: "How we got here",
      h2: "The math behind the sliders.",
      paragraphs: [
        "Missed calls per month = weekly rate × 4.33. A contractor missing 10 calls a week is leaking 43 a month to voicemail or to competitors. The math doesn't care whether you missed them because you were on a ladder or because it was 7 PM.",
        "Revenue lost = missed calls × average job value × 25% close rate. 25% is the median for phone-only leads in home services — a homeowner who picks up a phone is warm, but not every warm lead books. Higher-urgency trades (HVAC emergencies, water damage) run closer to 40%. Lower-ticket trades (landscaping) run closer to 15%.",
        "Net with Capta = revenue recovered − $497. If Maria catches every missed call, you keep the whole recovered total minus the plan. Real-world conversion rates once calls are answered also tick up, because an answered call closes better than a returned voicemail — but we don't model that lift here. The number above is conservative on purpose.",
      ],
    },
    cta: {
      kicker: "Satisfied with the math?",
      h2: "Hire Capta.",
      sub: "14 days free. Your number stays yours. Cancel with one text.",
      primary: "Start 14-day free trial",
    },
  },
  es: {
    hero: {
      kicker: "Calculadora de ROI",
      h1a: "Lo que cada llamada perdida",
      h1b: "en realidad te cuesta.",
      sub:
        "Mueve las cuatro barras. El libro mayor corre en tiempo real. Sin correo, sin registro — esto son matemáticas, no un imán de prospectos.",
    },
    inputs: {
      kicker: "Entradas",
      h2: "Cuatro preguntas.",
      tradeLabel: "Tu oficio",
      tradeHint: "Te ponemos un promedio realista de inicio. Puedes cambiarlo abajo.",
      trades: {
        plumber: "Plomería",
        hvac: "HVAC",
        electrician: "Eléctrico",
        roofer: "Techos",
        landscaper: "Jardinería",
        general_contractor: "Contratista general",
        other: "Otro",
      },
      jobLabel: "Valor promedio del trabajo",
      jobHint: "Tamaño del ticket para un trabajo agendado en tu oficio. Antes de impuestos.",
      missedLabel: "Llamadas perdidas por semana",
      missedHint: (n) => `${Math.round(n * WEEKS_PER_MONTH)} por mes a esta tasa`,
      coverageLabel: "Cobertura fuera de horario actual",
      coverageHint: "Lo que pasa hoy cuando el teléfono suena y no puedes contestar.",
      coverages: {
        none: "Nada — solo timbra",
        voicemail: "Buzón de voz",
        answering_service: "Servicio de contestadoras",
      },
      coverageNotes: {
        none: "Sin cobertura fuera de horario, cerca del 100% de esas llamadas se pierden.",
        voicemail: "El 80% de los llamantes nunca deja mensaje. Los que lo dejan muchas veces quieren respuesta esa noche.",
        answering_service: "Los servicios de contestadoras agendan ~10% de llamadas entrantes. Toman mensajes. No cotizan, no agendan, no mandan texto.",
      },
    },
    output: {
      kicker: "Libro mayor",
      h2: "Impacto mensual.",
      costLabel: "Ingresos perdidos ahora",
      costNote: "De llamadas perdidas a una tasa de cierre del 25%, antes de Capta.",
      recoveredLabel: "Recuperado con Capta",
      recoveredNote: "Mismas llamadas, contestadas en vez de perdidas.",
      captaLabel: "Plan de Capta",
      captaNote: "Fijo. Llamadas ilimitadas. Sin cobro por minuto.",
      netLabel: "Neto, mensual",
      netNote: "Después del plan. Asume que cada llamada se contesta.",
      breakEvenLabel: (n) => `Se paga sola después de ${n} llamada${n === 1 ? "" : "s"} contestada${n === 1 ? "" : "s"} al mes.`,
      assumptionsLabel: "Supuestos",
      assumptions: [
        "Tasa de cierre del 25% en prospectos por teléfono (mediana de la industria; mayor en emergencias de HVAC, menor en jardinería).",
        "4.33 semanas por mes. Llamadas perdidas se asumen distribuidas uniformemente.",
        "Se asume que Capta captura el 100% de llamadas perdidas — en la práctica Capta contesta cada llamada, así que este es el techo, no una exageración.",
      ],
    },
    math: {
      kicker: "Cómo llegamos aquí",
      h2: "Las matemáticas detrás de las barras.",
      paragraphs: [
        "Llamadas perdidas al mes = tasa semanal × 4.33. Un contratista que pierde 10 llamadas por semana está filtrando 43 al mes al buzón o a competidores. Las matemáticas no importan si las perdiste porque estabas en una escalera o porque eran las 7 PM.",
        "Ingresos perdidos = llamadas perdidas × valor promedio del trabajo × tasa de cierre del 25%. 25% es la mediana para prospectos solo por teléfono en servicios del hogar — un propietario que levanta el teléfono está caliente, pero no cada prospecto caliente agenda. Oficios de mayor urgencia (emergencias HVAC, daño por agua) corren más cerca del 40%. Oficios de menor ticket (jardinería) más cerca del 15%.",
        "Neto con Capta = ingresos recuperados − $497. Si Capta captura cada llamada perdida, te quedas con el total recuperado menos el plan. Las tasas reales de conversión también suben cuando las llamadas se contestan, porque una llamada contestada cierra mejor que un buzón devuelto — pero no modelamos ese aumento aquí. El número de arriba es conservador a propósito.",
      ],
    },
    cta: {
      kicker: "¿Satisfecho con las matemáticas?",
      h2: "Contrata Capta.",
      sub: "14 días gratis. Tu número sigue siendo tuyo. Cancela con un mensaje.",
      primary: "Comenzar prueba gratis de 14 días",
    },
  },
};

const LANG_KEY = "capta-lang";

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function ROICalculatorPage({ initialLang }: { initialLang?: Lang } = {}) {
  const [lang, setLang] = useState<Lang>(initialLang ?? "en");

  useEffect(() => {
    if (initialLang) return;
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "es") setLang(saved);
  }, [initialLang]);

  const toggleLang = useCallback((l: Lang) => {
    setLang(l);
    if (typeof window !== "undefined") localStorage.setItem(LANG_KEY, l);
  }, []);

  const [trade, setTrade] = useState<TradeValue>("plumber");
  const [avgJob, setAvgJob] = useState(450);
  const [missedPerWeek, setMissedPerWeek] = useState(10);
  const [coverage, setCoverage] = useState<CoverageValue>("none");

  const onTradeChange = (value: TradeValue) => {
    setTrade(value);
    const found = TRADES.find((t) => t.value === value);
    if (found) setAvgJob(found.avgJob);
  };

  const t = COPY[lang];

  const calc = useMemo(() => {
    const monthlyMissed = missedPerWeek * WEEKS_PER_MONTH;
    const coverageCapture =
      coverage === "none" ? 0 : coverage === "voicemail" ? 0.02 : 0.1;
    const currentlyCaptured = monthlyMissed * coverageCapture;
    const currentlyLost = monthlyMissed - currentlyCaptured;
    const revenueLost = Math.round(currentlyLost * avgJob * CONVERSION_RATE);
    const recovered = Math.round(monthlyMissed * avgJob * CONVERSION_RATE);
    const net = recovered - CAPTA_COST;
    const breakEven = Math.max(1, Math.ceil(CAPTA_COST / avgJob));
    return { monthlyMissed, revenueLost, recovered, net, breakEven };
  }, [missedPerWeek, coverage, avgJob]);

  return (
    <FieldFrame>
      <SkipLink lang={lang} />
      <FieldNav lang={lang} toggleLang={toggleLang} phone={PHONE} phoneHref={PHONE_TEL} />

      <main id="main">
      {/* Hero */}
      <section className="mx-auto max-w-[1280px] px-6 sm:px-10 pt-14 pb-16 sm:pt-20 sm:pb-20">
        <div className="max-w-3xl">
          <Kicker>{t.hero.kicker}</Kicker>
          <DisplayH1 style={{ marginTop: 28 }}>
            {t.hero.h1a}
            <br />
            <em style={{ fontStyle: "italic", fontVariationSettings: '"SOFT" 100, "WONK" 1', color: C.amberInk }}>
              {t.hero.h1b}
            </em>
          </DisplayH1>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: C.inkMuted, marginTop: 28, maxWidth: 620 }}>
            {t.hero.sub}
          </p>
        </div>
      </section>

      <Rule />

      {/* Calculator */}
      <section className="mx-auto max-w-[1280px] px-6 sm:px-10 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Inputs */}
          <div className="lg:col-span-5">
            <Kicker>{t.inputs.kicker}</Kicker>
            <DisplayH2 style={{ marginTop: 20, fontSize: "clamp(28px, 3vw, 40px)" }}>
              {t.inputs.h2}
            </DisplayH2>

            <div className="mt-10 flex flex-col gap-8">
              {/* Trade */}
              <FieldInput label={t.inputs.tradeLabel} hint={t.inputs.tradeHint}>
                <select
                  value={trade}
                  onChange={(e) => onTradeChange(e.target.value as TradeValue)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: C.paper,
                    border: `1px solid ${C.rule}`,
                    color: C.ink,
                    fontSize: 15,
                    fontWeight: 500,
                    outline: "none",
                    borderRadius: 2,
                  }}
                >
                  {TRADES.map((tr) => (
                    <option key={tr.value} value={tr.value}>
                      {t.inputs.trades[tr.value]}
                    </option>
                  ))}
                </select>
              </FieldInput>

              {/* Avg job */}
              <FieldInput
                label={t.inputs.jobLabel}
                hint={t.inputs.jobHint}
                value={
                  <Mono style={{ fontSize: 28, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}>
                    ${avgJob}
                  </Mono>
                }
              >
                <FieldSlider min={100} max={2000} step={25} value={avgJob} onChange={setAvgJob} />
              </FieldInput>

              {/* Missed */}
              <FieldInput
                label={t.inputs.missedLabel}
                hint={t.inputs.missedHint(missedPerWeek)}
                value={
                  <Mono style={{ fontSize: 28, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}>
                    {missedPerWeek}
                  </Mono>
                }
              >
                <FieldSlider min={1} max={50} step={1} value={missedPerWeek} onChange={setMissedPerWeek} />
              </FieldInput>

              {/* Coverage */}
              <FieldInput label={t.inputs.coverageLabel} hint={t.inputs.coverageHint}>
                <div className="flex flex-col gap-2">
                  {COVERAGES.map((c) => {
                    const isActive = coverage === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCoverage(c)}
                        style={{
                          padding: "12px 14px",
                          background: isActive ? C.ink : C.paper,
                          color: isActive ? C.paper : C.ink,
                          border: `1px solid ${isActive ? C.ink : C.rule}`,
                          fontSize: 14,
                          fontWeight: 500,
                          textAlign: "left",
                          borderRadius: 2,
                          cursor: "pointer",
                          transition: "all 150ms",
                        }}
                      >
                        {t.inputs.coverages[c]}
                      </button>
                    );
                  })}
                  <p style={{ fontSize: 12, color: C.inkMuted, marginTop: 4, lineHeight: 1.55, fontStyle: "italic", fontFamily: "var(--font-fraunces), Georgia, serif" }}>
                    {t.inputs.coverageNotes[coverage]}
                  </p>
                </div>
              </FieldInput>
            </div>
          </div>

          {/* Output — the ledger */}
          <div className="lg:col-span-7">
            <Kicker>{t.output.kicker}</Kicker>
            <DisplayH2 style={{ marginTop: 20, fontSize: "clamp(28px, 3vw, 40px)" }}>
              {t.output.h2}
            </DisplayH2>

            <div style={{ marginTop: 32, border: `1px solid ${C.ink}`, background: C.paper }}>
              <div style={{ padding: "18px 28px", background: C.ink, color: C.paper, display: "flex", justifyContent: "space-between", fontSize: 11, letterSpacing: "0.22em", fontWeight: 700, textTransform: "uppercase" }}>
                <span>Ledger · Monthly · USD</span>
                <Mono style={{ letterSpacing: "0.16em" }}>Q1 · 2026</Mono>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                <tbody>
                  <LedgerRow label={t.output.costLabel} note={t.output.costNote} amount={`-$${calc.revenueLost.toLocaleString()}`} tone="bad" />
                  <LedgerRow label={t.output.recoveredLabel} note={t.output.recoveredNote} amount={`+$${calc.recovered.toLocaleString()}`} tone="good" />
                  <LedgerRow label={t.output.captaLabel} note={t.output.captaNote} amount={`-$${CAPTA_COST}`} tone="neutral" />
                  <tr style={{ background: C.paperDark }}>
                    <td style={{ padding: "24px 28px", verticalAlign: "top" }}>
                      <div style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: C.inkMuted, fontWeight: 700 }}>
                        {t.output.netLabel}
                      </div>
                      <div style={{ fontSize: 13, color: C.inkMuted, marginTop: 4, lineHeight: 1.5 }}>{t.output.netNote}</div>
                    </td>
                    <td style={{ padding: "24px 28px", verticalAlign: "top", textAlign: "right" }}>
                      <Mono
                        style={{
                          fontSize: 36,
                          fontWeight: 800,
                          color: calc.net >= 0 ? C.forest : C.ink,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {calc.net >= 0 ? "+" : ""}${Math.abs(calc.net).toLocaleString()}
                      </Mono>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div
                style={{
                  padding: "14px 28px",
                  borderTop: `1px solid ${C.rule}`,
                  background: C.paper,
                  fontSize: 13,
                  fontStyle: "italic",
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                  color: C.inkMuted,
                  textAlign: "center",
                }}
              >
                {t.output.breakEvenLabel(calc.breakEven)}
              </div>
            </div>

            <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.rule}` }}>
              <div style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: C.inkSoft, fontWeight: 700, marginBottom: 10 }}>
                {t.output.assumptionsLabel}
              </div>
              <ol style={{ fontSize: 12, color: C.inkMuted, lineHeight: 1.55, listStyle: "none", padding: 0 }}>
                {t.output.assumptions.map((a, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, marginTop: 6 }}>
                    <Mono style={{ color: C.amberInk, fontWeight: 700, flexShrink: 0, width: 24 }}>[{i + 1}]</Mono>
                    <span>{a}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <Rule />

      {/* Math */}
      <section style={{ background: C.paperDark }} className="py-24 sm:py-32">
        <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
          <div className="grid gap-16 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Kicker>{t.math.kicker}</Kicker>
              <DisplayH2 style={{ marginTop: 20 }}>{t.math.h2}</DisplayH2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              {t.math.paragraphs.map((p, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 17,
                    lineHeight: 1.75,
                    color: C.ink,
                    marginBottom: 22,
                  }}
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Rule />

      {/* CTA */}
      <section style={{ background: C.ink, color: C.paper, borderTop: `3px solid ${C.amber}` }} className="py-24 sm:py-32">
        <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
          <div className="grid gap-16 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <Kicker tone="dark">{t.cta.kicker}</Kicker>
              <DisplayH2 tone="dark" style={{ marginTop: 20 }}>
                {t.cta.h2}
              </DisplayH2>
              <p style={{ fontSize: 18, lineHeight: 1.55, color: "rgba(248,245,238,0.7)", marginTop: 24, maxWidth: 520 }}>
                {t.cta.sub}
              </p>
            </div>
            <div className="lg:col-span-4">
              <PrimaryButton href={lang === "es" ? "/es/setup" : "/setup"} size="lg">
                {t.cta.primary}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </section>

      </main>

      <FieldFooter lang={lang} phone={PHONE} phoneHref={PHONE_TEL} />
    </FieldFrame>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FORM PRIMITIVES
   ═══════════════════════════════════════════════════════════════ */

function FieldInput({
  label,
  hint,
  value,
  children,
}: {
  label: string;
  hint: string;
  value?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: `1px solid ${C.rule}`, paddingBottom: 20 }}>
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <label style={{ fontSize: 12, letterSpacing: "0.18em", color: C.inkMuted, fontWeight: 700, textTransform: "uppercase" }}>
          {label}
        </label>
        {value}
      </div>
      {children}
      <p style={{ fontSize: 12, color: C.inkMuted, marginTop: 8, lineHeight: 1.55 }}>{hint}</p>
    </div>
  );
}

function FieldSlider({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{
        width: "100%",
        height: 6,
        appearance: "none",
        WebkitAppearance: "none",
        background: `linear-gradient(to right, ${C.ink} 0%, ${C.ink} ${pct}%, ${C.rule} ${pct}%, ${C.rule} 100%)`,
        outline: "none",
        borderRadius: 3,
        cursor: "pointer",
      }}
      className="field-slider"
    />
  );
}

function LedgerRow({
  label,
  note,
  amount,
  tone,
}: {
  label: string;
  note: string;
  amount: string;
  tone: "good" | "bad" | "neutral";
}) {
  const color = tone === "good" ? C.forest : tone === "bad" ? C.ink : C.ink;
  return (
    <tr style={{ borderBottom: `1px solid ${C.rule}` }}>
      <td style={{ padding: "18px 28px", verticalAlign: "top" }}>
        <div style={{ fontWeight: 600, color: C.ink }}>{label}</div>
        <div style={{ fontSize: 13, color: C.inkMuted, marginTop: 4, lineHeight: 1.5 }}>{note}</div>
      </td>
      <td style={{ padding: "18px 28px", verticalAlign: "top", textAlign: "right" }}>
        <Mono style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{amount}</Mono>
      </td>
    </tr>
  );
}
