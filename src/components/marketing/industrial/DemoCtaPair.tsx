"use client";

import { PrimaryButton, SecondaryButton } from "./atoms";
import type { Lang } from "@/lib/marketing/translations";

/**
 * Paired CTA set — "Get Capta" (gold) + "Call audit" (outline).
 *
 * Per brand kit: primary CTA is always "Get Capta →", not "Start free
 * trial". The 14-day trial is messaged as a benefit elsewhere.
 */
const CTA_COPY = {
  en: { primary: "Get Capta", demo: "Get a free call audit" },
  es: { primary: "Obtener Capta", demo: "Auditoría gratis" },
};

export function DemoCtaPair({
  lang,
  size = "lg",
  tone = "light",
}: {
  lang: Lang;
  size?: "md" | "lg";
  tone?: "light" | "dark";
}) {
  const t = CTA_COPY[lang];
  const setupHref = lang === "es" ? "/es/setup" : "/setup";
  const demoHref = "/audit";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <PrimaryButton href={setupHref} size={size}>
        {t.primary}
      </PrimaryButton>
      <SecondaryButton href={demoHref} size={size} tone={tone}>
        {t.demo}
      </SecondaryButton>
    </div>
  );
}
