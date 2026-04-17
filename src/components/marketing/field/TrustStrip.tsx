"use client";

import { C } from "./palette";
import { Mono } from "./atoms";
import type { Lang } from "@/lib/marketing/translations";

const COPY = {
  en: {
    label: "Built on infrastructure you already trust",
    twilio: "Twilio Voice",
    stripe: "Stripe Billing",
    elevenlabs: "ElevenLabs AI",
    sentry: "Sentry",
    security: "TCPA + HIPAA-ready · SOC 2 in progress",
  },
  es: {
    label: "Construido sobre infraestructura que ya conoces",
    twilio: "Twilio Voice",
    stripe: "Stripe Billing",
    elevenlabs: "ElevenLabs AI",
    sentry: "Sentry",
    security: "TCPA + HIPAA-ready · SOC 2 en progreso",
  },
};

export function TrustStrip({ lang, tone = "light" }: { lang: Lang; tone?: "light" | "dark" }) {
  const t = COPY[lang];
  const textColor = tone === "dark" ? "rgba(248,245,238,0.6)" : C.inkMuted;
  const labelColor = tone === "dark" ? "rgba(248,245,238,0.8)" : C.ink;
  const borderColor = tone === "dark" ? "rgba(248,245,238,0.12)" : C.rule;
  const bg = tone === "dark" ? "transparent" : C.paperDark;

  return (
    <section
      style={{
        background: bg,
        borderTop: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
      }}
      className="py-10"
    >
      <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.22em",
              color: textColor,
              fontWeight: 700,
              textTransform: "uppercase",
              maxWidth: 280,
            }}
          >
            {t.label}
          </div>
          <div
            className="flex flex-wrap items-center gap-x-8 gap-y-4 md:gap-x-10"
            style={{ fontSize: 14, fontWeight: 600, color: labelColor, letterSpacing: "-0.005em" }}
          >
            <span>{t.twilio}</span>
            <span aria-hidden style={{ color: textColor }}>·</span>
            <span>{t.stripe}</span>
            <span aria-hidden style={{ color: textColor }}>·</span>
            <span>{t.elevenlabs}</span>
            <span aria-hidden style={{ color: textColor }}>·</span>
            <span>{t.sentry}</span>
          </div>
          <Mono
            style={{
              fontSize: 11,
              letterSpacing: "0.06em",
              color: textColor,
              fontWeight: 500,
              textTransform: "none",
            }}
          >
            {t.security}
          </Mono>
        </div>
      </div>
    </section>
  );
}
