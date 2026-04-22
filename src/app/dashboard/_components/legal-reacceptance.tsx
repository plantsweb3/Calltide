"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

interface PendingDoc {
  documentType: string;
  title: string;
  version: string;
  changeSummary: string | null;
}

export default function LegalReacceptanceModal() {
  const [lang] = useLang();
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/dashboard/legal/check");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.pendingDocs?.length > 0) {
          setPendingDocs(data.pendingDocs);
        }
      } catch {
        // Silently fail — don't block the dashboard
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  if (pendingDocs.length === 0) return null;

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/legal/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentTypes: pendingDocs.map((d) => d.documentType),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t("error.failedToAccept", lang));
        return;
      }
      setPendingDocs([]);
    } catch {
      setError(t("error.networkError", lang));
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="mx-4 w-full max-w-lg rounded-[4px] border p-6 shadow-xl"
        style={{ background: "var(--db-surface)", borderColor: "var(--db-border)" }}
      >
        <div className="mb-4 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
            <path
              d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 6h2v5H9V6zm0 7h2v2H9v-2z"
              fill="var(--db-accent)"
            />
          </svg>
          <h2 className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
            {t("legal.updatedTerms", lang)}
          </h2>
        </div>

        <p className="mb-4 text-sm" style={{ color: "var(--db-text-secondary)" }}>
          {t("legal.updatedTermsDescription", lang)}
        </p>

        <div className="mb-4 space-y-3">
          {pendingDocs.map((doc) => (
            <div
              key={doc.documentType}
              className="rounded-lg border p-3"
              style={{ borderColor: "var(--db-border)", background: "var(--db-bg)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                  {doc.title}
                </span>
                <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                  v{doc.version}
                </span>
              </div>
              {doc.changeSummary && (
                <p className="mt-1 text-xs" style={{ color: "var(--db-text-secondary)" }}>
                  {doc.changeSummary}
                </p>
              )}
              <a
                href={`/legal/${doc.documentType === "privacy_policy" ? "privacy" : doc.documentType === "tos" ? "terms" : doc.documentType}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs font-medium hover:underline"
                style={{ color: "var(--db-accent)" }}
              >
                {t("legal.readFullDocument", lang)}
              </a>
            </div>
          ))}
        </div>

        {error && (
          <p className="mb-3 text-xs text-red-500">{error}</p>
        )}

        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: "var(--db-accent)" }}
        >
          {accepting ? t("legal.accepting", lang) : t("legal.acceptUpdatedTerms", lang)}
        </button>
      </div>
    </div>
  );
}
