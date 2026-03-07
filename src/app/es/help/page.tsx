import Link from "next/link";
import { getCategoriesWithCounts, getPopularArticles } from "@/lib/help/search";
import HelpSearch from "../../help/_components/help-search";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Centro de Ayuda — Calltide",
  description: "Encuentra respuestas sobre tu recepcionista AI de Calltide. Busca artículos de ayuda o navega por categoría.",
  openGraph: {
    title: "Centro de Ayuda — Calltide",
    description: "Encuentra respuestas sobre tu recepcionista AI de Calltide.",
    url: "https://calltide.app/es/help",
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
      <section className="grain-overlay py-16 md:py-24" style={{ background: "#111827" }}>
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            ¿Cómo podemos ayudarte?
          </h1>
          <p className="mt-3 text-lg" style={{ color: "#94A3B8" }}>
            Busca en nuestro centro de ayuda o navega por categorías
          </p>
          <div className="mt-8">
            <HelpSearch lang="es" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 space-y-16">
        {popular.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold" style={{ color: "#1A1D24" }}>Artículos Populares</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {popular.map((a) => (
                <Link
                  key={a.id}
                  href={`/es/help/${a.categorySlug}/${a.slug}`}
                  className="group rounded-xl border p-4 transition-all hover:shadow-md"
                  style={{ borderColor: "#E2E8F0", background: "white" }}
                >
                  <p className="font-medium" style={{ color: "#1A1D24" }}>{a.titleEs || a.title}</p>
                  {(a.excerptEs || a.excerpt) && (
                    <p className="mt-1 text-sm line-clamp-2" style={{ color: "#475569" }}>{a.excerptEs || a.excerpt}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "#94A3B8" }}>
                    <span className="rounded-full px-2 py-0.5" style={{ background: "#F1F5F9" }}>
                      {a.categoryNameEs || a.categoryName}
                    </span>
                    <span>{a.readingTimeMinutes} min</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold" style={{ color: "#1A1D24" }}>Navegar por Categoría</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/es/help/${cat.slug}`}
                className="group rounded-xl border p-5 transition-all hover:shadow-md hover:border-amber-300"
                style={{ borderColor: "#E2E8F0", background: "white" }}
              >
                <span className="text-2xl">{cat.icon}</span>
                <h3 className="mt-2 font-semibold" style={{ color: "#1A1D24" }}>{cat.nameEs || cat.name}</h3>
                <p className="mt-1 text-sm" style={{ color: "#475569" }}>{cat.descriptionEs || cat.description}</p>
                <p className="mt-3 text-xs font-medium" style={{ color: "#C59A27" }}>
                  {cat.articleCount} {cat.articleCount === 1 ? "artículo" : "artículos"}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="text-center rounded-xl p-8" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
          <h2 className="text-lg font-semibold" style={{ color: "#1A1D24" }}>¿Aún necesitas ayuda?</h2>
          <p className="mt-1 text-sm" style={{ color: "#475569" }}>Nuestro equipo de soporte está listo para asistirte.</p>
          <a href="mailto:support@calltide.app" className="mt-4 inline-block rounded-lg px-6 py-2.5 text-sm font-medium text-white" style={{ background: "#C59A27" }}>
            Contactar Soporte
          </a>
        </section>
      </div>

    </div>
  );
}
