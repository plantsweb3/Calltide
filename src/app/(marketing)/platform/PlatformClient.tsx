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

/* ── Additional icons for new categories ── */
const iconPhoneMissed = (p: IconProps) => (
  <svg {...svgProps(p)}><line x1="1" y1="1" x2="5" y2="5" /><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.81.36 1.6.7 2.35a2 2 0 01-.45 2.11" /></svg>
);
const iconCalculator = (p: IconProps) => (
  <svg {...svgProps(p)}><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="8" y2="10.01" /><line x1="12" y1="10" x2="12" y2="10.01" /><line x1="16" y1="10" x2="16" y2="10.01" /><line x1="8" y1="14" x2="8" y2="14.01" /><line x1="12" y1="14" x2="12" y2="14.01" /><line x1="16" y1="14" x2="16" y2="14.01" /><line x1="8" y1="18" x2="16" y2="18" /></svg>
);
const iconCamera = (p: IconProps) => (
  <svg {...svgProps(p)}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
);
const iconSmartphone = (p: IconProps) => (
  <svg {...svgProps(p)}><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
);
const iconRefreshCw = (p: IconProps) => (
  <svg {...svgProps(p)}><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
);
const iconTrendingUp = (p: IconProps) => (
  <svg {...svgProps(p)}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
);
const iconMail = (p: IconProps) => (
  <svg {...svgProps(p)}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
);
const iconUpload = (p: IconProps) => (
  <svg {...svgProps(p)}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);
const iconPhoneOutgoing = (p: IconProps) => (
  <svg {...svgProps(p)}><polyline points="23 7 23 1 17 1" /><line x1="16" y1="8" x2="23" y2="1" /><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.81.36 1.6.7 2.35a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.75.34 1.54.57 2.35.7A2 2 0 0122 16.92z" /></svg>
);
const iconMapPin = (p: IconProps) => (
  <svg {...svgProps(p)}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
);

/* ── Trade example scenarios ── */
const TRADE_EXAMPLES = [
  { trade: "Plumbing", emoji: "🔧", scenario: "\"I've got water leaking from under the kitchen sink.\" Maria collects the address, asks for photos, generates a $250–$400 estimate for a supply line repair, and texts it to the owner for one-tap approval." },
  { trade: "HVAC", emoji: "❄️", scenario: "\"My AC stopped cooling and it's 95 degrees.\" Maria flags the urgency, collects the unit age and model, generates a diagnostic visit estimate, and books the next available slot on the owner's calendar." },
  { trade: "Electrical", emoji: "⚡", scenario: "\"Half my outlets stopped working after the storm.\" Maria asks about the panel and breaker status, generates an estimate for a circuit troubleshoot, and sends the owner a text with photos the caller took of the panel." },
  { trade: "Roofing", emoji: "🏠", scenario: "\"I've got a leak in my attic after the rain.\" Maria collects the roof age, damage area, and insurance info, generates an inspection estimate, and schedules a visit — all within the same call." },
];

/* ── Feature categories ── */
const CATEGORIES = [
  {
    id: "revenue",
    label: "Revenue Recovery",
    icon: iconPhoneMissed,
    features: [
      { icon: iconPhoneMissed, title: "Missed Call Recovery SMS", desc: "When a caller hangs up, Maria auto-texts them within 60 seconds to bring them back. Recovers jobs that would otherwise go to competitors." },
      { icon: icons.fileText, title: "AI Job Intake", desc: "Maria asks the right questions — problem type, property address, urgency, photos — and creates a complete job card automatically." },
      { icon: iconCalculator, title: "AI Estimate Generation", desc: "Based on job details and your pricing rules, Maria generates a price range on the call and texts it to the customer for review." },
      { icon: iconCamera, title: "Job Cards with Photo Intake", desc: "Callers text photos of the job site. Images attach to the job card alongside all details, giving you full context before arriving." },
      { icon: iconSmartphone, title: "Owner Response Loop", desc: "You get a text with the job summary and estimate. Approve, adjust, or decline with one tap — the customer is notified instantly." },
      { icon: iconRefreshCw, title: "Estimate Follow-Up Automation", desc: "Cold estimates get automatic follow-ups on a schedule you set. Maria re-engages leads that haven't responded." },
    ],
  },
  {
    id: "growth",
    label: "Growth & Automation",
    icon: iconTrendingUp,
    features: [
      { icon: iconRefreshCw, title: "Customer Recall", desc: "Automatically re-engage past customers for seasonal maintenance, annual inspections, or follow-up work. Turns one-time jobs into recurring revenue." },
      { icon: icons.star, title: "Google Review Requests", desc: "After a completed job, Maria texts the customer asking for a Google review. Builds your online reputation on autopilot." },
      { icon: iconMail, title: "Weekly Digest", desc: "Your dashboard shows a comprehensive weekly summary — calls, appointments, estimates, revenue recovered, and key metrics at a glance." },
      { icon: icons.users, title: "Partner Referral Network", desc: "Get referrals from other trades when they can't handle a job. A plumber refers HVAC leads, an electrician refers plumbing leads." },
      { icon: iconPhoneOutgoing, title: "Outbound Call Automation", desc: "Maria makes outbound calls for appointment confirmations, follow-ups, and customer re-engagement — not just inbound." },
    ],
  },
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
      { icon: icons.calendar, title: "Appointment Management", desc: "Maria books, reschedules, and cancels appointments through natural conversation. Your schedule stays organized without any manual entry." },
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
      { icon: icons.kanban, title: "Estimate Pipeline", desc: "Track every estimate from request to signed. See status, follow-up history, and close rates across all your jobs." },
      { icon: icons.brain, title: "AI-Powered Call Summaries", desc: "Claude AI reads the transcript and generates a concise summary with action items. Know what happened without listening to the call." },
      { icon: iconUpload, title: "CSV Import", desc: "Import your existing customer database from any CRM or spreadsheet. Calltide maps the fields and gives Maria full context from day one." },
    ],
  },
  {
    id: "ops",
    label: "Operations",
    icon: icons.layout,
    features: [
      { icon: icons.layout, title: "Dashboard + Analytics", desc: "Real-time metrics: calls answered, appointments booked, revenue recovered, response times, and trends over time." },
      { icon: icons.creditCard, title: "Subscription Management", desc: "View invoices, update your payment method, and manage your Calltide subscription — all from your dashboard." },
      { icon: icons.gift, title: "Referral Program ($497 Credit)", desc: "Refer another business and earn a full month free ($497 credit). They get 50% off their first month." },
      { icon: iconMapPin, title: "Multi-Location Support", desc: "Manage multiple business locations from one account. Each location gets its own number, settings, and reporting." },
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
      { icon: icons.key, title: "Magic Link Auth (Passwordless)", desc: "No passwords to remember or steal. Secure magic link login via email with single-use tokens and expiry." },
    ],
  },
];

export default function PlatformClient() {
  const [activeTab, setActiveTab] = useState("revenue");
  useScrollReveal();

  const activeCategory = CATEGORIES.find((c) => c.id === activeTab) ?? CATEGORIES[0];

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 sm:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16" style={{ background: "#0f1729" }}>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">Platform</p>
          <h1 className="mt-4 text-[36px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[52px]">
            The Complete AI Front Office
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
            Every feature you need to answer calls, generate estimates, recover missed calls, and grow your business.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-6 sm:px-8 pb-24 sm:pb-32" style={{ background: "#0f1729" }}>
        <div className="mx-auto max-w-5xl">
          {/* Tab bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-14">
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
                  className="rounded-xl p-8"
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
            className="mt-14 flex items-center justify-center rounded-2xl p-16"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}
          >
            <p className="text-sm text-slate-600">{/* Screenshot: {activeCategory.label} dashboard view */}Platform screenshot — {activeCategory.label}</p>
          </div>
        </div>
      </section>

      {/* Trade Examples */}
      <section className="px-6 sm:px-8 py-24 sm:py-32" style={{ background: "#111a2e" }}>
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center mb-14">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">See It In Action</p>
            <h2 className="mt-4 text-[28px] font-extrabold tracking-tight text-white sm:text-[36px]">
              How Maria Handles Real Calls
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {TRADE_EXAMPLES.map((ex) => (
              <div
                key={ex.trade}
                className="rounded-2xl p-8"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{ex.emoji}</span>
                  <h3 className="text-lg font-extrabold tracking-tight text-white">{ex.trade}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-400 italic">{ex.scenario}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTAs */}
      <section className="px-6 sm:px-8 py-20 sm:py-28" style={{ background: "#0f1729" }}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="reveal text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Everything included. One plan. $497/month.
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
