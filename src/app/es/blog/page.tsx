import Link from "next/link";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { CATEGORY_LABELS } from "@/app/blog/page";
import { StaticNav } from "@/components/marketing/StaticNav";
import { StaticFooter } from "@/components/marketing/StaticFooter";

export const dynamic = "force-dynamic";

const POSTS_PER_PAGE = 10;

export const metadata = {
  title: "Blog — Calltide (Español)",
  description: "Consejos, datos e ideas sobre llamadas perdidas, recepcionistas IA y cómo hacer crecer su negocio de servicios.",
  openGraph: {
    title: "Blog de Calltide (Español)",
    description: "Consejos, datos e ideas sobre llamadas perdidas, recepcionistas IA y cómo hacer crecer su negocio.",
    url: "https://calltide.app/es/blog",
  },
};

export default async function BlogEsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const category = params.category;
  const offset = (page - 1) * POSTS_PER_PAGE;

  const conditions = [eq(blogPosts.published, true), eq(blogPosts.language, "es")];
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
      <StaticNav lang="es" langHref="/blog" />

      <main className="mx-auto max-w-5xl px-6 pt-12 pb-20">
        <div className="text-center">
          <h1 className="text-[36px] font-extrabold tracking-tight text-charcoal sm:text-[48px]">Blog</h1>
          <p className="mt-3 text-lg text-charcoal-muted">
            Consejos, datos e ideas para negocios de servicio.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <Link
            href="/es/blog"
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              !category ? "border-amber bg-amber/10 text-amber" : "border-cream-border text-charcoal-muted hover:border-amber"
            }`}
          >
            Todos
          </Link>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <Link
              key={key}
              href={`/es/blog?category=${key}`}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                category === key ? "border-amber bg-amber/10 text-amber" : "border-cream-border text-charcoal-muted hover:border-amber"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Audit CTA */}
        <div className="mt-10 rounded-xl bg-navy p-6 text-center dark-section">
          <p className="text-lg font-bold text-white">Auditoría Gratuita de Llamadas Perdidas</p>
          <p className="mt-1 text-sm text-slate-300">Descubra qué experimentan sus clientes cuando llaman.</p>
          <Link
            href="/audit?utm_source=blog&utm_medium=banner"
            className="cta-gold cta-shimmer mt-4 inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
          >
            Obtener Auditoría Gratis &rarr;
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-lg text-charcoal-muted">No hay publicaciones aún. ¡Vuelva pronto!</p>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.id} href={`/es/blog/${post.slug}`} className="group">
                <article className="card-shadow card-hover rounded-xl border border-cream-border bg-white p-6 sm:p-8">
                  <div className="flex items-center gap-2">
                    {post.category && (
                      <span className="rounded-full bg-amber/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
                        {CATEGORY_LABELS[post.category] ?? post.category}
                      </span>
                    )}
                    {post.readingTimeMin && <span className="text-xs text-charcoal-light">{post.readingTimeMin} min</span>}
                  </div>
                  <h2 className="mt-3 text-xl font-extrabold tracking-tight text-charcoal group-hover:text-amber transition-colors">
                    {post.title}
                  </h2>
                  {post.metaDescription && (
                    <p className="mt-2 text-sm leading-relaxed text-charcoal-muted line-clamp-2">{post.metaDescription}</p>
                  )}
                  <p className="mt-4 text-xs text-charcoal-light">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("es-MX", { month: "short", day: "numeric", year: "numeric" }) : ""}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/es/blog?page=${p}${category ? `&category=${category}` : ""}`}
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

      <StaticFooter lang="es" />
    </div>
  );
}
