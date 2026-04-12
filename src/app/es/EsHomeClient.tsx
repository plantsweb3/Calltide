"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, MotionConfig } from "framer-motion";
import dynamic from "next/dynamic";

import { T, PHONE, PHONE_TEL, type Lang } from "@/lib/marketing/translations";
import { useScrolled, useScrollReveal } from "@/lib/marketing/hooks";
import { FEATURE_ICONS, STEP_ICONS } from "@/components/marketing/icons";
import { SpotlightCard } from "@/components/marketing/SpotlightCard";
import { Counter } from "@/components/marketing/Counter";
import { ROICalculator } from "@/components/marketing/ROICalculator";
import RevenueCycle from "@/components/marketing/RevenueCycle";
import CallShowcase from "@/components/marketing/CallShowcase";
import { FAQ } from "@/components/marketing/FAQ";
import { MissedCallCalculator } from "@/components/marketing/MissedCallCalculator";
import { MobileCTA } from "@/components/marketing/MobileCTA";
import { Footer } from "@/components/marketing/Footer";
import Link from "next/link";

const MariaDemoWidget = dynamic(() => import("@/components/marketing/MariaDemoWidget"), { ssr: false });

/**
 * Spanish Nav — same as main Nav but with link to English homepage
 * instead of a toggle, so Google can crawl /es as a standalone page.
 */
function EsNav({ scrolled }: { scrolled: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className={`sticky top-0 z-40 border-b transition-all duration-300 ${scrolled ? "nav-scrolled border-transparent" : "border-cream-border bg-cream"}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 sm:px-8 py-4">
        <a href="/es"><Image src="/images/logo-inline-navy.webp" alt="Capta" width={120} height={32} priority className="h-7 w-auto sm:h-8" /></a>
        <div className="hidden items-center gap-8 md:flex">
          <a href="/es#features" className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">Plataforma</a>
          <a href="/es#pricing" className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">Precios</a>
          <a href="/es#how-it-works" className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">C&oacute;mo Funciona</a>
          <a href="/es/blog" className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">Blog</a>
          <a href="/es/help" className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">Ayuda</a>
          <a href={PHONE_TEL} className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">{PHONE}</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-full border px-3 py-1.5 text-xs font-semibold text-charcoal-muted transition hover:border-amber hover:text-amber" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
            EN
          </Link>
          <a href="/dashboard/login" className="hidden text-sm font-medium text-charcoal-muted transition hover:text-charcoal sm:inline-block">Iniciar Sesi&oacute;n</a>
          <a href="/setup" className="cta-shimmer hidden items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light sm:inline-flex">
            Prueba Gratis
          </a>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="flex h-10 w-10 items-center justify-center rounded-lg text-charcoal md:hidden" aria-label="Men&uacute;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>}
            </svg>
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="border-t border-cream-border bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <a href="/es#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-charcoal-muted">Plataforma</a>
            <a href="/es#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-charcoal-muted">Precios</a>
            <a href="/es#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-charcoal-muted">C&oacute;mo Funciona</a>
            <a href="/es/blog" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-charcoal-muted">Blog</a>
            <a href="/es/help" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-charcoal-muted">Ayuda</a>
            <a href={PHONE_TEL} className="text-sm font-medium text-charcoal-muted">{PHONE}</a>
            <a href="/dashboard/login" className="text-sm font-medium text-charcoal-muted">Iniciar Sesi&oacute;n</a>
            <a href="/setup" onClick={() => setMobileMenuOpen(false)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white">Prueba Gratis</a>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function EsHomepage() {
  const [planChoice, setPlanChoice] = useState<"monthly" | "annual">("annual");
  const scrolled = useScrolled();
  useScrollReveal();

  const lang: Lang = "es";
  const t = T[lang];

  return (
    <MotionConfig reducedMotion="user">
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
            description: "Recepcionista IA para negocios de servicios del hogar. Contesta cada llamada en ingl\u00E9s y espa\u00F1ol, 24/7. Agenda citas.",
            inLanguage: "es",
          }),
        }}
      />
      <MobileCTA lang={lang} />

      <EsNav scrolled={scrolled} />

      {/* ── 1. HERO ── */}
      <section className="relative overflow-hidden grain-overlay">
        <img src="/images/grit-hvac.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-center" fetchPriority="high" />
        <div className="hero-bg-overlay absolute inset-0" />
        <div className="section-fade-bottom" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8 py-24 sm:py-32">
          <div className="grid items-center gap-16 md:grid-cols-5">
            <div className="md:col-span-3">
              <div className="hero-glass">
                <a href="/es/status" className="group inline-flex items-center gap-2 mb-6">
                  <span className="status-dot" />
                  <span className="text-xs font-medium tracking-wide text-slate-400 transition group-hover:text-white">Contestando llamadas ahora</span>
                </a>
                <p className="section-label text-amber">{t.hero.badge}</p>
                <h1 className="mt-6 text-[clamp(40px,5.5vw,72px)] font-black leading-[1.05] tracking-tight text-white">{t.hero.h1}</h1>
                <p className="mt-6 max-w-xl text-xl font-medium leading-[1.7] text-slate-300">{t.hero.sub}</p>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div>
                    <a href="/setup" className="cta-gold cta-shimmer hero-cta-glow inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-base font-semibold text-white">
                      {t.hero.cta} &rarr;
                    </a>
                    <p className="mt-2 text-xs text-slate-400">Sin cargo por 14 d&iacute;as &middot; Cancela cuando quieras</p>
                  </div>
                  <a href={PHONE_TEL} className="text-center text-sm font-medium text-slate-400 transition hover:text-white sm:text-left">
                    O ll&aacute;mala: {PHONE} &rarr;
                  </a>
                </div>

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
            <p className="section-label text-charcoal-light">{t.problem.label}</p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[1.15] tracking-tight text-charcoal sm:text-[44px] max-w-3xl mx-auto">{t.problem.h2}</h2>
          </div>
          <div className="snap-scroll-mobile reveal mt-16 grid gap-8 sm:grid-cols-2">
            <div className="card-shadow card-hover rounded-2xl border border-cream-border bg-white p-10 text-center">
              <p className="gold-gradient-text text-[48px] font-extrabold">62%</p>
              <p className="mt-3 text-base leading-[1.7] text-charcoal-muted">{t.problem.stat1}</p>
            </div>
            <div className="card-shadow card-hover rounded-2xl border border-cream-border bg-white p-10 text-center">
              <p className="gold-gradient-text text-[48px] font-extrabold">80%</p>
              <p className="mt-3 text-base leading-[1.7] text-charcoal-muted">
                El 80% de las personas no dejan <span className="italic font-semibold text-amber">mensaje de voz</span> — llaman a tu competencia
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2b. SMS AUTOMATION SHOWCASE ── */}
      <section className="bg-[#FBFBFC] px-6 sm:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center mb-16">
            <p className="section-label text-charcoal-light">{t.officeManager.label}</p>
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
                  <div className="bg-[#f8f8f8] px-6 py-4 flex items-center gap-3 border-b border-gray-100">
                    <div className="h-9 w-9 rounded-full bg-amber/15 flex items-center justify-center">
                      <span className="text-sm font-bold text-amber">M</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-charcoal">Maria</p>
                      <p className="text-[11px] text-charcoal-muted">Gerente de Oficina IA</p>
                    </div>
                  </div>
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
                <p className="mt-2 text-xs text-slate-400">Sin cargo por 14 d&iacute;as &middot; Cancela cuando quieras</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. DEMO CTA BANNER ── */}
      <section className="bg-navy px-6 sm:px-8 py-16 sm:py-20 dark-section">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-label text-slate-400">{t.hero.demoSection}</p>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{t.hero.demoSub}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400">{t.hero.demoDetail}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <div className="text-center">
              <a href="/setup" className="cta-gold cta-shimmer inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base font-semibold text-white">
                Prueba Gratis &rarr;
              </a>
              <p className="mt-2 text-xs text-slate-400">Sin cargo por 14 d&iacute;as &middot; Cancela cuando quieras</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ── */}
      <section id="how-it-works" className="relative bg-navy px-6 sm:px-8 py-24 sm:py-32 dark-section grain-overlay">
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="reveal text-center">
            <p className="section-label text-slate-400">{t.howItWorks.label}</p>
            <h2 className="mt-4 text-[36px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[48px]">{t.howItWorks.h2}</h2>
          </div>
          <div className="mt-20 steps-timeline space-y-14 mx-auto max-w-2xl">
            {t.howItWorks.steps.map((step, i) => {
              const StepIcon = STEP_ICONS[i];
              return (
                <div key={i} className="reveal flex gap-6">
                  <div className="step-circle-glow relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber text-white"><StepIcon size={24} /></div>
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

      {/* ── 4b. REVENUE CYCLE ── */}
      <RevenueCycle lang={lang} />

      {/* ── 4c. CALL SHOWCASE ── */}
      <CallShowcase lang={lang} />

      {/* ── 5. FEATURES GRID ── */}
      <section id="features" className="relative bg-[#1B2A4A] px-6 sm:px-8 py-24 sm:py-32 dark-section grain-overlay">
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="reveal text-center">
            <p className="section-label text-slate-400">{t.features.label}</p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[44px]">{t.features.h2}</h2>
          </div>
          <div className="snap-scroll-mobile mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.features.cards.map((f, i) => {
              const FeatureIcon = FEATURE_ICONS[i];
              return (
                <SpotlightCard key={i} className="glass-card ambient-edge rounded-xl">
                  <motion.div className="p-8 sm:p-10" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber/10"><FeatureIcon size={20} className="text-amber" /></div>
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
        <div className="relative z-10 mx-auto max-w-5xl"><ROICalculator lang="es" /></div>
      </section>

      {/* ── 7. SOCIAL PROOF ── */}
      <section className="bg-[#FBFBFC] px-6 sm:px-8 pb-24 sm:pb-32">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center">
            <p className="section-label text-charcoal-light">{t.social.label}</p>
          </div>
          <div className="snap-scroll-mobile mt-12 grid gap-8 sm:grid-cols-3">
            {t.social.stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className={`card-shadow card-hover rounded-2xl border border-cream-border bg-white text-center ${i === 2 ? "p-8 sm:col-span-1" : "p-10"}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="gold-gradient-text text-[48px] font-extrabold"><Counter value={stat.value} suffix={stat.suffix} /></p>
                <p className="mt-2 text-sm font-semibold text-charcoal">{stat.label}</p>
                {"body" in stat && stat.body && (
                  <p className="mt-3 text-sm leading-relaxed text-charcoal-muted">{stat.body}</p>
                )}
              </motion.div>
            ))}
          </div>
          <div className="reveal mt-12 grid gap-8 sm:grid-cols-2">
            {t.social.highlights.map((item, i) => (
              <div key={i} className="card-shadow card-hover rounded-2xl border border-cream-border bg-white p-10">
                <h3 className="text-lg font-extrabold tracking-tight text-charcoal">{item.title}</h3>
                <p className="mt-3 text-base leading-[1.7] text-charcoal-muted">{item.text}</p>
                <p className="mt-4 text-sm font-medium text-amber">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7c. SOFTWARE REPLACEMENT ── */}
      <section className="px-6 sm:px-8 py-24 sm:py-32 dark-section" style={{ background: "#111a2e" }}>
        <div className="mx-auto max-w-3xl">
          <div className="reveal text-center">
            <p className="section-label text-slate-400">{t.softwareReplace.label}</p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[44px]">
              {t.softwareReplace.h2}
            </h2>
          </div>

          <div className="reveal mt-14 space-y-3">
            {t.softwareReplace.items.map((item, i) => (
              <motion.div
                key={i}
                className="dark-surface flex items-center justify-between rounded-2xl px-6 py-5"
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
            <div className="flex items-center justify-between rounded-2xl px-6 py-5 mt-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="text-[15px] text-slate-500">Total</span>
              <span className="text-lg font-bold text-slate-500 line-through">{t.softwareReplace.total}</span>
            </div>

            {/* Capta price */}
            <div className="rounded-2xl px-6 py-6 text-center" style={{ background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)" }}>
              <p className="text-xl font-extrabold text-amber">{t.softwareReplace.captaPrice}</p>
            </div>

            <p className="text-center text-sm text-slate-500 mt-4">{t.softwareReplace.footer}</p>
          </div>
        </div>
      </section>

      {/* ── 8. PRICING ── */}
      <section id="pricing" className="bg-[#111317] px-6 sm:px-8 py-24 sm:py-32 dark-section">
        <div className="mx-auto max-w-3xl">
          <div className="reveal text-center">
            <p className="section-label text-slate-400">{t.pricing.label}</p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-[#E8E9EB] sm:text-[44px]">{t.pricing.h2}</h2>
          </div>
          <div className="reveal mt-8 flex items-center justify-center gap-3">
            <button onClick={() => setPlanChoice("monthly")} className="rounded-full px-5 py-2 text-sm font-semibold transition" style={{ background: planChoice === "monthly" ? "#C59A27" : "transparent", color: planChoice === "monthly" ? "#0f0f0f" : "#A0A3A8", border: planChoice === "monthly" ? "1px solid #C59A27" : "1px solid rgba(255,255,255,0.15)" }}>
              Mensual
            </button>
            <button onClick={() => setPlanChoice("annual")} className="relative rounded-full px-5 py-2 text-sm font-semibold transition" style={{ background: planChoice === "annual" ? "#C59A27" : "transparent", color: planChoice === "annual" ? "#0f0f0f" : "#A0A3A8", border: planChoice === "annual" ? "1px solid #C59A27" : "1px solid rgba(255,255,255,0.15)" }}>
              Anual
              <span className="absolute -top-2.5 -right-2 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">-20%</span>
            </button>
          </div>
          <div className="reveal mt-8 mx-auto max-w-lg">
            <div className="pricing-glow ambient-edge relative rounded-2xl border border-[#C59A27]/30 bg-[#1A1D0F] p-10 text-center sm:p-14">
              <p className="mt-2 text-[56px] font-extrabold tracking-tight text-[#E8E9EB]">{planChoice === "annual" ? "$397" : "$497"}</p>
              <p className="text-sm text-[#A0A3A8]">{planChoice === "annual" ? "/mes \u2014 facturado anualmente a $4,764/a\u00F1o" : t.pricing.period}</p>
              {planChoice === "annual" && <p className="mt-2 text-sm font-semibold text-green-400">Ahorra $1,200/a\u00F1o</p>}
              <p className="mt-4 text-base text-[#A0A3A8]">{t.pricing.sub}</p>
              <ul className="mt-8 space-y-4 text-left text-sm text-[#E8E9EB]">
                {t.pricing.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="mt-0.5 text-[#C59A27]">&#10003;</span>{f}</li>
                ))}
              </ul>
              <p className="mt-8 text-sm italic text-[#A0A3A8]">{t.pricing.comparison}</p>
              <a href="/setup" className="cta-gold cta-shimmer mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold text-white">{t.pricing.cta} &rarr;</a>
              <p className="mt-2 text-xs text-slate-400">Sin cargo por 14 d&iacute;as &middot; Cancela cuando quieras</p>
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
            <h2 className="text-[36px] font-extrabold leading-[1.1] tracking-tight text-charcoal sm:text-[48px]">{t.faq.h2}</h2>
          </div>
          <div className="reveal mt-14"><FAQ lang={lang} /></div>
        </div>
      </section>

      {/* ── RESOURCES ── */}
      <section className="bg-[#FBFBFC] px-6 sm:px-8 pb-24 sm:pb-32">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center">
            <p className="section-label text-charcoal-light">{t.resources.label}</p>
            <h2 className="mt-4 text-[32px] font-extrabold leading-[1.15] tracking-tight text-charcoal sm:text-[44px] max-w-3xl mx-auto">
              {t.resources.h2}
            </h2>
            <p className="mt-4 text-base text-charcoal-muted">{t.resources.sub}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.resources.cards.map((card, i) => (
              <motion.a
                key={card.slug}
                href={`/es/help/${card.slug}`}
                className="card-shadow card-hover rounded-2xl border border-cream-border bg-white p-8 block group"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="inline-block rounded-full bg-amber/10 px-3 py-1 text-xs font-semibold text-amber">{card.tag}</span>
                <h3 className="mt-4 text-lg font-bold leading-snug tracking-tight text-charcoal group-hover:text-amber transition">{card.title}</h3>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-amber">
                  Leer art&iacute;culo &rarr;
                </span>
              </motion.a>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            <a href="/es/blog" className="text-sm font-semibold text-charcoal-muted underline underline-offset-4 transition hover:text-amber">
              {t.resources.blogCta} &rarr;
            </a>
            <a href="/es/help" className="text-sm font-semibold text-charcoal-muted underline underline-offset-4 transition hover:text-amber">
              {t.resources.helpCta} &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ── MISSED CALL CALCULATOR ── */}
      <MissedCallCalculator lang={lang} />

      {/* ── 10. FINAL CTA ── */}
      <section className="relative px-6 sm:px-8 py-24 sm:py-32 overflow-hidden dark-section grain-overlay">
        <img src="/images/grit-texture.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-center" loading="lazy" />
        <div className="grit-overlay-cta absolute inset-0" />
        <div className="section-fade-top-dark" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="reveal text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[40px] lg:text-[48px]">{t.cta.h2}</h2>
          <a href="/setup" className="cta-gold cta-shimmer mt-10 inline-flex items-center justify-center gap-2 rounded-lg px-10 py-4 text-lg font-semibold text-white">
            {t.hero.cta} &rarr;
          </a>
          <p className="mt-2 text-xs text-slate-400">Sin cargo por 14 d&iacute;as &middot; Cancela cuando quieras</p>
          <p className="mt-6 text-sm text-slate-400">{t.cta.sub}</p>
          <p className="mt-4 text-sm text-slate-500">
            O ll&aacute;manos: <a href={PHONE_TEL} className="font-semibold text-amber hover:underline">{PHONE}</a>
          </p>
        </div>
      </section>

      <Footer lang={lang} />
      <div className="h-16 md:hidden" />
    </div>
    </MotionConfig>
  );
}
