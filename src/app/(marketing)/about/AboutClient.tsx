"use client";

/**
 * About page — Field Manual direction.
 * An editorial piece about why Capta exists and who it's for.
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
  TrustStrip,
  SkipLink,
} from "@/components/marketing/field";

type Copy = {
  hero: { kicker: string; h1a: string; h1b: string; dek: string };
  story: {
    kicker: string;
    h2: string;
    paragraphs: string[];
  };
  stats: { kicker: string; h2: string; items: { value: string; label: string; note: string }[] };
  mission: {
    kicker: string;
    h2: string;
    body: string;
    pull: string;
    pullAttribution: string;
  };
  cta: { kicker: string; h2: string; sub: string; primary: string };
};

const COPY: Record<Lang, Copy> = {
  en: {
    hero: {
      kicker: "About Capta",
      h1a: "Built in San Antonio.",
      h1b: "Built for you.",
      dek:
        "We started Capta because too many good contractors lose jobs to missed calls and manual busywork. The phone rings at the wrong time. The right word gets said in the wrong language. A customer who would have spent five thousand dollars ends up hanging up.",
    },
    story: {
      kicker: "The story",
      h2: "A problem we saw every day.",
      paragraphs: [
        "Watch a plumber for a week and you will see the same ten dollar bill fall out of his pocket a dozen times. His hands are under a sink. The phone rings. The caller is a new customer with a burst pipe — a two-thousand-dollar job. The plumber's voicemail picks up. The caller hangs up. The caller calls three more plumbers before he finds one who answers. The first plumber never knew the call happened.",
        "Hiring a bilingual receptionist to cover that gap costs thirty-six hundred a month. Answering services cost nine hundred and read messages back instead of booking the job. Most owners give up and let the voicemail do the work, because the alternative is another payroll line they can't afford. That's the math that built Capta.",
        "We built a receptionist that answers every call, in English or Spanish, forever, for less than a single truck's insurance. She takes the details of the job while the caller is still on the line. She books into your calendar. She texts you the job card the second the call ends. She recovers missed callers inside sixty seconds. She runs your front office from your text messages.",
      ],
    },
    stats: {
      kicker: "The numbers",
      h2: "Why this matters.",
      items: [
        { value: "52M+", label: "Spanish speakers in the US", note: "Per U.S. Census. A third of Texas. If you can't serve them, a competitor will." },
        { value: "62%", label: "Calls unanswered", note: "To small service businesses. Evenings, weekends, lunch, on jobs. Every one is a lost opportunity." },
        { value: "80%", label: "Won't leave voicemail", note: "They hang up and call the next number on the list. They call your competitor." },
        { value: "$3-4K", label: "Receptionist cost", note: "Bilingual, full-time, in Texas. Capta is less than the difference between $497 and zero." },
      ],
    },
    mission: {
      kicker: "The mission",
      h2: "Your entire front office, automated.",
      body:
        "Every home service business deserves a professional front office. Not just the ones who can afford a receptionist, a CRM, an estimating tool, a follow-up system, and a lead scoring engine. One flat rate. One platform. One receptionist who does all of it. That's what we built. That's the only thing we're building.",
      pull: "\"If the trades ran the world, the world would get done faster.\"",
      pullAttribution: "— Ulysses Munoz, founder, Capta",
    },
    cta: {
      kicker: "Try her out.",
      h2: "Two weeks free. One phone number.",
      sub: "If she doesn't earn her keep in the first fourteen days, walk away with zero owed.",
      primary: "Start 14-day free trial",
    },
  },
  es: {
    hero: {
      kicker: "Acerca de Capta",
      h1a: "Hecho en San Antonio.",
      h1b: "Hecho para ti.",
      dek:
        "Empezamos Capta porque demasiados buenos contratistas pierden trabajos por llamadas perdidas y trabajo manual. El teléfono suena en el momento equivocado. La palabra correcta se dice en el idioma equivocado. Un cliente que habría gastado cinco mil dólares termina colgando.",
    },
    story: {
      kicker: "La historia",
      h2: "Un problema que veíamos todos los días.",
      paragraphs: [
        "Observa a un plomero por una semana y verás cómo el mismo billete de diez dólares se le cae del bolsillo una docena de veces. Sus manos están bajo un fregadero. El teléfono suena. El que llama es un cliente nuevo con una tubería rota — un trabajo de dos mil dólares. El buzón del plomero contesta. El cliente cuelga. El cliente llama a tres plomeros más hasta que encuentra a uno que contesta. El primer plomero nunca supo que la llamada pasó.",
        "Contratar una recepcionista bilingüe para cubrir ese hueco cuesta tres mil seiscientos al mes. Los servicios de contestadoras cuestan novecientos y solo leen mensajes en lugar de agendar el trabajo. La mayoría de los dueños se rinden y dejan que el buzón haga el trabajo, porque la alternativa es otro sueldo que no pueden pagar. Esas son las cuentas que construyeron Capta.",
        "Construimos una recepcionista que contesta cada llamada, en inglés o español, para siempre, por menos del seguro de un solo camión. Toma los detalles del trabajo mientras el cliente sigue en la línea. Agenda en tu calendario. Te manda la tarjeta del trabajo al segundo que termina la llamada. Recupera llamadas perdidas en menos de sesenta segundos. Maneja tu oficina desde tus mensajes de texto.",
      ],
    },
    stats: {
      kicker: "Los números",
      h2: "Por qué esto importa.",
      items: [
        { value: "52M+", label: "Hispanohablantes en EE.UU.", note: "Según el Censo. Un tercio de Texas. Si no les puedes servir, un competidor lo hará." },
        { value: "62%", label: "Llamadas sin contestar", note: "A negocios pequeños de servicios. Tardes, fines de semana, comida, durante trabajos. Cada una es una oportunidad perdida." },
        { value: "80%", label: "No dejan buzón", note: "Cuelgan y llaman al siguiente número de la lista. Llaman a tu competidor." },
        { value: "$3-4K", label: "Costo de recepcionista", note: "Bilingüe, tiempo completo, en Texas. Capta es menos que la diferencia entre $497 y cero." },
      ],
    },
    mission: {
      kicker: "La misión",
      h2: "Tu oficina entera, automatizada.",
      body:
        "Cada negocio de servicios del hogar merece una oficina profesional. No solo los que pueden pagar una recepcionista, un CRM, una herramienta de estimados, un sistema de seguimiento, y un motor de puntaje de prospectos. Una tarifa fija. Una plataforma. Una recepcionista que hace todo. Eso es lo que construimos. Es lo único que construimos.",
      pull: "\"Si los oficios manejaran el mundo, el mundo se haría más rápido.\"",
      pullAttribution: "— Ulysses Munoz, fundador, Capta",
    },
    cta: {
      kicker: "Pruébala.",
      h2: "Dos semanas gratis. Un número de teléfono.",
      sub: "Si no se gana su pago en los primeros catorce días, vete sin deberle nada.",
      primary: "Comenzar prueba gratis de 14 días",
    },
  },
};

const LANG_KEY = "capta-lang";

export default function AboutPage({ initialLang }: { initialLang?: Lang } = {}) {
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
      <SkipLink lang={lang} />
      <FieldNav lang={lang} toggleLang={toggleLang} phone={PHONE} phoneHref={PHONE_TEL} />

      <main id="main">
      <TrustStrip lang={lang} />

      {/* Hero */}
      <section className="mx-auto max-w-[1280px] px-6 sm:px-10 pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div className="max-w-3xl">
          <Kicker>{t.hero.kicker}</Kicker>
          <DisplayH1 style={{ marginTop: 28 }}>
            {t.hero.h1a}
            <br />
            <em style={{ fontStyle: "italic", fontVariationSettings: '"SOFT" 100, "WONK" 1', color: C.amberInk }}>
              {t.hero.h1b}
            </em>
          </DisplayH1>
          <p
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: 22,
              lineHeight: 1.45,
              color: C.ink,
              marginTop: 32,
              maxWidth: 720,
              fontWeight: 400,
              fontStyle: "italic",
            }}
          >
            {t.hero.dek}
          </p>
        </div>
      </section>

      <Rule />

      {/* Story */}
      <section className="mx-auto max-w-[1280px] px-6 sm:px-10 py-24 sm:py-32">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Kicker>{t.story.kicker}</Kicker>
            <DisplayH2 style={{ marginTop: 20 }}>{t.story.h2}</DisplayH2>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            {t.story.paragraphs.map((p, i) => (
              <p
                key={i}
                style={{
                  fontSize: 17,
                  lineHeight: 1.75,
                  color: C.ink,
                  marginBottom: 24,
                }}
              >
                {p}
              </p>
            ))}
          </div>
        </div>
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
                  borderLeft: i > 0 ? `1px solid ${C.rule}` : "none",
                  background: C.paper,
                }}
                className={i > 0 ? "lg:border-l border-t lg:border-t-0" : "border-t lg:border-t-0"}
              >
                <Mono
                  style={{
                    fontSize: 40,
                    fontWeight: 700,
                    color: C.ink,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                  as="div"
                >
                  {item.value}
                </Mono>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: C.inkMuted,
                    fontWeight: 700,
                    marginTop: 12,
                  }}
                >
                  {item.label}
                </div>
                <p style={{ fontSize: 13, color: C.inkMuted, marginTop: 8, lineHeight: 1.55 }}>
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Rule />

      {/* Mission */}
      <section className="mx-auto max-w-[1280px] px-6 sm:px-10 py-24 sm:py-32">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <Kicker>{t.mission.kicker}</Kicker>
            <DisplayH2 style={{ marginTop: 20 }}>{t.mission.h2}</DisplayH2>
          </div>
          <div className="lg:col-span-7">
            <p style={{ fontSize: 18, lineHeight: 1.7, color: C.ink, fontWeight: 400 }}>
              {t.mission.body}
            </p>
            <blockquote
              style={{
                marginTop: 40,
                paddingTop: 28,
                borderTop: `1px solid ${C.rule}`,
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 28,
                lineHeight: 1.3,
                fontWeight: 500,
                fontStyle: "italic",
                color: C.ink,
                letterSpacing: "-0.01em",
              }}
            >
              {t.mission.pull}
            </blockquote>
            <div style={{ marginTop: 12, fontSize: 12, color: C.inkMuted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {t.mission.pullAttribution}
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
