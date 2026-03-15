"use client";

import { useState, useEffect } from "react";
import CaptaSpinner from "@/components/capta-spinner";

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
  { value: "feedback", label: "Feedback" },
  { value: "feature_request", label: "Feature Request" },
  { value: "bug_report", label: "Bug Report" },
];

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "calls", label: "Calls" },
  { value: "billing", label: "Billing" },
  { value: "appointments", label: "Appointments" },
  { value: "sms", label: "SMS" },
  { value: "other", label: "Other" },
];

const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  acknowledged: "#8b5cf6",
  in_progress: "#f59e0b",
  resolved: "#22c55e",
  declined: "#94a3b8",
};

export default function ClientFeedbackPage() {
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
      setFormError("Network error. Please try again.");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-body), system-ui, sans-serif", color: "var(--db-text)" }}>Feedback & Reviews</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
            Manage customer reviews and share ideas with our team.
          </p>
        </div>
        {tab === "feedback" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ background: "var(--db-accent)" }}
          >
            {showForm ? "Cancel" : "New Feedback"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--db-hover)" }}>
        {(["feedback", "reviews"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: tab === t ? "var(--db-card)" : "transparent",
              color: tab === t ? "var(--db-text)" : "var(--db-text-muted)",
              boxShadow: tab === t ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
            }}
          >
            {t === "feedback" ? `Feedback (${items.length})` : `Reviews (${reviews.length})`}
          </button>
        ))}
      </div>

      {tab === "feedback" && (
        <>
          {formSuccess && (
            <div className="rounded-lg p-3 text-sm" style={{ background: "rgba(34, 197, 94, 0.1)", color: "#22c55e" }}>
              Thank you! Your feedback has been submitted.
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 rounded-lg p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                  >
                    {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                  >
                    {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of your feedback..."
                  required
                  minLength={3}
                  maxLength={200}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                />
                <p className="mt-1 text-xs text-right" style={{ color: "var(--db-text-muted)" }}>{title.length}/200</p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe in detail..."
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                />
                <p className="mt-1 text-xs text-right" style={{ color: "var(--db-text-muted)" }}>{description.length}/2000</p>
              </div>

              {formError && (
                <p className="text-sm" style={{ color: "#ef4444" }}>{formError}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
                style={{ background: "var(--db-accent)" }}
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          )}

          {/* Feedback list */}
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="rounded-lg p-8 text-center" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <p style={{ color: "var(--db-text-muted)" }}>No feedback submitted yet. Share your first idea!</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg p-4"
                  style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{item.title}</h3>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: `${STATUS_COLORS[item.status] ?? "#94a3b8"}20`, color: STATUS_COLORS[item.status] ?? "#94a3b8" }}
                        >
                          {item.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
                        {item.type.replace(/_/g, " ")} &middot; {item.category} &middot; {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-2 text-sm" style={{ color: "var(--db-text-secondary)" }}>{item.description}</p>
                    </div>
                  </div>

                  {item.adminResponse && (
                    <div className="mt-3 rounded-lg p-3" style={{ background: "var(--db-hover)" }}>
                      <p className="text-xs font-medium" style={{ color: "var(--db-accent)" }}>Team Response</p>
                      <p className="mt-1 text-sm" style={{ color: "var(--db-text)" }}>{item.adminResponse}</p>
                      {item.adminRespondedAt && (
                        <p className="mt-1 text-[10px]" style={{ color: "var(--db-text-muted)" }}>
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
      // silently fail
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
    } catch {}
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
    } catch {}
  }

  const REPLY_STATUS_COLORS: Record<string, string> = {
    none: "#94a3b8",
    drafted: "#f59e0b",
    approved: "#22c55e",
    posted: "#3b82f6",
  };

  return (
    <div className="space-y-3">
      {reviews.length === 0 ? (
        <div className="rounded-lg p-8 text-center" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <p style={{ color: "var(--db-text-muted)" }}>No reviews yet. Reviews will appear here when imported or synced.</p>
        </div>
      ) : (
        reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-lg p-4"
            style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                    {review.authorName || "Anonymous"}
                  </span>
                  <span className="text-sm" style={{ color: "#fbbf24" }}>
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </span>
                  {review.replyStatus !== "none" && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: `${REPLY_STATUS_COLORS[review.replyStatus]}20`, color: REPLY_STATUS_COLORS[review.replyStatus] }}
                    >
                      {review.replyStatus}
                    </span>
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
                  <button
                    onClick={() => generateDraft(review.id)}
                    disabled={drafting === review.id}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-50"
                    style={{ background: "var(--db-accent)", color: "white" }}
                  >
                    {drafting === review.id ? "Generating..." : "Generate Reply"}
                  </button>
                )}
              </div>
            </div>

            {/* Draft display */}
            {review.replyDraft && review.replyStatus !== "none" && (
              <div className="mt-3 rounded-lg p-3" style={{ background: "var(--db-hover)" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--db-accent)" }}>
                  AI Draft {review.replyStatus === "approved" && "(Approved)"}
                </p>
                {editing === review.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ background: "var(--db-surface)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(review.id)}
                        className="rounded-lg px-3 py-1 text-xs font-medium text-white"
                        style={{ background: "var(--db-accent)" }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditing(null); setEditText(""); }}
                        className="rounded-lg px-3 py-1 text-xs font-medium"
                        style={{ color: "var(--db-text-muted)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm" style={{ color: "var(--db-text)" }}>{review.replyDraft}</p>
                    {review.replyStatus === "drafted" && (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => approveDraft(review.id)}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-white"
                          style={{ background: "#22c55e" }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => { setEditing(review.id); setEditText(review.replyDraft || ""); }}
                          className="rounded-lg px-3 py-1 text-xs font-medium"
                          style={{ background: "var(--db-surface)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => generateDraft(review.id)}
                          disabled={drafting === review.id}
                          className="rounded-lg px-3 py-1 text-xs font-medium disabled:opacity-50"
                          style={{ color: "var(--db-text-muted)" }}
                        >
                          {drafting === review.id ? "Regenerating..." : "Regenerate"}
                        </button>
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
