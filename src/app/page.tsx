"use client";

import { useEffect, useRef, useState } from "react";

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
            // Also reveal staggered children
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

/* ───────── Waveform component ───────── */

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
    q: "What if the customer needs a real person?",
    a: "Calltide detects urgency and can transfer directly to you or your on-call tech. Emergencies like gas leaks or burst pipes get flagged immediately.",
  },
  {
    q: "How does it know which language to speak?",
    a: "It listens to the caller's first words and responds in that language automatically. If they switch mid-conversation, it follows.",
  },
  {
    q: "What if I already have a receptionist?",
    a: "Great — Calltide covers the other 128 hours per week they're not working. Nights, weekends, lunch breaks, sick days.",
  },
  {
    q: "How long does setup take?",
    a: "48 hours from signing to your phone being answered by AI. We configure everything — your services, hours, pricing, calendar.",
  },
  {
    q: "Can it handle my specific services?",
    a: "Yes. We customize the AI to know your exact services, service area, pricing (if you want), and booking rules.",
  },
  {
    q: "Is it obvious it's AI?",
    a: "The voice is natural and conversational. Most callers don't realize it's AI unless they ask directly, in which case it's transparent about it.",
  },
  {
    q: "What about my existing phone number?",
    a: "You keep your number. We set up call forwarding so calls route through Calltide first. Takes 5 minutes.",
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
              <p className="pb-5 text-slate-400 leading-relaxed">{faq.a}</p>
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
      setShow(window.scrollY > 600);
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
        className="flex items-center justify-center gap-2 rounded-xl bg-amber px-6 py-3 text-sm font-bold text-navy"
      >
        Call Demo: {PHONE}
      </a>
    </div>
  );
}

/* ───────── Page ───────── */

export default function LandingPage() {
  return (
    <div className="relative overflow-x-hidden">
      <MobileCTA />

      {/* ── HERO ── */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 py-24 text-center">
        <Waveform />

        <div className="relative z-10 mx-auto max-w-3xl">
          <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Never Miss a Call.
            <br />
            In Any Language.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-300 sm:text-xl">
            AI receptionist that answers your phone in English and Spanish, 24/7.
            Books appointments. Texts you the details. Costs less than $17/day.
          </p>

          <p className="mt-3 font-display text-lg italic text-amber">
            Nunca pierdas otra llamada.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={PHONE_TEL}
              className="group inline-flex items-center gap-2 rounded-xl bg-amber px-8 py-4 text-base font-bold text-navy shadow-lg shadow-amber/20 transition hover:bg-amber-dark hover:shadow-amber/30"
            >
              Hear It Live
              <span className="transition-transform group-hover:translate-x-0.5">
                &rarr;
              </span>
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/5"
            >
              See How It Works
            </a>
          </div>
          <p className="mt-2 text-xs text-slate-500">(Call our demo number)</p>

          <div className="mt-12">
            <a
              href={PHONE_TEL}
              className="font-display text-3xl font-bold tracking-wider text-white transition hover:text-amber sm:text-4xl"
            >
              {PHONE}
            </a>
            <p className="mt-2 text-sm text-slate-400">
              Call now. Hear your AI receptionist in action.
            </p>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <Section
        id="problem"
        className="px-6 py-24"
        stagger
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="reveal font-display text-center text-4xl font-bold text-white sm:text-5xl">
            You&apos;re Losing Jobs Right Now
          </h2>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="reveal rounded-2xl border border-navy-border bg-navy-card p-8">
              <p className="font-display text-xl font-bold text-white">
                You&apos;re on a job site.
              </p>
              <p className="mt-3 leading-relaxed text-slate-400">
                Your phone rings. You can&apos;t answer. That customer calls your
                competitor.
              </p>
            </div>

            <div className="reveal rounded-2xl border border-navy-border bg-navy-card p-8">
              <p className="font-display text-xl font-bold text-white">
                They only speak Spanish.
              </p>
              <p className="mt-3 leading-relaxed text-slate-400">
                Your voicemail is in English. They hang up. You never know they
                called.
              </p>
            </div>

            <div className="reveal rounded-2xl border border-navy-border bg-navy-card p-8">
              <p className="font-display text-xl font-bold text-white">
                It&apos;s 9pm on a Sunday.
              </p>
              <p className="mt-3 leading-relaxed text-slate-400">
                A pipe burst. They need help NOW. Your phone goes to voicemail.
                They find someone else.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <p className="font-display text-3xl font-bold text-amber sm:text-4xl">
              The average small business misses 62% of incoming calls.
            </p>
            <p className="mt-3 text-slate-400">
              Every missed call is $200–500 walking out the door.
            </p>
          </div>
        </div>
      </Section>

      {/* ── THE SOLUTION ── */}
      <Section id="how-it-works" className="px-6 py-24" stagger>
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center">
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
              Meet Your New Employee
            </h2>
            <p className="mt-2 font-display text-xl italic text-amber">
              Conozca a su nuevo empleado
            </p>
          </div>

          <div className="relative mt-20 grid gap-12 md:grid-cols-3">
            {/* Connecting line (desktop) */}
            <div
              aria-hidden
              className="absolute top-10 left-[16.67%] right-[16.67%] hidden h-px bg-gradient-to-r from-amber/0 via-amber/40 to-amber/0 md:block"
            />

            {[
              {
                num: "1",
                title: "Customer Calls",
                body: "Your Calltide number rings. AI answers instantly in the caller's language — English or Spanish, detected automatically.",
              },
              {
                num: "2",
                title: "AI Qualifies & Books",
                body: "Gets their name, number, address, what they need, how urgent. Checks your calendar. Books the appointment.",
              },
              {
                num: "3",
                title: "You Get a Text",
                body: "Appointment details, customer info, and a full call summary — sent to your phone before you put your tools down.",
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

      {/* ── FEATURES ── */}
      <Section className="px-6 py-24" stagger>
        <div className="mx-auto max-w-5xl">
          <h2 className="reveal font-display text-center text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Everything a $40K/yr Receptionist Does.
            <br className="hidden sm:block" />
            <span className="text-amber"> For $17/day.</span>
          </h2>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🌐",
                title: "Bilingual by Default",
                body: "Answers in English and Spanish. Switches languages mid-call if your customer does. Handles Spanglish naturally.",
              },
              {
                icon: "📅",
                title: "Books Appointments",
                body: "Checks your real calendar, finds open slots, books it, sends confirmation texts to you and the customer.",
              },
              {
                icon: "📋",
                title: "Qualifies Every Lead",
                body: "Gets name, number, address, service needed, and urgency level. No more playing phone tag.",
              },
              {
                icon: "🚨",
                title: "Emergency Detection",
                body: "Hears panic in their voice? Flags it urgent and offers to connect them to you immediately.",
              },
              {
                icon: "💬",
                title: "Follow-Up Texts",
                body: "Missed call auto-text, appointment reminders, and Google review requests after the job's done.",
              },
              {
                icon: "📊",
                title: "Your Dashboard",
                body: "See every call, every booking, every lead. Know exactly what your AI handled while you were working.",
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
                label:
                  "Calls answered, including nights, weekends, and holidays",
              },
              { value: "2", label: "Languages spoken fluently" },
              {
                value: "60 sec",
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

      {/* ── LIVE DEMO CTA ── */}
      <Section className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl bg-amber px-8 py-16 text-center shadow-2xl shadow-amber/10 sm:px-16">
          <h2 className="font-display text-3xl font-bold text-navy sm:text-4xl lg:text-5xl">
            Don&apos;t Take Our Word For It.
            <br />
            Call Right Now.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-navy/70">
            Dial the number below and experience Calltide answering as a San
            Antonio plumbing company — in English or Spanish. Takes 30 seconds.
          </p>
          <a
            href={PHONE_TEL}
            className="mt-8 inline-block font-display text-4xl font-bold text-navy transition hover:opacity-80 sm:text-5xl"
          >
            {PHONE}
          </a>
          <p className="mt-4 text-sm font-medium text-navy/60">
            Try it in English. Then call back in Spanish. Same number.
          </p>
        </div>
      </Section>

      {/* ── PRICING ── */}
      <Section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
            Simple Pricing. Serious ROI.
          </h2>

          <div className="mx-auto mt-12 max-w-md rounded-2xl border border-navy-border bg-navy-card p-10">
            <p className="font-display text-5xl font-bold text-white sm:text-6xl">
              $497
              <span className="text-2xl font-medium text-slate-400">/mo</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              + $1,500 one-time setup
            </p>

            <ul className="mt-8 space-y-3 text-left text-sm text-slate-300">
              {[
                "AI receptionist (English + Spanish)",
                "Appointment booking on your calendar",
                "SMS confirmations and reminders",
                "Missed call auto-texts",
                "Follow-up sequences",
                "Owner dashboard",
                "Outbound campaign support",
                "Dedicated setup and configuration",
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

          <p className="mt-6 font-display text-lg font-semibold text-white">
            One booked job pays for the entire month.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Founding member pricing available for first 5 clients — ask about
            $297/mo locked rate.
          </p>
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-center text-4xl font-bold text-white sm:text-5xl">
            Questions? We Got You.
          </h2>
          <div className="mt-12">
            <FAQ />
          </div>
        </div>
      </Section>

      {/* ── FOOTER CTA ── */}
      <Section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Your Competitors Are Still Sending Calls to Voicemail.
          </h2>
          <p className="mt-3 font-display text-lg italic text-amber">
            Tus competidores siguen mandando llamadas al buzón.
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
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-navy-border px-6 py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center text-sm text-slate-500">
          <span className="font-display text-lg font-bold text-amber">
            Calltide
          </span>
          <p>Built in San Antonio, TX</p>
          <p>&copy; {new Date().getFullYear()} Calltide. All rights reserved.</p>
        </div>
      </footer>

      {/* Bottom padding for mobile sticky CTA */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
