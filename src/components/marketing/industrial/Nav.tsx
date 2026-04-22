"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { C } from "./palette";
import { PrimaryButton } from "./atoms";
import type { Lang } from "@/lib/marketing/translations";

const NAV_COPY = {
  en: {
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
    cta: "Get Capta",
    menu: "Menu",
  },
  es: {
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
    cta: "Obtener Capta",
    menu: "Menú",
  },
};

// Exported under both names to ease the migration. `FieldNav` lets existing
// pages swap the import path without renaming their JSX.
export function Nav({
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
  const pathname = usePathname() || "/";
  const isActive = (href: string) => {
    // Exact root match, plus startsWith for nested pages (e.g. /blog/slug).
    if (href === "/" || href === "/es") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  useEffect(() => {
    if (!resourcesOpen) return;
    function onClick(e: MouseEvent) {
      if (!resourcesRef.current) return;
      if (!resourcesRef.current.contains(e.target as Node)) setResourcesOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [resourcesOpen]);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const primaryLinks = [
    { label: t.platform, href: base + "/platform" },
    { label: t.pricing, href: base + "/pricing" },
    { label: t.about, href: base + "/about" },
    { label: t.blog, href: `${base}/blog` },
  ];

  const resourceLinks = [
    { label: t.roiCalc, href: base + "/roi-calculator" },
    { label: t.playbook, href: base + "/growth-playbook" },
    { label: t.faq, href: base + "/faq" },
    { label: t.help, href: `${base}/help` },
  ];

  return (
    <header
      style={{
        background: C.white,
        borderBottom: `1px solid ${C.rule}`,
      }}
      className="sticky top-0 z-40"
    >
      <nav className="mx-auto flex max-w-[1280px] items-center justify-between px-6 sm:px-10 py-4">
        <a href={base === "" ? "/" : "/es"} className="flex items-center">
          <Image
            src="/images/logo-inline-navy.webp"
            alt="Capta"
            width={120}
            height={32}
            priority
            className="h-8 w-auto"
          />
        </a>

        <div
          className="hidden items-center gap-8 md:flex"
          style={{ fontSize: 14, fontWeight: 600, color: C.inkMuted }}
        >
          {primaryLinks.map((l) => {
            const active = isActive(l.href);
            return (
              <a
                key={l.href}
                href={l.href}
                style={{
                  color: active ? C.ink : C.inkMuted,
                  transition: "color 150ms",
                  paddingBottom: 4,
                  borderBottom: active ? `2px solid ${C.amber}` : `2px solid transparent`,
                  fontWeight: active ? 700 : 600,
                }}
                onMouseEnter={(e) => !active && (e.currentTarget.style.color = C.ink)}
                onMouseLeave={(e) => !active && (e.currentTarget.style.color = C.inkMuted)}
              >
                {l.label}
              </a>
            );
          })}

          <div ref={resourcesRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setResourcesOpen(!resourcesOpen)}
              aria-expanded={resourcesOpen}
              aria-haspopup="true"
              style={{
                color: resourcesOpen ? C.ink : C.inkMuted,
                fontSize: 14,
                fontWeight: 600,
                background: "transparent",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                cursor: "pointer",
                paddingBottom: 4,
                borderBottom: resourceLinks.some((r) => isActive(r.href)) ? `2px solid ${C.amber}` : `2px solid transparent`,
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
                  background: C.white,
                  border: `1px solid ${C.rule}`,
                  boxShadow: "0 8px 24px -8px rgba(15,23,41,0.12)",
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
                      fontWeight: 600,
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
          <a
            href={phoneHref}
            className="hidden lg:inline-flex items-center gap-2"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.ink,
              letterSpacing: "-0.005em",
              fontVariantNumeric: "tabular-nums",
              fontFamily: "var(--font-mono), ui-monospace, Menlo, monospace",
            }}
          >
            {phone}
          </a>

          <div className="hidden md:flex items-center gap-1" style={{ fontSize: 11 }}>
            <button
              onClick={() => toggleLang("en")}
              aria-pressed={lang === "en"}
              style={{
                padding: "4px 8px",
                fontWeight: lang === "en" ? 800 : 500,
                color: lang === "en" ? C.ink : C.inkSoft,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                minHeight: 44,
                minWidth: 44,
              }}
            >
              EN
            </button>
            <span style={{ color: C.inkSoft }}>/</span>
            <button
              onClick={() => toggleLang("es")}
              aria-pressed={lang === "es"}
              style={{
                padding: "4px 8px",
                fontWeight: lang === "es" ? 800 : 500,
                color: lang === "es" ? C.ink : C.inkSoft,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                minHeight: 44,
                minWidth: 44,
              }}
            >
              ES
            </button>
          </div>

          <a
            href="/dashboard/login"
            className="hidden text-sm font-semibold md:inline-block"
            style={{ color: C.inkMuted }}
          >
            {t.login}
          </a>

          <PrimaryButton href={`${base}/setup`} size="sm">
            {t.cta}
          </PrimaryButton>

          <button
            type="button"
            className="md:hidden"
            aria-label={t.menu}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              padding: 10,
              color: C.ink,
              border: `1px solid ${C.rule}`,
              background: C.white,
              minHeight: 44,
              minWidth: 44,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <>
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            borderTop: `1px solid ${C.rule}`,
            background: C.white,
            padding: "20px 24px 24px",
          }}
        >
          <div className="flex flex-col gap-4" style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>
            {primaryLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>
                {l.label}
              </a>
            ))}
            <div style={{ marginTop: 4, paddingTop: 12, borderTop: `1px solid ${C.rule}` }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.22em",
                  color: C.inkMuted,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {t.resources}
              </div>
              <div className="flex flex-col gap-3">
                {resourceLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    style={{ fontSize: 14 }}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
            <a href="/dashboard/login" style={{ color: C.inkMuted, fontSize: 14, marginTop: 4 }}>
              {t.login}
            </a>
            <div
              className="flex items-center gap-2 pt-2"
              style={{ borderTop: `1px solid ${C.rule}` }}
            >
              <button
                onClick={() => toggleLang("en")}
                aria-pressed={lang === "en"}
                style={{
                  fontSize: 12,
                  padding: "6px 12px",
                  fontWeight: lang === "en" ? 800 : 500,
                  color: lang === "en" ? C.ink : C.inkSoft,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  minHeight: 44,
                }}
              >
                EN
              </button>
              <span style={{ color: C.inkSoft }}>/</span>
              <button
                onClick={() => toggleLang("es")}
                aria-pressed={lang === "es"}
                style={{
                  fontSize: 12,
                  padding: "6px 12px",
                  fontWeight: lang === "es" ? 800 : 500,
                  color: lang === "es" ? C.ink : C.inkSoft,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  minHeight: 44,
                }}
              >
                ES
              </button>
              <a
                href={phoneHref}
                style={{
                  marginLeft: "auto",
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.ink,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {phone}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// Compatibility re-export so legacy imports (`FieldNav`) keep working.
export { Nav as FieldNav };
