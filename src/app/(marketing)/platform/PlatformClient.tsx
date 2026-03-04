"use client";

import { useState } from "react";
import { PHONE, PHONE_TEL, BOOKING_URL } from "@/lib/marketing/translations";
import { useScrollReveal } from "@/lib/marketing/hooks";

/* ── Lucide-style SVG icons ── */
const icons = {
  phone: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.81.36 1.6.7 2.35a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.75.34 1.54.57 2.35.7A2 2 0 0122 16.92z" /></svg>
  ),
  globe: (p: IconProps) => (
    <svg {...svgProps(p)}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
  ),
  alert: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  ),
  moon: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
  ),
  mic: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
  ),
  userCheck: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>
  ),
  smile: (p: IconProps) => (
    <svg {...svgProps(p)}><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
  ),
  fileText: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
  ),
  calendar: (p: IconProps) => (
    <svg {...svgProps(p)}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
  ),
  message: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
  ),
  bell: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
  ),
  users: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
  ),
  kanban: (p: IconProps) => (
    <svg {...svgProps(p)}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 7v4" /><path d="M12 7v8" /><path d="M16 7v2" /></svg>
  ),
  barChart: (p: IconProps) => (
    <svg {...svgProps(p)}><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>
  ),
  brain: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96.44A2.5 2.5 0 015 17.5a2.5 2.5 0 01.49-4.89A2.5 2.5 0 014.5 9a2.5 2.5 0 012-4.45A2.5 2.5 0 019.5 2z" /><path d="M14.5 2A2.5 2.5 0 0012 4.5v15a2.5 2.5 0 004.96.44A2.5 2.5 0 0019 17.5a2.5 2.5 0 00-.49-4.89A2.5 2.5 0 0019.5 9a2.5 2.5 0 00-2-4.45A2.5 2.5 0 0014.5 2z" /></svg>
  ),
  star: (p: IconProps) => (
    <svg {...svgProps(p)}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
  ),
  layout: (p: IconProps) => (
    <svg {...svgProps(p)}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
  ),
  creditCard: (p: IconProps) => (
    <svg {...svgProps(p)}><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
  ),
  refresh: (p: IconProps) => (
    <svg {...svgProps(p)}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>
  ),
  gift: (p: IconProps) => (
    <svg {...svgProps(p)}><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" /></svg>
  ),
  helpCircle: (p: IconProps) => (
    <svg {...svgProps(p)}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  ),
  activity: (p: IconProps) => (
    <svg {...svgProps(p)}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
  ),
  shield: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
  ),
  lock: (p: IconProps) => (
    <svg {...svgProps(p)}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
  ),
  key: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
  ),
  link: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
  ),
};

type IconProps = { size?: number; className?: string };
function svgProps({ size = 24, className = "" }: IconProps) {
  return { className, width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
}

/* ── Feature categories ── */
const CATEGORIES = [
  {
    id: "calls",
    label: "Calls & Voice",
    icon: icons.phone,
    features: [
      { icon: icons.phone, title: "24/7 Bilingual Answering", desc: "Every call answered in English or Spanish. Auto-detects the caller's language — no phone menus, no press-1-for-English." },
      { icon: icons.userCheck, title: "Returning Caller Recognition", desc: "Recognizes repeat callers automatically. Greets them by context and picks up where the last conversation left off." },
      { icon: icons.alert, title: "Emergency Detection + Live Transfer", desc: "Detects emergency keywords like 'gas leak' or 'flooding' and immediately transfers the call to your emergency number." },
      { icon: icons.moon, title: "After-Hours Intelligent Routing", desc: "Different behavior for business hours vs. nights and weekends. Takes messages, books next-day appointments, or transfers urgencies." },
      { icon: icons.smile, title: "Custom Greetings & Personality", desc: "Name her, choose her personality (friendly, professional, warm), set preferred phrases, and define off-limits topics." },
      { icon: icons.fileText, title: "Recordings + Transcripts", desc: "Full audio recording and AI-generated transcript for every call. Searchable, filterable, and exportable from your dashboard." },
    ],
  },
  {
    id: "scheduling",
    label: "Scheduling",
    icon: icons.calendar,
    features: [
      { icon: icons.calendar, title: "Google Calendar Sync", desc: "Connects to your Google Calendar. Maria checks availability in real-time and books appointments without double-booking." },
      { icon: icons.mic, title: "Voice Booking", desc: "Callers book appointments naturally through conversation — no app downloads, no online forms, no hold music." },
      { icon: icons.message, title: "SMS Confirmations", desc: "Instant text confirmation sent to the caller with appointment details, your business info, and the service address." },
      { icon: icons.bell, title: "Appointment Reminders", desc: "Automated outbound reminders reduce no-shows. Sent via SMS at configurable intervals before the appointment." },
    ],
  },
  {
    id: "tools",
    label: "Business Tools",
    icon: icons.kanban,
    features: [
      { icon: icons.users, title: "Auto-Populated CRM", desc: "Every caller becomes a customer record automatically. Phone, name, call history, appointments, and notes — all in one place." },
      { icon: icons.kanban, title: "Estimate Pipeline (Kanban)", desc: "Track estimates from request to signed. Drag-and-drop Kanban board built for service businesses." },
      { icon: icons.barChart, title: "QA Scoring + Sentiment Analysis", desc: "Every call gets an AI quality score and sentiment rating. Spot trends, identify training opportunities, and track satisfaction." },
      { icon: icons.brain, title: "AI-Powered Call Summaries", desc: "Claude AI reads the transcript and generates a concise summary with action items. Know what happened without listening to the call." },
      { icon: icons.star, title: "NPS Surveys with Auto-Actions", desc: "Automated Net Promoter Score surveys after calls. Detractors get flagged, promoters get referral invitations." },
    ],
  },
  {
    id: "ops",
    label: "Operations",
    icon: icons.layout,
    features: [
      { icon: icons.layout, title: "Dashboard + Analytics", desc: "Real-time metrics: calls answered, appointments booked, revenue recovered, response times, and trends over time." },
      { icon: icons.creditCard, title: "Stripe Billing", desc: "Integrated payment processing via Stripe. Subscription management, billing portal, and automatic invoicing." },
      { icon: icons.refresh, title: "Payment Recovery (Dunning)", desc: "Automated dunning sequences recover failed payments. Email, SMS, and grace periods before any service interruption." },
      { icon: icons.gift, title: "Referral Program ($497 Credit)", desc: "Refer another business and earn a full month free ($497 credit). They get 50% off their first month." },
      { icon: icons.helpCircle, title: "Bilingual Help Center", desc: "28+ help articles in English and Spanish. Searchable, categorized, and accessible from the dashboard." },
      { icon: icons.activity, title: "Status Page + Incident Engine", desc: "Public status page shows real-time service health. Automatic incident detection, escalation, and postmortem generation." },
    ],
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: icons.shield,
    features: [
      { icon: icons.shield, title: "GDPR / CCPA / TCPA Compliant", desc: "Full regulatory compliance out of the box. Consent tracking, data retention policies, and opt-out handling." },
      { icon: icons.mic, title: "Recording Disclosure", desc: "Automatic recording disclosure at the start of every call, configurable per jurisdiction. Full audit trail." },
      { icon: icons.fileText, title: "DSAR (Data Subject Access Requests)", desc: "Built-in workflow for handling data access and deletion requests. Respond within regulatory timelines." },
      { icon: icons.key, title: "Magic Link Auth (Passwordless)", desc: "No passwords to remember or steal. Secure magic link login via email with single-use tokens and expiry." },
      { icon: icons.link, title: "Webhook Verification", desc: "HMAC-SHA256 signature verification on all inbound webhooks. No unsigned requests reach your business data." },
    ],
  },
];

export default function PlatformClient() {
  const [activeTab, setActiveTab] = useState("calls");
  useScrollReveal();

  const activeCategory = CATEGORIES.find((c) => c.id === activeTab) ?? CATEGORIES[0];

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 sm:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16" style={{ background: "#0f1729" }}>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">Platform</p>
          <h1 className="mt-4 text-[36px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[52px]">
            The Complete AI Receptionist Platform
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
            Everything you need to never miss a call again — in one place.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-6 sm:px-8 pb-24 sm:pb-32" style={{ background: "#0f1729" }}>
        <div className="mx-auto max-w-5xl">
          {/* Tab bar */}
          <div className="reveal flex flex-wrap items-center justify-center gap-2 mb-14">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.id === activeTab;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: isActive ? "rgba(212,168,67,0.15)" : "rgba(255,255,255,0.04)",
                    color: isActive ? "#d4a843" : "#94a3b8",
                    border: isActive ? "1px solid rgba(212,168,67,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Icon size={16} className={isActive ? "text-[#d4a843]" : "text-slate-500"} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Feature cards grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeCategory.features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={`${activeTab}-${i}`}
                  className="reveal rounded-xl p-8 transition-all duration-300"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "rgba(212,168,67,0.1)" }}>
                    <Icon size={20} className="text-[#d4a843]" />
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold tracking-tight text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Screenshot placeholder */}
          <div
            className="reveal mt-14 flex items-center justify-center rounded-2xl p-16"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}
          >
            <p className="text-sm text-slate-600">{/* Screenshot: {activeCategory.label} dashboard view */}Platform screenshot — {activeCategory.label}</p>
          </div>
        </div>
      </section>

      {/* Bottom CTAs */}
      <section className="px-6 sm:px-8 py-20 sm:py-28" style={{ background: "#111a2e" }}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="reveal text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            One plan. Every feature. $497/month.
          </h2>
          <p className="mt-4 text-base text-slate-400">
            No tiers, no upsells. Everything on this page is included.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="/pricing" className="rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:border-white/40">
              See Pricing &rarr;
            </a>
            <a href={BOOKING_URL} className="cta-gold cta-shimmer rounded-xl px-8 py-4 text-base font-semibold text-white">
              Get Calltide &rarr;
            </a>
          </div>
          <p className="mt-8 text-sm text-slate-500">
            Or call Maria:{" "}
            <a href={PHONE_TEL} className="font-semibold transition hover:underline" style={{ color: "#d4a843" }}>{PHONE}</a>
          </p>
        </div>
      </section>
    </>
  );
}
