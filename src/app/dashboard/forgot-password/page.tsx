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
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSubmitted(true);
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
        className="w-full max-w-sm space-y-6 rounded-xl p-8 transition-colors duration-300"
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
              ? (lang === "es" ? "Revisa tu correo para el enlace de restablecimiento" : "Check your email for a reset link")
              : t("auth.resetPasswordSub", lang)}
          </p>
        </div>

        {error && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}
          >
            {error}
          </div>
        )}

        {submitted ? (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{ background: "var(--db-success-bg)", color: "var(--db-success)" }}
          >
            {lang === "es"
              ? <>Si existe una cuenta para <strong>{email}</strong>, recibiras un enlace. Expira en 1 hora.</>
              : <>If an account exists for <strong>{email}</strong>, you&apos;ll receive a reset link. It expires in 1 hour.</>}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium"
                style={{ color: "var(--db-text-secondary)" }}
              >
                {t("auth.email", lang)}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                style={{
                  background: "var(--db-surface)",
                  border: "1px solid var(--db-border)",
                  color: "var(--db-text)",
                }}
                placeholder="you@business.com"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ background: "var(--db-accent)" }}
              onMouseEnter={(e) => {
                if (!loading && email) e.currentTarget.style.background = "var(--db-accent-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--db-accent)";
              }}
            >
              {loading ? t("auth.sending", lang) : t("auth.sendResetLink", lang)}
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
