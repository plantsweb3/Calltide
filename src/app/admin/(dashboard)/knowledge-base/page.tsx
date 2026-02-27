"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Tab = "articles" | "categories" | "analytics" | "generator";

interface Article {
  id: string;
  slug: string;
  title: string;
  titleEs: string | null;
  status: string | null;
  viewCount: number | null;
  helpfulYes: number | null;
  helpfulNo: number | null;
  readingTimeMinutes: number | null;
  sortOrder: number | null;
  updatedAt: string | null;
  categoryName: string | null;
  categorySlug: string | null;
}

interface Category {
  id: string;
  slug: string;
  name: string;
  nameEs: string | null;
  description: string | null;
  descriptionEs: string | null;
  icon: string | null;
  sortOrder: number | null;
  articleCount: number;
}

interface Analytics {
  topArticles: Array<{ id: string; title: string; viewCount: number; helpfulYes: number; helpfulNo: number }>;
  lowHelpful: Array<{ id: string; title: string; helpfulYes: number; helpfulNo: number }>;
  searchMisses: Array<{ query: string; count: number; lastSeen: string }>;
  totalViews: number;
  totalArticles: number;
  avgHelpfulRate: number;
}

interface GeneratedArticle {
  title: string;
  titleEs: string;
  excerpt: string;
  excerptEs: string;
  content: string;
  contentEs: string;
  metaTitle: string;
  metaTitleEs: string;
  metaDescription: string;
  metaDescriptionEs: string;
  searchKeywords: string;
  searchKeywordsEs: string;
}

export default function KnowledgeBasePage() {
  const [tab, setTab] = useState<Tab>("articles");
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [filter, setFilter] = useState({ category: "", status: "", search: "" });
  const [error, setError] = useState<string | null>(null);

  // Generator state
  const [genTitle, setGenTitle] = useState("");
  const [genTitleEs, setGenTitleEs] = useState("");
  const [genCategory, setGenCategory] = useState("");
  const [genKeyPoints, setGenKeyPoints] = useState("");
  const [genAudience, setGenAudience] = useState("existing_clients");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedArticle | null>(null);
  const [saving, setSaving] = useState(false);

  // New category modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCat, setNewCat] = useState({ slug: "", name: "", nameEs: "", description: "", descriptionEs: "", icon: "", sortOrder: 0 });

  useEffect(() => {
    fetch("/api/admin/help/articles").then((r) => r.json()).then((d) => setArticles(d.articles || [])).catch(() => setError("Failed to load articles"));
    fetch("/api/admin/help/categories").then((r) => r.json()).then((d) => setCategories(d.categories || [])).catch(() => setError("Failed to load categories"));
  }, []);

  useEffect(() => {
    if (tab === "analytics" && !analytics) {
      fetch("/api/admin/help/analytics").then((r) => r.json()).then(setAnalytics).catch(() => setError("Failed to load analytics"));
    }
  }, [tab, analytics]);

  async function handleGenerate() {
    if (!genTitle || !genCategory) return;
    setGenerating(true);
    setGenerated(null);
    try {
      const res = await fetch("/api/admin/help/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: genTitle, titleEs: genTitleEs, category: genCategory, keyPoints: genKeyPoints, audience: genAudience }),
      });
      const data = await res.json();
      setGenerated(data);
    } catch { /* */ }
    setGenerating(false);
  }

  async function saveGenerated(publish: boolean) {
    if (!generated || !genCategory) return;
    setSaving(true);
    const slug = genTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await fetch("/api/admin/help/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: genCategory,
        slug,
        title: generated.title || genTitle,
        titleEs: generated.titleEs || genTitleEs,
        excerpt: generated.excerpt,
        excerptEs: generated.excerptEs,
        content: generated.content,
        contentEs: generated.contentEs,
        metaTitle: generated.metaTitle,
        metaTitleEs: generated.metaTitleEs,
        metaDescription: generated.metaDescription,
        metaDescriptionEs: generated.metaDescriptionEs,
        searchKeywords: generated.searchKeywords,
        searchKeywordsEs: generated.searchKeywordsEs,
        status: publish ? "published" : "draft",
      }),
    });
    // Refresh articles
    const res = await fetch("/api/admin/help/articles");
    const d = await res.json();
    setArticles(d.articles || []);
    setGenerated(null);
    setGenTitle("");
    setGenTitleEs("");
    setGenKeyPoints("");
    setSaving(false);
    setTab("articles");
  }

  async function toggleStatus(article: Article) {
    const newStatus = article.status === "published" ? "draft" : "published";
    await fetch(`/api/admin/help/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setArticles((prev) => prev.map((a) => a.id === article.id ? { ...a, status: newStatus } : a));
  }

  async function createCategory() {
    if (!newCat.slug || !newCat.name) return;
    await fetch("/api/admin/help/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCat),
    });
    const res = await fetch("/api/admin/help/categories");
    const d = await res.json();
    setCategories(d.categories || []);
    setShowCatModal(false);
    setNewCat({ slug: "", name: "", nameEs: "", description: "", descriptionEs: "", icon: "", sortOrder: 0 });
  }

  const filteredArticles = articles.filter((a) => {
    if (filter.category && a.categorySlug !== filter.category) return false;
    if (filter.status && a.status !== filter.status) return false;
    if (filter.search && !a.title.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const helpfulRate = (yes: number | null, no: number | null) => {
    const total = (yes ?? 0) + (no ?? 0);
    return total === 0 ? "—" : `${Math.round(((yes ?? 0) / total) * 100)}%`;
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "articles", label: "Articles" },
    { key: "categories", label: "Categories" },
    { key: "analytics", label: "Analytics" },
    { key: "generator", label: "AI Generator" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>Knowledge Base</h1>
        <Link
          href="/admin/knowledge-base/create"
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: "var(--db-accent)" }}
        >
          New Article
        </Link>
      </div>

      {error && (
        <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Published", value: articles.filter((a) => a.status === "published").length },
          { label: "Total Views", value: articles.reduce((s, a) => s + (a.viewCount ?? 0), 0) },
          { label: "Avg Helpful", value: helpfulRate(articles.reduce((s, a) => s + (a.helpfulYes ?? 0), 0), articles.reduce((s, a) => s + (a.helpfulNo ?? 0), 0)) },
          { label: "Categories", value: categories.length },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{s.label}</p>
            <p className="mt-1 text-xl font-semibold" style={{ color: "var(--db-text)" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "var(--db-border)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-medium transition-colors"
            style={tab === t.key ? { borderBottom: "2px solid var(--db-accent)", color: "var(--db-text)" } : { color: "var(--db-text-muted)" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Articles Tab */}
      {tab === "articles" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search articles..."
              value={filter.search}
              onChange={(e) => setFilter((p) => ({ ...p, search: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)", width: 200 }}
            />
            <select
              value={filter.category}
              onChange={(e) => setFilter((p) => ({ ...p, category: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
            <select
              value={filter.status}
              onChange={(e) => setFilter((p) => ({ ...p, status: e.target.value }))}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--db-border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--db-hover)" }}>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Views</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Helpful</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Lang</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No articles found</td></tr>
                )}
                {filteredArticles.map((a) => (
                  <tr key={a.id} style={{ borderTop: "1px solid var(--db-border)" }}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/knowledge-base/create?id=${a.id}`} className="font-medium hover:underline" style={{ color: "var(--db-text)" }}>
                        {a.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "var(--db-hover)", color: "var(--db-text-secondary)" }}>
                        {a.categoryName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={
                        a.status === "published"
                          ? { background: "rgba(74,222,128,0.15)", color: "#4ade80" }
                          : { background: "rgba(148,163,184,0.15)", color: "#94a3b8" }
                      }>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums" style={{ color: "var(--db-text-secondary)" }}>{a.viewCount ?? 0}</td>
                    <td className="px-4 py-3 tabular-nums" style={{ color: "var(--db-text-secondary)" }}>{helpfulRate(a.helpfulYes, a.helpfulNo)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: a.titleEs ? "#4ade80" : "#94a3b8" }}>
                        {a.titleEs ? "EN/ES" : "EN"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(a)}
                        className="rounded px-2 py-1 text-[10px] font-medium"
                        style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
                      >
                        {a.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {tab === "categories" && (
        <div className="space-y-4">
          <button
            onClick={() => setShowCatModal(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: "var(--db-accent)" }}
          >
            New Category
          </button>

          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <p className="font-medium" style={{ color: "var(--db-text)" }}>{c.name}</p>
                    <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                      {c.nameEs || "No Spanish name"} · {c.articleCount} articles · order: {c.sortOrder}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* New category modal */}
          {showCatModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-md rounded-xl p-6 space-y-4" style={{ background: "var(--db-surface)" }}>
                <h3 className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>New Category</h3>
                {(["slug", "name", "nameEs", "description", "descriptionEs", "icon"] as const).map((f) => (
                  <input
                    key={f}
                    type="text"
                    placeholder={f}
                    value={newCat[f]}
                    onChange={(e) => setNewCat((p) => ({ ...p, [f]: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                  />
                ))}
                <input
                  type="number"
                  placeholder="Sort order"
                  value={newCat.sortOrder}
                  onChange={(e) => setNewCat((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowCatModal(false)} className="rounded-lg px-4 py-2 text-sm" style={{ color: "var(--db-text-muted)" }}>Cancel</button>
                  <button onClick={createCategory} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--db-accent)" }}>Create</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {tab === "analytics" && (
        <div className="space-y-6">
          {!analytics ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--db-text-muted)" }}>Loading analytics...</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total Views", value: analytics.totalViews },
                  { label: "Published Articles", value: analytics.totalArticles },
                  { label: "Avg Helpful Rate", value: `${analytics.avgHelpfulRate}%` },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl p-4" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                    <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{s.label}</p>
                    <p className="mt-1 text-xl font-semibold" style={{ color: "var(--db-text)" }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Top articles */}
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--db-text)" }}>Top Articles by Views</h3>
                <div className="space-y-1">
                  {analytics.topArticles.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                      <span className="text-sm" style={{ color: "var(--db-text)" }}>{a.title}</span>
                      <span className="text-xs tabular-nums" style={{ color: "var(--db-text-muted)" }}>{a.viewCount} views</span>
                    </div>
                  ))}
                  {analytics.topArticles.length === 0 && (
                    <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>No data yet</p>
                  )}
                </div>
              </div>

              {/* Low helpful */}
              {analytics.lowHelpful.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "#fbbf24" }}>Needs Attention (Low Helpful Rate)</h3>
                  <div className="space-y-1">
                    {analytics.lowHelpful.map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--db-card)", border: "1px solid rgba(251,191,36,0.2)" }}>
                        <span className="text-sm" style={{ color: "var(--db-text)" }}>{a.title}</span>
                        <span className="text-xs" style={{ color: "#fbbf24" }}>
                          {helpfulRate(a.helpfulYes, a.helpfulNo)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search misses */}
              {analytics.searchMisses.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "#f87171" }}>Search Misses (No Results)</h3>
                  <div className="space-y-1">
                    {analytics.searchMisses.map((m) => (
                      <div key={m.query} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                        <span className="text-sm" style={{ color: "var(--db-text)" }}>&ldquo;{m.query}&rdquo;</span>
                        <span className="text-xs tabular-nums" style={{ color: "var(--db-text-muted)" }}>{m.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* AI Generator Tab */}
      {tab === "generator" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Title (English)</label>
                <input
                  type="text"
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Title (Spanish)</label>
                <input
                  type="text"
                  value={genTitleEs}
                  onChange={(e) => setGenTitleEs(e.target.value)}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Category</label>
                <select
                  value={genCategory}
                  onChange={(e) => setGenCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                  style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Key Points</label>
                <textarea
                  value={genKeyPoints}
                  onChange={(e) => setGenKeyPoints(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                  placeholder="Main points to cover..."
                />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Audience</label>
                <select
                  value={genAudience}
                  onChange={(e) => setGenAudience(e.target.value)}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                  style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                >
                  <option value="existing_clients">Existing Clients</option>
                  <option value="prospects">Prospects</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || !genTitle || !genCategory}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                style={{ background: "var(--db-accent)" }}
              >
                {generating ? "Generating..." : "Generate Article"}
              </button>
            </div>

            {/* Preview */}
            {generated && (
              <div className="space-y-4 rounded-xl p-4" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>Preview</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveGenerated(false)}
                      disabled={saving}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium"
                      style={{ background: "var(--db-hover)", color: "var(--db-text-secondary)", border: "1px solid var(--db-border)" }}
                    >
                      Save as Draft
                    </button>
                    <button
                      onClick={() => saveGenerated(true)}
                      disabled={saving}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                      style={{ background: "var(--db-accent)" }}
                    >
                      Publish
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-xs max-h-96 overflow-y-auto">
                  <div>
                    <p className="font-semibold" style={{ color: "var(--db-text-muted)" }}>EN Title</p>
                    <p style={{ color: "var(--db-text)" }}>{generated.title}</p>
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--db-text-muted)" }}>ES Title</p>
                    <p style={{ color: "var(--db-text)" }}>{generated.titleEs}</p>
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--db-text-muted)" }}>EN Content Preview</p>
                    <div className="prose-help mt-1 text-xs leading-relaxed" style={{ color: "var(--db-text-secondary)" }}>
                      {generated.content.slice(0, 500)}...
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--db-text-muted)" }}>ES Content Preview</p>
                    <div className="mt-1 text-xs leading-relaxed" style={{ color: "var(--db-text-secondary)" }}>
                      {generated.contentEs.slice(0, 500)}...
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
