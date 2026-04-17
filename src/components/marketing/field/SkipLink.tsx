"use client";

import { C } from "./palette";
import type { Lang } from "@/lib/marketing/translations";

/**
 * Accessibility: keyboard skip-to-main-content link that only appears on focus.
 */
export function SkipLink({ lang }: { lang: Lang }) {
  return (
    <a
      href="#main"
      style={{
        position: "absolute",
        top: -40,
        left: 0,
        background: C.ink,
        color: C.paper,
        padding: "8px 12px",
        fontSize: 14,
        fontWeight: 600,
        zIndex: 100,
        textDecoration: "none",
      }}
      onFocus={(e) => (e.currentTarget.style.top = "0")}
      onBlur={(e) => (e.currentTarget.style.top = "-40px")}
    >
      {lang === "es" ? "Saltar al contenido" : "Skip to content"}
    </a>
  );
}
