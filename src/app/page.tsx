"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const PHONE = "(210) 555-0147";
const PHONE_TEL = "tel:+12105550147";
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

function MobileCTA() {
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
      <a
        href={PHONE_TEL}
        className="flex items-center justify-center gap-2 rounded-xl bg-amber px-6 py-3.5 text-sm font-bold text-navy"
      >
        Hear It Live — Call {PHONE}
      </a>
    </div>
  );
}

/* ───────── Exit-intent popup ───────── */

function ExitIntent() {
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
          Call the demo number and experience Calltide answering as a real
          plumbing company. Takes 30 seconds. No signup needed.
        </p>
        <a
          href={PHONE_TEL}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber px-8 py-4 text-lg font-bold text-navy shadow-lg shadow-amber/20 transition hover:bg-amber-dark"
        >
          Call {PHONE}
        </a>
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
  return (
    <div className="relative overflow-x-hidden">
      <MobileCTA />
      <ExitIntent />

      {/* ── HERO ── */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 py-24 text-center">
        <Waveform />

        <div className="relative z-10 mx-auto max-w-3xl">
          {/* Local trust badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-navy-border bg-navy-card px-4 py-1.5 text-sm text-slate-400">
            <span className="text-amber">&#9679;</span>
            Built in San Antonio by a local business owner
          </div>

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

          {/* Single CTA — call the demo */}
          <div className="mt-10">
            <a
              href={PHONE_TEL}
              className="group inline-flex items-center gap-2 rounded-xl bg-amber px-10 py-4 text-lg font-bold text-navy shadow-lg shadow-amber/20 transition hover:bg-amber-dark hover:shadow-amber/30"
            >
              Hear It Live
              <span className="transition-transform group-hover:translate-x-0.5">
                &rarr;
              </span>
            </a>
            <p className="mt-2 text-sm text-slate-500">
              Call our demo number — no signup needed
            </p>
          </div>

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
              className="absolute top-10 left-[16.67%] right-[16.67%] hidden h-px bg-gradient-to-r from-amber/0 via-amber/40 to-amber/0 md:block"
            />

            {[
              {
                num: "1",
                title: "Customer Calls",
                body: "Your phone rings. Calltide answers instantly — in English or Spanish, detected from the caller's first words. No hold music. No voicemail. A real conversation.",
              },
              {
                num: "2",
                title: "AI Books the Job",
                body: "Gets their name, address, what they need, and how urgent it is. Checks your calendar. Books the appointment. Sends them a confirmation text.",
              },
              {
                num: "3",
                title: "You Get a Text",
                body: "Customer info, appointment details, and a full summary of the call — sent to your phone before you set your tools down. Show up, do the job, get paid.",
              },
            ].map((step) => (
              <div key={step.num} className="reveal relative text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber bg-navy text-2xl font-bold text-amber">
                  {step.num}
                </div>
                <h3 className="mt-6 font-display text-xl font-bold text-white">
                  {step.title}
                </h3>
                <p className="mt-3 leading-relaxed text-slate-400">
                  {step.body}
                </p>
              </div>
            ))}
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
            Call Right Now.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-navy/70">
            Dial the number below. Calltide will answer as a San Antonio plumbing
            company. Try it in English. Call back in Spanish. Takes 30 seconds.
          </p>
          <a
            href={PHONE_TEL}
            className="mt-8 inline-block font-display text-4xl font-bold text-navy transition hover:opacity-80 sm:text-5xl"
          >
            {PHONE}
          </a>
          <p className="mt-3 text-sm font-medium text-navy/50">
            No signup. No credit card. Just call.
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
        </div>
      </Section>

      {/* ── SOCIAL PROOF / STATS ── */}
      <Section className="px-6 py-24" stagger>
        <div className="mx-auto max-w-4xl">
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
      <Section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
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
      <Section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
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

          <p className="mt-6 text-slate-400">
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
          <span className="font-display text-lg font-bold text-amber">
            Calltide
          </span>
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
