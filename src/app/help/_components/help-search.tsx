"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CaptaSpinnerInline } from "@/components/capta-spinner";

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  titleEs: string | null;
  excerpt: string | null;
  excerptEs: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  readingTimeMinutes: number | null;
}

export default function HelpSearch({ lang = "en" }: { lang?: "en" | "es" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/help/search?q=${encodeURIComponent(value)}&lang=${lang}&limit=6`);
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }

  const prefix = lang === "es" ? "/es/help" : "/help";

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-xl">
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2"
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={lang === "es" ? "Buscar artículos de ayuda..." : "Search help articles..."}
          className="w-full rounded-xl border-0 py-3.5 pl-12 pr-4 text-sm shadow-lg outline-none"
          style={{ background: "white", color: "#1A1D24" }}
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "#C59A27" }}><CaptaSpinnerInline size={16} /></span>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute z-50 mt-2 w-full rounded-xl border shadow-xl overflow-hidden"
          style={{ background: "white", borderColor: "#E2E8F0" }}
        >
          {results.map((r) => (
            <Link
              key={r.id}
              href={`${prefix}/${r.categorySlug}/${r.slug}`}
              className="block px-4 py-3 transition-colors hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              <p className="text-sm font-medium" style={{ color: "#1A1D24" }}>
                {lang === "es" && r.titleEs ? r.titleEs : r.title}
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: "#94A3B8" }}>
                <span>{r.categoryName}</span>
                {r.readingTimeMinutes && <span>{r.readingTimeMinutes} min</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div
          className="absolute z-50 mt-2 w-full rounded-xl border p-4 text-center text-sm shadow-xl"
          style={{ background: "white", borderColor: "#E2E8F0", color: "#475569" }}
        >
          {lang === "es" ? "No se encontraron resultados" : "No results found"}
        </div>
      )}
    </div>
  );
}
