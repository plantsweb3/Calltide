"use client";

import { useState, useCallback } from "react";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { useScrolled } from "@/lib/marketing/hooks";
import type { Lang } from "@/lib/marketing/translations";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const scrolled = useScrolled();

  const toggleLang = useCallback((l: Lang) => {
    setLang(l);
    if (typeof window !== "undefined") localStorage.setItem("calltide-lang", l);
  }, []);

  // Restore language on mount
  useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("calltide-lang");
      if (saved === "en" || saved === "es") setLang(saved);
    }
  });

  return (
    <div className="relative overflow-x-hidden">
      <Nav lang={lang} toggleLang={toggleLang} scrolled={scrolled} />
      {children}
      <Footer lang={lang} />
      <div className="h-16 md:hidden" />
    </div>
  );
}
