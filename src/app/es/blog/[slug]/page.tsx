import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
const CATEGORY_LABELS_ES: Record<string, string> = {
  pillar: "Guía",
  "data-driven": "Datos",
  comparison: "Comparación",
  "city-specific": "Local",
  "problem-solution": "Solución",
};
import { StaticNav } from "@/components/marketing/StaticNav";
import { StaticFooter } from "@/components/marketing/StaticFooter";
import SetupCTA from "@/components/setup-cta";
import type { Metadata } from "next";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true), eq(blogPosts.language, "es")))
    .limit(1);

  if (!post) return { title: "Publicación No Encontrada — Capta" };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://captahq.com";

  // Resolve paired post slug for hreflang
  let enAlternate: string | undefined;
  if (post.pairedPostId) {
    const [paired] = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(eq(blogPosts.id, post.pairedPostId))
      .limit(1);
    if (paired) enAlternate = `${appUrl}/blog/${paired.slug}`;
  }

  return {
    title: post.metaTitle ?? `${post.title} — Capta Blog`,
    description: post.metaDescription ?? undefined,
    openGraph: {
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? undefined,
      url: `${appUrl}/es/blog/${post.slug}`,
      type: "article",
      images: post.ogImage ? [{ url: post.ogImage }] : undefined,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt ?? undefined,
      authors: [post.authorName ?? "Capta"],
      section: post.category ?? undefined,
      tags: post.targetKeyword ? [post.targetKeyword] : undefined,
    },
    alternates: {
      canonical: `${appUrl}/es/blog/${post.slug}`,
      languages: {
        es: `${appUrl}/es/blog/${post.slug}`,
        ...(enAlternate ? { en: enAlternate } : {}),
        "x-default": enAlternate ?? `${appUrl}/es/blog/${post.slug}`,
      },
    },
  };
}

export default async function BlogPostEsPage({ params }: PageProps) {
  const { slug } = await params;

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true), eq(blogPosts.language, "es")))
    .limit(1);

  if (!post) notFound();

  db.update(blogPosts)
    .set({ pageViews: (post.pageViews ?? 0) + 1 })
    .where(eq(blogPosts.id, post.id))
    .catch(() => {});

  let pairedPost = null;
  if (post.pairedPostId) {
    const [paired] = await db
      .select({ slug: blogPosts.slug, language: blogPosts.language })
      .from(blogPosts)
      .where(eq(blogPosts.id, post.pairedPostId))
      .limit(1);
    pairedPost = paired;
  }

  let relatedPosts: typeof blogPosts.$inferSelect[] = [];
  const relatedSlugs = post.relatedPostSlugs as string[] | null;
  if (relatedSlugs && relatedSlugs.length > 0) {
    relatedPosts = await db.select().from(blogPosts).where(and(eq(blogPosts.published, true), inArray(blogPosts.slug, relatedSlugs))).limit(3);
  } else if (post.category) {
    relatedPosts = await db.select().from(blogPosts).where(and(eq(blogPosts.published, true), eq(blogPosts.category, post.category), eq(blogPosts.language, "es"))).limit(3);
    relatedPosts = relatedPosts.filter((p) => p.id !== post.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://captahq.com";

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      <StaticNav lang="es" langHref="/blog" />
      {/* JSON-LD Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.metaDescription,
            image: post.ogImage,
            thumbnailUrl: post.ogImage,
            url: `${appUrl}/es/blog/${post.slug}`,
            inLanguage: "es",
            wordCount: post.body ? Math.round(post.body.replace(/<[^>]*>/g, "").split(/\s+/).length) : undefined,
            articleSection: post.category ? (CATEGORY_LABELS_ES[post.category] ?? post.category) : undefined,
            keywords: post.targetKeyword ?? undefined,
            author: {
              "@type": "Person",
              name: post.authorName ?? "Ulysses Munoz",
              url: appUrl,
              worksFor: { "@type": "Organization", name: "Capta", url: appUrl },
            },
            publisher: {
              "@type": "Organization",
              name: "Capta",
              url: appUrl,
              logo: { "@type": "ImageObject", url: `${appUrl}/icon-512.png` },
            },
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
            mainEntityOfPage: `${appUrl}/es/blog/${post.slug}`,
            isPartOf: { "@type": "WebPage", url: `${appUrl}/es/blog` },
          }),
        }}
      />
      {/* JSON-LD BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Inicio", item: `${appUrl}/es` },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${appUrl}/es/blog` },
              { "@type": "ListItem", position: 3, name: post.title },
            ],
          }),
        }}
      />

      <main className="mx-auto max-w-3xl px-6 pt-12 pb-20">
        <div className="mb-10">
          <div className="flex items-center gap-3 text-sm">
            {post.category && (
              <span className="rounded-full bg-amber/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
                {CATEGORY_LABELS_ES[post.category] ?? post.category}
              </span>
            )}
            {post.readingTimeMin && <span className="text-charcoal-light">{post.readingTimeMin} min</span>}
            {post.publishedAt && (
              <span className="text-charcoal-light">
                {new Date(post.publishedAt).toLocaleDateString("es-MX", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
          <h1 className="mt-4 text-[32px] font-extrabold leading-[1.15] tracking-tight text-charcoal sm:text-[40px]">{post.title}</h1>
          {pairedPost && (
            <Link
              href={pairedPost.language === "en" ? `/blog/${pairedPost.slug}` : `/es/blog/${pairedPost.slug}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber hover:underline"
            >
              Leer en Inglés &rarr;
            </Link>
          )}
        </div>

        <SetupCTA variant="inline" lang="es" postSlug={post.slug} postId={post.id} />

        <article className="prose prose-lg prose-slate mt-10 max-w-none" style={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.body) }} />

        <div className="mt-16">
          <SetupCTA variant="full" lang="es" postSlug={post.slug} postId={post.id} />
        </div>

        {relatedPosts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-extrabold tracking-tight text-charcoal">Publicaciones Relacionadas</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} href={`/es/blog/${rp.slug}`} className="group">
                  <div className="card-shadow card-hover rounded-xl border border-cream-border bg-white p-5">
                    <h3 className="text-sm font-bold text-charcoal group-hover:text-amber transition-colors">{rp.title}</h3>
                    <p className="mt-1 text-xs text-charcoal-muted line-clamp-2">{rp.metaDescription}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <StaticFooter lang="es" />
    </div>
  );
}

function sanitizeHtml(html: string): string {
  const ALLOWED_TAGS = new Set([
    "p", "br", "b", "i", "em", "strong", "u", "s", "a",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "blockquote", "pre", "code",
    "table", "thead", "tbody", "tr", "th", "td",
    "img", "figure", "figcaption", "hr", "span", "div",
    "sup", "sub", "mark", "small",
  ]);
  const ALLOWED_ATTRS: Record<string, Set<string>> = {
    a: new Set(["href", "title", "target", "rel"]),
    img: new Set(["src", "alt", "width", "height", "loading"]),
    td: new Set(["colspan", "rowspan"]),
    th: new Set(["colspan", "rowspan"]),
    "*": new Set(["class", "id", "style"]),
  };

  return html
    .replace(/<(script|iframe|object|embed|form|style|link|meta|base)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|iframe|object|embed|form|style|link|meta|base)[^>]*\/?>/gi, "")
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    .replace(/(href|src|action|formaction)\s*=\s*(?:"[^"]*(?:javascript|data|vbscript)\s*:[^"]*"|'[^']*(?:javascript|data|vbscript)\s*:[^']*')/gi, "")
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
      if (ALLOWED_TAGS.has(tag.toLowerCase())) {
        return match.replace(/\s+([a-zA-Z-]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/g, (attrMatch, attrName) => {
          const tagAttrs = ALLOWED_ATTRS[tag.toLowerCase()];
          const globalAttrs = ALLOWED_ATTRS["*"];
          if (tagAttrs?.has(attrName.toLowerCase()) || globalAttrs?.has(attrName.toLowerCase())) {
            return attrMatch;
          }
          return "";
        });
      }
      return "";
    });
}
