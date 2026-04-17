"use client";

import { C } from "./palette";
import { Serif, Mono } from "./atoms";
import type { Lang } from "@/lib/marketing/translations";

const COPY = {
  en: {
    tagline:
      "The bilingual receptionist for home service businesses. Built in San Antonio for the people who build everything else.",
    product: "Product",
    company: "Company",
    legal: "Legal",
    links: {
      platform: "Platform",
      pricing: "Pricing",
      setup: "Setup",
      status: "Status",
      about: "About",
      blog: "Blog",
      help: "Help",
      contact: "Contact",
      terms: "Terms",
      privacy: "Privacy",
      dpa: "DPA",
      sub: "Sub-processors",
    },
    copyright: "© 2026 Capta LLC. Built in San Antonio, Texas.",
    compliance: "TCPA compliant · Unlimited bilingual calls",
  },
  es: {
    tagline:
      "La recepcionista bilingüe para negocios de servicios del hogar. Hecho en San Antonio para las personas que construyen todo lo demás.",
    product: "Producto",
    company: "Empresa",
    legal: "Legal",
    links: {
      platform: "Plataforma",
      pricing: "Precios",
      setup: "Configuración",
      status: "Estado",
      about: "Acerca",
      blog: "Blog",
      help: "Ayuda",
      contact: "Contacto",
      terms: "Términos",
      privacy: "Privacidad",
      dpa: "DPA",
      sub: "Sub-procesadores",
    },
    copyright: "© 2026 Capta LLC. Hecho en San Antonio, Texas.",
    compliance: "Cumple con TCPA · Llamadas bilingües ilimitadas",
  },
};

export function FieldFooter({
  lang,
  phone,
  phoneHref,
}: {
  lang: Lang;
  phone: string;
  phoneHref: string;
}) {
  const t = COPY[lang];
  const base = lang === "es" ? "/es" : "";

  return (
    <footer
      style={{
        background: C.paper,
        borderTop: `1px solid ${C.rule}`,
      }}
      className="py-14"
    >
      <div className="mx-auto max-w-[1280px] px-6 sm:px-10">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5">
          <div className="md:col-span-2">
            <Serif style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}>Capta</Serif>
            <p style={{ fontSize: 13, color: C.inkMuted, marginTop: 10, lineHeight: 1.55, maxWidth: 320 }}>
              {t.tagline}
            </p>
            <a
              href={phoneHref}
              style={{
                display: "inline-block",
                marginTop: 14,
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                fontSize: 15,
                fontWeight: 600,
                color: C.ink,
                letterSpacing: "-0.01em",
              }}
            >
              <Mono>{phone}</Mono>
            </a>
          </div>

          <FooterCol heading={t.product} links={[
            { label: t.links.platform, href: `${base}/platform` },
            { label: t.links.pricing, href: `${base}/pricing` },
            { label: t.links.setup, href: `${base}/setup` },
            { label: t.links.status, href: `${base}/status` },
          ]} />

          <FooterCol heading={t.company} links={[
            { label: t.links.about, href: `${base}/about` },
            { label: t.links.blog, href: `${base}/blog` },
            { label: t.links.help, href: `${base}/help` },
            { label: t.links.contact, href: "mailto:hello@captahq.com" },
          ]} />

          <FooterCol heading={t.legal} links={[
            { label: t.links.terms, href: `${base}/legal/terms` },
            { label: t.links.privacy, href: `${base}/legal/privacy` },
            { label: t.links.dpa, href: `${base}/legal/dpa` },
            { label: t.links.sub, href: `${base}/legal/sub-processors` },
          ]} />
        </div>

        <div
          style={{
            marginTop: 48,
            paddingTop: 20,
            borderTop: `1px solid ${C.rule}`,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 12,
            color: C.inkSoft,
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          <span>{t.copyright}</span>
          <span>{t.compliance}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ heading, links }: { heading: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.22em",
          color: C.inkMuted,
          fontWeight: 700,
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        {heading}
      </div>
      <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}
              className="hover:underline"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
