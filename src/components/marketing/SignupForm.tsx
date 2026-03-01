"use client";

import { useState, useEffect } from "react";
import { T, type Lang } from "@/lib/marketing/translations";

export function SignupForm({ lang, plan = "monthly" }: { lang: Lang; plan?: "monthly" | "annual" }) {
  const t = T[lang].cta;
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exists, setExists] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setError(null);
    setExists(false);
    setLoading(true);

    try {
      const startRes = await fetch("/api/signup/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (startRes.status === 409) {
        setExists(true);
        setLoading(false);
        return;
      }

      if (!startRes.ok) {
        const data = await startRes.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong");
      }

      const checkoutRes = await fetch("/api/signup/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), plan }),
      });

      if (!checkoutRes.ok) {
        const data = await checkoutRes.json().catch(() => null);
        throw new Error(data?.error || "Failed to create checkout session");
      }

      const { url } = await checkoutRes.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => { setEmail(e.target.value); setExists(false); setError(null); }}
          placeholder={t.placeholder}
          className="flex-1 rounded-lg border border-white/20 bg-white/10 px-5 py-4 text-base text-white placeholder-white/40 backdrop-blur-sm focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
        />
        <button
          type="submit"
          disabled={loading}
          className="cta-gold cta-shimmer shrink-0 rounded-lg px-8 py-4 text-base font-semibold text-white disabled:opacity-50"
        >
          {loading ? t.sending : t.button}
        </button>
      </form>
      {exists && (
        <p className="mt-3 text-sm text-amber">
          {t.existsError}{" "}
          <a href="/dashboard/login" className="underline">{t.loginLink}</a>
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </>
  );
}

export function SignupStatus({ lang }: { lang: Lang }) {
  const [canceled, setCanceled] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("canceled=true")) {
      setCanceled(true);
    }
  }, []);

  if (!canceled) return null;

  return (
    <p className="mt-4 text-sm text-amber">
      {lang === "en" ? "Checkout was canceled. Try again when you're ready!" : "Se canceló el checkout. Intenta de nuevo cuando estés listo."}
    </p>
  );
}
