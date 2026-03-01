"use client";

import { useState } from "react";
import { T, PHONE, PHONE_TEL, type Lang } from "@/lib/marketing/translations";
import { useScrollReveal } from "@/lib/marketing/hooks";
import { SignupForm } from "@/components/marketing/SignupForm";

const content = {
  en: {
    hero: "About Calltide",
    mission: "Every service business deserves a professional front office.",
    missionDetail: "We built Calltide because too many great plumbers, electricians, and HVAC technicians lose jobs — not because of their work, but because nobody answered the phone.",
    problemH: "The Problem We Solve",
    problemP1: "Small service businesses miss 62% of incoming calls. When nobody answers, 80% of callers don't leave a voicemail — they call a competitor. That's thousands of dollars in lost revenue every month.",
    problemP2: "Hiring a bilingual receptionist costs $3,000+ per month. Answering services are impersonal and expensive. Most owners just let the calls go to voicemail and hope for the best.",
    solutionH: "What We Built",
    solutionP: "Calltide is an AI receptionist that answers every call in English and Spanish, 24/7. She books appointments, sends SMS confirmations, detects emergencies, and gives you a full dashboard of everything that happens. She sounds natural, speaks both languages natively, and works for a fraction of the cost of a human receptionist.",
    texasH: "Built in Texas",
    texasP: "Calltide was built in Texas for Texas service businesses — and for service businesses everywhere. We understand the trades, we understand bilingual customers, and we built a product that actually works for this industry.",
    ctaH: "Ready to stop missing calls?",
  },
  es: {
    hero: "Acerca de Calltide",
    mission: "Cada negocio de servicio merece una oficina profesional.",
    missionDetail: "Construimos Calltide porque demasiados plomeros, electricistas y técnicos HVAC pierden trabajos — no por la calidad de su trabajo, sino porque nadie contestó el teléfono.",
    problemH: "El Problema que Resolvemos",
    problemP1: "Las pequeñas empresas de servicio pierden el 62% de las llamadas entrantes. Cuando nadie contesta, el 80% de los llamantes no dejan mensaje — llaman a la competencia. Eso son miles de dólares en ingresos perdidos cada mes.",
    problemP2: "Contratar una recepcionista bilingüe cuesta $3,000+ al mes. Los servicios telefónicos son impersonales y caros. La mayoría de los dueños simplemente dejan que las llamadas vayan al buzón de voz.",
    solutionH: "Lo que Construimos",
    solutionP: "Calltide es una recepcionista IA que contesta cada llamada en inglés y español, 24/7. Agenda citas, envía confirmaciones SMS, detecta emergencias, y te da un panel completo de todo lo que sucede. Suena natural, habla ambos idiomas como nativa, y cuesta una fracción de una recepcionista humana.",
    texasH: "Hecho en Texas",
    texasP: "Calltide fue construido en Texas para negocios de servicio en Texas — y para negocios de servicio en todas partes. Entendemos los oficios, entendemos a los clientes bilingües, y construimos un producto que realmente funciona para esta industria.",
    ctaH: "¿Listo para dejar de perder llamadas?",
  },
};

export default function AboutPage() {
  const [lang] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("calltide-lang");
      if (saved === "en" || saved === "es") return saved;
    }
    return "en";
  });
  useScrollReveal();

  const t = T[lang];
  const c = content[lang];

  return (
    <>
      {/* Hero */}
      <section className="bg-navy px-6 sm:px-8 py-20 sm:py-28 dark-section grain-overlay">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{c.hero}</p>
          <h1 className="mt-4 text-[36px] font-black leading-[1.1] tracking-tight text-white sm:text-[52px]">
            {c.mission}
          </h1>
          <p className="mt-6 text-lg text-slate-300">{c.missionDetail}</p>
        </div>
      </section>

      {/* The Problem */}
      <section className="bg-[#FBFBFC] px-6 sm:px-8 py-24 sm:py-32">
        <div className="reveal mx-auto max-w-3xl">
          <h2 className="text-[28px] font-extrabold tracking-tight text-charcoal sm:text-[36px]">{c.problemH}</h2>
          <p className="mt-6 text-base leading-[1.8] text-charcoal-muted">{c.problemP1}</p>
          <p className="mt-4 text-base leading-[1.8] text-charcoal-muted">{c.problemP2}</p>
        </div>
      </section>

      {/* What We Built */}
      <section className="bg-navy px-6 sm:px-8 py-24 sm:py-32 dark-section">
        <div className="reveal mx-auto max-w-3xl">
          <h2 className="text-[28px] font-extrabold tracking-tight text-white sm:text-[36px]">{c.solutionH}</h2>
          <p className="mt-6 text-base leading-[1.8] text-slate-300">{c.solutionP}</p>
        </div>
      </section>

      {/* Built in Texas */}
      <section className="bg-[#FBFBFC] px-6 sm:px-8 py-24 sm:py-32">
        <div className="reveal mx-auto max-w-3xl">
          <h2 className="text-[28px] font-extrabold tracking-tight text-charcoal sm:text-[36px]">{c.texasH}</h2>
          <p className="mt-6 text-base leading-[1.8] text-charcoal-muted">{c.texasP}</p>
          <div className="mt-10 flex items-center gap-6">
            <a href={PHONE_TEL} className="text-lg font-bold text-amber hover:underline">{PHONE}</a>
            <span className="text-charcoal-muted">|</span>
            <a href="mailto:hello@calltide.app" className="text-base font-medium text-charcoal-muted hover:text-charcoal">hello@calltide.app</a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="signup" className="relative px-6 sm:px-8 py-24 sm:py-32 overflow-hidden dark-section grain-overlay">
        <img src="/images/grit-texture.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-center" loading="lazy" />
        <div className="grit-overlay-cta absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="reveal text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[40px]">
            {c.ctaH}
          </h2>
          <SignupForm lang={lang} />
          <p className="mt-6 text-sm text-slate-400">{t.cta.sub}</p>
          <p className="mt-4 text-sm text-slate-500">
            {lang === "en" ? "Or call us:" : "O llámanos:"}{" "}
            <a href={PHONE_TEL} className="font-semibold text-amber hover:underline">{PHONE}</a>
          </p>
        </div>
      </section>
    </>
  );
}
