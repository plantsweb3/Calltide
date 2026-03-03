import Link from "next/link";
import { getCategoriesWithCounts, getPopularArticles } from "@/lib/help/search";
import HelpSearch from "./_components/help-search";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Help Center — Calltide",
  description: "Find answers about your Calltide AI receptionist. Search our help articles or browse by category.",
  openGraph: {
    title: "Help Center — Calltide",
    description: "Find answers about your Calltide AI receptionist.",
    url: "https://calltide.app/help",
  },
  alternates: {
    canonical: "/help",
    languages: { en: "/help", es: "/es/help" },
  },
};

export default async function HelpCenterPage() {
  const [categories, popular] = await Promise.all([
    getCategoriesWithCounts(),
    getPopularArticles(5),
  ]);

  return (
    <div className="min-h-screen" style={{ background: "#FBFBFC" }}>
      {/* Nav */}
      <header className="border-b" style={{ borderColor: "#E2E8F0" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold" style={{ color: "#C59A27" }}>
            Calltide
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/es/help" className="text-sm font-medium" style={{ color: "#475569" }}>
              Español
            </Link>
            <Link href="/audit" className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "#C59A27" }}>
              Free Audit
            </Link>
          </div>
        </div>
      </header>

      {/* Hero + Search */}
      <section className="grain-overlay py-16 md:py-24" style={{ background: "#111827" }}>
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            How can we help?
          </h1>
          <p className="mt-3 text-lg" style={{ color: "#94A3B8" }}>
            Search our help center or browse categories below
          </p>
          <div className="mt-8">
            <HelpSearch lang="en" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 space-y-16">
        {/* Popular Articles */}
        {popular.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold" style={{ color: "#1A1D24" }}>
              Popular Articles
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {popular.map((a) => (
                <Link
                  key={a.id}
                  href={`/help/${a.categorySlug}/${a.slug}`}
                  className="group rounded-xl border p-4 transition-all hover:shadow-md"
                  style={{ borderColor: "#E2E8F0", background: "white" }}
                >
                  <p className="font-medium" style={{ color: "#1A1D24" }}>{a.title}</p>
                  {a.excerpt && (
                    <p className="mt-1 text-sm line-clamp-2" style={{ color: "#475569" }}>{a.excerpt}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "#94A3B8" }}>
                    <span className="rounded-full px-2 py-0.5" style={{ background: "#F1F5F9" }}>
                      {a.categoryName}
                    </span>
                    <span>{a.readingTimeMinutes} min read</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Category Grid */}
        <section>
          <h2 className="text-lg font-semibold" style={{ color: "#1A1D24" }}>
            Browse by Category
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/help/${cat.slug}`}
                className="group rounded-xl border p-5 transition-all hover:shadow-md hover:border-amber-300"
                style={{ borderColor: "#E2E8F0", background: "white" }}
              >
                <span className="text-2xl">{cat.icon}</span>
                <h3 className="mt-2 font-semibold" style={{ color: "#1A1D24" }}>{cat.name}</h3>
                <p className="mt-1 text-sm" style={{ color: "#475569" }}>{cat.description}</p>
                <p className="mt-3 text-xs font-medium" style={{ color: "#C59A27" }}>
                  {cat.articleCount} {cat.articleCount === 1 ? "article" : "articles"}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Still need help */}
        <section className="text-center rounded-xl p-8" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
          <h2 className="text-lg font-semibold" style={{ color: "#1A1D24" }}>Still need help?</h2>
          <p className="mt-1 text-sm" style={{ color: "#475569" }}>
            Our support team is ready to assist you.
          </p>
          <a
            href="mailto:support@calltide.app"
            className="mt-4 inline-block rounded-lg px-6 py-2.5 text-sm font-medium text-white"
            style={{ background: "#C59A27" }}
          >
            Contact Support
          </a>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm" style={{ borderColor: "#E2E8F0", color: "#94A3B8" }}>
        <p>&copy; {new Date().getFullYear()} Calltide. All rights reserved.</p>
      </footer>
    </div>
  );
}
