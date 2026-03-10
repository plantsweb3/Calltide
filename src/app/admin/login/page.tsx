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
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#111827" }}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-xl border p-8"
        style={{ background: "#1A1D24", borderColor: "#2D3748" }}
      >
        <div>
          <img src="/images/logo-inline-white.webp" alt="Capta" className="h-8 w-auto mb-4" />
          <h1 className="text-2xl font-semibold text-white">Admin Panel</h1>
          <p className="mt-1 text-sm" style={{ color: "#94A3B8" }}>Enter your password to continue</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium" style={{ color: "#CBD5E1" }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors"
            style={{ background: "#111827", borderColor: "#2D3748" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#C59A27"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#2D3748"; }}
            placeholder="Enter password"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ background: "#C59A27" }}
          onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = "#D6A846"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "#C59A27"; }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
