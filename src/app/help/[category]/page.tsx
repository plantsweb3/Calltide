import Link from "next/link";
import { db } from "@/db";
import { helpArticles, helpCategories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getCategoriesWithCounts } from "@/lib/help/search";
import { HelpCategoryIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const [cat] = await db.select().from(helpCategories).where(eq(helpCategories.slug, slug)).limit(1);
  if (!cat) return { title: "Category Not Found — Capta Help" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://captahq.com";
  return {
    title: `${cat.name} — Capta Help Center`,
    description: cat.description,
    openGraph: {
      title: `${cat.name} — Capta Help Center`,
      description: cat.description ?? undefined,
      url: `${appUrl}/help/${slug}`,
    },
    alternates: {
      canonical: `${appUrl}/help/${slug}`,
      languages: { en: `${appUrl}/help/${slug}`, es: `${appUrl}/es/help/${slug}` },
    },
  };
}

export default async function HelpCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;

  const [cat] = await db.select().from(helpCategories).where(eq(helpCategories.slug, slug)).limit(1);
  if (!cat) notFound();

  const [articles, allCategories] = await Promise.all([
    db
      .select({
        id: helpArticles.id,
        slug: helpArticles.slug,
        title: helpArticles.title,
        excerpt: helpArticles.excerpt,
        readingTimeMinutes: helpArticles.readingTimeMinutes,
      })
      .from(helpArticles)
      .where(and(eq(helpArticles.categoryId, cat.id), eq(helpArticles.status, "published")))
      .orderBy(helpArticles.sortOrder),
    getCategoriesWithCounts(),
  ]);

  return (
    <div className="min-h-screen" style={{ background: "#FBFBFC" }}>
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm" style={{ color: "#94A3B8" }}>
          <Link href="/help" className="transition hover:text-charcoal" style={{ color: "#64748B" }}>Help Center</Link>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          <span className="font-medium" style={{ color: "#1A1D24" }}>{cat.name}</span>
        </nav>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_260px]">
          {/* Main content */}
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(197,154,39,0.08)", color: "#C59A27" }}>
                <HelpCategoryIcon slug={cat.slug} size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1A1D24" }}>{cat.name}</h1>
                {cat.description && <p className="mt-1 text-sm leading-relaxed" style={{ color: "#64748B" }}>{cat.description}</p>}
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {articles.length === 0 && (
                <p className="py-12 text-center text-sm" style={{ color: "#94A3B8" }}>
                  No articles in this category yet.
                </p>
              )}
              {articles.map((a) => (
                <Link
                  key={a.id}
                  href={`/help/${slug}/${a.slug}`}
                  className="group flex items-center gap-4 rounded-xl border p-5 shadow-sm transition-all hover:shadow-md hover:border-amber-300 hover:-translate-y-px"
                  style={{ borderColor: "#E2E8F0", background: "white" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug" style={{ color: "#1A1D24" }}>{a.title}</p>
                    {a.excerpt && <p className="mt-1.5 text-sm line-clamp-2 leading-relaxed" style={{ color: "#64748B" }}>{a.excerpt}</p>}
                    <p className="mt-2 text-xs" style={{ color: "#94A3B8" }}>{a.readingTimeMinutes} min read</p>
                  </div>
                  <svg className="h-5 w-5 flex-shrink-0 opacity-0 transition-all group-hover:opacity-40 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-xl border p-5 shadow-sm" style={{ borderColor: "#E2E8F0", background: "white" }}>
              <h3 className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "#94A3B8" }}>Categories</h3>
              <div className="mt-4 space-y-1">
                {allCategories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/help/${c.slug}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors"
                    style={{
                      background: c.slug === slug ? "rgba(197,154,39,0.08)" : "transparent",
                      color: c.slug === slug ? "#1A1D24" : "#64748B",
                      fontWeight: c.slug === slug ? 600 : 400,
                      borderLeft: c.slug === slug ? "2px solid #C59A27" : "2px solid transparent",
                    }}
                  >
                    <HelpCategoryIcon slug={c.slug} size={16} />
                    <span>{c.name}</span>
                    <span className="ml-auto text-xs" style={{ color: "#94A3B8" }}>{c.articleCount}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
