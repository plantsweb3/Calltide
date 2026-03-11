"use client";

import { useState } from "react";
import { PHONE, PHONE_TEL, BOOKING_URL, type Lang } from "@/lib/marketing/translations";
import { useScrollReveal } from "@/lib/marketing/hooks";

const content = {
  en: {
    badge: "About Capta",
    hero: "Built in San Antonio.\nBuilt for You.",
    heroSub: "We started Capta because too many great contractors lose jobs when nobody answers the phone.",
    storyLabel: "The Story",
    storyH: "A Problem We Saw Every Day",
    storyP1: "We watched plumbers, electricians, and HVAC technicians lose thousands of dollars every month — not because their work was bad, but because nobody picked up the phone. While they were on a job, calls went to voicemail. And 80% of those callers? They never called back. They called a competitor.",
    storyP2: "Hiring a bilingual receptionist costs $3,000-$4,000 per month. Answering services are impersonal and expensive. Most owners just let the calls go to voicemail and hope for the best.",
    storyP3: "We built Capta to fix that. An AI front office that answers every call, collects job details, generates estimates, recovers missed calls, follows up on quotes, and re-engages dormant customers — 24/7.",
    numbersLabel: "The Numbers",
    numbersH: "Why This Matters",
    stats: [
      { value: "52M+", label: "Spanish Speakers", desc: "Spanish speakers in the U.S. — and growing. If you can't serve them, someone else will." },
      { value: "62%", label: "Calls Missed", desc: "Of incoming calls to small service businesses go unanswered. Every one is a lost job." },
      { value: "80%", label: "Won't Leave VM", desc: "Of callers won't leave a voicemail. They hang up and call your competitor instead." },
      { value: "$3-4K", label: "Receptionist Cost", desc: "Monthly cost of a bilingual receptionist. Capta does it for $497/mo." },
    ],
    missionLabel: "Our Mission",
    missionH: "Never miss another customer call.",
    missionP: "Every home service business deserves a professional front office. Not just the ones who can afford a receptionist, a CRM, an estimating tool, and a follow-up system. Capta gives every contractor an AI front office that answers calls, generates estimates, recovers missed calls, follows up on quotes, re-engages past customers, and grows their business on autopilot.",
    ctaH: "Ready to stop missing calls?",
    ctaSub: "Get your AI receptionist up and running in 5 minutes.",
    ctaButton: "Get Capta",
    ctaBook: "Get Capta",
  },
  es: {
    badge: "Acerca de Capta",
    hero: "Hecho en San Antonio.\nHecho para Ti.",
    heroSub: "Empezamos Capta porque demasiados grandes contratistas pierden trabajos cuando nadie contesta el teléfono.",
    storyLabel: "La Historia",
    storyH: "Un Problema que Vimos Todos los Días",
    storyP1: "Vimos a plomeros, electricistas y técnicos HVAC perder miles de dólares cada mes — no porque su trabajo fuera malo, sino porque nadie contestó el teléfono. Mientras estaban en un trabajo, las llamadas iban al buzón de voz. ¿Y el 80% de esos llamantes? Nunca volvieron a llamar. Llamaron a la competencia.",
    storyP2: "Contratar una recepcionista bilingüe cuesta $3,000-$4,000 por mes. Los servicios telefónicos son impersonales y caros. La mayoría de los dueños simplemente dejan que las llamadas vayan al buzón de voz.",
    storyP3: "Construimos Capta para resolver eso. Una oficina IA que contesta cada llamada, recopila detalles del trabajo, genera presupuestos, recupera llamadas perdidas, da seguimiento a cotizaciones y reactiva clientes dormidos — 24/7.",
    numbersLabel: "Los Números",
    numbersH: "Por Qué Esto Importa",
    stats: [
      { value: "52M+", label: "Hispanohablantes", desc: "Hispanohablantes en EE.UU. — y creciendo. Si no los puedes atender, alguien más lo hará." },
      { value: "62%", label: "Llamadas Perdidas", desc: "De las llamadas entrantes a pequeños negocios de servicio no se contestan. Cada una es un trabajo perdido." },
      { value: "80%", label: "No Dejan Mensaje", desc: "De los llamantes no dejan mensaje de voz. Cuelgan y llaman a tu competencia." },
      { value: "$3-4K", label: "Costo Recepcionista", desc: "Costo mensual de una recepcionista bilingüe. Capta lo hace por $497/mes." },
    ],
    missionLabel: "Nuestra Misión",
    missionH: "Nunca pierdas otra llamada de un cliente.",
    missionP: "Cada negocio de servicio del hogar merece una oficina profesional. No solo los que pueden pagar una recepcionista, un CRM, una herramienta de presupuestos y un sistema de seguimiento. Capta le da a cada contratista una oficina IA que contesta llamadas, genera presupuestos, recupera llamadas perdidas, da seguimiento a cotizaciones, reactiva clientes anteriores y hace crecer su negocio en piloto autom\u00E1tico.",
    ctaH: "¿Listo para dejar de perder llamadas?",
    ctaSub: "Pon tu recepcionista IA a funcionar en 5 minutos.",
    ctaButton: "Obtén Capta",
    ctaBook: "Obtén Capta",
  },
};

export default function AboutPage() {
  const [lang] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("capta-lang");
      if (saved === "en" || saved === "es") return saved;
    }
    return "en";
  });
  useScrollReveal();

  const c = content[lang];

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 sm:px-8 py-28 sm:py-36 dark-section grain-overlay" style={{ background: "#0f1729" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(212,168,67,0.06) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{c.badge}</p>
          <h1 className="mt-6 text-[36px] font-black leading-[1.1] tracking-tight text-white sm:text-[56px] whitespace-pre-line">
            {c.hero}
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-xl mx-auto">{c.heroSub}</p>
        </div>
      </section>

      {/* The Story */}
      <section className="px-6 sm:px-8 py-24 sm:py-32 dark-section" style={{ background: "#0f1729" }}>
        <div className="reveal mx-auto max-w-3xl">
          <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{c.storyLabel}</p>
          <h2 className="mt-4 text-[28px] font-extrabold tracking-tight text-white sm:text-[36px]">{c.storyH}</h2>
          <div className="mt-8 space-y-5">
            <p className="text-base leading-[1.8] text-slate-300">{c.storyP1}</p>
            <p className="text-base leading-[1.8] text-slate-300">{c.storyP2}</p>
            <p className="text-base leading-[1.8] text-slate-300">{c.storyP3}</p>
          </div>
        </div>
      </section>

      {/* The Numbers */}
      <section className="px-6 sm:px-8 py-24 sm:py-32 dark-section" style={{ background: "#111827" }}>
        <div className="reveal mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{c.numbersLabel}</p>
            <h2 className="mt-4 text-[28px] font-extrabold tracking-tight text-white sm:text-[36px]">{c.numbersH}</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {c.stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-6 text-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p className="text-[40px] font-black tracking-tight" style={{ color: "#d4a843" }}>{s.value}</p>
                <p className="mt-1 text-sm font-semibold text-white">{s.label}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="px-6 sm:px-8 py-24 sm:py-32 dark-section" style={{ background: "#0f1729" }}>
        <div className="reveal mx-auto max-w-3xl text-center">
          <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{c.missionLabel}</p>
          <h2 className="mt-4 text-[32px] font-black leading-[1.1] tracking-tight text-white sm:text-[44px]">
            {c.missionH}
          </h2>
          <p className="mt-6 text-lg leading-[1.8] text-slate-300 max-w-2xl mx-auto">{c.missionP}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 sm:px-8 py-24 sm:py-32 dark-section grain-overlay" style={{ background: "#0f1729" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(212,168,67,0.06) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-xl text-center">
          <h2 className="reveal text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[40px]">
            {c.ctaH}
          </h2>
          <p className="mt-4 text-slate-400">{c.ctaSub}</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/pricing"
              className="cta-gold cta-shimmer inline-flex items-center justify-center gap-2 rounded-xl px-10 py-4 text-lg font-semibold text-white"
            >
              {c.ctaButton} &rarr;
            </a>
            <a
              href="/setup"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold text-slate-300 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}
            >
              {c.ctaBook} &rarr;
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            {lang === "en" ? "Or call us:" : "O llámanos:"}{" "}
            <a href={PHONE_TEL} className="font-semibold hover:underline" style={{ color: "#d4a843" }}>{PHONE}</a>
          </p>
        </div>
      </section>
    </>
  );
}
