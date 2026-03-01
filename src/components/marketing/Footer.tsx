"use client";

import { T, PHONE, PHONE_TEL, type Lang } from "@/lib/marketing/translations";

export function Footer({ lang }: { lang: Lang }) {
  const t = T[lang];

  return (
    <footer className="bg-charcoal px-6 sm:px-8 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <img src="/images/logo.webp" alt="Calltide" className="h-7 w-auto brightness-0 invert opacity-70" />
            <p className="mt-4 text-sm text-white/40">{t.footer.tagline}</p>
            <a href={PHONE_TEL} className="mt-3 inline-block text-sm font-semibold text-amber hover:underline">{PHONE}</a>
          </div>
          <div>
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-white/50">{t.footer.platform}</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li><a href="/platform" className="text-white/40 transition hover:text-white/60">{t.footer.platform}</a></li>
              <li><a href="/pricing" className="text-white/40 transition hover:text-white/60">{t.pricing.label}</a></li>
              <li><a href="/#how-it-works" className="text-white/40 transition hover:text-white/60">{t.howItWorks.label}</a></li>
              <li><a href="/#faq" className="text-white/40 transition hover:text-white/60">FAQ</a></li>
            </ul>
          </div>
          <div>
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-white/50">{t.footer.company}</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li><a href="/about" className="text-white/40 transition hover:text-white/60">{t.footer.about}</a></li>
              <li><a href="mailto:hello@calltide.app" className="text-white/40 transition hover:text-white/60">{t.footer.contact}</a></li>
              <li><a href="/dashboard/login" className="text-white/40 transition hover:text-white/60">{t.footer.clientLogin}</a></li>
              <li><a href="/blog" className="text-white/40 transition hover:text-white/60">Blog</a></li>
              <li><a href="/help" className="text-white/40 transition hover:text-white/60">Help</a></li>
            </ul>
          </div>
          <div>
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-white/50">{t.footer.legal}</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li><a href="/legal/terms" className="text-white/40 transition hover:text-white/60">{t.footer.terms}</a></li>
              <li><a href="/legal/privacy" className="text-white/40 transition hover:text-white/60">{t.footer.privacy}</a></li>
              <li><a href="/status" className="text-white/40 transition hover:text-white/60">Status</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-center gap-3 border-t border-white/10 pt-8 text-center text-sm sm:flex-row sm:justify-between sm:text-left">
          <p className="text-white/30">{t.footer.copyright}</p>
          <p className="text-white/30">{t.footer.builtIn}</p>
        </div>
      </div>
    </footer>
  );
}
