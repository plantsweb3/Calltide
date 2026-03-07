import Link from "next/link";
import { db } from "@/db";
import { helpArticles, helpCategories } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import ArticleBody from "../../_components/article-body";
import HelpLangToggle from "../../_components/help-lang-toggle";

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
      .where(and(eq(helpArticles.status, "published"), or(...relatedIds.map((s) => eq(helpArticles.slug, s)))))
      .limit(3);
  }

  return { article, category: cat, related };
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const data = await getArticle(category, slug);
  if (!data) return { title: "Article Not Found — Calltide Help" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://calltide.app";
  const title = data.article.metaTitle || `${data.article.title} — Calltide Help`;
  const description = data.article.metaDescription || data.article.excerpt || undefined;
  const url = `${appUrl}/help/${category}/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article",
    },
    alternates: {
      canonical: url,
      languages: {
        en: url,
        es: `${appUrl}/es/help/${category}/${slug}`,
      },
    },
  };
}

export default async function HelpArticlePage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category: catSlug, slug } = await params;
  const data = await getArticle(catSlug, slug);
  if (!data) notFound();

  const { article, category, related } = data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://calltide.app";

  return (
    <div className="min-h-screen" style={{ background: "#FBFBFC" }}>
      {/* JSON-LD for prospect articles */}
      {catSlug === "for-prospects" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: article.title,
              description: article.metaDescription || article.excerpt,
              author: { "@type": "Organization", name: "Calltide" },
              publisher: { "@type": "Organization", name: "Calltide", url: appUrl },
              datePublished: article.publishedAt,
              dateModified: article.updatedAt,
              mainEntityOfPage: `${appUrl}/help/${catSlug}/${slug}`,
            }),
          }}
        />
      )}
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

        {/* Prospect CTA */}
        {catSlug === "for-prospects" && (
          <div className="mt-12 rounded-xl p-8 text-center" style={{ background: "#111827" }}>
            <p className="text-lg font-bold text-white">Ready to stop missing calls?</p>
            <p className="mt-1 text-sm" style={{ color: "#94A3B8" }}>
              See exactly what your callers experience with a free phone audit.
            </p>
            <Link
              href="/audit?utm_source=help&utm_medium=prospect-cta"
              className="mt-4 inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
              style={{ background: "#C59A27" }}
            >
              Get Your Free Audit &rarr;
            </Link>
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

    </div>
  );
}
