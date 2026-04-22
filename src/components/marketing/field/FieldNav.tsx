"use client";

import { useState, useEffect, useRef } from "react";
import { C } from "./palette";
import { Serif, Mono, PrimaryButton } from "./atoms";
import type { Lang } from "@/lib/marketing/translations";

const NAV_COPY = {
  en: {
    status: "Live",
    statusDetail: "Answering calls in English and Spanish, 24/7",
    platform: "Platform",
    pricing: "Pricing",
    resources: "Resources",
    roiCalc: "ROI calculator",
    playbook: "Growth playbook",
    faq: "FAQ",
    about: "About",
    help: "Help",
    blog: "Blog",
    login: "Log in",
    cta: "Start free trial",
    demo: "Get a free call audit",
    menu: "Menu",
  },
  es: {
    status: "En vivo",
    statusDetail: "Contestando llamadas en inglés y español, 24/7",
    platform: "Plataforma",
    pricing: "Precios",
    resources: "Recursos",
    roiCalc: "Calculadora de ROI",
    playbook: "Manual de crecimiento",
    faq: "Preguntas",
    about: "Acerca",
    help: "Ayuda",
    blog: "Blog",
    login: "Entrar",
    cta: "Prueba gratis",
    demo: "Auditoría gratis",
    menu: "Menú",
  },
};

export function FieldNav({
  lang,
  toggleLang,
  phone,
  phoneHref,
}: {
  lang: Lang;
  toggleLang: (l: Lang) => void;
  phone: string;
  phoneHref: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const resourcesRef = useRef<HTMLDivElement | null>(null);
  const t = NAV_COPY[lang];
  const base = lang === "es" ? "/es" : "";

  useEffect(() => {
    if (!resourcesOpen) return;
    function onClick(e: MouseEvent) {
      if (!resourcesRef.current) return;
      if (!resourcesRef.current.contains(e.target as Node)) setResourcesOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [resourcesOpen]);

  // Keep <html lang> in sync with the user's language toggle so assistive tech
  // and search engines see the correct language without a full page load.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const primaryLinks = [
    { label: t.platform, href: lang === "es" ? "/es/platform" : "/platform" },
    { label: t.pricing, href: lang === "es" ? "/es/pricing" : "/pricing" },
    { label: t.about, href: lang === "es" ? "/es/about" : "/about" },
    { label: t.blog, href: `${base}/blog` },
  ];

  const resourceLinks = [
    { label: t.roiCalc, href: lang === "es" ? "/es/roi-calculator" : "/roi-calculator" },
    { label: t.playbook, href: lang === "es" ? "/es/growth-playbook" : "/growth-playbook" },
    { label: t.faq, href: lang === "es" ? "/es/faq" : "/faq" },
    { label: t.help, href: `${base}/help` },
  ];

  return (
    <header
      style={{
        background: C.paper,
        borderBottom: `1px solid ${C.rule}`,
      }}
      className="sticky top-0 z-40"
    >
      {/* Status strip — no fake numbers, just the always-true state */}
      <div
        style={{
          borderBottom: `1px solid ${C.ruleSoft}`,
          background: C.paperDark,
          fontSize: 11,
          color: C.inkMuted,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
        className="hidden sm:block"
      >
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 sm:px-10 py-1.5">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              style={{ width: 6, height: 6, borderRadius: 999, background: C.forest, display: "inline-block" }}
            />
            <span>{t.status}</span>
            <span style={{ color: C.inkSoft }}>·</span>
            <span style={{ fontWeight: 500, letterSpacing: "0.06em", textTransform: "none", color: C.inkMuted, fontSize: 11 }}>
              {t.statusDetail}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href={phoneHref} className="hover:underline" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
              <Mono>{phone}</Mono>
            </a>
            <div className="flex items-center gap-1" style={{ letterSpacing: 0 }}>
              <button
                onClick={() => toggleLang("en")}
                aria-pressed={lang === "en"}
                style={{
                  fontSize: 11,
                  padding: "2px 6px",
                  fontWeight: lang === "en" ? 700 : 500,
                  color: lang === "en" ? C.ink : C.inkSoft,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                }}
              >
                EN
              </button>
              <span style={{ color: C.inkSoft }}>/</span>
              <button
                onClick={() => toggleLang("es")}
                aria-pressed={lang === "es"}
                style={{
                  fontSize: 11,
                  padding: "2px 6px",
                  fontWeight: lang === "es" ? 700 : 500,
                  color: lang === "es" ? C.ink : C.inkSoft,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                }}
              >
                ES
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="mx-auto flex max-w-[1280px] items-center justify-between px-6 sm:px-10 py-5">
        <a href={base === "" ? "/" : "/es"} className="flex items-center gap-3">
          <Serif style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: C.ink }}>Capta</Serif>
        </a>

        <div className="hidden items-center gap-8 md:flex" style={{ fontSize: 14, fontWeight: 500, color: C.inkMuted }}>
          {primaryLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{ color: C.inkMuted, transition: "color 150ms" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.ink)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.inkMuted)}
            >
              {l.label}
            </a>
          ))}
          {/* Resources dropdown */}
          <div ref={resourcesRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setResourcesOpen(!resourcesOpen)}
              aria-expanded={resourcesOpen}
              aria-haspopup="true"
              style={{
                color: resourcesOpen ? C.ink : C.inkMuted,
                fontSize: 14,
                fontWeight: 500,
                background: "transparent",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.ink)}
              onMouseLeave={(e) => !resourcesOpen && (e.currentTarget.style.color = C.inkMuted)}
            >
              {t.resources}
              <span style={{ fontSize: 10, marginTop: 2 }}>▾</span>
            </button>
            {resourcesOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 12px)",
                  right: 0,
                  minWidth: 260,
                  background: C.paper,
                  border: `1px solid ${C.rule}`,
                  boxShadow: "0 8px 24px -8px rgba(17,19,24,0.12)",
                  padding: "8px 0",
                  zIndex: 50,
                }}
              >
                {resourceLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    style={{
                      display: "block",
                      padding: "10px 18px",
                      fontSize: 14,
                      color: C.ink,
                      fontWeight: 500,
                      transition: "background 120ms",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.paperDark)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a href="/dashboard/login" className="hidden text-sm font-medium md:inline-block" style={{ color: C.inkMuted }}>
            {t.login}
          </a>
          <PrimaryButton href={`${base}/setup`}>{t.cta}</PrimaryButton>
          <button
            type="button"
            className="md:hidden"
            aria-label={t.menu}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              padding: 10,
              color: C.ink,
              borderRadius: 4,
              border: `1px solid ${C.rule}`,
              background: "transparent",
              minHeight: 44,
              minWidth: 44,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>}
            </svg>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            borderTop: `1px solid ${C.rule}`,
            background: C.paper,
            padding: "20px 24px 24px",
          }}
        >
          <div className="flex flex-col gap-4" style={{ fontSize: 15, fontWeight: 500, color: C.ink }}>
            {primaryLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>
                {l.label}
              </a>
            ))}
            <div style={{ marginTop: 4, paddingTop: 12, borderTop: `1px solid ${C.rule}` }}>
              <div style={{ fontSize: 11, letterSpacing: "0.22em", color: C.inkMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
                {t.resources}
              </div>
              <div className="flex flex-col gap-3">
                {resourceLinks.map((l) => (
                  <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} style={{ fontSize: 14 }}>
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
            <a href="/dashboard/login" style={{ color: C.inkMuted, fontSize: 14, marginTop: 4 }}>
              {t.login}
            </a>
            <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px solid ${C.rule}` }}>
              <button
                onClick={() => toggleLang("en")}
                aria-pressed={lang === "en"}
                style={{ fontSize: 12, padding: "6px 12px", fontWeight: lang === "en" ? 700 : 500, color: lang === "en" ? C.ink : C.inkSoft, textTransform: "uppercase", letterSpacing: "0.14em", minHeight: 44 }}
              >
                EN
              </button>
              <span style={{ color: C.inkSoft }}>/</span>
              <button
                onClick={() => toggleLang("es")}
                aria-pressed={lang === "es"}
                style={{ fontSize: 12, padding: "6px 12px", fontWeight: lang === "es" ? 700 : 500, color: lang === "es" ? C.ink : C.inkSoft, textTransform: "uppercase", letterSpacing: "0.14em", minHeight: 44 }}
              >
                ES
              </button>
              <a href={phoneHref} style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600 }}>
                <Mono>{phone}</Mono>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
