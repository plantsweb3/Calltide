"use client";

import { useState } from "react";
import { T, type Lang } from "@/lib/marketing/translations";

export function FAQ({ lang }: { lang: Lang }) {
  const t = T[lang].faq;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-2xl divide-y divide-cream-border">
      {t.items.map((faq, i) => (
        <div key={i} className="faq-item">
          <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="flex w-full items-center justify-between py-6 text-left">
            <span className="pr-4 text-lg font-semibold text-charcoal">{faq.q}</span>
            <span className={`faq-plus shrink-0 text-xl font-bold transition-all duration-300 ${openIndex === i ? "text-amber" : "text-charcoal-light"}`}>
              {openIndex === i ? "\u2212" : "+"}
            </span>
          </button>
          <div className={`faq-answer ${openIndex === i ? "open" : ""}`}>
            <div><p className="pb-6 text-base leading-[1.7] text-charcoal-muted">{faq.a}</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}
