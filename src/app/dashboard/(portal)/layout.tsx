"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import ClientNav from "../_components/client-nav";
import HelpWidget from "../_components/help-widget";
import PaymentBanner from "../_components/payment-banner";
import ErrorBoundary from "@/components/error-boundary";
import LegalReacceptanceModal from "../_components/legal-reacceptance";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check session validity (password change invalidation)
    let cancelled = false;
    async function checkSession() {
      try {
        const res = await fetch("/api/dashboard/session");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && !data.valid && data.reason === "password_changed") {
            router.replace("/dashboard/login?error=session_expired");
            return;
          }
        }
      } catch {
        // On error, allow access
      }
    }
    checkSession();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    // Skip redirect check for settings page (allow access during onboarding)
    if (pathname === "/dashboard/settings") {
      setOnboardingChecked(true);
      return;
    }

    let cancelled = false;
    async function checkOnboarding() {
      try {
        const res = await fetch("/api/dashboard/onboarding");
        if (!res.ok) {
          setOnboardingChecked(true);
          return;
        }
        const data = await res.json();
        if (!cancelled && !data.onboardingCompletedAt) {
          router.replace("/dashboard/onboarding");
          return;
        }
      } catch {
        // On error, allow access
      }
      if (!cancelled) setOnboardingChecked(true);
    }
    checkOnboarding();
    return () => { cancelled = true; };
  }, [router, pathname]);

  if (!onboardingChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--db-bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--db-border)", borderTopColor: "var(--db-accent)" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <ClientNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile header */}
      <div
        className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center px-4 backdrop-blur-sm md:hidden"
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
        <span
          className="ml-3 text-lg font-bold"
          style={{ color: "var(--db-accent)" }}
        >
          Calltide
        </span>
      </div>

      <main
        className="min-w-0 flex-1 p-4 pt-18 md:ml-60 md:p-6 md:pt-6"
      >
        <PaymentBanner />
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      <HelpWidget />
      <LegalReacceptanceModal />
    </div>
  );
}
