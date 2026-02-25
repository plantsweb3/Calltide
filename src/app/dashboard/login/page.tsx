"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("error") === "invalid") {
      setError("Login link expired or invalid. Please try again.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/dashboard/auth/send-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setSuccess(true);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
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
          style={{ fontFamily: "var(--font-serif), serif", color: "var(--db-text)" }}
        >
          Client Portal
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          {success
            ? "Check your email for a login link"
            : "Enter your email to sign in"}
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

      {success ? (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}
        >
          We sent a login link to <strong>{email}</strong>. It expires in 15 minutes.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              background: "var(--db-accent)",
            }}
            onMouseEnter={(e) => {
              if (!loading && email) e.currentTarget.style.background = "var(--db-accent-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--db-accent)";
            }}
          >
            {loading ? "Sending..." : "Send Login Link"}
          </button>
        </form>
      )}

      <div
        className="pt-2 text-center"
        style={{ borderTop: "1px solid var(--db-border)" }}
      >
        <Link
          href="/api/dashboard/auth/demo"
          className="text-sm font-medium transition-colors"
          style={{ color: "var(--db-accent)" }}
        >
          Try Demo
        </Link>
        <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
          Explore the portal with sample data
        </p>
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
