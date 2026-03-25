"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useScrollReveal } from "@/lib/marketing/hooks";
import type { Lang } from "@/lib/marketing/translations";

/* ─── Translations ─── */

const T = {
  en: {
    badge: "ROI Calculator",
    heroH: "See How Much Revenue You're Losing to Missed Calls",
    heroSub: "Plug in your numbers. See the math. Decide if Capta pays for itself.",
    yourTrade: "Your trade",
    afterHoursCoverage: "Current after-hours coverage",
    avgJobValue: "Average job value",
    missedCallsPerWeek: "Estimated missed calls per week",
    yourNumbers: "Your Numbers",
    monthlyRevenueLost: "Monthly revenue lost",
    annualRevenueLost: "Annual revenue lost",
    captaCost: "Capta cost",
    yourROI: "Your ROI",
    perMonth: "/month",
    perYear: "/year",
    return: "return",
    jobsToBreakEven: "Jobs to break even",
    breakEvenPrefix: "If Capta books just",
    breakEvenJob: "job",
    breakEvenJobs: "jobs",
    breakEvenSuffix: "you'd miss, she's free.",
    netAnnualPrefix: "That's",
    netAnnualSuffix: "saved per year",
    netAnnualAfter: "after paying for Capta.",
    cta: "Start Free Trial",
    guarantee: "Free for 14 days. Cancel anytime.",
    mathTitle: "The Math Behind the Calculator",
    conversionRate: "Conversion rate",
    conversionDesc: "The average conversion rate for inbound calls in home services.",
    missedAfterHours: "Calls missed after hours",
    missedAfterHoursDesc: "Most home service calls come when you can't answer — evenings, weekends, lunch.",
    wontLeaveVM: "Won't leave a voicemail",
    wontLeaveVMDesc: "Callers who hit voicemail call your competitor instead of leaving a message.",
    compReceptionist: "A bilingual receptionist costs",
    compReceptionistCost: "$3,000-$4,000/month",
    compService: "An answering service costs",
    compServiceCost: "$700-$1,600/month",
    compCapta: "Capta costs",
    compCaptaCost: "$497/month",
    compCaptaDesc: ", answers 24/7, books appointments, generates estimates, and never calls in sick.",
    finalH: "Stop losing revenue. Start today.",
    finalSub: "Capta pays for itself after just",
    finalJob: "booked job",
    finalJobs: "booked jobs",
    guaranteeFull: "Free for 14 days. Cancel anytime. No contracts.",
    coverageNone: "With no after-hours coverage, you are likely missing every call outside business hours.",
    coverageVM: "Studies show 80% of callers won't leave a voicemail — they call your competitor instead.",
    coverageAS: "Answering services average $700-$1,600/mo and still can't book jobs or generate estimates.",
    trades: {
      plumber: "Plumber",
      hvac: "HVAC",
      electrician: "Electrician",
      roofer: "Roofer",
      landscaper: "Landscaper",
      general_contractor: "General Contractor",
      other: "Other",
    },
    coverageOptions: {
      none: "None",
      voicemail: "Voicemail",
      answering_service: "Answering service",
    },
  },
  es: {
    badge: "Calculadora de ROI",
    heroH: "Descubre Cuántos Ingresos Pierdes por Llamadas No Contestadas",
    heroSub: "Ingresa tus números. Mira las cuentas. Decide si Capta se paga solo.",
    yourTrade: "Tu oficio",
    afterHoursCoverage: "Cobertura fuera de horario actual",
    avgJobValue: "Valor promedio del trabajo",
    missedCallsPerWeek: "Llamadas perdidas estimadas por semana",
    yourNumbers: "Tus Números",
    monthlyRevenueLost: "Ingresos perdidos por mes",
    annualRevenueLost: "Ingresos perdidos por año",
    captaCost: "Costo de Capta",
    yourROI: "Tu ROI",
    perMonth: "/mes",
    perYear: "/año",
    return: "retorno",
    jobsToBreakEven: "Trabajos para punto de equilibrio",
    breakEvenPrefix: "Si Capta agenda solo",
    breakEvenJob: "trabajo",
    breakEvenJobs: "trabajos",
    breakEvenSuffix: "que perderías, es gratis.",
    netAnnualPrefix: "Eso es",
    netAnnualSuffix: "ahorrados por año",
    netAnnualAfter: "después de pagar Capta.",
    cta: "Prueba Gratis",
    guarantee: "Gratis por 14 días. Cancela cuando quieras.",
    mathTitle: "Las Cuentas Detrás de la Calculadora",
    conversionRate: "Tasa de conversión",
    conversionDesc: "La tasa promedio de conversión para llamadas entrantes en servicios del hogar.",
    missedAfterHours: "Llamadas perdidas fuera de horario",
    missedAfterHoursDesc: "La mayoría de las llamadas de servicios llegan cuando no puedes contestar — noches, fines de semana, hora de almuerzo.",
    wontLeaveVM: "No dejan mensaje de voz",
    wontLeaveVMDesc: "Los llamantes que llegan al buzón de voz llaman a tu competencia en vez de dejar un mensaje.",
    compReceptionist: "Una recepcionista bilingüe cuesta",
    compReceptionistCost: "$3,000-$4,000/mes",
    compService: "Un servicio de contestación cuesta",
    compServiceCost: "$700-$1,600/mes",
    compCapta: "Capta cuesta",
    compCaptaCost: "$497/mes",
    compCaptaDesc: ", contesta 24/7, agenda citas, genera presupuestos, y nunca se enferma.",
    finalH: "Deja de perder ingresos. Empieza hoy.",
    finalSub: "Capta se paga solo después de solo",
    finalJob: "trabajo agendado",
    finalJobs: "trabajos agendados",
    guaranteeFull: "Gratis por 14 días. Cancela cuando quieras. Sin contratos.",
    coverageNone: "Sin cobertura fuera de horario, probablemente estás perdiendo cada llamada fuera de horas de oficina.",
    coverageVM: "Los estudios muestran que el 80% de los llamantes no dejan mensaje de voz — llaman a tu competencia.",
    coverageAS: "Los servicios de contestación cuestan $700-$1,600/mes y no pueden agendar trabajos ni generar presupuestos.",
    trades: {
      plumber: "Plomero",
      hvac: "HVAC",
      electrician: "Electricista",
      roofer: "Techador",
      landscaper: "Jardinero",
      general_contractor: "Contratista General",
      other: "Otro",
    },
    coverageOptions: {
      none: "Ninguna",
      voicemail: "Buzón de voz",
      answering_service: "Servicio de contestación",
    },
  },
};

/* ─── Trade definitions ─── */

const TRADES = [
  { value: "plumber", avgJob: 450 },
  { value: "hvac", avgJob: 500 },
  { value: "electrician", avgJob: 350 },
  { value: "roofer", avgJob: 800 },
  { value: "landscaper", avgJob: 250 },
  { value: "general_contractor", avgJob: 600 },
  { value: "other", avgJob: 400 },
] as const;

type TradeValue = (typeof TRADES)[number]["value"];

const COVERAGE_VALUES = ["none", "voicemail", "answering_service"] as const;
type CoverageValue = (typeof COVERAGE_VALUES)[number];

const WEEKS_PER_MONTH = 4.33;
const CONVERSION_RATE = 0.25;
const CAPTA_COST = 497;

/* ─── Animated number hook ─── */

function useAnimatedNumber(target: number, duration = 500) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef(0);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
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

  useEffect(() => {
    fromRef.current = target;
    setDisplay(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return display;
}

/* ─── Dollar formatter ─── */

function formatDollars(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

/* ─── Stat card ─── */

function StatCard({
  label,
  value,
  sub,
  color,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-xl px-5 py-6 text-center"
      style={{
        background: highlight
          ? "rgba(212,168,67,0.08)"
          : "rgba(255,255,255,0.03)",
        border: highlight
          ? "1px solid rgba(212,168,67,0.2)"
          : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <p className="text-sm font-medium text-slate-500 mb-2">{label}</p>
      <p
        className="text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl"
        style={{ color: color || "white" }}
      >
        {value}
      </p>
      {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Main page component ─── */

export default function ROICalculatorPage() {
  useScrollReveal();

  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem("capta-lang");
    if (saved === "en" || saved === "es") setLang(saved);
  }, []);

  const s = T[lang];

  const [trade, setTrade] = useState<TradeValue>("plumber");
  const [avgJobValue, setAvgJobValue] = useState(450);
  const [missedCallsPerWeek, setMissedCallsPerWeek] = useState(10);
  const [coverage, setCoverage] = useState<CoverageValue>("none");

  // When trade changes, update the default job value
  function handleTradeChange(value: TradeValue) {
    setTrade(value);
    const found = TRADES.find((t) => t.value === value);
    if (found) setAvgJobValue(found.avgJob);
  }

  // Calculations
  const calculations = useMemo(() => {
    const monthlyMissed = missedCallsPerWeek * WEEKS_PER_MONTH;
    const monthlyRevenueLost = Math.round(
      monthlyMissed * avgJobValue * CONVERSION_RATE
    );
    const annualRevenueLost = monthlyRevenueLost * 12;
    const roi =
      CAPTA_COST > 0
        ? Math.round((monthlyRevenueLost / CAPTA_COST) * 10) / 10
        : 0;
    const jobsToBreakEven = Math.ceil(CAPTA_COST / avgJobValue);
    const netMonthlySavings = Math.max(0, monthlyRevenueLost - CAPTA_COST);
    const netAnnualSavings = netMonthlySavings * 12;

    return {
      monthlyRevenueLost,
      annualRevenueLost,
      roi,
      jobsToBreakEven,
      netMonthlySavings,
      netAnnualSavings,
    };
  }, [missedCallsPerWeek, avgJobValue]);

  const animatedMonthlyLost = useAnimatedNumber(
    calculations.monthlyRevenueLost
  );
  const animatedAnnualLost = useAnimatedNumber(calculations.annualRevenueLost);
  const animatedRoi = useAnimatedNumber(Math.round(calculations.roi * 10));
  const animatedNetAnnual = useAnimatedNumber(calculations.netAnnualSavings);

  // Slider fill percentages
  const jobPercent = ((avgJobValue - 100) / (5000 - 100)) * 100;
  const callsPercent = ((missedCallsPerWeek - 1) / (50 - 1)) * 100;

  // Coverage context message
  const coverageNote = useMemo(() => {
    switch (coverage) {
      case "none":
        return s.coverageNone;
      case "voicemail":
        return s.coverageVM;
      case "answering_service":
        return s.coverageAS;
      default:
        return "";
    }
  }, [coverage, s]);

  return (
    <>
      {/* Hero */}
      <section
        className="relative px-6 sm:px-8 pt-24 pb-8 sm:pt-32 sm:pb-12"
        style={{ background: "#0f1729" }}
      >
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="reveal text-[13px] font-bold uppercase tracking-[0.15em] text-slate-400">
            {s.badge}
          </p>
          <h1
            className="reveal mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[52px]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {s.heroH}
          </h1>
          <p className="reveal mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
            {s.heroSub}
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section
        className="relative px-6 sm:px-8 pt-8 pb-24 sm:pt-12 sm:pb-32"
        style={{ background: "#0f1729" }}
      >
        <div className="mx-auto max-w-4xl">
          <div
            className="reveal calc-card rounded-2xl p-6 sm:p-10"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow:
                "0 0 80px rgba(212,168,67,0.06), 0 24px 64px rgba(0,0,0,0.4)",
            }}
          >
            {/* Inputs */}
            <div className="grid gap-8 sm:grid-cols-2">
              {/* Trade type */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {s.yourTrade}
                </label>
                <select
                  value={trade}
                  onChange={(e) =>
                    handleTradeChange(e.target.value as TradeValue)
                  }
                  className="calc-select w-full rounded-lg px-4 py-3 text-sm font-medium text-white outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {TRADES.map((tr) => (
                    <option key={tr.value} value={tr.value}>
                      {s.trades[tr.value]}
                    </option>
                  ))}
                </select>
              </div>

              {/* After-hours coverage */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {s.afterHoursCoverage}
                </label>
                <select
                  value={coverage}
                  onChange={(e) =>
                    setCoverage(e.target.value as CoverageValue)
                  }
                  className="calc-select w-full rounded-lg px-4 py-3 text-sm font-medium text-white outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {COVERAGE_VALUES.map((cv) => (
                    <option key={cv} value={cv}>
                      {s.coverageOptions[cv]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Average job value slider */}
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <label className="text-sm font-medium text-slate-400">
                    {s.avgJobValue}
                  </label>
                  <span className="text-lg font-extrabold text-white tabular-nums">
                    {formatDollars(avgJobValue)}
                  </span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={5000}
                  step={25}
                  value={avgJobValue}
                  onChange={(e) => setAvgJobValue(+e.target.value)}
                  className="roi-slider w-full"
                  style={
                    { "--fill": `${jobPercent}%` } as React.CSSProperties
                  }
                />
                <div className="flex justify-between mt-1.5">
                  <span className="text-[11px] text-slate-600">$100</span>
                  <span className="text-[11px] text-slate-600">$5,000</span>
                </div>
              </div>

              {/* Missed calls per week slider */}
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <label className="text-sm font-medium text-slate-400">
                    {s.missedCallsPerWeek}
                  </label>
                  <span className="text-lg font-extrabold text-white tabular-nums">
                    {missedCallsPerWeek}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={missedCallsPerWeek}
                  onChange={(e) => setMissedCallsPerWeek(+e.target.value)}
                  className="roi-slider w-full"
                  style={
                    { "--fill": `${callsPercent}%` } as React.CSSProperties
                  }
                />
                <div className="flex justify-between mt-1.5">
                  <span className="text-[11px] text-slate-600">1</span>
                  <span className="text-[11px] text-slate-600">50</span>
                </div>
              </div>
            </div>

            {/* Coverage context note */}
            <div
              className="mt-8 rounded-lg px-5 py-3 text-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-sm text-slate-400">{coverageNote}</p>
            </div>

            {/* Divider */}
            <div
              className="my-10"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            />

            {/* Results heading */}
            <div className="text-center mb-8">
              <p className="text-[13px] font-bold uppercase tracking-[0.15em] text-slate-500">
                {s.yourNumbers}
              </p>
            </div>

            {/* Output stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label={s.monthlyRevenueLost}
                value={formatDollars(animatedMonthlyLost)}
                sub={s.perMonth}
                color="#ef4444"
              />
              <StatCard
                label={s.annualRevenueLost}
                value={formatDollars(animatedAnnualLost)}
                sub={s.perYear}
                color="#ef4444"
              />
              <StatCard
                label={s.captaCost}
                value="$497"
                sub={s.perMonth}
                color="white"
              />
              <StatCard
                label={s.yourROI}
                value={
                  animatedRoi > 0
                    ? `${(animatedRoi / 10).toFixed(1)}x`
                    : "--"
                }
                sub={s.return}
                color="#d4a843"
                highlight
              />
            </div>

            {/* Jobs to break even */}
            <div className="mt-10 text-center">
              <div
                className="inline-block rounded-xl px-8 py-6"
                style={{
                  background: "rgba(74,222,128,0.06)",
                  border: "1px solid rgba(74,222,128,0.15)",
                }}
              >
                <p className="text-sm font-medium text-slate-400 mb-2">
                  {s.jobsToBreakEven}
                </p>
                <p
                  className="text-5xl font-extrabold tracking-tight tabular-nums sm:text-6xl"
                  style={{ color: "#4ade80" }}
                >
                  {calculations.jobsToBreakEven}
                </p>
                <p className="mt-3 text-base text-slate-300">
                  {s.breakEvenPrefix}{" "}
                  <span className="font-extrabold text-white">
                    {calculations.jobsToBreakEven}{" "}
                    {calculations.jobsToBreakEven !== 1 ? s.breakEvenJobs : s.breakEvenJob}
                  </span>{" "}
                  {s.breakEvenSuffix}
                </p>
              </div>
            </div>

            {/* Net annual savings */}
            {calculations.netAnnualSavings > 0 && (
              <div className="mt-8 text-center">
                <p className="text-lg text-slate-400">
                  {s.netAnnualPrefix}{" "}
                  <span className="font-extrabold text-white">
                    {formatDollars(animatedNetAnnual)} {s.netAnnualSuffix}
                  </span>{" "}
                  {s.netAnnualAfter}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-10 text-center">
              <a
                href="/setup"
                className="cta-gold cta-shimmer inline-flex items-center justify-center gap-2 rounded-xl px-10 py-4 text-lg font-semibold text-white"
              >
                {s.cta} &rarr;
              </a>
              <p className="mt-4 text-sm text-slate-500">
                {s.guarantee}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof / context section */}
      <section
        className="px-6 sm:px-8 py-20 sm:py-28"
        style={{ background: "#111a2e" }}
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="reveal text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl mb-12">
            {s.mathTitle}
          </h2>
          <div className="reveal grid gap-6 sm:grid-cols-3">
            {[
              {
                stat: "25%",
                label: s.conversionRate,
                desc: s.conversionDesc,
              },
              {
                stat: "62%",
                label: s.missedAfterHours,
                desc: s.missedAfterHoursDesc,
              },
              {
                stat: "80%",
                label: s.wontLeaveVM,
                desc: s.wontLeaveVMDesc,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl px-6 py-6 text-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p
                  className="text-3xl font-extrabold tracking-tight"
                  style={{ color: "#d4a843" }}
                >
                  {item.stat}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {item.label}
                </p>
                <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison section */}
      <section
        className="px-6 sm:px-8 py-20 sm:py-28"
        style={{ background: "#0f1729" }}
      >
        <div className="mx-auto max-w-2xl">
          <div className="reveal text-center space-y-5">
            <p className="text-lg text-slate-400">
              {s.compReceptionist}{" "}
              <span className="font-semibold text-white">
                {s.compReceptionistCost}
              </span>
              .
            </p>
            <p className="text-lg text-slate-400">
              {s.compService}{" "}
              <span className="font-semibold text-white">
                {s.compServiceCost}
              </span>
              .
            </p>
            <p className="text-lg text-slate-400">
              {s.compCapta}{" "}
              <span className="font-semibold text-white">{s.compCaptaCost}</span>
              {s.compCaptaDesc}
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="relative px-6 sm:px-8 py-24 sm:py-32 overflow-hidden"
        style={{ background: "#111a2e" }}
      >
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="reveal text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[40px]">
            {s.finalH}
          </h2>
          <p className="reveal mt-5 text-lg text-slate-400">
            {s.finalSub}{" "}
            {calculations.jobsToBreakEven}{" "}
            {calculations.jobsToBreakEven !== 1 ? s.finalJobs : s.finalJob}.
          </p>
          <div className="reveal mt-8">
            <a
              href="/setup"
              className="cta-gold cta-shimmer inline-flex items-center justify-center gap-2 rounded-xl px-10 py-4 text-lg font-semibold text-white"
            >
              {s.cta} &rarr;
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            {s.guaranteeFull}
          </p>
        </div>
      </section>

      {/* Scoped styles */}
      <style jsx global>{`
        .calc-card {
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .calc-card:hover {
          border-color: rgba(212, 168, 67, 0.2);
          box-shadow: 0 0 100px rgba(212, 168, 67, 0.08),
            0 24px 64px rgba(0, 0, 0, 0.4);
        }
        .calc-select {
          -webkit-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px;
          padding-right: 36px;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }
        .calc-select:focus {
          border-color: rgba(212, 168, 67, 0.4);
        }
        .calc-select option {
          background: #1a2744;
          color: white;
        }
      `}</style>
    </>
  );
}
