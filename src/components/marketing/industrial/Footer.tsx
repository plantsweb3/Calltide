"use client";

import Image from "next/image";
import { C } from "./palette";
import type { Lang } from "@/lib/marketing/translations";

const FOOTER_COPY = {
  en: {
    tagline:
      "The AI receptionist that never misses a call. Built for home service businesses. San Antonio, Texas.",
    product: "Product",
    company: "Company",
    legal: "Legal",
    compliance: "TCPA compliant · Data encrypted in transit and at rest",
    copyright: "© 2026 Capta LLC. All rights reserved.",
    links: {
      platform: "Platform",
      pricing: "Pricing",
      roiCalc: "ROI calculator",
      status: "Status",
      about: "About",
      blog: "Blog",
      faq: "FAQ",
      help: "Help",
      terms: "Terms",
      privacy: "Privacy",
      dpa: "DPA",
      subprocessors: "Sub-processors",
    },
  },
  es: {
    tagline:
      "La recepcionista IA que nunca pierde una llamada. Hecha para negocios de servicios del hogar. San Antonio, Texas.",
    product: "Producto",
    company: "Empresa",
    legal: "Legal",
    compliance: "Cumple con TCPA · Datos encriptados en tránsito y en reposo",
    copyright: "© 2026 Capta LLC. Todos los derechos reservados.",
    links: {
      platform: "Plataforma",
      pricing: "Precios",
      roiCalc: "Calculadora de ROI",
      status: "Estado",
      about: "Acerca",
      blog: "Blog",
      faq: "Preguntas",
      help: "Ayuda",
      terms: "Términos",
      privacy: "Privacidad",
      dpa: "DPA",
      subprocessors: "Sub-procesadores",
    },
  },
};

export function Footer({ lang }: { lang: Lang; phone?: string; phoneHref?: string }) {
  const t = FOOTER_COPY[lang];
  const base = lang === "es" ? "/es" : "";

  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: t.product,
      links: [
        { label: t.links.platform, href: base + "/platform" },
        { label: t.links.pricing, href: base + "/pricing" },
        { label: t.links.roiCalc, href: base + "/roi-calculator" },
        { label: t.links.status, href: "/status" },
      ],
    },
    {
      title: t.company,
      links: [
        { label: t.links.about, href: base + "/about" },
        { label: t.links.blog, href: `${base}/blog` },
        { label: t.links.faq, href: base + "/faq" },
        { label: t.links.help, href: `${base}/help` },
      ],
    },
    {
      title: t.legal,
      links: [
        { label: t.links.terms, href: "/legal/terms" },
        { label: t.links.privacy, href: "/legal/privacy" },
        { label: t.links.dpa, href: "/legal/dpa" },
        { label: t.links.subprocessors, href: "/legal/subprocessors" },
      ],
    },
  ];

  return (
    <footer style={{ background: C.midnight, color: "rgba(248,250,252,0.72)" }}>
      <div className="mx-auto max-w-[1280px] px-6 sm:px-10 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <Image
              src="/images/logo-inline-white.webp"
              alt="Capta"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
            <p
              className="mt-6 max-w-[360px]"
              style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(248,250,252,0.55)" }}
            >
              {t.tagline}
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(248,250,252,0.55)",
                  fontWeight: 800,
                  marginBottom: 14,
                }}
              >
                {col.title}
              </div>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      style={{
                        fontSize: 14,
                        color: "rgba(248,250,252,0.72)",
                        fontWeight: 500,
                        textDecoration: "none",
                        transition: "color 150ms",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.amber)}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "rgba(248,250,252,0.72)")
                      }
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-14 pt-8 flex flex-wrap items-center justify-between gap-4"
          style={{
            borderTop: `1px solid rgba(248,250,252,0.1)`,
            fontSize: 12,
            color: "rgba(248,250,252,0.45)",
            fontWeight: 500,
          }}
        >
          <div>{t.copyright}</div>
          <div className="flex items-center gap-3">
            <span style={{ color: "rgba(212,168,67,0.75)" }}>●</span>
            <span>{t.compliance}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Compatibility re-export so legacy imports (`FieldFooter`) keep working.
export { Footer as FieldFooter };
