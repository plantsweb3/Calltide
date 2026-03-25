"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function getStrength(pw: string): "weak" | "fair" | "strong" {
  if (pw.length < 8 || !/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return "weak";
  if (pw.length >= 12 && /[^a-zA-Z0-9]/.test(pw)) return "strong";
  return "fair";
}

const STRENGTH_CONFIG = {
  weak: { color: "var(--db-danger)", label: "Weak", width: "33%" },
  fair: { color: "#facc15", label: "Fair", width: "66%" },
  strong: { color: "var(--db-success)", label: "Strong", width: "100%" },
} as const;

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getStrength(password);
  const config = STRENGTH_CONFIG[strength];

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--db-border)" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ background: config.color, width: config.width }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: config.color }}>{config.label}</span>
        <div className="text-xs space-x-3" style={{ color: "var(--db-text-muted)" }}>
          <span style={{ color: password.length >= 8 ? "var(--db-success)" : undefined }}>8+ chars</span>
          <span style={{ color: /[a-zA-Z]/.test(password) ? "var(--db-success)" : undefined }}>Letter</span>
          <span style={{ color: /[0-9]/.test(password) ? "var(--db-success)" : undefined }}>Number</span>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = useMemo(() => {
    if (password.length < 8) return false;
    if (!/[a-zA-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (password !== confirmPassword) return false;
    return true;
  }, [password, confirmPassword]);

  if (!token || !email) {
    return (
      <div
        className="w-full max-w-sm space-y-6 rounded-xl p-8"
        style={{
          background: "var(--db-card)",
          border: "1px solid var(--db-border)",
          boxShadow: "var(--db-card-shadow)",
        }}
      >
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}
        >
          Invalid reset link. Please request a new one.
        </div>
        <div className="text-center">
          <Link
            href="/dashboard/forgot-password"
            className="text-sm font-medium"
            style={{ color: "var(--db-accent)" }}
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/dashboard/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });

      if (res.ok) {
        router.push("/dashboard/login?msg=password_updated");
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
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
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-body), system-ui, sans-serif", color: "var(--db-text)" }}
        >
          Set New Password
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          Choose a strong password for your account
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--db-text-secondary)" }}
          >
            New Password
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
              placeholder="Min 8 characters"
              autoFocus
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
          <div className="mt-2">
            <PasswordStrengthBar password={password} />
          </div>
        </div>

        <div>
          <label
            htmlFor="confirm"
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--db-text-secondary)" }}
          >
            Confirm Password
          </label>
          <input
            id="confirm"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
            style={{
              background: "var(--db-surface)",
              border: `1px solid ${confirmPassword && confirmPassword !== password ? "var(--db-danger)" : "var(--db-border)"}`,
              color: "var(--db-text)",
            }}
            placeholder="Re-enter your password"
            required
          />
          {confirmPassword && confirmPassword !== password && (
            <p className="mt-1 text-xs" style={{ color: "var(--db-danger)" }}>Passwords don&apos;t match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !isValid}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ background: "var(--db-accent)" }}
          onMouseEnter={(e) => {
            if (!loading && isValid) e.currentTarget.style.background = "var(--db-accent-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--db-accent)";
          }}
        >
          {loading ? "Updating..." : "Reset Password"}
        </button>
      </form>

      <div className="text-center">
        <Link
          href="/dashboard/login"
          className="text-sm font-medium transition-colors"
          style={{ color: "var(--db-accent)" }}
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
