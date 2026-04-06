"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CaptaSpinnerInline } from "@/components/capta-spinner";
import Button from "@/components/ui/button";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

const REASONS = [
  { value: "too_expensive", key: "cancel.reasons.tooExpensive" },
  { value: "not_enough_value", key: "cancel.reasons.notEnoughValue" },
  { value: "switching_competitor", key: "cancel.reasons.switchingCompetitor" },
  { value: "going_manual", key: "cancel.reasons.goingManual" },
  { value: "seasonal_business", key: "cancel.reasons.seasonalBusiness" },
  { value: "other", key: "cancel.otherReason" },
] as const;

export default function CancelPage() {
  const [lang] = useLang();
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
      toast.error(t("toast.selectCancelReason", lang));
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
        throw new Error(err?.error || t("error.cancellationFailed", lang));
      }

      await res.json();

      if (recoveryOfferAccepted) {
        toast.success(t("toast.retentionOfferSubmitted", lang));
      } else {
        toast.success(t("toast.subscriptionCanceled", lang));
      }

      router.push("/dashboard/billing");
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("error.somethingWentWrong", lang);
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
          style={{ color: "var(--db-text)" }}
        >
          {t("cancel.title", lang)}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          {t("cancel.sorryToSeeYouGo", lang)}
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
          {t("cancel.tellUsWhy", lang)}
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
                background: reason === r.value ? "var(--db-accent-bg)" : "var(--db-bg)",
                border: `2px solid ${reason === r.value ? "var(--db-accent)" : "var(--db-border)"}`,
                color: reason === r.value ? "var(--db-accent)" : "var(--db-text)",
              }}
            >
              {t(r.key, lang)}
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
          {t("cancel.rateExperience", lang)}
        </h3>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-3xl transition-transform hover:scale-110 p-1 bg-transparent border-0 cursor-pointer"
              style={{
                color: star <= displayRating ? "var(--db-accent)" : "var(--db-border)",
              }}
              aria-label={t(star > 1 ? "cancel.starRatingPlural" : "cancel.starRating", lang, { count: star })}
            >
              &#9733;
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
            {rating <= 2 ? t("cancel.ratingLow", lang) :
             rating <= 3 ? t("cancel.ratingMid", lang) :
             t("cancel.ratingHigh", lang)}
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
          {t("cancel.anythingElse", lang)}
        </h3>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={t("cancel.feedbackPlaceholder", lang)}
          rows={4}
          maxLength={2000}
          className="db-input resize-none"
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
            background: "var(--db-accent-bg)",
            border: "2px solid var(--db-accent)",
          }}
        >
          <h3
            className="mb-2 text-base font-semibold"
            style={{ color: "var(--db-text)" }}
          >
            {t("cancel.beforeYouGo", lang)}
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--db-text-muted)" }}>
            {t("cancel.recoveryOffer", lang)}
          </p>
          <Button
            onClick={() => handleCancel(true)}
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <CaptaSpinnerInline size={16} />
                {t("cancel.processing", lang)}
              </span>
            ) : (
              t("cancel.acceptOffer", lang)
            )}
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        {/* Keep Account — primary */}
        <Button
          onClick={() => router.push("/dashboard/billing")}
          size="lg"
          style={{ flex: 1 }}
        >
          {t("cancel.keepSubscription", lang)}
        </Button>

        {/* Cancel — danger, requires confirmation */}
        {!confirmCancel ? (
          <Button
            variant="danger"
            size="lg"
            onClick={() => {
              if (!reason) {
                toast.error(t("toast.selectReasonFirst", lang));
                return;
              }
              setConfirmCancel(true);
            }}
            style={{ flex: 1 }}
          >
            {t("cancel.cancelMySubscription", lang)}
          </Button>
        ) : (
          <Button
            variant="danger"
            size="lg"
            onClick={() => handleCancel(false)}
            disabled={submitting}
            style={{ flex: 1 }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <CaptaSpinnerInline size={16} />
                {t("cancel.canceling", lang)}
              </span>
            ) : (
              t("cancel.confirmCancel", lang)
            )}
          </Button>
        )}
      </div>

      {confirmCancel && (
        <p className="text-center text-xs" style={{ color: "var(--db-text-muted)" }}>
          {t("cancel.accessUntilEnd", lang)}
        </p>
      )}
    </div>
  );
}
