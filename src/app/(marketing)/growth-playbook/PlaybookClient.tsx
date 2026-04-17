"use client";

/**
 * Growth Playbook — Field Manual direction.
 * Editorial landing + lead-magnet form for the free PDF.
 */

import { useState, useEffect, useCallback } from "react";
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
  Serif,
  SkipLink,
} from "@/components/marketing/field";

type Chapter = { num: string; title: string; desc: string };
type Stat = { value: string; label: string; note: string };
type Copy = {
  hero: {
    kicker: string;
    issueTag: string;
    h1a: string;
    h1b: string;
    dek: string;
    checkItems: string[];
  };
  form: {
    title: string;
    sub: string;
    emailLabel: string;
    emailPlaceholder: string;
    tradeLabel: string;
    tradePlaceholder: string;
    tradeOptions: string[];
    sending: string;
    submit: string;
    footer: string;
    readyTitle: string;
    readySub: string;
    downloadEN: string;
    downloadES: string;
  };
  chapters: { kicker: string; h2: string; sub: string; items: Chapter[] };
  stats: { kicker: string; h2: string; items: Stat[] };
  forYou: { kicker: string; h2: string; items: string[] };
  cta: { kicker: string; h2: string; sub: string; primary: string };
};

const TRADE_VALUES = [
  "plumbing",
  "hvac",
  "electrical",
  "roofing",
  "general_contractor",
  "restoration",
  "landscaping",
  "pest_control",
  "garage_door",
  "other",
];

const COPY: Record<Lang, Copy> = {
  en: {
    hero: {
      kicker: "Free guide",
      issueTag: "30 pages · PDF",
      h1a: "The blue-collar",
      h1b: "growth playbook.",
      dek:
        "Seven strategies top contractors use to scale without adding headcount. Real data, honest frameworks, zero hype. Thirty pages. Free PDF — no credit card, no forty-seven-email drip.",
      checkItems: [
        "Revenue-per-truck benchmarks by trade",
        "The real cost of missed calls (with math)",
        "The bilingual revenue opportunity most contractors ignore",
        "Which AI tools actually work vs what's hype",
      ],
    },
    form: {
      title: "Request the dossier",
      sub: "Arrives in your inbox. English and Spanish editions included.",
      emailLabel: "Email",
      emailPlaceholder: "you@yourshop.com",
      tradeLabel: "Your trade (optional)",
      tradePlaceholder: "Select a trade",
      tradeOptions: [
        "Plumbing",
        "HVAC",
        "Electrical",
        "Roofing",
        "General contracting",
        "Restoration",
        "Landscaping",
        "Pest control",
        "Garage door",
        "Other",
      ],
      sending: "Sending…",
      submit: "Send me the dossier",
      footer: "30 pages. Real data. Strategies you can use this week.",
      readyTitle: "Your dossier is on the way.",
      readySub: "Download directly below while we queue the email copy.",
      downloadEN: "Download · English (PDF)",
      downloadES: "Descargar · Español (PDF)",
    },
    chapters: {
      kicker: "What's inside",
      h2: "Seven chapters. Zero filler.",
      sub: "Every chapter is a standalone strategy a single contractor can implement inside a week.",
      items: [
        { num: "01", title: "The revenue-per-truck metric", desc: "Why most contractors measure growth wrong (headcount) instead of right (revenue per truck). Real benchmarks by trade." },
        { num: "02", title: "The 47-hour response problem", desc: "The average contractor takes 47 hours to respond to a lead. Companies that respond in under 60 seconds convert 391% more. Here's how to fix it." },
        { num: "03", title: "The $50K leak", desc: "Missed calls, the real math by trade, and why 85% of callers never call back. Frameworks to audit your own missed-call rate." },
        { num: "04", title: "The bilingual advantage", desc: "$3T+ in Hispanic purchasing power, 40M+ Spanish speakers. Most competitors can't serve them. A growth lever hiding in plain sight." },
        { num: "05", title: "The automation stack", desc: "What to automate (phones, scheduling, follow-ups, reviews) vs what to never automate (the work, the relationships). Honest breakdown of every tool category." },
        { num: "06", title: "The recurring-revenue shift", desc: "How top contractors build maintenance agreements and service contracts to smooth seasonal swings. Real pricing frameworks you can copy." },
        { num: "07", title: "The AI opportunity (and what's hype)", desc: "An honest take on what AI can and can't do in 2026 for trades. What's actually working, what's vaporware, where to spend your money." },
      ],
    },
    stats: {
      kicker: "The market",
      h2: "The numbers you're working against.",
      items: [
        { value: "$650B+", label: "Home services market", note: "Fragmented across 3M+ small operators. Winner-take-most is not happening. Growth is still yours to take." },
        { value: "550K", label: "Plumber shortage by 2027", note: "Per BLS. Demand is outrunning supply. The contractors who scale without hiring win." },
        { value: "85%", label: "Callers who never call back", note: "When they hit voicemail. First answer wins the job. The rest eat the loss." },
        { value: "47 hrs", label: "Avg. lead response", note: "Industry benchmark. Respond in <60 seconds and you convert 391% more leads." },
      ],
    },
    forYou: {
      kicker: "Read this if",
      h2: "This playbook is for you if…",
      items: [
        "You're turning away work because you can't hire fast enough",
        "You know you're missing calls but don't know how many",
        "You've been burned by software that overpromised",
        "You want to grow revenue without growing headcount",
        "You serve (or want to serve) Spanish-speaking customers",
        "You're tired of competing on price instead of speed",
      ],
    },
    cta: {
      kicker: "Already sold on the math?",
      h2: "Skip the PDF. Hire the receptionist.",
      sub: "14 days free. One phone number. Cancel with one text.",
      primary: "Start 14-day free trial",
    },
  },
  es: {
    hero: {
      kicker: "Guía gratis",
      issueTag: "30 páginas · PDF",
      h1a: "El manual de crecimiento",
      h1b: "para contratistas.",
      dek:
        "Siete estrategias que usan los mejores contratistas para escalar sin contratar más gente. Datos reales, frameworks honestos, cero hype. Treinta páginas. PDF gratis — sin tarjeta de crédito, sin campaña de cuarenta y siete correos.",
      checkItems: [
        "Benchmarks de ingresos por camión por oficio",
        "El costo real de las llamadas perdidas (con matemáticas)",
        "La oportunidad de ingresos bilingües que la mayoría ignora",
        "Qué herramientas de IA realmente funcionan vs cuáles son hype",
      ],
    },
    form: {
      title: "Solicita el expediente",
      sub: "Llega a tu bandeja. Ediciones en inglés y español incluidas.",
      emailLabel: "Correo",
      emailPlaceholder: "tu@tutaller.com",
      tradeLabel: "Tu oficio (opcional)",
      tradePlaceholder: "Selecciona un oficio",
      tradeOptions: [
        "Plomería",
        "HVAC",
        "Eléctrico",
        "Techos",
        "Contratista general",
        "Restauración",
        "Jardinería",
        "Control de plagas",
        "Puertas de garaje",
        "Otro",
      ],
      sending: "Enviando…",
      submit: "Mándame el expediente",
      footer: "30 páginas. Datos reales. Estrategias que puedes usar esta semana.",
      readyTitle: "Tu expediente va en camino.",
      readySub: "Descarga directamente abajo mientras enviamos el correo.",
      downloadEN: "Descargar · English (PDF)",
      downloadES: "Descargar · Español (PDF)",
    },
    chapters: {
      kicker: "Qué hay adentro",
      h2: "Siete capítulos. Cero relleno.",
      sub: "Cada capítulo es una estrategia independiente que un solo contratista puede implementar en una semana.",
      items: [
        { num: "01", title: "La métrica de ingresos por camión", desc: "Por qué la mayoría mide el crecimiento mal (cantidad de empleados) en vez de bien (ingresos por camión). Benchmarks reales por oficio." },
        { num: "02", title: "El problema de las 47 horas", desc: "El contratista promedio tarda 47 horas en responder a un prospecto. Los que responden en menos de 60 segundos convierten 391% más. Así se soluciona." },
        { num: "03", title: "La fuga de $50K", desc: "Llamadas perdidas, las cuentas reales por oficio, y por qué el 85% de los llamantes nunca vuelven. Frameworks para auditar tu propia tasa." },
        { num: "04", title: "La ventaja bilingüe", desc: "$3T+ en poder adquisitivo hispano, 40M+ hispanohablantes. La mayoría de competidores no pueden atenderlos. Palanca de crecimiento escondida a plena vista." },
        { num: "05", title: "El stack de automatización", desc: "Qué automatizar (teléfonos, agenda, seguimientos, reseñas) vs qué nunca automatizar (el trabajo, las relaciones). Análisis honesto de cada categoría." },
        { num: "06", title: "El cambio a ingresos recurrentes", desc: "Cómo los mejores contratistas crean acuerdos de mantenimiento para suavizar temporadas bajas. Frameworks de precios que puedes copiar." },
        { num: "07", title: "La oportunidad de IA (y qué es hype)", desc: "Perspectiva honesta de lo que la IA puede y no puede hacer en 2026 para oficios. Qué está funcionando, qué es vaporware, dónde invertir." },
      ],
    },
    stats: {
      kicker: "El mercado",
      h2: "Los números contra los que trabajas.",
      items: [
        { value: "$650B+", label: "Mercado de servicios", note: "Fragmentado entre 3M+ operadores pequeños. No está pasando el ganador-se-lo-lleva-todo. El crecimiento sigue siendo tuyo." },
        { value: "550K", label: "Escasez de plomeros 2027", note: "Según BLS. La demanda supera la oferta. Los contratistas que escalan sin contratar ganan." },
        { value: "85%", label: "Llamantes que no regresan", note: "Cuando llegan al buzón. La primera respuesta gana el trabajo. Los demás comen la pérdida." },
        { value: "47 hrs", label: "Respuesta promedio", note: "Benchmark de la industria. Responde en <60 segundos y conviertes 391% más prospectos." },
      ],
    },
    forYou: {
      kicker: "Lee esto si",
      h2: "Este manual es para ti si…",
      items: [
        "Estás rechazando trabajo porque no puedes contratar suficiente",
        "Sabes que pierdes llamadas pero no sabes cuántas",
        "Te han decepcionado con software que prometió demasiado",
        "Quieres crecer ingresos sin crecer personal",
        "Atiendes (o quieres atender) a clientes hispanohablantes",
        "Estás cansado de competir por precio en vez de velocidad",
      ],
    },
    cta: {
      kicker: "¿Ya te convencieron las cuentas?",
      h2: "Salta el PDF. Contrata la recepcionista.",
      sub: "14 días gratis. Un número de teléfono. Cancela con un mensaje.",
      primary: "Comenzar prueba gratis de 14 días",
    },
  },
};

const LANG_KEY = "capta-lang";

export function PlaybookLanding({ initialLang }: { initialLang?: Lang } = {}) {
  const [email, setEmail] = useState("");
  const [trade, setTrade] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || sending) return;
    setSending(true);

    const params = new URLSearchParams(window.location.search);
    await fetch("/api/marketing/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        trade: trade || undefined,
        source: "playbook",
        language: lang,
        utmSource: params.get("utm_source") || "playbook",
        utmMedium: params.get("utm_medium") || "landing",
        utmCampaign: params.get("utm_campaign") || "growth_playbook",
      }),
    }).catch(() => {});

    setSubmitted(true);
    setSending(false);
  }

  return (
    <FieldFrame>
      <SkipLink lang={lang} />
      <FieldNav lang={lang} toggleLang={toggleLang} phone={PHONE} phoneHref={PHONE_TEL} />

      <main id="main">
      {/* Hero */}
      <section className="mx-auto max-w-[1280px] px-6 sm:px-10 pt-14 pb-20 sm:pt-20 sm:pb-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-4">
              <Kicker>{t.hero.kicker}</Kicker>
              <Mono style={{ fontSize: 11, letterSpacing: "0.18em", color: C.inkSoft, fontWeight: 600, textTransform: "uppercase" }}>
                {t.hero.issueTag}
              </Mono>
            </div>
            <DisplayH1 style={{ marginTop: 28 }}>
              {t.hero.h1a}
              <br />
              <em style={{ fontStyle: "italic", fontVariationSettings: '"SOFT" 100, "WONK" 1', color: C.amberInk }}>
                {t.hero.h1b}
              </em>
            </DisplayH1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: C.inkMuted, marginTop: 28, maxWidth: 620 }}>
              {t.hero.dek}
            </p>
            <ul className="mt-10 flex flex-col gap-0">
              {t.hero.checkItems.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "14px 0",
                    borderTop: `1px solid ${C.rule}`,
                    borderBottom: i === t.hero.checkItems.length - 1 ? `1px solid ${C.rule}` : "none",
                  }}
                >
                  <Mono style={{ fontSize: 12, color: C.amberInk, fontWeight: 700, width: 24, flexShrink: 0 }}>
                    0{i + 1}
                  </Mono>
                  <span style={{ fontSize: 15, lineHeight: 1.5, color: C.ink, fontWeight: 500 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Form */}
          <div className="lg:col-span-5">
            <div
              style={{
                border: `1px solid ${C.ink}`,
                background: C.paper,
                padding: "36px 32px",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -1,
                  left: -1,
                  right: -1,
                  height: 4,
                  background: C.amber,
                }}
              />
              {!submitted ? (
                <>
                  <div style={{ fontSize: 11, letterSpacing: "0.22em", color: C.inkMuted, fontWeight: 700, textTransform: "uppercase" }}>
                    {t.form.title}
                  </div>
                  <h2
                    style={{
                      fontFamily: "var(--font-fraunces), Georgia, serif",
                      fontSize: 26,
                      lineHeight: 1.15,
                      fontWeight: 500,
                      color: C.ink,
                      marginTop: 10,
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {t.form.sub}
                  </h2>
                  <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                    <div>
                      <label style={{ fontSize: 11, letterSpacing: "0.18em", color: C.inkMuted, fontWeight: 700, textTransform: "uppercase" }}>
                        {t.form.emailLabel}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.form.emailPlaceholder}
                        required
                        style={{
                          width: "100%",
                          marginTop: 6,
                          padding: "12px 14px",
                          background: C.paper,
                          border: `1px solid ${C.rule}`,
                          color: C.ink,
                          fontSize: 15,
                          fontFamily: "var(--font-inter), sans-serif",
                          outline: "none",
                          borderRadius: 2,
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = C.ink)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = C.rule)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, letterSpacing: "0.18em", color: C.inkMuted, fontWeight: 700, textTransform: "uppercase" }}>
                        {t.form.tradeLabel}
                      </label>
                      <select
                        value={trade}
                        onChange={(e) => setTrade(e.target.value)}
                        style={{
                          width: "100%",
                          marginTop: 6,
                          padding: "12px 14px",
                          background: C.paper,
                          border: `1px solid ${C.rule}`,
                          color: trade ? C.ink : C.inkSoft,
                          fontSize: 15,
                          fontFamily: "var(--font-inter), sans-serif",
                          outline: "none",
                          borderRadius: 2,
                        }}
                      >
                        <option value="">{t.form.tradePlaceholder}</option>
                        {TRADE_VALUES.map((val, i) => (
                          <option key={val} value={val}>
                            {t.form.tradeOptions[i]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <PrimaryButton type="submit" size="lg" disabled={sending}>
                      {sending ? t.form.sending : t.form.submit}
                    </PrimaryButton>
                    <p style={{ fontSize: 12, color: C.inkMuted, lineHeight: 1.55, marginTop: 4, fontStyle: "italic", fontFamily: "var(--font-fraunces), Georgia, serif" }}>
                      {t.form.footer}
                    </p>
                  </form>
                </>
              ) : (
                <>
                  <Mono style={{ fontSize: 11, letterSpacing: "0.22em", color: C.forest, fontWeight: 700, textTransform: "uppercase" }}>
                    ✓ Request received
                  </Mono>
                  <h2
                    style={{
                      fontFamily: "var(--font-fraunces), Georgia, serif",
                      fontSize: 26,
                      lineHeight: 1.15,
                      fontWeight: 500,
                      color: C.ink,
                      marginTop: 14,
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {t.form.readyTitle}
                  </h2>
                  <p style={{ fontSize: 15, color: C.inkMuted, lineHeight: 1.55, marginTop: 10 }}>
                    {t.form.readySub}
                  </p>
                  <div className="mt-6 flex flex-col gap-3">
                    <a
                      href="/downloads/blue-collar-growth-playbook.pdf"
                      download
                      style={{
                        background: C.ink,
                        color: C.paper,
                        fontSize: 14,
                        fontWeight: 700,
                        padding: "12px 18px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderRadius: 4,
                        textDecoration: "none",
                      }}
                    >
                      {t.form.downloadEN}
                      <span>↓</span>
                    </a>
                    <a
                      href="/downloads/manual-de-crecimiento-para-contratistas.pdf"
                      download
                      style={{
                        background: "transparent",
                        color: C.ink,
                        fontSize: 14,
                        fontWeight: 700,
                        padding: "12px 18px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        border: `1px solid ${C.ink}`,
                        borderRadius: 4,
                        textDecoration: "none",
                      }}
                    >
                      {t.form.downloadES}
                      <span>↓</span>
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Rule />

      {/* Chapters */}
      <section className="mx-auto max-w-[1280px] px-6 sm:px-10 py-24 sm:py-32">
        <div className="max-w-2xl">
          <Kicker>{t.chapters.kicker}</Kicker>
          <DisplayH2 style={{ marginTop: 20 }}>{t.chapters.h2}</DisplayH2>
          <p style={{ fontSize: 17, lineHeight: 1.55, color: C.inkMuted, marginTop: 20 }}>{t.chapters.sub}</p>
        </div>

        <ol className="mt-14" style={{ borderTop: `1px solid ${C.rule}` }}>
          {t.chapters.items.map((ch) => (
            <li
              key={ch.num}
              style={{
                borderBottom: `1px solid ${C.rule}`,
                padding: "24px 0",
              }}
            >
              <div className="grid gap-4 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-2">
                  <Mono style={{ fontSize: 12, letterSpacing: "0.22em", color: C.amberInk, fontWeight: 700 }}>
                    {ch.num}
                  </Mono>
                </div>
                <div className="lg:col-span-4">
                  <h3
                    style={{
                      fontFamily: "var(--font-fraunces), Georgia, serif",
                      fontSize: 24,
                      lineHeight: 1.15,
                      fontWeight: 500,
                      color: C.ink,
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {ch.title}
                  </h3>
                </div>
                <div className="lg:col-span-6">
                  <p style={{ fontSize: 15, lineHeight: 1.65, color: C.inkMuted }}>{ch.desc}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Rule />

      {/* Stats */}
      <section style={{ background: C.paperDark }} className="py-24 sm:py-32">
        <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
          <div className="max-w-2xl">
            <Kicker>{t.stats.kicker}</Kicker>
            <DisplayH2 style={{ marginTop: 20 }}>{t.stats.h2}</DisplayH2>
          </div>
          <div className="mt-14 grid gap-0 md:grid-cols-2 lg:grid-cols-4" style={{ borderTop: `1px solid ${C.rule}`, borderBottom: `1px solid ${C.rule}` }}>
            {t.stats.items.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "28px 24px",
                  background: C.paper,
                  borderLeft: i > 0 ? `1px solid ${C.rule}` : "none",
                }}
                className={i > 0 ? "border-t lg:border-t-0" : ""}
              >
                <Mono style={{ fontSize: 36, fontWeight: 700, color: C.ink, letterSpacing: "-0.03em", lineHeight: 1 }} as="div">
                  {item.value}
                </Mono>
                <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: C.inkMuted, fontWeight: 700, marginTop: 12 }}>
                  {item.label}
                </div>
                <p style={{ fontSize: 13, color: C.inkMuted, marginTop: 8, lineHeight: 1.55 }}>{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Rule />

      {/* For you */}
      <section className="mx-auto max-w-[1280px] px-6 sm:px-10 py-24 sm:py-32">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <Kicker>{t.forYou.kicker}</Kicker>
            <DisplayH2 style={{ marginTop: 20 }}>
              {t.forYou.h2.split("…")[0]}
              <em style={{ fontStyle: "italic", fontVariationSettings: '"SOFT" 100, "WONK" 1', color: C.amberInk }}>…</em>
            </DisplayH2>
          </div>
          <div className="lg:col-span-7">
            <ul style={{ borderTop: `1px solid ${C.rule}` }}>
              {t.forYou.items.map((item, i) => (
                <li
                  key={i}
                  style={{
                    borderBottom: `1px solid ${C.rule}`,
                    padding: "20px 0",
                    display: "flex",
                    gap: 16,
                    alignItems: "baseline",
                  }}
                >
                  <Mono style={{ fontSize: 11, color: C.inkSoft, fontWeight: 700, width: 32, flexShrink: 0, letterSpacing: "0.08em" }}>
                    {String(i + 1).padStart(2, "0")}
                  </Mono>
                  <Serif style={{ fontSize: 20, fontWeight: 400, color: C.ink, lineHeight: 1.4, letterSpacing: "-0.005em" }}>
                    {item}
                  </Serif>
                </li>
              ))}
            </ul>
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
