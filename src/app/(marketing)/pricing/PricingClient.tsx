"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { T, PHONE, PHONE_TEL, type Lang } from "@/lib/marketing/translations";
import { useScrollReveal } from "@/lib/marketing/hooks";
import { FAQ } from "@/components/marketing/FAQ";
import { SignupForm } from "@/components/marketing/SignupForm";

function PricingComparison({ lang }: { lang: Lang }) {
  const rows = lang === "en" ? [
    { feature: "Monthly Cost", calltide: "$497/mo", receptionist: "$3,000+/mo", service: "$800–1,500/mo" },
    { feature: "Availability", calltide: "24/7/365", receptionist: "Business hours", service: "Limited hours" },
    { feature: "Languages", calltide: "English + Spanish", receptionist: "Usually one", service: "Usually one" },
    { feature: "Appointment Booking", calltide: "Automatic", receptionist: "Manual", service: "Extra cost" },
    { feature: "Emergency Detection", calltide: "Built-in", receptionist: "Trained", service: "Not included" },
    { feature: "Full Dashboard", calltide: "Included", receptionist: "Not included", service: "Basic" },
    { feature: "Setup Time", calltide: "5 minutes", receptionist: "2–4 weeks", service: "1–2 weeks" },
  ] : [
    { feature: "Costo Mensual", calltide: "$497/mes", receptionist: "$3,000+/mes", service: "$800–1,500/mes" },
    { feature: "Disponibilidad", calltide: "24/7/365", receptionist: "Horario laboral", service: "Horas limitadas" },
    { feature: "Idiomas", calltide: "Inglés + Español", receptionist: "Usualmente uno", service: "Usualmente uno" },
    { feature: "Citas", calltide: "Automáticas", receptionist: "Manual", service: "Costo extra" },
    { feature: "Emergencias", calltide: "Incluido", receptionist: "Entrenada", service: "No incluido" },
    { feature: "Panel Completo", calltide: "Incluido", receptionist: "No incluido", service: "Básico" },
    { feature: "Tiempo de Configuración", calltide: "5 minutos", receptionist: "2–4 semanas", service: "1–2 semanas" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-cream-border">
            <th className="py-4 pr-4 text-left font-semibold text-charcoal"></th>
            <th className="py-4 px-4 text-center font-bold text-amber">Calltide</th>
            <th className="py-4 px-4 text-center font-semibold text-charcoal-muted">
              {lang === "en" ? "Receptionist" : "Recepcionista"}
            </th>
            <th className="py-4 pl-4 text-center font-semibold text-charcoal-muted">
              {lang === "en" ? "Answering Service" : "Servicio Telefónico"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-cream-border/50">
              <td className="py-4 pr-4 font-medium text-charcoal">{row.feature}</td>
              <td className="py-4 px-4 text-center font-semibold text-charcoal">{row.calltide}</td>
              <td className="py-4 px-4 text-center text-charcoal-muted">{row.receptionist}</td>
              <td className="py-4 pl-4 text-center text-charcoal-muted">{row.service}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PricingPage() {
  const [lang] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("calltide-lang");
      if (saved === "en" || saved === "es") return saved;
    }
    return "en";
  });
  const [planChoice, setPlanChoice] = useState<"monthly" | "annual">("annual");
  useScrollReveal();

  const t = T[lang];

  const allFeatures = lang === "en" ? [
    "Unlimited inbound calls",
    "Bilingual — English and Spanish",
    "Real-time appointment booking",
    "SMS confirmations to callers",
    "Emergency detection and transfer",
    "Full call dashboard with transcripts",
    "7 AI agents (onboarding, QA, retention, and more)",
    "Custom receptionist name and personality",
    "Custom response training (FAQs, off-limits topics)",
    "Email notifications for every call",
  ] : [
    "Llamadas entrantes ilimitadas",
    "Bilingüe — Inglés y Español",
    "Agenda de citas en tiempo real",
    "Confirmaciones SMS a llamantes",
    "Detección y transferencia de emergencias",
    "Panel completo con transcripciones",
    "7 agentes IA (onboarding, QA, retención, y más)",
    "Nombre y personalidad personalizados",
    "Entrenamiento de respuestas personalizadas",
    "Notificaciones por email de cada llamada",
  ];

  return (
    <>
      {/* Hero */}
      <section className="bg-navy px-6 sm:px-8 py-20 sm:py-28 dark-section grain-overlay">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{t.pricing.label}</p>
          <h1 className="mt-4 text-[36px] font-black leading-[1.1] tracking-tight text-white sm:text-[52px]">
            {t.pricing.h2}
          </h1>
          <p className="mt-6 text-lg text-slate-300">{t.pricing.sub}</p>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="bg-[#FBFBFC] px-6 sm:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-lg">
          {/* Plan Toggle */}
          <div className="reveal flex items-center justify-center gap-3 mb-8">
            <button
              onClick={() => setPlanChoice("monthly")}
              className="rounded-full px-5 py-2 text-sm font-semibold transition"
              style={{
                background: planChoice === "monthly" ? "#C8AA6E" : "transparent",
                color: planChoice === "monthly" ? "#0f0f0f" : "#64748b",
                border: planChoice === "monthly" ? "1px solid #C8AA6E" : "1px solid #e2e8f0",
              }}
            >
              {lang === "en" ? "Monthly" : "Mensual"}
            </button>
            <button
              onClick={() => setPlanChoice("annual")}
              className="relative rounded-full px-5 py-2 text-sm font-semibold transition"
              style={{
                background: planChoice === "annual" ? "#C8AA6E" : "transparent",
                color: planChoice === "annual" ? "#0f0f0f" : "#64748b",
                border: planChoice === "annual" ? "1px solid #C8AA6E" : "1px solid #e2e8f0",
              }}
            >
              {lang === "en" ? "Annual" : "Anual"}
              <span className="absolute -top-2.5 -right-2 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                {lang === "en" ? "Save 20%" : "-20%"}
              </span>
            </button>
          </div>

          <div className="reveal card-shadow rounded-2xl border-2 border-amber bg-white p-10 sm:p-14 text-center">
            <p className="text-[56px] font-extrabold tracking-tight text-charcoal">
              {planChoice === "annual" ? "$397" : "$497"}
            </p>
            <p className="text-sm text-charcoal-muted">
              {planChoice === "annual"
                ? (lang === "en" ? "/mo — billed annually at $4,764/yr" : "/mes — facturado anualmente a $4,764/año")
                : t.pricing.period}
            </p>
            {planChoice === "annual" && (
              <p className="mt-2 text-sm font-semibold text-green-600">
                {lang === "en" ? "Save $1,200/year" : "Ahorra $1,200/año"}
              </p>
            )}

            <ul className="mt-8 space-y-3 text-left text-sm text-charcoal">
              {allFeatures.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber">&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>

            <a href="#signup" className="cta-gold cta-shimmer mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold text-white">
              {t.pricing.cta} &rarr;
            </a>

            <p className="mt-4 text-xs text-charcoal-muted">{t.pricing.guarantee}</p>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-[#FBFBFC] px-6 sm:px-8 pb-24 sm:pb-32">
        <div className="reveal mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl mb-10">
            {lang === "en" ? "How Calltide Compares" : "Cómo se Compara Calltide"}
          </h2>
          <div className="card-shadow rounded-xl border border-cream-border bg-white p-6 sm:p-10">
            <PricingComparison lang={lang} />
          </div>
        </div>
      </section>

      {/* Risk Reversal */}
      <section className="bg-navy px-6 sm:px-8 py-16 sm:py-20 dark-section">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {lang === "en" ? "Zero Risk. Full Confidence." : "Cero Riesgo. Confianza Total."}
          </h2>
          <p className="mt-4 text-base text-slate-300">
            {lang === "en"
              ? "Try Calltide free for 14 days. No credit card required. Cancel anytime — no contracts, no cancellation fees."
              : "Prueba Calltide gratis por 14 días. Sin tarjeta de crédito. Cancela cuando quieras — sin contratos, sin cuotas de cancelación."}
          </p>
        </div>
      </section>

      {/* Pricing FAQ */}
      <section className="bg-[#FBFBFC] px-6 sm:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <div className="reveal text-center">
            <h2 className="text-[32px] font-extrabold leading-[1.1] tracking-tight text-charcoal sm:text-[40px]">
              {t.faq.h2}
            </h2>
          </div>
          <div className="reveal mt-14">
            <FAQ lang={lang} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="signup" className="relative px-6 sm:px-8 py-24 sm:py-32 overflow-hidden dark-section grain-overlay">
        <img src="/images/grit-texture.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-center" loading="lazy" />
        <div className="grit-overlay-cta absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="reveal text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[40px]">
            {t.cta.h2}
          </h2>
          <SignupForm lang={lang} plan={planChoice} />
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
