"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}

interface ArticleForm {
  categoryId: string;
  slug: string;
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
  relatedArticles: string[];
  dashboardContextRoutes: string[];
  status: string;
  sortOrder: number;
}

const EMPTY_FORM: ArticleForm = {
  categoryId: "",
  slug: "",
  title: "",
  titleEs: "",
  excerpt: "",
  excerptEs: "",
  content: "",
  contentEs: "",
  metaTitle: "",
  metaTitleEs: "",
  metaDescription: "",
  metaDescriptionEs: "",
  searchKeywords: "",
  searchKeywordsEs: "",
  relatedArticles: [],
  dashboardContextRoutes: [],
  status: "draft",
  sortOrder: 0,
};

const ROUTE_OPTIONS = [
  "/dashboard",
  "/dashboard/calls",
  "/dashboard/appointments",
  "/dashboard/sms",
  "/dashboard/settings",
  "/dashboard/referrals",
];

function ArticleEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [form, setForm] = useState<ArticleForm>(EMPTY_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Array<{ id: string; title: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<"en" | "es">("en");

  useEffect(() => {
    fetch("/api/admin/help/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});

    fetch("/api/admin/help/articles")
      .then((r) => r.json())
      .then((d) => setArticles((d.articles || []).map((a: { id: string; title: string }) => ({ id: a.id, title: a.title }))))
      .catch(() => {});

    if (editId) {
      fetch(`/api/admin/help/articles/${editId}`)
        .then((r) => r.json())
        .then((a) => {
          if (a.article) {
            const art = a.article;
            setForm({
              categoryId: art.categoryId ?? "",
              slug: art.slug ?? "",
              title: art.title ?? "",
              titleEs: art.titleEs ?? "",
              excerpt: art.excerpt ?? "",
              excerptEs: art.excerptEs ?? "",
              content: art.content ?? "",
              contentEs: art.contentEs ?? "",
              metaTitle: art.metaTitle ?? "",
              metaTitleEs: art.metaTitleEs ?? "",
              metaDescription: art.metaDescription ?? "",
              metaDescriptionEs: art.metaDescriptionEs ?? "",
              searchKeywords: art.searchKeywords ?? "",
              searchKeywordsEs: art.searchKeywordsEs ?? "",
              relatedArticles: art.relatedArticles ?? [],
              dashboardContextRoutes: art.dashboardContextRoutes ?? [],
              status: art.status ?? "draft",
              sortOrder: art.sortOrder ?? 0,
            });
          }
        })
        .catch(() => {});
    }
  }, [editId]);

  function updateField(field: keyof ArticleForm, value: string | number | string[]) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from title
      if (field === "title" && !editId) {
        next.slug = (value as string).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      }
      // Auto-generate excerpt from content
      if (field === "content" && !prev.excerpt) {
        next.excerpt = (value as string).replace(/[#*_`>\[\]]/g, "").slice(0, 150).trim();
      }
      return next;
    });
  }

  async function save(publish?: boolean) {
    if (!form.title || !form.content || !form.categoryId) return;
    setSaving(true);

    const payload = {
      ...form,
      status: publish ? "published" : form.status,
    };

    if (editId) {
      await fetch(`/api/admin/help/articles/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/admin/help/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    router.push("/admin/knowledge-base");
  }

  const previewContent = preview === "es" ? (form.contentEs || form.content) : form.content;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "var(--db-text)" }}>
          {editId ? "Edit Article" : "New Article"}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: "var(--db-hover)", color: "var(--db-text-secondary)", border: "1px solid var(--db-border)" }}
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: "var(--db-accent)" }}
          >
            Publish
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor */}
        <div className="space-y-4">
          {/* Title EN + ES side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Title (EN)</label>
              <input type="text" value={form.title} onChange={(e) => updateField("title", e.target.value)}
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Title (ES)</label>
              <input type="text" value={form.titleEs} onChange={(e) => updateField("titleEs", e.target.value)}
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
              />
            </div>
          </div>

          {/* Category + Slug */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Category</label>
              <select value={form.categoryId} onChange={(e) => updateField("categoryId", e.target.value)}
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
              >
                <option value="">Select...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Slug</label>
              <input type="text" value={form.slug} onChange={(e) => updateField("slug", e.target.value)}
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
              />
            </div>
          </div>

          {/* Content EN */}
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Content (EN) — Markdown</label>
            <textarea value={form.content} onChange={(e) => updateField("content", e.target.value)}
              rows={12}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm font-mono outline-none resize-y"
              style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
            />
          </div>

          {/* Content ES */}
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Content (ES) — Markdown</label>
            <textarea value={form.contentEs} onChange={(e) => updateField("contentEs", e.target.value)}
              rows={12}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm font-mono outline-none resize-y"
              style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
            />
          </div>

          {/* Excerpt EN + ES */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Excerpt (EN)</label>
              <textarea value={form.excerpt} onChange={(e) => updateField("excerpt", e.target.value)} rows={2}
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Excerpt (ES)</label>
              <textarea value={form.excerptEs} onChange={(e) => updateField("excerptEs", e.target.value)} rows={2}
                className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
              />
            </div>
          </div>

          {/* SEO */}
          <details className="rounded-xl p-4" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
            <summary className="cursor-pointer text-sm font-medium" style={{ color: "var(--db-text)" }}>SEO & Search</summary>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs" style={{ color: "var(--db-text-muted)" }}>Meta Title (EN)</label>
                  <input type="text" value={form.metaTitle} onChange={(e) => updateField("metaTitle", e.target.value)}
                    className="mt-1 w-full rounded-lg px-3 py-2 text-xs outline-none"
                    style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                  />
                </div>
                <div>
                  <label className="text-xs" style={{ color: "var(--db-text-muted)" }}>Meta Title (ES)</label>
                  <input type="text" value={form.metaTitleEs} onChange={(e) => updateField("metaTitleEs", e.target.value)}
                    className="mt-1 w-full rounded-lg px-3 py-2 text-xs outline-none"
                    style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs" style={{ color: "var(--db-text-muted)" }}>Meta Description (EN)</label>
                  <textarea value={form.metaDescription} onChange={(e) => updateField("metaDescription", e.target.value)} rows={2}
                    className="mt-1 w-full rounded-lg px-3 py-2 text-xs outline-none resize-none"
                    style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                  />
                </div>
                <div>
                  <label className="text-xs" style={{ color: "var(--db-text-muted)" }}>Meta Description (ES)</label>
                  <textarea value={form.metaDescriptionEs} onChange={(e) => updateField("metaDescriptionEs", e.target.value)} rows={2}
                    className="mt-1 w-full rounded-lg px-3 py-2 text-xs outline-none resize-none"
                    style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs" style={{ color: "var(--db-text-muted)" }}>Search Keywords (EN)</label>
                  <input type="text" value={form.searchKeywords} onChange={(e) => updateField("searchKeywords", e.target.value)}
                    className="mt-1 w-full rounded-lg px-3 py-2 text-xs outline-none"
                    style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                    placeholder="comma, separated, keywords"
                  />
                </div>
                <div>
                  <label className="text-xs" style={{ color: "var(--db-text-muted)" }}>Search Keywords (ES)</label>
                  <input type="text" value={form.searchKeywordsEs} onChange={(e) => updateField("searchKeywordsEs", e.target.value)}
                    className="mt-1 w-full rounded-lg px-3 py-2 text-xs outline-none"
                    style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                    placeholder="palabras, clave, separadas"
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Dashboard context routes */}
          <div>
            <label className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Dashboard Context Routes</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {ROUTE_OPTIONS.map((route) => (
                <button
                  key={route}
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      dashboardContextRoutes: prev.dashboardContextRoutes.includes(route)
                        ? prev.dashboardContextRoutes.filter((r) => r !== route)
                        : [...prev.dashboardContextRoutes, route],
                    }));
                  }}
                  className="rounded-lg px-2.5 py-1 text-xs transition-colors"
                  style={
                    form.dashboardContextRoutes.includes(route)
                      ? { background: "var(--db-accent)", color: "#fff" }
                      : { background: "var(--db-hover)", color: "var(--db-text-muted)", border: "1px solid var(--db-border)" }
                  }
                >
                  {route}
                </button>
              ))}
            </div>
          </div>

          {/* Sort order */}
          <div className="w-32">
            <label className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Sort Order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => updateField("sortOrder", parseInt(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
            />
          </div>
        </div>

        {/* Preview pane */}
        <div className="rounded-xl p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>Preview</h3>
            <div className="flex gap-1">
              {(["en", "es"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setPreview(lang)}
                  className="rounded px-2 py-1 text-xs font-medium uppercase"
                  style={preview === lang ? { background: "var(--db-accent)", color: "#fff" } : { background: "var(--db-hover)", color: "var(--db-text-muted)" }}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <h2 className="text-lg font-bold" style={{ color: "var(--db-text)" }}>
            {preview === "es" ? (form.titleEs || form.title || "Untitled") : (form.title || "Untitled")}
          </h2>
          <div className="prose-help mt-4 text-sm">
            {previewContent ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewContent}</ReactMarkdown>
            ) : (
              <p style={{ color: "var(--db-text-muted)" }}>Start writing content to see a preview...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateArticlePage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><p style={{ color: "var(--db-text-muted)" }}>Loading...</p></div>}>
      <ArticleEditor />
    </Suspense>
  );
}
