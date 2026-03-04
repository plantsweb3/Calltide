"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import MetricCard from "../../_components/metric-card";
import DataTable, { type Column } from "../../_components/data-table";
import StatusBadge from "../../_components/status-badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Language = "en" | "es";
type Category =
  | "pillar"
  | "data-driven"
  | "comparison"
  | "city-specific"
  | "problem-solution";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  language: Language;
  category: Category;
  published: boolean;
  views: number;
  ctaClicks: number;
  publishedAt: string | null;
  createdAt: string;
  // editor fields
  body: string;
  metaTitle: string;
  metaDescription: string;
  targetKeyword: string;
  ogImageUrl: string;
  pairedPostSlug: string | null;
}

interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  totalViews: number;
  totalCtaClicks: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "pillar", label: "Pillar" },
  { value: "data-driven", label: "Data-Driven" },
  { value: "comparison", label: "Comparison" },
  { value: "city-specific", label: "City-Specific" },
  { value: "problem-solution", label: "Problem-Solution" },
];

const inputStyle: React.CSSProperties = {
  background: "var(--db-hover)",
  border: "1px solid var(--db-border)",
  color: "var(--db-text)",
};

function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "var(--db-accent)";
}
function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "var(--db-border)";
}

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Markdown → HTML converter (lightweight, no dependencies)
// ---------------------------------------------------------------------------

function markdownToHtml(md: string): string {
  let html = md;

  // Escape HTML entities in content (but not our generated tags)
  // We process markdown syntax first, then let the browser handle it

  // Headings (must come before bold to avoid conflicts)
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Horizontal rule
  html = html.replace(/^---$/gm, "<hr />");

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Unordered lists: consecutive lines starting with "- "
  html = html.replace(/(?:^- .+\n?)+/gm, (match) => {
    const items = match
      .trim()
      .split("\n")
      .map((line) => `  <li>${line.replace(/^- /, "")}</li>`)
      .join("\n");
    return `<ul>\n${items}\n</ul>`;
  });

  // Ordered lists: consecutive lines starting with "1. ", "2. ", etc.
  html = html.replace(/(?:^\d+\. .+\n?)+/gm, (match) => {
    const items = match
      .trim()
      .split("\n")
      .map((line) => `  <li>${line.replace(/^\d+\. /, "")}</li>`)
      .join("\n");
    return `<ol>\n${items}\n</ol>`;
  });

  // Paragraphs: wrap remaining non-empty, non-tag lines
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Don't wrap blocks that are already HTML elements
      if (/^<(h[1-6]|ul|ol|li|hr|p|div|blockquote|table)/i.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n\n");

  return html;
}

/** Detect if content is already HTML (has tags) vs markdown */
function isHtmlContent(content: string): boolean {
  return /<(h[1-6]|p|ul|ol|div|strong|em|a |table|blockquote)\b/i.test(content);
}

// ---------------------------------------------------------------------------
// Empty editor state
// ---------------------------------------------------------------------------

function emptyPost(): Omit<BlogPost, "id" | "views" | "ctaClicks" | "publishedAt" | "createdAt"> {
  return {
    title: "",
    slug: "",
    language: "en",
    category: "pillar",
    published: false,
    body: "",
    metaTitle: "",
    metaDescription: "",
    targetKeyword: "",
    ogImageUrl: "",
    pairedPostSlug: null,
  };
}

// ---------------------------------------------------------------------------
// Post Editor Modal
// ---------------------------------------------------------------------------

function PostEditorModal({
  post,
  allPosts,
  onClose,
  onSaved,
}: {
  post: BlogPost | null; // null = new post
  allPosts: BlogPost[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = post === null;

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugManual, setSlugManual] = useState(!isNew);
  const [body, setBody] = useState(post?.body ?? "");
  const [language, setLanguage] = useState<Language>(post?.language ?? "en");
  const [category, setCategory] = useState<Category>(post?.category ?? "pillar");
  const [published, setPublished] = useState(post?.published ?? false);
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription ?? "");
  const [targetKeyword, setTargetKeyword] = useState(post?.targetKeyword ?? "");
  const [ogImageUrl, setOgImageUrl] = useState(post?.ogImageUrl ?? "");
  const [pairedPostSlug, setPairedPostSlug] = useState<string>(post?.pairedPostSlug ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  // Detect if existing content is HTML; new posts default to markdown
  const [useMarkdown, setUseMarkdown] = useState(isNew || !isHtmlContent(post?.body ?? ""));

  // Auto-generate slug from title when not manually overridden
  useEffect(() => {
    if (!slugManual) {
      setSlug(toSlug(title));
    }
  }, [title, slugManual]);

  const otherLangPosts = allPosts.filter(
    (p) => p.language !== language && (isNew || p.slug !== post?.slug)
  );

  async function handleSave() {
    if (!title.trim() || !slug.trim()) {
      setError("Title and slug are required.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      title,
      slug,
      body: useMarkdown ? markdownToHtml(body) : body,
      language,
      category,
      published,
      metaTitle,
      metaDescription,
      targetKeyword,
      ogImageUrl,
      pairedPostSlug: pairedPostSlug || null,
    };

    try {
      const res = isNew
        ? await fetch("/api/blog/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/blog/posts/${post!.slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error ?? `Request failed (${res.status})`;
        setError(msg);
        toast.error(msg);
      } else {
        toast.success(isNew ? "Post created" : "Post saved");
        onSaved();
        onClose();
      }
    } catch {
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 py-8 px-4">
      <div
        className="w-full max-w-2xl rounded-xl"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--db-border)" }}
        >
          <h2 className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
            {isNew ? "New Post" : "Edit Post"}
          </h2>
          <div className="flex items-center gap-3">
            {/* Publish toggle */}
            <button
              type="button"
              onClick={() => setPublished((p) => !p)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                published
                  ? { background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" }
                  : { background: "var(--db-hover)", color: "var(--db-text-muted)", border: "1px solid var(--db-border)" }
              }
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: published ? "#4ade80" : "var(--db-text-muted)" }}
              />
              {published ? "Published" : "Draft"}
            </button>
            <button
              onClick={onClose}
              className="text-xl leading-none"
              style={{ color: "var(--db-text-muted)" }}
            >
              &times;
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
              Title <span style={{ color: "#f87171" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
              Slug <span style={{ color: "#f87171" }}>*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(e.target.value);
                }}
                placeholder="url-safe-slug"
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none font-mono"
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
              {slugManual && (
                <button
                  type="button"
                  onClick={() => {
                    setSlugManual(false);
                    setSlug(toSlug(title));
                  }}
                  className="rounded-lg px-3 py-2 text-xs"
                  style={{ background: "var(--db-hover)", color: "var(--db-text-muted)", border: "1px solid var(--db-border)" }}
                  title="Reset to auto-generated slug"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Language + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              >
                <option value="en">English (EN)</option>
                <option value="es">Spanish (ES)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Body with formatting toolbar + preview */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
                Body ({useMarkdown ? "Markdown" : "HTML"})
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setUseMarkdown((m) => !m)}
                  className="text-xs font-medium px-2 py-0.5 rounded"
                  style={{ background: "var(--db-hover)", color: "var(--db-accent)", border: "1px solid var(--db-border)" }}
                >
                  Switch to {useMarkdown ? "HTML" : "Markdown"}
                </button>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "var(--db-text-muted)" }}>
                  <input
                    type="checkbox"
                    checked={showPreview}
                    onChange={(e) => setShowPreview(e.target.checked)}
                    className="rounded"
                  />
                  Preview
                </label>
              </div>
            </div>
            {/* Formatting toolbar */}
            <div className="flex items-center gap-1 mb-1.5 flex-wrap">
              {useMarkdown ? (
                <>
                  {[
                    { label: "H2", snippet: "## ", title: "Heading 2" },
                    { label: "H3", snippet: "### ", title: "Heading 3" },
                    { label: "B", snippet: "**bold**", title: "Bold" },
                    { label: "I", snippet: "*italic*", title: "Italic" },
                    { label: "Link", snippet: "[text](url)", title: "Link" },
                    { label: "List", snippet: "- ", title: "Bullet list" },
                    { label: "OL", snippet: "1. ", title: "Numbered list" },
                    { label: "HR", snippet: "\n---\n", title: "Horizontal rule" },
                  ].map(({ label, snippet, title }) => (
                    <button
                      key={label}
                      type="button"
                      title={title}
                      onClick={() => setBody((prev) => prev + (prev.endsWith("\n") || !prev ? "" : "\n") + snippet)}
                      className="rounded px-2 py-1 text-xs font-mono font-semibold transition-colors"
                      style={{ background: "var(--db-hover)", color: "var(--db-text-muted)", border: "1px solid var(--db-border)" }}
                    >
                      {label}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { label: "B", tag: "strong", title: "Bold" },
                    { label: "I", tag: "em", title: "Italic" },
                    { label: "H2", tag: "h2", title: "Heading 2" },
                    { label: "H3", tag: "h3", title: "Heading 3" },
                    { label: "P", tag: "p", title: "Paragraph" },
                    { label: "UL", tag: "ul", title: "Unordered List" },
                    { label: "A", tag: "a", title: "Link" },
                  ].map(({ label, tag, title }) => (
                    <button
                      key={tag}
                      type="button"
                      title={title}
                      onClick={() => {
                        const snippet = tag === "ul"
                          ? "<ul>\n  <li></li>\n</ul>"
                          : tag === "a"
                            ? `<a href="">${""}</a>`
                            : `<${tag}></${tag}>`;
                        setBody((prev) => prev + snippet);
                      }}
                      className="rounded px-2 py-1 text-xs font-mono font-semibold transition-colors"
                      style={{ background: "var(--db-hover)", color: "var(--db-text-muted)", border: "1px solid var(--db-border)" }}
                    >
                      {label}
                    </button>
                  ))}
                </>
              )}
            </div>
            <div className={showPreview ? "grid grid-cols-2 gap-3" : ""}>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={useMarkdown
                  ? "## Introduction\n\nYour content here...\n\n- Bullet point\n- Another point\n\n**Bold text** and *italic text*"
                  : "<h2>Intro</h2><p>Your content here...</p>"}
                rows={12}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none font-mono resize-y"
                style={{ ...inputStyle, lineHeight: "1.6" }}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
              {showPreview && (
                <div
                  className="rounded-lg px-4 py-3 text-sm overflow-y-auto prose-help"
                  style={{
                    ...inputStyle,
                    maxHeight: "320px",
                    lineHeight: "1.7",
                    color: "var(--db-text-secondary)",
                  }}
                  dangerouslySetInnerHTML={{ __html: useMarkdown ? markdownToHtml(body) : body }}
                />
              )}
            </div>
          </div>

          {/* SEO section */}
          <div
            className="rounded-lg p-4 space-y-4"
            style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
              SEO
            </p>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
                Meta Title
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Defaults to post title if empty"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
              <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
                {metaTitle.length}/60 chars
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
                Meta Description
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="150–160 character description..."
                rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
              <p className="mt-1 text-xs" style={{ color: metaDescription.length > 160 ? "#f87171" : "var(--db-text-muted)" }}>
                {metaDescription.length}/160 chars
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
                Target Keyword
              </label>
              <input
                type="text"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                placeholder="e.g. HVAC repair Austin TX"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            </div>
          </div>

          {/* OG Image + Paired post */}
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
              OG Image URL
            </label>
            <input
              type="url"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
              Paired Post ({language === "en" ? "ES equivalent" : "EN equivalent"})
            </label>
            <select
              value={pairedPostSlug}
              onChange={(e) => setPairedPostSlug(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
              onFocus={focusBorder}
              onBlur={blurBorder}
            >
              <option value="">None</option>
              {otherLangPosts.map((p) => (
                <option key={p.slug} value={p.slug}>
                  [{p.language.toUpperCase()}] {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: "1px solid var(--db-border)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ background: "var(--db-hover)", color: "var(--db-text-muted)", border: "1px solid var(--db-border)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--db-accent)", color: "#fff" }}
          >
            {saving ? "Saving..." : isNew ? "Create Post" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BlogManagementPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<BlogStats>({
    totalPosts: 0,
    publishedPosts: 0,
    totalViews: 0,
    totalCtaClicks: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState<"" | Language>("");
  const [catFilter, setCatFilter] = useState<"" | Category>("");
  const [statusFilter, setStatusFilter] = useState<"" | "published" | "draft">("");

  // Editor modal
  const [editorPost, setEditorPost] = useState<BlogPost | null | undefined>(undefined);
  // undefined = closed, null = new post, BlogPost = editing existing

  // Delete confirmation
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: BlogPost[] = await res.json();
      setPosts(data);

      const totalPosts = data.length;
      const publishedPosts = data.filter((p) => p.published).length;
      const totalViews = data.reduce((sum, p) => sum + (p.views ?? 0), 0);
      const totalCtaClicks = data.reduce((sum, p) => sum + (p.ctaClicks ?? 0), 0);
      setStats({ totalPosts, publishedPosts, totalViews, totalCtaClicks });
    } catch {
      // silently handle; table will be empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async function togglePublish(post: BlogPost) {
    try {
      const res = await fetch(`/api/blog/posts/${post.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !post.published }),
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p.slug === post.slug ? { ...p, published: !p.published } : p))
        );
        setStats((prev) => ({
          ...prev,
          publishedPosts: post.published ? prev.publishedPosts - 1 : prev.publishedPosts + 1,
        }));
      }
    } catch {
      // ignore
    }
  }

  async function deletePost(slug: string) {
    setDeleteError("");
    try {
      const res = await fetch(`/api/blog/posts/${slug}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.slug !== slug));
        setStats((prev) => {
          const deleted = posts.find((p) => p.slug === slug);
          return {
            totalPosts: prev.totalPosts - 1,
            publishedPosts: deleted?.published ? prev.publishedPosts - 1 : prev.publishedPosts,
            totalViews: prev.totalViews - (deleted?.views ?? 0),
            totalCtaClicks: prev.totalCtaClicks - (deleted?.ctaClicks ?? 0),
          };
        });
        setDeletingSlug(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error ?? "Failed to delete post.");
      }
    } catch {
      setDeleteError("Network error. Please try again.");
    }
  }

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------

  const filtered = posts.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.slug.includes(search.toLowerCase())) {
      return false;
    }
    if (langFilter && p.language !== langFilter) return false;
    if (catFilter && p.category !== catFilter) return false;
    if (statusFilter === "published" && !p.published) return false;
    if (statusFilter === "draft" && p.published) return false;
    return true;
  });

  // ---------------------------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------------------------

  const columns: Column<BlogPost>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (row) => (
        <div className="max-w-xs">
          <button
            onClick={() => setEditorPost(row)}
            className="text-left text-sm font-medium truncate block w-full hover:underline"
            style={{ color: "var(--db-accent)" }}
          >
            {row.title}
          </button>
          <span className="text-xs font-mono" style={{ color: "var(--db-text-muted)" }}>
            /{row.slug}
          </span>
        </div>
      ),
    },
    {
      key: "language",
      label: "Lang",
      render: (row) => (
        <span
          className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold uppercase"
          style={
            row.language === "en"
              ? { background: "rgba(96,165,250,0.15)", color: "#60a5fa" }
              : { background: "rgba(251,191,36,0.15)", color: "#fbbf24" }
          }
        >
          {row.language}
        </span>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (row) => (
        <span className="text-xs capitalize" style={{ color: "var(--db-text-secondary)" }}>
          {CATEGORIES.find((c) => c.value === row.category)?.label ?? row.category}
        </span>
      ),
    },
    {
      key: "published",
      label: "Status",
      render: (row) => (
        <StatusBadge status={row.published ? "active" : "open"} />
      ),
    },
    {
      key: "views",
      label: "Views",
      sortable: true,
      render: (row) => (
        <span className="tabular-nums text-sm" style={{ color: "var(--db-text-secondary)" }}>
          {(row.views ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "ctaClicks",
      label: "CTA",
      sortable: true,
      render: (row) => (
        <span className="tabular-nums text-sm" style={{ color: "var(--db-text-secondary)" }}>
          {(row.ctaClicks ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
          {new Date(row.publishedAt ?? row.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => togglePublish(row)}
            title={row.published ? "Unpublish" : "Publish"}
            className="rounded-md px-2 py-1 text-xs font-medium transition-colors"
            style={
              row.published
                ? { background: "rgba(251,191,36,0.1)", color: "#fbbf24" }
                : { background: "rgba(74,222,128,0.1)", color: "#4ade80" }
            }
          >
            {row.published ? "Unpublish" : "Publish"}
          </button>
          <button
            onClick={() => {
              setDeleteError("");
              setDeletingSlug(row.slug);
            }}
            title="Delete post"
            className="rounded-md px-2 py-1 text-xs font-medium transition-colors"
            style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Blog Management</h1>
          <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
            {loading ? "Loading..." : `${filtered.length} of ${posts.length} posts`}
          </p>
        </div>
        <button
          onClick={() => setEditorPost(null)}
          className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          style={{ background: "var(--db-accent)", color: "#fff" }}
        >
          + New Post
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Total Posts" value={stats.totalPosts} />
        <MetricCard label="Published" value={stats.publishedPosts} />
        <MetricCard label="Total Views" value={stats.totalViews} />
        <MetricCard label="CTA Clicks" value={stats.totalCtaClicks} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ border: "1px solid var(--db-border)", background: "var(--db-card)", color: "var(--db-text)" }}
        />
        <select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value as "" | Language)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ border: "1px solid var(--db-border)", background: "var(--db-card)", color: "var(--db-text)" }}
        >
          <option value="">All Languages</option>
          <option value="en">English (EN)</option>
          <option value="es">Spanish (ES)</option>
        </select>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value as "" | Category)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ border: "1px solid var(--db-border)", background: "var(--db-card)", color: "var(--db-text)" }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | "published" | "draft")}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ border: "1px solid var(--db-border)", background: "var(--db-card)", color: "var(--db-text)" }}
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        {(search || langFilter || catFilter || statusFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setLangFilter("");
              setCatFilter("");
              setStatusFilter("");
            }}
            className="text-xs"
            style={{ color: "var(--db-text-muted)" }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <p style={{ color: "var(--db-text-muted)" }}>Loading posts...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
        />
      )}

      {/* Delete confirmation modal */}
      {deletingSlug !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div
            className="w-full max-w-sm rounded-xl p-6"
            style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
          >
            <h3 className="text-base font-semibold" style={{ color: "var(--db-text)" }}>
              Delete post?
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--db-text-muted)" }}>
              This will permanently delete{" "}
              <span className="font-mono" style={{ color: "var(--db-text)" }}>
                /{deletingSlug}
              </span>
              . This action cannot be undone.
            </p>

            {deleteError && (
              <div
                className="mt-3 rounded-lg px-3 py-2 text-sm"
                style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
              >
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeletingSlug(null);
                  setDeleteError("");
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium"
                style={{ background: "var(--db-hover)", color: "var(--db-text-muted)", border: "1px solid var(--db-border)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => deletePost(deletingSlug)}
                className="rounded-lg px-4 py-2 text-sm font-medium"
                style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post editor modal */}
      {editorPost !== undefined && (
        <PostEditorModal
          post={editorPost}
          allPosts={posts}
          onClose={() => setEditorPost(undefined)}
          onSaved={fetchPosts}
        />
      )}
    </div>
  );
}
