import Link from "next/link";
import { getCategoriesWithCounts, getPopularArticles } from "@/lib/help/search";
import HelpSearch from "../../help/_components/help-search";
import { HelpCategoryIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Centro de Ayuda — Capta",
  description: "Encuentra respuestas sobre tu recepcionista AI de Capta. Busca artículos de ayuda o navega por categoría.",
  openGraph: {
    title: "Centro de Ayuda — Capta",
    description: "Encuentra respuestas sobre tu recepcionista AI de Capta.",
    url: "https://captahq.com/es/help",
  },
  alternates: {
    canonical: "/es/help",
    languages: { en: "/help", es: "/es/help" },
  },
};

export default async function HelpCenterEsPage() {
  const [categories, popular] = await Promise.all([
    getCategoriesWithCounts(),
    getPopularArticles(5),
  ]);

  return (
    <div className="min-h-screen" style={{ background: "#FBFBFC" }}>
      {/* Hero + Search */}
      <section className="relative overflow-hidden py-20 md:py-28" style={{ background: "#111827" }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(197,154,39,0.08) 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute inset-0 grain-overlay" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#C59A27" }}>Centro de Ayuda</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl">
            ¿Cómo podemos ayudarte?
          </h1>
          <p className="mt-4 text-lg" style={{ color: "#94A3B8" }}>
            Busca en nuestro centro de ayuda o navega por categorías
          </p>
          <div className="mt-10">
            <HelpSearch lang="es" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-14 space-y-20">
        {/* Popular Articles */}
        {popular.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-5 w-1 rounded-full" style={{ background: "#C59A27" }} />
              <h2 className="text-lg font-bold tracking-tight" style={{ color: "#1A1D24" }}>
                Artículos Populares
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {popular.map((a) => (
                <Link
                  key={a.id}
                  href={`/es/help/${a.categorySlug}/${a.slug}`}
                  className="group relative rounded-xl border p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
                  style={{ borderColor: "#E2E8F0", background: "white" }}
                >
                  <p className="font-semibold leading-snug" style={{ color: "#1A1D24" }}>{a.titleEs || a.title}</p>
                  {(a.excerptEs || a.excerpt) && (
                    <p className="mt-2 text-sm line-clamp-2 leading-relaxed" style={{ color: "#64748B" }}>{a.excerptEs || a.excerpt}</p>
                  )}
                  <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: "#94A3B8" }}>
                    <span className="rounded-full px-2.5 py-1 font-medium" style={{ background: "rgba(197,154,39,0.08)", color: "#B8860B" }}>
                      {a.categoryNameEs || a.categoryName}
                    </span>
                    <span>{a.readingTimeMinutes} min</span>
                  </div>
                  <svg className="absolute right-4 top-5 h-4 w-4 opacity-0 transition-all group-hover:opacity-60 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Category Grid */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-5 w-1 rounded-full" style={{ background: "#C59A27" }} />
            <h2 className="text-lg font-bold tracking-tight" style={{ color: "#1A1D24" }}>
              Navegar por Categoría
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/es/help/${cat.slug}`}
                className="group rounded-xl border p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-amber-300"
                style={{ borderColor: "#E2E8F0", background: "white" }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "rgba(197,154,39,0.08)", color: "#C59A27" }}>
                  <HelpCategoryIcon slug={cat.slug} size={20} />
                </div>
                <h3 className="mt-3 font-semibold" style={{ color: "#1A1D24" }}>{cat.nameEs || cat.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "#64748B" }}>{cat.descriptionEs || cat.description}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold" style={{ color: "#C59A27" }}>
                  <span>{cat.articleCount} {cat.articleCount === 1 ? "artículo" : "artículos"}</span>
                  <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Blog link */}
        <section className="flex items-center justify-center gap-3">
          <span className="text-sm" style={{ color: "#64748B" }}>¿Quieres más consejos?</span>
          <Link
            href="/es/blog"
            className="text-sm font-semibold transition-colors hover:underline"
            style={{ color: "#C59A27" }}
          >
            Lee nuestro Blog &rarr;
          </Link>
        </section>

        {/* Still need help */}
        <section className="relative overflow-hidden rounded-2xl p-10 text-center" style={{ background: "#111827" }}>
          <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 80% at 50% 100%, rgba(197,154,39,0.1) 0%, transparent 60%)" }} />
          <div className="relative">
            <h2 className="text-xl font-bold text-white">¿Aún necesitas ayuda?</h2>
            <p className="mt-2 text-sm" style={{ color: "#94A3B8" }}>
              Nuestro equipo de soporte está listo para asistirte.
            </p>
            <a
              href="mailto:support@captahq.com"
              className="mt-5 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
              style={{ background: "#C59A27" }}
            >
              Contactar Soporte
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
