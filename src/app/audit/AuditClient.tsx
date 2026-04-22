"use client";

/**
 * /audit — Free missed-call audit lead form.
 * Rewritten on the industrial brand-kit primitives (March 2026).
 */

import { Suspense, useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PHONE, PHONE_TEL, type Lang } from "@/lib/marketing/translations";
import {
  C,
  Mono,
  Kicker,
  Rule,
  CatalogMarker,
  PrimaryButton,
  FieldFrame,
  FieldNav,
  FieldFooter,
  DisplayH1,
  SkipLink,
  Serial,
} from "@/components/marketing/industrial";

const BUSINESS_TYPES = [
  { value: "plumber", en: "Plumber", es: "Plomero" },
  { value: "hvac", en: "HVAC", es: "HVAC / Aire Acondicionado" },
  { value: "electrician", en: "Electrician", es: "Electricista" },
  { value: "landscaper", en: "Landscaper", es: "Jardinero / Paisajista" },
  { value: "general_contractor", en: "General Contractor", es: "Contratista General" },
  { value: "other", en: "Other", es: "Otro" },
];

const COPY = {
  en: {
    kicker: "Free audit",
    h1a: "Is your business",
    h1b: "missing calls?",
    dek: "We'll call your business right now and show you exactly what your customers experience. Free. No strings attached.",
    socialPrefix: "We've audited",
    socialSuffix: "businesses in Texas",
    form: {
      businessName: "Business name",
      phone: "Phone number",
      businessType: "Business type",
      selectType: "Select your business type",
      email: "Email address",
      submit: "Audit my business",
      submitting: "Scheduling…",
    },
    howTitle: "How it works",
    steps: [
      { num: "01", title: "Enter your info", desc: "Tell us your business name and phone number. Takes 30 seconds." },
      { num: "02", title: "We call your business", desc: "Our system calls your number within minutes to see who picks up — and how fast." },
      { num: "03", title: "Get your free report", desc: "Receive a detailed email report showing what callers experience and what it's costing you." },
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
    kicker: "Auditoría gratis",
    h1a: "¿Tu negocio",
    h1b: "está perdiendo llamadas?",
    dek: "Llamaremos a tu negocio ahora mismo y te mostraremos exactamente lo que experimentan tus clientes. Gratis. Sin compromiso.",
    socialPrefix: "Hemos auditado",
    socialSuffix: "negocios en Texas",
    form: {
      businessName: "Nombre del negocio",
      phone: "Número de teléfono",
      businessType: "Tipo de negocio",
      selectType: "Selecciona tu tipo de negocio",
      email: "Correo electrónico",
      submit: "Auditar mi negocio",
      submitting: "Programando…",
    },
    howTitle: "Cómo funciona",
    steps: [
      { num: "01", title: "Ingresa tus datos", desc: "Dinos el nombre de tu negocio y número de teléfono. Toma 30 segundos." },
      { num: "02", title: "Llamamos a tu negocio", desc: "Nuestro sistema llama a tu número en minutos para ver quién contesta — y qué tan rápido." },
      { num: "03", title: "Recibe tu reporte gratis", desc: "Recibe un reporte detallado por email mostrando lo que experimentan tus clientes y cuánto te cuesta." },
    ],
    errors: {
      businessName: "El nombre del negocio es requerido",
      phone: "Número de teléfono válido de EE.UU. requerido",
      email: "Correo electrónico válido requerido",
      businessType: "Por favor selecciona un tipo de negocio",
      duplicate: "Este número ya fue auditado recientemente. Revisa tu email para el reporte.",
      rateLimit: "Demasiadas solicitudes. Por favor intenta más tarde.",
      generic: "Algo salió mal. Por favor intenta de nuevo.",
    },
  },
};

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
  const t = COPY[lang];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("capta-lang");
    if (stored === "en" || stored === "es") setLang(stored);
  }, []);

  const toggleLang = useCallback((l: Lang) => {
    setLang(l);
    if (typeof window !== "undefined") window.localStorage.setItem("capta-lang", l);
  }, []);

  useEffect(() => {
    fetch("/api/audit/request?count=true")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        if (d.count) setAuditCount(d.count);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const digits = phone.replace(/\D/g, "");
    if (!businessName.trim()) {
      setError(t.errors.businessName);
      return;
    }
    if (digits.length !== 10) {
      setError(t.errors.phone);
      return;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError(t.errors.email);
      return;
    }
    if (!businessType) {
      setError(t.errors.businessType);
      return;
    }

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

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: C.white,
    border: `1px solid ${C.ink}`,
    borderRadius: 2,
    color: C.ink,
    fontSize: 15,
    fontWeight: 500,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: C.ink,
    marginBottom: 6,
    letterSpacing: "-0.005em",
  };

  return (
    <FieldFrame>
      <SkipLink lang={lang} />
      <FieldNav lang={lang} toggleLang={toggleLang} phone={PHONE} phoneHref={PHONE_TEL} />

      <main id="main">
        {/* Hero + form */}
        <section className="mx-auto max-w-[1280px] px-6 sm:px-10 pt-14 pb-16 sm:pt-20 sm:pb-24">
          <div style={{ marginBottom: 32 }}>
            <CatalogMarker section="07 · Audit" />
          </div>

          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
            {/* Left — copy */}
            <div className="lg:col-span-7">
              <Kicker>{t.kicker}</Kicker>

              <DisplayH1 style={{ marginTop: 24 }}>
                {t.h1a}
                <br />
                <span
                  style={{
                    borderBottom: `4px solid ${C.gold}`,
                    paddingBottom: 6,
                    display: "inline-block",
                    lineHeight: 1,
                  }}
                >
                  {t.h1b}
                </span>
              </DisplayH1>

              <p
                className="mt-8 max-w-[560px]"
                style={{
                  fontSize: 19,
                  lineHeight: 1.55,
                  color: C.inkMuted,
                  fontWeight: 500,
                }}
              >
                {t.dek}
              </p>

              <div
                className="mt-10 flex items-center gap-3"
                style={{ fontSize: 13, color: C.inkMuted, fontWeight: 600 }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: C.success,
                    display: "inline-block",
                  }}
                />
                <span>
                  {t.socialPrefix}{" "}
                  <Mono style={{ color: C.ink, fontWeight: 800 }}>
                    {auditCount.toLocaleString()}+
                  </Mono>{" "}
                  {t.socialSuffix}
                </span>
              </div>
            </div>

            {/* Right — form */}
            <div className="lg:col-span-5">
              <div
                style={{
                  border: `1px solid ${C.ink}`,
                  background: C.white,
                  padding: 28,
                  position: "relative",
                }}
              >
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 56,
                    height: 4,
                    background: C.gold,
                  }}
                />
                <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div>
                    <label style={labelStyle}>{t.form.businessName}</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      style={inputBase}
                      placeholder="R&R Plumbing"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>{t.form.phone}</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      style={{
                        ...inputBase,
                        fontFamily: "var(--font-mono), ui-monospace, Menlo, monospace",
                        fontVariantNumeric: "tabular-nums",
                      }}
                      placeholder="(512) 555-1234"
                      maxLength={14}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>{t.form.businessType}</label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      style={{
                        ...inputBase,
                        appearance: "none",
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 14px center",
                        paddingRight: 36,
                      }}
                    >
                      <option value="">{t.form.selectType}</option>
                      {BUSINESS_TYPES.map((bt) => (
                        <option key={bt.value} value={bt.value}>
                          {lang === "es" ? bt.es : bt.en}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{t.form.email}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={inputBase}
                      placeholder="mike@rrplumbing.com"
                    />
                  </div>

                  {error && (
                    <div
                      style={{
                        padding: "10px 12px",
                        background: C.dangerBg,
                        border: `1px solid ${C.danger}`,
                        fontSize: 13,
                        color: C.danger,
                        fontWeight: 600,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: C.gold,
                      color: C.midnight,
                      fontSize: 15,
                      fontWeight: 800,
                      padding: "14px 20px",
                      border: `1px solid ${C.gold}`,
                      borderRadius: 0,
                      cursor: submitting ? "not-allowed" : "pointer",
                      opacity: submitting ? 0.55 : 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      letterSpacing: "-0.005em",
                      transition: "background 150ms",
                    }}
                    onMouseEnter={(e) =>
                      !submitting && (e.currentTarget.style.background = C.goldDark)
                    }
                    onMouseLeave={(e) =>
                      !submitting && (e.currentTarget.style.background = C.gold)
                    }
                  >
                    {submitting ? t.form.submitting : t.form.submit}
                    {!submitting && <span>→</span>}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <Rule />

        {/* How it works */}
        <section className="mx-auto max-w-[1280px] px-6 sm:px-10 py-20 sm:py-28">
          <div className="max-w-[720px]">
            <Kicker>{t.howTitle}</Kicker>
          </div>

          <div
            className="mt-14 grid md:grid-cols-3"
            style={{
              border: `1px solid ${C.ink}`,
              background: C.white,
            }}
          >
            {t.steps.map((step, i) => (
              <div
                key={step.num}
                style={{
                  padding: "36px 28px 32px",
                  borderRight: i < t.steps.length - 1 ? `1px solid ${C.ink}` : "none",
                  position: "relative",
                  minHeight: 200,
                }}
                className={i < t.steps.length - 1 ? "max-md:!border-r-0 max-md:!border-b" : ""}
              >
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 56,
                    height: 4,
                    background: C.gold,
                  }}
                />
                <Serial n={step.num} size="lg" />
                <h3
                  className="mt-4"
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: C.ink,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.15,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="mt-3"
                  style={{
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: C.inkMuted,
                    fontWeight: 500,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <PrimaryButton
              href="#top"
              size="lg"
              onClick={(e) => {
                e.preventDefault();
                formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                formRef.current?.querySelector("input")?.focus();
              }}
            >
              {t.form.submit}
            </PrimaryButton>
            <a
              href={PHONE_TEL}
              style={{
                color: C.ink,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: 4,
                textDecorationColor: C.gold,
                textDecorationThickness: 2,
                fontVariantNumeric: "tabular-nums",
                fontFamily: "var(--font-mono), ui-monospace, Menlo, monospace",
              }}
            >
              {PHONE}
            </a>
          </div>
        </section>
      </main>

      <FieldFooter lang={lang} phone={PHONE} phoneHref={PHONE_TEL} />
    </FieldFrame>
  );
}

export default function AuditPage() {
  return (
    <Suspense>
      <AuditContent />
    </Suspense>
  );
}
