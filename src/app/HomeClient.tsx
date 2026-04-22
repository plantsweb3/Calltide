"use client";

/**
 * Capta homepage — brand-kit industrial aesthetic.
 *
 * Per Capta Brand Kit - Official (March 10, 2026) + Website Redesign
 * Plan March 2026:
 *  - Navy #1B2A4A + Catch Gold #D4A843 + Truck White #F8FAFC
 *  - Inter bold/black for display (Gotham-equivalent); NO serifs
 *  - Primary VP: "Never miss a call again"
 *  - Gold "Get Capta →" CTAs (no "Start Free Trial" copy)
 *  - 14-day free trial as benefit (no 30-day guarantee)
 */

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { PHONE, PHONE_TEL, type Lang } from "@/lib/marketing/translations";

// Demo widget is client-only (useConversation touches window).
const IndustrialDemoWidget = dynamic(
  () =>
    import("@/components/marketing/industrial/DemoWidget").then(
      (m) => m.IndustrialDemoWidget,
    ),
  { ssr: false },
);

/* ═══════════════════════════════════════════════════════════════════
   PALETTE
   ═══════════════════════════════════════════════════════════════════ */

const C = {
  navy: "#1B2A4A",
  navyLight: "#263556",
  midnight: "#0F1729",
  gold: "#D4A843",
  goldDark: "#A17D1F",
  goldSoft: "#F5E6BC",
  truck: "#F8FAFC",
  white: "#FFFFFF",
  ink: "#0F1729",
  inkMuted: "#475569",
  inkSoft: "#64748B",
  border: "#E2E8F0",
  borderSoft: "#F1F5F9",
  green: "#16A34A",
};

/* ═══════════════════════════════════════════════════════════════════
   BILINGUAL COPY
   ═══════════════════════════════════════════════════════════════════ */

type Feature = { title: string; body: string };
type Step = { title: string; body: string };
type FAQ = { q: string; a: string };

type Copy = {
  nav: {
    platform: string;
    pricing: string;
    about: string;
    faq: string;
    blog: string;
    login: string;
    cta: string;
  };
  hero: {
    kicker: string;
    h1: string;
    sub: string;
    pitch: string;
    primary: string;
    secondary: string;
    orCall: string;
    trust: string[];
  };
  problem: {
    kicker: string;
    h2a: string;
    h2b: string;
    stat1Num: string;
    stat1Label: string;
    stat2Num: string;
    stat2Label: string;
    body: string;
    roiPre: string;
    roiLink: string;
  };
  how: {
    kicker: string;
    h2: string;
    sub: string;
    steps: Step[];
  };
  features: {
    kicker: string;
    h2: string;
    sub: string;
    items: Feature[];
  };
  demoSection: {
    kicker: string;
    h2: string;
    sub: string;
  };
  pricing: {
    kicker: string;
    h2: string;
    sub: string;
    price: string;
    period: string;
    annual: string;
    includes: string[];
    primary: string;
    trial: string;
    vsHuman: string;
    vsHumanDetail: string;
  };
  faq: {
    kicker: string;
    h2: string;
    sub: string;
    items: FAQ[];
    more: string;
  };
  finalCta: {
    kicker: string;
    h2a: string;
    h2b: string;
    sub: string;
    primary: string;
    note: string;
  };
  footer: {
    tagline: string;
    product: string;
    company: string;
    legal: string;
    compliance: string;
    copyright: string;
  };
};

const COPY: Record<Lang, Copy> = {
  en: {
    nav: {
      platform: "Platform",
      pricing: "Pricing",
      about: "About",
      faq: "FAQ",
      blog: "Blog",
      login: "Log in",
      cta: "Get Capta",
    },
    hero: {
      kicker: "AI Receptionist for Home Service",
      h1: "Never miss a call again.",
      sub:
        "Maria answers your phone in English and Spanish, 24/7 — books jobs, takes messages, and texts you the details before the customer hangs up.",
      pitch: "She answers. She quotes. She follows up. You do the work.",
      primary: "Get Capta",
      secondary: "See how it works",
      orCall: "Or call",
      trust: ["24/7 coverage", "Bilingual EN / ES", "$497/mo flat", "14-day free trial"],
    },
    problem: {
      kicker: "The problem",
      h2a: "Every missed call is a job",
      h2b: "going to the next shop on the list.",
      stat1Num: "62%",
      stat1Label: "of calls to home service businesses go unanswered.",
      stat2Num: "80%",
      stat2Label: "of those callers won't leave a voicemail.",
      body:
        "You're on a roof. Your phone rings. You can't answer. The caller hangs up and calls the next plumber, HVAC tech, or electrician on the search result. That's the job you just lost — and the three referrals after it.",
      roiPre: "3 missed calls a week × $800 average job = ",
      roiLink: "run your own numbers",
    },
    how: {
      kicker: "How it works",
      h2: "Three steps. Live by tomorrow.",
      sub: "No app for your customers to download. No new phone number to memorize. You forward your existing line and Maria picks up.",
      steps: [
        {
          title: "1 — Sign up in 5 minutes",
          body: "Tell Maria your business name, hours, and the services you offer. Pick a voice. She's trained on your trade.",
        },
        {
          title: "2 — Forward your number",
          body: "One call to your carrier or a tap in your iPhone settings. Your existing number stays the same. Your customers don't notice a thing.",
        },
        {
          title: "3 — She answers. You get texts.",
          body: "Every call: the job, the address, the language, the urgency — texted to you before the customer hangs up. Appointments land on your calendar.",
        },
      ],
    },
    features: {
      kicker: "What she does",
      h2: "Everything a receptionist does. Plus the hours.",
      sub: "A human receptionist costs $3,600/month, speaks one language, works 40 hours a week, and calls in sick. Maria is $497/month and runs 168 hours a week in two languages.",
      items: [
        {
          title: "24 / 7 answering",
          body: "Unlimited call volume, no busy signal, no after-hours voicemail. She picks up in under two rings every time.",
        },
        {
          title: "Native bilingual",
          body: "English and Spanish, switched mid-call. Not translation — native speech patterns for both languages, built in.",
        },
        {
          title: "Books appointments",
          body: "Live access to your calendar. Maria offers available windows, confirms the job, and sends the customer an SMS with the time.",
        },
        {
          title: "Qualifies the lead",
          body: "Asks the right questions for your trade — problem, property type, urgency — and scores the lead before it hits your phone.",
        },
        {
          title: "Emergency detection",
          body: "Keywords like flooding, gas leak, no heat, or burst route straight to your on-call tech. You set the rules.",
        },
        {
          title: "Texts you the job",
          body: "Every call ends with an SMS: caller name, number, service, language, urgency, next step. One thumb to dispatch.",
        },
      ],
    },
    demoSection: {
      kicker: "Hear her handle a real call",
      h2: "Don't trust us. Trust your own ears.",
      sub: "Click below. Talk to Maria the way your customers will. Try English or Spanish — she switches mid-sentence. Under a minute, no signup, mic on.",
    },
    pricing: {
      kicker: "Pricing",
      h2: "One plan. Flat rate. No per-call surprises.",
      sub: "Every feature above is included. Unlimited calls. Bilingual included. No setup fees. No per-minute charges.",
      price: "$497",
      period: "/month",
      annual: "Or $4,764 a year — that's $397/mo and saves you $1,200.",
      includes: [
        "Unlimited calls",
        "Bilingual EN / ES",
        "Appointment booking",
        "Emergency detection",
        "SMS job briefs",
        "Forward your existing number",
      ],
      primary: "Get Capta",
      trial: "14-day free trial · card required · cancel anytime before day 14",
      vsHuman: "A bilingual receptionist costs $3,600 / month.",
      vsHumanDetail: "Full-time compensation in Texas metros ($45–55k/yr) plus payroll tax and benefits. She works 40 hours a week. Maria runs 168 for $497.",
    },
    faq: {
      kicker: "Common questions",
      h2: "The real objections.",
      sub: "The things every contractor asks before handing their phone to an AI.",
      items: [
        {
          q: "Will my customers know they're talking to AI?",
          a: "Most don't. Maria uses natural speech, handles interruptions, and adapts tone. If a caller asks directly whether they're talking to a human, she answers honestly — that's the law in most states, and it's the right move for trust.",
        },
        {
          q: "What if she screws up a call and I lose a customer?",
          a: "Every call is transcribed and summarized. You see exactly what she said and what the caller said. If you spot a mistake, tell us once — she learns. In the first two weeks of your trial, we review every flagged call with you personally.",
        },
        {
          q: "What if there's a real emergency?",
          a: "Maria is trained to detect emergency keywords — flooding, gas leak, no heat in winter, burst pipe, fire. She immediately transfers the call to your designated emergency number and sends you an SMS alert.",
        },
        {
          q: "Do I have to change my phone number?",
          a: "No. You keep your existing business number. You forward the calls to Maria. Your customers dial the same number they've always dialed — they just notice someone always picks up now.",
        },
        {
          q: "What if I want to cancel?",
          a: "Cancel anytime before day 14 of your trial and pay nothing — from your dashboard, no phone call required. After the trial, cancel any month with no fees.",
        },
      ],
      more: "See all questions",
    },
    finalCta: {
      kicker: "14-day free trial · No setup fees",
      h2a: "Your phone is ringing.",
      h2b: "Let Maria answer it.",
      sub: "Forward your number today. She's live tomorrow. Every call answered, every job texted to you — $497 a month, flat.",
      primary: "Get Capta",
      note: "Flat $497/mo · Unlimited calls · Bilingual EN/ES · Cancel anytime",
    },
    footer: {
      tagline: "The AI receptionist that never misses a call. Built for home service businesses. San Antonio, Texas.",
      product: "Product",
      company: "Company",
      legal: "Legal",
      compliance: "TCPA compliant · Data encrypted in transit and at rest",
      copyright: "© 2026 Capta LLC. All rights reserved.",
    },
  },

  es: {
    nav: {
      platform: "Plataforma",
      pricing: "Precios",
      about: "Acerca",
      faq: "Preguntas",
      blog: "Blog",
      login: "Entrar",
      cta: "Obtener Capta",
    },
    hero: {
      kicker: "Recepcionista IA para oficios",
      h1: "Nunca pierdas una llamada.",
      sub:
        "María contesta tu teléfono en inglés y español, 24/7 — agenda trabajos, toma mensajes y te manda los detalles por SMS antes de que el cliente cuelgue.",
      pitch: "Ella contesta. Ella cotiza. Ella da seguimiento. Tú haces el trabajo.",
      primary: "Obtener Capta",
      secondary: "Cómo funciona",
      orCall: "O llama al",
      trust: ["Cobertura 24/7", "Bilingüe EN / ES", "$497/mes fijo", "Prueba de 14 días"],
    },
    problem: {
      kicker: "El problema",
      h2a: "Cada llamada perdida es un trabajo",
      h2b: "que se va al siguiente negocio de la lista.",
      stat1Num: "62%",
      stat1Label: "de llamadas a negocios de servicios del hogar no se contestan.",
      stat2Num: "80%",
      stat2Label: "de esos clientes no dejan mensaje de voz.",
      body:
        "Estás en un techo. Tu teléfono suena. No puedes contestar. El cliente cuelga y llama al siguiente plomero, técnico de HVAC o electricista en los resultados. Ese es el trabajo que perdiste — y las tres referencias después.",
      roiPre: "3 llamadas perdidas a la semana × $800 trabajo promedio = ",
      roiLink: "calcula tus propios números",
    },
    how: {
      kicker: "Cómo funciona",
      h2: "Tres pasos. En vivo mañana.",
      sub: "Sin app para tus clientes. Sin número nuevo que memorizar. Reenvías tu línea actual y María contesta.",
      steps: [
        {
          title: "1 — Regístrate en 5 minutos",
          body: "Dile a María el nombre de tu negocio, tus horas y los servicios que ofreces. Elige una voz. Está entrenada en tu oficio.",
        },
        {
          title: "2 — Reenvía tu número",
          body: "Una llamada a tu proveedor o un ajuste en tu iPhone. Tu número actual se queda igual. Tus clientes no notan la diferencia.",
        },
        {
          title: "3 — Ella contesta. Tú recibes SMS.",
          body: "Cada llamada: el trabajo, la dirección, el idioma, la urgencia — por SMS antes de que el cliente cuelgue. Las citas llegan a tu calendario.",
        },
      ],
    },
    features: {
      kicker: "Qué hace ella",
      h2: "Todo lo que hace una recepcionista. Más las horas.",
      sub: "Una recepcionista humana cuesta $3,600 al mes, habla un idioma, trabaja 40 horas a la semana y se enferma. María cuesta $497 al mes y trabaja 168 horas en dos idiomas.",
      items: [
        {
          title: "Contestación 24 / 7",
          body: "Volumen de llamadas ilimitado, sin tono de ocupado, sin buzón. Contesta en menos de dos timbres siempre.",
        },
        {
          title: "Nativamente bilingüe",
          body: "Inglés y español, cambio a mitad de llamada. No es traducción — habla nativa en ambos idiomas.",
        },
        {
          title: "Agenda citas",
          body: "Acceso en vivo a tu calendario. María ofrece ventanas disponibles, confirma el trabajo y le manda SMS al cliente con la hora.",
        },
        {
          title: "Califica el lead",
          body: "Hace las preguntas correctas para tu oficio — problema, tipo de propiedad, urgencia — y califica antes de que llegue a tu teléfono.",
        },
        {
          title: "Detecta emergencias",
          body: "Palabras como inundación, fuga de gas, sin calefacción o reventado se enrutan directo a tu técnico de guardia. Tú pones las reglas.",
        },
        {
          title: "Te manda el trabajo por SMS",
          body: "Cada llamada termina con un SMS: nombre, número, servicio, idioma, urgencia, siguiente paso. Un pulgar para despachar.",
        },
      ],
    },
    demoSection: {
      kicker: "Escucha una llamada real",
      h2: "No nos creas. Cree a tus oídos.",
      sub: "Haz clic abajo. Habla con María como lo harán tus clientes. Prueba en inglés o español — cambia a mitad de frase. Menos de un minuto, sin registro, micrófono activo.",
    },
    pricing: {
      kicker: "Precios",
      h2: "Un plan. Tarifa fija. Sin sorpresas.",
      sub: "Todo lo de arriba está incluido. Llamadas ilimitadas. Bilingüe incluido. Sin costos de instalación. Sin cargos por minuto.",
      price: "$497",
      period: "/mes",
      annual: "O $4,764 al año — eso es $397/mes y te ahorra $1,200.",
      includes: [
        "Llamadas ilimitadas",
        "Bilingüe EN / ES",
        "Agenda de citas",
        "Detección de emergencias",
        "Resúmenes por SMS",
        "Reenvía tu número actual",
      ],
      primary: "Obtener Capta",
      trial: "Prueba gratis de 14 días · tarjeta requerida · cancela antes del día 14",
      vsHuman: "Una recepcionista bilingüe cuesta $3,600 al mes.",
      vsHumanDetail: "Compensación a tiempo completo en metros de Texas ($45–55k/año) más impuestos y beneficios. Trabaja 40 horas a la semana. María trabaja 168 por $497.",
    },
    faq: {
      kicker: "Preguntas comunes",
      h2: "Las objeciones reales.",
      sub: "Lo que todo contratista pregunta antes de poner su teléfono en manos de una IA.",
      items: [
        {
          q: "¿Mis clientes sabrán que están hablando con una IA?",
          a: "La mayoría no. María usa habla natural, maneja interrupciones y adapta el tono. Si un cliente pregunta directamente si está hablando con un humano, ella contesta con honestidad — es la ley en la mayoría de estados y es lo correcto para la confianza.",
        },
        {
          q: "¿Qué pasa si se equivoca y pierdo un cliente?",
          a: "Cada llamada se transcribe y se resume. Ves exactamente qué dijo ella y qué dijo el cliente. Si detectas un error, nos dices una vez — ella aprende. En las primeras dos semanas de tu prueba, revisamos cada llamada marcada contigo personalmente.",
        },
        {
          q: "¿Qué pasa si hay una emergencia real?",
          a: "María detecta palabras de emergencia — inundación, fuga de gas, sin calefacción en invierno, tubería rota, fuego. Transfiere la llamada inmediatamente a tu número de emergencia y te manda una alerta por SMS.",
        },
        {
          q: "¿Tengo que cambiar mi número de teléfono?",
          a: "No. Mantienes tu número actual. Reenvías las llamadas a María. Tus clientes marcan el mismo número de siempre — solo notan que alguien siempre contesta ahora.",
        },
        {
          q: "¿Qué pasa si quiero cancelar?",
          a: "Cancela antes del día 14 de tu prueba y no pagas nada — desde tu panel, sin llamadas. Después de la prueba, cancela cualquier mes sin cargos.",
        },
      ],
      more: "Ver todas las preguntas",
    },
    finalCta: {
      kicker: "Prueba gratis de 14 días · Sin costos de instalación",
      h2a: "Tu teléfono está sonando.",
      h2b: "Deja que María conteste.",
      sub: "Reenvía tu número hoy. Está en vivo mañana. Cada llamada contestada, cada trabajo por SMS — $497 al mes, fijo.",
      primary: "Obtener Capta",
      note: "$497/mes fijo · Llamadas ilimitadas · Bilingüe EN/ES · Cancela cuando quieras",
    },
    footer: {
      tagline: "La recepcionista IA que nunca pierde una llamada. Hecha para negocios de servicios del hogar. San Antonio, Texas.",
      product: "Producto",
      company: "Empresa",
      legal: "Legal",
      compliance: "Cumple con TCPA · Datos encriptados en tránsito y en reposo",
      copyright: "© 2026 Capta LLC. Todos los derechos reservados.",
    },
  },
};

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

type Props = { initialLang?: Lang };

export default function HomeClient({ initialLang = "en" }: Props) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("capta-lang");
    if (stored === "en" || stored === "es") setLang(stored);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = useCallback((l: Lang) => {
    setLang(l);
    if (typeof window !== "undefined") window.localStorage.setItem("capta-lang", l);
  }, []);

  const t = COPY[lang];
  const setupHref = lang === "es" ? "/es/setup" : "/setup";
  const base = lang === "es" ? "/es" : "";

  return (
    <div
      style={{
        background: C.truck,
        color: C.ink,
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        fontFeatureSettings: '"ss01", "cv11"',
      }}
      className="min-h-screen overflow-x-hidden"
    >
      {/* Skip link */}
      <a
        href="#main"
        style={{
          position: "absolute",
          top: -40,
          left: 0,
          background: C.ink,
          color: C.truck,
          padding: "8px 12px",
          fontSize: 14,
          fontWeight: 700,
          zIndex: 100,
          textDecoration: "none",
        }}
        onFocus={(e) => (e.currentTarget.style.top = "0")}
        onBlur={(e) => (e.currentTarget.style.top = "-40px")}
      >
        {lang === "es" ? "Saltar al contenido" : "Skip to content"}
      </a>

      {/* ═══════════════════════════════════════════════════════════
          NAV — sticky white bg, navy text, gold CTA
          ═══════════════════════════════════════════════════════════ */}
      <header
        style={{
          background: C.white,
          borderBottom: `1px solid ${C.border}`,
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <nav className="mx-auto flex max-w-[1280px] items-center justify-between px-6 sm:px-10 py-4">
          <a href={base === "" ? "/" : "/es"} className="flex items-center">
            <Image
              src="/images/logo-inline-navy.webp"
              alt="Capta"
              width={120}
              height={32}
              priority
              className="h-8 w-auto"
            />
          </a>

          <div
            className="hidden items-center gap-8 md:flex"
            style={{ fontSize: 14, fontWeight: 600, color: C.inkMuted }}
          >
            {[
              { label: t.nav.platform, href: base + "/platform" },
              { label: t.nav.pricing, href: base + "/pricing" },
              { label: t.nav.about, href: base + "/about" },
              { label: t.nav.faq, href: base + "/faq" },
              { label: t.nav.blog, href: base + "/blog" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{ color: C.inkMuted, transition: "color 150ms" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.ink)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.inkMuted)}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1" style={{ fontSize: 11 }}>
              <button
                onClick={() => toggleLang("en")}
                aria-pressed={lang === "en"}
                style={{
                  padding: "4px 8px",
                  fontWeight: lang === "en" ? 800 : 500,
                  color: lang === "en" ? C.ink : C.inkSoft,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  minHeight: 44,
                  minWidth: 44,
                }}
              >
                EN
              </button>
              <span style={{ color: C.inkSoft }}>/</span>
              <button
                onClick={() => toggleLang("es")}
                aria-pressed={lang === "es"}
                style={{
                  padding: "4px 8px",
                  fontWeight: lang === "es" ? 800 : 500,
                  color: lang === "es" ? C.ink : C.inkSoft,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  minHeight: 44,
                  minWidth: 44,
                }}
              >
                ES
              </button>
            </div>

            <a
              href="/dashboard/login"
              className="hidden text-sm font-semibold md:inline-block"
              style={{ color: C.inkMuted }}
            >
              {t.nav.login}
            </a>

            <GoldButton href={setupHref} size="sm">
              {t.nav.cta}
            </GoldButton>

            <button
              type="button"
              className="md:hidden"
              aria-label="Menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                padding: 10,
                color: C.ink,
                border: `1px solid ${C.border}`,
                background: C.white,
                minHeight: 44,
                minWidth: 44,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mobileOpen ? <path d="M18 6L6 18M6 6l12 12" /> : (
                  <>
                    <path d="M4 6h16" />
                    <path d="M4 12h16" />
                    <path d="M4 18h16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <div
            className="md:hidden"
            style={{
              borderTop: `1px solid ${C.border}`,
              background: C.white,
              padding: "20px 24px 24px",
            }}
          >
            <div className="flex flex-col gap-4" style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>
              {[
                { label: t.nav.platform, href: base + "/platform" },
                { label: t.nav.pricing, href: base + "/pricing" },
                { label: t.nav.about, href: base + "/about" },
                { label: t.nav.faq, href: base + "/faq" },
                { label: t.nav.blog, href: base + "/blog" },
                { label: t.nav.login, href: "/dashboard/login" },
              ].map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>
                  {l.label}
                </a>
              ))}
              <div
                className="flex items-center gap-2 pt-3"
                style={{ borderTop: `1px solid ${C.border}` }}
              >
                <button
                  onClick={() => toggleLang("en")}
                  style={{ padding: "8px 14px", fontWeight: lang === "en" ? 800 : 500, color: lang === "en" ? C.ink : C.inkSoft, textTransform: "uppercase", letterSpacing: "0.14em", fontSize: 12, minHeight: 44 }}
                >
                  EN
                </button>
                <span style={{ color: C.inkSoft }}>/</span>
                <button
                  onClick={() => toggleLang("es")}
                  style={{ padding: "8px 14px", fontWeight: lang === "es" ? 800 : 500, color: lang === "es" ? C.ink : C.inkSoft, textTransform: "uppercase", letterSpacing: "0.14em", fontSize: 12, minHeight: 44 }}
                >
                  ES
                </button>
                <a
                  href={PHONE_TEL}
                  style={{
                    marginLeft: "auto",
                    fontSize: 13,
                    fontWeight: 700,
                    color: C.ink,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {PHONE}
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      <main id="main">
        {/* ═══════════════════════════════════════════════════════════
            HERO — Truck White
            ═══════════════════════════════════════════════════════════ */}
        <section style={{ background: C.truck }}>
          <div className="mx-auto max-w-[1280px] px-6 sm:px-10 pt-14 sm:pt-20 pb-20 sm:pb-28">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
              {/* Left — copy */}
              <div className="lg:col-span-7 flex flex-col">
                <Kicker>{t.hero.kicker}</Kicker>

                <h1
                  className="mt-6"
                  style={{
                    fontSize: "clamp(44px, 6.5vw, 88px)",
                    fontWeight: 900,
                    lineHeight: 0.95,
                    letterSpacing: "-0.035em",
                    color: C.ink,
                  }}
                >
                  {t.hero.h1}
                </h1>

                <p
                  className="mt-8 max-w-[560px]"
                  style={{ fontSize: 19, lineHeight: 1.5, color: C.inkMuted, fontWeight: 500 }}
                >
                  {t.hero.sub}
                </p>

                <p
                  className="mt-5 max-w-[560px]"
                  style={{
                    fontSize: 16,
                    lineHeight: 1.5,
                    color: C.ink,
                    fontWeight: 700,
                  }}
                >
                  {t.hero.pitch}
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <GoldButton href={setupHref} size="lg">
                    {t.hero.primary}
                  </GoldButton>
                  <OutlineButton href="#how" size="lg">
                    {t.hero.secondary}
                  </OutlineButton>
                </div>

                <div
                  className="mt-5 flex items-center gap-2"
                  style={{ fontSize: 14, color: C.inkMuted, fontWeight: 500 }}
                >
                  <span>{t.hero.orCall}</span>
                  <a
                    href={PHONE_TEL}
                    style={{
                      color: C.ink,
                      fontWeight: 700,
                      textDecoration: "underline",
                      textUnderlineOffset: 3,
                      textDecorationColor: C.border,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {PHONE}
                  </a>
                </div>

                {/* Trust bar */}
                <ul
                  className="mt-10 flex flex-wrap gap-x-6 gap-y-3"
                  style={{ fontSize: 13, color: C.inkMuted, fontWeight: 600 }}
                >
                  {t.hero.trust.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span
                        aria-hidden
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: C.gold,
                          display: "inline-block",
                        }}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right — live demo widget */}
              <div className="lg:col-span-5">
                <IndustrialDemoWidget lang={lang} phone={PHONE} phoneHref={PHONE_TEL} />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            PROBLEM — Navy (the dark moment #1)
            ═══════════════════════════════════════════════════════════ */}
        <section style={{ background: C.navy, color: C.truck }}>
          <div className="mx-auto max-w-[1280px] px-6 sm:px-10 py-20 sm:py-28">
            <div className="max-w-[880px]">
              <Kicker tone="dark">{t.problem.kicker}</Kicker>
              <h2
                className="mt-6"
                style={{
                  fontSize: "clamp(36px, 5vw, 64px)",
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  color: C.white,
                }}
              >
                <span>{t.problem.h2a} </span>
                <span style={{ color: C.gold }}>{t.problem.h2b}</span>
              </h2>
            </div>

            <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-7">
                <div className="flex flex-wrap gap-x-12 gap-y-8">
                  <StatBlock num={t.problem.stat1Num} label={t.problem.stat1Label} />
                  <StatBlock num={t.problem.stat2Num} label={t.problem.stat2Label} />
                </div>

                <p
                  className="mt-10 max-w-[560px]"
                  style={{
                    fontSize: 18,
                    lineHeight: 1.55,
                    color: "rgba(248,250,252,0.82)",
                    fontWeight: 500,
                  }}
                >
                  {t.problem.body}
                </p>
              </div>

              {/* ROI tease card */}
              <div className="lg:col-span-5 lg:mt-2">
                <div
                  style={{
                    border: `1px solid rgba(212,168,67,0.35)`,
                    background: C.midnight,
                    padding: 28,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: C.gold,
                      fontWeight: 800,
                    }}
                  >
                    {lang === "es" ? "Haz la cuenta" : "Do the math"}
                  </div>
                  <div className="mt-4" style={{ fontSize: 15, color: "rgba(248,250,252,0.82)", lineHeight: 1.5 }}>
                    {t.problem.roiPre}
                  </div>
                  <div
                    className="mt-2"
                    style={{
                      fontSize: 52,
                      fontWeight: 900,
                      color: C.gold,
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    $10,396
                  </div>
                  <div className="mt-3" style={{ fontSize: 13, color: "rgba(248,250,252,0.6)", fontWeight: 500 }}>
                    {lang === "es" ? "perdidos cada mes." : "lost every month."}
                  </div>

                  <a
                    href={base + "/roi-calculator"}
                    className="mt-6 inline-flex items-center gap-1.5"
                    style={{
                      color: C.white,
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: "underline",
                      textUnderlineOffset: 3,
                      textDecorationColor: "rgba(212,168,67,0.6)",
                    }}
                  >
                    {t.problem.roiLink}
                    <span>→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            HOW IT WORKS — Truck White
            ═══════════════════════════════════════════════════════════ */}
        <section id="how" style={{ background: C.truck }}>
          <div className="mx-auto max-w-[1280px] px-6 sm:px-10 py-20 sm:py-28">
            <div className="max-w-[760px]">
              <Kicker>{t.how.kicker}</Kicker>
              <h2 className="mt-6" style={displayH2(C.ink)}>
                {t.how.h2}
              </h2>
              <p className="mt-6 max-w-[560px]" style={bodyLead(C.inkMuted)}>
                {t.how.sub}
              </p>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
              {t.how.steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    border: `1px solid ${C.border}`,
                    background: C.white,
                    padding: 28,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: C.gold,
                      fontWeight: 800,
                    }}
                  >
                    {step.title}
                  </div>
                  <p className="mt-4" style={{ fontSize: 15, lineHeight: 1.55, color: C.ink, fontWeight: 500 }}>
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            FEATURES — Truck White, bento
            ═══════════════════════════════════════════════════════════ */}
        <section style={{ background: C.white, borderTop: `1px solid ${C.border}` }}>
          <div className="mx-auto max-w-[1280px] px-6 sm:px-10 py-20 sm:py-28">
            <div className="max-w-[760px]">
              <Kicker>{t.features.kicker}</Kicker>
              <h2 className="mt-6" style={displayH2(C.ink)}>
                {t.features.h2}
              </h2>
              <p className="mt-6 max-w-[640px]" style={bodyLead(C.inkMuted)}>
                {t.features.sub}
              </p>
            </div>

            <div className="mt-14 grid gap-0 md:grid-cols-3" style={{ border: `1px solid ${C.border}` }}>
              {t.features.items.map((item, i) => (
                <div
                  key={item.title}
                  style={{
                    padding: 28,
                    borderRight:
                      i % 3 !== 2 ? `1px solid ${C.border}` : "none",
                    borderBottom:
                      i < 3 ? `1px solid ${C.border}` : "none",
                    background: C.white,
                    minHeight: 220,
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      width: 8,
                      height: 8,
                      background: C.gold,
                      marginBottom: 18,
                    }}
                  />
                  <h3
                    style={{
                      fontSize: 19,
                      fontWeight: 800,
                      color: C.ink,
                      letterSpacing: "-0.015em",
                      lineHeight: 1.15,
                    }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-3" style={{ fontSize: 14, lineHeight: 1.55, color: C.inkMuted, fontWeight: 500 }}>
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            PRICING — Navy
            ═══════════════════════════════════════════════════════════ */}
        <section id="pricing" style={{ background: C.navy, color: C.truck }}>
          <div className="mx-auto max-w-[1280px] px-6 sm:px-10 py-20 sm:py-28">
            <div className="max-w-[760px]">
              <Kicker tone="dark">{t.pricing.kicker}</Kicker>
              <h2 className="mt-6" style={displayH2(C.white)}>
                {t.pricing.h2}
              </h2>
              <p className="mt-6 max-w-[640px]" style={bodyLead("rgba(248,250,252,0.75)")}>
                {t.pricing.sub}
              </p>
            </div>

            <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-14 items-start">
              {/* Price card */}
              <div
                className="lg:col-span-7"
                style={{
                  background: C.midnight,
                  border: `1px solid rgba(212,168,67,0.35)`,
                  padding: 40,
                }}
              >
                <div className="flex items-baseline gap-2">
                  <span
                    style={{
                      fontSize: "clamp(64px, 8vw, 96px)",
                      fontWeight: 900,
                      color: C.gold,
                      letterSpacing: "-0.04em",
                      lineHeight: 0.9,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {t.pricing.price}
                  </span>
                  <span
                    style={{
                      fontSize: 22,
                      color: "rgba(248,250,252,0.72)",
                      fontWeight: 600,
                    }}
                  >
                    {t.pricing.period}
                  </span>
                </div>

                <p
                  className="mt-4"
                  style={{
                    fontSize: 15,
                    color: "rgba(248,250,252,0.72)",
                    fontWeight: 500,
                  }}
                >
                  {t.pricing.annual}
                </p>

                <ul
                  className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2"
                  style={{ fontSize: 14, color: C.truck }}
                >
                  {t.pricing.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span
                        aria-hidden
                        style={{
                          color: C.green,
                          fontWeight: 800,
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        ✓
                      </span>
                      <span style={{ fontWeight: 500 }}>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <GoldButton href={setupHref} size="lg">
                    {t.pricing.primary}
                  </GoldButton>
                </div>
                <div
                  className="mt-4"
                  style={{
                    fontSize: 13,
                    color: "rgba(248,250,252,0.65)",
                    fontWeight: 500,
                  }}
                >
                  {t.pricing.trial}
                </div>
              </div>

              {/* VS human */}
              <div className="lg:col-span-5">
                <div
                  style={{
                    borderLeft: `3px solid ${C.gold}`,
                    paddingLeft: 24,
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(24px, 2.6vw, 32px)",
                      fontWeight: 800,
                      color: C.white,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
                    }}
                  >
                    {t.pricing.vsHuman}
                  </div>
                  <p
                    className="mt-5"
                    style={{
                      fontSize: 15,
                      lineHeight: 1.6,
                      color: "rgba(248,250,252,0.72)",
                      fontWeight: 500,
                    }}
                  >
                    {t.pricing.vsHumanDetail}
                  </p>

                  <div className="mt-8 grid grid-cols-2 gap-6">
                    <div>
                      <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(248,250,252,0.55)", fontWeight: 700 }}>
                        {lang === "es" ? "Humana" : "Human"}
                      </div>
                      <div
                        className="mt-2"
                        style={{
                          fontSize: 26,
                          fontWeight: 900,
                          color: C.white,
                          letterSpacing: "-0.02em",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        $3,600
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(248,250,252,0.55)", marginTop: 2, fontWeight: 500 }}>
                        {lang === "es" ? "40 hrs/sem · 1 idioma" : "40 hrs/wk · 1 language"}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, fontWeight: 800 }}>
                        {lang === "es" ? "María" : "Maria"}
                      </div>
                      <div
                        className="mt-2"
                        style={{
                          fontSize: 26,
                          fontWeight: 900,
                          color: C.gold,
                          letterSpacing: "-0.02em",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        $497
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(248,250,252,0.55)", marginTop: 2, fontWeight: 500 }}>
                        {lang === "es" ? "168 hrs/sem · 2 idiomas" : "168 hrs/wk · 2 languages"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            FAQ — Truck White
            ═══════════════════════════════════════════════════════════ */}
        <section style={{ background: C.truck }}>
          <div className="mx-auto max-w-[1280px] px-6 sm:px-10 py-20 sm:py-28">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-16 items-start">
              <div className="lg:col-span-5 lg:sticky lg:top-24">
                <Kicker>{t.faq.kicker}</Kicker>
                <h2 className="mt-6" style={displayH2(C.ink)}>
                  {t.faq.h2}
                </h2>
                <p className="mt-6 max-w-[400px]" style={bodyLead(C.inkMuted)}>
                  {t.faq.sub}
                </p>
                <a
                  href={base + "/faq"}
                  className="mt-8 inline-flex items-center gap-1.5"
                  style={{
                    color: C.ink,
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: "underline",
                    textUnderlineOffset: 4,
                    textDecorationColor: C.gold,
                    textDecorationThickness: 2,
                  }}
                >
                  {t.faq.more}
                  <span>→</span>
                </a>
              </div>

              <div className="lg:col-span-7">
                <div style={{ borderTop: `1px solid ${C.border}` }}>
                  {t.faq.items.map((item, i) => (
                    <details
                      key={i}
                      open={openFaq === i}
                      onToggle={(e) => {
                        if ((e.target as HTMLDetailsElement).open) setOpenFaq(i);
                        else if (openFaq === i) setOpenFaq(null);
                      }}
                      style={{
                        borderBottom: `1px solid ${C.border}`,
                        background: C.white,
                      }}
                    >
                      <summary
                        style={{
                          listStyle: "none",
                          cursor: "pointer",
                          padding: "20px 24px",
                          fontSize: 17,
                          fontWeight: 700,
                          color: C.ink,
                          letterSpacing: "-0.005em",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                        }}
                      >
                        <span>{item.q}</span>
                        <span
                          aria-hidden
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: C.gold,
                            flexShrink: 0,
                            transition: "transform 200ms",
                            transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                            display: "inline-block",
                          }}
                        >
                          +
                        </span>
                      </summary>
                      <div
                        style={{
                          padding: "0 24px 24px",
                          fontSize: 15,
                          lineHeight: 1.6,
                          color: C.inkMuted,
                          fontWeight: 500,
                          maxWidth: 620,
                        }}
                      >
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            FINAL CTA — Navy
            ═══════════════════════════════════════════════════════════ */}
        <section style={{ background: C.navy, color: C.truck }}>
          <div className="mx-auto max-w-[1280px] px-6 sm:px-10 py-20 sm:py-28">
            <div className="max-w-[880px]">
              <Kicker tone="dark">{t.finalCta.kicker}</Kicker>
              <h2
                className="mt-6"
                style={{
                  fontSize: "clamp(40px, 6vw, 80px)",
                  fontWeight: 900,
                  lineHeight: 0.95,
                  letterSpacing: "-0.035em",
                  color: C.white,
                }}
              >
                <span style={{ display: "block" }}>{t.finalCta.h2a}</span>
                <span style={{ display: "block", color: C.gold }}>{t.finalCta.h2b}</span>
              </h2>

              <p
                className="mt-8 max-w-[640px]"
                style={{
                  fontSize: 19,
                  lineHeight: 1.5,
                  color: "rgba(248,250,252,0.82)",
                  fontWeight: 500,
                }}
              >
                {t.finalCta.sub}
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <GoldButton href={setupHref} size="lg">
                  {t.finalCta.primary}
                </GoldButton>
                <a
                  href={PHONE_TEL}
                  style={{
                    color: C.white,
                    fontSize: 15,
                    fontWeight: 700,
                    textDecoration: "underline",
                    textUnderlineOffset: 4,
                    textDecorationColor: "rgba(212,168,67,0.6)",
                    textDecorationThickness: 2,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {PHONE}
                </a>
              </div>

              <div
                className="mt-8 pt-6"
                style={{
                  borderTop: `1px solid rgba(248,250,252,0.18)`,
                  fontSize: 13,
                  color: "rgba(248,250,252,0.65)",
                  fontWeight: 500,
                }}
              >
                {t.finalCta.note}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER — Midnight
          ═══════════════════════════════════════════════════════════ */}
      <footer style={{ background: C.midnight, color: "rgba(248,250,252,0.72)" }}>
        <div className="mx-auto max-w-[1280px] px-6 sm:px-10 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <Image
                src="/images/logo-inline-white.webp"
                alt="Capta"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
              <p className="mt-6 max-w-[360px]" style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(248,250,252,0.55)" }}>
                {t.footer.tagline}
              </p>
            </div>

            <FooterColumn
              title={t.footer.product}
              links={[
                { label: t.nav.platform, href: base + "/platform" },
                { label: t.nav.pricing, href: base + "/pricing" },
                { label: lang === "es" ? "ROI" : "ROI calculator", href: base + "/roi-calculator" },
                { label: lang === "es" ? "Estado" : "Status", href: "/status" },
              ]}
            />

            <FooterColumn
              title={t.footer.company}
              links={[
                { label: t.nav.about, href: base + "/about" },
                { label: t.nav.blog, href: base + "/blog" },
                { label: t.nav.faq, href: base + "/faq" },
                { label: lang === "es" ? "Ayuda" : "Help", href: base + "/help" },
              ]}
            />

            <FooterColumn
              title={t.footer.legal}
              links={[
                { label: lang === "es" ? "Términos" : "Terms", href: "/legal/terms" },
                { label: lang === "es" ? "Privacidad" : "Privacy", href: "/legal/privacy" },
                { label: "DPA", href: "/legal/dpa" },
                { label: lang === "es" ? "Sub-procesadores" : "Sub-processors", href: "/legal/subprocessors" },
              ]}
            />
          </div>

          <div
            className="mt-14 pt-8 flex flex-wrap items-center justify-between gap-4"
            style={{
              borderTop: `1px solid rgba(248,250,252,0.1)`,
              fontSize: 12,
              color: "rgba(248,250,252,0.45)",
              fontWeight: 500,
            }}
          >
            <div>{t.footer.copyright}</div>
            <div className="flex items-center gap-3">
              <span style={{ color: "rgba(212,168,67,0.75)" }}>●</span>
              <span>{t.footer.compliance}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LOCAL PRIMITIVES
   ═══════════════════════════════════════════════════════════════════ */

function displayH2(color: string): React.CSSProperties {
  return {
    fontSize: "clamp(34px, 4.2vw, 56px)",
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: "-0.03em",
    color,
  };
}

function bodyLead(color: string): React.CSSProperties {
  return {
    fontSize: 18,
    lineHeight: 1.55,
    color,
    fontWeight: 500,
  };
}

function Kicker({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <div
      style={{
        color: C.gold,
        fontSize: 12,
        letterSpacing: "0.22em",
        fontWeight: 800,
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 40,
          height: 4,
          background: C.gold,
          display: "inline-block",
        }}
      />
      <span style={{ color: tone === "dark" ? C.gold : C.gold }}>{children}</span>
    </div>
  );
}

function StatBlock({ num, label }: { num: string; label: string }) {
  return (
    <div style={{ maxWidth: 280 }}>
      <div
        style={{
          fontSize: "clamp(56px, 7vw, 88px)",
          fontWeight: 900,
          color: C.gold,
          letterSpacing: "-0.04em",
          lineHeight: 0.9,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {num}
      </div>
      <div
        className="mt-3"
        style={{
          fontSize: 15,
          color: "rgba(248,250,252,0.82)",
          lineHeight: 1.4,
          fontWeight: 500,
          maxWidth: 260,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function GoldButton({
  href,
  children,
  size = "md",
}: {
  href: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const pad = size === "lg" ? "15px 24px" : size === "sm" ? "9px 16px" : "12px 20px";
  const fs = size === "lg" ? 16 : size === "sm" ? 13 : 14;
  return (
    <a
      href={href}
      style={{
        background: C.gold,
        color: C.midnight,
        fontSize: fs,
        fontWeight: 800,
        padding: pad,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        border: `1px solid ${C.gold}`,
        textDecoration: "none",
        letterSpacing: "-0.005em",
        transition: "background 150ms",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = C.goldDark)}
      onMouseLeave={(e) => (e.currentTarget.style.background = C.gold)}
    >
      {children}
      <span style={{ fontWeight: 700 }}>→</span>
    </a>
  );
}

function OutlineButton({
  href,
  children,
  size = "md",
}: {
  href: string;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  const pad = size === "lg" ? "14px 22px" : "11px 18px";
  const fs = size === "lg" ? 16 : 14;
  return (
    <a
      href={href}
      style={{
        background: "transparent",
        color: C.ink,
        fontSize: fs,
        fontWeight: 700,
        padding: pad,
        border: `1px solid ${C.ink}`,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        textDecoration: "none",
        letterSpacing: "-0.005em",
        transition: "all 150ms",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = C.ink;
        e.currentTarget.style.color = C.white;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = C.ink;
      }}
    >
      {children}
    </a>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="lg:col-span-2">
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(248,250,252,0.55)",
          fontWeight: 800,
          marginBottom: 14,
        }}
      >
        {title}
      </div>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              style={{
                fontSize: 14,
                color: "rgba(248,250,252,0.72)",
                fontWeight: 500,
                textDecoration: "none",
                transition: "color 150ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(248,250,252,0.72)")}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
