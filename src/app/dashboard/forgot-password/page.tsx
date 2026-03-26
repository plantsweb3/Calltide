"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lang] = useLang();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/dashboard/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang }),
      });

      if (res.ok) {
        setSubmitted(true);
        return;
      } else {
        const data = await res.json();
        setError(data.error || t("error.somethingWentWrong", lang));
      }
    } catch {
      setError(t("error.somethingWentWrong", lang));
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div
        className="w-full max-w-sm space-y-6 rounded-2xl p-8 transition-colors duration-300"
        style={{
          background: "var(--db-card)",
          border: "1px solid var(--db-border)",
          boxShadow: "var(--db-card-shadow)",
        }}
      >
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-body), system-ui, sans-serif", color: "var(--db-text)" }}
          >
            {t("auth.resetPassword", lang)}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
            {submitted
              ? t("auth.checkEmailForReset", lang)
              : t("auth.resetPasswordSub", lang)}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-lg px-4 py-3 text-sm"
            style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}
          >
            {error}
          </div>
        )}

        {submitted ? (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg px-4 py-3 text-sm"
            style={{ background: "var(--db-success-bg)", color: "var(--db-success)" }}
          >
            {t("auth.resetLinkSentConfirm", lang, { email })}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="db-label mb-1.5"
              >
                {t("auth.email", lang)}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="db-input py-2.5"
                placeholder="you@business.com"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="db-btn w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-variant="primary"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {t("auth.sending", lang)}
                </span>
              ) : t("auth.sendResetLink", lang)}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/dashboard/login"
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--db-accent)" }}
          >
            {t("auth.backToSignIn", lang)}
          </Link>
        </div>
      </div>
    </div>
  );
}
