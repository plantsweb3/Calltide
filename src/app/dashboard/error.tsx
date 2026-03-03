"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function DashboardError({
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
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--db-bg)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "2rem",
          borderRadius: "0.75rem",
          background: "var(--db-card)",
          border: "1px solid var(--db-border)",
          maxWidth: "24rem",
        }}
      >
        <p style={{ color: "var(--db-text)", fontSize: "1.125rem", fontWeight: 600 }}>
          Something went wrong
        </p>
        <p style={{ marginTop: "0.5rem", color: "var(--db-text-muted)", fontSize: "0.875rem" }}>
          {error.message || "An unexpected error occurred"}
        </p>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              padding: "0.625rem 1.5rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "var(--db-accent)",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
          <a
            href="/dashboard/login"
            style={{
              padding: "0.625rem 1.5rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--db-border)",
              background: "transparent",
              color: "var(--db-text-muted)",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
