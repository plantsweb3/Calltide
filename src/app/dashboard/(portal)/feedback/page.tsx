"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CaptaSpinner from "@/components/capta-spinner";
import Button from "@/components/ui/button";
import StatusBadge from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

interface FeedbackItem {
  id: string;
  type: string;
  category: string;
  title: string;
  description: string;
  status: string;
  adminResponse: string | null;
  adminRespondedAt: string | null;
  priority: string | null;
  createdAt: string;
}

interface ReviewItem {
  id: string;
  authorName: string | null;
  rating: number;
  text: string | null;
  replyDraft: string | null;
  replyStatus: string;
  publishedAt: string | null;
  createdAt: string;
}

const TYPE_OPTIONS = [
  { value: "feedback", key: "feedback.feedbackLabel" },
  { value: "feature_request", key: "feedback.featureRequestLabel" },
  { value: "bug_report", key: "feedback.bugReportLabel" },
] as const;

const CATEGORY_OPTIONS = [
  { value: "general", key: "feedback.general" },
  { value: "calls", key: "feedback.calls" },
  { value: "billing", key: "feedback.billing" },
  { value: "appointments", key: "feedback.appointments" },
  { value: "sms", key: "feedback.sms" },
  { value: "other", key: "feedback.other" },
] as const;

const FEEDBACK_STATUS_VARIANT: Record<string, "info" | "accent" | "warning" | "success" | "neutral"> = {
  new: "info",
  acknowledged: "accent",
  in_progress: "warning",
  resolved: "success",
  declined: "neutral",
};

export default function ClientFeedbackPage() {
  const [lang] = useLang();
  const [tab, setTab] = useState<"feedback" | "reviews">("feedback");
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  const [type, setType] = useState("feedback");
  const [category, setCategory] = useState("general");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/feedback")
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((d) => setItems(d.items || [])),
      fetch("/api/dashboard/reviews")
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((d) => setReviews(d.reviews || []))
        .catch(() => {}),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/dashboard/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, category, title, description }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to submit");
        return;
      }

      setItems((prev) => [data.item, ...prev]);
      setTitle("");
      setDescription("");
      setShowForm(false);
      setFormSuccess(true);
      setTimeout(() => setFormSuccess(false), 3000);
    } catch {
      setFormError(t("feedback.networkError", lang));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CaptaSpinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        catalog="Feedback"
        title={t("feedback.title", lang)}
        description={t("feedback.description", lang)}
        actions={
          <div className="flex items-center gap-3">
            <Link href="/dashboard/complaints" className="text-sm font-medium" style={{ color: "var(--db-accent)" }}>
              {t("feedback.reportIssue", lang)} &rarr;
            </Link>
            {tab === "feedback" && (
              <Button
                variant={showForm ? "secondary" : "primary"}
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? t("action.cancel", lang) : t("feedback.newFeedback", lang)}
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--db-hover)" }}>
        {(["feedback", "reviews"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: tab === tabKey ? "var(--db-card)" : "transparent",
              color: tab === tabKey ? "var(--db-text)" : "var(--db-text-muted)",
              boxShadow: tab === tabKey ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            }}
          >
            {tabKey === "feedback" ? `${t("feedback.feedbackTab", lang)} (${items.length})` : `${t("feedback.reviewsTab", lang)} (${reviews.length})`}
          </button>
        ))}
      </div>

      {tab === "feedback" && (
        <>
          {formSuccess && (
            <div className="rounded-lg p-3 text-sm" style={{ background: "var(--db-success-bg)", color: "var(--db-success)" }}>
              {t("feedback.thankYou", lang)}
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="db-card space-y-4 rounded-xl p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="db-label">{t("feedback.type", lang)}</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="db-select"
                  >
                    {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t(o.key, lang)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="db-label">{t("feedback.category", lang)}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="db-select"
                  >
                    {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t(o.key, lang)}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="db-label">{t("feedback.titleLabel", lang)}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("feedback.titlePlaceholder", lang)}
                  required
                  minLength={3}
                  maxLength={200}
                  className="db-input"
                />
                <p className="mt-1 text-xs text-right" style={{ color: "var(--db-text-muted)" }}>{title.length}/200</p>
              </div>

              <div>
                <label className="db-label">{t("feedback.descriptionLabel", lang)}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("feedback.descriptionPlaceholder", lang)}
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  className="db-input resize-none"
                />
                <p className="mt-1 text-xs text-right" style={{ color: "var(--db-text-muted)" }}>{description.length}/2000</p>
              </div>

              {formError && (
                <p className="text-sm" style={{ color: "var(--db-danger)" }}>{formError}</p>
              )}

              <Button type="submit" disabled={submitting}>
                {submitting ? t("feedback.submitting", lang) : t("feedback.submitFeedback", lang)}
              </Button>
            </form>
          )}

          {/* Feedback list */}
          <div className="space-y-3">
            {items.length === 0 ? (
              <EmptyState
                icon={
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <line x1="9" y1="10" x2="9.01" y2="10" /><line x1="15" y1="10" x2="15.01" y2="10" />
                  </svg>
                }
                title={t("feedback.noFeedbackYet", lang)}
                description={t("feedback.noFeedbackDesc", lang)}
                action={{ label: t("feedback.newFeedback", lang), onClick: () => setShowForm(true) }}
              />
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="db-card rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{item.title}</h3>
                        <StatusBadge label={item.status} variant={FEEDBACK_STATUS_VARIANT[item.status] ?? "neutral"} />
                      </div>
                      <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
                        {item.type.replace(/_/g, " ")} &middot; {item.category} &middot; {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-2 text-sm" style={{ color: "var(--db-text-secondary)" }}>{item.description}</p>
                    </div>
                  </div>

                  {item.adminResponse && (
                    <div className="mt-3 rounded-lg p-3" style={{ background: "var(--db-hover)" }}>
                      <p className="text-xs font-medium" style={{ color: "var(--db-accent)" }}>{t("feedback.teamResponse", lang)}</p>
                      <p className="mt-1 text-sm" style={{ color: "var(--db-text)" }}>{item.adminResponse}</p>
                      {item.adminRespondedAt && (
                        <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
                          {new Date(item.adminRespondedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {tab === "reviews" && (
        <ReviewsSection reviews={reviews} setReviews={setReviews} />
      )}
    </div>
  );
}

function ReviewsSection({ reviews, setReviews }: { reviews: ReviewItem[]; setReviews: React.Dispatch<React.SetStateAction<ReviewItem[]>> }) {
  const [lang] = useLang();
  const [drafting, setDrafting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  async function generateDraft(reviewId: string) {
    setDrafting(reviewId);
    try {
      const res = await fetch(`/api/dashboard/reviews/${reviewId}/draft`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) => prev.map((r) =>
          r.id === reviewId ? { ...r, replyDraft: data.draft, replyStatus: "drafted" } : r
        ));
      }
    } catch {
      // silent — non-critical UX action
    } finally {
      setDrafting(null);
    }
  }

  async function approveDraft(reviewId: string) {
    try {
      const res = await fetch(`/api/dashboard/reviews/${reviewId}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        setReviews((prev) => prev.map((r) =>
          r.id === reviewId ? { ...r, replyStatus: "approved" } : r
        ));
      }
    } catch {
      // silent — non-critical UX action
    }
  }

  async function saveEdit(reviewId: string) {
    try {
      const res = await fetch(`/api/dashboard/reviews/${reviewId}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit", reply: editText }),
      });
      if (res.ok) {
        setReviews((prev) => prev.map((r) =>
          r.id === reviewId ? { ...r, replyDraft: editText, replyStatus: "drafted" } : r
        ));
        setEditing(null);
        setEditText("");
      }
    } catch {
      // silent — non-critical UX action
    }
  }

  const REPLY_STATUS_VARIANT: Record<string, "neutral" | "warning" | "success" | "info"> = {
    none: "neutral",
    drafted: "warning",
    approved: "success",
    posted: "info",
  };

  return (
    <div className="space-y-3">
      {reviews.length === 0 ? (
        <EmptyState
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
          title={t("feedback.noReviewsYet", lang)}
          description={t("feedback.noReviewsDesc", lang)}
        />
      ) : (
        reviews.map((review) => (
          <div
            key={review.id}
            className="db-card rounded-lg p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                    {review.authorName || t("feedback.anonymous", lang)}
                  </span>
                  <span className="text-sm" style={{ color: "var(--db-warning)" }}>
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </span>
                  {review.replyStatus !== "none" && (
                    <StatusBadge label={review.replyStatus} variant={REPLY_STATUS_VARIANT[review.replyStatus] ?? "neutral"} />
                  )}
                </div>
                {review.publishedAt && (
                  <p className="mt-0.5 text-xs" style={{ color: "var(--db-text-muted)" }}>
                    {new Date(review.publishedAt).toLocaleDateString()}
                  </p>
                )}
                {review.text && (
                  <p className="mt-2 text-sm" style={{ color: "var(--db-text-secondary)" }}>
                    &ldquo;{review.text}&rdquo;
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex shrink-0 gap-2">
                {(!review.replyDraft || review.replyStatus === "none") && (
                  <Button
                    size="sm"
                    onClick={() => generateDraft(review.id)}
                    disabled={drafting === review.id}
                  >
                    {drafting === review.id ? t("feedback.generating", lang) : t("feedback.generateReply", lang)}
                  </Button>
                )}
              </div>
            </div>

            {/* Draft display */}
            {review.replyDraft && review.replyStatus !== "none" && (
              <div className="mt-3 rounded-lg p-3" style={{ background: "var(--db-hover)" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--db-accent)" }}>
                  {t("feedback.aiDraft", lang)} {review.replyStatus === "approved" && t("feedback.approved", lang)}
                </p>
                {editing === review.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="db-input resize-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(review.id)}>
                        {t("action.save", lang)}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setEditText(""); }}>
                        {t("action.cancel", lang)}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm" style={{ color: "var(--db-text)" }}>{review.replyDraft}</p>
                    {review.replyStatus === "drafted" && (
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => approveDraft(review.id)} style={{ background: "var(--db-success)", color: "#fff" }}>
                          {t("feedback.approve", lang)}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => { setEditing(review.id); setEditText(review.replyDraft || ""); }}>
                          {t("action.edit", lang)}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => generateDraft(review.id)}
                          disabled={drafting === review.id}
                        >
                          {drafting === review.id ? t("feedback.regenerating", lang) : t("feedback.regenerate", lang)}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
