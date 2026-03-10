"use client";

import { useState } from "react";
import AdminNav from "../_components/admin-nav";
import ErrorBoundary from "@/components/error-boundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <AdminNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile header */}
      <div
        className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center px-4 backdrop-blur-sm lg:hidden"
        style={{
          background: "color-mix(in srgb, var(--db-surface) 90%, transparent)",
          borderBottom: "1px solid var(--db-border)",
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 transition-colors"
          style={{ color: "var(--db-text-secondary)" }}
          aria-label="Open menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <img src="/images/logo-inline-navy.webp" alt="Capta" className="ml-3 h-6 w-auto" />
      </div>

      <main
        className="min-w-0 flex-1 p-4 pt-18 lg:ml-60 lg:p-6 lg:pt-6"
        style={{ background: "var(--db-bg)" }}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}
