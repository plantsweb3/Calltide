"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

import { T, PHONE, PHONE_TEL, BOOKING_URL, type Lang } from "@/lib/marketing/translations";
import { useScrolled, useScrollReveal } from "@/lib/marketing/hooks";
import { HERO_FEATURE_ICONS, STEP_ICONS } from "@/components/marketing/icons";
import Image from "next/image";
import { SpotlightCard } from "@/components/marketing/SpotlightCard";
import { Counter } from "@/components/marketing/Counter";
import { ROICalculator } from "@/components/marketing/ROICalculator";
import { FAQ } from "@/components/marketing/FAQ";
import { MobileCTA } from "@/components/marketing/MobileCTA";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const MariaDemoWidget = dynamic(() => import("@/components/marketing/MariaDemoWidget"), { ssr: false });

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [planChoice, setPlanChoice] = useState<"monthly" | "annual">("annual");
  const scrolled = useScrolled();
  useScrollReveal();

  // Persist language preference
  const toggleLang = useCallback((l: Lang) => {
    setLang(l);
    if (typeof window !== "undefined") localStorage.setItem("capta-lang", l);
  }, []);

  // Restore saved language on mount
  useEffect(() => {
    const saved = localStorage.getItem("capta-lang");
    if (saved === "en" || saved === "es") setLang(saved);
  }, []);

  const t = T[lang];

  // Fetch latest blog posts for internal linking
  const [latestPosts, setLatestPosts] = useState<Array<{ slug: string; title: string; metaDescription: string | null; category: string | null; readingTimeMin: number | null; publishedAt: string | null }>>([]);
  useEffect(() => {
    fetch("/api/blog/latest")
      .then((r) => r.json())
      .then(setLatestPosts)
      .catch(() => {});
  }, []);

  const CATEGORY_LABELS: Record<string, string> = useMemo(() => ({
    pillar: "Pillar", "data-driven": "Data", comparison: "Comparison",
    "city-specific": "Local", "problem-solution": "Guide", "buying-guide": "Buyer's Guide",
    "vertical-specific": "By Trade", "pain-point": "Pain Point",
  }), []);

  return (
    <div className="relative overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Capta",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "497", priceCurrency: "USD", priceValidUntil: "2027-12-31" },
            description: "AI front office for home service businesses. Answers calls, generates estimates, recovers missed calls, and manages follow-ups — in English and Spanish, 24/7.",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: T.en.faq.items.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />
      <MobileCTA lang={lang} />

      {/* ── NAVIGATION ── */}
      <Nav lang={lang} toggleLang={toggleLang} scrolled={scrolled} />

      {/* ── 1. HERO ── */}
      <section className="relative overflow-hidden grain-overlay">
        <Image src="/images/grit-hvac.webp" alt="" fill className="object-cover object-center" priority />
        <div className="hero-bg-overlay absolute inset-0" />
        <div className="section-fade-bottom" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8 py-24 sm:py-32">
          <div className="grid items-center gap-16 md:grid-cols-5">
            <div className="md:col-span-3">
              <div className="hero-glass">
                <a href="/status" className="group inline-flex items-center gap-2 mb-6">
                  <span className="status-dot" />
                  <span className="text-xs font-medium tracking-wide text-slate-400 transition group-hover:text-white">{lang === "en" ? "Answering calls right now" : "Contestando llamadas ahora"}</span>
                </a>
                <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-amber">{t.hero.badge}</p>
                <h1 className="mt-6 text-[clamp(40px,5.5vw,72px)] font-black leading-[1.05] tracking-tight text-white">
                  {t.hero.h1}
                </h1>
                <p className="mt-6 max-w-xl text-xl font-medium leading-[1.7] text-slate-300">{t.hero.sub}</p>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <a href="/setup" className="cta-gold cta-shimmer hero-cta-glow inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-base font-semibold text-white">
                    {t.hero.cta} &rarr;
                  </a>
                  <a href={PHONE_TEL} className="text-center text-sm font-medium text-slate-400 transition hover:text-white sm:text-left">
                    {lang === "en" ? "Or call her" : "O llámala"}: {PHONE} &rarr;
                  </a>
                </div>

                {/* Trust Bar */}
                <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2">
                  {t.hero.trustItems.map((item, i) => (
                    <span key={i} className="flex items-center gap-2 text-sm text-slate-400">
                      {i > 0 && <span className="hidden sm:inline text-slate-600">&bull;</span>}
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Demo Widget */}
            <div className="md:col-span-2 relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(212,145,10,0.15),transparent_70%)]" />
              <div className="relative rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}>
                <MariaDemoWidget lang={lang} phoneTel={PHONE_TEL} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. OUTCOME BAR ── */}
      <section className="bg-[#FBFBFC] px-6 sm:px-8 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="snap-scroll-mobile grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
            {t.outcomeBar.items.map((item, i) => (
              <motion.div
                key={i}
                className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="gold-gradient-text text-[40px] font-extrabold sm:text-[48px]">{item.value}</p>
                <p className="mt-1 text-sm font-medium text-charcoal-muted">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. DIFFERENTIATOR — Why Capta ── */}
      <section className="bg-[#1B2A4A] px-6 sm:px-8 py-24 sm:py-32 dark-section">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{t.differentiator.label}</p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[44px]">
              {t.differentiator.h2}
            </h2>
            <p className="mt-4 text-base text-slate-400">{t.differentiator.sub}</p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {/* Left — Answering Services */}
            <div className="rounded-xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-lg font-bold text-slate-400 mb-6">{t.differentiator.leftTitle}</h3>
              <ul className="space-y-4">
                {t.differentiator.leftItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-500">
                    <span className="mt-0.5 text-red-400 shrink-0">&times;</span>
                    <span className="text-[15px] leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — Capta */}
            <div className="rounded-xl p-8" style={{ background: "rgba(212,168,67,0.04)", border: "1px solid rgba(212,168,67,0.15)" }}>
              <h3 className="text-lg font-bold text-white mb-6">{t.differentiator.rightTitle}</h3>
              <ul className="space-y-4">
                {t.differentiator.rightItems.map((item, i) => (
                  <motion.li
                    key={i}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className="mt-0.5 text-amber shrink-0">&#10003;</span>
                    <span className="text-[15px] leading-relaxed text-white">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* VS divider on mobile */}
          <div className="md:hidden flex items-center justify-center -mt-4 -mb-4 relative z-10">
            <span className="rounded-full bg-[#1B2A4A] border border-amber/30 px-4 py-1 text-sm font-bold text-amber">VS</span>
          </div>

          {/* Bottom stat */}
          <div className="reveal mt-12 text-center">
            <p className="inline-block rounded-xl px-8 py-4 text-base font-semibold text-amber" style={{ background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)" }}>
              {t.differentiator.bottomStat}
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. DEMO CTA BANNER ── */}
      <section className="bg-navy px-6 sm:px-8 py-16 sm:py-20 dark-section">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{t.hero.demoSection}</p>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{t.hero.demoSub}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400">{t.hero.demoDetail}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a href="/setup" className="cta-gold cta-shimmer inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base font-semibold text-white">
              {lang === "en" ? "Get Capta" : "Obtén Capta"} &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ── 5. HOW IT WORKS ── */}
      <section id="how-it-works" className="relative bg-navy px-6 sm:px-8 py-24 sm:py-32 dark-section grain-overlay" style={{ background: "#0f1729" }}>
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="reveal text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{t.howItWorks.label}</p>
            <h2 className="mt-4 text-[36px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[48px]">
              {t.howItWorks.h2}
            </h2>
          </div>

          <div className="mt-20 steps-timeline space-y-14 mx-auto max-w-2xl">
            {t.howItWorks.steps.map((step, i) => {
              const StepIcon = STEP_ICONS[i];
              return (
                <div key={i} className="reveal flex gap-6">
                  <div className="step-circle-glow relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber text-white">
                    <StepIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-[24px] font-extrabold tracking-tight text-white">{step.title}</h3>
                    <p className="mt-3 text-base leading-[1.7] text-slate-300">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. FEATURES — 4 Hero Cards ── */}
      <section id="features" className="relative bg-[#1B2A4A] px-6 sm:px-8 py-24 sm:py-32 dark-section grain-overlay">
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="reveal text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{t.features.label}</p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[44px]">
              {t.features.h2}
            </h2>
          </div>

          <div className="snap-scroll-mobile mt-16 grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {t.features.cards.map((f, i) => {
              const FeatureIcon = HERO_FEATURE_ICONS[i];
              return (
                <SpotlightCard key={i} className="glass-card ambient-edge rounded-xl">
                  <motion.div
                    className="p-8 sm:p-10"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber/10">
                      <FeatureIcon size={24} className="text-amber" />
                    </div>
                    <h3 className="mt-5 text-xl font-extrabold leading-[1.3] tracking-tight text-white">{f.title}</h3>
                    <p className="mt-3 text-base leading-[1.7] text-[#B8C4D4]">{f.desc}</p>
                  </motion.div>
                </SpotlightCard>
              );
            })}
          </div>

          {/* See all features link */}
          <div className="mt-10 text-center">
            <a href="/platform" className="text-sm font-semibold text-amber transition hover:underline">
              {t.features.allFeatures} &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ── 7. MARIA OFFICE MANAGER ── */}
      <section className="bg-[#FBFBFC] px-6 sm:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center mb-16">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-charcoal-light">{t.officeManager.label}</p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[1.15] tracking-tight text-charcoal sm:text-[44px] max-w-3xl mx-auto">
              {t.officeManager.h2}
            </h2>
            <p className="mt-4 text-base text-charcoal-muted">{t.officeManager.sub}</p>
          </div>

          <div className="grid gap-12 md:grid-cols-2 items-start">
            {/* Phone mockup with chat bubbles */}
            <div className="reveal">
              <div className="mx-auto max-w-sm rounded-[2rem] p-1" style={{ background: "linear-gradient(145deg, #e8e8e8, #f5f5f5)", boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)" }}>
                <div className="rounded-[1.75rem] bg-white overflow-hidden">
                  {/* Phone header */}
                  <div className="bg-[#f8f8f8] px-6 py-4 flex items-center gap-3 border-b border-gray-100">
                    <div className="h-9 w-9 rounded-full bg-amber/15 flex items-center justify-center">
                      <span className="text-sm font-bold text-amber">M</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-charcoal">Maria</p>
                      <p className="text-[11px] text-charcoal-muted">{lang === "en" ? "AI Office Manager" : "Gerente de Oficina IA"}</p>
                    </div>
                  </div>
                  {/* Chat messages */}
                  <div className="px-4 py-5 space-y-3" style={{ minHeight: "320px" }}>
                    {t.officeManager.conversation.map((msg, i) => (
                      <motion.div
                        key={i}
                        className={`flex ${msg.from === "you" ? "justify-end" : "justify-start"}`}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-30px" }}
                        transition={{ delay: i * 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                            msg.from === "you"
                              ? "bg-[#007AFF] text-white rounded-br-sm"
                              : "bg-[#E9E9EB] text-charcoal rounded-bl-sm"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature bullets */}
            <div className="reveal space-y-5">
              {t.officeManager.bullets.map((bullet, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="mt-1 text-amber shrink-0">&#10003;</span>
                  <span className="text-base leading-relaxed text-charcoal">{bullet}</span>
                </motion.div>
              ))}

              <div className="pt-4">
                <a href="/setup" className="cta-gold cta-shimmer inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base font-semibold text-white">
                  {t.hero.cta} &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. SOFTWARE REPLACEMENT ── */}
      <section className="px-6 sm:px-8 py-24 sm:py-32 dark-section" style={{ background: "#111a2e" }}>
        <div className="mx-auto max-w-3xl">
          <div className="reveal text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{t.softwareReplace.label}</p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[44px]">
              {t.softwareReplace.h2}
            </h2>
          </div>

          <div className="reveal mt-14 space-y-3">
            {t.softwareReplace.items.map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center justify-between rounded-xl px-6 py-5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="text-[15px] text-slate-300">{item.name}</span>
                <span className="text-[15px] font-semibold text-slate-400">{item.cost}</span>
              </motion.div>
            ))}

            {/* Total (struck through) */}
            <div className="flex items-center justify-between rounded-xl px-6 py-5 mt-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="text-[15px] text-slate-500">{lang === "en" ? "Total" : "Total"}</span>
              <span className="text-lg font-bold text-slate-500 line-through">{t.softwareReplace.total}</span>
            </div>

            {/* Capta price */}
            <div className="rounded-xl px-6 py-6 text-center" style={{ background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)" }}>
              <p className="text-xl font-extrabold text-amber">{t.softwareReplace.captaPrice}</p>
            </div>

            <p className="text-center text-sm text-slate-500 mt-4">{t.softwareReplace.footer}</p>
          </div>
        </div>
      </section>

      {/* ── 9. ROI CALCULATOR ── */}
      <section className="relative px-6 sm:px-8 py-24 sm:py-32 dark-section" style={{ background: "#0f1729" }}>
        <div className="relative z-10 mx-auto max-w-5xl">
          <ROICalculator lang={lang} />
        </div>
      </section>

      {/* ── 10. PRICING ── */}
      <section id="pricing" className="bg-[#111317] px-6 sm:px-8 py-24 sm:py-32 dark-section">
        <div className="mx-auto max-w-3xl">
          <div className="reveal text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{t.pricing.label}</p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-[#E8E9EB] sm:text-[44px]">
              {t.pricing.h2}
            </h2>
          </div>

          {/* Plan Toggle */}
          <div className="reveal mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => setPlanChoice("monthly")}
              className="rounded-full px-5 py-2 text-sm font-semibold transition"
              style={{
                background: planChoice === "monthly" ? "#C59A27" : "transparent",
                color: planChoice === "monthly" ? "#0f0f0f" : "#A0A3A8",
                border: planChoice === "monthly" ? "1px solid #C59A27" : "1px solid rgba(255,255,255,0.15)",
              }}
            >
              {lang === "en" ? "Monthly" : "Mensual"}
            </button>
            <button
              onClick={() => setPlanChoice("annual")}
              className="relative rounded-full px-5 py-2 text-sm font-semibold transition"
              style={{
                background: planChoice === "annual" ? "#C59A27" : "transparent",
                color: planChoice === "annual" ? "#0f0f0f" : "#A0A3A8",
                border: planChoice === "annual" ? "1px solid #C59A27" : "1px solid rgba(255,255,255,0.15)",
              }}
            >
              {lang === "en" ? "Annual" : "Anual"}
              <span className="absolute -top-2.5 -right-2 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                {lang === "en" ? "Save 20%" : "-20%"}
              </span>
            </button>
          </div>

          <div className="reveal mt-8 mx-auto max-w-lg">
            <div className="pricing-glow ambient-edge relative rounded-xl border-2 border-[#C59A27] bg-[#1A1D0F] p-10 text-center sm:p-14">
              <p className="mt-2 text-[56px] font-extrabold tracking-tight text-[#E8E9EB]">
                {planChoice === "annual" ? "$397" : "$497"}
              </p>
              <p className="text-sm text-[#A0A3A8]">
                {planChoice === "annual"
                  ? (lang === "en" ? "/mo \u2014 billed annually at $4,764/yr" : "/mes \u2014 facturado anualmente a $4,764/a\u00F1o")
                  : t.pricing.period}
              </p>
              {planChoice === "annual" && (
                <p className="mt-2 text-sm font-semibold text-green-400">
                  {lang === "en" ? "Save $1,200/year" : "Ahorra $1,200/a\u00F1o"}
                </p>
              )}
              <p className="mt-4 text-base text-[#A0A3A8]">{t.pricing.sub}</p>

              <ul className="mt-8 space-y-4 text-left text-sm text-[#E8E9EB]">
                {t.pricing.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#C59A27]">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>

              <p className="mt-8 text-sm italic text-[#A0A3A8]">{t.pricing.comparison}</p>

              <a href="/setup" className="cta-gold cta-shimmer mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold text-white">
                {t.pricing.cta} &rarr;
              </a>

              <p className="mt-4 text-xs text-[#A0A3A8]">{t.pricing.guarantee}</p>

              <div className="mt-6 flex flex-col items-center gap-2">
                {t.pricing.crossLinks.map((link, i) => (
                  <a key={i} href={link.href} className="text-xs text-[#A0A3A8] underline underline-offset-4 transition hover:text-amber">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. FAQ ── */}
      <section id="faq" className="relative bg-[#FBFBFC] px-6 sm:px-8 py-24 sm:py-32 overflow-hidden">
        <div className="mx-auto max-w-3xl">
          <div className="reveal text-center">
            <h2 className="text-[36px] font-extrabold leading-[1.1] tracking-tight text-charcoal sm:text-[48px]">
              {t.faq.h2}
            </h2>
            <div className="mt-6 inline-flex rounded-full overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
              <button onClick={() => toggleLang("en")} className={`px-5 py-2 text-sm font-semibold transition ${lang === "en" ? "bg-navy text-white" : "text-charcoal-muted hover:bg-cream-dark"}`}>English</button>
              <button onClick={() => toggleLang("es")} className={`px-5 py-2 text-sm font-semibold transition ${lang === "es" ? "bg-navy text-white" : "text-charcoal-muted hover:bg-cream-dark"}`}>Espa&ntilde;ol</button>
            </div>
          </div>
          <div className="reveal mt-14">
            <FAQ lang={lang} />
          </div>
        </div>
      </section>

      {/* ── 12. LATEST FROM THE BLOG ── */}
      {latestPosts.length > 0 && (
        <section className="bg-[#FBFBFC] px-6 sm:px-8 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-charcoal-light">
                {lang === "en" ? "From the Blog" : "Del Blog"}
              </p>
              <h2 className="mt-4 text-[28px] font-extrabold leading-[1.1] tracking-tight text-charcoal sm:text-[36px]">
                {lang === "en" ? "Tips for Growing Your Business" : "Consejos para Hacer Crecer tu Negocio"}
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((post) => (
                <a key={post.slug} href={`/blog/${post.slug}`} className="group">
                  <div className="card-shadow card-hover rounded-xl border border-cream-border bg-white p-6">
                    <div className="flex items-center gap-2">
                      {post.category && (
                        <span className="rounded-full bg-amber/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
                          {CATEGORY_LABELS[post.category] ?? post.category}
                        </span>
                      )}
                      {post.readingTimeMin && (
                        <span className="text-xs text-charcoal-light">{post.readingTimeMin} min read</span>
                      )}
                    </div>
                    <h3 className="mt-3 text-base font-bold tracking-tight text-charcoal group-hover:text-amber transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    {post.metaDescription && (
                      <p className="mt-2 text-sm leading-relaxed text-charcoal-muted line-clamp-2">{post.metaDescription}</p>
                    )}
                  </div>
                </a>
              ))}
            </div>
            <div className="mt-8 text-center">
              <a href="/blog" className="text-sm font-semibold text-amber transition hover:underline">
                {lang === "en" ? "Read all articles" : "Leer todos los artículos"} &rarr;
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── 13. FINAL CTA ── */}
      <section className="relative px-6 sm:px-8 py-24 sm:py-32 overflow-hidden dark-section grain-overlay">
        <Image src="/images/grit-texture.webp" alt="" fill className="object-cover object-center" loading="lazy" />
        <div className="grit-overlay-cta absolute inset-0" />
        <div className="section-fade-top-dark" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="reveal text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[40px] lg:text-[48px]">
            {t.cta.h2}
          </h2>

          <a href="/setup" className="cta-gold cta-shimmer mt-10 inline-flex items-center justify-center gap-2 rounded-lg px-10 py-4 text-lg font-semibold text-white">
            {t.hero.cta} &rarr;
          </a>

          <p className="mt-6 text-sm text-slate-400">{t.cta.sub}</p>
          <p className="mt-4 text-sm text-slate-500">
            {lang === "en" ? "Or call us:" : "O ll\u00E1manos:"}{" "}
            <a href={PHONE_TEL} className="font-semibold text-amber hover:underline">{PHONE}</a>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <Footer lang={lang} />

      <div className="h-16 md:hidden" />
    </div>
  );
}
