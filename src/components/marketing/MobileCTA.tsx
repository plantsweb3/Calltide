"use client";

import { useState, useEffect } from "react";
import { T, type Lang } from "@/lib/marketing/translations";

export function MobileCTA({ lang }: { lang: Lang }) {
  const t = T[lang].hero;
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    function onScroll() { setShow(window.scrollY > 400); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm px-4 py-3 md:hidden transition-transform duration-300 ${show ? "translate-y-0" : "translate-y-full"}`}>
      <div className="flex items-center gap-2">
        <a href="/setup" className="cta-gold cta-shimmer flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-sm font-bold text-white shadow-lg">
          {t.cta}
        </a>
        <button onClick={() => setDismissed(true)} className="flex h-10 w-10 shrink-0 items-center justify-center text-charcoal-light" aria-label="Dismiss">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}
