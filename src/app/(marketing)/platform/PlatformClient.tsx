"use client";

/**
 * Platform page — Field Manual direction.
 * Reads like a product manual: chapters, features, proof.
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
} from "@/components/marketing/industrial";

/* ═══════════════════════════════════════════════════════════════
   COPY
   ═══════════════════════════════════════════════════════════════ */

type Feature = { label: string; title: string; desc: string };
type Chapter = { id: string; num: string; title: string; kicker: string; features: Feature[] };

type Copy = {
  hero: { kicker: string; h1a: string; h1b: string; sub: string };
  chapters: Chapter[];
  tabLabel: string;
  includedLabel: string;
  includedSuffix: (n: number) => string;
  cta: { kicker: string; h2: string; sub: string; primary: string; secondary: string };
};

const COPY: Record<Lang, Copy> = {
  en: {
    hero: {
      kicker: "Platform",
      h1a: "Everything included",
      h1b: "for a front office that runs itself.",
      sub:
        "Capta is 24 core capabilities organized into four areas — answering, running the office by SMS, recovering revenue, and closing new customers. Every one included at $497 a month.",
    },
    tabLabel: "Category",
    includedLabel: "Included in your $497 / month plan",
    includedSuffix: (n) => `${n} capabilities, already wired`,
    chapters: [
      {
        id: "answering",
        num: "01",
        title: "Answering",
        kicker: "Every call. In any language. Immediately.",
        features: [
          { label: "01", title: "Bilingual voice", desc: "Capta detects the caller's language on the first word and answers in English or Spanish. Same phone, same receptionist, no separate line." },
          { label: "02", title: "24 / 7 coverage", desc: "Capta answers after hours, on weekends, during holidays, during jobs. Every call. No voicemail." },
          { label: "03", title: "Trade-aware intake", desc: "Capta knows HVAC from plumbing from electrical. Asks the right questions, captures the right details." },
          { label: "04", title: "Emergency detection", desc: "Detects \"no AC with a baby\" or \"water through the ceiling\" and escalates to your on-call tech the same minute." },
          { label: "05", title: "Live transfer", desc: "If a caller needs a human right now, Capta bridges the call to your phone cleanly. No hold music." },
          { label: "06", title: "Job-card SMS", desc: "Every call that converts becomes a one-tap text to you with name, address, service, and estimate range." },
        ],
      },
      {
        id: "ops",
        num: "02",
        title: "Run the office",
        kicker: "Dispatch, invoice, schedule — by text.",
        features: [
          { label: "07", title: "Text-to-dispatch", desc: "\"Send Mike to the 2pm emergency\" — Capta notifies the tech, sends the address, confirms receipt." },
          { label: "08", title: "Text-to-invoice", desc: "\"$450 to Garcia for today's job\" — invoice sent via SMS with a payment link. Due in 30." },
          { label: "09", title: "Text-to-schedule", desc: "\"What's on Thursday?\" — Capta reads back the day in one message. Move jobs by text." },
          { label: "10", title: "Morning briefing", desc: "Daily SMS at the hour you pick. Today's jobs, yesterday's close rate, this week's outstanding estimates." },
          { label: "11", title: "Weekly digest", desc: "Friday: calls answered, appointments booked, revenue, after-hours catch, language mix, win rate." },
          { label: "12", title: "Monthly ROI", desc: "First of the month: what Capta made you, what it would have cost to get it another way." },
        ],
      },
      {
        id: "recovery",
        num: "03",
        title: "Recover revenue",
        kicker: "The jobs you thought you lost.",
        features: [
          { label: "13", title: "Missed-call recovery", desc: "Any call under 15 seconds gets a personalized SMS within 60 seconds: \"Sorry we missed you — what can we help with?\"" },
          { label: "14", title: "Estimate follow-up", desc: "Three-step drip to quoted leads who didn't book. Stops the moment they respond or book." },
          { label: "15", title: "Callback scheduler", desc: "When Capta can't close, it schedules you a callback window the caller committed to." },
          { label: "16", title: "Review requests", desc: "Automatic Google review ask after completed jobs. Negative reviews routed to you before they post." },
          { label: "17", title: "Seasonal re-engagement", desc: "Contacts past customers before their trade's peak season. AC tune-ups in March. Drain cleaning in November." },
          { label: "18", title: "Customer recall", desc: "If a customer hasn't been back in 12 months, Capta reaches out with the service they last bought." },
        ],
      },
      {
        id: "growth",
        num: "04",
        title: "Close new customers",
        kicker: "Captured, qualified, booked.",
        features: [
          { label: "19", title: "Google Calendar sync", desc: "Real-time availability — Capta books into your calendar live, never double-books." },
          { label: "20", title: "Customer CRM", desc: "Every caller becomes a record: name, phone, language, lifetime value, last 10 calls, notes." },
          { label: "21", title: "Lead scoring", desc: "Hot / warm / cold scored on call content, job size, urgency, and past customer value." },
          { label: "22", title: "Referral program", desc: "Automated partner referrals — plumbers send HVAC leads, electricians send plumbing leads." },
          { label: "23", title: "Self-service portal", desc: "Every customer gets a magic link to view invoices, estimates, appointments, and send questions." },
          { label: "24", title: "Analytics dashboard", desc: "Calls, trends, close rate, average ticket, top services, language mix — all in one place." },
        ],
      },
    ],
    cta: {
      kicker: "All capabilities included",
      h2: "Ready to hand over the phone?",
      sub: "14 days free. No setup. Your number stays yours.",
      primary: "Get Capta",
      secondary: "See pricing",
    },
  },
  es: {
    hero: {
      kicker: "Plataforma",
      h1a: "Todo incluido",
      h1b: "para una oficina que se maneja sola.",
      sub:
        "Capta son 24 capacidades principales organizadas en cuatro áreas — contestar, manejar la oficina por SMS, recuperar ingresos, y cerrar clientes nuevos. Cada una incluida por $497 al mes.",
    },
    tabLabel: "Categoría",
    includedLabel: "Incluido en tu plan de $497 / mes",
    includedSuffix: (n) => `${n} capacidades, ya conectadas`,
    chapters: [
      {
        id: "answering",
        num: "01",
        title: "Contestar",
        kicker: "Cada llamada. En cualquier idioma. Inmediatamente.",
        features: [
          { label: "01", title: "Voz bilingüe", desc: "Capta detecta el idioma del llamante en la primera palabra y contesta en inglés o español. Mismo teléfono, mismo número, sin línea separada." },
          { label: "02", title: "Cobertura 24 / 7", desc: "Contesta fuera de horario, fines de semana, días festivos, durante los trabajos. Cada llamada. Sin buzón de voz." },
          { label: "03", title: "Admisión por oficio", desc: "Conoce HVAC de plomería de eléctrico. Hace las preguntas correctas, captura los detalles correctos." },
          { label: "04", title: "Detección de emergencias", desc: "Detecta \"sin aire con un bebé\" o \"agua por el techo\" y escala al técnico de guardia en el mismo minuto." },
          { label: "05", title: "Transferencia en vivo", desc: "Si un llamante necesita una persona en ese momento, conecta la llamada a tu teléfono limpiamente. Sin música de espera." },
          { label: "06", title: "Tarjeta SMS del trabajo", desc: "Cada llamada que convierte se vuelve un texto de un toque con nombre, dirección, servicio, y rango de estimado." },
        ],
      },
      {
        id: "ops",
        num: "02",
        title: "Manejar la oficina",
        kicker: "Despacha, factura, agenda — por texto.",
        features: [
          { label: "07", title: "Texto-a-despacho", desc: "\"Manda a Mike a la emergencia de las 2pm\" — notifica al técnico, manda la dirección, confirma recepción." },
          { label: "08", title: "Texto-a-factura", desc: "\"$450 a Garcia por el trabajo de hoy\" — factura enviada por SMS con enlace de pago. Vence en 30 días." },
          { label: "09", title: "Texto-a-agenda", desc: "\"¿Qué hay el jueves?\" — te lee el día en un mensaje. Mueve trabajos por texto." },
          { label: "10", title: "Resumen matutino", desc: "SMS diario a la hora que eliges. Trabajos de hoy, tasa de cierre de ayer, estimados pendientes de esta semana." },
          { label: "11", title: "Digest semanal", desc: "Viernes: llamadas contestadas, citas agendadas, ingresos, captura fuera de horario, mezcla de idiomas, tasa de cierre." },
          { label: "12", title: "ROI mensual", desc: "Primero del mes: lo que Capta te generó, y lo que habría costado conseguirlo de otra manera." },
        ],
      },
      {
        id: "recovery",
        num: "03",
        title: "Recuperar ingresos",
        kicker: "Los trabajos que creías perdidos.",
        features: [
          { label: "13", title: "Recuperación de llamada perdida", desc: "Cualquier llamada menor a 15 segundos recibe un SMS personalizado en 60 segundos: \"Disculpa que no pudimos contestar — ¿en qué te ayudamos?\"" },
          { label: "14", title: "Seguimiento de estimado", desc: "Secuencia de tres pasos a clientes cotizados que no agendaron. Para en el momento que responden o agendan." },
          { label: "15", title: "Agendar llamada de vuelta", desc: "Cuando Capta no puede cerrar, te agenda una ventana de llamada que el cliente aceptó." },
          { label: "16", title: "Solicitudes de reseña", desc: "Pide reseña en Google automática después de trabajos terminados. Reseñas negativas se enrutan a ti antes de publicar." },
          { label: "17", title: "Re-compromiso estacional", desc: "Contacta a clientes pasados antes de la temporada alta de su oficio. Mantenimientos de AC en marzo. Limpieza de drenajes en noviembre." },
          { label: "18", title: "Recuerdo de cliente", desc: "Si un cliente no ha vuelto en 12 meses, Maria contacta con el servicio que compró la última vez." },
        ],
      },
      {
        id: "growth",
        num: "04",
        title: "Cerrar clientes nuevos",
        kicker: "Capturado, calificado, agendado.",
        features: [
          { label: "19", title: "Sincronización con Google Calendar", desc: "Disponibilidad en tiempo real — Maria agenda en tu calendario en vivo, nunca agenda doble." },
          { label: "20", title: "CRM de clientes", desc: "Cada llamante se vuelve un registro: nombre, teléfono, idioma, valor de vida, últimas 10 llamadas, notas." },
          { label: "21", title: "Puntaje de prospectos", desc: "Caliente / tibio / frío según contenido de llamada, tamaño del trabajo, urgencia, y valor pasado del cliente." },
          { label: "22", title: "Programa de referidos", desc: "Referidos automáticos entre oficios — plomeros mandan HVAC, electricistas mandan plomería." },
          { label: "23", title: "Portal de auto-servicio", desc: "Cada cliente recibe un enlace mágico para ver facturas, estimados, citas, y enviar preguntas." },
          { label: "24", title: "Panel de analíticas", desc: "Llamadas, tendencias, tasa de cierre, ticket promedio, servicios principales, mezcla de idiomas — todo en un lugar." },
        ],
      },
    ],
    cta: {
      kicker: "Todas las capacidades incluidas",
      h2: "¿Listo para entregar el teléfono?",
      sub: "14 días gratis. Sin instalación. Tu número sigue siendo tuyo.",
      primary: "Obtener Capta",
      secondary: "Ver precios",
    },
  },
};

const LANG_KEY = "capta-lang";

export default function PlatformClient({ initialLang }: { initialLang?: Lang } = {}) {
  const [lang, setLang] = useState<Lang>(initialLang ?? "en");
  const [activeChapter, setActiveChapter] = useState("answering");

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
  const active = t.chapters.find((c) => c.id === activeChapter) ?? t.chapters[0];

  return (
    <FieldFrame>
      <SkipLink lang={lang} />
      <FieldNav lang={lang} toggleLang={toggleLang} phone={PHONE} phoneHref={PHONE_TEL} />

      <main id="main">
      <Hero t={t} />

      <section className="mx-auto max-w-[1280px] px-6 sm:px-10 py-16 sm:py-24">
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            borderTop: `1px solid ${C.ink}`,
            borderBottom: `1px solid ${C.rule}`,
            gap: 0,
            overflowX: "auto",
          }}
        >
          {t.chapters.map((ch) => {
            const isActive = ch.id === activeChapter;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChapter(ch.id)}
                style={{
                  flex: "1 1 auto",
                  minWidth: 180,
                  padding: "20px 22px",
                  textAlign: "left",
                  background: isActive ? C.ink : "transparent",
                  color: isActive ? C.paper : C.ink,
                  cursor: "pointer",
                  transition: "all 150ms",
                  borderRight: `1px solid ${isActive ? C.ink : C.rule}`,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: isActive ? "rgba(248,245,238,0.6)" : C.inkMuted,
                    marginBottom: 6,
                  }}
                >
                  {t.tabLabel} {ch.num}
                </div>
                <div
                  style={{
                    
                    fontSize: 22,
                    fontWeight: 500,
                    letterSpacing: "-0.015em",
                    color: isActive ? C.paper : C.ink,
                  }}
                >
                  {ch.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active chapter content */}
        <div className="mt-16">
          <div className="max-w-2xl">
            <Kicker>
              {t.tabLabel} {active.num}
            </Kicker>
            <DisplayH2 style={{ marginTop: 20 }}>{active.kicker}</DisplayH2>
          </div>

          <div className="mt-14 grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {active.features.map((f) => (
              <article
                key={f.label}
                style={{
                  padding: "24px 22px 26px",
                  background: C.paper,
                  border: `1px solid ${C.rule}`,
                  borderRadius: 2,
                  position: "relative",
                }}
              >
                <Mono
                  style={{
                    position: "absolute",
                    top: 24,
                    right: 22,
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    color: C.inkSoft,
                    fontWeight: 700,
                  }}
                >
                  {f.label}
                </Mono>
                <h3
                  style={{
                    
                    fontSize: 22,
                    fontWeight: 500,
                    color: C.ink,
                    letterSpacing: "-0.015em",
                    lineHeight: 1.15,
                    paddingRight: 40,
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    marginTop: 12,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: C.inkMuted,
                  }}
                >
                  {f.desc}
                </p>
              </article>
            ))}
          </div>

          <div
            style={{
              marginTop: 36,
              padding: "18px 24px",
              background: C.paperDark,
              borderLeft: `3px solid ${C.amber}`,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: C.inkMuted, fontWeight: 700 }}>
              {t.includedLabel}
            </div>
            <div style={{ fontSize: 16, color: C.ink, fontStyle: "italic" }}>
              {t.includedSuffix(active.features.length)}
            </div>
          </div>
        </div>
      </section>

      <Rule />

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
            <div className="lg:col-span-5 flex flex-col gap-3" style={{ maxWidth: 420 }}>
              <PrimaryButton href={lang === "es" ? "/es/setup" : "/setup"} size="lg">
                {t.cta.primary}
              </PrimaryButton>
              <SecondaryButton href={lang === "es" ? "/es/pricing" : "/pricing"} size="lg">
                {t.cta.secondary}
              </SecondaryButton>
            </div>
          </div>
        </div>
      </section>

      </main>

      <FieldFooter lang={lang} phone={PHONE} phoneHref={PHONE_TEL} />
    </FieldFrame>
  );
}

function Hero({ t }: { t: Copy }) {
  return (
    <section className="mx-auto max-w-[1280px] px-6 sm:px-10 pt-14 pb-16 sm:pt-20 sm:pb-20">
      <div className="max-w-3xl">
        <Kicker>{t.hero.kicker}</Kicker>
        <DisplayH1 style={{ marginTop: 28 }}>
          {t.hero.h1a}
          <br />
          <em style={{ fontStyle: "italic", color: C.amberInk }}>
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
