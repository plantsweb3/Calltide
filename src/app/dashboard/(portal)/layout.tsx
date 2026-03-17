"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import ClientNav from "../_components/client-nav";
import HelpWidget from "../_components/help-widget";
import ChatWidget from "../_components/chat-widget";
import PaymentBanner from "../_components/payment-banner";
import ErrorBoundary from "@/components/error-boundary";
import CaptaSpinner from "@/components/capta-spinner";
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
        if (!cancelled && data.onboardingStatus !== "completed" && !data.onboardingCompletedAt) {
          const resumeStep = data.onboardingStep ?? 1;
          router.replace(`/dashboard/onboarding?step=${resumeStep}`);
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
          <CaptaSpinner size={32} />
          <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--db-bg)" }}>
      <ClientNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile header — dark to match sidebar */}
      <div
        className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center px-4 md:hidden"
        style={{
          background: "var(--sidebar-bg)",
          borderBottom: "1px solid var(--sidebar-border)",
        }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 transition-colors"
          style={{ color: "var(--sidebar-text)" }}
          aria-label="Open menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <img src="/images/logo-inline-white.webp" alt="Capta" className="ml-3 h-6 w-auto" />
      </div>

      <main className="min-w-0 flex-1 pt-[4.5rem] md:ml-60 md:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <PaymentBanner />
          <ErrorBoundary>
            <div className="page-enter">
              {children}
            </div>
          </ErrorBoundary>
        </div>
      </main>

      <ChatWidget />
      <HelpWidget />
      <LegalReacceptanceModal />
    </div>
  );
}
