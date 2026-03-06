"use client";

import { useEffect, useState, useCallback } from "react";
import MetricCard from "../../_components/metric-card";
import DataTable, { type Column } from "../../_components/data-table";
import StatusBadge from "../../_components/status-badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarketingStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  missRate: number;
  conversionRate: number;
  demosBooked: number;
}

interface AuditRequest {
  id: string;
  businessName: string | null;
  phone: string | null;
  businessType: string | null;
  language: string | null;
  status: string;
  reportSentAt: string | null;
  demoBookedAt: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
}

interface ContentItem {
  id: string;
  platform: string;
  language: string;
  category: string;
  status: string;
  scheduledFor: string | null;
  title: string;
  body: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORMS = ["FB", "IG", "LinkedIn"] as const;
const LANGUAGES = ["EN", "ES"] as const;
const CATEGORIES = [
  "data-drop",
  "maria-demo",
  "client-win",
  "education",
  "behind-the-scenes",
] as const;
const CONTENT_STATUSES = ["draft", "approved", "published"] as const;

const PLATFORM_COLORS: Record<string, { bg: string; color: string }> = {
  FB: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
  IG: { bg: "rgba(236,72,153,0.15)", color: "#f472b6" },
  LinkedIn: { bg: "rgba(14,165,233,0.15)", color: "#38bdf8" },
};

const CONTENT_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft: { bg: "rgba(148,163,184,0.15)", color: "#94a3b8" },
  approved: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24" },
  published: { bg: "rgba(74,222,128,0.15)", color: "#4ade80" },
};

const AUDIT_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  scheduled: { bg: "rgba(96,165,250,0.15)", color: "#60a5fa" },
  calling: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24" },
  missed: { bg: "rgba(248,113,113,0.15)", color: "#f87171" },
  answered: { bg: "rgba(74,222,128,0.15)", color: "#4ade80" },
  voicemail: { bg: "rgba(168,85,247,0.15)", color: "#a855f7" },
};

const inputStyle = {
  background: "var(--db-hover)",
  border: "1px solid var(--db-border)",
  color: "var(--db-text)",
} as const;

// ---------------------------------------------------------------------------
// New Content Modal
// ---------------------------------------------------------------------------

interface NewContentModalProps {
  onClose: () => void;
  onComplete: () => void;
}

function NewContentModal({ onClose, onComplete }: NewContentModalProps) {
  const [platform, setPlatform] = useState<string>(PLATFORMS[0]);
  const [language, setLanguage] = useState<string>(LANGUAGES[0]);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/content-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform,
        language,
        category,
        title,
        body,
        scheduledFor: scheduledFor || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      onComplete();
      onClose();
    } else {
      setError(data.error || "Failed to create content item");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="w-full max-w-lg rounded-xl p-6"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
            New Content
          </h2>
          <button
            onClick={onClose}
            className="text-xl leading-none"
            style={{ color: "var(--db-text-muted)" }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--db-text-muted)" }}>
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--db-text-muted)" }}>
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--db-text-muted)" }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs" style={{ color: "var(--db-text-muted)" }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs" style={{ color: "var(--db-text-muted)" }}>
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs" style={{ color: "var(--db-text-muted)" }}>
              Scheduled For (optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
            />
          </div>

          {error && (
            <div
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm transition-colors"
              style={{ border: "1px solid var(--db-border)", color: "var(--db-text-secondary)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title || !body}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: "var(--db-accent)", color: "#fff" }}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function YesNo({ value }: { value: boolean }) {
  return (
    <span
      className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
      style={
        value
          ? { background: "rgba(74,222,128,0.1)", color: "#4ade80" }
          : { background: "var(--db-hover)", color: "var(--db-text-muted)" }
      }
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MarketingPage() {
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [auditRequests, setAuditRequests] = useState<AuditRequest[]>([]);
  const [contentQueue, setContentQueue] = useState<ContentItem[]>([]);
  const [showNewContent, setShowNewContent] = useState(false);
  const [contentFilter, setContentFilter] = useState<string>("");
  const [auditStatusFilter, setAuditStatusFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(() => {
    fetch("/api/marketing/stats")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setStats)
      .catch(() => setError("Failed to load marketing stats"));
  }, []);

  const fetchAuditRequests = useCallback(() => {
    const params = auditStatusFilter
      ? `?status=${encodeURIComponent(auditStatusFilter)}`
      : "";
    fetch(`/api/marketing/audit-requests${params}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setAuditRequests(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => setError("Failed to load audit requests"));
  }, [auditStatusFilter]);

  const fetchContentQueue = useCallback(() => {
    const params = contentFilter
      ? `?status=${encodeURIComponent(contentFilter)}`
      : "";
    fetch(`/api/content-queue${params}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setContentQueue(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => setError("Failed to load content queue"));
  }, [contentFilter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchAuditRequests(); }, [fetchAuditRequests]);
  useEffect(() => { fetchContentQueue(); }, [fetchContentQueue]);

  async function approveContent(id: string) {
    await fetch(`/api/content-queue/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    fetchContentQueue();
  }

  async function deleteContent(id: string) {
    await fetch(`/api/content-queue/${id}`, { method: "DELETE" });
    fetchContentQueue();
  }

  // ------------------------------------------------------------------
  // Audit Requests columns
  // ------------------------------------------------------------------

  const auditColumns: Column<AuditRequest>[] = [
    {
      key: "businessName",
      label: "Business",
      render: (row) => (
        <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
          {row.businessName || "—"}
        </span>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (row) => (
        <span className="text-xs tabular-nums" style={{ color: "var(--db-text-muted)" }}>
          {row.phone || "—"}
        </span>
      ),
    },
    {
      key: "businessType",
      label: "Type",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-secondary)" }}>
          {row.businessType || "—"}
        </span>
      ),
    },
    {
      key: "language",
      label: "Lang",
      render: (row) => (
        <span className="text-xs uppercase" style={{ color: "var(--db-text-muted)" }}>
          {row.language || "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const style = AUDIT_STATUS_COLORS[row.status] ?? {
          bg: "var(--db-hover)",
          color: "var(--db-text-muted)",
        };
        return (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: style.bg, color: style.color }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.color }} />
            {row.status}
          </span>
        );
      },
    },
    {
      key: "reportSentAt",
      label: "Report Sent",
      render: (row) => <YesNo value={!!row.reportSentAt} />,
    },
    {
      key: "demoBookedAt",
      label: "Demo Booked",
      render: (row) => <YesNo value={!!row.demoBookedAt} />,
    },
    {
      key: "utmSource",
      label: "Source",
      render: (row) => {
        const parts = [row.utmSource, row.utmMedium, row.utmCampaign].filter(Boolean);
        return (
          <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {parts.length > 0 ? parts.join(" / ") : "—"}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Date",
      render: (row) => (
        <span className="text-xs tabular-nums" style={{ color: "var(--db-text-muted)" }}>
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  // ------------------------------------------------------------------
  // Content Queue columns
  // ------------------------------------------------------------------

  const contentColumns: Column<ContentItem>[] = [
    {
      key: "platform",
      label: "Platform",
      render: (row) => {
        const style = PLATFORM_COLORS[row.platform] ?? {
          bg: "var(--db-hover)",
          color: "var(--db-text-muted)",
        };
        return (
          <span
            className="rounded px-1.5 py-0.5 text-xs font-semibold"
            style={{ background: style.bg, color: style.color }}
          >
            {row.platform}
          </span>
        );
      },
    },
    {
      key: "language",
      label: "Lang",
      render: (row) => (
        <span className="text-xs uppercase font-medium" style={{ color: "var(--db-text-muted)" }}>
          {row.language}
        </span>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-secondary)" }}>
          {row.category.replace(/-/g, " ")}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const style = CONTENT_STATUS_COLORS[row.status] ?? {
          bg: "var(--db-hover)",
          color: "var(--db-text-muted)",
        };
        return (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: style.bg, color: style.color }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.color }} />
            {row.status}
          </span>
        );
      },
    },
    {
      key: "scheduledFor",
      label: "Scheduled For",
      render: (row) => (
        <span className="text-xs tabular-nums" style={{ color: "var(--db-text-muted)" }}>
          {formatDate(row.scheduledFor)}
        </span>
      ),
    },
    {
      key: "title",
      label: "Title",
      render: (row) => (
        <span
          className="block max-w-[260px] truncate text-sm"
          style={{ color: "var(--db-text)" }}
          title={row.title}
        >
          {row.title}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === "draft" && (
            <button
              onClick={(e) => { e.stopPropagation(); approveContent(row.id); }}
              className="rounded px-2 py-1 text-xs font-medium transition-colors"
              style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(74,222,128,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(74,222,128,0.1)"; }}
            >
              Approve
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); deleteContent(row.id); }}
            className="rounded px-2 py-1 text-xs font-medium transition-colors"
            style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.1)"; }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>
          Marketing
        </h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          Audit funnel performance and content scheduling
        </p>
      </div>

      {error && (
        <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TOP ROW — Audit Funnel Metrics                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          label="Audit Requests Today"
          value={stats?.today ?? 0}
        />
        <MetricCard
          label="This Week"
          value={stats?.thisWeek ?? 0}
        />
        <MetricCard
          label="This Month"
          value={stats?.thisMonth ?? 0}
        />
        <MetricCard
          label="Miss Rate"
          value={stats?.missRate ?? 0}
          suffix="%"
          decimals={1}
          changeType={
            stats == null
              ? "neutral"
              : stats.missRate > 30
              ? "negative"
              : stats.missRate > 15
              ? "neutral"
              : "positive"
          }
        />
        <MetricCard
          label="Report → Demo"
          value={stats?.conversionRate ?? 0}
          suffix="%"
          decimals={1}
          changeType={
            stats == null
              ? "neutral"
              : stats.conversionRate >= 20
              ? "positive"
              : stats.conversionRate >= 10
              ? "neutral"
              : "negative"
          }
        />
        <MetricCard
          label="Demos Booked"
          value={stats?.demosBooked ?? 0}
          changeType="positive"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MIDDLE — Audit Activity Feed                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium" style={{ color: "var(--db-text)" }}>
              Audit Activity
            </h2>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              Recent audit page requests
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={auditStatusFilter}
              onChange={(e) => setAuditStatusFilter(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: "var(--db-hover)",
                border: "1px solid var(--db-border)",
                color: "var(--db-text)",
              }}
            >
              <option value="">All Statuses</option>
              {Object.keys(AUDIT_STATUS_COLORS).map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {auditRequests.length === 0 && stats === null ? (
          <div
            className="flex h-32 items-center justify-center rounded-xl"
            style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
          >
            <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
              Loading audit requests...
            </p>
          </div>
        ) : (
          <DataTable columns={auditColumns} data={auditRequests} />
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* BOTTOM — Content Queue                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium" style={{ color: "var(--db-text)" }}>
              Content Queue
            </h2>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              Social media content pipeline
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={contentFilter}
              onChange={(e) => setContentFilter(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: "var(--db-hover)",
                border: "1px solid var(--db-border)",
                color: "var(--db-text)",
              }}
            >
              <option value="">All Statuses</option>
              {CONTENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowNewContent(true)}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ background: "var(--db-accent)", color: "#fff" }}
            >
              New Content
            </button>
          </div>
        </div>

        {contentQueue.length === 0 && stats === null ? (
          <div
            className="flex h-32 items-center justify-center rounded-xl"
            style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
          >
            <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
              Loading content queue...
            </p>
          </div>
        ) : (
          <DataTable columns={contentColumns} data={contentQueue} />
        )}
      </div>

      {/* Modal */}
      {showNewContent && (
        <NewContentModal
          onClose={() => setShowNewContent(false)}
          onComplete={fetchContentQueue}
        />
      )}
    </div>
  );
}
