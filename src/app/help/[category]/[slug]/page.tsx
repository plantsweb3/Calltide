import Link from "next/link";
import { db } from "@/db";
import { helpArticles, helpCategories } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import ArticleBody from "../../_components/article-body";

export const dynamic = "force-dynamic";

async function getArticle(categorySlug: string, articleSlug: string) {
  const [cat] = await db
    .select({ id: helpCategories.id, slug: helpCategories.slug, name: helpCategories.name, nameEs: helpCategories.nameEs })
    .from(helpCategories)
    .where(eq(helpCategories.slug, categorySlug))
    .limit(1);
  if (!cat) return null;

  const [article] = await db
    .select()
    .from(helpArticles)
    .where(and(eq(helpArticles.slug, articleSlug), eq(helpArticles.categoryId, cat.id), eq(helpArticles.status, "published")))
    .limit(1);
  if (!article) return null;

  // Get related articles
  let related: Array<{ id: string; slug: string; title: string; categorySlug: string | null; readingTimeMinutes: number | null }> = [];
  const relatedIds = article.relatedArticles;
  if (relatedIds && relatedIds.length > 0) {
    related = await db
      .select({
        id: helpArticles.id,
        slug: helpArticles.slug,
        title: helpArticles.title,
        categorySlug: helpCategories.slug,
        readingTimeMinutes: helpArticles.readingTimeMinutes,
      })
      .from(helpArticles)
      .leftJoin(helpCategories, eq(helpArticles.categoryId, helpCategories.id))
      .where(and(eq(helpArticles.status, "published"), or(...relatedIds.map((id) => eq(helpArticles.id, id)))))
      .limit(3);
  }

  return { article, category: cat, related };
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const data = await getArticle(category, slug);
  if (!data) return { title: "Article Not Found — Calltide Help" };
  return {
    title: data.article.metaTitle || `${data.article.title} — Calltide Help`,
    description: data.article.metaDescription || data.article.excerpt,
  };
}

export default async function HelpArticlePage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category: catSlug, slug } = await params;
  const data = await getArticle(catSlug, slug);
  if (!data) notFound();

  const { article, category, related } = data;

  return (
    <div className="min-h-screen" style={{ background: "#FBFBFC" }}>
      <header className="border-b" style={{ borderColor: "#E2E8F0" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold" style={{ color: "#C59A27" }}>Calltide</Link>
          <div className="flex items-center gap-4">
            <Link href={`/es/help/${catSlug}/${slug}`} className="text-sm font-medium" style={{ color: "#475569" }}>Español</Link>
            <Link href="/help" className="text-sm font-medium" style={{ color: "#475569" }}>Help Center</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm" style={{ color: "#94A3B8" }}>
          <Link href="/help" className="hover:underline" style={{ color: "#475569" }}>Help Center</Link>
          <span>/</span>
          <Link href={`/help/${catSlug}`} className="hover:underline" style={{ color: "#475569" }}>{category.name}</Link>
          <span>/</span>
          <span className="truncate" style={{ color: "#1A1D24" }}>{article.title}</span>
        </nav>

        {/* Article Header */}
        <div className="mt-6">
          <h1 className="text-2xl font-bold md:text-3xl" style={{ color: "#1A1D24" }}>{article.title}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm" style={{ color: "#94A3B8" }}>
            <span>{article.readingTimeMinutes} min read</span>
            {article.updatedAt && (
              <>
                <span>·</span>
                <span>Updated {new Date(article.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
              </>
            )}
          </div>
        </div>

        {/* Article Content */}
        <ArticleBody
          articleId={article.id}
          content={article.content}
          lang="en"
        />

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12 border-t pt-8" style={{ borderColor: "#E2E8F0" }}>
            <h2 className="text-base font-semibold" style={{ color: "#1A1D24" }}>Related Articles</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/help/${r.categorySlug}/${r.slug}`}
                  className="rounded-xl border p-4 transition-all hover:shadow-md"
                  style={{ borderColor: "#E2E8F0", background: "white" }}
                >
                  <p className="text-sm font-medium" style={{ color: "#1A1D24" }}>{r.title}</p>
                  <p className="mt-1 text-xs" style={{ color: "#94A3B8" }}>{r.readingTimeMinutes} min read</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Still need help */}
        <div className="mt-12 rounded-xl border p-6 text-center" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
          <p className="font-medium" style={{ color: "#1A1D24" }}>Still need help?</p>
          <a href="mailto:support@calltide.app" className="mt-2 inline-block text-sm font-medium" style={{ color: "#C59A27" }}>
            Contact our support team &rarr;
          </a>
        </div>
      </div>

      <footer className="mt-12 border-t py-8 text-center text-sm" style={{ borderColor: "#E2E8F0", color: "#94A3B8" }}>
        <p>&copy; {new Date().getFullYear()} Calltide. All rights reserved.</p>
      </footer>
    </div>
  );
}
