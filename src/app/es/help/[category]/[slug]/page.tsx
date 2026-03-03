import Link from "next/link";
import { db } from "@/db";
import { helpArticles, helpCategories } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import ArticleBody from "../../../../help/_components/article-body";
import HelpLangToggle from "../../../../help/_components/help-lang-toggle";

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
  if (!data) return { title: "Artículo No Encontrado — Calltide" };

  const a = data.article;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://calltide.app";
  const title = a.metaTitleEs || a.titleEs || `${a.title} — Centro de Ayuda Calltide`;
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://calltide.app";

  return (
    <div className="min-h-screen" style={{ background: "#FBFBFC" }}>
      {catSlug === "for-prospects" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: article.titleEs || article.title,
              description: article.metaDescriptionEs || article.excerptEs || article.metaDescription || article.excerpt,
              author: { "@type": "Organization", name: "Calltide" },
              publisher: { "@type": "Organization", name: "Calltide", url: appUrl },
              datePublished: article.publishedAt,
              dateModified: article.updatedAt,
              mainEntityOfPage: `${appUrl}/es/help/${catSlug}/${slug}`,
            }),
          }}
        />
      )}
      <header className="border-b" style={{ borderColor: "#E2E8F0" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold" style={{ color: "#C59A27" }}>Calltide</Link>
          <div className="flex items-center gap-4">
            <HelpLangToggle lang="es" />
            <Link href="/es/help" className="text-sm font-medium" style={{ color: "#475569" }}>Centro de Ayuda</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav className="flex items-center gap-2 text-sm" style={{ color: "#94A3B8" }}>
          <Link href="/es/help" className="hover:underline" style={{ color: "#475569" }}>Centro de Ayuda</Link>
          <span>/</span>
          <Link href={`/es/help/${catSlug}`} className="hover:underline" style={{ color: "#475569" }}>{category.nameEs || category.name}</Link>
          <span>/</span>
          <span className="truncate" style={{ color: "#1A1D24" }}>{article.titleEs || article.title}</span>
        </nav>

        {!hasSpanish && (
          <div className="mt-4 rounded-lg px-4 py-2 text-sm" style={{ background: "#FEF3C7", color: "#92400E" }}>
            Este artículo aún no está disponible en español. Mostrando la versión en inglés.
          </div>
        )}

        <div className="mt-6">
          <h1 className="text-2xl font-bold md:text-3xl" style={{ color: "#1A1D24" }}>
            {article.titleEs || article.title}
          </h1>
          <div className="mt-2 flex items-center gap-3 text-sm" style={{ color: "#94A3B8" }}>
            <span>{article.readingTimeMinutes} min</span>
            {article.updatedAt && (
              <>
                <span>·</span>
                <span>Actualizado {new Date(article.updatedAt).toLocaleDateString("es", { month: "short", day: "numeric", year: "numeric" })}</span>
              </>
            )}
          </div>
        </div>

        <ArticleBody articleId={article.id} content={content} lang="es" />

        {related.length > 0 && (
          <div className="mt-12 border-t pt-8" style={{ borderColor: "#E2E8F0" }}>
            <h2 className="text-base font-semibold" style={{ color: "#1A1D24" }}>Artículos Relacionados</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/es/help/${r.categorySlug}/${r.slug}`}
                  className="rounded-xl border p-4 transition-all hover:shadow-md"
                  style={{ borderColor: "#E2E8F0", background: "white" }}
                >
                  <p className="text-sm font-medium" style={{ color: "#1A1D24" }}>{r.titleEs || r.title}</p>
                  <p className="mt-1 text-xs" style={{ color: "#94A3B8" }}>{r.readingTimeMinutes} min</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Prospect CTA */}
        {catSlug === "for-prospects" && (
          <div className="mt-12 rounded-xl p-8 text-center" style={{ background: "#111827" }}>
            <p className="text-lg font-bold text-white">¿Listo para dejar de perder llamadas?</p>
            <p className="mt-1 text-sm" style={{ color: "#94A3B8" }}>
              Vea exactamente lo que experimentan sus clientes con una auditoría gratuita.
            </p>
            <Link
              href="/audit?utm_source=help&utm_medium=prospect-cta"
              className="mt-4 inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
              style={{ background: "#C59A27" }}
            >
              Obtener Auditoría Gratis &rarr;
            </Link>
          </div>
        )}

        <div className="mt-12 rounded-xl border p-6 text-center" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
          <p className="font-medium" style={{ color: "#1A1D24" }}>¿Aún necesitas ayuda?</p>
          <a href="mailto:support@calltide.app" className="mt-2 inline-block text-sm font-medium" style={{ color: "#C59A27" }}>
            Contacta a nuestro equipo de soporte &rarr;
          </a>
        </div>
      </div>

      <footer className="mt-12 border-t py-8 text-center text-sm" style={{ borderColor: "#E2E8F0", color: "#94A3B8" }}>
        <p>&copy; {new Date().getFullYear()} Calltide. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
