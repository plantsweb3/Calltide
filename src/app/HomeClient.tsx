"use client";

/**
 * Capta homepage — workwear/software direction.
 * Cream paper, editorial serif display where warranted, tabular mono for
 * money, hairline rules. Honest claims. Zero fake testimonials, zero fake
 * metrics, zero magazine affectation.
 */

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
  Serif,
  TrustStrip,
  DemoCtaPair,
  SkipLink,
} from "@/components/marketing/field";

export type BlogPostPreview = {
  slug: string;
  title: string;
  metaDescription: string | null;
  category: string | null;
  readingTimeMin: number | null;
  publishedAt: string | null;
};

/* ═══════════════════════════════════════════════════════════════
   BILINGUAL COPY
   ═══════════════════════════════════════════════════════════════ */

type PricingPlan = {
  billing: "monthly" | "annual";
  price: string;
  period: string;
  note: string;
};

type ReplacesColumn = { label: string; cost: string; footnote: string; highlight?: boolean };
type ReplacesRow = { label: string; values: (boolean | string)[] };

type Copy = {
  hero: {
    kicker: string;
    h1a: string;
    h1b: string;
    sub: string;
    priceLabel: string;
    priceAmount: string;
    pricePeriod: string;
    priceAside: string;
    primaryCta: string;
    secondaryCta: string;
    phone: string;
    phoneHref: string;
    trust: string[];
  };
  demo: {
    kicker: string;
    h2: string;
    sub: string;
    primary: string;
    secondary: string;
    note: string;
  };
  proof: {
    kicker: string;
    h2: string;
    sub: string;
    earlyLabel: string;
    earlyH: string;
    earlyBody: string;
    earlyCta: string;
    earlyCtaHref: string;
  };
  sms: {
    kicker: string;
    h2: string;
    sub: string;
    maria: string;
    mariaRole: string;
    thread: { from: "you" | "maria"; time: string; text: string }[];
    exampleNote: string;
    bullets: string[];
  };
  replaces: {
    kicker: string;
    h2: string;
    sub: string;
    optionHeader: string;
    perMonth: string;
    columns: ReplacesColumn[];
    rows: ReplacesRow[];
    footnoteLabel: string;
    sourceNote: string;
  };
  pricing: {
    kicker: string;
    h2: string;
    sub: string;
    perLocation: string;
    monthlyTab: string;
    annualTab: string;
    included: string;
    items: string[];
    guarantee: string;
    callNow: string;
    plans: PricingPlan[];
  };
  cta: { kicker: string; h2: string; sub: string; callLabel: string; startFree: string; bookDemo: string };
};

const COPY: Record<Lang, Copy> = {
  en: {
    hero: {
      kicker: "The bilingual receptionist",
      h1a: "Your phone rings.",
      h1b: "She answers.",
      sub:
        "Capta is a bilingual AI receptionist that books your jobs, recovers your missed calls, and runs your front office from text messages. Answers every call, in English or Spanish, at $497 a month.",
      priceLabel: "Flat rate, unlimited calls",
      priceAmount: "$497",
      pricePeriod: "/ month",
      priceAside: "No per-minute billing. Cancel any time with a text.",
      primaryCta: "Start 14-day free trial",
      secondaryCta: "Or call the live line — you'll talk to Maria",
      phone: PHONE,
      phoneHref: PHONE_TEL,
      trust: ["14-day trial", "No per-minute billing", "Cancel with one text"],
    },
    demo: {
      kicker: "Try her live",
      h2: "Call the number. She picks up.",
      sub:
        "This is the cleanest way to evaluate Capta. Call the line below and talk to Maria as if you were a customer. She'll answer in under two rings. You'll know inside a minute whether this is real.",
      primary: "Start 14-day free trial",
      secondary: "Or get a free call audit",
      note: "Available 24/7 in English and Spanish. Your call is routed to our demo line.",
    },
    proof: {
      kicker: "Customers",
      h2: "Honest about where we are.",
      sub:
        "We're a small team shipping to a small but growing group of contractors in Texas. Below is the current state — not a polished testimonial wall.",
      earlyLabel: "Early customer program",
      earlyH: "Talk to one of our contractors before you buy.",
      earlyBody:
        "We'll connect you with a current customer in your trade — plumbing, HVAC, electrical, roofing, or general — and you can ask them anything. No sales pitch, no screening, no script. The only ask is that you do the same for the next contractor in line if you become a customer.",
      earlyCta: "Request a reference call",
      earlyCtaHref: "mailto:hello@captahq.com?subject=Reference%20call%20request",
    },
    sms: {
      kicker: "Run the office from SMS",
      h2: "Dispatch. Invoice. Schedule. One text.",
      sub:
        "Once a call lands, Maria texts you the job card. You reply with the action — confirm, reassign, call back — and she runs it. Below is an example of the thread you'd see.",
      maria: "Maria",
      mariaRole: "AI receptionist · English & Spanish",
      thread: [
        { from: "maria", time: "2:08 PM", text: "New job: drain clog at 4521 Oak Lane. ETA 2:15 today. Homeowner is Rick J. Estimate $185–$240." },
        { from: "maria", time: "2:08 PM", text: "Reply 1 to confirm. 2 to reassign. 3 to call him first." },
        { from: "you", time: "2:09 PM", text: "1" },
        { from: "maria", time: "2:09 PM", text: "Confirmed. Rick got the window, Mike is en route. I'll send the invoice when he marks it complete." },
        { from: "you", time: "3:41 PM", text: "How'd this week go" },
        { from: "maria", time: "3:41 PM", text: "47 calls answered. 12 estimates sent. 8 booked. Three missed-call recoveries converted." },
      ],
      exampleNote: "Example thread. Numbers shown are illustrative.",
      bullets: [
        "Answers every call, takes job details, sends estimates",
        "Texts you a one-tap job card when something lands",
        "Recovers missed callers inside 60 seconds",
        "Briefings in the morning, digest on Friday, summary at month-end",
      ],
    },
    replaces: {
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
        { label: "Never sick, never quits", values: [false, "partial", "—", true] },
      ],
      footnoteLabel: "Notes",
      sourceNote:
        "Comparison figures are good-faith estimates of common market alternatives. Actual costs vary by location and provider. See footnotes for sourcing on each column.",
    },
    pricing: {
      kicker: "Pricing",
      h2: "One rate. One plan. One receptionist.",
      sub:
        "Unlimited calls, unlimited SMS, unlimited tools. We don't meter. We don't upsell. The only upgrade is annual, which saves you $1,200.",
      perLocation: "Per location · Unlimited calls",
      monthlyTab: "Monthly",
      annualTab: "Annual · save $1,200",
      included: "Included",
      items: [
        "24 / 7 bilingual AI receptionist on your number",
        "SMS job cards the instant a call converts",
        "Estimates, intake, booking, rescheduling, cancellations",
        "Missed-call recovery within 60 seconds",
        "Text-to-dispatch, text-to-invoice, text-to-report",
        "Monthly summary and weekly digest",
        "Unlimited calls and SMS — no per-minute billing",
      ],
      guarantee: "14 days free. Cancel with one text. Keep going only if it's earning its keep.",
      callNow: "Call her now",
      plans: [
        { billing: "monthly", price: "$497", period: "/ month", note: "Paid monthly" },
        { billing: "annual", price: "$397", period: "/ month", note: "Billed $4,764 annually · save $1,200" },
      ],
    },
    cta: {
      kicker: "Or just call her.",
      h2: "She will answer this phone, in this moment, in English or Spanish.",
      sub: "Two weeks free. Cancel with one text. Your number stays yours.",
      callLabel: "Call the live line",
      startFree: "Start 14-day free trial",
      bookDemo: "Get a free call audit",
    },
  },
  es: {
    hero: {
      kicker: "La recepcionista bilingüe",
      h1a: "Suena tu teléfono.",
      h1b: "Ella contesta.",
      sub:
        "Capta es una recepcionista IA bilingüe que agenda tus trabajos, recupera tus llamadas perdidas, y maneja tu oficina desde mensajes de texto. Contesta cada llamada, en inglés o español, por $497 al mes.",
      priceLabel: "Tarifa fija, llamadas ilimitadas",
      priceAmount: "$497",
      pricePeriod: "/ mes",
      priceAside: "Sin cobro por minuto. Cancela con un mensaje.",
      primaryCta: "Comienza tu prueba gratis de 14 días",
      secondaryCta: "O llama a la línea — vas a hablar con Maria",
      phone: PHONE,
      phoneHref: PHONE_TEL,
      trust: ["Prueba de 14 días", "Sin cobro por minuto", "Cancela con un mensaje"],
    },
    demo: {
      kicker: "Pruébala en vivo",
      h2: "Llama al número. Contesta.",
      sub:
        "Esta es la forma más limpia de evaluar Capta. Llama a la línea de abajo y habla con Maria como si fueras un cliente. Contesta en menos de dos timbres. Vas a saber en un minuto si esto es real.",
      primary: "Comienza tu prueba gratis de 14 días",
      secondary: "O pide una auditoría gratis",
      note: "Disponible 24/7 en inglés y español. Tu llamada se dirige a nuestra línea demo.",
    },
    proof: {
      kicker: "Clientes",
      h2: "Honestos sobre dónde estamos.",
      sub:
        "Somos un equipo pequeño enviando a un grupo pequeño pero creciente de contratistas en Texas. Abajo está el estado actual — no un muro pulido de testimonios.",
      earlyLabel: "Programa de clientes tempranos",
      earlyH: "Habla con uno de nuestros contratistas antes de comprar.",
      earlyBody:
        "Te conectamos con un cliente actual en tu oficio — plomería, HVAC, eléctrico, techos, o general — y puedes preguntarle lo que quieras. Sin pitch de ventas, sin filtro, sin guion. Lo único que pedimos es que hagas lo mismo por el siguiente contratista en la fila si te vuelves cliente.",
      earlyCta: "Solicitar llamada de referencia",
      earlyCtaHref: "mailto:hello@captahq.com?subject=Solicitud%20de%20llamada%20de%20referencia",
    },
    sms: {
      kicker: "Maneja la oficina por SMS",
      h2: "Despacha. Factura. Agenda. Un mensaje.",
      sub:
        "Una vez que entra una llamada, Maria te manda la tarjeta de trabajo. Respondes con la acción — confirmar, reasignar, llamar de regreso — y ella lo maneja. Abajo hay un ejemplo del hilo que verías.",
      maria: "Maria",
      mariaRole: "Recepcionista IA · Inglés y español",
      thread: [
        { from: "maria", time: "2:08 PM", text: "Trabajo nuevo: tubería tapada en 4521 Oak Lane. Llegada 2:15 hoy. Cliente: Rick J. Estimado $185–$240." },
        { from: "maria", time: "2:08 PM", text: "Responde 1 para confirmar. 2 para reasignar. 3 para llamarle primero." },
        { from: "you", time: "2:09 PM", text: "1" },
        { from: "maria", time: "2:09 PM", text: "Confirmado. Rick tiene la ventana, Mike va en camino. Te mando la factura cuando la marque completa." },
        { from: "you", time: "3:41 PM", text: "Cómo nos fue esta semana" },
        { from: "maria", time: "3:41 PM", text: "47 llamadas contestadas. 12 estimados enviados. 8 agendados. Tres recuperaciones de llamada convertidas." },
      ],
      exampleNote: "Hilo de ejemplo. Los números mostrados son ilustrativos.",
      bullets: [
        "Contesta cada llamada, toma detalles, envía estimados",
        "Te manda una tarjeta de trabajo de un toque cuando entra algo",
        "Recupera llamadas perdidas en menos de 60 segundos",
        "Resumen en la mañana, digest el viernes, resumen a fin de mes",
      ],
    },
    replaces: {
      kicker: "Las cuentas",
      h2: "Lo que reemplazan $497 al mes.",
      sub: "Las otras opciones no son malas. Solo son más caras, parciales, o ambas.",
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
        { label: "Nunca se enferma, nunca renuncia", values: [false, "parcial", "—", true] },
      ],
      footnoteLabel: "Notas",
      sourceNote:
        "Las cifras comparativas son estimaciones de buena fe de alternativas de mercado comunes. Los costos reales varían por ubicación y proveedor. Ver notas al pie para la fuente de cada columna.",
    },
    pricing: {
      kicker: "Precios",
      h2: "Una tarifa. Un plan. Una recepcionista.",
      sub:
        "Llamadas ilimitadas, SMS ilimitados, herramientas ilimitadas. No cobramos por uso. No vendemos extras. La única mejora es anual, que te ahorra $1,200.",
      perLocation: "Por ubicación · Llamadas ilimitadas",
      monthlyTab: "Mensual",
      annualTab: "Anual · ahorra $1,200",
      included: "Incluido",
      items: [
        "Recepcionista IA bilingüe 24/7 en tu número",
        "Tarjetas SMS el instante que una llamada convierte",
        "Estimados, admisión, citas, reprogramaciones, cancelaciones",
        "Recuperación de llamada perdida en menos de 60 segundos",
        "Texto para despachar, facturar, y reportar",
        "Resumen mensual y digest semanal",
        "Llamadas y SMS ilimitados — sin cobro por minuto",
      ],
      guarantee: "14 días gratis. Cancela con un mensaje. Sigue solo si está generando su pago.",
      callNow: "Llámale ahora",
      plans: [
        { billing: "monthly", price: "$497", period: "/ mes", note: "Pago mensual" },
        { billing: "annual", price: "$397", period: "/ mes", note: "Facturado $4,764 al año · ahorra $1,200" },
      ],
    },
    cta: {
      kicker: "O simplemente llámale.",
      h2: "Ella contestará este teléfono, en este momento, en inglés o español.",
      sub: "Dos semanas gratis. Cancela con un mensaje. Tu número sigue siendo tuyo.",
      callLabel: "Llama a la línea",
      startFree: "Comenzar prueba gratis de 14 días",
      bookDemo: "Pedir auditoría gratis",
    },
  },
};

const LANG_KEY = "capta-lang";

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function LandingPage({
  initialLang,
  latestPosts = [],
}: {
  latestPosts?: BlogPostPreview[];
  initialLang?: Lang;
} = {}) {
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
      <JsonLd lang={lang} />
      <SkipLink lang={lang} />
      <FieldNav lang={lang} toggleLang={toggleLang} phone={PHONE} phoneHref={PHONE_TEL} />

      <main id="main">
        <Hero t={t} />
        <TrustStrip lang={lang} />
        <DemoBand t={t} />
        <Rule />
        <ProofBand t={t} />
        <Rule />
        <SmsBand t={t} />
        <Rule />
        <ReplacesTable t={t} />
        <Rule />
        <Pricing t={t} />
        {latestPosts.length > 0 && (
          <>
            <Rule />
            <LatestPosts lang={lang} posts={latestPosts} />
          </>
        )}
        <Rule />
        <FinalCta t={t} lang={lang} />
      </main>

      <FieldFooter lang={lang} phone={PHONE} phoneHref={PHONE_TEL} />
    </FieldFrame>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════ */

function Hero({ t }: { t: Copy }) {
  return (
    <section className="mx-auto max-w-[1280px] px-6 sm:px-10 pt-10 pb-20 sm:pt-16 sm:pb-28">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <Kicker>{t.hero.kicker}</Kicker>
          <DisplayH1 style={{ marginTop: 24 }}>
            {t.hero.h1a}
            <br />
            <em
              style={{
                fontStyle: "italic",
                fontVariationSettings: '"SOFT" 100, "WONK" 1',
                color: C.amberInk,
              }}
            >
              {t.hero.h1b}
            </em>
          </DisplayH1>

          <p style={{ maxWidth: 560, fontSize: 18, lineHeight: 1.55, color: C.inkMuted, marginTop: 24 }}>
            {t.hero.sub}
          </p>

          <div
            style={{
              marginTop: 32,
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 20px",
              background: C.paperDark,
              border: `1px solid ${C.rule}`,
              borderRadius: 2,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.18em", color: C.inkMuted, fontWeight: 600, textTransform: "uppercase" }}>
                {t.hero.priceLabel}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
                <Mono style={{ fontSize: 36, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}>
                  {t.hero.priceAmount}
                </Mono>
                <span style={{ fontSize: 15, color: C.inkMuted, fontWeight: 500 }}>{t.hero.pricePeriod}</span>
              </div>
            </div>
            <div aria-hidden style={{ width: 1, height: 48, background: C.rule }} className="hidden sm:block" />
            <div style={{ fontSize: 12, lineHeight: 1.45, color: C.inkMuted, maxWidth: 200, fontWeight: 500 }}>
              {t.hero.priceAside}
            </div>
          </div>

          <div className="mt-8">
            <DemoCtaPair lang={t === COPY.en ? "en" : "es"} size="lg" />
          </div>

          <div className="mt-6">
            <div style={{ fontSize: 13, color: C.inkMuted, marginBottom: 4, letterSpacing: "0.02em", fontWeight: 500 }}>
              {t.hero.secondaryCta}
            </div>
            <a
              href={t.hero.phoneHref}
              style={{
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                fontVariantNumeric: "tabular-nums",
                fontSize: 20,
                fontWeight: 700,
                color: C.ink,
                textDecoration: "underline",
                textUnderlineOffset: 4,
                textDecorationColor: C.inkSoft,
                textDecorationThickness: 1,
              }}
            >
              {t.hero.phone}
            </a>
          </div>

          <div
            style={{
              marginTop: 28,
              paddingTop: 18,
              borderTop: `1px solid ${C.rule}`,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: C.inkSoft,
              fontWeight: 600,
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
            }}
          >
            {t.hero.trust.map((item, i) => (
              <span key={i} className="flex items-center gap-[14px]">
                {i > 0 && <span aria-hidden style={{ color: C.ruleSoft }}>·</span>}
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Right column — photo only. No fabricated captions. */}
        <div className="lg:col-span-5">
          <div
            style={{
              position: "relative",
              borderRadius: 2,
              overflow: "hidden",
              border: `1px solid ${C.rule}`,
              background: C.paperDark,
              aspectRatio: "4 / 5",
            }}
          >
            <Image
              src="/images/grit-hvac.webp"
              alt="A home service contractor on a jobsite"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              style={{ objectFit: "cover", filter: "saturate(0.92) contrast(1.02)" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DEMO BAND (replaces the fake-audio band — real working CTA)
   ═══════════════════════════════════════════════════════════════ */

function DemoBand({ t }: { t: Copy }) {
  const lang: Lang = t === COPY.en ? "en" : "es";
  return (
    <section style={{ background: C.navy, color: C.paper }} className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Kicker tone="dark">{t.demo.kicker}</Kicker>
            <DisplayH2 tone="dark" style={{ marginTop: 20 }}>
              {t.demo.h2}
            </DisplayH2>
            <p style={{ color: "rgba(248,245,238,0.75)", fontSize: 17, lineHeight: 1.6, marginTop: 20, maxWidth: 520 }}>
              {t.demo.sub}
            </p>
          </div>

          <div className="lg:col-span-6">
            <div
              style={{
                padding: "32px",
                background: "rgba(248,245,238,0.04)",
                border: "1px solid rgba(248,245,238,0.12)",
                borderTop: `3px solid ${C.amber}`,
              }}
            >
              <div style={{ fontSize: 11, letterSpacing: "0.22em", color: "rgba(248,245,238,0.7)", fontWeight: 700, textTransform: "uppercase" }}>
                {lang === "es" ? "Línea en vivo" : "Live line"}
              </div>
              <a
                href={t.hero.phoneHref}
                style={{
                  display: "block",
                  marginTop: 14,
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  fontVariantNumeric: "tabular-nums",
                  fontSize: 40,
                  fontWeight: 700,
                  color: C.paper,
                  letterSpacing: "-0.02em",
                }}
              >
                {t.hero.phone}
              </a>
              <p style={{ fontSize: 13, color: "rgba(248,245,238,0.65)", marginTop: 14, lineHeight: 1.55 }}>
                {t.demo.note}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
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
                    minHeight: 44,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.amberHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = C.amber)}
                >
                  {t.demo.primary} →
                </a>
                <a
                  href="/audit"
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
                    border: "1px solid rgba(248,245,238,0.3)",
                    textDecoration: "none",
                    minHeight: 44,
                  }}
                >
                  {t.demo.secondary} →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROOF — honest early-stage framing
   ═══════════════════════════════════════════════════════════════ */

function ProofBand({ t }: { t: Copy }) {
  return (
    <section className="mx-auto max-w-[1280px] px-6 sm:px-10 py-20 sm:py-28">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-5">
          <Kicker>{t.proof.kicker}</Kicker>
          <DisplayH2 style={{ marginTop: 20 }}>{t.proof.h2}</DisplayH2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: C.inkMuted, marginTop: 20, maxWidth: 420 }}>
            {t.proof.sub}
          </p>
        </div>

        <div className="lg:col-span-7">
          <div
            style={{
              border: `1px solid ${C.ink}`,
              background: C.paper,
              padding: "32px 32px 36px",
              borderTop: `3px solid ${C.amber}`,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: "0.22em", color: C.inkMuted, fontWeight: 700, textTransform: "uppercase" }}>
              {t.proof.earlyLabel}
            </div>
            <h3
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 30,
                lineHeight: 1.15,
                fontWeight: 500,
                color: C.ink,
                marginTop: 12,
                letterSpacing: "-0.02em",
              }}
            >
              {t.proof.earlyH}
            </h3>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: C.inkMuted, marginTop: 16 }}>
              {t.proof.earlyBody}
            </p>
            <div className="mt-8">
              <PrimaryButton href={t.proof.earlyCtaHref} size="lg">
                {t.proof.earlyCta}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SMS BAND
   ═══════════════════════════════════════════════════════════════ */

function SmsBand({ t }: { t: Copy }) {
  return (
    <section style={{ background: C.paperDark }} className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6 flex justify-center lg:justify-start">
            <div
              style={{
                width: "100%",
                maxWidth: 340,
                background: "#0F0F11",
                borderRadius: 44,
                padding: 10,
                border: `1px solid ${C.ink}`,
                boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 12px 40px -12px rgba(17,19,24,0.25)",
              }}
            >
              <div
                style={{
                  background: C.paper,
                  borderRadius: 34,
                  overflow: "hidden",
                  aspectRatio: "9 / 18",
                  position: "relative",
                }}
              >
                {/* iOS-style status bar */}
                <div
                  style={{
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 22px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.ink,
                    fontFamily: "var(--font-mono), ui-monospace, monospace",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.01em",
                  }}
                >
                  <span>9:41</span>
                  <span aria-hidden style={{ fontSize: 11, letterSpacing: "0.08em" }}>▸ 5G · 84%</span>
                </div>

                <div
                  style={{
                    padding: "12px 18px 14px",
                    borderBottom: `1px solid ${C.rule}`,
                    background: C.paper,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      background: C.ink,
                      color: C.paper,
                      borderRadius: 999,
                      margin: "0 auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Serif style={{ fontSize: 20, fontWeight: 600 }}>M</Serif>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 14, fontWeight: 600, color: C.ink }}>{t.sms.maria}</div>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.inkMuted,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    {t.sms.mariaRole}
                  </div>
                </div>

                <div style={{ padding: "14px 10px", display: "flex", flexDirection: "column", gap: 6, background: C.paper, minHeight: 300 }}>
                  {t.sms.thread.map((m, i) => {
                    const isYou = m.from === "you";
                    const prev = t.sms.thread[i - 1];
                    const showTime = !prev || prev.time !== m.time || prev.from !== m.from;
                    return (
                      <div key={i}>
                        {showTime && (
                          <div
                            style={{
                              textAlign: "center",
                              fontSize: 10,
                              color: C.inkSoft,
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                              fontWeight: 600,
                              margin: "6px 0 2px",
                            }}
                          >
                            {m.time}
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: isYou ? "flex-end" : "flex-start" }}>
                          <div
                            style={{
                              maxWidth: "82%",
                              background: isYou ? C.navy : C.paperDarker,
                              color: isYou ? C.paper : C.ink,
                              padding: "9px 13px",
                              borderRadius: 16,
                              borderTopLeftRadius: isYou ? 16 : 4,
                              borderTopRightRadius: isYou ? 4 : 16,
                              fontSize: 13,
                              lineHeight: 1.4,
                              fontWeight: 400,
                            }}
                          >
                            {m.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <Kicker>{t.sms.kicker}</Kicker>
            <DisplayH2 style={{ marginTop: 20 }}>{t.sms.h2}</DisplayH2>
            <p style={{ fontSize: 18, lineHeight: 1.55, color: C.inkMuted, marginTop: 20, maxWidth: 520 }}>
              {t.sms.sub}
            </p>

            <ul className="mt-8 flex flex-col gap-0">
              {t.sms.bullets.map((bullet, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "14px 0",
                    borderTop: `1px solid ${C.rule}`,
                    borderBottom: i === t.sms.bullets.length - 1 ? `1px solid ${C.rule}` : "none",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={C.amberInk}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginTop: 4, flexShrink: 0 }}
                    aria-hidden
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ fontSize: 16, lineHeight: 1.5, color: C.ink, fontWeight: 500 }}>{bullet}</span>
                </li>
              ))}
            </ul>
            <p
              style={{
                fontSize: 12,
                color: C.inkSoft,
                marginTop: 16,
                lineHeight: 1.55,
                fontStyle: "italic",
                fontFamily: "var(--font-fraunces), Georgia, serif",
              }}
            >
              {t.sms.exampleNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REPLACES TABLE
   ═══════════════════════════════════════════════════════════════ */

function ReplacesTable({ t }: { t: Copy }) {
  const columns = t.replaces.columns;

  const renderCell = (value: boolean | string) => {
    if (value === true) {
      return (
        <span aria-label="Yes" style={{ width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", color: C.forest }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      );
    }
    if (value === false) {
      return (
        <span aria-label="No" style={{ width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", color: C.inkSoft }}>
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
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
    <section className="mx-auto max-w-[1280px] px-6 sm:px-10 py-20 sm:py-28">
      <div className="max-w-2xl">
        <Kicker>{t.replaces.kicker}</Kicker>
        <DisplayH2 style={{ marginTop: 20 }}>{t.replaces.h2}</DisplayH2>
        <p style={{ fontSize: 17, lineHeight: 1.55, color: C.inkMuted, marginTop: 20 }}>{t.replaces.sub}</p>
      </div>

      {/* Desktop table */}
      <div className="mt-12 hidden overflow-x-auto md:block">
        <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse", fontSize: 14, color: C.ink }}>
          <thead>
            <tr>
              <th scope="col" style={{ padding: "20px 18px", textAlign: "left", verticalAlign: "bottom", borderBottom: `2px solid ${C.ink}`, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: C.inkMuted, width: "28%" }}>
                {t.replaces.optionHeader}
              </th>
              {columns.map((col, i) => (
                <th
                  key={i}
                  scope="col"
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
                  <div style={{ fontSize: 10, color: C.inkSoft, fontWeight: 500, marginTop: 2 }}>
                    {t.replaces.perMonth}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.replaces.rows.map((row, rowIdx) => (
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
                <span style={{ fontSize: 11, color: C.inkSoft, marginLeft: 4 }}>{t.replaces.perMonth}</span>
              </div>
            </div>
            <ul style={{ marginTop: 14, borderTop: `1px solid ${C.rule}` }}>
              {t.replaces.rows.map((row, rowIdx) => {
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

      <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.rule}` }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: C.inkSoft, fontWeight: 700, marginBottom: 10 }}>
          {t.replaces.footnoteLabel}
        </div>
        <p style={{ fontSize: 12, color: C.inkMuted, lineHeight: 1.6, marginBottom: 14, fontStyle: "italic", fontFamily: "var(--font-fraunces), Georgia, serif" }}>
          {t.replaces.sourceNote}
        </p>
        <ol style={{ fontSize: 12, color: C.inkMuted, lineHeight: 1.55, listStyle: "none", padding: 0 }}>
          {columns.map((col, i) => (
            <li key={i} style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <Mono style={{ color: C.amberInk, fontWeight: 700, flexShrink: 0, width: 24 }}>[{i + 1}]</Mono>
              <span>
                <strong style={{ fontWeight: 600, color: C.ink }}>{col.label}.</strong> {col.footnote}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRICING
   ═══════════════════════════════════════════════════════════════ */

function Pricing({ t }: { t: Copy }) {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const active = t.pricing.plans.find((p) => p.billing === billing) ?? t.pricing.plans[0];
  const lang: Lang = t === COPY.en ? "en" : "es";

  return (
    <section style={{ background: C.paper }} className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
        <div className="grid gap-14 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <Kicker>{t.pricing.kicker}</Kicker>
            <DisplayH2 style={{ marginTop: 20 }}>{t.pricing.h2}</DisplayH2>
            <p style={{ fontSize: 17, lineHeight: 1.55, color: C.inkMuted, marginTop: 20, maxWidth: 420 }}>
              {t.pricing.sub}
            </p>
            <div style={{ marginTop: 28, padding: "16px 18px", background: C.paperDark, borderLeft: `3px solid ${C.amber}` }}>
              <p style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 16, lineHeight: 1.5, fontStyle: "italic", color: C.ink }}>
                {t.pricing.guarantee}
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div style={{ border: `1px solid ${C.ink}`, background: C.paper }}>
              <div
                role="tablist"
                aria-label={lang === "es" ? "Periodo de facturación" : "Billing period"}
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid ${C.ink}` }}
              >
                {t.pricing.plans.map((plan) => (
                  <button
                    key={plan.billing}
                    role="tab"
                    aria-selected={billing === plan.billing}
                    onClick={() => setBilling(plan.billing)}
                    style={{
                      padding: "16px 16px",
                      background: billing === plan.billing ? C.ink : "transparent",
                      color: billing === plan.billing ? C.paper : C.inkMuted,
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      borderRight: plan.billing === "monthly" ? `1px solid ${C.ink}` : "none",
                      cursor: "pointer",
                      minHeight: 48,
                      lineHeight: 1.3,
                    }}
                  >
                    {plan.billing === "monthly" ? t.pricing.monthlyTab : t.pricing.annualTab}
                  </button>
                ))}
              </div>

              <div style={{ padding: "48px 32px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.22em", color: C.inkMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 16 }}>
                  {t.pricing.perLocation}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6 }}>
                  <Mono style={{ fontSize: "clamp(56px, 9vw, 108px)", fontWeight: 700, color: C.ink, letterSpacing: "-0.04em", lineHeight: 1 }}>
                    {active.price}
                  </Mono>
                  <span style={{ fontSize: 18, color: C.inkMuted, fontWeight: 500, marginLeft: 4 }}>{active.period}</span>
                </div>
                <div style={{ fontSize: 13, color: C.inkMuted, marginTop: 14, fontWeight: 500 }}>{active.note}</div>

                <div className="mt-7">
                  <DemoCtaPair lang={lang} size="lg" />
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${C.rule}`, padding: "24px 32px 32px", background: C.paperDark }}>
                <div style={{ fontSize: 11, letterSpacing: "0.22em", color: C.inkMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 14 }}>
                  {t.pricing.included}
                </div>
                <ul style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                  {t.pricing.items.map((item, i) => (
                    <li key={i} style={{ display: "flex", gap: 12, fontSize: 14, lineHeight: 1.5, color: C.ink }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.forest} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 4, flexShrink: 0 }} aria-hidden>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span style={{ fontWeight: 500 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FINAL CTA
   ═══════════════════════════════════════════════════════════════ */

function FinalCta({ t, lang }: { t: Copy; lang: Lang }) {
  return (
    <section style={{ background: C.ink, color: C.paper, borderTop: `3px solid ${C.amber}` }} className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Kicker tone="dark">{t.cta.kicker}</Kicker>
            <DisplayH2 tone="dark" style={{ marginTop: 20, maxWidth: 720 }}>
              {t.cta.h2}
            </DisplayH2>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: "rgba(248,245,238,0.7)", marginTop: 20, maxWidth: 520 }}>
              {t.cta.sub}
            </p>
          </div>

          <div className="lg:col-span-5">
            <div style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(248,245,238,0.6)", fontWeight: 700 }}>
              {t.cta.callLabel}
            </div>
            <a
              href={t.hero.phoneHref}
              style={{
                display: "block",
                marginTop: 12,
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                fontVariantNumeric: "tabular-nums",
                fontSize: 34,
                fontWeight: 700,
                color: C.paper,
                letterSpacing: "-0.02em",
              }}
            >
              {t.hero.phone}
            </a>
            <div className="mt-5 flex flex-wrap gap-3">
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
                  minHeight: 44,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.amberHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = C.amber)}
              >
                {t.cta.startFree} →
              </a>
              <a
                href="/audit"
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
                  border: "1px solid rgba(248,245,238,0.3)",
                  textDecoration: "none",
                  minHeight: 44,
                }}
              >
                {t.cta.bookDemo} →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LATEST POSTS — internal link equity
   ═══════════════════════════════════════════════════════════════ */

function LatestPosts({ lang, posts }: { lang: Lang; posts: BlogPostPreview[] }) {
  const labels = lang === "es"
    ? { kicker: "Del blog", h2: "Escrito para contratistas.", all: "Ver todo →" }
    : { kicker: "From the blog", h2: "Written for contractors.", all: "See all →" };
  const base = lang === "es" ? "/es/blog" : "/blog";

  return (
    <section className="mx-auto max-w-[1280px] px-6 sm:px-10 py-20 sm:py-24">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <Kicker>{labels.kicker}</Kicker>
          <DisplayH2 style={{ marginTop: 18, fontSize: "clamp(28px, 3.2vw, 44px)" }}>
            {labels.h2}
          </DisplayH2>
        </div>
        <a
          href={base}
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: C.ink,
            textDecoration: "underline",
            textUnderlineOffset: 4,
            textDecorationColor: C.rule,
          }}
        >
          {labels.all}
        </a>
      </div>

      <ul className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-3">
        {posts.slice(0, 3).map((p) => (
          <li key={p.slug}>
            <a href={`${base}/${p.slug}`} className="block group">
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: C.inkMuted,
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                {p.category ?? (lang === "es" ? "Artículo" : "Article")}
                {p.readingTimeMin ? ` · ${p.readingTimeMin} ${lang === "es" ? "min" : "min"}` : ""}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                  fontSize: 22,
                  lineHeight: 1.2,
                  fontWeight: 500,
                  color: C.ink,
                  letterSpacing: "-0.015em",
                }}
                className="group-hover:underline"
              >
                {p.title}
              </h3>
              {p.metaDescription && (
                <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: C.inkMuted }}>
                  {p.metaDescription}
                </p>
              )}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCHEMA
   ═══════════════════════════════════════════════════════════════ */

function JsonLd({ lang }: { lang: Lang }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Capta",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          inLanguage: lang,
          offers: {
            "@type": "AggregateOffer",
            lowPrice: "397",
            highPrice: "497",
            priceCurrency: "USD",
            offerCount: "2",
          },
          description:
            "Bilingual AI receptionist for home service businesses. Answers calls, generates estimates, recovers missed calls, and manages follow-ups in English and Spanish, 24/7. Flat $497/mo.",
        }),
      }}
    />
  );
}
