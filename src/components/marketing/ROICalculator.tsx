"use client";

import { useState, useRef, useEffect } from "react";

function useAnimatedNumber(target: number, duration = 400) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>(0);
  const fromRef = useRef<number>(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (target - from) * eased);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  // Sync when first mounting
  useEffect(() => {
    fromRef.current = target;
    setDisplay(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return display;
}

const translations = {
  en: {
    heading: "ROI Calculator",
    title: "Calculate Your Missed Call Cost",
    jobLabel: "What's your average job value?",
    callsLabel: "How many calls do you miss per week?",
    losing: "Total recovered",
    costs: "Capta costs",
    roi: "Your ROI",
    perMonth: "/month",
    return: "return",
    annual: (amount: string) => <>That&apos;s <span className="font-extrabold text-white">{amount} saved per year</span> after Capta.</>,
    cta: "Stop Losing Money",
    showFull: "Show Full ROI",
    hideFull: "Hide Full ROI",
    followUpLabel: "Estimates that close with follow-up",
    recallLabel: "Monthly value from reactivated customers",
    missedCalls: "Missed calls",
    followUps: "Follow-ups",
    recalls: "Recalls",
  },
  es: {
    heading: "Calculadora de ROI",
    title: "Calcula el Costo de tus Llamadas Perdidas",
    jobLabel: "¿Cuál es el valor promedio de tu trabajo?",
    callsLabel: "¿Cuántas llamadas pierdes por semana?",
    losing: "Total recuperado",
    costs: "Capta cuesta",
    roi: "Tu ROI",
    perMonth: "/mes",
    return: "retorno",
    annual: (amount: string) => <>Eso es <span className="font-extrabold text-white">{amount} ahorrados al año</span> con Capta.</>,
    cta: "Deja de Perder Dinero",
    showFull: "Ver ROI Completo",
    hideFull: "Ocultar ROI Completo",
    followUpLabel: "Presupuestos que cierran con seguimiento",
    recallLabel: "Valor mensual de clientes reactivados",
    missedCalls: "Llamadas perdidas",
    followUps: "Seguimientos",
    recalls: "Reactivaciones",
  },
};

function formatDollars(n: number, lang: "en" | "es" = "en") {
  return "$" + n.toLocaleString(lang === "es" ? "es-US" : "en-US");
}

export function ROICalculator({ lang = "en" }: { lang?: "en" | "es" }) {
  const [jobValue, setJobValue] = useState(800);
  const [missedCalls, setMissedCalls] = useState(3);
  const [showFull, setShowFull] = useState(false);
  const [followUpRate, setFollowUpRate] = useState(25);
  const [recallValue, setRecallValue] = useState(500);

  const t = translations[lang];

  const missedRevenue = Math.round(jobValue * missedCalls * 4.33);
  const followUpRevenue = showFull ? Math.round(missedCalls * 2 * (followUpRate / 100) * jobValue * 4.33 * 0.3) : 0;
  const recallRevenue = showFull ? recallValue : 0;
  const totalRecovered = missedRevenue + followUpRevenue + recallRevenue;
  const captaCost = 497;
  const netSavings = totalRecovered - captaCost;
  const roiMultiple = totalRecovered > 0 ? Math.round(((totalRecovered - captaCost) / captaCost) * 100) / 100 : 0;
  const roiDisplay = Math.max(0, Math.round(roiMultiple * 10) / 10);
  const annualSavings = Math.max(0, netSavings * 12);

  const animatedTotal = useAnimatedNumber(totalRecovered);
  const animatedRoi = useAnimatedNumber(Math.round(roiDisplay * 10));
  const animatedAnnual = useAnimatedNumber(annualSavings);

  // Track fill percentage for sliders
  const jobPercent = ((jobValue - 200) / (10000 - 200)) * 100;
  const callsPercent = ((missedCalls - 1) / (20 - 1)) * 100;
  const followUpPercent = ((followUpRate - 5) / (60 - 5)) * 100;
  const recallPercent = (recallValue / 3000) * 100;

  // Breakdown proportions
  const totalForBar = missedRevenue + followUpRevenue + recallRevenue || 1;
  const missedPct = Math.round((missedRevenue / totalForBar) * 100);
  const followUpPct = Math.round((followUpRevenue / totalForBar) * 100);
  const recallPct = 100 - missedPct - followUpPct;

  return (
    <div className="reveal">
      <div className="text-center mb-12">
        <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{t.heading}</p>
        <h2 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[44px]">
          {t.title}
        </h2>
      </div>

      <div
        className="roi-card mx-auto max-w-3xl rounded-2xl p-8 sm:p-12"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 80px rgba(212,168,67,0.06), 0 24px 64px rgba(0,0,0,0.4)",
        }}
      >
        {/* Sliders */}
        <div className="grid gap-10 sm:grid-cols-2">
          {/* Job Value Slider */}
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <label className="text-sm font-medium text-slate-400">{t.jobLabel}</label>
              <span className="text-lg font-extrabold text-white tabular-nums">{formatDollars(jobValue, lang)}</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={200}
                max={10000}
                step={50}
                value={jobValue}
                onChange={(e) => setJobValue(+e.target.value)}
                className="roi-slider w-full"
                style={{ "--fill": `${jobPercent}%` } as React.CSSProperties}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-slate-600">$200</span>
              <span className="text-[11px] text-slate-600">$10,000</span>
            </div>
          </div>

          {/* Missed Calls Slider */}
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <label className="text-sm font-medium text-slate-400">{t.callsLabel}</label>
              <span className="text-lg font-extrabold text-white tabular-nums">{missedCalls}</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={missedCalls}
                onChange={(e) => setMissedCalls(+e.target.value)}
                className="roi-slider w-full"
                style={{ "--fill": `${callsPercent}%` } as React.CSSProperties}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-slate-600">1</span>
              <span className="text-[11px] text-slate-600">20</span>
            </div>
          </div>
        </div>

        {/* Show Full ROI toggle */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowFull(!showFull)}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all"
            style={{
              background: showFull ? "rgba(212,168,67,0.15)" : "rgba(255,255,255,0.06)",
              color: showFull ? "#d4a843" : "#94a3b8",
              border: showFull ? "1px solid rgba(212,168,67,0.3)" : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {showFull ? t.hideFull : t.showFull}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: showFull ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Additional sliders */}
        {showFull && (
          <div className="mt-8 grid gap-10 sm:grid-cols-2">
            {/* Follow-up Rate */}
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <label className="text-sm font-medium text-slate-400">{t.followUpLabel}</label>
                <span className="text-lg font-extrabold text-white tabular-nums">{followUpRate}%</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={followUpRate}
                  onChange={(e) => setFollowUpRate(+e.target.value)}
                  className="roi-slider w-full"
                  style={{ "--fill": `${followUpPercent}%` } as React.CSSProperties}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[11px] text-slate-600">5%</span>
                <span className="text-[11px] text-slate-600">60%</span>
              </div>
            </div>

            {/* Recall Value */}
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <label className="text-sm font-medium text-slate-400">{t.recallLabel}</label>
                <span className="text-lg font-extrabold text-white tabular-nums">{formatDollars(recallValue, lang)}</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={3000}
                  step={100}
                  value={recallValue}
                  onChange={(e) => setRecallValue(+e.target.value)}
                  className="roi-slider w-full"
                  style={{ "--fill": `${recallPercent}%` } as React.CSSProperties}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[11px] text-slate-600">$0</span>
                <span className="text-[11px] text-slate-600">$3,000</span>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="my-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* Output numbers */}
        <div className="grid gap-8 sm:grid-cols-3 text-center">
          {/* Total Recovered */}
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">{t.losing}</p>
            <p className="text-4xl font-black tracking-tight tabular-nums md:text-6xl" style={{ color: "#4ade80" }}>
              {formatDollars(animatedTotal, lang)}
            </p>
            <p className="text-sm text-slate-500 mt-1">{t.perMonth}</p>
          </div>

          {/* Capta Cost */}
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">{t.costs}</p>
            <p className="text-4xl font-black tracking-tight tabular-nums text-white md:text-6xl">
              $497
            </p>
            <p className="text-sm text-slate-500 mt-1">{t.perMonth}</p>
          </div>

          {/* ROI */}
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">{t.roi}</p>
            <p className="text-4xl font-black tracking-tight tabular-nums md:text-6xl" style={{ color: "#d4a843" }}>
              {netSavings > 0 ? `${(animatedRoi / 10).toFixed(1)}:1` : "—"}
            </p>
            <p className="text-sm text-slate-500 mt-1">{t.return}</p>
          </div>
        </div>

        {/* Breakdown bar */}
        {showFull && totalRecovered > 0 && (
          <div className="mt-8">
            <div className="flex h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="transition-all duration-500" style={{ width: `${missedPct}%`, background: "#4ade80" }} />
              <div className="transition-all duration-500" style={{ width: `${followUpPct}%`, background: "#d4a843" }} />
              <div className="transition-all duration-500" style={{ width: `${recallPct}%`, background: "#60a5fa" }} />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#4ade80" }} />
                {t.missedCalls} ({formatDollars(missedRevenue, lang)})
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#d4a843" }} />
                {t.followUps} ({formatDollars(followUpRevenue, lang)})
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#60a5fa" }} />
                {t.recalls} ({formatDollars(recallRevenue, lang)})
              </span>
            </div>
          </div>
        )}

        {/* Annual savings */}
        <div className="mt-10 text-center">
          <p className="text-lg text-slate-400">
            {t.annual(formatDollars(animatedAnnual, lang))}
          </p>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <a
            href="/pricing"
            className="cta-gold cta-shimmer inline-flex items-center justify-center gap-2 rounded-xl px-10 py-4 text-lg font-semibold text-white"
          >
            {t.cta} &rarr;
          </a>
        </div>
      </div>

      {/* Slider styles — scoped to .roi-slider */}
      <style jsx global>{`
        .roi-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(to right, #d4a843 0%, #d4a843 var(--fill), rgba(255,255,255,0.1) var(--fill), rgba(255,255,255,0.1) 100%);
          outline: none;
          cursor: pointer;
        }
        .roi-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #d4a843;
          border: 3px solid #0f1729;
          box-shadow: 0 0 12px rgba(212,168,67,0.4);
          cursor: pointer;
          transition: box-shadow 0.2s ease, transform 0.15s ease;
        }
        .roi-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 20px rgba(212,168,67,0.6);
          transform: scale(1.1);
        }
        .roi-slider::-webkit-slider-thumb:active {
          transform: scale(0.95);
        }
        .roi-slider::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #d4a843;
          border: 3px solid #0f1729;
          box-shadow: 0 0 12px rgba(212,168,67,0.4);
          cursor: pointer;
        }
        .roi-slider::-moz-range-track {
          height: 6px;
          border-radius: 3px;
          background: rgba(255,255,255,0.1);
        }
        .roi-slider::-moz-range-progress {
          height: 6px;
          border-radius: 3px;
          background: #d4a843;
        }
        .roi-card {
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .roi-card:hover {
          border-color: rgba(212,168,67,0.2);
          box-shadow: 0 0 100px rgba(212,168,67,0.08), 0 24px 64px rgba(0,0,0,0.4);
        }
      `}</style>
    </div>
  );
}
