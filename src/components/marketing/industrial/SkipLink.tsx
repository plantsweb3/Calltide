"use client";

import { C } from "./palette";
import type { Lang } from "@/lib/marketing/translations";

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
        fontWeight: 700,
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
