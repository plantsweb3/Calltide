import Link from "next/link";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { StaticNav } from "@/components/marketing/StaticNav";
import { StaticFooter } from "@/components/marketing/StaticFooter";

export const dynamic = "force-dynamic";

const POSTS_PER_PAGE = 10;

const CATEGORY_LABELS: Record<string, string> = {
  pillar: "Pillar",
  "data-driven": "Data",
  comparison: "Comparison",
  "city-specific": "Local",
  "problem-solution": "Guide",
};

export const metadata = {
  title: "Blog — Capta",
  description: "Tips, data, and insights on missed calls, AI receptionists, and growing your service business.",
  openGraph: {
    title: "Capta Blog",
    description: "Tips, data, and insights on missed calls, AI receptionists, and growing your service business.",
    url: "https://capta.app/blog",
  },
  alternates: {
    canonical: "/blog",
    languages: { en: "/blog", es: "/es/blog" },
  },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const category = params.category;
  const offset = (page - 1) * POSTS_PER_PAGE;

  const conditions = [eq(blogPosts.published, true), eq(blogPosts.language, "en")];
  if (category) conditions.push(eq(blogPosts.category, category));

  const posts = await db
    .select()
    .from(blogPosts)
    .where(and(...conditions))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(POSTS_PER_PAGE)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogPosts)
    .where(and(...conditions));
  const totalPosts = countResult?.count ?? 0;
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      <StaticNav lang="en" langHref="/es/blog" />

      <main className="mx-auto max-w-5xl px-6 pt-12 pb-20">
        <div className="text-center">
          <h1 className="text-[36px] font-extrabold tracking-tight text-charcoal sm:text-[48px]">Blog</h1>
          <p className="mt-3 text-lg text-charcoal-muted">
            Tips, data, and insights for service businesses.
          </p>
        </div>

        {/* Category filters */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <Link
            href="/blog"
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              !category ? "border-amber bg-amber/10 text-amber" : "border-cream-border text-charcoal-muted hover:border-amber"
            }`}
          >
            All
          </Link>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <Link
              key={key}
              href={`/blog?category=${key}`}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                category === key ? "border-amber bg-amber/10 text-amber" : "border-cream-border text-charcoal-muted hover:border-amber"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Setup CTA banner */}
        <div className="mt-10 rounded-xl bg-navy p-6 text-center dark-section">
          <p className="text-lg font-bold text-white">Stop Missing Calls Today</p>
          <p className="mt-1 text-sm text-slate-300">Set up your AI receptionist in minutes. 30-day money-back guarantee.</p>
          <Link
            href="/setup?utm_source=blog&utm_medium=banner"
            className="cta-gold cta-shimmer mt-4 inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
          >
            Get Capta &rarr;
          </Link>
        </div>

        {/* Posts grid */}
        {posts.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-lg text-charcoal-muted">No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <article className="card-shadow card-hover rounded-xl border border-cream-border bg-white p-6 sm:p-8">
                  <div className="flex items-center gap-2">
                    {post.category && (
                      <span className="rounded-full bg-amber/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
                        {CATEGORY_LABELS[post.category] ?? post.category}
                      </span>
                    )}
                    {post.readingTimeMin && (
                      <span className="text-xs text-charcoal-light">{post.readingTimeMin} min read</span>
                    )}
                  </div>
                  <h2 className="mt-3 text-xl font-extrabold tracking-tight text-charcoal group-hover:text-amber transition-colors">
                    {post.title}
                  </h2>
                  {post.metaDescription && (
                    <p className="mt-2 text-sm leading-relaxed text-charcoal-muted line-clamp-2">
                      {post.metaDescription}
                    </p>
                  )}
                  <p className="mt-4 text-xs text-charcoal-light">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/blog?page=${p}${category ? `&category=${category}` : ""}`}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  p === page ? "bg-amber text-white" : "border border-cream-border text-charcoal-muted hover:bg-cream-dark"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </main>

      <StaticFooter lang="en" />
    </div>
  );
}

export { CATEGORY_LABELS };
