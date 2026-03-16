"use client";

import { useState } from "react";

const VERTICALS = [
  "plumbing",
  "hvac",
  "electrician",
  "dental",
  "salon",
  "barbershop",
  "auto repair",
  "veterinary",
  "chiropractic",
  "landscaping",
  "roofing",
  "pest control",
  "cleaning",
  "restaurant",
];

export default function ScrapeModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: () => void;
}) {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [vertical, setVertical] = useState(VERTICALS[0]);
  const [maxResults, setMaxResults] = useState(60);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    inserted: number;
    skipped: number;
  } | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const res = await fetch("/api/scrape/city", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city, state, vertical, maxResults }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setResult(data);
      onComplete();
      // Don't auto-close — let user scrape another vertical/city
    } else {
      setError(data.error || "Scrape failed");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scrape-modal-title"
    >
      <div
        className="w-full max-w-md rounded-xl p-6"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 id="scrape-modal-title" className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>Scrape New Prospects</h2>
          <button
            onClick={onClose}
            className="text-lg transition-colors"
            style={{ color: "var(--db-text-muted)" }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--db-text-muted)" }}>City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
              style={{ borderColor: "var(--db-border)", background: "var(--db-surface)", color: "var(--db-text)" }}
              placeholder="e.g. San Antonio"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--db-text-muted)" }}>State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
              style={{ borderColor: "var(--db-border)", background: "var(--db-surface)", color: "var(--db-text)" }}
              placeholder="e.g. TX"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--db-text-muted)" }}>Vertical</label>
            <select
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
              style={{ borderColor: "var(--db-border)", background: "var(--db-surface)", color: "var(--db-text)" }}
            >
              {VERTICALS.map((v) => (
                <option key={v} value={v}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--db-text-muted)" }}>
              Max Results
            </label>
            <input
              type="number"
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value, 10))}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
              style={{ borderColor: "var(--db-border)", background: "var(--db-surface)", color: "var(--db-text)" }}
              min={1}
              max={200}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-2">
              <div className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
                Found {result.total} places. Inserted: {result.inserted}, Skipped:{" "}
                {result.skipped} (duplicates)
              </div>
              {result.skipped > 0 && (
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                  Skipped leads already exist in your database. To get more leads, try a different vertical or nearby city — Google caps results at ~60 per search.
                </p>
              )}
              {result.inserted < 50 && (
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                  Tip: Scrape 2-3 verticals in the same city to hit 100+ leads (e.g. plumbing + HVAC + electrician).
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !city}
              className="cta-gold flex-1 rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors"
            >
              {loading ? "Scraping..." : result ? "Scrape Another" : "Start Scrape"}
            </button>
            {result && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                style={{ border: "1px solid var(--db-border)", color: "var(--db-text-muted)" }}
              >
                Done
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
