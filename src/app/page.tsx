"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const VoiceChat = dynamic(() => import("@/components/voice-chat"), { ssr: false });

const PHONE = "(830) 521-7133";
const PHONE_TEL = "tel:+18305217133";
const BOOKING_URL = "https://cal.com/calltide/onboarding";

/* ───────── Intersection Observer for scroll reveals ───────── */

function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            e.target.querySelectorAll(".fade-up").forEach((child) =>
              child.classList.add("visible"),
            );
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function Section({
  children,
  className = "",
  id,
  stagger = false,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  stagger?: boolean;
}) {
  const ref = useFadeUp();
  return (
    <section
      ref={ref}
      id={id}
      className={`fade-up ${stagger ? "stagger-children" : ""} ${className}`}
    >
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
    a: "One booked job covers the entire month. If Calltide books just one appointment you would have missed, it's paid for itself. Most of our clients see 5-10 additional bookings per month from calls they were previously missing — that's $1,000-$5,000 in revenue they were leaving on the table.",
  },
  {
    q: "What if I already have a receptionist?",
    a: "Great — Calltide covers the other 128 hours per week they're not working. Nights, weekends, lunch breaks, sick days, holidays. Your receptionist handles business hours; Calltide handles everything else.",
  },
  {
    q: "How does it know which language to speak?",
    a: "It listens to the caller's first few words and responds in that language automatically. If they switch mid-conversation — even to Spanglish — it follows seamlessly.",
  },
  {
    q: "How long does setup take?",
    a: "48 hours from signing to your phone being answered by AI. We configure everything — your services, hours, pricing, calendar, service area. You don't touch a thing.",
  },
  {
    q: "What about my existing phone number?",
    a: "You keep your number. We set up call forwarding so calls route through Calltide first. Takes 5 minutes.",
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
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between py-5 text-left"
          >
            <span className="pr-4 text-lg font-semibold text-charcoal">
              {faq.q}
            </span>
            <span
              className={`shrink-0 text-xl font-bold transition-transform duration-300 ${
                openIndex === i ? "text-amber rotate-0" : "text-charcoal-light rotate-0"
              }`}
            >
              {openIndex === i ? "\u2212" : "+"}
            </span>
          </button>
          <div className={`faq-answer ${openIndex === i ? "open" : ""}`}>
            <div>
              <p className="pb-5 text-[17px] leading-relaxed text-charcoal-muted">{faq.a}</p>
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
  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-cream-border bg-white/95 backdrop-blur-sm px-4 py-3 md:hidden transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex gap-2">
        <a
          href={PHONE_TEL}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber px-4 py-3.5 text-sm font-bold text-white"
        >
          Call Demo
        </a>
        <button
          onClick={onTryInBrowser}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-navy px-4 py-3.5 text-sm font-bold text-navy"
        >
          Try in Browser
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
        className="exit-card w-full max-w-md rounded-2xl border border-cream-border bg-white p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-serif text-2xl text-charcoal sm:text-3xl">
          Wait — hear it before you go.
        </p>
        <p className="mt-3 text-charcoal-muted">
          Experience Calltide answering as a real business.
          Takes 30 seconds. No signup needed.
        </p>
        <button
          onClick={() => { setShow(false); onTryInBrowser(); }}
          className="cta-shimmer mt-6 inline-flex items-center gap-2 rounded-xl bg-amber px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-150 hover:bg-amber-dark hover:scale-[1.02]"
        >
          Try It in Your Browser
        </button>
        <p className="mt-3 text-sm text-charcoal-light">
          or call <a href={PHONE_TEL} className="text-amber hover:underline">{PHONE}</a>
        </p>
        <button
          onClick={() => setShow(false)}
          className="mt-4 block w-full text-sm text-charcoal-light hover:text-charcoal transition-colors"
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
    { name: "Jennifer K.", time: "1:08 PM", status: "Booked", service: "Showing", lang: "EN" },
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
      {/* Stats row */}
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

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const scrolled = useScrolled();

  return (
    <div className="relative overflow-x-hidden">
      {showVoiceChat && <VoiceChat onClose={() => setShowVoiceChat(false)} />}
      <MobileCTA onTryInBrowser={() => setShowVoiceChat(true)} />
      <ExitIntent onTryInBrowser={() => setShowVoiceChat(true)} />

      {/* ── 0. TOP BAR ── */}
      <div className="bg-navy px-4 py-2.5 text-center">
        <a
          href="#pricing"
          className="inline-flex items-center gap-2 text-sm font-medium text-amber transition hover:text-amber-light"
        >
          <span className="pulse-dot">&bull;</span>
          Founding member pricing: $297/mo locked — 3 of 5 spots remaining
          <span className="hidden sm:inline">&rarr; Claim yours</span>
        </a>
      </div>

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
            <a href="#how-it-works" className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">
              How It Works
            </a>
            <a href="#features" className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">
              What You Get
            </a>
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
              className="hidden items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-navy-light sm:inline-flex"
            >
              Call Demo: {PHONE}
            </a>
          </div>
        </div>
      </nav>

      {/* ── 2. HERO — Split Layout ── */}
      <section className="relative overflow-hidden bg-cream grain-overlay">
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-5">
            {/* Left — Text (60%) */}
            <div className="md:col-span-3">
              <p className="text-sm font-semibold uppercase tracking-widest text-amber">
                The Front Office for Your Business
              </p>
              <h1 className="mt-4 font-serif text-[42px] leading-[1.08] text-charcoal sm:text-[52px] lg:text-[60px]">
                Answer Every Lead
                <br />
                Like You Have a Full-Time Receptionist
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-charcoal-muted">
                Your AI picks up in English or Spanish — 24/7. Qualifies the caller,
                books the appointment, and texts you the details before you set your
                tools down. Less than $17/day.
              </p>
              <p className="mt-3 font-serif text-lg italic text-amber">
                Cada llamada contestada. Cada trabajo agendado.
              </p>

              {/* CTA Row */}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  onClick={() => setShowVoiceChat(true)}
                  className="cta-shimmer inline-flex items-center justify-center gap-2 rounded-xl bg-amber px-8 py-4 text-base font-semibold text-white shadow-lg shadow-amber/20 transition-all duration-150 hover:bg-amber-dark hover:shadow-amber/30 hover:scale-[1.02]"
                >
                  See It In Action &rarr;
                </button>
                <a
                  href={PHONE_TEL}
                  className="text-center text-sm font-medium text-charcoal-muted transition hover:text-charcoal sm:text-left"
                >
                  Or call the demo: <span className="font-semibold text-charcoal">{PHONE}</span>
                </a>
              </div>
              <p className="mt-3 text-[13px] text-charcoal-light">
                No signup needed. Talk to our AI in your browser right now.
              </p>
            </div>

            {/* Right — Dashboard Preview (40%) */}
            <div className="md:col-span-2">
              <div className="mx-auto w-[280px] rounded-[2.5rem] border-[6px] border-slate-700 bg-black p-2 shadow-[0_24px_64px_rgba(27,42,74,0.2)]">
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
      <Section className="bg-navy px-6 py-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 md:flex-row md:gap-0">
          {[
            { value: "24/7", label: "Every call answered, nights, weekends, holidays" },
            { value: "2 Languages", label: "English and Spanish, including Spanglish" },
            { value: "< 60 Seconds", label: "From ring to booked appointment" },
          ].map((stat, i) => (
            <div key={stat.value} className="flex items-center gap-0">
              {i > 0 && (
                <div className="mx-8 hidden h-12 w-px bg-amber/30 md:block" />
              )}
              <div className="text-center">
                <p className="font-serif text-3xl text-white sm:text-4xl">
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

      {/* ── 4. PROBLEM — "The Cost of a Missed Call" ── */}
      <Section id="problem" className="bg-white px-6 py-24" stagger>
        <div className="mx-auto max-w-5xl">
          <h2 className="fade-up text-center font-serif text-4xl text-charcoal sm:text-5xl">
            Every Missed Call Is a Job
            <br />
            Your Competitor Gets
          </h2>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="fade-up rounded-2xl bg-cream-dark p-8 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <p className="font-serif text-xl text-charcoal">
                Tuesday, 2:14 PM.
              </p>
              <p className="mt-3 text-[17px] leading-relaxed text-charcoal-muted">
                A homeowner in Stone Oak has a burst pipe. She calls three
                plumbers. Two go to voicemail. The third answers and gets a
                $1,200 job. Which plumber were you?
              </p>
            </div>

            <div className="fade-up rounded-2xl bg-cream-dark p-8 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <p className="font-serif text-xl text-charcoal">
                &ldquo;Hola, necesito ayuda...&rdquo;
              </p>
              <p className="mt-3 text-[17px] leading-relaxed text-charcoal-muted">
                A Spanish-speaking family needs their AC fixed. Your voicemail is
                in English. They don&apos;t leave a message. They call the
                company with the bilingual receptionist. You never even know they
                called.
              </p>
            </div>

            <div className="fade-up rounded-2xl bg-cream-dark p-8 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <p className="font-serif text-xl text-charcoal">
                Saturday, 11:30 AM.
              </p>
              <p className="mt-3 text-[17px] leading-relaxed text-charcoal-muted">
                A couple drives by a house for sale and calls the agent&apos;s
                number on the sign. No answer. They call the next listing. By
                Monday, they&apos;ve scheduled three showings with your
                competitor.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="font-serif text-3xl text-amber sm:text-4xl">
              The average service business misses 62% of incoming calls.
            </p>
            <p className="mt-3 text-lg text-charcoal-muted">
              That&apos;s $2,000+ per week walking out your door.
            </p>
          </div>
        </div>
      </Section>

      {/* ── 5. SOLUTION — "How It Works" ── */}
      <Section id="how-it-works" className="bg-cream px-6 py-24" stagger>
        <div className="mx-auto max-w-5xl">
          <div className="fade-up text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber">
              How It Works
            </p>
            <h2 className="mt-3 font-serif text-4xl text-charcoal sm:text-5xl">
              Your Phone Never Goes to Voicemail Again
            </h2>
          </div>

          <div className="mt-20 grid gap-12 md:grid-cols-5">
            {/* Steps — left (3 cols) */}
            <div className="space-y-12 md:col-span-3">
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
                <div key={step.num} className="fade-up flex gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber text-lg font-bold text-white">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-charcoal">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[17px] leading-relaxed text-charcoal-muted">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual — right (2 cols) */}
            <div className="hidden md:col-span-2 md:flex md:items-center">
              <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-cream-border bg-white p-8 shadow-sm">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber/10">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4910A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </div>
                <p className="text-center font-serif text-xl text-charcoal">Ring &rarr; Answer &rarr; Book &rarr; Text</p>
                <p className="text-center text-sm text-charcoal-muted">Every call, handled automatically.</p>
              </div>
            </div>
          </div>

          <p className="fade-up mt-16 text-center text-lg italic text-charcoal-muted">
            All while you&apos;re on a job, eating dinner, or sleeping.
          </p>
        </div>
      </Section>

      {/* ── 6. DEMO CTA ── */}
      <Section className="bg-navy px-6 py-24">
        <div className="mx-auto max-w-lg rounded-2xl bg-cream p-10 text-center shadow-2xl sm:p-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber">
            Don&apos;t Take Our Word for It
          </p>
          <h2 className="mt-3 font-serif text-3xl text-charcoal sm:text-4xl">
            Talk to Maria Right Now
          </h2>
          <p className="mt-3 text-charcoal-muted">
            Try English. Try Spanish. Ask about a plumbing emergency.
            Takes 30 seconds.
          </p>
          <button
            onClick={() => setShowVoiceChat(true)}
            className="cta-shimmer mt-8 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-amber px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-150 hover:bg-amber-dark hover:scale-[1.02] sm:w-auto"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            Talk to Our AI Now
          </button>
          <p className="mt-4 text-[15px] text-charcoal-light">
            No signup. No credit card. Or call <a href={PHONE_TEL} className="font-semibold text-amber hover:underline">{PHONE}</a>
          </p>
        </div>
      </Section>

      {/* ── 7. FEATURES — "What You Actually Get" ── */}
      <Section id="features" className="bg-white px-6 py-24" stagger>
        <div className="mx-auto max-w-5xl">
          <h2 className="fade-up text-center font-serif text-3xl text-charcoal sm:text-4xl lg:text-5xl">
            Built for How Service Businesses Actually Work
          </h2>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                className="fade-up rounded-2xl border border-cream-border bg-cream p-7 transition-shadow duration-200 hover:shadow-md"
              >
                <span className="text-2xl">{feature.icon}</span>
                <h3 className="mt-3 font-serif text-lg text-charcoal">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-charcoal-muted">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>

        </div>
      </Section>

      {/* ── 7b. TESTIMONIALS ── */}
      <Section className="bg-cream px-6 py-24" stagger>
        <div className="mx-auto max-w-5xl">
          <h2 className="fade-up text-center font-serif text-3xl text-charcoal sm:text-4xl lg:text-5xl">
            What Business Owners Are Saying
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <div className="fade-up rounded-2xl border border-cream-border bg-white p-8 transition-shadow duration-200 hover:shadow-md">
              <p className="text-[17px] leading-relaxed text-charcoal-muted">
                &ldquo;I used to lose 3&ndash;4 jobs a week to voicemail. First month with Calltide, my bookings went up 40%. The Spanish callers alone made it worth it.&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/10 font-serif text-lg text-amber">
                  M
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal">Marco R.</p>
                  <p className="text-xs text-charcoal-light">Plumbing Contractor, San Antonio</p>
                </div>
              </div>
            </div>

            <div className="fade-up rounded-2xl border border-cream-border bg-white p-8 transition-shadow duration-200 hover:shadow-md">
              <p className="text-[17px] leading-relaxed text-charcoal-muted">
                &ldquo;My phone rings while I&apos;m on a roof. I can&apos;t answer it. Now I get a text with the caller&apos;s name, what they need, and the appointment&apos;s already booked. It&apos;s like having a secretary.&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/10 font-serif text-lg text-navy">
                  D
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal">David L.</p>
                  <p className="text-xs text-charcoal-light">Roofing &amp; General Contractor</p>
                </div>
              </div>
            </div>

            <div className="fade-up rounded-2xl border border-cream-border bg-white p-8 transition-shadow duration-200 hover:shadow-md">
              <p className="text-[17px] leading-relaxed text-charcoal-muted">
                &ldquo;I was skeptical about AI answering my phone. Called the demo, tried to trip it up in Spanish, and it handled everything perfectly. Signed up the same day.&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/10 font-serif text-lg text-amber">
                  J
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal">Jennifer K.</p>
                  <p className="text-xs text-charcoal-light">Real Estate Agent, Austin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 8. COMPARISON — "The Math Is Simple" ── */}
      <Section className="bg-cream px-6 py-24" stagger>
        <div className="mx-auto max-w-5xl">
          <h2 className="fade-up text-center font-serif text-3xl text-charcoal sm:text-4xl lg:text-5xl">
            The Math Is Simple
          </h2>
          <p className="fade-up mt-3 text-center text-lg text-charcoal-muted">
            What does it actually cost to answer your phone?
          </p>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {/* Missing calls */}
            <div className="fade-up rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
                Missing Calls
              </p>
              <p className="mt-4 font-serif text-4xl text-charcoal">
                $0
              </p>
              <p className="text-sm text-charcoal-light">/month</p>
              <ul className="mt-6 space-y-3 text-left text-sm text-charcoal-muted">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-400">&#10007;</span>
                  62% of calls go unanswered
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-400">&#10007;</span>
                  $2K+/week in lost revenue
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
              <p className="mt-6 text-xs font-semibold text-red-500">
                True cost: $8K&ndash;10K/mo in lost jobs
              </p>
            </div>

            {/* Receptionist */}
            <div className="fade-up rounded-2xl border border-cream-border bg-white p-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-charcoal-light">
                Bilingual Receptionist
              </p>
              <p className="mt-4 font-serif text-4xl text-charcoal">
                $3,200
              </p>
              <p className="text-sm text-charcoal-light">/month</p>
              <ul className="mt-6 space-y-3 text-left text-sm text-charcoal-muted">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber">&#10003;</span>
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
              <p className="mt-6 text-xs text-charcoal-light">
                40 hours/week coverage only
              </p>
            </div>

            {/* Calltide */}
            <div className="fade-up rounded-2xl border-2 border-amber bg-white p-8 text-center shadow-lg shadow-amber/10">
              <p className="text-sm font-semibold uppercase tracking-wider text-amber">
                Calltide
              </p>
              <p className="mt-4 font-serif text-4xl text-charcoal">
                $497
              </p>
              <p className="text-sm text-charcoal-light">/month</p>
              <ul className="mt-6 space-y-3 text-left text-sm text-charcoal">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber">&#10003;</span>
                  24/7/365 — never misses a call
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber">&#10003;</span>
                  Fluent English &amp; Spanish
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber">&#10003;</span>
                  Books appointments automatically
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber">&#10003;</span>
                  Handles unlimited simultaneous calls
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber">&#10003;</span>
                  No sick days, no training, no turnover
                </li>
              </ul>
              <p className="mt-6 text-xs font-semibold text-amber">
                That&apos;s $17/day
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 9. GUARANTEE ── */}
      <Section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border-l-4 border-l-navy bg-cream p-10 sm:p-14">
            <p className="font-serif text-lg uppercase tracking-widest text-amber">
              Zero-Risk Guarantee
            </p>
            <h2 className="mt-4 font-serif text-3xl text-charcoal sm:text-4xl">
              Try Calltide for 30 Days.
              <br />
              If It Doesn&apos;t Book, You Don&apos;t Pay.
            </h2>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-charcoal-muted">
              If your AI receptionist doesn&apos;t book at least 5 appointments in
              your first 30 days, we refund your first month. No questions
              asked. No long-term contracts. Cancel anytime.
            </p>
            <p className="mt-6 font-serif text-xl italic text-amber">
              Sin riesgo. Sin contratos. Cancela cuando quieras.
            </p>
          </div>
        </div>
      </Section>

      {/* ── 10. PRICING ── */}
      <Section id="pricing" className="bg-navy px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-4xl text-cream sm:text-5xl">
            $17/Day to Never Miss Another Job
          </h2>
          <p className="mt-3 text-lg text-slate-400">
            One booked job pays for the entire month.
          </p>

          <div className="mx-auto mt-12 max-w-md rounded-2xl bg-cream p-10 text-left shadow-2xl">
            <div className="text-center">
              <p className="font-serif text-5xl text-charcoal sm:text-6xl">
                $497
                <span className="text-2xl font-normal text-charcoal-light">/mo</span>
              </p>
              <p className="mt-1 text-sm text-charcoal-light">
                + $1,500 one-time setup &amp; configuration
              </p>
            </div>

            <ul className="mt-8 space-y-3 text-sm text-charcoal">
              {[
                "AI receptionist — English + Spanish, 24/7",
                "Appointment booking on your calendar",
                "SMS confirmations & reminders",
                "Missed call auto-texts",
                "Follow-up & review request sequences",
                "Owner dashboard with full call history",
                "Outbound campaign support",
                "Dedicated setup — we configure everything",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 text-amber">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>

            <a
              href={BOOKING_URL}
              className="cta-shimmer mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber px-8 py-4 text-base font-semibold text-white shadow-lg shadow-amber/20 transition-all duration-150 hover:bg-amber-dark hover:scale-[1.02]"
            >
              Get Started &rarr;
            </a>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber-glow px-5 py-2 text-sm font-semibold text-amber">
            <span className="pulse-dot">&bull;</span>
            Founding member pricing: $297/mo locked — 3 of 5 spots remaining
          </div>
        </div>
      </Section>

      {/* ── 11. FAQ ── */}
      <Section id="faq" className="relative bg-cream px-6 py-24 overflow-hidden">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-serif text-4xl text-charcoal sm:text-5xl">
            &ldquo;Yeah, But...&rdquo;
          </h2>
          <p className="mt-3 text-center text-lg text-charcoal-muted">
            We hear you. Here are the real answers.
          </p>
          <div className="mt-12">
            <FAQ />
          </div>
        </div>
      </Section>

      {/* ── 11b. CLIENT PORTAL ACCESS ── */}
      <Section className="bg-navy px-6 py-14">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <p className="font-serif text-xl text-white">
              Already a Calltide client?
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Access your dashboard, call history, and appointments.
            </p>
          </div>
          <a
            href="/dashboard/login"
            className="inline-flex items-center gap-2 rounded-xl border border-cream/20 px-6 py-3 text-sm font-semibold text-cream transition-all duration-150 hover:bg-cream/10 hover:border-cream/40"
          >
            Go to Client Portal &rarr;
          </a>
        </div>
      </Section>

      {/* ── 12. FINAL CTA ── */}
      <Section className="bg-navy-dark px-6 py-24 overflow-hidden">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl text-white sm:text-4xl lg:text-5xl">
            Your Competitors Are Still
            <br />
            Sending Calls to Voicemail.
          </h2>
          <p className="mt-3 font-serif text-lg italic text-amber">
            Tus competidores siguen mandando llamadas al buzón de voz.
          </p>

          <a
            href={BOOKING_URL}
            className="cta-shimmer group mt-10 inline-flex items-center gap-2 rounded-xl bg-amber px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-amber/20 transition-all duration-150 hover:bg-amber-dark hover:shadow-amber/30 hover:scale-[1.02]"
          >
            Stop Losing Jobs
            <span className="transition-transform group-hover:translate-x-0.5">
              &rarr;
            </span>
          </a>

          <p className="mt-6 text-slate-300">
            Or call the demo right now:
          </p>
          <a
            href={PHONE_TEL}
            className="mt-1 inline-block font-serif text-2xl text-white transition hover:text-amber"
          >
            {PHONE}
          </a>
        </div>
      </Section>

      {/* ── 13. FOOTER ── */}
      <footer className="bg-charcoal px-6 py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center text-sm">
          <img
            src="/images/logo.webp"
            alt="Calltide"
            className="h-7 w-auto brightness-0 invert opacity-60"
          />
          <p className="text-cream/50">Built in San Antonio, TX</p>
          <p className="text-cream/40">
            &copy; {new Date().getFullYear()} Calltide. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Bottom padding for mobile sticky CTA */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
