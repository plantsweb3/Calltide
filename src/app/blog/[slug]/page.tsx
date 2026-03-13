import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { CATEGORY_LABELS } from "../page";
import { StaticNav } from "@/components/marketing/StaticNav";
import { StaticFooter } from "@/components/marketing/StaticFooter";
import SetupCTA from "@/components/setup-cta";
import { sanitizeHtml } from "@/lib/sanitize-html";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
    .limit(1);

  if (!post) return { title: "Post Not Found — Capta" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://captahq.com";

  // Resolve paired post slug for hreflang
  let esAlternate: string | undefined;
  if (post.pairedPostId) {
    const [paired] = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(eq(blogPosts.id, post.pairedPostId))
      .limit(1);
    if (paired) esAlternate = `${appUrl}/es/blog/${paired.slug}`;
  }

  return {
    title: post.metaTitle ?? `${post.title} — Capta Blog`,
    description: post.metaDescription ?? undefined,
    openGraph: {
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? undefined,
      url: `${appUrl}/blog/${post.slug}`,
      type: "article",
      images: post.ogImage ? [{ url: post.ogImage }] : undefined,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt ?? undefined,
      authors: [post.authorName ?? "Capta"],
      section: post.category ?? undefined,
      tags: post.targetKeyword ? [post.targetKeyword] : undefined,
    },
    alternates: {
      canonical: `${appUrl}/blog/${post.slug}`,
      languages: {
        en: `${appUrl}/blog/${post.slug}`,
        ...(esAlternate ? { es: esAlternate } : {}),
        "x-default": `${appUrl}/blog/${post.slug}`,
      },
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true), eq(blogPosts.language, "en")))
    .limit(1);

  if (!post) notFound();

  // Increment page views (fire-and-forget)
  db.update(blogPosts)
    .set({ pageViews: (post.pageViews ?? 0) + 1 })
    .where(eq(blogPosts.id, post.id))
    .catch(() => {});

  // Get paired post (other language version)
  let pairedPost = null;
  if (post.pairedPostId) {
    const [paired] = await db
      .select({ slug: blogPosts.slug, language: blogPosts.language })
      .from(blogPosts)
      .where(eq(blogPosts.id, post.pairedPostId))
      .limit(1);
    pairedPost = paired;
  }

  // Get related posts
  let relatedPosts: typeof blogPosts.$inferSelect[] = [];
  const relatedSlugs = post.relatedPostSlugs as string[] | null;
  if (relatedSlugs && relatedSlugs.length > 0) {
    relatedPosts = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.published, true), inArray(blogPosts.slug, relatedSlugs)))
      .limit(3);
  } else if (post.category) {
    relatedPosts = await db
      .select()
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.published, true),
          eq(blogPosts.category, post.category),
          eq(blogPosts.language, "en"),
        ),
      )
      .limit(3);
    relatedPosts = relatedPosts.filter((p) => p.id !== post.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://captahq.com";

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      <StaticNav lang="en" langHref="/es/blog" />

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
            url: `${appUrl}/blog/${post.slug}`,
            inLanguage: "en",
            wordCount: post.body ? Math.round(post.body.replace(/<[^>]*>/g, "").split(/\s+/).length) : undefined,
            articleSection: post.category ? (CATEGORY_LABELS[post.category] ?? post.category) : undefined,
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
            mainEntityOfPage: `${appUrl}/blog/${post.slug}`,
            isPartOf: { "@type": "WebPage", url: `${appUrl}/blog` },
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
              { "@type": "ListItem", position: 1, name: "Home", item: appUrl },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${appUrl}/blog` },
              { "@type": "ListItem", position: 3, name: post.title },
            ],
          }),
        }}
      />

      <main className="mx-auto max-w-3xl px-6 pt-12 pb-20">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 text-sm">
            {post.category && (
              <span className="rounded-full bg-amber/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
                {CATEGORY_LABELS[post.category] ?? post.category}
              </span>
            )}
            {post.readingTimeMin && <span className="text-charcoal-light">{post.readingTimeMin} min read</span>}
            {post.publishedAt && (
              <span className="text-charcoal-light">
                {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
          <h1 className="mt-4 text-[32px] font-extrabold leading-[1.15] tracking-tight text-charcoal sm:text-[40px]">
            {post.title}
          </h1>
          {pairedPost && (
            <Link
              href={pairedPost.language === "es" ? `/es/blog/${pairedPost.slug}` : `/blog/${pairedPost.slug}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber hover:underline"
            >
              {pairedPost.language === "es" ? "Leer en Español" : "Read in English"} &rarr;
            </Link>
          )}
        </div>

        {/* Mid-page CTA */}
        <SetupCTA variant="inline" lang="en" postSlug={post.slug} postId={post.id} />

        {/* Post body */}
        <article
          className="prose prose-lg prose-slate mt-10 max-w-none"
          style={{ lineHeight: 1.8 }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.body) }}
        />

        {/* Bottom CTA */}
        <div className="mt-16">
          <SetupCTA variant="full" lang="en" postSlug={post.slug} postId={post.id} />
        </div>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-extrabold tracking-tight text-charcoal">Related Posts</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`} className="group">
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

      <StaticFooter lang="en" />
    </div>
  );
}

