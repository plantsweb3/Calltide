"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      className="grain-overlay"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(197,154,39,0.06) 0%, transparent 70%), #0B0F19",
        fontFamily: "var(--font-body, system-ui), sans-serif",
      }}
    >
      <div style={{ textAlign: "center", padding: "2rem", position: "relative", zIndex: 2 }}>
        {/* Branded alert triangle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "1rem",
              background: "rgba(197,154,39,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        <h1 style={{ color: "#f1f5f9", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
          Something went wrong
        </h1>
        <p style={{ marginTop: "0.5rem", color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
          {error.message || "An unexpected error occurred"}
        </p>
        {error.digest && (
          <p style={{ marginTop: "0.375rem", color: "#64748b", fontSize: "0.75rem", fontFamily: "monospace" }}>
            Error ID: {error.digest}
          </p>
        )}
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={reset}
            className="cta-gold"
            style={{
              padding: "0.625rem 1.5rem",
              borderRadius: "0.5rem",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              color: "#fff",
            }}
          >
            Try Again
          </button>
          <a
            href="/"
            style={{
              padding: "0.625rem 1.5rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "#94a3b8",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
              transition: "border-color 0.2s, color 0.2s",
            }}
          >
            Go Home
          </a>
          <a
            href="mailto:hello@captahq.com?subject=Error Report&body=Error ID: ${error.digest || 'N/A'}"
            style={{
              padding: "0.625rem 1.5rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "#94a3b8",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
              transition: "border-color 0.2s, color 0.2s",
            }}
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
