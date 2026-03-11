"use client";

import { Suspense, useState, useEffect, useRef, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const PHONE = process.env.NEXT_PUBLIC_PHONE ?? "(830) 521-7133";
const PHONE_TEL = `tel:${process.env.NEXT_PUBLIC_PHONE_TEL ?? "+18305217133"}`;
const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL ?? "https://cal.com/capta/onboarding";

const BUSINESS_TYPES = [
  { value: "plumber", en: "Plumber", es: "Plomero" },
  { value: "hvac", en: "HVAC", es: "HVAC / Aire Acondicionado" },
  { value: "electrician", en: "Electrician", es: "Electricista" },
  { value: "landscaper", en: "Landscaper", es: "Jardinero / Paisajista" },
  { value: "general_contractor", en: "General Contractor", es: "Contratista General" },
  { value: "other", en: "Other", es: "Otro" },
];

const content = {
  en: {
    nav: { audit: "Free Audit", blog: "Blog", login: "Client Login", cta: "Get Capta" },
    hero: "Is Your Business Missing Calls?",
    heroSub: "We'll call your business right now and show you exactly what your customers experience. Free. No strings attached.",
    form: {
      businessName: "Business Name",
      phone: "Phone Number",
      businessType: "Business Type",
      selectType: "Select your business type",
      email: "Email Address",
      submit: "Audit My Business",
      submitting: "Scheduling...",
    },
    social: { prefix: "We've audited", suffix: "businesses in Texas" },
    howTitle: "How It Works",
    steps: [
      { num: "1", title: "Enter Your Info", desc: "Tell us your business name and phone number. Takes 30 seconds." },
      { num: "2", title: "We Call Your Business", desc: "Our system calls your number within minutes to see who picks up — and how fast." },
      { num: "3", title: "Get Your Free Report", desc: "Receive a detailed email report showing what callers experience and what it's costing you." },
    ],
    errors: {
      businessName: "Business name is required",
      phone: "Valid US phone number required",
      email: "Valid email required",
      businessType: "Please select a business type",
      duplicate: "This number was already audited recently. Check your email for the report.",
      rateLimit: "Too many requests. Please try again later.",
      generic: "Something went wrong. Please try again.",
    },
  },
  es: {
    nav: { audit: "Auditoría Gratis", blog: "Blog", login: "Acceso Clientes", cta: "Obtén Capta" },
    hero: "¿Su Negocio Está Perdiendo Llamadas?",
    heroSub: "Llamaremos a su negocio ahora mismo y le mostraremos exactamente lo que experimentan sus clientes. Gratis. Sin compromiso.",
    form: {
      businessName: "Nombre del Negocio",
      phone: "Número de Teléfono",
      businessType: "Tipo de Negocio",
      selectType: "Seleccione su tipo de negocio",
      email: "Correo Electrónico",
      submit: "Auditar Mi Negocio",
      submitting: "Programando...",
    },
    social: { prefix: "Hemos auditado", suffix: "negocios en Texas" },
    howTitle: "Cómo Funciona",
    steps: [
      { num: "1", title: "Ingrese Sus Datos", desc: "Díganos el nombre de su negocio y número de teléfono. Toma 30 segundos." },
      { num: "2", title: "Llamamos a Su Negocio", desc: "Nuestro sistema llama a su número en minutos para ver quién contesta — y qué tan rápido." },
      { num: "3", title: "Reciba Su Reporte Gratis", desc: "Reciba un reporte detallado por email mostrando lo que experimentan sus clientes y cuánto le cuesta." },
    ],
    errors: {
      businessName: "El nombre del negocio es requerido",
      phone: "Número de teléfono válido de EE.UU. requerido",
      email: "Correo electrónico válido requerido",
      businessType: "Por favor seleccione un tipo de negocio",
      duplicate: "Este número ya fue auditado recientemente. Revise su email para el reporte.",
      rateLimit: "Demasiadas solicitudes. Por favor intente más tarde.",
      generic: "Algo salió mal. Por favor intente de nuevo.",
    },
  },
};

type Lang = "en" | "es";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `+1${digits}` : `+${digits}`;
}

function AuditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<Lang>("en");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [auditCount, setAuditCount] = useState(500);
  const formRef = useRef<HTMLFormElement>(null);
  const t = content[lang];

  useEffect(() => {
    fetch("/api/audit/request?count=true")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { if (d.count) setAuditCount(d.count); })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const digits = phone.replace(/\D/g, "");
    if (!businessName.trim()) { setError(t.errors.businessName); return; }
    if (digits.length !== 10) { setError(t.errors.phone); return; }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { setError(t.errors.email); return; }
    if (!businessType) { setError(t.errors.businessType); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/audit/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          phone: toE164(phone),
          email: email.trim().toLowerCase(),
          businessType,
          language: lang,
          utmSource: searchParams.get("utm_source") ?? undefined,
          utmMedium: searchParams.get("utm_medium") ?? undefined,
          utmCampaign: searchParams.get("utm_campaign") ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) setError(t.errors.rateLimit);
        else if (data.error?.includes("already")) setError(t.errors.duplicate);
        else setError(data.error ?? t.errors.generic);
        return;
      }

      router.push(`/audit/confirmation?id=${data.id}&lang=${lang}`);
    } catch {
      setError(t.errors.generic);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-cream-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/">
            <img src="/images/logo-inline-navy.webp" alt="Capta" className="h-6 w-auto" />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => setLang(lang === "en" ? "es" : "en")}
              className="rounded-full border border-cream-border px-3 py-1 text-xs font-semibold text-charcoal-muted hover:border-amber hover:text-amber transition-colors"
            >
              {lang === "en" ? "ES" : "EN"}
            </button>
            <Link href="/blog" className="hidden sm:inline text-charcoal-muted hover:text-charcoal transition-colors">
              {t.nav.blog}
            </Link>
            <Link href="/dashboard/login" className="hidden sm:inline text-charcoal-muted hover:text-charcoal transition-colors">
              {t.nav.login}
            </Link>
            <a href={BOOKING_URL} className="cta-gold cta-shimmer rounded-lg px-4 py-2 text-xs font-semibold text-white">
              {t.nav.cta}
            </a>
          </div>
        </div>
      </nav>

      {/* Hero + Form */}
      <section className="relative bg-navy px-6 pt-28 pb-20 sm:pt-36 sm:pb-28 dark-section grain-overlay">
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <h1 className="text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[44px]">
                {t.hero}
              </h1>
              <p className="mt-5 text-lg leading-[1.7] text-slate-300">
                {t.heroSub}
              </p>
              <div className="mt-8 flex items-center gap-3">
                <span className="status-dot" />
                <span className="text-sm text-slate-400">
                  {t.social.prefix} <strong className="text-white">{auditCount.toLocaleString()}+</strong> {t.social.suffix}
                </span>
              </div>
            </div>

            {/* Right: Form */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 sm:p-10">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">{t.form.businessName}</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
                    placeholder="R&R Plumbing"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">{t.form.phone}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
                    placeholder="(512) 555-1234"
                    maxLength={14}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">{t.form.businessType}</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
                  >
                    <option value="" className="bg-navy">{t.form.selectType}</option>
                    {BUSINESS_TYPES.map((bt) => (
                      <option key={bt.value} value={bt.value} className="bg-navy">
                        {lang === "es" ? bt.es : bt.en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">{t.form.email}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
                    placeholder="mike@rrplumbing.com"
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="cta-gold cta-shimmer w-full rounded-lg px-6 py-4 text-lg font-bold text-white disabled:opacity-50"
                >
                  {submitting ? t.form.submitting : t.form.submit}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[#FBFBFC] px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-[32px] font-extrabold leading-[1.1] tracking-tight text-charcoal sm:text-[40px]">
            {t.howTitle}
          </h2>
          <div className="steps-timeline mt-16 space-y-12">
            {t.steps.map((step) => (
              <div key={step.num} className="flex gap-6">
                <div className="step-circle-glow relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber text-lg font-bold text-white">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-charcoal">{step.title}</h3>
                  <p className="mt-2 text-base leading-[1.7] text-charcoal-muted">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal px-6 py-12">
        <div className="mx-auto max-w-5xl flex flex-col items-center gap-4 text-center">
          <img src="/images/logo-inline-white.webp" alt="Capta" className="h-6 w-auto opacity-70" />
          <p className="text-sm text-white/40">Every call answered. Every job booked.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="text-white/40 hover:text-white/60 transition-colors">Home</Link>
            <Link href="/blog" className="text-white/40 hover:text-white/60 transition-colors">Blog</Link>
            <a href={PHONE_TEL} className="text-white/40 hover:text-white/60 transition-colors">{PHONE}</a>
          </div>
          <p className="text-xs text-white/30">&copy; {new Date().getFullYear()} Capta. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function AuditPage() {
  return (
    <Suspense>
      <AuditContent />
    </Suspense>
  );
}
