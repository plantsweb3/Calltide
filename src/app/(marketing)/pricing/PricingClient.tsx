"use client";

import { useState, useEffect } from "react";
import { PHONE, PHONE_TEL, BOOKING_URL } from "@/lib/marketing/translations";
import { useScrollReveal } from "@/lib/marketing/hooks";
import { SignupForm } from "@/components/marketing/SignupForm";
import { trackViewContent } from "@/lib/tracking";

const FEATURES_COL1 = [
  "Unlimited calls — English & Spanish",
  "AI job intake & detail collection",
  "AI estimate generation",
  "Job cards + photo intake",
  "Owner response loop (one-tap approve)",
  "Missed call recovery SMS",
  "Appointment booking + management",
  "SMS confirmations + reminders",
  "Emergency detection + live transfer",
  "After-hours intelligent routing",
  "Returning caller recognition",
  "Auto-populated CRM",
  "Estimate pipeline tracking",
  "Call recordings + transcripts",
  "AI-powered call summaries",
];

const FEATURES_COL2 = [
  "Estimate follow-up automation",
  "Customer recall & reactivation",
  "Google review requests",
  "Weekly digest",
  "CSV import",
  "Multi-location support",
  "Personality customization",
  "Partner referral network",
  "Outbound call automation",
  "Referral program ($497 credit)",
  "Full dashboard + analytics",
  "Status page + incident engine",
  "Billing portal (Stripe)",
  "Magic link auth (passwordless)",
  "GDPR/CCPA/TCPA compliant",
];

const SOFTWARE_COSTS = [
  { name: "Answering service", cost: "$700–$1,600/mo" },
  { name: "CRM", cost: "$50–$150/mo" },
  { name: "Estimating tool", cost: "$50–$200/mo" },
  { name: "Follow-up automation", cost: "$100–$300/mo" },
  { name: "Review management", cost: "$50–$100/mo" },
];

const FAQS = [
  {
    q: "Is there a contract?",
    a: "No. Month-to-month. Cancel anytime. Annual plan available at $4,764/year (save $1,200).",
  },
  {
    q: "Are there any extra fees?",
    a: "No. Unlimited calls, unlimited features. $497/month covers everything.",
  },
  {
    q: "What if I need help setting up?",
    a: "We walk you through everything. Most businesses are live in 24 hours.",
  },
  {
    q: "Can Maria generate estimates?",
    a: "Yes. She collects job details during the call, generates a price range based on your pricing rules, and texts it to you for one-tap approval before sending it to the customer.",
  },
  {
    q: "What's included that I'd normally need separate software for?",
    a: "Answering service, CRM, estimating tool, follow-up automation, review management, appointment booking, and analytics. Calltide replaces $950–$2,350/month in separate software subscriptions.",
  },
];

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
      <path d="M5 10.5L8.5 14L15 6.5" stroke="#d4a843" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {FAQS.map((faq, i) => (
        <div
          key={i}
          className="rounded-xl border transition-colors"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: open === i ? "rgba(212,168,67,0.3)" : "rgba(255,255,255,0.08)",
          }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between px-6 py-5 text-left"
          >
            <span className="text-[15px] font-semibold text-white">{faq.q}</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="shrink-0 transition-transform duration-200"
              style={{ transform: open === i ? "rotate(180deg)" : "rotate(0)" }}
            >
              <path d="M5 7.5L10 12.5L15 7.5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {open === i && (
            <div className="px-6 pb-5">
              <p className="text-[15px] leading-relaxed text-slate-400">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PricingClient() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  useScrollReveal();

  useEffect(() => {
    trackViewContent("pricing");
  }, []);

  const isAnnual = billing === "annual";

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 sm:px-8 pt-24 pb-8 sm:pt-32 sm:pb-12" style={{ background: "#0f1729" }}>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-[36px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[52px]" style={{ fontFamily: "Inter, sans-serif" }}>
            One Plan. Everything Included.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
            No tiers. No upsells. No hidden fees. Just Maria, answering your phone.
          </p>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="relative px-6 sm:px-8 pt-8 pb-24 sm:pt-12 sm:pb-32" style={{ background: "#0f1729" }}>
        <div className="mx-auto max-w-3xl">
          {/* Monthly / Annual toggle */}
          <div className="reveal flex items-center justify-center gap-3 mb-10">
            <span className={`text-sm font-medium transition-colors ${!isAnnual ? "text-white" : "text-slate-500"}`}>Monthly</span>
            <button
              onClick={() => setBilling(isAnnual ? "monthly" : "annual")}
              className="relative h-7 w-[52px] rounded-full transition-colors"
              style={{ background: isAnnual ? "#d4a843" : "rgba(255,255,255,0.15)" }}
              aria-label="Toggle annual billing"
            >
              <span
                className="absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-transform duration-200"
                style={{ left: isAnnual ? "27px" : "3px" }}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${isAnnual ? "text-white" : "text-slate-500"}`}>Annual</span>
            {isAnnual && (
              <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}>
                Save $994/year
              </span>
            )}
          </div>

          {/* The card */}
          <div
            className="reveal pricing-card relative mx-auto max-w-2xl rounded-2xl p-8 sm:p-12"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 0 60px rgba(212,168,67,0.06), 0 16px 48px rgba(0,0,0,0.4)",
            }}
          >
            {/* Price */}
            <div className="text-center">
              {isAnnual ? (
                <>
                  <div className="flex items-baseline justify-center gap-3">
                    <span className="text-2xl font-bold text-slate-500 line-through">$497</span>
                    <span className="text-[64px] font-extrabold tracking-tight text-white sm:text-[72px]">$397</span>
                    <span className="text-xl text-slate-400">/mo</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">Billed annually at $4,764</p>
                </>
              ) : (
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-[64px] font-extrabold tracking-tight text-white sm:text-[72px]">$497</span>
                  <span className="text-xl text-slate-400">/month</span>
                </div>
              )}

              <p className="mt-4 text-base text-slate-400">
                Your complete AI front office — fully loaded
              </p>
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
              <a
                href={BOOKING_URL}
                className="cta-gold cta-shimmer inline-flex items-center justify-center gap-2 rounded-xl px-10 py-4 text-lg font-semibold text-white"
              >
                Get Calltide &rarr;
              </a>
            </div>

            {/* Divider */}
            <div className="my-10" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

            {/* Feature grid */}
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <div className="space-y-3">
                {FEATURES_COL1.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check />
                    <span className="text-[14px] leading-snug text-slate-300">{f}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3 mt-3 sm:mt-0">
                {FEATURES_COL2.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check />
                    <span className="text-[14px] leading-snug text-slate-300">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card hover glow effect via CSS */}
            <style jsx>{`
              .pricing-card {
                transition: border-color 0.3s ease, box-shadow 0.3s ease;
              }
              .pricing-card:hover {
                border-color: rgba(212, 168, 67, 0.25);
                box-shadow: 0 0 80px rgba(212, 168, 67, 0.1), 0 16px 48px rgba(0, 0, 0, 0.4);
              }
            `}</style>
          </div>
        </div>
      </section>

      {/* Price Anchoring */}
      <section className="px-6 sm:px-8 py-20 sm:py-28" style={{ background: "#0f1729" }}>
        <div className="reveal mx-auto max-w-2xl text-center space-y-5">
          <p className="text-lg text-slate-400">
            A bilingual receptionist costs <span className="font-semibold text-white">$3,000–$4,000/month</span>.
          </p>
          <p className="text-lg text-slate-400">
            An answering service costs <span className="font-semibold text-white">$700–$1,600/month</span>.
          </p>
          <p className="text-lg text-slate-400">
            Maria costs <span className="font-semibold text-white">$497/month</span>. And she never calls in sick.
          </p>
        </div>
      </section>

      {/* Software Cost Anchoring */}
      <section className="px-6 sm:px-8 py-20 sm:py-28" style={{ background: "#111a2e" }}>
        <div className="reveal mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl mb-10">
            Software Calltide Replaces
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SOFTWARE_COSTS.map((item) => (
              <div
                key={item.name}
                className="rounded-xl px-5 py-4 text-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p className="text-sm font-medium text-slate-400">{item.name}</p>
                <p className="mt-1 text-lg font-extrabold text-white">{item.cost}</p>
              </div>
            ))}
            <div
              className="rounded-xl px-5 py-4 text-center sm:col-span-2 lg:col-span-3"
              style={{
                background: "rgba(212,168,67,0.08)",
                border: "1px solid rgba(212,168,67,0.2)",
              }}
            >
              <p className="text-sm font-medium text-slate-400">Total: $950–$2,350/mo</p>
              <p className="mt-1 text-lg font-extrabold" style={{ color: "#d4a843" }}>Or get all of it for $497/month.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Statement */}
      <section className="px-6 sm:px-8 py-16 sm:py-20" style={{ background: "#111a2e" }}>
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Maria pays for herself after just 2 answered calls.
          </p>
          <p className="mt-5 text-base text-slate-400">
            Or call her yourself:{" "}
            <a href={PHONE_TEL} className="font-semibold transition hover:underline" style={{ color: "#d4a843" }}>
              {PHONE}
            </a>
          </p>
        </div>
      </section>

      {/* Guarantee */}
      <section className="px-6 sm:px-8 py-20 sm:py-28" style={{ background: "#0f1729" }}>
        <div className="reveal mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            30-Day Money-Back Guarantee
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-slate-400">
            If Maria doesn&apos;t pay for herself in missed-call revenue within 30 days, you pay nothing.
          </p>

          {/* Trust icons */}
          <div className="mt-10 flex items-center justify-center gap-10">
            {/* Lock — Secure */}
            <div className="flex flex-col items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-xs text-slate-500">Secure</span>
            </div>
            {/* Shield — Compliant */}
            <div className="flex flex-col items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span className="text-xs text-slate-500">Compliant</span>
            </div>
            {/* Clock — 24/7 */}
            <div className="flex flex-col items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-xs text-slate-500">24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 sm:px-8 py-20 sm:py-28" style={{ background: "#0f1729" }}>
        <div className="mx-auto max-w-2xl">
          <h2 className="reveal text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl mb-10">
            Frequently Asked Questions
          </h2>
          <div className="reveal">
            <FAQAccordion />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="signup" className="relative px-6 sm:px-8 py-24 sm:py-32 overflow-hidden" style={{ background: "#111a2e" }}>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="reveal text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[40px]">
            Stop missing calls. Start today.
          </h2>
          <SignupForm lang="en" plan={billing} />
          <p className="mt-6 text-sm text-slate-500">Free for 14 days. Cancel anytime. No contracts.</p>
          <p className="mt-4 text-sm text-slate-500">
            Or call us:{" "}
            <a href={PHONE_TEL} className="font-semibold transition hover:underline" style={{ color: "#d4a843" }}>
              {PHONE}
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
