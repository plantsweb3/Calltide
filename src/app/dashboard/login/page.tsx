"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

function LanguageToggle({ lang, setLang }: { lang: "en" | "es"; setLang: (l: "en" | "es") => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: "var(--db-hover)" }}>
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
          style={{
            background: lang === l ? "var(--db-card)" : "transparent",
            color: lang === l ? "var(--db-text)" : "var(--db-text-muted)",
            boxShadow: lang === l ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
          }}
        >
          {l === "en" ? "EN" : "ES"}
        </button>
      ))}
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [lang, setLang] = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const errParam = searchParams.get("error");
    const msg = searchParams.get("msg");
    if (errParam === "invalid") {
      setError(t("auth.error.linkExpired", lang));
    } else if (errParam === "expired") {
      setError(t("auth.error.linkUsed", lang));
    } else if (errParam === "rate_limited") {
      setError(t("auth.error.rateLimited", lang));
    } else if (errParam === "session_expired") {
      setError(t("error.sessionExpired", lang));
    }
    if (msg === "password_updated") {
      setSuccessMsg(t("auth.passwordUpdated", lang));
    }
  }, [searchParams, lang]);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/dashboard/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (res.ok) {
        router.push("/dashboard");
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

  async function handleMagicLink() {
    if (!email) {
      setError(t("auth.error.enterEmailFirst", lang));
      return;
    }
    setMagicLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/dashboard/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang }),
      });

      if (res.ok) {
        setMagicLinkSent(true);
      } else {
        const data = await res.json();
        setError(data.error || t("error.somethingWentWrong", lang));
      }
    } catch {
      setError(t("error.somethingWentWrong", lang));
    }
    setMagicLoading(false);
  }

  return (
    <div
      className="w-full max-w-sm space-y-6 rounded-xl p-8 transition-colors duration-300"
      style={{
        background: "var(--db-card)",
        border: "1px solid var(--db-border)",
        boxShadow: "var(--db-card-shadow)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <img src="/images/logo-inline-navy.webp" alt="Capta" className="h-8 w-auto mb-4" />
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--db-text)" }}
          >
            {t("auth.clientPortal", lang)}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
            {t("auth.signInSub", lang)}
          </p>
        </div>
        <LanguageToggle lang={lang} setLang={setLang} />
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

      {successMsg && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "var(--db-success-bg)", color: "var(--db-success)" }}
        >
          {successMsg}
        </div>
      )}

      {magicLinkSent ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "var(--db-success-bg)", color: "var(--db-success)" }}
        >
          {t("auth.magicLinkSent", lang)}
        </div>
      ) : (
        <>
          {/* Password login form */}
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="db-label text-sm"
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

            <div>
              <label
                htmlFor="password"
                className="db-label text-sm"
              >
                {t("auth.password", lang)}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="db-input py-2.5 pr-10"
                  placeholder={t("auth.enterPassword", lang)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: "var(--db-text-muted)" }}
                  tabIndex={0}
                  aria-label={showPassword ? t("auth.hidePassword", lang) : t("auth.showPassword", lang)}
                >
                  {showPassword ? (
                    <svg aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--db-border)] bg-[var(--db-surface)] accent-[var(--db-accent)]"
                />
                <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>
                  {t("auth.rememberMe", lang)}
                </span>
              </label>
              <Link
                href="/dashboard/forgot-password"
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--db-accent)" }}
              >
                {t("auth.forgotPassword", lang)}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="db-btn w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none transition-colors"
              data-variant="primary"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {t("auth.signingIn", lang)}
                </span>
              ) : t("auth.signIn", lang)}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--db-border)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{t("auth.or", lang).toUpperCase()}</span>
            <div className="flex-1 h-px" style={{ background: "var(--db-border)" }} />
          </div>

          {/* Magic link fallback */}
          <button
            type="button"
            onClick={handleMagicLink}
            disabled={magicLoading}
            className="db-btn w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            data-variant="secondary"
          >
            {magicLoading ? t("auth.sending", lang) : t("auth.sendMagicLink", lang)}
          </button>
        </>
      )}

      {/* Trial banner */}
      <div
        className="rounded-lg p-4 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(212,168,67,0.08), rgba(212,168,67,0.15))",
          border: "1px solid rgba(212,168,67,0.25)",
        }}
      >
        <p className="text-sm font-medium mb-1.5" style={{ color: "var(--db-text)" }}>
          {t("auth.noAccount", lang)}
        </p>
        <Link
          href="/setup"
          className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
          style={{
            background: "var(--db-accent)",
            boxShadow: "0 2px 8px rgba(212,168,67,0.3)",
          }}
        >
          {t("auth.startTrialCta", lang)} →
        </Link>
      </div>

      <div className="text-center pt-1">
        <Link
          href="/help"
          className="inline-block text-xs transition-colors"
          style={{ color: "var(--db-text-muted)" }}
        >
          {t("auth.needHelp", lang)} {t("auth.visitHelpCenter", lang)}
        </Link>
      </div>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "linear-gradient(135deg, var(--db-bg) 0%, var(--db-surface) 100%)" }}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
