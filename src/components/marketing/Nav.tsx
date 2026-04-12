"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { T, PHONE, PHONE_TEL, type Lang } from "@/lib/marketing/translations";

interface NavProps {
  lang: Lang;
  toggleLang: (l: Lang) => void;
  scrolled: boolean;
}

export function Nav({ lang, toggleLang, scrolled }: NavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const t = T[lang];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const navLinkClass = (href: string) =>
    `text-sm font-medium transition hover:text-charcoal relative pb-0.5 ${
      isActive(href)
        ? "text-charcoal border-b-2 border-[#1B2A4A]"
        : "text-charcoal-muted"
    }`;

  return (
    <nav className={`sticky top-0 z-40 border-b transition-all duration-300 ${scrolled ? "nav-scrolled border-transparent" : "border-cream-border bg-cream"}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 sm:px-8 py-4">
        <a href="/"><Image src="/images/logo-inline-navy.webp" alt="Capta" width={120} height={32} priority className="h-7 w-auto sm:h-8" /></a>
        <div className="hidden items-center gap-8 md:flex">
          <a href="/platform" className={navLinkClass("/platform")}>
            {t.footer.platform}
          </a>
          <a href="/pricing" className={navLinkClass("/pricing")}>
            {t.pricing.label}
          </a>
          <a href="/about" className={navLinkClass("/about")}>
            {t.footer.about}
          </a>
          <a href={lang === "en" ? "/blog" : "/es/blog"} className={navLinkClass("/blog")}>
            Blog
          </a>
          <a href={lang === "en" ? "/help" : "/es/help"} className={navLinkClass("/help")}>
            {t.nav.help}
          </a>
          <a href={PHONE_TEL} className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">
            {PHONE}
          </a>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full overflow-hidden text-xs font-semibold" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
            <button onClick={() => toggleLang("en")} className={`px-3 py-1.5 transition ${lang === "en" ? "bg-navy text-white" : "text-charcoal-muted hover:bg-cream-dark"}`}>EN</button>
            <button onClick={() => toggleLang("es")} className={`px-3 py-1.5 transition ${lang === "es" ? "bg-navy text-white" : "text-charcoal-muted hover:bg-cream-dark"}`}>ES</button>
          </div>
          <a href="/dashboard/login" className="hidden text-sm font-medium text-charcoal-muted transition hover:text-charcoal sm:inline-block">
            {t.nav.login}
          </a>
          <a href="/setup" className="cta-shimmer hidden items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light sm:inline-flex">
            {t.nav.cta}
          </a>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="flex h-10 w-10 items-center justify-center rounded-lg text-charcoal md:hidden" aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>}
            </svg>
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="border-t border-cream-border bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <a href="/platform" onClick={() => setMobileMenuOpen(false)} className={`text-sm font-medium ${isActive("/platform") ? "text-charcoal font-semibold" : "text-charcoal-muted"}`}>{t.footer.platform}</a>
            <a href="/pricing" onClick={() => setMobileMenuOpen(false)} className={`text-sm font-medium ${isActive("/pricing") ? "text-charcoal font-semibold" : "text-charcoal-muted"}`}>{t.pricing.label}</a>
            <a href="/about" onClick={() => setMobileMenuOpen(false)} className={`text-sm font-medium ${isActive("/about") ? "text-charcoal font-semibold" : "text-charcoal-muted"}`}>{t.footer.about}</a>
            <a href={lang === "en" ? "/blog" : "/es/blog"} onClick={() => setMobileMenuOpen(false)} className={`text-sm font-medium ${isActive("/blog") ? "text-charcoal font-semibold" : "text-charcoal-muted"}`}>Blog</a>
            <a href={lang === "en" ? "/help" : "/es/help"} onClick={() => setMobileMenuOpen(false)} className={`text-sm font-medium ${isActive("/help") ? "text-charcoal font-semibold" : "text-charcoal-muted"}`}>{t.nav.help}</a>
            <a href={PHONE_TEL} className="text-sm font-medium text-charcoal-muted">{PHONE}</a>
            <a href="/dashboard/login" className="text-sm font-medium text-charcoal-muted">{t.nav.login}</a>
            <a href="/setup" onClick={() => setMobileMenuOpen(false)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white">{t.nav.cta}</a>
          </div>
        </div>
      )}
    </nav>
  );
}
