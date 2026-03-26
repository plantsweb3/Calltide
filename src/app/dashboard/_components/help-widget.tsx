"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Article {
  id: string;
  slug: string;
  title: string;
  titleEs: string | null;
  excerpt: string | null;
  excerptEs: string | null;
  content: string;
  contentEs: string | null;
  readingTimeMinutes: number | null;
  categorySlug: string | null;
  categoryName: string | null;
}

const CONTEXT_MAP: Record<string, string[]> = {
  "/dashboard": ["what-is-capta", "how-maria-handles-calls", "monthly-report"],
  "/dashboard/calls": ["understanding-call-logs", "how-maria-handles-calls", "when-calls-transfer"],
  "/dashboard/settings": ["improve-maria-responses", "tips-best-results", "update-payment-method"],
  "/dashboard/sms": ["viewing-messages", "not-receiving-notifications"],
  "/dashboard/appointments": ["appointments-booked-tracked", "how-maria-handles-calls"],
  "/dashboard/referrals": ["referral-program", "understanding-subscription"],
  "/dashboard/billing": ["understanding-subscription", "billing-and-charges", "update-payment-method"],
  "/dashboard/customers": ["how-maria-handles-calls", "understanding-call-logs"],
  "/dashboard/estimates": ["how-maria-handles-calls", "tips-best-results"],
  "/dashboard/feedback": ["nps-health-score", "improve-maria-responses"],
};

export default function HelpWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [viewing, setViewing] = useState<Article | null>(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [searching, setSearching] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));
  const [loadError, setLoadError] = useState(false);

  // Fetch context-based articles when panel opens
  useEffect(() => {
    if (!open) return;
    const slugs = CONTEXT_MAP[pathname] ?? CONTEXT_MAP["/dashboard"] ?? [];
    if (slugs.length === 0) return;

    setLoadError(false);
    fetch(`/api/help/articles?slugs=${slugs.join(",")}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setArticles(d.articles || []))
      .catch(() => { setArticles([]); setLoadError(true); });
  }, [open, pathname]);

  function handleSearch(value: string) {
    setQuery(value);
    if (value.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    fetch(`/api/help/search?q=${encodeURIComponent(value)}&limit=6`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        // Search only returns partial data; fetch full content for selected
        setSearchResults(
          d.results?.map((r: Record<string, unknown>) => ({ ...r, content: "", contentEs: null })) || [],
        );
      })
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }

  function trackView(articleId: string) {
    fetch("/api/help/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId }),
    }).catch(() => {});
  }

  function sendFeedback(articleId: string, helpful: boolean) {
    if (feedbackGiven[articleId]) return;
    setFeedbackGiven((prev) => ({ ...prev, [articleId]: true }));
    fetch("/api/help/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, helpful, sessionId }),
    }).catch(() => {});
  }

  function viewArticle(article: Article) {
    if (article.content) {
      setViewing(article);
      trackView(article.id);
      return;
    }
    // Fetch full article content
    fetch(`/api/help/articles?slugs=${article.slug}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        const full = d.articles?.[0];
        if (full) {
          setViewing(full);
          trackView(full.id);
        }
      })
      .catch(() => {});
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          data-help-fab=""
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
          style={{ background: "var(--db-surface)", color: "var(--db-text-muted)", border: "1px solid var(--db-border)" }}
          aria-label="Help"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
      )}

      {/* Side panel */}
      {open && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 z-50 bg-black/30 md:bg-transparent md:pointer-events-none"
            onClick={() => setOpen(false)}
          />
          <aside
            className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[400px] flex-col animate-slide-in-right"
            style={{
              background: "var(--db-surface)",
              borderLeft: "1px solid var(--db-border)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--db-border)" }}
            >
              <h2 className="text-base font-semibold" style={{ color: "var(--db-text)" }}>
                {viewing ? "Article" : "Help"}
              </h2>
              <button
                onClick={() => { setOpen(false); setViewing(null); setQuery(""); }}
                className="rounded-lg p-1"
                style={{ color: "var(--db-text-muted)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {viewing ? (
              /* Article view */
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <button
                  onClick={() => setViewing(null)}
                  className="mb-3 flex items-center gap-1 text-sm"
                  style={{ color: "var(--db-accent)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back
                </button>
                <h3 className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
                  {viewing.title}
                </h3>
                <div className="prose-help mt-4 text-sm" style={{ color: "var(--db-text-secondary)" }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewing.content}</ReactMarkdown>
                </div>
                {/* Feedback */}
                <div
                  className="mt-6 flex items-center gap-3 rounded-lg px-3 py-2"
                  style={{ background: "var(--db-hover)" }}
                >
                  <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                    {feedbackGiven[viewing.id] ? "Thanks for your feedback!" : "Was this helpful?"}
                  </span>
                  {!feedbackGiven[viewing.id] && (
                    <div className="flex gap-1 ml-auto">
                      <button
                        onClick={() => sendFeedback(viewing.id, true)}
                        className="db-hover-bg rounded px-2 py-1 text-xs transition-colors"
                        style={{ color: "var(--db-text-muted)" }}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => sendFeedback(viewing.id, false)}
                        className="db-hover-bg rounded px-2 py-1 text-xs transition-colors"
                        style={{ color: "var(--db-text-muted)" }}
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
                <a
                  href={`/help/${viewing.categorySlug}/${viewing.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-sm font-medium"
                  style={{ color: "var(--db-accent)" }}
                >
                  Open full article &rarr;
                </a>
              </div>
            ) : (
              /* List view */
              <div className="flex-1 overflow-y-auto">
                {/* Search */}
                <div className="px-4 pt-4 pb-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search help articles..."
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      background: "var(--db-hover)",
                      color: "var(--db-text)",
                      border: "1px solid var(--db-border)",
                    }}
                  />
                </div>

                {query.length >= 2 ? (
                  /* Search results */
                  <div className="px-4 space-y-1">
                    {searching && (
                      <p className="py-4 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>Searching...</p>
                    )}
                    {!searching && searchResults.length === 0 && (
                      <p className="py-4 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No results found</p>
                    )}
                    {searchResults.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => viewArticle(a)}
                        className="db-hover-bg block w-full rounded-lg px-3 py-2.5 text-left transition-colors"
                        style={{ color: "var(--db-text)" }}
                      >
                        <p className="text-sm font-medium">{a.title}</p>
                        {a.excerpt && (
                          <p className="mt-0.5 text-xs line-clamp-2" style={{ color: "var(--db-text-muted)" }}>{a.excerpt}</p>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Contextual articles */
                  <div className="px-4 space-y-4">
                    {loadError && (
                      <p className="py-4 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>
                        Unable to load help articles. Please try again later.
                      </p>
                    )}
                    {articles.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--db-text-muted)" }}>
                          Suggested for this page
                        </p>
                        <div className="space-y-1">
                          {articles.map((a) => (
                            <button
                              key={a.id}
                              onClick={() => viewArticle(a)}
                              className="db-hover-bg block w-full rounded-lg px-3 py-2.5 text-left transition-colors"
                              style={{ color: "var(--db-text)" }}
                            >
                              <p className="text-sm font-medium">{a.title}</p>
                              {a.excerpt && (
                                <p className="mt-0.5 text-xs line-clamp-2" style={{ color: "var(--db-text-muted)" }}>{a.excerpt}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div
              className="px-4 py-3"
              style={{ borderTop: "1px solid var(--db-border)" }}
            >
              <a
                href="mailto:support@captahq.com"
                className="block text-center text-sm"
                style={{ color: "var(--db-text-muted)" }}
              >
                Contact support
              </a>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
