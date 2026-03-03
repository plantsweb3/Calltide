"use client";

import { useState } from "react";
import { T, type Lang } from "@/lib/marketing/translations";

export function ROICalculator({ lang }: { lang: Lang }) {
  const t = T[lang].roi;
  const [missedCalls, setMissedCalls] = useState(12);
  const [jobValue, setJobValue] = useState(350);

  const monthlyLoss = Math.round(missedCalls * jobValue * 4.33);

  return (
    <div className="reveal mx-auto max-w-xl">
      <div className="card-shadow rounded-xl border border-cream-border bg-white p-8 sm:p-10">
        <h3 className="text-xl font-extrabold tracking-tight text-charcoal">{t.calcTitle}</h3>

        <div className="mt-6 space-y-6">
          <div>
            <label className="flex justify-between text-sm font-medium text-charcoal-muted">
              <span>{t.calcCalls}</span>
              <span className="font-bold text-charcoal">{missedCalls}</span>
            </label>
            <input type="range" min={1} max={50} step={1} value={missedCalls} onChange={(e) => setMissedCalls(+e.target.value)}
              className="mt-2 w-full accent-amber" />
          </div>

          <div>
            <label className="flex justify-between text-sm font-medium text-charcoal-muted">
              <span>{t.calcValue}</span>
              <span className="font-bold text-charcoal">${jobValue}</span>
            </label>
            <input type="range" min={100} max={2000} step={50} value={jobValue} onChange={(e) => setJobValue(+e.target.value)}
              className="mt-2 w-full accent-amber" />
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-navy p-6 text-center">
          <p className="text-sm text-slate-400">{t.calcResult}</p>
          <p className="mt-1 text-[40px] font-extrabold tracking-tight text-white">
            ${monthlyLoss.toLocaleString()}
          </p>
          <p className="text-sm text-slate-400">{t.calcPerMonth}</p>
          {monthlyLoss > 497 && (
            <p className="mt-3 text-sm font-semibold text-emerald-400">
              {lang === "en"
                ? `Calltide pays for itself ${Math.floor(monthlyLoss / 497)}x over at $497/mo`
                : `Calltide se paga solo ${Math.floor(monthlyLoss / 497)}x a $497/mes`}
            </p>
          )}
        </div>

        <a
          href="#signup"
          className="cta-gold cta-shimmer mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-base font-semibold text-white"
        >
          {t.calcCta}
        </a>
      </div>
    </div>
  );
}
