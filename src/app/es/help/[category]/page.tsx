import Link from "next/link";
import { db } from "@/db";
import { helpArticles, helpCategories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getCategoriesWithCounts } from "@/lib/help/search";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const [cat] = await db.select().from(helpCategories).where(eq(helpCategories.slug, slug)).limit(1);
  if (!cat) return { title: "Categoría No Encontrada — Calltide" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://calltide.app";
  return {
    title: `${cat.nameEs || cat.name} — Centro de Ayuda Calltide`,
    description: cat.descriptionEs || cat.description,
    openGraph: {
      title: `${cat.nameEs || cat.name} — Centro de Ayuda Calltide`,
      description: (cat.descriptionEs || cat.description) ?? undefined,
      url: `${appUrl}/es/help/${slug}`,
    },
    alternates: {
      canonical: `${appUrl}/es/help/${slug}`,
      languages: { en: `${appUrl}/help/${slug}`, es: `${appUrl}/es/help/${slug}` },
    },
  };
}

export default async function HelpCategoryEsPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;

  const [cat] = await db.select().from(helpCategories).where(eq(helpCategories.slug, slug)).limit(1);
  if (!cat) notFound();

  const [articles, allCategories] = await Promise.all([
    db
      .select({
        id: helpArticles.id,
        slug: helpArticles.slug,
        title: helpArticles.title,
        titleEs: helpArticles.titleEs,
        excerpt: helpArticles.excerpt,
        excerptEs: helpArticles.excerptEs,
        readingTimeMinutes: helpArticles.readingTimeMinutes,
      })
      .from(helpArticles)
      .where(and(eq(helpArticles.categoryId, cat.id), eq(helpArticles.status, "published")))
      .orderBy(helpArticles.sortOrder),
    getCategoriesWithCounts(),
  ]);

  return (
    <div className="min-h-screen" style={{ background: "#FBFBFC" }}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <nav className="flex items-center gap-2 text-sm" style={{ color: "#94A3B8" }}>
          <Link href="/es/help" className="hover:underline" style={{ color: "#475569" }}>Centro de Ayuda</Link>
          <span>/</span>
          <span style={{ color: "#1A1D24" }}>{cat.nameEs || cat.name}</span>
        </nav>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_240px]">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{cat.icon}</span>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "#1A1D24" }}>{cat.nameEs || cat.name}</h1>
                {(cat.descriptionEs || cat.description) && (
                  <p className="mt-1 text-sm" style={{ color: "#475569" }}>{cat.descriptionEs || cat.description}</p>
                )}
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {articles.length === 0 && (
                <p className="py-8 text-center text-sm" style={{ color: "#94A3B8" }}>
                  No hay artículos en esta categoría aún.
                </p>
              )}
              {articles.map((a) => {
                const hasEs = !!a.titleEs;
                return (
                  <Link
                    key={a.id}
                    href={`/es/help/${slug}/${a.slug}`}
                    className="group block rounded-xl border p-4 transition-all hover:shadow-md hover:border-amber-300"
                    style={{ borderColor: "#E2E8F0", background: "white" }}
                  >
                    <p className="font-medium" style={{ color: "#1A1D24" }}>{a.titleEs || a.title}</p>
                    {(a.excerptEs || a.excerpt) && (
                      <p className="mt-1 text-sm line-clamp-2" style={{ color: "#475569" }}>{a.excerptEs || a.excerpt}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs" style={{ color: "#94A3B8" }}>{a.readingTimeMinutes} min</span>
                      {!hasEs && (
                        <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: "#FEF3C7", color: "#92400E" }}>
                          Solo en inglés
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <aside className="hidden lg:block">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>Categorías</h3>
            <div className="mt-3 space-y-1">
              {allCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/es/help/${c.slug}`}
                  className="block rounded-lg px-3 py-2 text-sm transition-colors"
                  style={{
                    background: c.slug === slug ? "#F1F5F9" : "transparent",
                    color: c.slug === slug ? "#1A1D24" : "#475569",
                    fontWeight: c.slug === slug ? 600 : 400,
                  }}
                >
                  {c.icon} {c.nameEs || c.name}
                  <span className="ml-1 text-xs" style={{ color: "#94A3B8" }}>({c.articleCount})</span>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>

    </div>
  );
}
