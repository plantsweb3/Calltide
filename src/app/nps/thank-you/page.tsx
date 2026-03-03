"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const score = searchParams.get("score");
  const businessId = searchParams.get("businessId");

  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedback.trim() || !businessId) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/success/nps/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          feedback: feedback.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Nav */}
      <nav className="border-b border-[#E2E8F0] bg-white px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/">
            <img src="/images/logo.webp" alt="Calltide" className="h-6 w-auto" />
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-lg px-6 py-16 sm:py-24">
        <div
          className="rounded-xl border border-[#E2E8F0] bg-white p-8 sm:p-10"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)" }}
        >
          {/* Checkmark */}
          <div className="flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: "#f0fdf4" }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          <h1
            className="mt-6 text-center text-2xl font-extrabold tracking-tight sm:text-3xl"
            style={{ color: "#1a1a2e" }}
          >
            Thank you for your feedback!
          </h1>

          <p
            className="mt-3 text-center text-base leading-relaxed"
            style={{ color: "#666" }}
          >
            {score
              ? `You rated us ${score}/10. We appreciate you taking the time.`
              : "We appreciate you taking the time."}
          </p>

          {/* Feedback form */}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="mt-8">
              <label
                htmlFor="feedback"
                className="mb-2 block text-sm font-medium"
                style={{ color: "#1a1a2e" }}
              >
                Any additional feedback? What could we improve?
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Tell us what's on your mind..."
                className="w-full rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2"
                style={{
                  borderColor: "#E2E8F0",
                  color: "#1a1a2e",
                  resize: "vertical",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#C59A27";
                  e.target.style.boxShadow = "0 0 0 2px rgba(200,169,81,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E2E8F0";
                  e.target.style.boxShadow = "none";
                }}
              />

              {error && (
                <p className="mt-2 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !feedback.trim()}
                className="mt-4 w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#C59A27" }}
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          ) : (
            <div className="mt-8 rounded-lg p-4 text-center" style={{ backgroundColor: "#f0fdf4" }}>
              <p className="text-sm font-medium" style={{ color: "#16a34a" }}>
                Thank you! Your feedback helps us improve.
              </p>
            </div>
          )}
        </div>

        {/* Footer link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm font-semibold transition-colors hover:underline"
            style={{ color: "#C59A27" }}
          >
            Back to Calltide
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function NpsThankYouPage() {
  return (
    <Suspense>
      <ThankYouContent />
    </Suspense>
  );
}
