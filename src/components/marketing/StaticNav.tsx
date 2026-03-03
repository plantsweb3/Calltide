import Link from "next/link";

const PHONE = process.env.NEXT_PUBLIC_PHONE ?? "(830) 521-7133";
const PHONE_TEL = `tel:${process.env.NEXT_PUBLIC_PHONE_TEL ?? "+18305217133"}`;

interface StaticNavProps {
  lang: "en" | "es";
  langHref: string;
}

/**
 * Server-compatible marketing nav for blog, help, audit, and other
 * server-rendered pages. Uses links instead of client-side state.
 */
export function StaticNav({ lang, langHref }: StaticNavProps) {
  const labels = lang === "en"
    ? { platform: "Platform", pricing: "Pricing", about: "About", login: "Log In", cta: "Get Calltide" }
    : { platform: "Plataforma", pricing: "Precios", about: "Nosotros", login: "Iniciar Sesión", cta: "Obtén Calltide" };

  return (
    <nav className="sticky top-0 z-40 border-b border-cream-border bg-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 sm:px-8 py-4">
        <Link href="/"><img src="/images/logo.webp" alt="Calltide" className="h-7 w-auto sm:h-8" /></Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/platform" className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">{labels.platform}</Link>
          <Link href="/pricing" className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">{labels.pricing}</Link>
          <Link href="/about" className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">{labels.about}</Link>
          <a href={PHONE_TEL} className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">{PHONE}</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={langHref}
            className="rounded-full border px-3 py-1.5 text-xs font-semibold text-charcoal-muted transition hover:border-amber hover:text-amber"
            style={{ borderColor: "rgba(0,0,0,0.1)" }}
          >
            {lang === "en" ? "ES" : "EN"}
          </Link>
          <Link href="/dashboard/login" className="hidden text-sm font-medium text-charcoal-muted transition hover:text-charcoal sm:inline-block">
            {labels.login}
          </Link>
          <Link href="/#signup" className="cta-shimmer hidden items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light sm:inline-flex">
            {labels.cta}
          </Link>
        </div>
      </div>
    </nav>
  );
}
