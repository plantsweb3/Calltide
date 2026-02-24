"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const VoiceChat = dynamic(() => import("@/components/voice-chat"), { ssr: false });

const PHONE = "(830) 521-7133";
const PHONE_TEL = "tel:+18305217133";
const BOOKING_URL = "https://cal.com";

/* ───────── Intersection Observer for scroll reveals ───────── */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            e.target.querySelectorAll(".reveal").forEach((child) =>
              child.classList.add("visible"),
            );
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
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
  const ref = useReveal();
  return (
    <section
      ref={ref}
      id={id}
      className={`reveal ${stagger ? "reveal-stagger" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

/* ───────── Waveform ───────── */

function Waveform() {
  const bars = 48;
  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center gap-[3px] opacity-20 pointer-events-none overflow-hidden"
    >
      {Array.from({ length: bars }).map((_, i) => {
        const height = 20 + Math.sin(i * 0.4) * 40 + Math.random() * 30;
        const delay = i * 0.06;
        return (
          <div
            key={i}
            className="wave-bar w-[3px] rounded-full bg-amber"
            style={{
              height: `${height}px`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
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
    a: "Right now, 100% of the calls you miss go to voicemail — and most of those callers never call back. Calltide answers every single one. Even if the AI handles a call imperfectly, a answered call beats a missed call every time. Plus, you get a full transcript of every conversation so nothing falls through the cracks.",
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
    <div className="mx-auto max-w-2xl divide-y divide-navy-border">
      {faqs.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between py-5 text-left"
          >
            <span className="pr-4 text-lg font-semibold text-white">
              {faq.q}
            </span>
            <span
              className={`shrink-0 text-xl text-amber transition-transform duration-300 ${
                openIndex === i ? "rotate-45" : ""
              }`}
            >
              +
            </span>
          </button>
          <div className={`faq-answer ${openIndex === i ? "open" : ""}`}>
            <div>
              <p className="pb-5 leading-relaxed text-slate-400">{faq.a}</p>
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
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-navy-border bg-navy/95 backdrop-blur-sm px-4 py-3 md:hidden transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex gap-2">
        <a
          href={PHONE_TEL}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber px-4 py-3.5 text-sm font-bold text-navy"
        >
          Call Demo
        </a>
        <button
          onClick={onTryInBrowser}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-amber px-4 py-3.5 text-sm font-bold text-amber"
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
      className="exit-overlay fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={() => setShow(false)}
    >
      <div
        className="exit-card w-full max-w-md rounded-2xl border border-navy-border bg-navy-card p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-2xl font-bold text-white sm:text-3xl">
          Wait — hear it before you go.
        </p>
        <p className="mt-3 text-slate-400">
          Experience Calltide answering as a real plumbing company.
          Takes 30 seconds. No signup needed.
        </p>
        <button
          onClick={() => { setShow(false); onTryInBrowser(); }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber px-8 py-4 text-lg font-bold text-navy shadow-lg shadow-amber/20 transition hover:bg-amber-dark"
        >
          Try It in Your Browser
        </button>
        <p className="mt-3 text-sm text-slate-500">
          or call <a href={PHONE_TEL} className="text-amber hover:underline">{PHONE}</a>
        </p>
        <button
          onClick={() => setShow(false)}
          className="mt-4 block w-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}

/* ───────── Page ───────── */

export default function LandingPage() {
  const [showVoiceChat, setShowVoiceChat] = useState(false);

  return (
    <div className="relative overflow-x-hidden">
      {showVoiceChat && <VoiceChat onClose={() => setShowVoiceChat(false)} />}
      <MobileCTA onTryInBrowser={() => setShowVoiceChat(true)} />
      <ExitIntent onTryInBrowser={() => setShowVoiceChat(true)} />

      {/* ── HEADER ── */}
      <header className="relative z-20 bg-amber px-6 py-3">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <img
            src="/images/logo.webp"
            alt="Calltide"
            className="h-7 w-auto sm:h-9"
          />
          <a
            href={PHONE_TEL}
            className="hidden items-center gap-2 rounded-lg bg-navy px-5 py-2 text-sm font-bold text-white transition hover:bg-navy-light sm:inline-flex"
          >
            Call Demo: {PHONE}
          </a>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 text-center">
        {/* Hero image — mobile: above content, desktop: background */}
        <div className="absolute inset-0 hidden md:block">
          <img
            src="/images/hero-plumber.webp"
            alt="Plumber kneeling under kitchen sink with phone ringing on floor showing incoming call he cannot answer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0A1628]/75" />
        </div>
        <div className="w-full pt-12 pb-4 md:hidden">
          <div className="mx-auto max-w-sm overflow-hidden rounded-2xl" style={{ aspectRatio: "864/1184" }}>
            <img
              src="/images/hero-plumber.webp"
              alt="Plumber kneeling under kitchen sink with phone ringing on floor showing incoming call he cannot answer"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-3xl py-12 md:py-24">
          <h1 className="font-display text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Stop Losing Jobs
            <br />
            to Voicemail
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            Your AI receptionist answers every call in English and Spanish, 24/7.
            Books the appointment. Texts you the details. All for less than $17/day.
          </p>

          <p className="mt-3 font-display text-lg italic text-amber">
            Cada llamada perdida es un trabajo para tu competencia.
          </p>

          {/* Dual CTA — browser demo + phone */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={() => setShowVoiceChat(true)}
              className="group inline-flex items-center gap-2 rounded-xl bg-amber px-10 py-4 text-lg font-bold text-navy shadow-lg shadow-amber/20 transition hover:bg-amber-dark hover:shadow-amber/30"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              Try It Live
            </button>
            <a
              href={PHONE_TEL}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 px-8 py-4 text-lg font-bold text-white transition hover:border-white/40 hover:bg-white/5"
            >
              Or Call {PHONE}
            </a>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            No signup needed — talk to our AI in your browser right now
          </p>

          <div className="mt-12">
            <a
              href={PHONE_TEL}
              className="font-display text-3xl font-bold tracking-wider text-white transition hover:text-amber sm:text-4xl"
            >
              {PHONE}
            </a>
            <p className="mt-2 text-sm text-slate-400">
              Tap to call. Hear your AI receptionist in action.
            </p>
          </div>
        </div>
      </section>

      {/* ── PAIN AMPLIFICATION ── */}
      <Section id="problem" className="px-6 py-24" stagger>
        <div className="mx-auto max-w-5xl">
          <h2 className="reveal font-display text-center text-4xl font-bold text-white sm:text-5xl">
            Every Missed Call Is a Job
            <br />
            Your Competitor Gets
          </h2>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="reveal rounded-2xl border border-navy-border bg-navy-card p-8">
              <p className="font-display text-xl font-bold text-white">
                Tuesday, 2:14 PM.
              </p>
              <p className="mt-3 leading-relaxed text-slate-400">
                A homeowner in Stone Oak has a burst pipe. She calls three
                plumbers. Two go to voicemail. The third answers and gets a
                $1,200 job. Which plumber were you?
              </p>
            </div>

            <div className="reveal rounded-2xl border border-navy-border bg-navy-card p-8">
              <p className="font-display text-xl font-bold text-white">
                &ldquo;Hola, necesito ayuda...&rdquo;
              </p>
              <p className="mt-3 leading-relaxed text-slate-400">
                A Spanish-speaking family needs their AC fixed. Your voicemail is
                in English. They don&apos;t leave a message. They call the
                company with the bilingual receptionist. You never even know they
                called.
              </p>
            </div>

            <div className="reveal rounded-2xl border border-navy-border bg-navy-card p-8">
              <p className="font-display text-xl font-bold text-white">
                Sunday, 9:47 PM.
              </p>
              <p className="mt-3 leading-relaxed text-slate-400">
                A water heater dies. They need someone first thing Monday
                morning. Your phone goes to voicemail. By Monday at 7 AM,
                they&apos;ve already booked someone else.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="font-display text-3xl font-bold text-amber sm:text-4xl">
              The average small business misses 62% of incoming calls.
            </p>
            <p className="mt-3 text-lg text-slate-400">
              That&apos;s $2,000+ per week walking out your door.
            </p>
          </div>
        </div>
      </Section>

      {/* ── TRANSITION IMAGE — problem to solution ── */}
      <Section className="px-6 py-12">
        <div className="mx-auto max-w-md overflow-hidden rounded-2xl" style={{ aspectRatio: "800/1067" }}>
          <img
            src="/images/plumber-van-phone.webp"
            loading="lazy"
            alt="Plumber leaning against work van smiling while checking phone notification from Calltide"
            className="h-full w-full object-cover"
          />
        </div>
      </Section>

      {/* ── SOLUTION — HOW IT WORKS ── */}
      <Section id="how-it-works" className="px-6 py-24" stagger>
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center">
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
              Here&apos;s What Happens Instead
            </h2>
            <p className="mt-2 font-display text-xl italic text-amber">
              Así es como funciona
            </p>
          </div>

          <div className="relative mt-20 grid gap-12 md:grid-cols-3">
            {/* Connecting line */}
            <div
              aria-hidden
              className="absolute top-[40px] left-[16.67%] right-[16.67%] hidden h-px bg-gradient-to-r from-amber/0 via-amber/40 to-amber/0 md:block"
            />

            {/* Step 1 — Customer Calls */}
            <div className="reveal relative text-center">
              <div className="relative mx-auto w-fit">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber transition-transform duration-500 ease-out hover:scale-105 md:h-20 md:w-20">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="md:w-10 md:h-10" aria-hidden>
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.5 2a8.38 8.38 0 015.7 2.3A8.38 8.38 0 0122.5 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M14.5 6a4.5 4.5 0 014 4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="absolute -top-1.5 -left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#1B2A4A] text-xs font-bold text-white shadow">
                  1
                </div>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-white">
                Customer Calls
              </h3>
              <p className="mt-3 leading-relaxed text-slate-400">
                Your phone rings. Calltide answers instantly — in English or
                Spanish, detected from the caller&apos;s first words. No hold music.
                No voicemail. A real conversation.
              </p>
            </div>

            {/* Step 2 — AI Books the Job */}
            <div className="reveal relative text-center">
              <div className="relative mx-auto w-fit">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber transition-transform duration-500 ease-out hover:scale-105 md:h-20 md:w-20">
                  <svg width="34" height="34" viewBox="0 0 34 34" fill="none" className="md:w-10 md:h-10" aria-hidden>
                    {/* Calendar body */}
                    <rect x="3" y="6" width="28" height="24" rx="3" fill="white"/>
                    {/* Calendar header bar */}
                    <rect x="3" y="6" width="28" height="8" rx="3" fill="#1B2A4A"/>
                    {/* Hanging tabs */}
                    <rect x="10" y="3" width="2.5" height="6" rx="1.25" fill="white"/>
                    <rect x="21.5" y="3" width="2.5" height="6" rx="1.25" fill="white"/>
                    {/* Checkmark */}
                    <path d="M11 20L15.5 24.5L24 16" stroke="#D4910A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="absolute -top-1.5 -left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#1B2A4A] text-xs font-bold text-white shadow">
                  2
                </div>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-white">
                AI Books the Job
              </h3>
              <p className="mt-3 leading-relaxed text-slate-400">
                Gets their name, address, what they need, and how urgent it is.
                Checks your calendar. Books the appointment. Sends them a
                confirmation text.
              </p>
            </div>

            {/* Step 3 — You Get a Text */}
            <div className="reveal relative text-center">
              <div className="relative mx-auto w-fit">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber transition-transform duration-500 ease-out hover:scale-105 md:h-20 md:w-20">
                  <svg width="34" height="34" viewBox="0 0 34 34" fill="none" className="md:w-10 md:h-10" aria-hidden>
                    {/* Chat bubble */}
                    <path d="M5 7C5 5.34 6.34 4 8 4H26C27.66 4 29 5.34 29 7V21C29 22.66 27.66 24 26 24H13L7 29V24H8C6.34 24 5 22.66 5 21V7Z" fill="white"/>
                    {/* Text lines */}
                    <rect x="10" y="10" width="14" height="2" rx="1" fill="#1B2A4A"/>
                    <rect x="10" y="15" width="10" height="2" rx="1" fill="#1B2A4A"/>
                    <rect x="10" y="20" width="6" height="2" rx="1" fill="#1B2A4A"/>
                    {/* Notification dot */}
                    <circle cx="28" cy="5" r="4" fill="#D4910A" stroke="#D4910A" strokeWidth="1"/>
                    <circle cx="28" cy="5" r="2.5" fill="white"/>
                  </svg>
                </div>
                <div className="absolute -top-1.5 -left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#1B2A4A] text-xs font-bold text-white shadow">
                  3
                </div>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-white">
                You Get a Text
              </h3>
              <p className="mt-3 leading-relaxed text-slate-400">
                Customer info, appointment details, and a full summary of the
                call — sent to your phone before you set your tools down. Show
                up, do the job, get paid.
              </p>
            </div>
          </div>

          <p className="reveal mt-16 text-center text-lg text-slate-400">
            All while you&apos;re on a job, eating dinner, or sleeping.
          </p>
        </div>
      </Section>

      {/* ── DEMO CTA (first repeat) ── */}
      <Section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl bg-amber px-8 py-16 text-center shadow-2xl shadow-amber/10 sm:px-16">
          <h2 className="font-display text-3xl font-bold text-navy sm:text-4xl lg:text-5xl">
            Don&apos;t Take Our Word For It.
            <br />
            Try It Right Now.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-navy/70">
            Talk to Calltide as it answers for a real San Antonio plumbing
            company. Try English. Try Spanish. Takes 30 seconds.
          </p>
          <button
            onClick={() => setShowVoiceChat(true)}
            className="mt-8 inline-flex items-center gap-3 rounded-xl bg-navy px-10 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-navy-light"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            Talk to Our AI Now
          </button>
          <p className="mt-4 text-sm font-medium text-navy/50">
            No signup. No credit card. Or call <a href={PHONE_TEL} className="underline">{PHONE}</a>
          </p>
        </div>
      </Section>

      {/* ── ROI COMPARISON TABLE ── */}
      <Section className="px-6 py-24" stagger>
        <div className="mx-auto max-w-5xl">
          <h2 className="reveal font-display text-center text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            The Math Is Simple
          </h2>
          <p className="reveal mt-3 text-center text-lg text-slate-400">
            What does it actually cost to answer your phone?
          </p>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {/* Missing calls */}
            <div className="reveal rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-red-400">
                Missing Calls
              </p>
              <p className="mt-4 font-display text-4xl font-bold text-white">
                $0
              </p>
              <p className="text-sm text-slate-500">/month</p>
              <ul className="mt-6 space-y-3 text-left text-sm text-slate-400">
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
              <p className="mt-6 text-xs font-semibold text-red-400">
                True cost: $8K–10K/mo in lost jobs
              </p>
            </div>

            {/* Receptionist */}
            <div className="reveal rounded-2xl border border-navy-border bg-navy-card p-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Bilingual Receptionist
              </p>
              <p className="mt-4 font-display text-4xl font-bold text-white">
                $3,200
              </p>
              <p className="text-sm text-slate-500">/month</p>
              <ul className="mt-6 space-y-3 text-left text-sm text-slate-400">
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
              <p className="mt-6 text-xs text-slate-500">
                40 hours/week coverage only
              </p>
            </div>

            {/* Calltide */}
            <div className="reveal rounded-2xl border-2 border-amber bg-navy-card p-8 text-center shadow-lg shadow-amber/5">
              <p className="text-sm font-semibold uppercase tracking-wider text-amber">
                Calltide
              </p>
              <p className="mt-4 font-display text-4xl font-bold text-white">
                $497
              </p>
              <p className="text-sm text-slate-500">/month</p>
              <ul className="mt-6 space-y-3 text-left text-sm text-slate-300">
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

      {/* ── FEATURES AS OUTCOMES ── */}
      <Section className="px-6 py-24" stagger>
        <div className="mx-auto max-w-5xl">
          <h2 className="reveal font-display text-center text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            What Calltide Actually Does for You
          </h2>

          {/* First row of features */}
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🌐",
                title: "Win the Jobs Others Can't",
                body: "40% of San Antonio residents speak Spanish at home. When they call you and hear their own language, you've already won. Calltide switches between English, Spanish, and Spanglish seamlessly.",
              },
              {
                icon: "📅",
                title: "Wake Up to a Full Schedule",
                body: "Calltide checks your calendar, finds open slots, and books the appointment — then texts you and the customer a confirmation. No phone tag. No back-and-forth.",
              },
              {
                icon: "📋",
                title: "Know Who's Calling Before You Call Back",
                body: "Every caller gets qualified: name, number, address, service needed, urgency level. You get the full brief via text. Show up prepared.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="reveal rounded-2xl border border-navy-border bg-navy-card p-7"
              >
                <span className="text-2xl">{feature.icon}</span>
                <h3 className="mt-3 font-display text-lg font-bold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>

          {/* Lifestyle images between feature rows */}
          <div className="reveal mt-8 grid gap-6 sm:grid-cols-2">
            <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: "3/4" }}>
              <img
                src="/images/landscaper-tailgate.webp"
                loading="lazy"
                alt="Young landscaper sitting on truck tailgate checking phone during break with work boots and cooler"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: "3/4" }}>
              <img
                src="/images/electrician-panel.webp"
                loading="lazy"
                alt="Electrician smiling at phone while standing next to electrical panel in garage with tool bag"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Second row of features */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🚨",
                title: "Never Miss a Real Emergency",
                body: "Burst pipe at 2 AM? Calltide detects urgency, flags it, and offers to connect the caller directly to your cell. You decide what's worth waking up for.",
              },
              {
                icon: "💬",
                title: "Automatic Follow-Up That Closes",
                body: "Missed call auto-texts, appointment reminders, and Google review requests after the job's done — all sent automatically. More 5-star reviews, less admin work.",
              },
              {
                icon: "📊",
                title: "See Exactly What You're Getting",
                body: "Every call, every booking, every lead — visible in your dashboard. Know exactly how many jobs your AI booked this week and how much revenue it saved.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="reveal rounded-2xl border border-navy-border bg-navy-card p-7"
              >
                <span className="text-2xl">{feature.icon}</span>
                <h3 className="mt-3 font-display text-lg font-bold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>

          {/* Dashboard phone mockup */}
          <div className="reveal mt-12 flex justify-center">
            <div className="relative mx-auto w-[280px] rounded-[2.5rem] border-[6px] border-slate-700 bg-black p-2 shadow-2xl">
              <div className="overflow-hidden rounded-[2rem]" style={{ aspectRatio: "600/1053" }}>
                <img
                  src="/images/dashboard-screenshot.webp"
                  loading="lazy"
                  alt="Calltide mobile dashboard showing call activity with 20 total calls, 15 appointments, and a list of booked jobs"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── SOCIAL PROOF / STATS ── */}
      <Section className="px-6 py-24" stagger>
        <div className="mx-auto max-w-4xl">
          {/* Crew image */}
          <div className="reveal mx-auto mb-12 max-w-sm overflow-hidden rounded-2xl" style={{ aspectRatio: "1000/1334" }}>
            <img
              src="/images/crew-van.webp"
              loading="lazy"
              alt="Two-man plumbing crew in matching navy polos smiling at phone by work van checking new booking notification"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                value: "24/7",
                label: "Every call answered — nights, weekends, holidays",
              },
              {
                value: "2",
                label: "Languages spoken fluently, including Spanglish",
              },
              {
                value: "60s",
                label: "Average time from ring to booked appointment",
              },
            ].map((stat) => (
              <div
                key={stat.value}
                className="reveal rounded-2xl border border-navy-border bg-navy-card p-8 text-center"
              >
                <p className="font-display text-5xl font-bold text-amber">
                  {stat.value}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── OBJECTION-HANDLING FAQ ── */}
      <Section className="relative px-6 py-24 overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0">
          <img
            src="/images/phone-concrete-tools.webp"
            loading="lazy"
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0A1628]/85" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <h2 className="font-display text-center text-4xl font-bold text-white sm:text-5xl">
            &ldquo;Yeah, But...&rdquo;
          </h2>
          <p className="mt-3 text-center text-lg text-slate-400">
            We hear you. Here are the real answers.
          </p>
          <div className="mt-12">
            <FAQ />
          </div>
        </div>
      </Section>

      {/* ── RISK REVERSAL + GUARANTEE ── */}
      <Section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="rounded-2xl border border-navy-border bg-navy-card px-8 py-14 sm:px-14">
            <p className="font-display text-lg font-bold uppercase tracking-widest text-amber">
              Zero-Risk Guarantee
            </p>
            <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
              Try Calltide for 30 Days.
              <br />
              If It Doesn&apos;t Book, You Don&apos;t Pay.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-slate-400">
              If your AI receptionist doesn&apos;t book at least 5 appointments in
              your first 30 days, we refund your first month. No questions
              asked. No long-term contracts. Cancel anytime.
            </p>
            <p className="mt-6 font-display text-xl italic text-amber">
              Sin riesgo. Sin contratos. Cancela cuando quieras.
            </p>
          </div>
        </div>
      </Section>

      {/* ── PRICING ── */}
      <Section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
            $17/Day to Never Miss Another Job
          </h2>
          <p className="mt-3 text-lg text-slate-400">
            One booked job pays for the entire month.
          </p>

          <div className="mx-auto mt-12 max-w-md rounded-2xl border border-navy-border bg-navy-card p-10">
            <p className="font-display text-5xl font-bold text-white sm:text-6xl">
              $497
              <span className="text-2xl font-medium text-slate-400">/mo</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              + $1,500 one-time setup &amp; configuration
            </p>

            <ul className="mt-8 space-y-3 text-left text-sm text-slate-300">
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
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber px-8 py-4 text-base font-bold text-navy shadow-lg shadow-amber/20 transition hover:bg-amber-dark"
            >
              Get Started &rarr;
            </a>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber-glow px-5 py-2 text-sm font-semibold text-amber">
            <span>&#9679;</span>
            Founding member pricing: $297/mo locked — 3 of 5 spots remaining
          </div>
        </div>
      </Section>

      {/* ── FINAL CTA ── */}
      <Section className="relative px-6 py-24 overflow-hidden">
        {/* Background — work glove holding phone in truck */}
        <div className="absolute inset-0">
          <img
            src="/images/glove-phone-truck.webp"
            loading="lazy"
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0A1628]/70" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Your Competitors Are Still
            <br />
            Sending Calls to Voicemail.
          </h2>
          <p className="mt-3 font-display text-lg italic text-amber">
            Tus competidores siguen mandando llamadas al buzón de voz.
          </p>

          <a
            href={BOOKING_URL}
            className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-amber px-10 py-4 text-lg font-bold text-navy shadow-lg shadow-amber/20 transition hover:bg-amber-dark hover:shadow-amber/30"
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
            className="mt-1 inline-block font-display text-2xl font-bold text-white transition hover:text-amber"
          >
            {PHONE}
          </a>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-navy-border px-6 py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center text-sm text-slate-500">
          <img
            src="/images/logo.webp"
            alt="Calltide"
            className="h-7 w-auto brightness-0 invert opacity-50"
          />
          <p>Built in San Antonio, TX</p>
          <p>
            &copy; {new Date().getFullYear()} Calltide. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Bottom padding for mobile sticky CTA */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
