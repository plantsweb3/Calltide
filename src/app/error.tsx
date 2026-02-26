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
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h1 style={{ color: "#f1f5f9", fontSize: "1.5rem", fontWeight: 600 }}>
          Something went wrong
        </h1>
        <p style={{ marginTop: "0.5rem", color: "#94a3b8", fontSize: "0.875rem" }}>
          {error.message || "An unexpected error occurred"}
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            padding: "0.625rem 1.5rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "#C59A27",
            color: "#fff",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
