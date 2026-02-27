import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { BlogNav, BlogFooter, CATEGORY_LABELS } from "@/app/blog/page";
import AuditCTA from "@/components/audit-cta";
import type { Metadata } from "next";

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

  if (!post) return { title: "Publicación No Encontrada — Calltide" };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://calltide.app";

  return {
    title: post.metaTitle ?? `${post.title} — Calltide Blog`,
    description: post.metaDescription ?? undefined,
    openGraph: {
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? undefined,
      url: `${appUrl}/es/blog/${post.slug}`,
      type: "article",
      images: post.ogImage ? [{ url: post.ogImage }] : undefined,
    },
    alternates: { canonical: `${appUrl}/es/blog/${post.slug}` },
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://calltide.app";

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      <BlogNav lang="es" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.metaDescription,
            image: post.ogImage,
            author: { "@type": "Organization", name: post.authorName ?? "Calltide" },
            publisher: { "@type": "Organization", name: "Calltide", url: appUrl },
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
            mainEntityOfPage: `${appUrl}/es/blog/${post.slug}`,
          }),
        }}
      />

      <main className="mx-auto max-w-3xl px-6 pt-28 pb-20">
        <div className="mb-10">
          <div className="flex items-center gap-3 text-sm">
            {post.category && (
              <span className="rounded-full bg-amber/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
                {CATEGORY_LABELS[post.category] ?? post.category}
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
              Read in English &rarr;
            </Link>
          )}
        </div>

        <AuditCTA variant="inline" lang="es" postSlug={post.slug} postId={post.id} />

        <article className="prose prose-lg prose-slate mt-10 max-w-none" style={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: post.body }} />

        <div className="mt-16">
          <AuditCTA variant="full" lang="es" postSlug={post.slug} postId={post.id} />
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

      <BlogFooter lang="es" />
    </div>
  );
}
