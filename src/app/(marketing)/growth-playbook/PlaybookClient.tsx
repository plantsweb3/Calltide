"use client";

import { useState, useEffect, useCallback } from "react";
import { StaticNav } from "@/components/marketing/StaticNav";
import { StaticFooter } from "@/components/marketing/StaticFooter";
import type { Lang } from "@/lib/marketing/translations";

const T = {
  en: {
    chapters: [
      { num: "01", title: "The Revenue-Per-Truck Metric", desc: "Why most contractors measure growth wrong (headcount) instead of right (revenue per truck). Real benchmarks by trade." },
      { num: "02", title: "The 47-Hour Response Problem", desc: "The average contractor takes 47 hours to respond to a lead. Companies that respond in under 60 seconds convert 391% more. Here's how to fix it." },
      { num: "03", title: "The $50K Leak", desc: "Missed calls, the real math by trade, and why 85% of callers never call back. Frameworks to audit your own missed call rate." },
      { num: "04", title: "The Bilingual Advantage", desc: "$3T+ in Hispanic purchasing power, 40M+ Spanish speakers. Most competitors can't serve them. This is a growth lever hiding in plain sight." },
      { num: "05", title: "The Automation Stack", desc: "What to automate (phones, scheduling, follow-ups, reviews) vs what to never automate (the work, the relationships). Honest breakdown of every tool category." },
      { num: "06", title: "The Recurring Revenue Shift", desc: "How top contractors build maintenance agreements and service contracts to smooth seasonal swings. Real pricing frameworks you can copy." },
      { num: "07", title: "The AI Opportunity (and What's Hype)", desc: "An honest take on what AI can and can't do in 2026 for trades. What's actually working, what's vaporware, and where to spend your money." },
    ],
    stats: [
      { value: "$650B+", label: "Home services market size" },
      { value: "550K", label: "Plumber shortage by 2027" },
      { value: "85%", label: "Callers who never call back" },
      { value: "47 hrs", label: "Average lead response time" },
    ],
    freeGuide: "Free Guide",
    heroH: "The Blue Collar Growth Playbook",
    heroSub: "How to scale your home service business without adding headcount. 7 strategies backed by real industry data — not theory, not fluff, not a sales pitch.",
    checkItems: [
      "Revenue-per-truck benchmarks by trade",
      "The real cost of missed calls (with math)",
      "The bilingual revenue opportunity most contractors ignore",
      "Which AI tools actually work vs what's hype",
    ],
    formTitle: "Download the Playbook",
    formSub: "Free. No credit card. No 47-email drip campaign.",
    emailPlaceholder: "Your email",
    tradePlaceholder: "Your trade (optional)",
    tradeOptions: ["Plumbing", "HVAC", "Electrical", "Roofing", "General Contracting", "Restoration", "Landscaping", "Pest Control", "Garage Door", "Other"],
    sending: "Sending...",
    getPlaybook: "Get the Playbook",
    formFooter: "30 pages. Real data. Strategies you can use today.",
    readyTitle: "Your playbook is ready",
    readySub: "Click below to download. Also available in Spanish.",
    downloadEN: "Download Playbook (English)",
    downloadES: "Descargar en Espa\u00f1ol",
    readyCtaLabel: "Ready to stop losing calls?",
    readyCta: "Start Free Trial",
    insideLabel: "What's Inside",
    insideH: "7 Chapters. Zero Fluff.",
    insideSub: "Every chapter is a standalone strategy you can implement this week. Real numbers, real frameworks, real contractor examples.",
    forYouH: "This Playbook Is For You If...",
    forYouItems: [
      "You're turning away work because you can't hire fast enough",
      "You know you're missing calls but don't know how many",
      "You've been burned by software that overpromised",
      "You want to grow revenue without growing headcount",
      "You serve (or want to serve) Spanish-speaking customers",
      "You're tired of competing on price instead of speed",
    ],
    bottomH: "Stop Guessing. Start Growing.",
    bottomSub: "30 pages of real data and actionable strategies. Free. Because we'd rather earn your trust than your email.",
    downloadBtnEN: "Download Playbook (EN)",
    downloadBtnES: "Descargar (ES)",
  },
  es: {
    chapters: [
      { num: "01", title: "La Metrica de Ingresos por Camion", desc: "Por que la mayoria de los contratistas miden el crecimiento mal (cantidad de empleados) en vez de bien (ingresos por camion). Benchmarks reales por oficio." },
      { num: "02", title: "El Problema de las 47 Horas de Respuesta", desc: "El contratista promedio tarda 47 horas en responder a un prospecto. Las empresas que responden en menos de 60 segundos convierten 391% mas. Asi se soluciona." },
      { num: "03", title: "La Fuga de $50K", desc: "Llamadas perdidas, las cuentas reales por oficio, y por que el 85% de los llamantes nunca vuelven a llamar. Frameworks para auditar tu propia tasa de llamadas perdidas." },
      { num: "04", title: "La Ventaja Bilingue", desc: "$3T+ en poder adquisitivo hispano, 40M+ hispanohablantes. La mayoria de tus competidores no pueden atenderlos. Es una palanca de crecimiento escondida a plena vista." },
      { num: "05", title: "El Stack de Automatizacion", desc: "Que automatizar (telefonos, agenda, seguimientos, resenas) vs que nunca automatizar (el trabajo, las relaciones). Analisis honesto de cada categoria de herramientas." },
      { num: "06", title: "El Cambio a Ingresos Recurrentes", desc: "Como los mejores contratistas crean acuerdos de mantenimiento y contratos de servicio para suavizar las temporadas bajas. Frameworks de precios que puedes copiar." },
      { num: "07", title: "La Oportunidad de IA (y Que es Puro Hype)", desc: "Una perspectiva honesta de lo que la IA puede y no puede hacer en 2026 para oficios. Que esta funcionando, que es vaporware, y donde invertir tu dinero." },
    ],
    stats: [
      { value: "$650B+", label: "Tamano del mercado de servicios" },
      { value: "550K", label: "Escasez de plomeros para 2027" },
      { value: "85%", label: "Llamantes que nunca regresan" },
      { value: "47 hrs", label: "Tiempo promedio de respuesta" },
    ],
    freeGuide: "Guia Gratuita",
    heroH: "El Manual de Crecimiento para Contratistas",
    heroSub: "Como escalar tu negocio de servicios sin contratar mas gente. 7 estrategias respaldadas por datos reales — no teoria, no relleno, no un pitch de ventas.",
    checkItems: [
      "Benchmarks de ingresos por camion por oficio",
      "El costo real de las llamadas perdidas (con matematicas)",
      "La oportunidad de ingresos bilingues que la mayoria ignora",
      "Que herramientas de IA realmente funcionan vs cuales son hype",
    ],
    formTitle: "Descarga el Manual",
    formSub: "Gratis. Sin tarjeta de credito. Sin campana de 47 correos.",
    emailPlaceholder: "Tu correo",
    tradePlaceholder: "Tu oficio (opcional)",
    tradeOptions: ["Plomeria", "HVAC", "Electricidad", "Techos", "Contratista General", "Restauracion", "Jardineria", "Control de Plagas", "Puertas de Garaje", "Otro"],
    sending: "Enviando...",
    getPlaybook: "Descargar el Manual",
    formFooter: "30 paginas. Datos reales. Estrategias que puedes usar hoy.",
    readyTitle: "Tu manual esta listo",
    readySub: "Haz clic abajo para descargar. Tambien disponible en ingles.",
    downloadEN: "Download Playbook (English)",
    downloadES: "Descargar en Espa\u00f1ol",
    readyCtaLabel: "\u00bfListo para dejar de perder llamadas?",
    readyCta: "Prueba Gratis",
    insideLabel: "Que Incluye",
    insideH: "7 Capitulos. Cero Relleno.",
    insideSub: "Cada capitulo es una estrategia independiente que puedes implementar esta semana. Numeros reales, frameworks reales, ejemplos reales.",
    forYouH: "Este Manual Es Para Ti Si...",
    forYouItems: [
      "Estas rechazando trabajo porque no puedes contratar suficiente",
      "Sabes que pierdes llamadas pero no sabes cuantas",
      "Te han decepcionado con software que prometio de mas",
      "Quieres crecer ingresos sin crecer en personal",
      "Atiendes (o quieres atender) a clientes hispanohablantes",
      "Estas cansado de competir por precio en vez de velocidad",
    ],
    bottomH: "Deja de Adivinar. Empieza a Crecer.",
    bottomSub: "30 paginas de datos reales y estrategias accionables. Gratis. Porque preferimos ganarnos tu confianza que tu correo.",
    downloadBtnEN: "Download Playbook (EN)",
    downloadBtnES: "Descargar (ES)",
  },
};

const TRADE_VALUES = [
  "plumbing", "hvac", "electrical", "roofing", "general_contractor",
  "restoration", "landscaping", "pest_control", "garage_door", "other",
];

export function PlaybookLanding() {
  const [email, setEmail] = useState("");
  const [trade, setTrade] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("capta-lang");
    if (saved === "en" || saved === "es") setLang(saved);
  }, []);

  const toggleLang = useCallback((l: Lang) => {
    setLang(l);
    if (typeof window !== "undefined") localStorage.setItem("capta-lang", l);
  }, []);

  const s = T[lang];

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
    <div className="min-h-screen bg-[#FBFBFC]">
      <StaticNav lang={lang} langHref={lang === "en" ? "/es" : "/"} />

      {/* Language toggle */}
      <div className="flex justify-center py-4 bg-navy">
        <div className="inline-flex rounded-full overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>
          <button onClick={() => toggleLang("en")} className={`px-5 py-2 text-sm font-semibold transition ${lang === "en" ? "bg-amber text-black" : "text-slate-400 hover:text-white"}`}>English</button>
          <button onClick={() => toggleLang("es")} className={`px-5 py-2 text-sm font-semibold transition ${lang === "es" ? "bg-amber text-black" : "text-slate-400 hover:text-white"}`}>Espa&ntilde;ol</button>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy px-6 sm:px-8 py-20 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(212,168,67,0.08),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left: Copy */}
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.15em] text-amber">{s.freeGuide}</p>
              <h1 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[44px]">
                {s.heroH}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-slate-300">
                {s.heroSub}
              </p>
              <ul className="mt-6 space-y-3">
                {s.checkItems.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="mt-0.5 text-amber shrink-0">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Form */}
            <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {!submitted ? (
                <>
                  <h2 className="text-xl font-bold text-white">{s.formTitle}</h2>
                  <p className="mt-2 text-sm text-slate-400">{s.formSub}</p>
                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={s.emailPlaceholder}
                        required
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber focus:ring-1 focus:ring-amber"
                      />
                    </div>
                    <div>
                      <select
                        value={trade}
                        onChange={(e) => setTrade(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber focus:ring-1 focus:ring-amber"
                      >
                        <option value="" className="text-charcoal">{s.tradePlaceholder}</option>
                        {TRADE_VALUES.map((val, idx) => (
                          <option key={val} value={val} className="text-charcoal">{s.tradeOptions[idx]}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={sending}
                      className="cta-gold cta-shimmer w-full rounded-lg px-6 py-4 text-base font-semibold text-white transition disabled:opacity-60"
                    >
                      {sending ? s.sending : s.getPlaybook}
                    </button>
                  </form>
                  <p className="mt-4 text-center text-xs text-slate-500">
                    {s.formFooter}
                  </p>
                </>
              ) : (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                    <span className="text-2xl text-green-400">&#10003;</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">{s.readyTitle}</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    {s.readySub}
                  </p>
                  <div className="mt-5 flex flex-col gap-3">
                    <a
                      href="/downloads/blue-collar-growth-playbook.pdf"
                      download
                      className="cta-gold cta-shimmer inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold text-white"
                    >
                      {s.downloadEN} &darr;
                    </a>
                    <a
                      href="/downloads/manual-de-crecimiento-para-contratistas.pdf"
                      download
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-8 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
                    >
                      {s.downloadES} &darr;
                    </a>
                  </div>
                  <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-xs text-slate-500">{s.readyCtaLabel}</p>
                    <a
                      href="/setup?utm_source=playbook&utm_medium=landing&utm_campaign=growth_playbook"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-amber transition hover:underline"
                    >
                      {s.readyCta} &rarr;
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-cream-border bg-white px-6 sm:px-8 py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
          {s.stats.map((st) => (
            <div key={st.label} className="text-center">
              <p className="text-[28px] font-extrabold tracking-tight text-navy sm:text-[32px]">{st.value}</p>
              <p className="mt-1 text-xs font-medium text-charcoal-muted">{st.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What's Inside */}
      <section className="px-6 sm:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-[13px] font-bold uppercase tracking-[0.15em] text-amber">{s.insideLabel}</p>
          <h2 className="mt-3 text-center text-[28px] font-extrabold tracking-tight text-charcoal sm:text-[36px]">
            {s.insideH}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-charcoal-muted">
            {s.insideSub}
          </p>

          <div className="mt-12 space-y-4">
            {s.chapters.map((ch) => (
              <div key={ch.num} className="flex gap-5 rounded-2xl border border-cream-border bg-white p-5 sm:p-6 transition-all duration-200 hover:shadow-md hover:scale-[1.01]">
                <span className="shrink-0 text-[28px] font-extrabold text-amber/30">{ch.num}</span>
                <div>
                  <h3 className="text-base font-bold text-charcoal">{ch.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-charcoal-muted">{ch.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="bg-[#F5F5F7] px-6 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-[24px] font-extrabold tracking-tight text-charcoal sm:text-[28px]">
            {s.forYouH}
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {s.forYouItems.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl bg-white p-4 border border-cream-border transition-all duration-200 hover:shadow-sm">
                <span className="mt-0.5 text-amber shrink-0">&#10003;</span>
                <p className="text-sm text-charcoal">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-navy px-6 sm:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-[28px] font-extrabold tracking-tight text-white sm:text-[36px]">
            {s.bottomH}
          </h2>
          <p className="mt-4 text-base text-slate-300">
            {s.bottomSub}
          </p>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={s.emailPlaceholder}
                required
                className="rounded-lg border border-white/10 bg-white/5 px-5 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber focus:ring-1 focus:ring-amber sm:w-72"
              />
              <button
                type="submit"
                disabled={sending}
                className="cta-gold cta-shimmer rounded-lg px-8 py-3.5 text-sm font-semibold text-white transition disabled:opacity-60"
              >
                {sending ? s.sending : s.getPlaybook}
              </button>
            </form>
          ) : (
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href="/downloads/blue-collar-growth-playbook.pdf"
                download
                className="cta-gold cta-shimmer rounded-lg px-8 py-3.5 text-sm font-semibold text-white"
              >
                {s.downloadBtnEN} &darr;
              </a>
              <a
                href="/downloads/manual-de-crecimiento-para-contratistas.pdf"
                download
                className="rounded-lg border border-white/10 px-8 py-3.5 text-sm font-medium text-slate-300 transition hover:bg-white/5"
              >
                {s.downloadBtnES} &darr;
              </a>
            </div>
          )}
        </div>
      </section>

      <StaticFooter lang={lang} />
    </div>
  );
}
