"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      const data = await res.json();
      setError(data.error || "Login failed");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--db-bg, #111827)" }}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-2xl p-8"
        style={{ background: "var(--db-card, #1A1D24)", border: "1px solid var(--db-border, #2D3748)" }}
      >
        <div>
          <img src="/images/logo-inline-white.webp" alt="Capta" className="h-8 w-auto mb-4" />
          <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text, #f1f5f9)" }}>Admin Panel</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted, #94A3B8)" }}>Enter your password to continue</p>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}>
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className="db-label text-sm" style={{ color: "var(--db-text-secondary, #CBD5E1)" }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="db-input py-2.5"
            placeholder="Enter password"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading || !password}
          className="db-btn w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none transition-colors"
          data-variant="primary"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Signing in...
            </span>
          ) : "Sign In"}
        </button>
      </form>
    </div>
  );
}
