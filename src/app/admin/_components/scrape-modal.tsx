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
      setTimeout(() => {
        onComplete();
        onClose();
      }, 2000);
    } else {
      setError(data.error || "Scrape failed");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Scrape New Prospects</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-green-500"
              placeholder="e.g. San Antonio"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-green-500"
              placeholder="e.g. TX"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">Vertical</label>
            <select
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-green-500"
            >
              {VERTICALS.map((v) => (
                <option key={v} value={v}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">
              Max Results
            </label>
            <input
              type="number"
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-green-500"
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
            <div className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
              Found {result.total} places. Inserted: {result.inserted}, Skipped:{" "}
              {result.skipped}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !city}
            className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "Scraping..." : "Start Scrape"}
          </button>
        </form>
      </div>
    </div>
  );
}
