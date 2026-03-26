import Link from "next/link";

const PHONE = process.env.NEXT_PUBLIC_PHONE ?? "(830) 521-7133";
const PHONE_TEL = `tel:${process.env.NEXT_PUBLIC_PHONE_TEL ?? "+18305217133"}`;

interface StaticFooterProps {
  lang: "en" | "es";
}

/**
 * Server-compatible marketing footer for blog, help, audit, and other
 * server-rendered pages. Matches the main marketing Footer layout.
 */
export function StaticFooter({ lang }: StaticFooterProps) {
  const labels = lang === "en"
    ? {
        tagline: "Every call answered. Every job booked.",
        platform: "Platform", pricing: "Pricing", howItWorks: "How It Works",
        company: "Company", about: "About", contact: "Contact", clientLogin: "Client Login",
        legal: "Legal", terms: "Terms", privacy: "Privacy",
        copyright: `© ${new Date().getFullYear()} Capta LLC. All rights reserved.`,
        builtIn: "Built in Texas.",
      }
    : {
        tagline: "Cada llamada contestada. Cada trabajo reservado.",
        platform: "Plataforma", pricing: "Precios", howItWorks: "Cómo Funciona",
        company: "Empresa", about: "Nosotros", contact: "Contacto", clientLogin: "Acceso Clientes",
        legal: "Legal", terms: "Términos", privacy: "Privacidad",
        copyright: `© ${new Date().getFullYear()} Capta LLC. Todos los derechos reservados.`,
        builtIn: "Hecho en Texas.",
      };

  return (
    <footer className="bg-charcoal px-6 sm:px-8 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <img src="/images/logo-inline-white.webp" alt="Capta" className="h-7 w-auto opacity-70" />
            <p className="mt-4 text-sm text-white/40">{labels.tagline}</p>
            <a href={PHONE_TEL} className="mt-3 inline-block text-sm font-semibold text-amber hover:underline">{PHONE}</a>
          </div>
          <div>
            <p className="section-label text-white/50">{labels.platform}</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/platform" className="text-white/40 transition hover:text-white/60">{labels.platform}</Link></li>
              <li><Link href="/pricing" className="text-white/40 transition hover:text-white/60">{labels.pricing}</Link></li>
              <li><Link href="/#how-it-works" className="text-white/40 transition hover:text-white/60">{labels.howItWorks}</Link></li>
              <li><Link href="/#faq" className="text-white/40 transition hover:text-white/60">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <p className="section-label text-white/50">{labels.company}</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/about" className="text-white/40 transition hover:text-white/60">{labels.about}</Link></li>
              <li><a href="mailto:hello@captahq.com" className="text-white/40 transition hover:text-white/60">{labels.contact}</a></li>
              <li><Link href="/dashboard/login" className="text-white/40 transition hover:text-white/60">{labels.clientLogin}</Link></li>
              <li><Link href={lang === "en" ? "/blog" : "/es/blog"} className="text-white/40 transition hover:text-white/60">Blog</Link></li>
              <li><Link href={lang === "en" ? "/help" : "/es/help"} className="text-white/40 transition hover:text-white/60">Help</Link></li>
            </ul>
          </div>
          <div>
            <p className="section-label text-white/50">{labels.legal}</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href={lang === "en" ? "/legal/terms" : "/es/legal/terms"} className="text-white/40 transition hover:text-white/60">{labels.terms}</Link></li>
              <li><Link href={lang === "en" ? "/legal/privacy" : "/es/legal/privacy"} className="text-white/40 transition hover:text-white/60">{labels.privacy}</Link></li>
              <li><Link href={lang === "en" ? "/legal/dpa" : "/es/legal/dpa"} className="text-white/40 transition hover:text-white/60">DPA</Link></li>
              <li><Link href={lang === "en" ? "/legal/sub-processors" : "/es/legal/sub-processors"} className="text-white/40 transition hover:text-white/60">{lang === "en" ? "Sub-Processors" : "Sub-Procesadores"}</Link></li>
              <li><Link href={lang === "en" ? "/status" : "/es/status"} className="text-white/40 transition hover:text-white/60">Status</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-center gap-3 border-t border-white/10 pt-8 text-center text-sm sm:flex-row sm:justify-between sm:text-left">
          <p className="text-white/30">{labels.copyright}</p>
          <p className="text-white/30">{labels.builtIn}</p>
        </div>
      </div>
    </footer>
  );
}
