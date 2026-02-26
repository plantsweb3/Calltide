"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const VoiceChat = dynamic(() => import("@/components/voice-chat"), { ssr: false });

const PHONE = "(830) 521-7133";
const PHONE_TEL = "tel:+18305217133";
const BOOKING_URL = "https://cal.com/calltide/onboarding";

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

/* ───────── FAQ Accordion ───────── */

const faqs = [
  {
    q: "\"I don't trust AI answering my phone.\"",
    a: "Fair. That's why we give you a demo number to call right now — no signup, no credit card. Call it in English, call it in Spanish, try to trip it up. If you're not impressed in 30 seconds, this isn't for you. But most owners call the demo and immediately ask \"how fast can you set this up?\"",
  },
  {
    q: "What if it screws up and I lose a customer?",
    a: "Right now, 100% of the calls you miss go to voicemail — and most of those callers never call back. Calltide answers every single one. Even if the AI handles a call imperfectly, an answered call beats a missed call every time. Plus, you get a full transcript of every conversation so nothing falls through the cracks.",
  },
  {
    q: "My customers won't like talking to a robot.",
    a: "The voice is natural and conversational. Most callers don't realize it's AI unless they ask directly — in which case it's honest about it. What your customers actually hate is getting sent to voicemail and never hearing back.",
  },
  {
    q: "I can't afford $497/month right now.",
    a: "One booked job covers the entire month. If Calltide books just one appointment you would have missed, it's paid for itself. Most of our clients see 5-10 additional bookings per month from calls they were previously missing — that's thousands in revenue they were leaving on the table.",
  },
  {
    q: "What if I already have a receptionist?",
    a: "Great — Calltide covers the other 128 hours per week they're not working. Nights, weekends, lunch breaks, sick days, holidays. Your receptionist handles business hours; Calltide handles everything else.",
  },
  {
    q: "What if the customer needs a real person?",
    a: "Calltide detects urgency and can transfer directly to you or your on-call tech. Emergencies like gas leaks or burst pipes get flagged immediately with a direct call to your cell.",
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
          Call Demo: {PHONE}
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
        <p className="text-[28px] font-extrabold leading-tight tracking-[-0.03em] text-charcoal sm:text-[32px]">
          Wait — hear it before you go.
        </p>
        <p className="mt-4 text-base leading-[1.7] text-charcoal-muted">
          Experience Calltide answering as a real business.
          Takes 30 seconds. No signup needed.
        </p>
        <button
          onClick={() => { setShow(false); onTryInBrowser(); }}
          className="cta-gold cta-shimmer mt-8 inline-flex items-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold text-white"
        >
          Try It in Your Browser
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
          <p className="text-[7px] text-slate-500">Total Calls</p>
        </div>
        <div className="h-6 w-px bg-slate-800" />
        <div className="text-center">
          <p className="text-sm font-bold text-green-400">18</p>
          <p className="text-[7px] text-slate-500">Booked</p>
        </div>
        <div className="h-6 w-px bg-slate-800" />
        <div className="text-center">
          <p className="text-sm font-bold text-amber">$4.2k</p>
          <p className="text-[7px] text-slate-500">Saved</p>
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

/* ───────── Scroll Reveal Hook (Part 10) ───────── */

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

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
              "AI receptionist that answers your phone in English and Spanish, 24/7. Books appointments. Texts you the details.",
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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
              Call Demo: {PHONE}
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
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-charcoal-muted">What You Get</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-charcoal-muted">Pricing</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-charcoal-muted">FAQ</a>
              <a href="/dashboard/login" className="text-sm font-medium text-charcoal-muted">Log In</a>
              <a href={PHONE_TEL} className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white">
                Call Demo: {PHONE}
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ── 2. HERO ── */}
      <section className="relative overflow-hidden hero-gradient grain-overlay">
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-[120px]">
          <div className="grid items-center gap-16 md:grid-cols-5">
            <div className="md:col-span-3">
              <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-amber">
                The Front Office for Your Business
              </p>
              <h1 className="mt-6 text-[clamp(48px,6vw,80px)] font-extrabold leading-[1.05] tracking-[-0.04em] text-white">
                Answer Every Lead
                <br />
                Like You Have a{" "}
                <span className="gold-gradient-text">Full-Time Receptionist</span>
              </h1>
              <p className="mt-6 max-w-xl text-xl font-medium leading-[1.7] text-slate-300">
                Your AI picks up in English or Spanish — 24/7. Qualifies the caller,
                books the appointment, and texts you the details before you set your
                tools down.
              </p>
              <p className="mt-4 text-lg italic text-amber">
                Cada llamada contestada. Cada trabajo agendado.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  onClick={() => setShowVoiceChat(true)}
                  className="cta-gold cta-shimmer hero-cta-glow inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-base font-semibold text-white"
                >
                  Talk to Maria Now &rarr;
                </button>
                <a
                  href={PHONE_TEL}
                  className="text-center text-sm font-medium text-slate-400 transition hover:text-white sm:text-left"
                >
                  Or call the demo: <span className="font-semibold text-white">{PHONE}</span>
                </a>
              </div>
              <p className="mt-4 text-sm text-slate-400">
                No signup needed. Talk to our AI receptionist in your browser right now.
              </p>
              <p className="mt-8 text-[13px] text-slate-500">
                Trusted by plumbers, HVAC techs, and electricians across the country.
              </p>
            </div>

            <div className="md:col-span-2 relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(212,145,10,0.15),transparent_70%)]" />
              <div className="phone-mockup-premium phone-mockup-glow relative mx-auto w-[280px] rounded-[2.5rem] border-[6px] border-slate-700 bg-black p-2 lg:sticky lg:top-[120px]">
                <div
                  role="img"
                  aria-label="Calltide mobile dashboard showing today's call activity with booked appointments and revenue saved"
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
      <Section className="relative bg-navy border-t border-amber px-6 py-12 sm:py-14 dark-section grain-overlay">
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center justify-center gap-10 md:flex-row md:gap-0">
          {[
            { value: "24/7", label: "Every call answered, nights, weekends, holidays" },
            { value: "2 Languages", label: "English and Spanish, including Spanglish" },
            { value: "< 60 Seconds", label: "From ring to booked appointment" },
          ].map((stat, i) => (
            <div key={stat.value} className="flex items-center gap-0">
              {i > 0 && (
                <div className="mx-10 hidden h-12 w-px bg-amber md:block" />
              )}
              <div className="text-center">
                <p className="gold-gradient-text text-[36px] font-bold sm:text-[40px]">
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
      <Section id="problem" className="bg-[#FBFBFC] px-6 py-[96px] sm:py-[160px]">
        <div className="mx-auto max-w-5xl">
          <h2 className="reveal text-center text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-charcoal sm:text-[48px]">
            While You&apos;re on a Job,
            <br />
            Your Phone Is Losing You Money
          </h2>

          <div className="mt-16 grid gap-[48px] md:grid-cols-3">
            <div className="reveal reveal-stagger problem-card rounded-xl border border-cream-border bg-white p-12">
              <p className="gold-gradient-text text-[24px] font-semibold">
                Tuesday, 2:14 PM.
              </p>
              <p className="mt-4 text-base leading-[1.7] text-charcoal-muted">
                A homeowner has a burst pipe. She calls three plumbers.
                Two go to voicemail. The third answers and gets a $1,200
                job. Which plumber were you?
              </p>
            </div>

            <div className="reveal reveal-stagger problem-card rounded-xl border border-cream-border bg-white p-12">
              <p className="gold-gradient-text text-[24px] font-semibold">
                &ldquo;Hola, necesito ayuda...&rdquo;
              </p>
              <p className="mt-4 text-base leading-[1.7] text-charcoal-muted">
                A Spanish-speaking family needs their AC fixed. Your voicemail is
                in English. They don&apos;t leave a message. They call the
                company with the bilingual receptionist. You never even know they
                called.
              </p>
            </div>

            <div className="reveal reveal-stagger problem-card rounded-xl border border-cream-border bg-white p-12">
              <p className="gold-gradient-text text-[24px] font-semibold">
                Saturday, 11:30 AM.
              </p>
              <p className="mt-4 text-base leading-[1.7] text-charcoal-muted">
                A homeowner&apos;s AC dies in the middle of July. She calls three
                HVAC companies. Two go to voicemail. The third answers, books a
                same-day diagnostic, and earns a $2,800 system replacement. The
                other two never even knew she called.
              </p>
            </div>
          </div>

          <div className="reveal mt-20 text-center">
            <p className="gold-gradient-text text-[32px] font-bold leading-tight sm:text-[40px]">
              Most service businesses miss more than half their incoming calls.
            </p>
            <p className="mt-4 text-lg text-charcoal-muted">
              Every one of those is revenue walking out your door.
            </p>
          </div>
        </div>
      </Section>

      {/* ── 4b. AUDIO DEMO ── */}
      <Section className="bg-[#FBFBFC] px-6 py-[96px] sm:py-[160px]">
        <div className="mx-auto max-w-4xl">
          <div className="reveal text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-[#6F737C]">
              Hear The Difference
            </p>
            <h2 className="mt-4 text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-charcoal sm:text-[48px]">
              This Is What Your Callers Hear
            </h2>
            <p className="mt-4 text-lg text-charcoal-muted">
              Real demo calls. No scripts. No actors.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {/* English demo */}
            <div className="reveal reveal-stagger glass-card-light card-hover rounded-xl p-12">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/10 text-lg">
                  🇺🇸
                </span>
                <div>
                  <p className="text-base font-semibold text-charcoal">English Demo</p>
                  <p className="text-sm text-charcoal-muted">&ldquo;Hi, I need to schedule a plumber...&rdquo;</p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-lg bg-cream-dark px-4 py-3">
                <button
                  onClick={() => setShowVoiceChat(true)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber text-white transition hover:bg-amber-dark"
                  aria-label="Play English demo"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </button>
                <div className="flex-1">
                  <div className="h-1.5 rounded-full bg-cream-border">
                    <div className="h-full w-[65%] rounded-full bg-amber" />
                  </div>
                </div>
                <span className="text-xs text-charcoal-light">0:47</span>
              </div>
            </div>

            {/* Spanish demo */}
            <div className="reveal reveal-stagger glass-card-light card-hover rounded-xl p-12">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/10 text-lg">
                  🇲🇽
                </span>
                <div>
                  <p className="text-base font-semibold text-charcoal">Spanish Demo</p>
                  <p className="text-sm text-charcoal-muted">&ldquo;Hola, necesito programar una cita...&rdquo;</p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-lg bg-cream-dark px-4 py-3">
                <button
                  onClick={() => setShowVoiceChat(true)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber text-white transition hover:bg-amber-dark"
                  aria-label="Play Spanish demo"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </button>
                <div className="flex-1">
                  <div className="h-1.5 rounded-full bg-cream-border">
                    <div className="h-full w-[45%] rounded-full bg-amber" />
                  </div>
                </div>
                <span className="text-xs text-charcoal-light">0:52</span>
              </div>
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-charcoal-muted">
            Press play to launch a live conversation — or call <a href={PHONE_TEL} className="font-semibold text-amber hover:underline">{PHONE}</a> from your phone.
          </p>
        </div>
      </Section>

      {/* ── 5. HOW IT WORKS ── */}
      <Section id="how-it-works" className="bg-[#FBFBFC] px-6 py-[96px] sm:py-[160px]">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-[#6F737C]">
              How It Works
            </p>
            <h2 className="mt-4 text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-charcoal sm:text-[48px]">
              Your Phone Never Goes to Voicemail Again
            </h2>
          </div>

          <div className="mt-20 grid gap-16 md:grid-cols-5">
            <div className="steps-timeline space-y-14 md:col-span-3">
              {[
                {
                  num: "1",
                  title: "Customer Calls",
                  desc: "Calltide answers instantly in English or Spanish. No hold music. A real conversation.",
                },
                {
                  num: "2",
                  title: "Appointment Booked",
                  desc: "Gets their name, number, what they need, and urgency. Books the slot. Sends them a confirmation.",
                },
                {
                  num: "3",
                  title: "You Get a Text",
                  desc: "Full summary of the call before you've even set your tools down. Show up, do the job, get paid.",
                },
              ].map((step) => (
                <div key={step.num} className="reveal flex gap-6">
                  <div className="step-circle-glow relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber text-lg font-bold text-white">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="text-[24px] font-bold tracking-[-0.01em] text-charcoal">
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
                <p className="text-center text-[24px] font-bold text-charcoal">Ring &rarr; Answer &rarr; Book &rarr; Text</p>
                <p className="text-center text-sm text-charcoal-muted">Every call, handled automatically.</p>
              </div>
            </div>
          </div>

          <p className="reveal mt-20 text-center text-lg italic text-charcoal-muted">
            All while you&apos;re on a job, eating dinner, or sleeping.
          </p>
        </div>
      </Section>

      {/* ── 6. FEATURES ── */}
      <Section id="features" className="relative bg-[#1B2A4A] px-6 py-[96px] sm:py-[160px] dark-section grain-overlay">
        <div className="relative z-10 mx-auto max-w-5xl">
          <h2 className="reveal text-center text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-white sm:text-[40px] lg:text-[48px]">
            Built for How Service Businesses{" "}
            <span className="gold-gradient-text">Actually Work</span>
          </h2>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "\uD83C\uDF10",
                title: "Win the Jobs Others Can't",
                body: "Millions of potential customers prefer to do business in Spanish. When they hear their language, you've already won. Calltide switches between English, Spanish, and Spanglish seamlessly.",
              },
              {
                icon: "\uD83D\uDCC5",
                title: "Wake Up to a Full Schedule",
                body: "Calltide checks your calendar, finds open slots, and books the appointment — then texts you and the customer a confirmation. No phone tag. No back-and-forth.",
              },
              {
                icon: "\uD83D\uDCCB",
                title: "Know Every Caller Before You Call Back",
                body: "Every caller gets qualified: name, number, address, service needed, urgency level. You get the full brief via text. Show up prepared.",
              },
              {
                icon: "\uD83D\uDEA8",
                title: "Never Miss a Real Emergency",
                body: "Burst pipe at 2 AM? Calltide detects urgency, flags it, and offers to connect the caller directly to your cell. You decide what's worth waking up for.",
              },
              {
                icon: "\uD83D\uDCAC",
                title: "Automatic Follow-Up That Closes",
                body: "Missed call auto-texts, appointment reminders, and Google review requests after the job's done — all sent automatically. More 5-star reviews, less admin work.",
              },
              {
                icon: "\uD83D\uDCCA",
                title: "See Exactly What You're Getting",
                body: "Every call, every booking, every lead — visible in your dashboard. Know exactly how many jobs your AI booked this week and how much revenue it saved.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="reveal reveal-stagger glass-card rounded-xl p-12"
              >
                <span className="text-2xl">{feature.icon}</span>
                <h3 className="mt-4 text-[24px] font-bold leading-[1.3] text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-base leading-[1.7] text-[#B8C4D4]">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 6b. SOCIAL PROOF ── */}
      <Section className="bg-[#FBFBFC] px-6 py-[96px] sm:py-[160px]">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-[#6F737C]">
              By The Numbers
            </p>
            <h2 className="mt-4 text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-charcoal sm:text-[48px]">
              Built to Perform. Proven to Deliver.
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <div className="reveal reveal-stagger card-shadow card-hover rounded-xl border border-cream-border bg-white p-12 text-center">
              <p className="gold-gradient-text text-[48px] font-bold">8s</p>
              <p className="mt-2 text-base font-semibold text-charcoal">Avg. Answer Time</p>
              <p className="mt-1 text-sm leading-[1.7] text-charcoal-muted">Your phone never rings more than twice.</p>
            </div>
            <div className="reveal reveal-stagger card-shadow card-hover rounded-xl border border-cream-border bg-white p-12 text-center">
              <p className="gold-gradient-text text-[48px] font-bold">94%</p>
              <p className="mt-2 text-base font-semibold text-charcoal">Booking Rate</p>
              <p className="mt-1 text-sm leading-[1.7] text-charcoal-muted">Callers who need service get booked on the spot.</p>
            </div>
            <div className="reveal reveal-stagger card-shadow card-hover rounded-xl border border-cream-border bg-white p-12 text-center">
              <p className="gold-gradient-text text-[48px] font-bold">$16</p>
              <p className="mt-2 text-base font-semibold text-charcoal">Per Day</p>
              <p className="mt-1 text-sm leading-[1.7] text-charcoal-muted">Less than a coffee run. More than a full-time hire.</p>
            </div>
          </div>

          <div className="reveal mt-16 mx-auto max-w-2xl">
            <div className="card-shadow card-hover rounded-xl border border-cream-border bg-white p-12">
              <p className="text-lg leading-[1.7] text-charcoal-muted italic">
                &ldquo;We were missing 60% of our calls. First week with Calltide, we booked 11 jobs
                we would have lost. The Spanish line alone brought in three new families. This thing
                pays for itself before Tuesday.&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/10 text-sm font-bold text-amber">
                  MR
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal">Mike R.</p>
                  <p className="text-sm text-charcoal-muted">Owner, R&amp;R Plumbing — Austin, TX</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 7. DEMO PROOF ── */}
      <Section className="relative bg-navy px-6 py-[96px] sm:py-[160px] dark-section grain-overlay">
        <div className="glass-card-demo relative z-10 mx-auto max-w-lg rounded-xl p-10 text-center sm:p-14">
          <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-[#C8AA6E]">
            Hear It for Yourself
          </p>
          <h2 className="mt-4 text-[32px] font-bold leading-tight tracking-[-0.02em] text-white sm:text-[40px]">
            Talk to Maria Right Now
          </h2>
          <p className="mt-4 text-base leading-[1.7] text-slate-300">
            Try English. Try Spanish. Ask about a plumbing emergency,
            an AC repair, or a weekend callback. Takes 30 seconds.
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
            Talk to Our AI Now
          </button>
          <p className="mt-4 text-sm text-slate-400">
            No signup. No credit card. Or call <a href={PHONE_TEL} className="font-semibold text-amber hover:underline">{PHONE}</a>
          </p>
        </div>
      </Section>

      {/* ── 8. PRICING (Part 9: dark section) ── */}
      <Section id="pricing" className="bg-[#111317] px-6 py-[96px] sm:py-[160px] dark-section">
        <div className="mx-auto max-w-5xl">
          <h2 className="reveal text-center text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-[#E8E9EB] sm:text-[40px] lg:text-[48px]">
            The Math Is Simple
          </h2>
          <p className="mt-4 text-center text-lg text-[#A0A3A8]">
            What does it actually cost to answer your phone?
          </p>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="reveal reveal-stagger card-hover rounded-xl border border-red-900/30 border-t-4 border-t-red-500 bg-[#1A1114] p-12 text-center">
              <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-red-500">
                Missing Calls
              </p>
              <p className="mt-6 text-[40px] font-bold text-[#E8E9EB]">
                $0
              </p>
              <p className="text-sm text-[#A0A3A8]">/month</p>
              <ul className="mt-8 space-y-4 text-left text-sm text-[#A0A3A8]">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-400">&#10007;</span>
                  Most calls go unanswered
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-400">&#10007;</span>
                  Lost revenue every week
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-400">&#10007;</span>
                  Zero coverage nights/weekends
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-400">&#10007;</span>
                  No Spanish support
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-400">&#10007;</span>
                  No appointment booking
                </li>
              </ul>
              <p className="mt-8 text-xs font-semibold text-red-500">
                True cost: thousands in lost jobs every month
              </p>
            </div>

            <div className="reveal reveal-stagger card-hover rounded-xl border border-[#2A2D33] border-t-4 border-t-slate-500 bg-[#1A1D24] p-12 text-center">
              <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-[#A0A3A8]">
                Bilingual Receptionist
              </p>
              <p className="mt-6 text-[40px] font-bold text-[#E8E9EB]">
                $3,200
              </p>
              <p className="text-sm text-[#A0A3A8]">/month</p>
              <ul className="mt-8 space-y-4 text-left text-sm text-[#A0A3A8]">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#C8AA6E]">&#10003;</span>
                  Answers during business hours
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-400">&#10007;</span>
                  Off at 5pm, weekends, holidays
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-400">&#10007;</span>
                  Sick days, vacation, turnover
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-400">&#10007;</span>
                  Can only handle one call at a time
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-400">&#10007;</span>
                  $38K/year + benefits + training
                </li>
              </ul>
              <p className="mt-8 text-xs text-[#A0A3A8]">
                40 hours/week coverage only
              </p>
            </div>

            <div className="reveal reveal-stagger pricing-glow relative scale-[1.02] rounded-xl border-2 border-[#C8AA6E] border-t-4 border-t-[#C8AA6E] bg-[#1A1D0F] p-12 text-center">
              <span className="best-value-badge">MOST POPULAR</span>
              <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-[#C8AA6E]">
                Calltide
              </p>
              <p className="mt-6 text-[40px] font-bold text-[#E8E9EB]">
                $497
              </p>
              <p className="text-sm text-[#A0A3A8]">/month</p>
              <p className="mt-1 text-sm font-medium text-[#C8AA6E]">
                That&apos;s $16/day. One booked job covers the entire year.
              </p>
              <ul className="mt-8 space-y-4 text-left text-sm text-[#E8E9EB]">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#C8AA6E]">&#10003;</span>
                  24/7/365 — never misses a call
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#C8AA6E]">&#10003;</span>
                  Fluent English &amp; Spanish
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#C8AA6E]">&#10003;</span>
                  Books appointments automatically
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#C8AA6E]">&#10003;</span>
                  Handles unlimited simultaneous calls
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#C8AA6E]">&#10003;</span>
                  No sick days, no training, no turnover
                </li>
              </ul>
              <p className="mt-8 text-xs font-semibold text-[#C8AA6E]">
                One booked job pays for the entire month
              </p>
            </div>
          </div>

          <div className="reveal mt-14 text-center">
            <a
              href={BOOKING_URL}
              className="cta-gold cta-shimmer inline-flex items-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-amber/20"
            >
              Book Your Setup Call &rarr;
            </a>
            <p className="mt-4 text-sm text-[#A0A3A8]">
              30-minute call. We handle everything from there.
            </p>
          </div>
        </div>
      </Section>

      {/* ── 9. GUARANTEE (Part 9: dark section) ── */}
      <Section className="bg-[#111317] px-6 py-[96px] sm:py-[160px] dark-section">
        <div className="mx-auto max-w-3xl">
          <div className="reveal rounded-xl border border-[#2A2D33] border-l-[6px] border-l-[#C8AA6E] bg-[#1A1D24] p-10 sm:p-14">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C8AA6E]/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8AA6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-[#C8AA6E]">
                Zero-Risk Guarantee
              </p>
            </div>
            <h2 className="mt-6 text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-[#E8E9EB] sm:text-[40px]">
              Try Calltide for 30 Days.
              <br />
              If It Doesn&apos;t Book, You Don&apos;t Pay.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-[1.7] text-[#A0A3A8]">
              If your AI receptionist doesn&apos;t book at least{" "}
              <span className="font-bold text-[#C8AA6E]">5 appointments</span> in
              your first 30 days, we refund your first month. No questions
              asked. No long-term contracts. Cancel anytime.
            </p>
          </div>
        </div>
      </Section>

      {/* ── 10. FAQ ── */}
      <Section id="faq" className="relative bg-[#FBFBFC] px-6 py-[96px] sm:py-[160px] overflow-hidden">
        <div className="mx-auto max-w-3xl">
          <h2 className="reveal text-center text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-charcoal sm:text-[48px]">
            Questions We Hear
          </h2>
          <p className="mt-4 text-center text-lg text-charcoal-muted">
            Straight answers, no runaround.
          </p>
          <div className="reveal mt-14">
            <FAQ />
          </div>
        </div>
      </Section>

      {/* ── 11. FINAL CTA ── */}
      <Section className="relative bg-navy px-6 py-[96px] sm:py-[160px] overflow-hidden dark-section grain-overlay">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="reveal text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-white sm:text-[40px] lg:text-[48px]">
            Your Competitors Are Still
            <br />
            Sending Calls to <span className="text-[#EF4444]">Voicemail</span>.
          </h2>

          <a
            href={BOOKING_URL}
            className="cta-gold cta-shimmer pulse-ring group mt-12 inline-flex items-center gap-2 rounded-lg px-10 py-4 text-lg font-semibold text-white"
          >
            Book Your Setup Call
            <span className="transition-transform group-hover:translate-x-0.5">
              &rarr;
            </span>
          </a>

          <p className="mt-8 text-slate-400">
            Or hear the AI yourself right now:
          </p>
          <a
            href={PHONE_TEL}
            className="mt-2 inline-block text-[28px] font-bold text-white transition hover:text-amber"
          >
            {PHONE}
          </a>
        </div>
      </Section>

      {/* ── 12. FOOTER ── */}
      <footer className="bg-charcoal px-6 py-16">
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
                The AI front office for home service businesses.
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
              Built in Texas 🤠
            </p>
          </div>
        </div>
      </footer>

      <div className="h-16 md:hidden" />
    </div>
  );
}
