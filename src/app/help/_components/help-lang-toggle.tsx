"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "calltide_help_lang";

interface Props {
  lang: "en" | "es";
  /** If true, auto-redirect to saved language on mount (used on landing pages only) */
  autoRedirect?: boolean;
}

export default function HelpLangToggle({ lang, autoRedirect }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (autoRedirect) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved !== lang) {
        const target = saved === "es"
          ? pathname.replace(/^\/help/, "/es/help")
          : pathname.replace(/^\/es\/help/, "/help");
        if (target !== pathname) router.replace(target);
      }
    }
  }, [autoRedirect, lang, pathname, router]);

  function toggle() {
    const next = lang === "en" ? "es" : "en";
    localStorage.setItem(STORAGE_KEY, next);

    const target = next === "es"
      ? pathname.replace(/^\/help/, "/es/help")
      : pathname.replace(/^\/es\/help/, "/help");
    router.push(target);
  }

  if (!mounted) {
    return (
      <button className="rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "#E2E8F0", color: "#475569" }}>
        {lang === "en" ? "EN" : "ES"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:border-amber-400"
      style={{ borderColor: "#E2E8F0", color: "#475569" }}
      title={lang === "en" ? "Cambiar a Español" : "Switch to English"}
    >
      <span className={lang === "en" ? "font-bold" : "opacity-50"} style={lang === "en" ? { color: "#1A1D24" } : undefined}>EN</span>
      <span style={{ color: "#CBD5E1" }}>/</span>
      <span className={lang === "es" ? "font-bold" : "opacity-50"} style={lang === "es" ? { color: "#1A1D24" } : undefined}>ES</span>
    </button>
  );
}
