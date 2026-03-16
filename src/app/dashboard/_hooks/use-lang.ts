"use client";

import { useState, useEffect, useCallback } from "react";
import type { Lang } from "@/lib/i18n/strings";

const STORAGE_KEY = "capta-lang";
const DEFAULT_LANG: Lang = "en";

/**
 * React hook that reads the user's language preference from localStorage
 * (`capta-lang` key) and keeps it in sync across the session.
 *
 * Returns `[lang, setLang]` — call `setLang` to switch language and
 * persist the choice to localStorage automatically.
 *
 * Usage:
 *   const [lang, setLang] = useLang();
 *   const label = t("metric.callsToday", lang);
 */
export function useLang(): [Lang, (next: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "en" || saved === "es") return saved;
      } catch {
        // localStorage may be unavailable (SSR, private browsing)
      }
    }
    return DEFAULT_LANG;
  });

  // Re-read on mount to handle SSR hydration mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "es") {
        setLangState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  // Listen for changes from other tabs / components
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && (e.newValue === "en" || e.newValue === "es")) {
        setLangState(e.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  return [lang, setLang];
}
