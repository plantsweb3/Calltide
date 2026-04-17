"use client";

import { PrimaryButton, SecondaryButton } from "./atoms";
import type { Lang } from "@/lib/marketing/translations";

/**
 * Paired CTA set — primary (trial) + secondary (lower-commitment demo).
 * Use at the top of Hero, Pricing, and CTA bands so every page has both.
 */
const CTA_COPY = {
  en: {
    trial: "Start 14-day free trial",
    demo: "Get a free call audit",
  },
  es: {
    trial: "Comenzar prueba gratis de 14 días",
    demo: "Auditoría gratis",
  },
};

export function DemoCtaPair({
  lang,
  size = "lg",
}: {
  lang: Lang;
  size?: "md" | "lg";
}) {
  const t = CTA_COPY[lang];
  const setupHref = lang === "es" ? "/es/setup" : "/setup";
  // Lower-commitment path: /audit lets the user have us call their shop and
  // show them what their customers hear today — a live demo that earns trust.
  const demoHref = "/audit";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <PrimaryButton href={setupHref} size={size}>
        {t.trial}
      </PrimaryButton>
      <SecondaryButton href={demoHref} size={size}>
        {t.demo}
      </SecondaryButton>
    </div>
  );
}
