"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const errParam = searchParams.get("error");
    const msg = searchParams.get("msg");
    if (errParam === "invalid") {
      setError("Login link expired or invalid. Please try again.");
    } else if (errParam === "expired") {
      setError("This login link has already been used. Please request a new one.");
    } else if (errParam === "rate_limited") {
      setError("Too many login attempts. Please wait a few minutes and try again.");
    } else if (errParam === "session_expired") {
      setError("Your session has expired. Please sign in again.");
    }
    if (msg === "password_updated") {
      setSuccessMsg("Password updated successfully. Sign in with your new password.");
    }
  }, [searchParams]);

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
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  async function handleMagicLink() {
    if (!email) {
      setError("Enter your email address first");
      return;
    }
    setMagicLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/dashboard/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMagicLinkSent(true);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Please try again.");
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
      <div>
        <img src="/images/logo-inline-navy.webp" alt="Capta" className="h-8 w-auto mb-4" />
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-body), system-ui, sans-serif", color: "var(--db-text)" }}
        >
          Client Portal
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          Sign in to your dashboard
        </p>
      </div>

      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
        >
          {error}
        </div>
      )}

      {successMsg && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}
        >
          {successMsg}
        </div>
      )}

      {magicLinkSent ? (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}
        >
          We sent a login link to <strong>{email}</strong>. It expires in 15 minutes.
        </div>
      ) : (
        <>
          {/* Password login form */}
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium"
                style={{ color: "var(--db-text-secondary)" }}
              >
                Email
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

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium"
                style={{ color: "var(--db-text-secondary)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 pr-10 text-sm outline-none transition-colors"
                  style={{
                    background: "var(--db-surface)",
                    border: "1px solid var(--db-border)",
                    color: "var(--db-text)",
                  }}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: "var(--db-text-muted)" }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
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
                  className="rounded"
                  style={{ accentColor: "var(--db-accent)" }}
                />
                <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>
                  Remember me
                </span>
              </label>
              <Link
                href="/dashboard/forgot-password"
                className="text-sm font-medium transition-colors"
                style={{ color: "var(--db-accent)" }}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ background: "var(--db-accent)" }}
              onMouseEnter={(e) => {
                if (!loading && email && password) e.currentTarget.style.background = "var(--db-accent-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--db-accent)";
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--db-border)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>OR</span>
            <div className="flex-1 h-px" style={{ background: "var(--db-border)" }} />
          </div>

          {/* Magic link fallback */}
          <button
            type="button"
            onClick={handleMagicLink}
            disabled={magicLoading}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "transparent",
              border: "1px solid var(--db-border)",
              color: "var(--db-text)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--db-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {magicLoading ? "Sending..." : "Send Magic Link"}
          </button>
        </>
      )}

      <div
        className="pt-2 text-center"
        style={{ borderTop: "1px solid var(--db-border)" }}
      >
        <Link
          href="/help"
          className="inline-block text-xs transition-colors"
          style={{ color: "var(--db-text-muted)" }}
        >
          Need help? Visit our Help Center
        </Link>
      </div>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
