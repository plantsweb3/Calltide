"use client";

import { useState, useRef, useEffect } from "react";

function useAnimatedNumber(target: number, duration = 400) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const fromRef = useRef<number>(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const startTime = performance.now();
    startRef.current = startTime;

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

function formatDollars(n: number) {
  return "$" + n.toLocaleString("en-US");
}

export function ROICalculator() {
  const [jobValue, setJobValue] = useState(800);
  const [missedCalls, setMissedCalls] = useState(3);

  const missedRevenuePerMonth = Math.round(jobValue * missedCalls * 4.33);
  const calltideCost = 497;
  const netSavings = missedRevenuePerMonth - calltideCost;
  const roiMultiple = missedRevenuePerMonth > 0 ? Math.round(((missedRevenuePerMonth - calltideCost) / calltideCost) * 100) / 100 : 0;
  const roiDisplay = Math.max(0, Math.round(roiMultiple * 10) / 10);
  const annualSavings = Math.max(0, netSavings * 12);

  const animatedLoss = useAnimatedNumber(missedRevenuePerMonth);
  const animatedRoi = useAnimatedNumber(Math.round(roiDisplay * 10));
  const animatedAnnual = useAnimatedNumber(annualSavings);

  // Track fill percentage for sliders
  const jobPercent = ((jobValue - 200) / (10000 - 200)) * 100;
  const callsPercent = ((missedCalls - 1) / (20 - 1)) * 100;

  return (
    <div className="reveal">
      <div className="text-center mb-12">
        <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">ROI Calculator</p>
        <h2 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[44px]">
          Calculate Your Missed Call Cost
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
              <label className="text-sm font-medium text-slate-400">What&apos;s your average job value?</label>
              <span className="text-lg font-extrabold text-white tabular-nums">{formatDollars(jobValue)}</span>
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
              <label className="text-sm font-medium text-slate-400">How many calls do you miss per week?</label>
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

        {/* Divider */}
        <div className="my-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* Output numbers */}
        <div className="grid gap-8 sm:grid-cols-3 text-center">
          {/* Missed Revenue */}
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">You&apos;re losing</p>
            <p className="text-4xl font-black tracking-tight tabular-nums md:text-6xl" style={{ color: "#f97316" }}>
              {formatDollars(animatedLoss)}
            </p>
            <p className="text-sm text-slate-500 mt-1">/month</p>
          </div>

          {/* Calltide Cost */}
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">Calltide costs</p>
            <p className="text-4xl font-black tracking-tight tabular-nums text-white md:text-6xl">
              $497
            </p>
            <p className="text-sm text-slate-500 mt-1">/month</p>
          </div>

          {/* ROI */}
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">Your ROI</p>
            <p className="text-4xl font-black tracking-tight tabular-nums md:text-6xl" style={{ color: "#d4a843" }}>
              {netSavings > 0 ? `${(animatedRoi / 10).toFixed(1)}:1` : "—"}
            </p>
            <p className="text-sm text-slate-500 mt-1">return</p>
          </div>
        </div>

        {/* Annual savings */}
        <div className="mt-10 text-center">
          <p className="text-lg text-slate-400">
            That&apos;s{" "}
            <span className="font-extrabold text-white">{formatDollars(animatedAnnual)} saved per year</span>
            {" "}after Calltide.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <a
            href="/pricing"
            className="cta-gold cta-shimmer inline-flex items-center justify-center gap-2 rounded-xl px-10 py-4 text-lg font-semibold text-white"
          >
            Stop Losing Money &rarr;
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
