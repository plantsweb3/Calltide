"use client";

/**
 * Pricing page — Field Manual direction.
 * One rate, one plan, full bilingual.
 */

import { useState, useEffect, useCallback } from "react";
import { PHONE, PHONE_TEL, type Lang } from "@/lib/marketing/translations";
import {
  C,
  Mono,
  Kicker,
  Rule,
  PrimaryButton,
  SecondaryButton,
  FieldFrame,
  FieldNav,
  FieldFooter,
  DisplayH1,
  DisplayH2,
  SkipLink,
} from "@/components/marketing/field";

/* ═══════════════════════════════════════════════════════════════
   COPY
   ═══════════════════════════════════════════════════════════════ */

type FaqItem = { q: string; a: string };
type Plan = { billing: "monthly" | "annual"; price: string; period: string; note: string };

type Copy = {
  hero: { kicker: string; h1a: string; h1b: string; sub: string };
  card: {
    perLocation: string;
    monthlyTab: string;
    annualTab: string;
    plans: Plan[];
    included: string;
    items: string[];
    guarantee: string;
    primaryCta: string;
    callNow: string;
  };
  compare: {
    kicker: string;
    h2: string;
    sub: string;
    optionHeader: string;
    perMonth: string;
    columns: { label: string; cost: string; footnote: string; highlight?: boolean }[];
    rows: { label: string; values: (boolean | string)[] }[];
    footnoteLabel: string;
  };
  math: {
    kicker: string;
    h2: string;
    sub: string;
    rows: { label: string; amount: string; note: string }[];
    totalLabel: string;
    total: string;
    totalNote: string;
  };
  faq: { kicker: string; h2: string; items: FaqItem[] };
  cta: { kicker: string; h2: string; sub: string; primary: string; secondary: string };
};

const COPY: Record<Lang, Copy> = {
  en: {
    hero: {
      kicker: "Pricing",
      h1a: "One rate.",
      h1b: "One plan. One receptionist.",
      sub: "Unlimited calls, unlimited SMS, unlimited tools. We don't meter. We don't upsell. The only choice is annual or monthly.",
    },
    card: {
      perLocation: "Per location · Unlimited calls",
      monthlyTab: "Monthly",
      annualTab: "Annual · save $1,200",
      plans: [
        { billing: "monthly", price: "$497", period: "/ month", note: "Paid monthly. No setup fee." },
        { billing: "annual", price: "$397", period: "/ month", note: "Billed $4,764 annually · save $1,200" },
      ],
      included: "Included in every plan",
      items: [
        "24 / 7 bilingual AI receptionist on your number",
        "Unlimited calls, unlimited SMS — no per-minute billing",
        "SMS job cards the instant a call converts",
        "Estimates, intake, booking, rescheduling, cancellations",
        "Missed-call recovery within 60 seconds",
        "Text-to-dispatch, text-to-invoice, text-to-report",
        "Morning briefing + weekly digest + monthly summary",
        "Google Calendar, Stripe, and Twilio already wired in",
        "Customer CRM, lead scoring, and a referral program",
      ],
      guarantee:
        "14 days free. Cancel with a single text. You walk away owing nothing. Keep going only if it's earning its keep.",
      primaryCta: "Start 14-day free trial",
      callNow: "Call the line",
    },
    compare: {
      kicker: "The math",
      h2: "What $497 a month replaces.",
      sub: "The other options aren't bad. They're just more expensive, partial, or both.",
      optionHeader: "Option",
      perMonth: "/ month",
      columns: [
        { label: "Bilingual receptionist", cost: "$3,600", footnote: "Estimated fully-loaded monthly cost of a full-time bilingual receptionist in Texas, based on typical wage + benefits. Your market may vary." },
        { label: "Answering service", cost: "~$900", footnote: "Typical per-minute billing at ~300 minutes/month with a mid-tier provider. Does not book appointments or send estimates." },
        { label: "Voicemail", cost: "$0", footnote: "Free to run. Industry consensus is that most callers do not leave voicemails and call a competitor instead." },
        { label: "Capta", cost: "$497", footnote: "Flat. Unlimited calls. One plan.", highlight: true },
      ],
      rows: [
        { label: "Answers 24 / 7", values: [false, true, false, true] },
        { label: "Bilingual EN / ES", values: ["costly", "rare", false, true] },
        { label: "Books appointments", values: ["sometimes", false, false, true] },
        { label: "Generates estimates", values: [false, false, false, true] },
        { label: "Texts you job cards", values: [false, false, false, true] },
        { label: "Recovers missed callers", values: [false, false, false, true] },
        { label: "Runs dispatch from a text", values: [false, false, false, true] },
        { label: "Never sick, never quits", values: [false, "sort of", "—", true] },
      ],
      footnoteLabel: "Notes",
    },
    math: {
      kicker: "Example math",
      h2: "One year on Capta — an illustration.",
      sub: "An illustrative example for a single-truck shop, not a guarantee. Every number below is a scenario input, not a promise. Your actual results depend on your trade, ticket size, and call volume.",
      rows: [
        { label: "Annual plan", amount: "-$4,764", note: "Billed once. Unlimited calls." },
        { label: "Missed calls recovered", amount: "+$48,200", note: "Scenario: 3 missed calls/week × $309 avg. job × 52 weeks × 100% answer rate. Actual recovery rate varies." },
        { label: "Spanish jobs won", amount: "+$9,200", note: "Scenario: 22% lift on bilingual callers who would otherwise hang up. Depends on your customer base." },
        { label: "Receptionist wages avoided", amount: "+$33,300", note: "Only counts if you were planning to hire one. If not, treat as zero." },
      ],
      totalLabel: "Scenario net",
      total: "+$52,636",
      totalNote:
        "Illustrative only. Real numbers depend on your trade, ticket size, and how often your phone rings after 5 PM. Our ROI calculator runs your actual inputs.",
    },
    faq: {
      kicker: "Questions",
      h2: "What contractors ask.",
      items: [
        {
          q: "Is the 14-day trial actually free?",
          a: "Yes. Card on file, but no charge for 14 days. Cancel by texting the word cancel to the number we give you. You keep any leads booked during the trial.",
        },
        {
          q: "Do I have to port my number?",
          a: "No. You forward your existing number to the Twilio line we provision for you. Takes about two minutes with your carrier. You keep your number.",
        },
        {
          q: "What if Capta books a job I can't do?",
          a: "We train Capta on your services, hours, and service area during setup. If a call falls outside, Capta takes a message and escalates to you. You can edit the rules by texting the line.",
        },
        {
          q: "How does Capta answer Spanish calls?",
          a: "Capta detects the caller's language within the first word and switches. Same phone number. No separate line.",
        },
        {
          q: "Is there a per-minute charge?",
          a: "No. $497 a month covers unlimited calls, unlimited SMS, and unlimited tool use. We absorb the carrier costs. The only upgrade is annual.",
        },
        {
          q: "What about my CRM?",
          a: "Capta has a CRM built in — customers, leads, history, revenue, lifetime value — all captured as calls happen. If you already use a CRM, CSV export is available today; direct integrations are on the roadmap.",
        },
      ],
    },
    cta: {
      kicker: "Or just call the line.",
      h2: "Capta is answering right now.",
      sub: "You'll know inside a minute whether this is worth $497 a month.",
      primary: "Start 14-day free trial",
      secondary: "Read the platform overview",
    },
  },
  es: {
    hero: {
      kicker: "Precios",
      h1a: "Una tarifa.",
      h1b: "Un plan. Una recepcionista.",
      sub: "Llamadas ilimitadas, SMS ilimitados, herramientas ilimitadas. No cobramos por uso. No vendemos extras. La única opción es anual o mensual.",
    },
    card: {
      perLocation: "Por ubicación · Llamadas ilimitadas",
      monthlyTab: "Mensual",
      annualTab: "Anual · ahorra $1,200",
      plans: [
        { billing: "monthly", price: "$497", period: "/ mes", note: "Pago mensual. Sin cargo de instalación." },
        { billing: "annual", price: "$397", period: "/ mes", note: "Facturado $4,764 al año · ahorra $1,200" },
      ],
      included: "Incluido en todos los planes",
      items: [
        "Recepcionista IA bilingüe 24/7 en tu número",
        "Llamadas y SMS ilimitados — sin cobro por minuto",
        "Tarjetas SMS el instante que una llamada convierte",
        "Estimados, admisión, citas, reprogramaciones, cancelaciones",
        "Recuperación de llamada perdida en menos de 60 segundos",
        "Texto para despachar, facturar, y reportar",
        "Resumen matutino, digest semanal, resumen mensual",
        "Google Calendar, Stripe, y Twilio ya conectados",
        "CRM de clientes, puntaje de prospectos, y programa de referidos",
      ],
      guarantee:
        "14 días gratis. Cancela con un solo mensaje. Te vas sin deberle nada. Sigue solo si está generando su pago.",
      primaryCta: "Comenzar prueba gratis de 14 días",
      callNow: "Llama a la línea",
    },
    compare: {
      kicker: "Las cuentas",
      h2: "Lo que reemplazan $497 al mes.",
      sub: "Las otras opciones no son malas. Solo son caras, parciales, o ambas.",
      optionHeader: "Opción",
      perMonth: "/ mes",
      columns: [
        { label: "Recepcionista bilingüe", cost: "$3,600", footnote: "Estimado mensual con carga total de una recepcionista bilingüe a tiempo completo en Texas, basado en sueldo típico + beneficios. Tu mercado puede variar." },
        { label: "Servicio de contestadoras", cost: "~$900", footnote: "Cobro típico por minuto a ~300 min/mes con un proveedor medio. No agenda citas ni envía estimados." },
        { label: "Buzón de voz", cost: "$0", footnote: "Gratis de operar. El consenso de la industria es que la mayoría no deja mensaje y llama a un competidor." },
        { label: "Capta", cost: "$497", footnote: "Fijo. Llamadas ilimitadas. Un plan.", highlight: true },
      ],
      rows: [
        { label: "Contesta 24 / 7", values: [false, true, false, true] },
        { label: "Bilingüe EN / ES", values: ["caro", "raro", false, true] },
        { label: "Agenda citas", values: ["a veces", false, false, true] },
        { label: "Genera estimados", values: [false, false, false, true] },
        { label: "Envía tarjetas de trabajo", values: [false, false, false, true] },
        { label: "Recupera llamadas perdidas", values: [false, false, false, true] },
        { label: "Despacha desde un texto", values: [false, false, false, true] },
        { label: "Nunca se enferma, nunca renuncia", values: [false, "parcial", "—", true] },
      ],
      footnoteLabel: "Notas",
    },
    math: {
      kicker: "Ejemplo de cuentas",
      h2: "Un año en Capta — una ilustración.",
      sub: "Un ejemplo ilustrativo para un taller de un solo camión, no una garantía. Cada número abajo es un supuesto de escenario, no una promesa. Tus resultados reales dependen de tu oficio, tamaño del ticket, y volumen de llamadas.",
      rows: [
        { label: "Plan anual", amount: "-$4,764", note: "Cobrado una vez. Llamadas ilimitadas." },
        { label: "Llamadas perdidas recuperadas", amount: "+$48,200", note: "Escenario: 3 llamadas perdidas/sem × $309 por trabajo × 52 sem × 100% de respuesta. La tasa real de recuperación varía." },
        { label: "Trabajos ganados en español", amount: "+$9,200", note: "Escenario: 22% más de clientes bilingües que habrían colgado. Depende de tu base de clientes." },
        { label: "Sueldo de recepcionista evitado", amount: "+$33,300", note: "Solo cuenta si pensabas contratar una. Si no, trátalo como cero." },
      ],
      totalLabel: "Neto del escenario",
      total: "+$52,636",
      totalNote:
        "Solo ilustrativo. Los números reales dependen de tu oficio, tamaño del trabajo, y con qué frecuencia suena tu teléfono después de las 5 PM. Nuestra calculadora de ROI corre tus entradas reales.",
    },
    faq: {
      kicker: "Preguntas",
      h2: "Lo que preguntan los contratistas.",
      items: [
        {
          q: "¿La prueba de 14 días es de verdad gratis?",
          a: "Sí. Tarjeta registrada, pero sin cargo por 14 días. Cancela escribiendo la palabra cancelar al número que te damos. Te quedas con cualquier prospecto agendado durante la prueba.",
        },
        {
          q: "¿Tengo que portar mi número?",
          a: "No. Desvías tu número actual al número de Twilio que te damos. Toma como dos minutos con tu operador. Te quedas con tu número.",
        },
        {
          q: "¿Qué pasa si agenda un trabajo que no puedo hacer?",
          a: "La entrenamos con tus servicios, horas, y área de servicio durante la instalación. Si una llamada cae fuera, toma un mensaje y escala a ti. Puedes editar las reglas escribiéndole.",
        },
        {
          q: "¿Cómo contesta en español?",
          a: "Detecta el idioma del llamante en la primera palabra y cambia. Mismo número de teléfono. Sin línea separada.",
        },
        {
          q: "¿Hay cargo por minuto?",
          a: "No. $497 al mes cubre llamadas, SMS, y uso de herramientas ilimitados. Absorbemos el costo del operador. La única mejora es anual.",
        },
        {
          q: "¿Qué hay de mi CRM?",
          a: "Capta tiene un CRM incorporado — clientes, prospectos, historial, ingresos, valor de vida — todo se captura mientras pasan las llamadas. Si ya usas un CRM, la exportación a CSV está disponible hoy; integraciones directas están en el roadmap.",
        },
      ],
    },
    cta: {
      kicker: "O simplemente llama a la línea.",
      h2: "Capta está contestando ahora mismo.",
      sub: "Vas a saber en menos de un minuto si vale $497 al mes.",
      primary: "Comenzar prueba gratis de 14 días",
      secondary: "Leer la descripción de la plataforma",
    },
  },
};

const LANG_KEY = "capta-lang";

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function PricingClient({ initialLang }: { initialLang?: Lang } = {}) {
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

  const t = COPY[lang];

  return (
    <FieldFrame>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Capta — Bilingual AI Receptionist",
            description:
              "Bilingual AI receptionist for home service businesses. Answers calls 24/7 in English and Spanish. $497/month flat.",
            offers: {
              "@type": "AggregateOffer",
              lowPrice: "397",
              highPrice: "497",
              priceCurrency: "USD",
              offerCount: 2,
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: t.faq.items.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />
      <SkipLink lang={lang} />
      <FieldNav lang={lang} toggleLang={toggleLang} phone={PHONE} phoneHref={PHONE_TEL} />

      <main id="main">
        <Hero t={t} />
        <PricingCard t={t} />
        <Rule />
        <CompareTable t={t} />
        <Rule />
        <Ledger t={t} />
        <Rule />
        <Faq t={t} />
        <Rule />
        <FinalCta t={t} lang={lang} />
      </main>

      <FieldFooter lang={lang} phone={PHONE} phoneHref={PHONE_TEL} />
    </FieldFrame>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTIONS
   ═══════════════════════════════════════════════════════════════ */

function Hero({ t }: { t: Copy }) {
  return (
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
  );
}

function PricingCard({ t }: { t: Copy }) {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const active = t.card.plans.find((p) => p.billing === billing) ?? t.card.plans[0];

  return (
    <section className="mx-auto max-w-[1280px] px-6 sm:px-10 py-20 sm:py-24">
      <div className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div style={{ padding: "18px 20px", background: C.paperDark, borderLeft: `3px solid ${C.amber}` }}>
            <p style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 17, lineHeight: 1.5, fontStyle: "italic", color: C.ink }}>
              {t.card.guarantee}
            </p>
          </div>
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.rule}` }}>
            <div style={{ fontSize: 11, letterSpacing: "0.22em", color: C.inkMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 14 }}>
              {t.card.included}
            </div>
            <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {t.card.items.map((item, i) => (
                <li key={i} style={{ display: "flex", gap: 12, fontSize: 14, lineHeight: 1.5, color: C.ink }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.forest} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 5, flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ fontWeight: 500 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div style={{ border: `1px solid ${C.ink}`, background: C.paper }}>
            <div role="tablist" aria-label="Billing" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid ${C.ink}` }}>
              {t.card.plans.map((plan) => (
                <button
                  key={plan.billing}
                  role="tab"
                  aria-selected={billing === plan.billing}
                  onClick={() => setBilling(plan.billing)}
                  style={{
                    padding: "14px 20px",
                    background: billing === plan.billing ? C.ink : "transparent",
                    color: billing === plan.billing ? C.paper : C.inkMuted,
                    fontSize: 12,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    borderRight: plan.billing === "monthly" ? `1px solid ${C.ink}` : "none",
                    cursor: "pointer",
                  }}
                >
                  {plan.billing === "monthly" ? t.card.monthlyTab : t.card.annualTab}
                </button>
              ))}
            </div>

            <div style={{ padding: "56px 44px 40px", textAlign: "center" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.22em", color: C.inkMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 18 }}>
                {t.card.perLocation}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6 }}>
                <Mono style={{ fontSize: "clamp(72px, 10vw, 128px)", fontWeight: 700, color: C.ink, letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {active.price}
                </Mono>
                <span style={{ fontSize: 20, color: C.inkMuted, fontWeight: 500, marginLeft: 6 }}>{active.period}</span>
              </div>
              <div style={{ fontSize: 13, color: C.inkMuted, marginTop: 14, fontWeight: 500 }}>{active.note}</div>

              <div style={{ marginTop: 36, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                <PrimaryButton href="/setup" size="lg">
                  {t.card.primaryCta}
                </PrimaryButton>
                <SecondaryButton href={PHONE_TEL}>
                  {t.card.callNow} · {PHONE}
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CompareTable({ t }: { t: Copy }) {
  const columns = t.compare.columns;

  const renderCell = (value: boolean | string) => {
    if (value === true) {
      return (
        <span style={{ width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", color: C.forest }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      );
    }
    if (value === false) {
      return (
        <span style={{ width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", color: C.inkSoft }}>
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      );
    }
    return (
      <span style={{ fontSize: 12, color: C.inkMuted, fontStyle: "italic", fontFamily: "var(--font-fraunces), Georgia, serif", fontWeight: 400 }}>
        {value}
      </span>
    );
  };

  return (
    <section className="mx-auto max-w-[1280px] px-6 sm:px-10 py-20 sm:py-24">
      <div className="max-w-2xl">
        <Kicker>{t.compare.kicker}</Kicker>
        <DisplayH2 style={{ marginTop: 20 }}>{t.compare.h2}</DisplayH2>
        <p style={{ fontSize: 17, lineHeight: 1.55, color: C.inkMuted, marginTop: 20 }}>{t.compare.sub}</p>
      </div>

      {/* Desktop table */}
      <div className="mt-12 hidden overflow-x-auto md:block">
        <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse", fontSize: 14, color: C.ink }}>
          <thead>
            <tr>
              <th style={{ padding: "20px 18px", textAlign: "left", verticalAlign: "bottom", borderBottom: `2px solid ${C.ink}`, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: C.inkMuted, width: "28%" }}>
                {t.compare.optionHeader}
              </th>
              {columns.map((col, i) => (
                <th
                  key={i}
                  style={{
                    padding: "20px 18px",
                    textAlign: "center",
                    verticalAlign: "bottom",
                    borderBottom: `2px solid ${col.highlight ? C.amber : C.ink}`,
                    background: col.highlight ? C.paperDark : "transparent",
                    borderLeft: `1px solid ${C.rule}`,
                    width: `${(72 / columns.length).toFixed(2)}%`,
                  }}
                >
                  <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: col.highlight ? C.amberInk : C.inkMuted, marginBottom: 6 }}>
                    {col.label}
                  </div>
                  <Mono style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: "-0.015em" }} as="div">
                    {col.cost}
                  </Mono>
                  <div style={{ fontSize: 10, color: C.inkSoft, fontWeight: 500, marginTop: 2 }}>{t.compare.perMonth}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.compare.rows.map((row, rowIdx) => (
              <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? "transparent" : C.paperDark }}>
                <th scope="row" style={{ padding: "16px 18px", textAlign: "left", fontSize: 14, fontWeight: 500, color: C.ink, borderBottom: `1px solid ${C.rule}`, verticalAlign: "middle" }}>
                  {row.label}
                </th>
                {row.values.map((val, colIdx) => {
                  const col = columns[colIdx];
                  return (
                    <td key={colIdx} style={{ padding: "16px 18px", textAlign: "center", borderBottom: `1px solid ${C.rule}`, borderLeft: `1px solid ${C.rule}`, background: col.highlight ? C.paperDark : "transparent", verticalAlign: "middle" }}>
                      {renderCell(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="mt-12 flex flex-col gap-5 md:hidden">
        {columns.map((col, i) => (
          <div
            key={i}
            style={{
              border: `1px solid ${col.highlight ? C.amber : C.rule}`,
              background: col.highlight ? C.paperDark : C.paper,
              padding: "20px 22px",
              borderRadius: 2,
              borderTop: col.highlight ? `3px solid ${C.amber}` : `1px solid ${C.rule}`,
            }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: col.highlight ? C.amberInk : C.inkMuted }}>
                {col.label}
              </div>
              <div>
                <Mono style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: "-0.015em" }}>{col.cost}</Mono>
                <span style={{ fontSize: 11, color: C.inkSoft, marginLeft: 4 }}>{t.compare.perMonth}</span>
              </div>
            </div>
            <ul style={{ marginTop: 14, borderTop: `1px solid ${C.rule}` }}>
              {t.compare.rows.map((row, rowIdx) => {
                const val = row.values[i];
                return (
                  <li
                    key={rowIdx}
                    style={{
                      padding: "10px 0",
                      borderBottom: `1px solid ${C.rule}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: C.ink, fontWeight: 500 }}>{row.label}</span>
                    <span>{renderCell(val)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <ol style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.rule}`, fontSize: 12, color: C.inkMuted, lineHeight: 1.55, listStyle: "none", padding: 0 }}>
        <li style={{ marginBottom: 12, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: C.inkSoft, fontWeight: 700 }}>
          {t.compare.footnoteLabel}
        </li>
        {columns.map((col, i) => (
          <li key={i} style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Mono style={{ color: C.amberInk, fontWeight: 700, flexShrink: 0, width: 24 }}>[{i + 1}]</Mono>
            <span>
              <strong style={{ fontWeight: 600, color: C.ink }}>{col.label}.</strong> {col.footnote}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Ledger({ t }: { t: Copy }) {
  return (
    <section style={{ background: C.paperDark }} className="py-24 sm:py-32">
      <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Kicker>{t.math.kicker}</Kicker>
            <DisplayH2 style={{ marginTop: 20 }}>{t.math.h2}</DisplayH2>
            <p style={{ fontSize: 17, lineHeight: 1.55, color: C.inkMuted, marginTop: 20, maxWidth: 420 }}>
              {t.math.sub}
            </p>
          </div>

          <div className="lg:col-span-7">
            <div style={{ border: `1px solid ${C.ink}`, background: C.paper }}>
              <div style={{ padding: "20px 28px", background: C.ink, color: C.paper, display: "flex", justifyContent: "space-between", fontSize: 11, letterSpacing: "0.22em", fontWeight: 700, textTransform: "uppercase" }}>
                <span>Ledger · Annual</span>
                <span>USD</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                <tbody>
                  {t.math.rows.map((row, i) => {
                    const positive = row.amount.startsWith("+");
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.rule}` }}>
                        <td style={{ padding: "18px 28px", verticalAlign: "top" }}>
                          <div style={{ fontWeight: 600, color: C.ink }}>{row.label}</div>
                          <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 4, lineHeight: 1.5 }}>{row.note}</div>
                        </td>
                        <td style={{ padding: "18px 28px", verticalAlign: "top", textAlign: "right" }}>
                          <Mono style={{ fontSize: 18, fontWeight: 700, color: positive ? C.forest : C.ink, letterSpacing: "-0.01em" }}>
                            {row.amount}
                          </Mono>
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: C.paperDark }}>
                    <td style={{ padding: "22px 28px", verticalAlign: "top" }}>
                      <div style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: C.inkMuted, fontWeight: 700 }}>
                        {t.math.totalLabel}
                      </div>
                    </td>
                    <td style={{ padding: "22px 28px", verticalAlign: "top", textAlign: "right" }}>
                      <Mono style={{ fontSize: 28, fontWeight: 800, color: C.forest, letterSpacing: "-0.02em" }}>
                        {t.math.total}
                      </Mono>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 12, color: C.inkMuted, marginTop: 16, lineHeight: 1.55, fontStyle: "italic", fontFamily: "var(--font-fraunces), Georgia, serif" }}>
              {t.math.totalNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Faq({ t }: { t: Copy }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-[1280px] px-6 sm:px-10 py-24 sm:py-32">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Kicker>{t.faq.kicker}</Kicker>
          <DisplayH2 style={{ marginTop: 20 }}>{t.faq.h2}</DisplayH2>
        </div>
        <div className="lg:col-span-8">
          <ul style={{ borderTop: `1px solid ${C.rule}` }}>
            {t.faq.items.map((item, i) => {
              const isOpen = open === i;
              return (
                <li key={i} style={{ borderBottom: `1px solid ${C.rule}` }}>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    style={{
                      width: "100%",
                      padding: "22px 0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 20,
                      background: "transparent",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 20, fontWeight: 500, color: C.ink, letterSpacing: "-0.01em" }}>
                      {item.q}
                    </span>
                    <span
                      aria-hidden
                      style={{
                        fontSize: 22,
                        color: C.inkMuted,
                        transition: "transform 150ms ease",
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        flexShrink: 0,
                      }}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ paddingBottom: 22, fontSize: 15, color: C.inkMuted, lineHeight: 1.6, maxWidth: 640 }}>
                      {item.a}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function FinalCta({ t, lang }: { t: Copy; lang: Lang }) {
  return (
    <section style={{ background: C.ink, color: C.paper, borderTop: `3px solid ${C.amber}` }} className="py-24 sm:py-32">
      <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Kicker tone="dark">{t.cta.kicker}</Kicker>
            <DisplayH2 tone="dark" style={{ marginTop: 20, maxWidth: 720 }}>
              {t.cta.h2}
            </DisplayH2>
            <p style={{ fontSize: 18, lineHeight: 1.55, color: "rgba(248,245,238,0.7)", marginTop: 24, maxWidth: 520 }}>
              {t.cta.sub}
            </p>
          </div>
          <div className="lg:col-span-5">
            <a
              href={PHONE_TEL}
              style={{
                display: "block",
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                fontVariantNumeric: "tabular-nums",
                fontSize: 42,
                fontWeight: 700,
                color: C.paper,
                letterSpacing: "-0.02em",
              }}
            >
              {PHONE}
            </a>
            <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a
                href={lang === "es" ? "/es/setup" : "/setup"}
                style={{
                  background: C.amber,
                  color: C.ink,
                  fontSize: 14,
                  fontWeight: 700,
                  padding: "12px 20px",
                  borderRadius: 4,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.amberHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = C.amber)}
              >
                {t.cta.primary} →
              </a>
              <a
                href={lang === "es" ? "/es/platform" : "/platform"}
                style={{
                  background: "transparent",
                  color: C.paper,
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "12px 20px",
                  borderRadius: 4,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  border: `1px solid rgba(248,245,238,0.3)`,
                  textDecoration: "none",
                }}
              >
                {t.cta.secondary} →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
