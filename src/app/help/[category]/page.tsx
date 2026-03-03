import Link from "next/link";
import { db } from "@/db";
import { helpArticles, helpCategories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getCategoriesWithCounts } from "@/lib/help/search";
import HelpLangToggle from "../_components/help-lang-toggle";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const [cat] = await db.select().from(helpCategories).where(eq(helpCategories.slug, slug)).limit(1);
  if (!cat) return { title: "Category Not Found — Calltide Help" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://calltide.app";
  return {
    title: `${cat.name} — Calltide Help Center`,
    description: cat.description,
    openGraph: {
      title: `${cat.name} — Calltide Help Center`,
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
      <header className="border-b" style={{ borderColor: "#E2E8F0" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold" style={{ color: "#C59A27" }}>Calltide</Link>
          <div className="flex items-center gap-4">
            <HelpLangToggle lang="en" />
            <Link href="/help" className="text-sm font-medium" style={{ color: "#475569" }}>Help Center</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm" style={{ color: "#94A3B8" }}>
          <Link href="/help" className="hover:underline" style={{ color: "#475569" }}>Help Center</Link>
          <span>/</span>
          <span style={{ color: "#1A1D24" }}>{cat.name}</span>
        </nav>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_240px]">
          {/* Main content */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{cat.icon}</span>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "#1A1D24" }}>{cat.name}</h1>
                {cat.description && <p className="mt-1 text-sm" style={{ color: "#475569" }}>{cat.description}</p>}
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {articles.length === 0 && (
                <p className="py-8 text-center text-sm" style={{ color: "#94A3B8" }}>
                  No articles in this category yet.
                </p>
              )}
              {articles.map((a) => (
                <Link
                  key={a.id}
                  href={`/help/${slug}/${a.slug}`}
                  className="group block rounded-xl border p-4 transition-all hover:shadow-md hover:border-amber-300"
                  style={{ borderColor: "#E2E8F0", background: "white" }}
                >
                  <p className="font-medium" style={{ color: "#1A1D24" }}>{a.title}</p>
                  {a.excerpt && <p className="mt-1 text-sm line-clamp-2" style={{ color: "#475569" }}>{a.excerpt}</p>}
                  <p className="mt-2 text-xs" style={{ color: "#94A3B8" }}>{a.readingTimeMinutes} min read</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94A3B8" }}>Categories</h3>
            <div className="mt-3 space-y-1">
              {allCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/help/${c.slug}`}
                  className="block rounded-lg px-3 py-2 text-sm transition-colors"
                  style={{
                    background: c.slug === slug ? "#F1F5F9" : "transparent",
                    color: c.slug === slug ? "#1A1D24" : "#475569",
                    fontWeight: c.slug === slug ? 600 : 400,
                  }}
                >
                  {c.icon} {c.name}
                  <span className="ml-1 text-xs" style={{ color: "#94A3B8" }}>({c.articleCount})</span>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <footer className="border-t py-8 text-center text-sm" style={{ borderColor: "#E2E8F0", color: "#94A3B8" }}>
        <p>&copy; {new Date().getFullYear()} Calltide. All rights reserved.</p>
      </footer>
    </div>
  );
}
