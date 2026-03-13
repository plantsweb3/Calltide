import Link from "next/link";
import { db } from "@/db";
import { helpArticles, helpCategories } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import ArticleBody from "../../../../help/_components/article-body";

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

  let related: Array<{ id: string; slug: string; title: string; titleEs: string | null; categorySlug: string | null; readingTimeMinutes: number | null }> = [];
  const relatedIds = article.relatedArticles;
  if (relatedIds && relatedIds.length > 0) {
    related = await db
      .select({
        id: helpArticles.id,
        slug: helpArticles.slug,
        title: helpArticles.title,
        titleEs: helpArticles.titleEs,
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
  if (!data) return { title: "Artículo No Encontrado — Capta" };

  const a = data.article;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://captahq.com";
  const title = a.metaTitleEs || a.titleEs || `${a.title} — Centro de Ayuda Capta`;
  const description = a.metaDescriptionEs || a.excerptEs || a.metaDescription || a.excerpt || undefined;
  const url = `${appUrl}/es/help/${category}/${slug}`;

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
        en: `${appUrl}/help/${category}/${slug}`,
        es: url,
      },
    },
  };
}

export default async function HelpArticleEsPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category: catSlug, slug } = await params;
  const data = await getArticle(catSlug, slug);
  if (!data) notFound();

  const { article, category, related } = data;
  const hasSpanish = !!article.contentEs;
  const content = article.contentEs || article.content;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://captahq.com";

  return (
    <div className="min-h-screen" style={{ background: "#FBFBFC" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.titleEs || article.title,
            description: article.metaDescriptionEs || article.excerptEs || article.metaDescription || article.excerpt,
            inLanguage: "es",
            author: { "@type": "Organization", name: "Capta", url: appUrl },
            publisher: { "@type": "Organization", name: "Capta", url: appUrl, logo: { "@type": "ImageObject", url: `${appUrl}/icon-512.png` } },
            datePublished: article.publishedAt,
            dateModified: article.updatedAt,
            mainEntityOfPage: `${appUrl}/es/help/${catSlug}/${slug}`,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Inicio", item: `${appUrl}/es` },
              { "@type": "ListItem", position: 2, name: "Centro de Ayuda", item: `${appUrl}/es/help` },
              { "@type": "ListItem", position: 3, name: category.nameEs || category.name, item: `${appUrl}/es/help/${catSlug}` },
              { "@type": "ListItem", position: 4, name: article.titleEs || article.title },
            ],
          }),
        }}
      />
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm" style={{ color: "#94A3B8" }}>
          <Link href="/es/help" className="transition hover:text-charcoal" style={{ color: "#64748B" }}>Centro de Ayuda</Link>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          <Link href={`/es/help/${catSlug}`} className="transition hover:text-charcoal" style={{ color: "#64748B" }}>{category.nameEs || category.name}</Link>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          <span className="truncate font-medium" style={{ color: "#1A1D24" }}>{article.titleEs || article.title}</span>
        </nav>

        {!hasSpanish && (
          <div className="mt-4 rounded-lg px-4 py-2 text-sm" style={{ background: "#FEF3C7", color: "#92400E" }}>
            Este artículo aún no está disponible en español. Mostrando la versión en inglés.
          </div>
        )}

        {/* Article Header */}
        <div className="mt-8">
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl" style={{ color: "#1A1D24" }}>
            {article.titleEs || article.title}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-sm" style={{ color: "#94A3B8" }}>
            <span className="inline-flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              {article.readingTimeMinutes} min
            </span>
            {article.updatedAt && (
              <>
                <span style={{ color: "#CBD5E1" }}>·</span>
                <span>Actualizado {new Date(article.updatedAt).toLocaleDateString("es", { month: "short", day: "numeric", year: "numeric" })}</span>
              </>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mt-6 h-px" style={{ background: "linear-gradient(to right, #C59A27, #E2E8F0 40%)" }} />

        {/* Article Content */}
        <ArticleBody articleId={article.id} content={content} lang="es" />

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-5 w-1 rounded-full" style={{ background: "#C59A27" }} />
              <h2 className="text-base font-bold" style={{ color: "#1A1D24" }}>Artículos Relacionados</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/es/help/${r.categorySlug}/${r.slug}`}
                  className="group rounded-xl border p-4 shadow-sm transition-all hover:shadow-md hover:border-amber-300 hover:-translate-y-px"
                  style={{ borderColor: "#E2E8F0", background: "white" }}
                >
                  <p className="text-sm font-semibold leading-snug" style={{ color: "#1A1D24" }}>{r.titleEs || r.title}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs font-medium" style={{ color: "#C59A27" }}>
                    <span>{r.readingTimeMinutes} min</span>
                    <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Prospect CTA */}
        {catSlug === "for-prospects" && (
          <div className="relative mt-14 overflow-hidden rounded-2xl p-10 text-center" style={{ background: "#111827" }}>
            <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 80% at 50% 100%, rgba(197,154,39,0.1) 0%, transparent 60%)" }} />
            <div className="relative">
              <p className="text-xl font-bold text-white">¿Listo para dejar de perder llamadas?</p>
              <p className="mt-2 text-sm" style={{ color: "#94A3B8" }}>
                Configura tu recepcionista IA en minutos. Pruébalo gratis por 14 días.
              </p>
              <Link
                href="/setup?utm_source=help&utm_medium=prospect-cta"
                className="mt-5 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
                style={{ background: "#C59A27" }}
              >
                Empieza Gratis
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        )}

        {/* Still need help */}
        <div className="relative mt-14 overflow-hidden rounded-2xl border p-8 text-center" style={{ background: "white", borderColor: "#E2E8F0" }}>
          <p className="font-semibold" style={{ color: "#1A1D24" }}>¿Aún necesitas ayuda?</p>
          <p className="mt-1 text-sm" style={{ color: "#64748B" }}>Nuestro equipo de soporte está listo para asistirte.</p>
          <a href="mailto:support@captahq.com" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition hover:brightness-110" style={{ color: "#C59A27" }}>
            Contacta a nuestro equipo de soporte
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </a>
        </div>
      </div>
    </div>
  );
}
