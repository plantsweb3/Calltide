"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform, useInView } from "framer-motion";
import dynamic from "next/dynamic";

const VoiceChat = dynamic(() => import("@/components/voice-chat"), { ssr: false });

const PHONE = process.env.NEXT_PUBLIC_PHONE ?? "(830) 521-7133";
const PHONE_TEL = `tel:${process.env.NEXT_PUBLIC_PHONE_TEL ?? "+18305217133"}`;
const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL ?? "https://cal.com/calltide/onboarding";

/* ───────── SVG Icons — monoline, 1.5px stroke ───────── */

function IconGlobe({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconCalendar({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconClipboard({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

function IconAlertTriangle({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconMessageCircle({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function IconBarChart({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

/* ───────── Simple Section wrapper ───────── */

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={className}>
      {children}
    </section>
  );
}

/* ───────── Mouse Spotlight Card ───────── */

function SpotlightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.06), transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
}

/* ───────── Animated Counter ───────── */

function Counter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) => `${prefix}${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, motionVal, value]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

/* ───────── Pricing Dismiss Animation ───────── */

function PricingDismiss() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase(4);
      return;
    }
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 1500);
    const t3 = setTimeout(() => setPhase(3), 2100);
    const t4 = setTimeout(() => setPhase(4), 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [inView]);

  const lines = [
    { price: "$0/mo", label: "Missing Calls", note: "Thousands in lost jobs", show: 1, strike: 2 },
    { price: "$3,200/mo", label: "Human Receptionist", note: "40hrs/week only", show: 3, strike: 4 },
  ];

  return (
    <div ref={ref} className="mt-12 flex flex-col items-center gap-4">
      {lines.map((line, i) => {
        const visible = phase >= line.show;
        const struck = phase >= line.strike;
        const glowing = visible && !struck;
        return (
          <div
            key={i}
            style={{
              opacity: visible ? 1 : 0,
              transform: `translateY(${visible ? 0 : 12}px)`,
              transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <div
              className="flex items-center gap-3 rounded-lg px-5 py-2.5"
              style={{
                boxShadow: glowing
                  ? "0 0 24px rgba(197,154,39,0.25), 0 0 48px rgba(197,154,39,0.08)"
                  : "none",
                background: glowing ? "rgba(197,154,39,0.06)" : "transparent",
                transition: "box-shadow 0.8s cubic-bezier(0.16,1,0.3,1), background 0.8s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <span
                className="text-base font-medium"
                style={{
                  color: struck ? "#f87171" : "#E8E9EB",
                  transition: "color 0.5s ease",
                }}
              >
                &#10007;
              </span>
              <span className="relative inline-block">
                <span
                  className="text-base font-medium"
                  style={{
                    color: struck ? "#6B7280" : "#E8E9EB",
                    transition: "color 0.5s ease",
                  }}
                >
                  {line.price} &mdash; {line.label}
                </span>
                <span
                  className="absolute left-0 top-1/2 h-[1.5px]"
                  style={{
                    width: struck ? "100%" : "0%",
                    background: "rgba(248,113,113,0.5)",
                    transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)",
                  }}
                />
              </span>
              <span
                className="text-xs font-medium"
                style={{
                  color: struck ? "rgba(248,113,113,0.6)" : "transparent",
                  transition: "color 0.5s ease 0.2s",
                }}
              >
                {line.note}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────── FAQ Accordion ───────── */

const faqs = [
  {
    q: "\"I don't trust AI on my phone.\"",
    a: "Neither did most of our clients — until they called the demo. Try it right now. No signup, no credit card. If you're not impressed in 30 seconds, we're not for you. Most owners call once and immediately ask how fast we can set it up.",
  },
  {
    q: "What if it screws up?",
    a: "Right now, your missed calls go to voicemail — and those callers never call back. An imperfect answer beats no answer every time. Plus, you get a full transcript of every conversation so nothing slips through.",
  },
  {
    q: "My customers won't talk to a robot.",
    a: "Most callers don't realize it's AI. What they actually hate is voicemail and never hearing back.",
  },
  {
    q: "I can't afford $497/month.",
    a: "One booked job pays for the month. The rest is pure profit. Most clients see 5-10 extra bookings per month from calls they were previously losing. That's thousands you were leaving on the table.",
  },
  {
    q: "I already have a receptionist.",
    a: "Calltide covers the other 128 hours per week she's not working. Nights, weekends, holidays, lunch breaks, sick days. She handles 9-5. Calltide handles everything else.",
  },
  {
    q: "What about real emergencies?",
    a: "Calltide detects urgency and patches the caller to your cell immediately. Gas leaks, burst pipes — flagged and forwarded in seconds.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-2xl divide-y divide-cream-border">
      {faqs.map((faq, i) => (
        <div key={i} className="faq-item">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between py-6 text-left"
          >
            <span className="pr-4 text-lg font-semibold text-charcoal">
              {faq.q}
            </span>
            <span
              className={`faq-plus shrink-0 text-xl font-bold transition-all duration-300 ${
                openIndex === i ? "text-amber" : "text-charcoal-light"
              }`}
            >
              {openIndex === i ? "\u2212" : "+"}
            </span>
          </button>
          <div className={`faq-answer ${openIndex === i ? "open" : ""}`}>
            <div>
              <p className="pb-6 text-base leading-[1.7] text-charcoal-muted">{faq.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────── Mobile sticky CTA ───────── */

function MobileCTA({ onTryInBrowser }: { onTryInBrowser: () => void }) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm px-4 py-3 md:hidden transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center gap-2">
        <a
          href={PHONE_TEL}
          className="cta-gold cta-shimmer flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-sm font-bold text-white shadow-lg"
        >
          Hear the AI: {PHONE}
        </a>
        <button
          onClick={onTryInBrowser}
          className="flex shrink-0 items-center justify-center rounded-lg border-2 border-navy px-4 py-3.5 text-sm font-bold text-navy"
        >
          Try in Browser
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-charcoal-light"
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ───────── Exit-intent popup ───────── */

function ExitIntent({ onTryInBrowser }: { onTryInBrowser: () => void }) {
  const [show, setShow] = useState(false);
  const dismissed = useRef(false);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 0 && !dismissed.current) {
      setShow(true);
      dismissed.current = true;
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mouseout", handleMouseLeave);
    return () => document.removeEventListener("mouseout", handleMouseLeave);
  }, [handleMouseLeave]);

  if (!show) return null;

  return (
    <div
      className="exit-overlay fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={() => setShow(false)}
    >
      <div
        className="exit-card card-shadow w-full max-w-md rounded-xl border border-cream-border bg-white p-10 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[28px] font-extrabold leading-tight tracking-tight text-charcoal sm:text-[32px]">
          Hear it before you leave.
        </p>
        <p className="mt-4 text-base leading-[1.7] text-charcoal-muted">
          30 seconds. No signup.
        </p>
        <button
          onClick={() => { setShow(false); onTryInBrowser(); }}
          className="cta-gold cta-shimmer mt-8 inline-flex items-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold text-white"
        >
          Talk to the AI &rarr;
        </button>
        <p className="mt-4 text-sm text-charcoal-light">
          or call <a href={PHONE_TEL} className="text-amber hover:underline">{PHONE}</a>
        </p>
        <button
          onClick={() => setShow(false)}
          className="mt-5 block w-full text-sm text-charcoal-light hover:text-charcoal transition-colors"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}

/* ───────── Dashboard Mockup ───────── */

function DashboardMockup() {
  const mockCalls = [
    { name: "Maria G.", time: "9:14 AM", status: "Booked", service: "AC Repair", lang: "ES" },
    { name: "James T.", time: "10:32 AM", status: "Booked", service: "Pipe Leak", lang: "EN" },
    { name: "Roberto S.", time: "11:45 AM", status: "Callback", service: "Estimate", lang: "ES" },
    { name: "Jennifer K.", time: "1:08 PM", status: "Booked", service: "AC Install", lang: "EN" },
    { name: "David L.", time: "2:51 PM", status: "Voicemail", service: "\u2014", lang: "EN" },
    { name: "Sofia M.", time: "4:22 PM", status: "Booked", service: "Drain Clean", lang: "ES" },
  ];

  const statusStyle: Record<string, string> = {
    Booked: "bg-green-500/10 text-green-400",
    Callback: "bg-blue-500/10 text-blue-400",
    Voicemail: "bg-slate-500/10 text-slate-400",
  };

  return (
    <div className="h-full w-full bg-slate-950 p-3 text-[10px] overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-green-500">Calltide</span>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[8px] text-slate-400">PORTAL</span>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 mb-3">
        <div className="text-center">
          <p className="text-sm font-bold text-slate-100">23</p>
          <p className="text-[7px] text-slate-500">Calls</p>
        </div>
        <div className="h-6 w-px bg-slate-800" />
        <div className="text-center">
          <p className="text-sm font-bold text-green-400">18</p>
          <p className="text-[7px] text-slate-500">Booked</p>
        </div>
        <div className="h-6 w-px bg-slate-800" />
        <div className="text-center">
          <p className="text-sm font-bold text-amber">$4.2k</p>
          <p className="text-[7px] text-slate-500">Revenue</p>
        </div>
      </div>
      <p className="text-[9px] font-medium text-slate-400 mb-1.5">Recent Calls</p>
      <div className="space-y-1">
        {mockCalls.map((call, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-slate-900 px-2 py-1.5">
            <div className="min-w-0">
              <p className="text-[9px] font-medium text-slate-200 truncate">{call.name}</p>
              <p className="text-[8px] text-slate-500">{call.time} &middot; {call.service}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className={`rounded-full px-1.5 py-0.5 text-[7px] font-medium ${statusStyle[call.status] ?? "bg-slate-500/10 text-slate-400"}`}>
                {call.status}
              </span>
              <span className="text-[7px] text-slate-500">{call.lang}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Sticky Nav Hook ───────── */

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

/* ───────── Scroll Reveal Hook ───────── */

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    // Safety net — never leave content hidden
    const timeout = setTimeout(() => {
      document.querySelectorAll(".reveal:not(.visible)").forEach((el) => {
        el.classList.add("visible");
      });
    }, 3000);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, []);
}

/* ───────── Features data ───────── */

const features = [
  {
    Icon: IconGlobe,
    title: "Fluent in Both.",
    body: "Switches between English, Spanish, and Spanglish mid-sentence. Your competitors lose these callers. You book them.",
    wide: true,
  },
  {
    Icon: IconCalendar,
    title: "Auto-Booking.",
    body: "Checks your calendar. Finds open slots. Books the job. Texts both parties a confirmation.",
    wide: false,
  },
  {
    Icon: IconClipboard,
    title: "Lead Intel.",
    body: "Name, number, address, service needed, urgency. Full brief texted to you before you set your tools down.",
    wide: false,
  },
  {
    Icon: IconAlertTriangle,
    title: "Emergency Routing.",
    body: "Burst pipe at 2 AM? Calltide flags the urgency and patches the caller directly to your cell.",
    wide: true,
  },
  {
    Icon: IconMessageCircle,
    title: "Auto Follow-Up.",
    body: "Missed call texts. Appointment reminders. Google review requests. All automatic. Zero admin.",
    wide: true,
  },
  {
    Icon: IconBarChart,
    title: "Revenue Proof.",
    body: "Every call, every booking, every dollar. Your dashboard shows exactly what Calltide earned you this week.",
    wide: false,
  },
];

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [audioLang, setAudioLang] = useState<"en" | "es">("en");
  const scrolled = useScrolled();
  useScrollReveal();

  return (
    <div className="relative overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Calltide",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "497",
              priceCurrency: "USD",
            },
            description:
              "AI receptionist for home service businesses. Answers every call in English and Spanish, 24/7. Books appointments. Texts you the details.",
          }),
        }}
      />
      {showVoiceChat && <VoiceChat onClose={() => setShowVoiceChat(false)} />}
      <MobileCTA onTryInBrowser={() => setShowVoiceChat(true)} />
      <ExitIntent onTryInBrowser={() => setShowVoiceChat(true)} />

      {/* ── 1. NAVIGATION ── */}
      <nav
        className={`sticky top-0 z-40 border-b transition-all duration-300 ${
          scrolled
            ? "nav-scrolled border-transparent"
            : "border-cream-border bg-cream"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 sm:px-8 py-4">
          <img
            src="/images/logo.webp"
            alt="Calltide"
            className="h-7 w-auto sm:h-8"
          />
          <div className="hidden items-center gap-8 md:flex">
            <div className="group relative">
              <button className="flex items-center gap-1 text-sm font-medium text-charcoal-muted transition hover:text-charcoal">
                Platform
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:rotate-180">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className="pointer-events-none absolute left-0 top-full pt-2 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                <div className="card-shadow rounded-lg border border-cream-border bg-white py-2 min-w-[160px]">
                  <a href="#features" className="block px-4 py-2 text-sm text-charcoal-muted transition hover:bg-cream hover:text-charcoal">Features</a>
                  <a href="#how-it-works" className="block px-4 py-2 text-sm text-charcoal-muted transition hover:bg-cream hover:text-charcoal">How It Works</a>
                  <a href="#pricing" className="block px-4 py-2 text-sm text-charcoal-muted transition hover:bg-cream hover:text-charcoal">Pricing</a>
                </div>
              </div>
            </div>
            <a href="#pricing" className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">
              Pricing
            </a>
            <a href="#faq" className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/dashboard/login"
              className="hidden text-sm font-medium text-charcoal-muted transition hover:text-charcoal sm:inline-block"
            >
              Log In
            </a>
            <a
              href={PHONE_TEL}
              className="cta-shimmer hidden items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light sm:inline-flex"
            >
              Hear the AI: {PHONE}
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-charcoal md:hidden"
              aria-label="Menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <>
                    <path d="M4 6h16" />
                    <path d="M4 12h16" />
                    <path d="M4 18h16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-cream-border bg-white px-6 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-charcoal-muted">How It Works</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-charcoal-muted">Features</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-charcoal-muted">Pricing</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-charcoal-muted">FAQ</a>
              <a href="/dashboard/login" className="text-sm font-medium text-charcoal-muted">Log In</a>
              <a href={PHONE_TEL} className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white">
                Hear the AI: {PHONE}
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ── 2. HERO ── */}
      <section className="relative overflow-hidden grain-overlay">
        <img
          src="/images/grit-hvac.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        <div className="hero-bg-overlay absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8 py-24 sm:py-32">
          <div className="grid items-center gap-16 md:grid-cols-5">
            <div className="md:col-span-3">
              {/* Always On status indicator */}
              <div className="flex items-center gap-2 mb-6">
                <span className="status-dot" />
                <span className="text-xs font-medium tracking-wide text-slate-400">
                  Answering calls right now
                </span>
              </div>

              <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-amber">
                AI Receptionist for Home Services
              </p>
              <h1 className="mt-6 text-[clamp(48px,6vw,80px)] font-extrabold leading-[1.05] tracking-tight text-white">
                Every Call Answered.
                <br />
                Every Job{" "}
                <span className="gold-gradient-text">Booked.</span>
              </h1>
              <p className="mt-6 max-w-xl text-xl font-medium leading-[1.7] text-slate-300">
                AI receptionist that picks up in English and Spanish, qualifies leads,
                and books appointments onto your calendar. 24/7.
              </p>
              <p className="mt-4 text-lg italic text-amber">
                Cada llamada contestada. Cada trabajo agendado.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  onClick={() => setShowVoiceChat(true)}
                  className="cta-gold cta-shimmer hero-cta-glow inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-base font-semibold text-white"
                >
                  Hear It Live &rarr;
                </button>
                <a
                  href={PHONE_TEL}
                  className="text-center text-sm font-medium text-slate-400 transition hover:text-white sm:text-left"
                >
                  Or call the demo: <span className="font-semibold text-white">{PHONE}</span>
                </a>
              </div>
              <p className="mt-4 text-sm text-slate-400">
                30 seconds. No signup.
              </p>
              <p className="mt-8 text-[13px] text-slate-500">
                Trusted by service businesses across Texas.
              </p>
            </div>

            <div className="md:col-span-2 relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(212,145,10,0.15),transparent_70%)]" />
              <div className="phone-mockup-premium phone-mockup-glow relative mx-auto w-[280px] rounded-[2.5rem] border-[6px] border-slate-700 bg-black p-2 lg:sticky lg:top-[120px]">
                <div
                  role="img"
                  aria-label="Calltide client portal showing booked appointments and revenue"
                  className="overflow-hidden rounded-[2rem]"
                  style={{ aspectRatio: "600/1053" }}
                >
                  <DashboardMockup />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. SOCIAL PROOF BAR ── */}
      <Section className="relative bg-navy border-t border-amber px-6 sm:px-8 py-12 sm:py-14 dark-section grain-overlay">
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center justify-center gap-10 md:flex-row md:gap-0">
          {[
            { value: "24/7", label: "Never off. Nights, weekends, holidays." },
            { value: "2 Languages", label: "English + Spanish. Seamless." },
            { value: "< 60s", label: "Ring to booked appointment." },
          ].map((stat, i) => (
            <div key={stat.value} className="flex items-center gap-0">
              {i > 0 && (
                <div className="mx-10 hidden h-12 w-px bg-amber md:block" />
              )}
              <div className="text-center">
                <p className="gold-gradient-text text-[36px] font-extrabold sm:text-[40px]">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 4. PROBLEM ── */}
      <Section id="problem" className="relative overflow-hidden px-6 sm:px-8 py-24 sm:py-32 grain-overlay">
        <img
          src="/images/grit-solar.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="lazy"
        />
        <div className="grit-overlay-problem absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <h2 className="reveal text-center text-[36px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[48px]">
            Every Missed Call
            <br />
            Is a Lost Job
          </h2>

          <div className="snap-scroll-mobile mt-16 grid gap-[48px] sm:gap-8 md:grid-cols-3">
            <div className="reveal reveal-stagger problem-card rounded-xl p-10 sm:p-12" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <p className="gold-gradient-text text-[24px] font-semibold">
                Tuesday, 2:14 PM.
              </p>
              <p className="mt-4 text-base leading-[1.7] text-charcoal-muted">
                Burst pipe. Three plumbers called. Two hit voicemail.
                The third answers and books a $1,200 job.
              </p>
            </div>

            <div className="reveal reveal-stagger problem-card rounded-xl p-10 sm:p-12" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <p className="gold-gradient-text text-[24px] font-semibold">
                &ldquo;Hola, necesito ayuda...&rdquo;
              </p>
              <p className="mt-4 text-base leading-[1.7] text-charcoal-muted">
                Spanish-speaking family needs AC repair. Your voicemail
                is English-only. They call your competitor. You never know.
              </p>
            </div>

            <div className="reveal reveal-stagger problem-card rounded-xl p-10 sm:p-12" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <p className="gold-gradient-text text-[24px] font-semibold">
                Saturday, 11:30 AM.
              </p>
              <p className="mt-4 text-base leading-[1.7] text-charcoal-muted">
                AC dies in July. She calls three HVAC companies. The one
                that answers books a $2,800 replacement. The other two
                never even know.
              </p>
            </div>
          </div>

          <div className="reveal mt-20 text-center">
            <p className="gold-gradient-text text-[32px] font-extrabold leading-tight sm:text-[40px]">
              62% of calls to service businesses go unanswered.
            </p>
            <p className="mt-4 text-lg text-slate-300">
              Every one is revenue you&apos;ll never see.
            </p>
          </div>
        </div>
      </Section>

      {/* ── 4b. AUDIO DEMO — pill toggle + single unified player ── */}
      <Section className="relative bg-navy px-6 sm:px-8 py-24 sm:py-32 dark-section grain-overlay">
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <p className="reveal text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">
            Live Demo
          </p>
          <h2 className="reveal mt-4 text-[36px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[48px]">
            Hear It. Then Decide.
          </h2>
          <p className="reveal mt-4 text-lg text-slate-300">
            Real conversations. No scripts.
          </p>

          {/* Pill toggle */}
          <div className="reveal mt-10 inline-flex rounded-full overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}>
            <button
              onClick={() => setAudioLang("en")}
              className="px-6 py-2.5 text-sm font-semibold transition-all rounded-full"
              style={{
                background: audioLang === "en" ? "linear-gradient(180deg, #D6A846 0%, #C0963E 100%)" : "transparent",
                color: audioLang === "en" ? "#fff" : "#94a3b8",
              }}
            >
              English
            </button>
            <button
              onClick={() => setAudioLang("es")}
              className="px-6 py-2.5 text-sm font-semibold transition-all rounded-full"
              style={{
                background: audioLang === "es" ? "linear-gradient(180deg, #D6A846 0%, #C0963E 100%)" : "transparent",
                color: audioLang === "es" ? "#fff" : "#94a3b8",
              }}
            >
              Espa&ntilde;ol
            </button>
          </div>

          {/* Single unified player */}
          <div
            className="reveal ambient-edge mt-8 rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowVoiceChat(true)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber text-white transition hover:bg-amber-dark"
                aria-label={audioLang === "en" ? "Play English demo" : "Play Spanish demo"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              </button>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white">
                  {audioLang === "en" ? "English Demo" : "Demo en Espa\u00f1ol"}
                </p>
                <p className="text-xs text-slate-400">
                  {audioLang === "en"
                    ? "\u201CHi, I need to schedule a plumber...\u201D"
                    : "\u201CHola, necesito programar una cita...\u201D"}
                </p>
                {/* Waveform visualization */}
                <div className="mt-3 flex items-end gap-[3px] h-6">
                  {[35, 60, 45, 80, 55, 70, 40, 85, 50, 75, 60, 35, 70, 45, 80, 55, 65, 40, 75, 50, 60, 45, 70, 55].map((h, i) => (
                    <div
                      key={i}
                      className="waveform-bar w-[3px] rounded-full bg-amber/30"
                      style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-xs tabular-nums text-slate-500">
                {audioLang === "en" ? "0:47" : "0:52"}
              </span>
            </div>
          </div>

          <p className="reveal mt-6 text-sm text-slate-400">
            Press play to start a live conversation — or call{" "}
            <a href={PHONE_TEL} className="font-semibold text-amber hover:underline">{PHONE}</a>
          </p>
        </div>
      </Section>

      {/* ── 5. HOW IT WORKS ── */}
      <Section id="how-it-works" className="bg-[#FBFBFC] px-6 sm:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-[#6F737C]">
              Three Steps
            </p>
            <h2 className="mt-4 text-[36px] font-extrabold leading-[1.1] tracking-tight text-charcoal sm:text-[48px]">
              Voicemail Is Dead
            </h2>
          </div>

          <div className="mt-20 grid gap-16 md:grid-cols-5">
            <div className="steps-timeline space-y-14 md:col-span-3">
              {[
                {
                  num: "1",
                  title: "Phone Rings",
                  desc: "Calltide answers instantly. English or Spanish. Real conversation, not a phone tree.",
                },
                {
                  num: "2",
                  title: "Job Gets Booked",
                  desc: "Qualifies the lead. Checks your calendar. Books the slot. Sends confirmation to both parties.",
                },
                {
                  num: "3",
                  title: "You Get a Text",
                  desc: "Full call summary before you set your tools down. Show up. Do the job. Get paid.",
                },
              ].map((step) => (
                <div key={step.num} className="reveal flex gap-6">
                  <div className="step-circle-glow relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber text-lg font-bold text-white">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="text-[24px] font-extrabold tracking-tight text-charcoal">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-base leading-[1.7] text-charcoal-muted">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:col-span-2 md:flex md:items-center">
              <div className="reveal glass-card-light flex w-full flex-col items-center gap-5 rounded-xl p-12">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber/10">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C59A27" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </div>
                <p className="text-center text-[24px] font-extrabold tracking-tight text-charcoal">Ring &rarr; Book &rarr; Text</p>
                <p className="text-center text-sm text-charcoal-muted">Every call. Fully automatic.</p>
              </div>
            </div>
          </div>

          <p className="reveal mt-20 text-center text-lg italic text-charcoal-muted">
            All while you&apos;re under a sink, on a roof, or asleep.
          </p>
        </div>
      </Section>

      {/* ── 6. FEATURES — Bento Box Grid ── */}
      <Section id="features" className="relative bg-[#1B2A4A] px-6 sm:px-8 py-24 sm:py-32 dark-section grain-overlay">
        <div className="relative z-10 mx-auto max-w-5xl">
          <h2 className="reveal text-center text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[40px] lg:text-[48px]">
            What Your{" "}
            <span className="gold-gradient-text">$16/Day</span>
            {" "}Gets You
          </h2>

          <div className="snap-scroll-mobile mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <SpotlightCard
                key={f.title}
                className={`glass-card ambient-edge rounded-xl ${
                  f.wide ? "lg:col-span-2" : ""
                }`}
              >
                <motion.div
                  className="p-8 sm:p-10"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber/10">
                    <f.Icon size={20} className="text-amber" />
                  </div>
                  <h3 className="mt-4 text-xl font-extrabold leading-[1.3] tracking-tight text-white sm:text-2xl">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-base leading-[1.7] text-[#B8C4D4]">
                    {f.body}
                  </p>
                </motion.div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 6b. SOCIAL PROOF ── */}
      <Section className="bg-[#FBFBFC] px-6 sm:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-[#6F737C]">
              Performance
            </p>
            <h2 className="mt-4 text-[36px] font-extrabold leading-[1.1] tracking-tight text-charcoal sm:text-[48px]">
              The Numbers Don&apos;t Lie
            </h2>
          </div>

          <div className="snap-scroll-mobile mt-16 grid gap-8 sm:grid-cols-3">
            {[
              { value: 8, suffix: "s", prefix: "", label: "Avg. Pickup", desc: "Two rings. That\u2019s it." },
              { value: 94, suffix: "%", prefix: "", label: "Booking Rate", desc: "If they need service, they get booked." },
              { value: 16, suffix: "", prefix: "$", label: "Per Day", desc: "One job covers the entire year." },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="card-shadow card-hover rounded-xl border border-cream-border bg-white p-10 sm:p-12 text-center"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="gold-gradient-text text-[48px] font-extrabold">
                  <Counter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                </p>
                <p className="mt-2 text-base font-semibold text-charcoal">{stat.label}</p>
                <p className="mt-1 text-sm leading-[1.7] text-charcoal-muted">{stat.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="reveal mt-16 mx-auto max-w-2xl">
            <div className="card-shadow card-hover rounded-xl border border-cream-border bg-white p-10 sm:p-12">
              <p className="text-lg leading-[1.7] text-charcoal-muted italic">
                &ldquo;First week: 11 jobs we would have lost. The Spanish line alone brought in
                three new families. This thing pays for itself before Tuesday.&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/10 text-sm font-bold text-amber">
                  MR
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal">Mike R.</p>
                  <p className="text-sm text-charcoal-muted">R&amp;R Plumbing — Austin, TX</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 7. DEMO PROOF ── */}
      <Section className="relative bg-navy px-6 sm:px-8 py-24 sm:py-32 dark-section grain-overlay">
        <div className="glass-card-demo ambient-edge relative z-10 mx-auto max-w-lg rounded-xl p-10 text-center sm:p-14">
          <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-[#C8AA6E]">
            30-Second Demo
          </p>
          <h2 className="mt-4 text-[32px] font-extrabold leading-tight tracking-tight text-white sm:text-[40px]">
            Don&apos;t Take Our Word for It
          </h2>
          <p className="mt-4 text-base leading-[1.7] text-slate-300">
            English. Spanish. Emergency plumbing. Weekend callback. Try it.
          </p>
          <button
            onClick={() => setShowVoiceChat(true)}
            className="cta-gold cta-shimmer pulse-ring mt-10 inline-flex w-full items-center justify-center gap-3 rounded-lg px-8 py-4 text-lg font-semibold text-white sm:w-auto"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            Talk to the AI Now
          </button>
          <p className="mt-4 text-sm text-slate-400">
            No signup. No credit card. Or call <a href={PHONE_TEL} className="font-semibold text-amber hover:underline">{PHONE}</a>
          </p>
        </div>
      </Section>

      {/* ── 8. PRICING — Condensed, single focal card ── */}
      <Section id="pricing" className="bg-[#111317] px-6 sm:px-8 py-24 sm:py-32 dark-section">
        <div className="mx-auto max-w-3xl">
          <h2 className="reveal text-center text-[32px] font-extrabold leading-[1.1] tracking-tight text-[#E8E9EB] sm:text-[40px] lg:text-[48px]">
            One Booked Job Pays for the Month
          </h2>
          <p className="mt-4 text-center text-lg text-[#A0A3A8]">
            The rest is pure profit.
          </p>

          {/* Context lines — animated consider-then-dismiss */}
          <PricingDismiss />

          {/* Main pricing card */}
          <div className="reveal mt-10 mx-auto max-w-lg">
            <div className="pricing-glow ambient-edge relative rounded-xl border-2 border-[#C8AA6E] bg-[#1A1D0F] p-10 text-center sm:p-14">
              <span className="best-value-badge">BEST VALUE</span>
              <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-[#C8AA6E]">
                Calltide
              </p>
              <p className="mt-6 text-[56px] font-extrabold tracking-tight text-[#E8E9EB]">
                $497
              </p>
              <p className="text-sm text-[#A0A3A8]">/month</p>
              <p className="mt-1 text-sm font-medium text-[#C8AA6E]">
                $16/day. One job covers the whole year.
              </p>
              <ul className="mt-8 space-y-4 text-left text-sm text-[#E8E9EB]">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#C8AA6E]">&#10003;</span>
                  Answers every call, 24/7/365
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#C8AA6E]">&#10003;</span>
                  Fluent English + Spanish
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#C8AA6E]">&#10003;</span>
                  Auto-books to your calendar
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#C8AA6E]">&#10003;</span>
                  Unlimited simultaneous calls
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#C8AA6E]">&#10003;</span>
                  No sick days. No training. No turnover.
                </li>
              </ul>
              <a
                href={BOOKING_URL}
                className="cta-gold cta-shimmer mt-10 inline-flex w-full items-center justify-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold text-white"
              >
                Start Booking More Jobs &rarr;
              </a>
              <p className="mt-4 text-xs text-[#A0A3A8]">
                30-min setup call. We handle everything.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 9. GUARANTEE ── */}
      <Section className="bg-[#111317] px-6 sm:px-8 py-24 sm:py-32 dark-section">
        <div className="mx-auto max-w-3xl">
          <div className="reveal rounded-xl border border-[#2A2D33] border-l-[6px] border-l-[#C8AA6E] bg-[#1A1D24] p-10 sm:p-14">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C8AA6E]/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8AA6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-[#C8AA6E]">
                Zero-Risk Guarantee
              </p>
            </div>
            <h2 className="mt-6 text-[32px] font-extrabold leading-[1.1] tracking-tight text-[#E8E9EB] sm:text-[40px]">
              5 Bookings in 30 Days.
              <br />
              Or Your Money Back.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-[1.7] text-[#A0A3A8]">
              If Calltide doesn&apos;t book at least{" "}
              <span className="font-bold text-[#C8AA6E]">5 appointments</span> in
              your first month, we refund every penny. No contracts. Cancel anytime.
            </p>
          </div>
        </div>
      </Section>

      {/* ── 10. FAQ ── */}
      <Section id="faq" className="relative bg-[#FBFBFC] px-6 sm:px-8 py-24 sm:py-32 overflow-hidden">
        <div className="mx-auto max-w-3xl">
          <h2 className="reveal text-center text-[36px] font-extrabold leading-[1.1] tracking-tight text-charcoal sm:text-[48px]">
            You&apos;re Skeptical. Good.
          </h2>
          <p className="mt-4 text-center text-lg text-charcoal-muted">
            We&apos;d rather answer these now than lose you to a doubt.
          </p>
          <div className="reveal mt-14">
            <FAQ />
          </div>
        </div>
      </Section>

      {/* ── 11. FINAL CTA ── */}
      <Section className="relative px-6 sm:px-8 py-24 sm:py-32 overflow-hidden dark-section grain-overlay">
        <img
          src="/images/grit-texture.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="lazy"
        />
        <div className="grit-overlay-cta absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="reveal text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[40px] lg:text-[48px]">
            Your Competitors Are Still
            <br />
            Sending Calls to <span className="text-[#EF4444]">Voicemail</span>.
          </h2>

          <a
            href={BOOKING_URL}
            className="cta-gold cta-shimmer pulse-ring group mt-12 inline-flex items-center gap-2 rounded-lg px-10 py-4 text-lg font-semibold text-white"
          >
            Start Booking More Jobs
            <span className="transition-transform group-hover:translate-x-0.5">
              &rarr;
            </span>
          </a>

          <p className="mt-8 text-slate-400">
            Or hear it yourself:
          </p>
          <a
            href={PHONE_TEL}
            className="mt-2 inline-block text-[28px] font-extrabold text-white transition hover:text-amber"
          >
            {PHONE}
          </a>
        </div>
      </Section>

      {/* ── 12. FOOTER ── */}
      <footer className="bg-charcoal px-6 sm:px-8 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand column */}
            <div className="sm:col-span-2 lg:col-span-1">
              <img
                src="/images/logo.webp"
                alt="Calltide"
                className="h-7 w-auto brightness-0 invert opacity-70"
              />
              <p className="mt-4 text-sm text-white/40">
                Every call answered. Every job booked.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <a href="https://twitter.com/calltide" aria-label="Twitter" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/40 transition hover:bg-white/10 hover:text-white/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://linkedin.com/company/calltide" aria-label="LinkedIn" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/40 transition hover:bg-white/10 hover:text-white/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            {/* Platform column */}
            <div>
              <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-white/50">Platform</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a href="#features" className="text-white/40 transition hover:text-white/60">Features</a></li>
                <li><a href="#how-it-works" className="text-white/40 transition hover:text-white/60">How It Works</a></li>
                <li><a href="#pricing" className="text-white/40 transition hover:text-white/60">Pricing</a></li>
                <li><a href="#faq" className="text-white/40 transition hover:text-white/60">FAQ</a></li>
              </ul>
            </div>

            {/* Company column */}
            <div>
              <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-white/50">Company</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a href="mailto:hello@calltide.app" className="text-white/40 transition hover:text-white/60">Contact</a></li>
                <li><a href={BOOKING_URL} className="text-white/40 transition hover:text-white/60">Book a Call</a></li>
                <li><a href="/dashboard/login" className="text-white/40 transition hover:text-white/60">Client Login</a></li>
              </ul>
            </div>

            {/* Legal column */}
            <div>
              <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-white/50">Legal</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a href="/terms" className="text-white/40 transition hover:text-white/60">Terms of Service</a></li>
                <li><a href="/privacy" className="text-white/40 transition hover:text-white/60">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center gap-3 border-t border-white/10 pt-8 text-center text-sm sm:flex-row sm:justify-between sm:text-left">
            <p className="text-white/30">
              &copy; {new Date().getFullYear()} Calltide. All rights reserved.
            </p>
            <p className="text-white/30">
              Built in Texas
            </p>
          </div>
        </div>
      </footer>

      <div className="h-16 md:hidden" />
    </div>
  );
}
