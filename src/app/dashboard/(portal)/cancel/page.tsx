"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CaptaSpinnerInline } from "@/components/capta-spinner";

const REASONS = [
  { value: "too_expensive", label: "Too Expensive" },
  { value: "not_enough_value", label: "Not Enough Value" },
  { value: "switching_competitor", label: "Switching to a Competitor" },
  { value: "going_manual", label: "Going Back to Manual" },
  { value: "seasonal_business", label: "Seasonal Business" },
  { value: "other", label: "Other" },
] as const;

export default function CancelPage() {
  const router = useRouter();
  const [reason, setReason] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [showRecoveryOffer, setShowRecoveryOffer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleCancel = async (recoveryOfferAccepted: boolean) => {
    if (!reason) {
      toast.error("Please select a reason for canceling");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          rating: rating || undefined,
          feedback: feedback.trim() || undefined,
          recoveryOfferAccepted,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Cancellation failed");
      }

      await res.json();

      if (recoveryOfferAccepted) {
        toast.success("Your retention offer has been submitted. Our team will apply the discount within 24 hours.");
      } else {
        toast.success("Your subscription has been canceled. You'll retain access until the end of your billing period.");
      }

      router.push("/dashboard/billing");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-body), system-ui, sans-serif", color: "var(--db-text)" }}
        >
          Cancel Subscription
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          We&apos;re sorry to see you go. Your feedback helps us improve.
        </p>
      </div>

      {/* Reason Selection */}
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
      >
        <h3
          className="mb-4 text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--db-text-muted)" }}
        >
          Why are you leaving?
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {REASONS.map((r) => (
            <button
              key={r.value}
              onClick={() => {
                setReason(r.value);
                setShowRecoveryOffer(true);
              }}
              className="rounded-lg px-4 py-3 text-left text-sm font-medium transition-all"
              style={{
                background: reason === r.value ? "rgba(212,168,67,0.1)" : "var(--db-bg)",
                border: `2px solid ${reason === r.value ? "var(--db-accent)" : "var(--db-border)"}`,
                color: reason === r.value ? "var(--db-accent)" : "var(--db-text)",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Satisfaction Rating */}
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
      >
        <h3
          className="mb-4 text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--db-text-muted)" }}
        >
          How would you rate your experience?
        </h3>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-3xl transition-transform hover:scale-110"
              style={{
                color: star <= displayRating ? "#D4A843" : "var(--db-border)",
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: "4px",
              }}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              &#9733;
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
            {rating <= 2 ? "We're sorry we didn't meet your expectations." :
             rating <= 3 ? "Thank you for the honest feedback." :
             "We're glad you had a positive experience!"}
          </p>
        )}
      </div>

      {/* Feedback */}
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
      >
        <h3
          className="mb-4 text-sm font-semibold uppercase tracking-wider"
          style={{ color: "var(--db-text-muted)" }}
        >
          Anything else you&apos;d like to share?
        </h3>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Your feedback helps us improve Capta for everyone..."
          rows={4}
          maxLength={2000}
          className="w-full rounded-lg px-3 py-2 text-sm resize-none"
          style={{
            background: "var(--db-bg)",
            border: "1px solid var(--db-border)",
            color: "var(--db-text)",
          }}
        />
        <p className="mt-1 text-right text-xs" style={{ color: "var(--db-text-muted)" }}>
          {feedback.length}/2000
        </p>
      </div>

      {/* Recovery Offer */}
      {showRecoveryOffer && (
        <div
          className="rounded-xl p-5"
          style={{
            background: "rgba(212,168,67,0.06)",
            border: "2px solid rgba(212,168,67,0.25)",
          }}
        >
          <h3
            className="mb-2 text-base font-semibold"
            style={{ color: "var(--db-text)" }}
          >
            Before you go...
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--db-text-muted)" }}>
            We&apos;d hate to lose you. How about <strong style={{ color: "var(--db-accent)" }}>2 months free</strong> on
            us? Keep your AI receptionist running, and our team will apply the discount to your account within 24 hours.
          </p>
          <button
            onClick={() => handleCancel(true)}
            disabled={submitting}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-all"
            style={{
              background: "var(--db-accent)",
              color: "#fff",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <CaptaSpinnerInline size={16} />
                Processing...
              </span>
            ) : (
              "Yes, I'll Stay — Give Me 2 Months Free"
            )}
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        {/* Keep Account — primary */}
        <button
          onClick={() => router.push("/dashboard/billing")}
          className="rounded-lg px-6 py-3 text-sm font-semibold transition-all"
          style={{
            background: "var(--db-accent)",
            color: "#fff",
            flex: 1,
          }}
        >
          Never Mind, Keep My Account
        </button>

        {/* Cancel — danger, requires confirmation */}
        {!confirmCancel ? (
          <button
            onClick={() => {
              if (!reason) {
                toast.error("Please select a reason first");
                return;
              }
              setConfirmCancel(true);
            }}
            className="rounded-lg px-6 py-3 text-sm font-medium transition-all"
            style={{
              background: "var(--db-danger-bg)",
              color: "var(--db-danger)",
              border: "1px solid var(--db-danger)",
              flex: 1,
            }}
          >
            Cancel My Subscription
          </button>
        ) : (
          <button
            onClick={() => handleCancel(false)}
            disabled={submitting}
            className="rounded-lg px-6 py-3 text-sm font-semibold transition-all"
            style={{
              background: "#dc2626",
              color: "#fff",
              flex: 1,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <CaptaSpinnerInline size={16} />
                Canceling...
              </span>
            ) : (
              "Confirm Cancellation"
            )}
          </button>
        )}
      </div>

      {confirmCancel && (
        <p className="text-center text-xs" style={{ color: "var(--db-text-muted)" }}>
          Your access will continue until the end of your current billing period.
        </p>
      )}
    </div>
  );
}
