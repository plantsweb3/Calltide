"use client";

/**
 * FAQ page — Field Manual direction.
 * Reading-friendly accordion organized by chapter.
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

type FaqItem = { q: string; a: string };
type FaqChapter = { num: string; title: string; items: FaqItem[] };

type Copy = {
  hero: { kicker: string; h1a: string; h1b: string; sub: string };
  chapters: FaqChapter[];
  cta: { kicker: string; h2: string; sub: string; primary: string; secondary: string };
};

const COPY: Record<Lang, Copy> = {
  en: {
    hero: {
      kicker: "Questions",
      h1a: "Real questions.",
      h1b: "Real answers.",
      sub:
        "Pulled from sales calls, setup conversations, and emails we get at 6 AM. If yours isn't here, text the number at the bottom of this page.",
    },
    chapters: [
      {
        num: "01",
        title: "The basics",
        items: [
          {
            q: "How does Capta work?",
            a: "You forward your existing number to the dedicated Twilio line we provision for your business. Every call routes to Maria, who answers in English or Spanish based on the caller's first word, takes the details, books into your calendar, and texts you a one-tap job card the second the call ends.",
          },
          {
            q: "Do I have to port my number?",
            a: "No. You keep your number. Call-forwarding takes about two minutes with any carrier — we send you the exact dial codes during setup.",
          },
          {
            q: "What does Capta sound like?",
            a: "Human. Indistinguishable from a thoughtful receptionist on a good call day. We use ElevenLabs voice synthesis tuned specifically for trades vocabulary.",
          },
          {
            q: "How long does setup take?",
            a: "About fifteen minutes. Seven steps: business info, hours, services, receptionist name, voice, trade-specific questions, payment. Capta is live the moment you forward your number.",
          },
        ],
      },
      {
        num: "02",
        title: "Pricing + billing",
        items: [
          {
            q: "Is the 14-day trial actually free?",
            a: "Yes. Card on file, but no charge for 14 days. Cancel by texting the word cancel to the number we give you. You keep any leads Capta booked.",
          },
          {
            q: "Is there a per-minute charge?",
            a: "No. $497 a month covers unlimited calls, unlimited SMS, unlimited tool use. We eat the carrier costs. The only upgrade is annual ($397/mo, save $1,200).",
          },
          {
            q: "What if I have multiple locations?",
            a: "One plan per location. We can set up multi-location billing with a call — each location gets its own dedicated Capta instance, trained on its own trade, hours, and service area.",
          },
          {
            q: "Do you offer refunds after the trial?",
            a: "Pro-rate refunds on annual plans for the unused portion. Monthly plans: cancel any time by text and you stop being billed the next cycle.",
          },
        ],
      },
      {
        num: "03",
        title: "What Capta can do",
        items: [
          {
            q: "Can Capta book into my calendar?",
            a: "Yes. We connect Google Calendar during setup. Capta sees real-time availability and never double-books. Outlook support is on the roadmap.",
          },
          {
            q: "Can Capta handle emergencies?",
            a: "Yes. Capta detects emergency language (\"water through ceiling,\" \"no AC with a baby,\" etc.) and escalates to your on-call tech by SMS inside the same minute.",
          },
          {
            q: "Can Capta send estimates?",
            a: "Yes. We train Capta on your pricing during setup — either ballpark ranges per service, or a full calculation engine with base rates and add-ons. The estimate goes via SMS before the caller hangs up.",
          },
          {
            q: "Will Capta transfer calls to me?",
            a: "Yes, if a caller needs a human in that moment and you've set a transfer number. Capta bridges the call cleanly. No hold music.",
          },
          {
            q: "Can I text Capta to run the office?",
            a: "Yes. Dispatch techs, send invoices, check the schedule, approve estimates, see stats — all by texting back. The full manual is at /platform.",
          },
        ],
      },
      {
        num: "04",
        title: "Spanish + bilingual",
        items: [
          {
            q: "How does Capta switch languages?",
            a: "Capta detects the caller's language on their very first word and responds in kind. Same phone number. No separate line, no menu, no press-1-for-English.",
          },
          {
            q: "Does Capta speak Mexican Spanish or South American?",
            a: "We tune for the region you tell us. Default is Mexican Spanish for Texas contractors. If you serve a different community, we retune the vocabulary and idioms during setup.",
          },
          {
            q: "Do Spanish calls get the same features?",
            a: "Identical. Estimates, booking, intake, emergency detection, SMS job cards — all work in Spanish. The dashboard shows you which calls came in Spanish so you can track the split.",
          },
        ],
      },
      {
        num: "05",
        title: "Data + privacy",
        items: [
          {
            q: "Who owns the call data?",
            a: "You do. Every recording, transcript, lead record, customer note — yours to export at any time. We use the data to run your business only; we do not train on your calls.",
          },
          {
            q: "Is the service TCPA-compliant?",
            a: "Yes. We follow TCPA for all SMS. Consent is captured at the point of call, opt-outs are honored immediately, quiet hours are enforced per state, and we maintain audit logs. If you're acquired or sold, the data is transferable.",
          },
          {
            q: "What about HIPAA?",
            a: "We don't currently sign BAAs. If you serve a regulated trade (medical, legal), we're not the right fit yet.",
          },
        ],
      },
    ],
    cta: {
      kicker: "More questions?",
      h2: "Text the number. We answer in minutes.",
      sub: "You'll get a real person during business hours, and Maria after hours.",
      primary: "Start 14-day free trial",
      secondary: "Read the platform manual",
    },
  },
  es: {
    hero: {
      kicker: "Preguntas",
      h1a: "Preguntas reales.",
      h1b: "Respuestas reales.",
      sub:
        "Sacadas de llamadas de venta, conversaciones de instalación, y correos que recibimos a las 6 AM. Si la tuya no está, escribe al número al pie de esta página.",
    },
    chapters: [
      {
        num: "01",
        title: "Lo básico",
        items: [
          {
            q: "¿Cómo funciona Capta?",
            a: "Desvías tu número actual al número de Twilio dedicado que te damos. Cada llamada va a Capta, que contesta en inglés o español según la primera palabra del llamante, toma los detalles, agenda en tu calendario, y te manda una tarjeta de trabajo por SMS al segundo que termina la llamada.",
          },
          {
            q: "¿Tengo que portar mi número?",
            a: "No. Te quedas con tu número. El desvío toma unos dos minutos con cualquier operador — te mandamos los códigos exactos durante la instalación.",
          },
          {
            q: "¿Cómo suena Capta?",
            a: "Humana. Indistinguible de una recepcionista atenta en un buen día. Usamos síntesis de voz de ElevenLabs afinada específicamente para vocabulario de oficios.",
          },
          {
            q: "¿Cuánto tarda la instalación?",
            a: "Unos quince minutos. Siete pasos: información del negocio, horas, servicios, nombre de la recepcionista, voz, preguntas del oficio, pago. Capta está en vivo al momento que desvías tu número.",
          },
        ],
      },
      {
        num: "02",
        title: "Precios + facturación",
        items: [
          {
            q: "¿La prueba de 14 días es de verdad gratis?",
            a: "Sí. Tarjeta registrada, pero sin cargo por 14 días. Cancela escribiendo la palabra cancelar al número que te damos. Te quedas con cualquier prospecto que agendó.",
          },
          {
            q: "¿Hay cargo por minuto?",
            a: "No. $497 al mes cubre llamadas, SMS, y uso de herramientas ilimitados. Nosotros absorbemos el costo del operador. La única mejora es anual ($397/mes, ahorras $1,200).",
          },
          {
            q: "¿Qué pasa si tengo varias ubicaciones?",
            a: "Un plan por ubicación. Podemos configurar facturación multi-ubicación con una llamada — cada ubicación recibe su propio Capta, entrenado en su propio oficio, horas, y área de servicio.",
          },
          {
            q: "¿Dan reembolsos después de la prueba?",
            a: "Reembolsos prorrateados en planes anuales por la porción no usada. Planes mensuales: cancela en cualquier momento por texto y dejas de ser facturado el siguiente ciclo.",
          },
        ],
      },
      {
        num: "03",
        title: "Lo que puede hacer",
        items: [
          {
            q: "¿Puede agendar en mi calendario?",
            a: "Sí. Conectamos Google Calendar durante la instalación. Capta ve disponibilidad en tiempo real y nunca agenda doble. Soporte de Outlook está en el roadmap.",
          },
          {
            q: "¿Puede manejar emergencias?",
            a: "Sí. Capta detecta lenguaje de emergencia (\"agua por el techo\", \"sin aire con un bebé\", etc.) y escala al técnico de guardia por SMS en el mismo minuto.",
          },
          {
            q: "¿Puede mandar estimados?",
            a: "Sí. Entrenamos a Capta con tus precios durante la instalación — ya sea rangos aproximados por servicio, o un motor de cálculo completo con tarifas base y adicionales. Manda el estimado por SMS antes de que el cliente cuelgue.",
          },
          {
            q: "¿Va a transferir llamadas a mí?",
            a: "Sí, si un cliente necesita una persona en ese momento y configuraste un número de transferencia. Capta puentea la llamada limpiamente. Sin música de espera.",
          },
          {
            q: "¿Puedo escribirle para manejar la oficina?",
            a: "Sí. Despacha técnicos, manda facturas, revisa la agenda, aprueba estimados, ve estadísticas — todo escribiéndole a Capta. El manual completo está en /platform.",
          },
        ],
      },
      {
        num: "04",
        title: "Español + bilingüe",
        items: [
          {
            q: "¿Cómo cambia idiomas?",
            a: "Capta detecta el idioma del llamante en la primera palabra y responde en consecuencia. Mismo número de teléfono. Sin línea separada, sin menú, sin presione-1-para-español.",
          },
          {
            q: "¿Habla español mexicano o sudamericano?",
            a: "Lo afinamos para la región que nos digas. Por defecto es español mexicano para contratistas de Texas. Si sirves a otra comunidad, re-afinamos el vocabulario y las expresiones durante la instalación.",
          },
          {
            q: "¿Las llamadas en español reciben las mismas funciones?",
            a: "Idénticas. Estimados, agenda, admisión, detección de emergencia, tarjetas SMS — todo funciona en español. El panel te muestra qué llamadas entraron en español para que puedas rastrear la proporción.",
          },
        ],
      },
      {
        num: "05",
        title: "Datos + privacidad",
        items: [
          {
            q: "¿Quién es dueño de los datos de las llamadas?",
            a: "Tú. Cada grabación, transcripción, registro de prospecto, nota de cliente — tuyos para exportar en cualquier momento. Usamos los datos solo para manejar tu negocio; no entrenamos con tus llamadas.",
          },
          {
            q: "¿El servicio cumple con TCPA?",
            a: "Sí. Seguimos TCPA para todos los SMS. El consentimiento se captura al momento de la llamada, las cancelaciones se respetan inmediatamente, las horas de silencio se aplican por estado, y mantenemos registros de auditoría. Si te adquieren o vendes, los datos son transferibles.",
          },
          {
            q: "¿Y HIPAA?",
            a: "Actualmente no firmamos BAAs. Si sirves un oficio regulado (médico, legal), aún no somos la opción correcta.",
          },
        ],
      },
    ],
    cta: {
      kicker: "¿Más preguntas?",
      h2: "Escribe al número. Contestamos en minutos.",
      sub: "Recibes una persona real durante horario de oficina, y Maria fuera de horario.",
      primary: "Comenzar prueba gratis de 14 días",
      secondary: "Leer el manual de la plataforma",
    },
  },
};

const LANG_KEY = "capta-lang";

export default function FAQClient({ initialLang }: { initialLang?: Lang } = {}) {
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

  // Flatten all chapters into one FAQPage schema — Google rich results
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.chapters.flatMap((ch) =>
      ch.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    ),
  };

  return (
    <FieldFrame>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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

      {/* Chapters */}
      {t.chapters.map((ch, chIdx) => (
        <ChapterSection key={ch.num} chapter={ch} isLast={chIdx === t.chapters.length - 1} />
      ))}

      <Rule />

      {/* CTA */}
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
              <a
                href={PHONE_TEL}
                style={{
                  display: "inline-block",
                  marginTop: 20,
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  fontVariantNumeric: "tabular-nums",
                  fontSize: 28,
                  fontWeight: 700,
                  color: C.paper,
                  letterSpacing: "-0.02em",
                }}
              >
                {PHONE}
              </a>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-3" style={{ maxWidth: 420 }}>
              <PrimaryButton href={lang === "es" ? "/es/setup" : "/setup"} size="lg">
                {t.cta.primary}
              </PrimaryButton>
              <SecondaryButton href={lang === "es" ? "/es/platform" : "/platform"} size="lg">
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

function ChapterSection({ chapter, isLast }: { chapter: FaqChapter; isLast: boolean }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      style={{
        borderBottom: isLast ? "none" : `1px solid ${C.rule}`,
      }}
      className="py-20 sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <DisplayH2 style={{ fontSize: "clamp(28px, 3vw, 44px)" }}>{chapter.title}</DisplayH2>
          </div>

          <div className="lg:col-span-8">
            <ul style={{ borderTop: `1px solid ${C.rule}` }}>
              {chapter.items.map((item, i) => {
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
                        alignItems: "baseline",
                        gap: 20,
                        background: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                        <Mono style={{ fontSize: 11, color: C.inkSoft, fontWeight: 700, letterSpacing: "0.08em", flexShrink: 0 }}>
                          {String(i + 1).padStart(2, "0")}
                        </Mono>
                        <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 20, fontWeight: 500, color: C.ink, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                          {item.q}
                        </span>
                      </div>
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
                      <div style={{ paddingLeft: 40, paddingBottom: 22, fontSize: 15, color: C.inkMuted, lineHeight: 1.65, maxWidth: 640 }}>
                        {item.a}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
