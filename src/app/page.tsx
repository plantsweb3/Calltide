"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

import { T, PHONE, PHONE_TEL, BOOKING_URL, type Lang } from "@/lib/marketing/translations";
import { useScrolled, useScrollReveal } from "@/lib/marketing/hooks";
import { FEATURE_ICONS, STEP_ICONS, WORKFLOW_ICONS } from "@/components/marketing/icons";
import { SpotlightCard } from "@/components/marketing/SpotlightCard";
import { Counter } from "@/components/marketing/Counter";
import { ROICalculator } from "@/components/marketing/ROICalculator";
import { FAQ } from "@/components/marketing/FAQ";
import { SignupForm, SignupStatus } from "@/components/marketing/SignupForm";
import { MobileCTA } from "@/components/marketing/MobileCTA";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

const VoiceChat = dynamic(() => import("@/components/voice-chat"), { ssr: false });
const MariaDemoWidget = dynamic(() => import("@/components/marketing/MariaDemoWidget"), { ssr: false });

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [planChoice, setPlanChoice] = useState<"monthly" | "annual">("annual");
  const scrolled = useScrolled();
  useScrollReveal();

  // Persist language preference
  const toggleLang = useCallback((l: Lang) => {
    setLang(l);
    if (typeof window !== "undefined") localStorage.setItem("calltide-lang", l);
  }, []);

  // Restore on mount
  useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("calltide-lang");
      if (saved === "en" || saved === "es") setLang(saved);
    }
  });

  const t = T[lang];

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
      {showVoiceChat && <VoiceChat onClose={() => setShowVoiceChat(false)} />}
      <MobileCTA lang={lang} />

      {/* ── NAVIGATION ── */}
      <Nav lang={lang} toggleLang={toggleLang} scrolled={scrolled} />

      {/* ── 1. HERO ── */}
      <section className="relative overflow-hidden grain-overlay">
        <img src="/images/grit-hvac.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-center" fetchPriority="high" />
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
                  <a href="#signup" className="cta-gold cta-shimmer hero-cta-glow inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-base font-semibold text-white">
                    {t.hero.cta} &rarr;
                  </a>
                  <button onClick={() => setShowVoiceChat(true)} className="text-center text-sm font-medium text-slate-400 transition hover:text-white sm:text-left">
                    {lang === "en" ? "Or hear it live" : "O escúchala en vivo"} &rarr;
                  </button>
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

      {/* ── 2. THE PROBLEM ── */}
      <section id="problem" className="bg-[#FBFBFC] px-6 sm:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-charcoal-light">{t.problem.label}</p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[1.15] tracking-tight text-charcoal sm:text-[44px] max-w-3xl mx-auto">
              {t.problem.h2}
            </h2>
          </div>

          <div className="snap-scroll-mobile reveal mt-16 grid gap-8 sm:grid-cols-2">
            <div className="card-shadow card-hover rounded-xl border border-cream-border bg-white p-10 text-center">
              <p className="gold-gradient-text text-[48px] font-extrabold">62%</p>
              <p className="mt-3 text-base leading-[1.7] text-charcoal-muted">{t.problem.stat1}</p>
            </div>
            <div className="card-shadow card-hover rounded-xl border border-cream-border bg-white p-10 text-center">
              <p className="gold-gradient-text text-[48px] font-extrabold">80%</p>
              <p className="mt-3 text-base leading-[1.7] text-charcoal-muted">
                {lang === "en"
                  ? <>80% of callers won&apos;t leave a <span className="italic font-semibold text-amber">voicemail</span> — they call your competitor</>
                  : <>El 80% de las personas no dejan <span className="italic font-semibold text-amber">mensaje de voz</span> — llaman a tu competencia</>
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. DEMO CTA BANNER ── */}
      <section className="bg-navy px-6 sm:px-8 py-16 sm:py-20 dark-section">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{t.hero.demoSection}</p>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{t.hero.demoSub}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400">{t.hero.demoDetail}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a href={BOOKING_URL} className="cta-gold cta-shimmer inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base font-semibold text-white">
              {lang === "en" ? "Book a Demo" : "Reservar Demo"} &rarr;
            </a>
            <a href="/setup" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:border-white/40">
              {lang === "en" ? "Try Calltide Free" : "Prueba Calltide Gratis"}
            </a>
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ── */}
      <section id="how-it-works" className="relative bg-navy px-6 sm:px-8 py-24 sm:py-32 dark-section grain-overlay">
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

      {/* ── 4b. WORKFLOW — What Maria Actually Does ── */}
      <section className="bg-[#FBFBFC] px-6 sm:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <div className="reveal text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-charcoal-light">{t.workflow.label}</p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[1.15] tracking-tight text-charcoal sm:text-[44px] max-w-2xl mx-auto">
              {t.workflow.h2}
            </h2>
          </div>

          <div className="mt-16 relative">
            {/* Vertical timeline line */}
            <div className="absolute left-7 top-0 bottom-0 w-px bg-gradient-to-b from-amber/40 via-amber/20 to-transparent hidden sm:block" />

            <div className="space-y-10">
              {t.workflow.steps.map((step, i) => {
                const StepIcon = WORKFLOW_ICONS[i];
                return (
                  <motion.div
                    key={i}
                    className="reveal flex gap-6 items-start"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-amber/30 bg-white shadow-sm">
                      <StepIcon size={22} className="text-amber" />
                    </div>
                    <div className="pt-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-widest text-amber">{lang === "en" ? `Step ${i + 1}` : `Paso ${i + 1}`}</span>
                      </div>
                      <h3 className="mt-1 text-[20px] font-extrabold tracking-tight text-charcoal">{step.title}</h3>
                      <p className="mt-2 text-base leading-[1.7] text-charcoal-muted">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. FEATURES GRID ── */}
      <section id="features" className="relative bg-[#1B2A4A] px-6 sm:px-8 py-24 sm:py-32 dark-section grain-overlay">
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="reveal text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{t.features.label}</p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[44px]">
              {t.features.h2}
            </h2>
          </div>

          <div className="snap-scroll-mobile mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.features.cards.map((f, i) => {
              const FeatureIcon = FEATURE_ICONS[i];
              return (
                <SpotlightCard key={i} className="glass-card ambient-edge rounded-xl">
                  <motion.div
                    className="p-8 sm:p-10"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber/10">
                      <FeatureIcon size={20} className="text-amber" />
                    </div>
                    <h3 className="mt-4 text-xl font-extrabold leading-[1.3] tracking-tight text-white">{f.title}</h3>
                    <p className="mt-3 text-base leading-[1.7] text-[#B8C4D4]">{f.desc}</p>
                  </motion.div>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. ROI CALCULATOR ── */}
      <section className="relative px-6 sm:px-8 py-24 sm:py-32 dark-section" style={{ background: "#0f1729" }}>
        <div className="relative z-10 mx-auto max-w-5xl">
          <ROICalculator lang={lang} />
        </div>
      </section>

      {/* ── 7. SOCIAL PROOF ── */}
      <section className="bg-[#FBFBFC] px-6 sm:px-8 pb-24 sm:pb-32">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-charcoal-light">{t.social.label}</p>
          </div>

          <div className="snap-scroll-mobile mt-12 grid gap-8 sm:grid-cols-3">
            {t.social.stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className={`card-shadow card-hover rounded-xl border border-cream-border bg-white text-center ${i === 2 ? "p-8 sm:col-span-1" : "p-10"}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="gold-gradient-text text-[48px] font-extrabold">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-sm font-semibold text-charcoal">{stat.label}</p>
                {"body" in stat && stat.body && (
                  <p className="mt-3 text-sm leading-relaxed text-charcoal-muted">{stat.body}</p>
                )}
              </motion.div>
            ))}
          </div>

          <div className="reveal mt-12 grid gap-8 sm:grid-cols-2">
            {t.social.highlights.map((item, i) => (
              <div key={i} className="card-shadow card-hover rounded-xl border border-cream-border bg-white p-10">
                <h3 className="text-lg font-extrabold tracking-tight text-charcoal">{item.title}</h3>
                <p className="mt-3 text-base leading-[1.7] text-charcoal-muted">{item.text}</p>
                <p className="mt-4 text-sm font-medium text-amber">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. PRICING ── */}
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
                  ? (lang === "en" ? "/mo — billed annually at $4,764/yr" : "/mes — facturado anualmente a $4,764/año")
                  : t.pricing.period}
              </p>
              {planChoice === "annual" && (
                <p className="mt-2 text-sm font-semibold text-green-400">
                  {lang === "en" ? "Save $1,200/year" : "Ahorra $1,200/año"}
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

              <a href="#signup" className="cta-gold cta-shimmer mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold text-white">
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

      {/* ── 9. FAQ ── */}
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

      {/* ── RESOURCES ── */}
      <section className="bg-[#FBFBFC] px-6 sm:px-8 pb-24 sm:pb-32">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-charcoal-light">{t.resources.label}</p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[1.15] tracking-tight text-charcoal sm:text-[44px] max-w-3xl mx-auto">
              {t.resources.h2}
            </h2>
            <p className="mt-4 text-base text-charcoal-muted">{t.resources.sub}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.resources.cards.map((card, i) => (
              <motion.a
                key={card.slug}
                href={`${lang === "en" ? "" : "/es"}/help/${card.slug}`}
                className="card-shadow card-hover rounded-xl border border-cream-border bg-white p-8 block group"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="inline-block rounded-full bg-amber/10 px-3 py-1 text-xs font-semibold text-amber">{card.tag}</span>
                <h3 className="mt-4 text-lg font-bold leading-snug tracking-tight text-charcoal group-hover:text-amber transition">{card.title}</h3>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-amber">
                  {lang === "en" ? "Read article" : "Leer artículo"} &rarr;
                </span>
              </motion.a>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            <a href={lang === "en" ? "/blog" : "/es/blog"} className="text-sm font-semibold text-charcoal-muted underline underline-offset-4 transition hover:text-amber">
              {t.resources.blogCta} &rarr;
            </a>
            <a href={lang === "en" ? "/help" : "/es/help"} className="text-sm font-semibold text-charcoal-muted underline underline-offset-4 transition hover:text-amber">
              {t.resources.helpCta} &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ── 10. FINAL CTA + SIGNUP ── */}
      <section id="signup" className="relative px-6 sm:px-8 py-24 sm:py-32 overflow-hidden dark-section grain-overlay">
        <img src="/images/grit-texture.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-center" loading="lazy" />
        <div className="grit-overlay-cta absolute inset-0" />
        <div className="section-fade-top-dark" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="reveal text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[40px] lg:text-[48px]">
            {t.cta.h2}
          </h2>

          <SignupForm lang={lang} plan={planChoice} />

          <SignupStatus lang={lang} />

          <p className="mt-6 text-sm text-slate-400">{t.cta.sub}</p>
          <p className="mt-4 text-sm text-slate-500">
            {lang === "en" ? "Or call us:" : "O llámanos:"}{" "}
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
