"use client";

import { useState } from "react";

const TRADES = [
  { value: "plumbing", label: "Plumbing", labelEs: "Plomer\u00EDa", avgJob: 275, missedRate: 28 },
  { value: "hvac", label: "HVAC", labelEs: "HVAC", avgJob: 350, missedRate: 27 },
  { value: "electrical", label: "Electrical", labelEs: "Electricidad", avgJob: 325, missedRate: 23 },
  { value: "roofing", label: "Roofing", labelEs: "Techos", avgJob: 8500, missedRate: 32 },
  { value: "general_contractor", label: "General Contracting", labelEs: "Contratista General", avgJob: 5000, missedRate: 35 },
  { value: "restoration", label: "Restoration", labelEs: "Restauraci\u00F3n", avgJob: 3500, missedRate: 22 },
  { value: "landscaping", label: "Landscaping", labelEs: "Jardiner\u00EDa", avgJob: 1200, missedRate: 30 },
  { value: "pest_control", label: "Pest Control", labelEs: "Control de Plagas", avgJob: 250, missedRate: 25 },
  { value: "garage_door", label: "Garage Door", labelEs: "Puertas de Garaje", avgJob: 350, missedRate: 30 },
  { value: "other", label: "Other Home Service", labelEs: "Otro Servicio del Hogar", avgJob: 400, missedRate: 27 },
] as const;

interface Props {
  lang: "en" | "es";
}

export function MissedCallCalculator({ lang }: Props) {
  const [trade, setTrade] = useState("");
  const [callsPerWeek, setCallsPerWeek] = useState("");
  const [avgJob, setAvgJob] = useState("");
  const [email, setEmail] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedTrade = TRADES.find((t) => t.value === trade);
  const missedRate = selectedTrade?.missedRate ?? 27;
  const calls = parseInt(callsPerWeek) || 0;
  const job = parseInt(avgJob) || selectedTrade?.avgJob || 300;
  const missedPerWeek = Math.round(calls * (missedRate / 100));
  const monthlyLoss = Math.round(missedPerWeek * job * 4.3);
  const yearlyLoss = monthlyLoss * 12;

  function handleCalculate() {
    if (!trade || !callsPerWeek) return;
    if (!avgJob && selectedTrade) setAvgJob(String(selectedTrade.avgJob));
    setShowResults(true);
  }

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
        trade,
        source: "playbook",
        estimatedMonthlyLoss: monthlyLoss,
        avgJobValue: job,
        missedCallsPerWeek: missedPerWeek,
        language: lang,
        utmSource: params.get("utm_source") || undefined,
        utmMedium: params.get("utm_medium") || undefined,
        utmCampaign: params.get("utm_campaign") || undefined,
      }),
    }).catch(() => {});

    setSubmitted(true);
    setSending(false);
  }

  const t = lang === "es" ? {
    heading: "Calculadora de Llamadas Perdidas",
    sub: "Descubre cuánto ingreso se te escapa cada mes.",
    tradePlaceholder: "Selecciona tu oficio",
    callsLabel: "Llamadas por semana",
    callsPlaceholder: "ej. 25",
    avgJobLabel: "Valor promedio del trabajo",
    avgJobPlaceholder: "Estimación automática",
    calculate: "Calcula Mi Pérdida",
    yourNumbers: "Tus Números",
    missedWeek: "llamadas perdidas/semana",
    lostMonth: "ingresos perdidos/mes",
    lostYear: "ingresos perdidos/año",
    based: `Basado en la tasa promedio de llamadas perdidas de ${missedRate}% en la industria`,
    emailHeading: "Descarga el Playbook de Crecimiento Gratis",
    emailSub: "Cómo escalar tu negocio sin contratar más personal — incluye los datos de llamadas perdidas, la ventaja bilingüe, y las estrategias que usan los mejores contratistas.",
    emailPlaceholder: "tu@email.com",
    send: "Enviar Playbook",
    sending: "Enviando...",
    thanks: "Revisa tu email",
    thanksSub: "El Playbook de Crecimiento está en camino.",
    orGetStarted: "¿Listo para dejar de perder llamadas?",
    cta: "Conoce a Capta",
  } : {
    heading: "Missed Call Revenue Calculator",
    sub: "Find out how much revenue is slipping through the cracks every month.",
    tradePlaceholder: "Select your trade",
    callsLabel: "Total calls per week",
    callsPlaceholder: "e.g. 25",
    avgJobLabel: "Average job value",
    avgJobPlaceholder: "Auto-estimated from trade",
    calculate: "Calculate My Loss",
    yourNumbers: "Your Numbers",
    missedWeek: "missed calls/week",
    lostMonth: "lost revenue/month",
    lostYear: "lost revenue/year",
    based: `Based on ${missedRate}% industry average missed call rate`,
    emailHeading: "Get the free Growth Playbook",
    emailSub: "How to scale your business without adding headcount — includes the missed call data, the bilingual advantage, and the strategies top contractors use to grow.",
    emailPlaceholder: "you@email.com",
    send: "Send Playbook",
    sending: "Sending...",
    thanks: "Check your inbox",
    thanksSub: "The Blue Collar Growth Playbook is on the way.",
    orGetStarted: "Ready to stop losing calls?",
    cta: "Start Free Trial",
  };

  return (
    <section className="px-6 sm:px-8 py-20 sm:py-28" style={{ background: "linear-gradient(180deg, #FBFBFC 0%, #F0F0F5 100%)" }}>
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.15em] text-amber">{lang === "es" ? "Herramienta Gratuita" : "Free Tool"}</p>
          <h2 className="mt-3 text-[28px] font-extrabold tracking-tight text-charcoal sm:text-[36px]">
            {t.heading}
          </h2>
          <p className="mt-3 text-base text-charcoal-muted">{t.sub}</p>
        </div>

        <div className="mt-10 rounded-2xl border border-cream-border bg-white p-6 sm:p-8 shadow-sm">
          {/* Calculator Inputs */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">{lang === "es" ? "Tu oficio" : "Your trade"}</label>
              <select
                value={trade}
                onChange={(e) => {
                  setTrade(e.target.value);
                  const t = TRADES.find((tr) => tr.value === e.target.value);
                  if (t) setAvgJob(String(t.avgJob));
                  setShowResults(false);
                }}
                className="w-full rounded-lg border border-cream-border bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-amber focus:ring-1 focus:ring-amber"
              >
                <option value="">{t.tradePlaceholder}</option>
                {TRADES.map((tr) => (
                  <option key={tr.value} value={tr.value}>{lang === "es" ? tr.labelEs : tr.label}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">{t.callsLabel}</label>
                <input
                  type="number"
                  value={callsPerWeek}
                  onChange={(e) => { setCallsPerWeek(e.target.value); setShowResults(false); }}
                  placeholder={t.callsPlaceholder}
                  min="1"
                  className="w-full rounded-lg border border-cream-border bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-amber focus:ring-1 focus:ring-amber"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">{t.avgJobLabel}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-charcoal-muted">$</span>
                  <input
                    type="number"
                    value={avgJob}
                    onChange={(e) => { setAvgJob(e.target.value); setShowResults(false); }}
                    placeholder={t.avgJobPlaceholder}
                    min="1"
                    className="w-full rounded-lg border border-cream-border bg-white pl-8 pr-4 py-3 text-sm text-charcoal outline-none focus:border-amber focus:ring-1 focus:ring-amber"
                  />
                </div>
              </div>
            </div>

            {!showResults && (
              <button
                onClick={handleCalculate}
                disabled={!trade || !callsPerWeek}
                className="cta-gold w-full rounded-lg px-6 py-3.5 text-sm font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t.calculate}
              </button>
            )}
          </div>

          {/* Results */}
          {showResults && monthlyLoss > 0 && (
            <div className="mt-8">
              <div className="rounded-xl bg-navy p-6">
                <h3 className="text-center text-sm font-bold uppercase tracking-wider text-amber">{t.yourNumbers}</h3>
                <div className="mt-5 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[28px] font-extrabold text-white sm:text-[32px]">{missedPerWeek}</p>
                    <p className="mt-1 text-xs text-slate-400">{t.missedWeek}</p>
                  </div>
                  <div>
                    <p className="text-[28px] font-extrabold text-amber sm:text-[32px]">${monthlyLoss.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-slate-400">{t.lostMonth}</p>
                  </div>
                  <div>
                    <p className="text-[28px] font-extrabold text-white sm:text-[32px]">${yearlyLoss.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-slate-400">{t.lostYear}</p>
                  </div>
                </div>
                <p className="mt-4 text-center text-xs text-slate-500">{t.based}</p>
              </div>

              {/* Email Capture */}
              {!submitted ? (
                <div className="mt-6">
                  <h4 className="text-base font-bold text-charcoal">{t.emailHeading}</h4>
                  <p className="mt-1 text-sm text-charcoal-muted">{t.emailSub}</p>
                  <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      required
                      className="flex-1 rounded-lg border border-cream-border bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-amber focus:ring-1 focus:ring-amber"
                    />
                    <button
                      type="submit"
                      disabled={sending}
                      className="cta-gold shrink-0 rounded-lg px-6 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
                    >
                      {sending ? t.sending : t.send}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-5 text-center">
                  <p className="text-sm font-semibold text-green-800">{t.thanks}</p>
                  <p className="mt-1 text-xs text-green-700">{t.thanksSub}</p>
                  <a
                    href={lang === "es" ? "/downloads/manual-de-crecimiento-para-contratistas.pdf" : "/downloads/blue-collar-growth-playbook.pdf"}
                    download
                    className="cta-gold mt-4 inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
                  >
                    {lang === "es" ? "Descargar Playbook" : "Download Playbook"} &darr;
                  </a>
                </div>
              )}

              {/* CTA */}
              <div className="mt-6 text-center">
                <p className="text-sm text-charcoal-muted">{t.orGetStarted}</p>
                <a
                  href={`/setup?utm_source=calculator&utm_medium=marketing&utm_campaign=missed_call_calculator`}
                  className="cta-gold cta-shimmer mt-3 inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold text-white"
                >
                  {t.cta} &rarr;
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
