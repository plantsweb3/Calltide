"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

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
    <div className="w-full max-w-sm space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Client Portal</h1>
        <p className="mt-1 text-sm text-slate-400">
          {success
            ? "Check your email for a login link"
            : "Enter your email to sign in"}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success ? (
        <div className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
          We sent a login link to <strong>{email}</strong>. It expires in 15 minutes.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              placeholder="you@business.com"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Sending..." : "Send Login Link"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
