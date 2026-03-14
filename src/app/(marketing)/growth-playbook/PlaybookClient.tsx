"use client";

import { useState } from "react";
import { StaticNav } from "@/components/marketing/StaticNav";
import { StaticFooter } from "@/components/marketing/StaticFooter";

const CHAPTERS = [
  {
    num: "01",
    title: "The Revenue-Per-Truck Metric",
    desc: "Why most contractors measure growth wrong (headcount) instead of right (revenue per truck). Real benchmarks by trade.",
  },
  {
    num: "02",
    title: "The 47-Hour Response Problem",
    desc: "The average contractor takes 47 hours to respond to a lead. Companies that respond in under 60 seconds convert 391% more. Here's how to fix it.",
  },
  {
    num: "03",
    title: "The $50K Leak",
    desc: "Missed calls, the real math by trade, and why 85% of callers never call back. Frameworks to audit your own missed call rate.",
  },
  {
    num: "04",
    title: "The Bilingual Advantage",
    desc: "$3T+ in Hispanic purchasing power, 40M+ Spanish speakers. Most competitors can't serve them. This is a growth lever hiding in plain sight.",
  },
  {
    num: "05",
    title: "The Automation Stack",
    desc: "What to automate (phones, scheduling, follow-ups, reviews) vs what to never automate (the work, the relationships). Honest breakdown of every tool category.",
  },
  {
    num: "06",
    title: "The Recurring Revenue Shift",
    desc: "How top contractors build maintenance agreements and service contracts to smooth seasonal swings. Real pricing frameworks you can copy.",
  },
  {
    num: "07",
    title: "The AI Opportunity (and What's Hype)",
    desc: "An honest take on what AI can and can't do in 2026 for trades. What's actually working, what's vaporware, and where to spend your money.",
  },
];

const STATS = [
  { value: "$650B+", label: "Home services market size" },
  { value: "550K", label: "Plumber shortage by 2027" },
  { value: "85%", label: "Callers who never call back" },
  { value: "47 hrs", label: "Average lead response time" },
];

export function PlaybookLanding() {
  const [email, setEmail] = useState("");
  const [trade, setTrade] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || sending) return;
    setSending(true);

    const params = new URLSearchParams(window.location.search);

    await fetch("/api/marketing/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        trade: trade || undefined,
        source: "playbook",
        language: "en",
        utmSource: params.get("utm_source") || "playbook",
        utmMedium: params.get("utm_medium") || "landing",
        utmCampaign: params.get("utm_campaign") || "growth_playbook",
      }),
    }).catch(() => {});

    setSubmitted(true);
    setSending(false);
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      <StaticNav lang="en" langHref="/es" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy px-6 sm:px-8 py-20 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(212,168,67,0.08),transparent_60%)]" />
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left: Copy */}
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.15em] text-amber">Free Guide</p>
              <h1 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[44px]">
                The Blue Collar Growth Playbook
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-slate-300">
                How to scale your home service business without adding headcount. 7 strategies backed by real industry data — not theory, not fluff, not a sales pitch.
              </p>
              <ul className="mt-6 space-y-3">
                {["Revenue-per-truck benchmarks by trade", "The real cost of missed calls (with math)", "The bilingual revenue opportunity most contractors ignore", "Which AI tools actually work vs what's hype"].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="mt-0.5 text-amber shrink-0">&#10003;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Form */}
            <div className="rounded-2xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {!submitted ? (
                <>
                  <h2 className="text-xl font-bold text-white">Download the Playbook</h2>
                  <p className="mt-2 text-sm text-slate-400">Free. No credit card. No 47-email drip campaign.</p>
                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email"
                        required
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber focus:ring-1 focus:ring-amber"
                      />
                    </div>
                    <div>
                      <select
                        value={trade}
                        onChange={(e) => setTrade(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber focus:ring-1 focus:ring-amber"
                      >
                        <option value="" className="text-charcoal">Your trade (optional)</option>
                        <option value="plumbing" className="text-charcoal">Plumbing</option>
                        <option value="hvac" className="text-charcoal">HVAC</option>
                        <option value="electrical" className="text-charcoal">Electrical</option>
                        <option value="roofing" className="text-charcoal">Roofing</option>
                        <option value="general_contractor" className="text-charcoal">General Contracting</option>
                        <option value="restoration" className="text-charcoal">Restoration</option>
                        <option value="landscaping" className="text-charcoal">Landscaping</option>
                        <option value="pest_control" className="text-charcoal">Pest Control</option>
                        <option value="garage_door" className="text-charcoal">Garage Door</option>
                        <option value="other" className="text-charcoal">Other</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={sending}
                      className="cta-gold cta-shimmer w-full rounded-lg px-6 py-4 text-base font-semibold text-white transition disabled:opacity-60"
                    >
                      {sending ? "Sending..." : "Get the Playbook"}
                    </button>
                  </form>
                  <p className="mt-4 text-center text-xs text-slate-500">
                    30 pages. Real data. Strategies you can use today.
                  </p>
                </>
              ) : (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                    <span className="text-2xl text-green-400">&#10003;</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">Check your inbox</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    The Blue Collar Growth Playbook is on the way.
                  </p>
                  <a
                    href="/setup?utm_source=playbook&utm_medium=landing&utm_campaign=growth_playbook"
                    className="cta-gold mt-6 inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-sm font-semibold text-white"
                  >
                    Get Capta &rarr;
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-cream-border bg-white px-6 sm:px-8 py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-[28px] font-extrabold tracking-tight text-navy sm:text-[32px]">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-charcoal-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What's Inside */}
      <section className="px-6 sm:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-[13px] font-bold uppercase tracking-[0.15em] text-amber">What&apos;s Inside</p>
          <h2 className="mt-3 text-center text-[28px] font-extrabold tracking-tight text-charcoal sm:text-[36px]">
            7 Chapters. Zero Fluff.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-charcoal-muted">
            Every chapter is a standalone strategy you can implement this week. Real numbers, real frameworks, real contractor examples.
          </p>

          <div className="mt-12 space-y-4">
            {CHAPTERS.map((ch) => (
              <div key={ch.num} className="flex gap-5 rounded-xl border border-cream-border bg-white p-5 sm:p-6">
                <span className="shrink-0 text-[28px] font-extrabold text-amber/30">{ch.num}</span>
                <div>
                  <h3 className="text-base font-bold text-charcoal">{ch.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-charcoal-muted">{ch.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="bg-[#F5F5F7] px-6 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-[24px] font-extrabold tracking-tight text-charcoal sm:text-[28px]">
            This Playbook Is For You If...
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              "You're turning away work because you can't hire fast enough",
              "You know you're missing calls but don't know how many",
              "You've been burned by software that overpromised",
              "You want to grow revenue without growing headcount",
              "You serve (or want to serve) Spanish-speaking customers",
              "You're tired of competing on price instead of speed",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg bg-white p-4 border border-cream-border">
                <span className="mt-0.5 text-amber shrink-0">&#10003;</span>
                <p className="text-sm text-charcoal">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-navy px-6 sm:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-[28px] font-extrabold tracking-tight text-white sm:text-[36px]">
            Stop Guessing. Start Growing.
          </h2>
          <p className="mt-4 text-base text-slate-300">
            30 pages of real data and actionable strategies. Free. Because we&apos;d rather earn your trust than your email.
          </p>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
                className="rounded-lg border border-white/10 bg-white/5 px-5 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber focus:ring-1 focus:ring-amber sm:w-72"
              />
              <button
                type="submit"
                disabled={sending}
                className="cta-gold cta-shimmer rounded-lg px-8 py-3.5 text-sm font-semibold text-white transition disabled:opacity-60"
              >
                {sending ? "Sending..." : "Get the Playbook"}
              </button>
            </form>
          ) : (
            <div className="mt-8 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
              <p className="text-sm font-semibold text-green-400">Check your inbox &mdash; the playbook is on the way.</p>
            </div>
          )}
        </div>
      </section>

      <StaticFooter lang="en" />
    </div>
  );
}
