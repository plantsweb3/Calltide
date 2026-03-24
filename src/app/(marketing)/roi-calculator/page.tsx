"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useScrollReveal } from "@/lib/marketing/hooks";

/* ─── Trade definitions ─── */

const TRADES = [
  { value: "plumber", label: "Plumber", avgJob: 450 },
  { value: "hvac", label: "HVAC", avgJob: 500 },
  { value: "electrician", label: "Electrician", avgJob: 350 },
  { value: "roofer", label: "Roofer", avgJob: 800 },
  { value: "landscaper", label: "Landscaper", avgJob: 250 },
  { value: "general_contractor", label: "General Contractor", avgJob: 600 },
  { value: "other", label: "Other", avgJob: 400 },
] as const;

type TradeValue = (typeof TRADES)[number]["value"];

const COVERAGE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "voicemail", label: "Voicemail" },
  { value: "answering_service", label: "Answering service" },
] as const;

type CoverageValue = (typeof COVERAGE_OPTIONS)[number]["value"];

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

/* ─── Metadata (exported from a client component via head) ─── */

function PageHead() {
  return (
    <>
      <title>ROI Calculator &mdash; See How Much Capta Saves Your Business</title>
      <meta
        name="description"
        content="Calculate how much revenue your home service business loses to missed calls every month — and see exactly how Capta pays for itself."
      />
      <meta property="og:title" content="ROI Calculator | Capta" />
      <meta
        property="og:description"
        content="Calculate how much revenue your home service business loses to missed calls and see your ROI with Capta."
      />
      <meta property="og:url" content="https://captahq.com/roi-calculator" />
      <meta property="og:site_name" content="Capta" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="ROI Calculator | Capta" />
      <meta
        name="twitter:description"
        content="Calculate how much revenue your home service business loses to missed calls and see your ROI with Capta."
      />
      <link rel="canonical" href="https://captahq.com/roi-calculator" />
    </>
  );
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
        return "With no after-hours coverage, you are likely missing every call outside business hours.";
      case "voicemail":
        return "Studies show 80% of callers won't leave a voicemail — they call your competitor instead.";
      case "answering_service":
        return "Answering services average $700-$1,600/mo and still can't book jobs or generate estimates.";
      default:
        return "";
    }
  }, [coverage]);

  return (
    <>
      <PageHead />

      {/* Hero */}
      <section
        className="relative px-6 sm:px-8 pt-24 pb-8 sm:pt-32 sm:pb-12"
        style={{ background: "#0f1729" }}
      >
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="reveal text-[13px] font-bold uppercase tracking-[0.15em] text-slate-400">
            ROI Calculator
          </p>
          <h1
            className="reveal mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[52px]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            See How Much Revenue You&apos;re Losing to Missed Calls
          </h1>
          <p className="reveal mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
            Plug in your numbers. See the math. Decide if Capta pays for
            itself.
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
                  Your trade
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
                  {TRADES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* After-hours coverage */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Current after-hours coverage
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
                  {COVERAGE_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Average job value slider */}
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <label className="text-sm font-medium text-slate-400">
                    Average job value
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
                    Estimated missed calls per week
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
                Your Numbers
              </p>
            </div>

            {/* Output stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Monthly revenue lost"
                value={formatDollars(animatedMonthlyLost)}
                sub="/month"
                color="#ef4444"
              />
              <StatCard
                label="Annual revenue lost"
                value={formatDollars(animatedAnnualLost)}
                sub="/year"
                color="#ef4444"
              />
              <StatCard
                label="Capta cost"
                value="$497"
                sub="/month"
                color="white"
              />
              <StatCard
                label="Your ROI"
                value={
                  animatedRoi > 0
                    ? `${(animatedRoi / 10).toFixed(1)}x`
                    : "--"
                }
                sub="return"
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
                  Jobs to break even
                </p>
                <p
                  className="text-5xl font-extrabold tracking-tight tabular-nums sm:text-6xl"
                  style={{ color: "#4ade80" }}
                >
                  {calculations.jobsToBreakEven}
                </p>
                <p className="mt-3 text-base text-slate-300">
                  If Capta books just{" "}
                  <span className="font-extrabold text-white">
                    {calculations.jobsToBreakEven} job
                    {calculations.jobsToBreakEven !== 1 ? "s" : ""}
                  </span>{" "}
                  you&apos;d miss, she&apos;s free.
                </p>
              </div>
            </div>

            {/* Net annual savings */}
            {calculations.netAnnualSavings > 0 && (
              <div className="mt-8 text-center">
                <p className="text-lg text-slate-400">
                  That&apos;s{" "}
                  <span className="font-extrabold text-white">
                    {formatDollars(animatedNetAnnual)} saved per year
                  </span>{" "}
                  after paying for Capta.
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-10 text-center">
              <a
                href="/setup"
                className="cta-gold cta-shimmer inline-flex items-center justify-center gap-2 rounded-xl px-10 py-4 text-lg font-semibold text-white"
              >
                Get Capta &rarr;
              </a>
              <p className="mt-4 text-sm text-slate-500">
                30-day money-back guarantee. Cancel anytime.
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
            The Math Behind the Calculator
          </h2>
          <div className="reveal grid gap-6 sm:grid-cols-3">
            {[
              {
                stat: "25%",
                label: "Conversion rate",
                desc: "The average conversion rate for inbound calls in home services.",
              },
              {
                stat: "62%",
                label: "Calls missed after hours",
                desc: "Most home service calls come when you can't answer — evenings, weekends, lunch.",
              },
              {
                stat: "80%",
                label: "Won't leave a voicemail",
                desc: "Callers who hit voicemail call your competitor instead of leaving a message.",
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
              A bilingual receptionist costs{" "}
              <span className="font-semibold text-white">
                $3,000-$4,000/month
              </span>
              .
            </p>
            <p className="text-lg text-slate-400">
              An answering service costs{" "}
              <span className="font-semibold text-white">
                $700-$1,600/month
              </span>{" "}
              and can&apos;t book jobs.
            </p>
            <p className="text-lg text-slate-400">
              Capta costs{" "}
              <span className="font-semibold text-white">$497/month</span>,
              answers 24/7, books appointments, generates estimates, and never
              calls in sick.
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
            Stop losing revenue. Start today.
          </h2>
          <p className="reveal mt-5 text-lg text-slate-400">
            Capta pays for itself after just{" "}
            {calculations.jobsToBreakEven} booked job
            {calculations.jobsToBreakEven !== 1 ? "s" : ""}.
          </p>
          <div className="reveal mt-8">
            <a
              href="/setup"
              className="cta-gold cta-shimmer inline-flex items-center justify-center gap-2 rounded-xl px-10 py-4 text-lg font-semibold text-white"
            >
              Get Capta &rarr;
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            30-day money-back guarantee. Cancel anytime. No contracts.
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
