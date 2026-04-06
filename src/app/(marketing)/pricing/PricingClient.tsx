"use client";

import { useState, useEffect, useCallback } from "react";
import { PHONE, PHONE_TEL } from "@/lib/marketing/translations";
import type { Lang } from "@/lib/marketing/translations";
import { useScrollReveal } from "@/lib/marketing/hooks";
import { SignupForm } from "@/components/marketing/SignupForm";
import { trackViewContent } from "@/lib/tracking";

const STRINGS = {
  en: {
    heroTitle: "One Plan. Everything Included.",
    heroSub: "No tiers. No upsells. No hidden fees. Just your AI receptionist, answering your phone.",
    monthly: "Monthly",
    annual: "Annual",
    saveTag: "Save $1,200/year",
    billedAnnually: "Billed annually at $4,764",
    perMonth: "/month",
    perMo: "/mo",
    cardSub: "Your complete AI front office \u2014 fully loaded",
    cta: "Start Free Trial",
    anchorHuman: "A bilingual receptionist costs",
    anchorHumanCost: "$3,000\u2013$4,000/month",
    anchorService: "An answering service costs",
    anchorServiceCost: "$700\u2013$1,600/month",
    anchorCapta: "Capta costs",
    anchorCaptaCost: "$497/month",
    anchorPunch: "And she never calls in sick.",
    softwareTitle: "Software Capta Replaces",
    softwareTotal: "Total: $950\u2013$2,500/mo",
    softwareCaptaLine: "Or get all of it for $497/month.",
    compTitle: "How Capta Compares",
    compSub: "Capta isn\u2019t just cheaper \u2014 it does more. Here\u2019s what you get at each price point.",
    compSolution: "Solution",
    compPrice: "Price",
    comp24: "24/7",
    compBilingual: "Bilingual",
    compBooks: "Books Jobs",
    compEstimates: "Estimates",
    compCRM: "CRM",
    roiStatement: "Capta pays for itself after just 2 answered calls.",
    orCallUs: "Or call us:",
    guaranteeTitle: "14-Day Free Trial",
    guaranteeSub: "Try Capta free for 14 days. No charge until day 15. If it doesn\u2019t pay for itself, cancel anytime.",
    guaranteePunch: "What an automation consultant builds for $10,000, Capta does for $497/month.",
    trustSecure: "Secure",
    trustCompliant: "Compliant",
    trust247: "24/7",
    faqTitle: "Frequently Asked Questions",
    finalTitle: "Stop missing calls. Start today.",
    finalGuarantee: "Free for 14 days. Cancel anytime. No contracts.",
    featuresCol1: [
      "Unlimited calls \u2014 English & Spanish",
      "AI job intake & detail collection",
      "AI estimate generation",
      "Job cards + photo intake",
      "Owner response loop (one-tap approve)",
      "Missed call recovery SMS",
      "Appointment booking + management",
      "SMS confirmations + reminders",
      "Emergency detection + live transfer",
      "After-hours intelligent routing",
      "Returning caller recognition",
      "Auto-populated CRM",
      "Estimate pipeline tracking",
      "Call recordings + transcripts",
      "AI-powered call summaries",
    ],
    featuresCol2: [
      "Estimate follow-up automation",
      "Customer recall & reactivation",
      "Google review requests",
      "Weekly digest",
      "CSV import",
      "Multi-location support",
      "Personality customization",
      "Partner referral network",
      "Outbound call automation",
      "Referral program ($497 credit)",
      "Full dashboard + analytics",
      "Status page + incident engine",
      "Recording disclosure + audit trail",
      "Magic link auth (passwordless)",
      "GDPR/CCPA/TCPA compliant",
    ],
    softwareCosts: [
      { name: "Answering service", cost: "$700\u2013$1,600/mo" },
      { name: "CRM software", cost: "$50\u2013$300/mo" },
      { name: "Estimating tool", cost: "$50\u2013$200/mo" },
      { name: "Follow-up automation", cost: "$100\u2013$300/mo" },
      { name: "Review management", cost: "$50\u2013$100/mo" },
      { name: "Automation consultant", cost: "$3K\u2013$10K setup" },
    ],
    faqs: [
      { q: "Is there a contract?", a: "No. Month-to-month. Cancel anytime. Annual plan available at $4,764/year (save $1,200)." },
      { q: "Are there any extra fees?", a: "No. Unlimited calls, unlimited features. $497/month covers everything." },
      { q: "What if I need help setting up?", a: "We walk you through everything. Most businesses are live in 24 hours." },
      { q: "Can she generate estimates?", a: "Yes. She collects job details during the call, generates a price range based on your pricing rules, and texts it to you for one-tap approval before sending it to the customer." },
      { q: "What\u2019s included that I\u2019d normally need separate software for?", a: "Answering service, CRM, estimating tool, follow-up automation, review management, appointment booking, and analytics. Capta replaces $950\u2013$2,500/month in separate software subscriptions." },
    ],
  },
  es: {
    heroTitle: "Un Plan. Todo Incluido.",
    heroSub: "Sin niveles. Sin cobros extra. Sin tarifas ocultas. Solo tu recepcionista IA, contestando tu tel\u00E9fono.",
    monthly: "Mensual",
    annual: "Anual",
    saveTag: "Ahorra $1,200/a\u00F1o",
    billedAnnually: "Facturado anualmente a $4,764",
    perMonth: "/mes",
    perMo: "/mes",
    cardSub: "Tu oficina IA completa \u2014 todo incluido",
    cta: "Prueba Gratis",
    anchorHuman: "Una recepcionista biling\u00FCe cuesta",
    anchorHumanCost: "$3,000\u2013$4,000/mes",
    anchorService: "Un servicio de contestaci\u00F3n cuesta",
    anchorServiceCost: "$700\u2013$1,600/mes",
    anchorCapta: "Capta cuesta",
    anchorCaptaCost: "$497/mes",
    anchorPunch: "Y nunca se reporta enferma.",
    softwareTitle: "Software que Capta Reemplaza",
    softwareTotal: "Total: $950\u2013$2,500/mes",
    softwareCaptaLine: "O consigue todo por $497/mes.",
    compTitle: "C\u00F3mo se Compara Capta",
    compSub: "Capta no solo es m\u00E1s barato \u2014 hace m\u00E1s. Esto es lo que obtienes en cada punto de precio.",
    compSolution: "Soluci\u00F3n",
    compPrice: "Precio",
    comp24: "24/7",
    compBilingual: "Biling\u00FCe",
    compBooks: "Agenda",
    compEstimates: "Cotizaciones",
    compCRM: "CRM",
    roiStatement: "Capta se paga solo despu\u00E9s de 2 llamadas contestadas.",
    orCallUs: "O ll\u00E1manos:",
    guaranteeTitle: "Prueba Gratuita de 14 D\u00EDas",
    guaranteeSub: "Prueba Capta gratis por 14 d\u00EDas. Sin cargo hasta el d\u00EDa 15. Si no se paga solo, cancela cuando quieras.",
    guaranteePunch: "Lo que un consultor de automatizaci\u00F3n construye por $10,000, Capta lo hace por $497/mes.",
    trustSecure: "Seguro",
    trustCompliant: "Cumplimiento",
    trust247: "24/7",
    faqTitle: "Preguntas Frecuentes",
    finalTitle: "Deja de perder llamadas. Empieza hoy.",
    finalGuarantee: "Gratis por 14 d\u00EDas. Cancela cuando quieras. Sin contratos.",
    featuresCol1: [
      "Llamadas ilimitadas \u2014 ingl\u00E9s y espa\u00F1ol",
      "Recepci\u00F3n de trabajos con IA",
      "Generaci\u00F3n de cotizaciones con IA",
      "Tarjetas de trabajo + fotos",
      "Aprobaci\u00F3n del due\u00F1o (un toque)",
      "SMS de recuperaci\u00F3n de llamadas perdidas",
      "Reserva y gesti\u00F3n de citas",
      "Confirmaciones y recordatorios SMS",
      "Detecci\u00F3n de emergencias + transferencia",
      "Enrutamiento inteligente fuera de horario",
      "Reconocimiento de clientes recurrentes",
      "CRM auto-poblado",
      "Seguimiento de cotizaciones",
      "Grabaciones + transcripciones",
      "Res\u00FAmenes de llamadas con IA",
    ],
    featuresCol2: [
      "Seguimiento autom\u00E1tico de cotizaciones",
      "Reactivaci\u00F3n de clientes",
      "Solicitud de rese\u00F1as en Google",
      "Resumen semanal",
      "Importaci\u00F3n CSV",
      "Soporte multi-ubicaci\u00F3n",
      "Personalizaci\u00F3n de personalidad",
      "Red de referencias de socios",
      "Automatizaci\u00F3n de llamadas salientes",
      "Programa de referidos (cr\u00E9dito de $497)",
      "Dashboard completo + anal\u00EDticas",
      "P\u00E1gina de estado + motor de incidentes",
      "Divulgaci\u00F3n de grabaci\u00F3n + auditor\u00EDa",
      "Auth por enlace m\u00E1gico (sin contrase\u00F1a)",
      "Cumple GDPR/CCPA/TCPA",
    ],
    softwareCosts: [
      { name: "Servicio de contestaci\u00F3n", cost: "$700\u2013$1,600/mes" },
      { name: "Software CRM", cost: "$50\u2013$300/mes" },
      { name: "Herramienta de cotizaci\u00F3n", cost: "$50\u2013$200/mes" },
      { name: "Automatizaci\u00F3n de seguimiento", cost: "$100\u2013$300/mes" },
      { name: "Gesti\u00F3n de rese\u00F1as", cost: "$50\u2013$100/mes" },
      { name: "Consultor de automatizaci\u00F3n", cost: "$3K\u2013$10K inicial" },
    ],
    faqs: [
      { q: "\u00BFHay contrato?", a: "No. Mes a mes. Cancela cuando quieras. Plan anual disponible a $4,764/a\u00F1o (ahorra $1,200)." },
      { q: "\u00BFHay tarifas extra?", a: "No. Llamadas ilimitadas, funciones ilimitadas. $497/mes cubre todo." },
      { q: "\u00BFQu\u00E9 pasa si necesito ayuda para configurar?", a: "Te guiamos en todo. La mayor\u00EDa de los negocios est\u00E1n activos en 24 horas." },
      { q: "\u00BFPuede generar cotizaciones?", a: "S\u00ED. Recopila detalles del trabajo durante la llamada, genera un rango de precio basado en tus reglas de precios, y te lo env\u00EDa por texto para aprobaci\u00F3n con un toque antes de envi\u00E1rselo al cliente." },
      { q: "\u00BFQu\u00E9 incluye que normalmente necesitar\u00EDa software separado?", a: "Servicio de contestaci\u00F3n, CRM, herramienta de cotizaci\u00F3n, automatizaci\u00F3n de seguimiento, gesti\u00F3n de rese\u00F1as, reserva de citas y anal\u00EDticas. Capta reemplaza $950\u2013$2,500/mes en suscripciones separadas." },
    ],
  },
};

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
      <path d="M5 10.5L8.5 14L15 6.5" stroke="#d4a843" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FAQAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="rounded-xl border transition-colors"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: open === i ? "rgba(212,168,67,0.3)" : "rgba(255,255,255,0.08)",
          }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between px-6 py-5 text-left"
          >
            <span className="text-[15px] font-semibold text-white">{faq.q}</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="shrink-0 transition-transform duration-200"
              style={{ transform: open === i ? "rotate(180deg)" : "rotate(0)" }}
            >
              <path d="M5 7.5L10 12.5L15 7.5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className={`faq-answer ${open === i ? "open" : ""}`}>
            <div>
              <div className="px-6 pb-5">
                <p className="text-[15px] leading-relaxed text-slate-400">{faq.a}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PricingClient() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [lang, setLang] = useState<Lang>("en");
  useScrollReveal();

  const toggleLang = useCallback((l: Lang) => {
    setLang(l);
    if (typeof window !== "undefined") localStorage.setItem("capta-lang", l);
  }, []);

  useEffect(() => {
    trackViewContent("pricing");
    const saved = localStorage.getItem("capta-lang");
    if (saved === "en" || saved === "es") setLang(saved);
  }, []);

  const t = STRINGS[lang];
  const isAnnual = billing === "annual";

  return (
    <>
      {/* Language toggle */}
      <div className="flex justify-center pt-6" style={{ background: "#0f1729" }}>
        <div className="inline-flex rounded-full overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
          <button onClick={() => toggleLang("en")} className={`px-5 py-2 text-sm font-semibold transition ${lang === "en" ? "bg-amber text-black" : "text-slate-400 hover:text-white"}`}>English</button>
          <button onClick={() => toggleLang("es")} className={`px-5 py-2 text-sm font-semibold transition ${lang === "es" ? "bg-amber text-black" : "text-slate-400 hover:text-white"}`}>Espa&ntilde;ol</button>
        </div>
      </div>

      {/* Hero */}
      <section className="relative px-6 sm:px-8 pt-16 pb-8 sm:pt-24 sm:pb-12" style={{ background: "#0f1729" }}>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-[36px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[52px]" style={{ fontFamily: "Inter, sans-serif" }}>
            {t.heroTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
            {t.heroSub}
          </p>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="relative px-6 sm:px-8 pt-8 pb-24 sm:pt-12 sm:pb-32" style={{ background: "#0f1729" }}>
        <div className="mx-auto max-w-3xl">
          {/* Monthly / Annual toggle */}
          <div className="reveal flex items-center justify-center gap-3 mb-10">
            <span className={`text-sm font-medium transition-colors ${!isAnnual ? "text-white" : "text-slate-500"}`}>{t.monthly}</span>
            <button
              role="switch"
              aria-checked={isAnnual}
              onClick={() => setBilling(isAnnual ? "monthly" : "annual")}
              className="relative h-7 w-[52px] rounded-full transition-colors"
              style={{ background: isAnnual ? "#d4a843" : "rgba(255,255,255,0.15)" }}
              aria-label="Toggle annual billing"
            >
              <span
                className="absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-transform duration-200"
                style={{ left: isAnnual ? "27px" : "3px" }}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${isAnnual ? "text-white" : "text-slate-500"}`}>{t.annual}</span>
            {isAnnual && (
              <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}>
                {t.saveTag}
              </span>
            )}
          </div>

          {/* The card */}
          <div
            className="reveal pricing-card relative mx-auto max-w-2xl rounded-2xl p-8 sm:p-12"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 0 60px rgba(212,168,67,0.06), 0 16px 48px rgba(0,0,0,0.4)",
            }}
          >
            {/* Price */}
            <div className="text-center">
              {isAnnual ? (
                <>
                  <div className="flex items-baseline justify-center gap-3">
                    <span className="text-2xl font-bold text-slate-500 line-through">$497</span>
                    <span className="text-[64px] font-extrabold tracking-tight text-white sm:text-[72px]">$397</span>
                    <span className="text-xl text-slate-400">{t.perMo}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{t.billedAnnually}</p>
                </>
              ) : (
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-[64px] font-extrabold tracking-tight text-white sm:text-[72px]">$497</span>
                  <span className="text-xl text-slate-400">{t.perMonth}</span>
                </div>
              )}

              <p className="mt-4 text-base text-slate-400">
                {t.cardSub}
              </p>
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
              <a
                href="/setup"
                className="cta-gold cta-shimmer inline-flex items-center justify-center gap-2 rounded-xl px-10 py-4 text-lg font-semibold text-white"
              >
                {t.cta} &rarr;
              </a>
              <p className="mt-2 text-xs text-slate-400">{lang === "en" ? "No charge for 14 days \u00B7 Cancel anytime" : "Sin cargo por 14 d\u00EDas \u00B7 Cancela cuando quieras"}</p>
            </div>

            {/* Divider */}
            <div className="my-10" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

            {/* Feature grid */}
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <div className="space-y-3">
                {t.featuresCol1.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check />
                    <span className="text-[14px] leading-snug text-slate-300">{f}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3 mt-3 sm:mt-0">
                {t.featuresCol2.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check />
                    <span className="text-[14px] leading-snug text-slate-300">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card hover glow — styles in globals.css */}
          </div>
        </div>
      </section>

      {/* Price Anchoring */}
      <section className="px-6 sm:px-8 py-20 sm:py-28" style={{ background: "#0f1729" }}>
        <div className="reveal mx-auto max-w-2xl text-center space-y-5">
          <p className="text-lg text-slate-400">
            {t.anchorHuman} <span className="font-semibold text-white">{t.anchorHumanCost}</span>.
          </p>
          <p className="text-lg text-slate-400">
            {t.anchorService} <span className="font-semibold text-white">{t.anchorServiceCost}</span>.
          </p>
          <p className="text-lg text-slate-400">
            {t.anchorCapta} <span className="font-semibold text-white">{t.anchorCaptaCost}</span>. {t.anchorPunch}
          </p>
        </div>
      </section>

      {/* Software Cost Anchoring */}
      <section className="px-6 sm:px-8 py-20 sm:py-28" style={{ background: "#111a2e" }}>
        <div className="reveal mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl mb-10">
            {t.softwareTitle}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {t.softwareCosts.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl px-5 py-4 text-center transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p className="text-sm font-medium text-slate-400">{item.name}</p>
                <p className="mt-1 text-lg font-extrabold text-white">{item.cost}</p>
              </div>
            ))}
            <div
              className="rounded-2xl px-5 py-4 text-center sm:col-span-2 lg:col-span-3"
              style={{
                background: "rgba(212,168,67,0.08)",
                border: "1px solid rgba(212,168,67,0.2)",
              }}
            >
              <p className="text-sm font-medium text-slate-400">{t.softwareTotal}</p>
              <p className="mt-1 text-lg font-extrabold" style={{ color: "#d4a843" }}>{t.softwareCaptaLine}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="px-6 sm:px-8 py-20 sm:py-28" style={{ background: "#0f1729" }}>
        <div className="reveal mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl mb-4">
            {t.compTitle}
          </h2>
          <p className="text-center text-sm text-slate-400 mb-10 max-w-xl mx-auto">
            {t.compSub}
          </p>
          <div className="relative overflow-x-auto md:overflow-visible">
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0f1729] to-transparent md:hidden z-10" />
            <table className="w-full text-sm" style={{ minWidth: "640px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">{t.compSolution}</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">{t.compPrice}</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">{t.comp24}</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">{t.compBilingual}</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">{t.compBooks}</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">{t.compEstimates}</th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium">{t.compCRM}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Capta", price: lang === "en" ? "$497/mo" : "$497/mes", h24: true, bilingual: true, books: true, estimates: true, crm: true, highlight: true },
                  { name: lang === "en" ? "Human Receptionist" : "Recepcionista Humana", price: lang === "en" ? "$3\u2013$4K/mo" : "$3\u2013$4K/mes", h24: false, bilingual: false, books: false, estimates: false, crm: false },
                  { name: "Smith.ai", price: lang === "en" ? "$97\u2013$1,170/mo" : "$97\u2013$1,170/mes", h24: true, bilingual: false, books: false, estimates: false, crm: false },
                  { name: "Ruby", price: lang === "en" ? "$245\u2013$1,500/mo" : "$245\u2013$1,500/mes", h24: true, bilingual: false, books: false, estimates: false, crm: false },
                  { name: lang === "en" ? "Answering Service" : "Servicio de Contestaci\u00F3n", price: lang === "en" ? "$200\u2013$800/mo" : "$200\u2013$800/mes", h24: true, bilingual: false, books: false, estimates: false, crm: false },
                  { name: lang === "en" ? "Automation Consultant" : "Consultor de Automatizaci\u00F3n", price: lang === "en" ? "$3K\u2013$10K + $500\u2013$2K/mo" : "$3K\u2013$10K + $500\u2013$2K/mes", h24: false, bilingual: false, books: false, estimates: false, crm: false },
                ].map((row) => (
                  <tr
                    key={row.name}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      background: row.highlight ? "rgba(212,168,67,0.06)" : "transparent",
                    }}
                  >
                    <td className="py-3 px-4 font-semibold" style={{ color: row.highlight ? "#d4a843" : "white" }}>
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{row.price}</td>
                    {[row.h24, row.bilingual, row.books, row.estimates, row.crm].map((val, i) => (
                      <td key={i} className="py-3 px-4 text-center">
                        {val ? (
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="inline-block">
                            <path d="M5 10.5L8.5 14L15 6.5" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <span className="text-slate-600">&mdash;</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ROI Statement */}
      <section className="px-6 sm:px-8 py-16 sm:py-20" style={{ background: "#111a2e" }}>
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {t.roiStatement}
          </p>
          <p className="mt-5 text-base text-slate-400">
            {t.orCallUs}{" "}
            <a href={PHONE_TEL} className="font-semibold transition hover:underline" style={{ color: "#d4a843" }}>
              {PHONE}
            </a>
          </p>
        </div>
      </section>

      {/* Guarantee */}
      <section className="px-6 sm:px-8 py-20 sm:py-28" style={{ background: "#0f1729" }}>
        <div className="reveal mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {t.guaranteeTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-slate-400">
            {t.guaranteeSub}
          </p>
          <p className="mx-auto mt-4 max-w-lg text-base font-semibold" style={{ color: "#d4a843" }}>
            {t.guaranteePunch}
          </p>

          {/* Trust icons */}
          <div className="mt-10 flex items-center justify-center gap-10">
            <div className="flex flex-col items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-xs text-slate-500">{t.trustSecure}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span className="text-xs text-slate-500">{t.trustCompliant}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-xs text-slate-500">{t.trust247}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 sm:px-8 py-20 sm:py-28" style={{ background: "#0f1729" }}>
        <div className="mx-auto max-w-2xl">
          <h2 className="reveal text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl mb-10">
            {t.faqTitle}
          </h2>
          <div className="reveal">
            <FAQAccordion faqs={t.faqs} />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="signup" className="relative px-6 sm:px-8 py-24 sm:py-32 overflow-hidden" style={{ background: "#111a2e" }}>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="reveal text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[40px]">
            {t.finalTitle}
          </h2>
          <SignupForm lang={lang} plan={billing} />
          <p className="mt-6 text-sm text-slate-500">{t.finalGuarantee}</p>
          <p className="mt-4 text-sm text-slate-500">
            {t.orCallUs}{" "}
            <a href={PHONE_TEL} className="font-semibold transition hover:underline" style={{ color: "#d4a843" }}>
              {PHONE}
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
