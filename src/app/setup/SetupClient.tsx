"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ── Types ──

type Lang = "en" | "es";
type PlanType = "monthly" | "annual";

interface SetupSession {
  id: string;
  token: string;
  businessName: string | null;
  businessType: string | null;
  city: string | null;
  state: string | null;
  services: string[] | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  receptionistName: string | null;
  personalityPreset: string | null;
  faqAnswers: Record<string, string> | null;
  offLimits: Record<string, boolean> | null;
  selectedPlan: string | null;
  currentStep: number;
  maxStepReached: number;
  status: string;
  language: string;
}

interface TradeData {
  type: string;
  label: string;
  commonServices: string[];
  avgJobValue: number;
  roi: {
    callsPerDay: number;
    missedPerDay: number;
    lostForever: number;
    estimatedMonthlyLoss: number;
    mariaCost: number;
    callsToPayForMaria: number;
    roiMultiple: number;
    note: string;
  };
}

// ── Bilingual Content ──

const T = {
  en: {
    // Nav
    langToggle: "ES",
    // Step 1
    step1Title: "What's your business?",
    step1Sub: "We'll customize your receptionist for your trade.",
    bizName: "Business Name",
    bizNamePlaceholder: "e.g. Smith Plumbing",
    tradeType: "Trade / Industry",
    tradePlaceholder: "Select your trade",
    city: "City",
    cityPlaceholder: "e.g. San Antonio",
    state: "State",
    statePlaceholder: "e.g. TX",
    servicesTitle: "Services You Offer",
    addService: "Add",
    addServicePlaceholder: "Add a custom service...",
    // Step 2
    step2Title: "How should we reach you?",
    step2Sub: "You'll get real-time notifications when she books appointments.",
    ownerName: "Your Name",
    ownerNamePlaceholder: "e.g. John Smith",
    email: "Email",
    emailPlaceholder: "john@smithplumbing.com",
    phone: "Phone",
    phonePlaceholder: "(210) 555-1234",
    // Step 3
    step3Title: "Name your receptionist",
    step3Sub: "She'll introduce herself by this name on every call.",
    namePresets: ["Maria", "Sofia", "Isabella"],
    customName: "Custom Name",
    namePlaceholder: "Enter a name",
    // Step 4
    step4Title: "Choose her personality",
    step4Sub: "How should she sound on the phone?",
    professional: "Professional",
    professionalDesc: "Polished and efficient. Gets straight to business.",
    professionalSample: "Good morning, thank you for calling {biz}. This is {name}, how may I assist you today?",
    friendly: "Friendly",
    friendlyDesc: "Warm and approachable. Makes every caller feel welcome.",
    friendlySample: "Hi there! Thanks for calling {biz}! I'm {name} — what can I help you with today?",
    warm: "Warm & Caring",
    warmDesc: "Extra empathetic. Perfect for sensitive situations.",
    warmSample: "Hello, thank you so much for calling {biz}. I'm {name}, and I'm here to help. What's going on?",
    // Step 5
    step5Title: "Teach her your business",
    step5Sub: "Help her answer common questions from callers.",
    faqHoursQ: "What are your hours?",
    faqHoursPlaceholder: "e.g. Mon-Fri 8am-5pm, Sat by appointment",
    faqAreaQ: "What areas do you serve?",
    faqAreaPlaceholder: "e.g. San Antonio and surrounding areas within 30 miles",
    faqEstimatesQ: "Do you offer free estimates?",
    faqEstimatesPlaceholder: "e.g. Yes, we offer free on-site estimates for all services",
    offLimitsTitle: "Off-Limits Topics",
    offLimitsSub: "She'll politely redirect if callers ask about these.",
    offLimitsPricing: "Don't discuss pricing over the phone",
    offLimitsCompetitors: "Don't discuss competitors",
    offLimitsTiming: "Don't make timing promises",
    // Step 6
    step6Title: "Hire",
    step6Sub: "is ready to answer phones for",
    trialNote: "You won't be charged for 14 days",
    cancelAnytime: "Cancel anytime",
    guarantee: "30-day money-back guarantee",
    monthlyLabel: "Monthly",
    annualLabel: "Annual",
    monthlyPrice: "$497",
    monthlyPer: "/month",
    annualPrice: "$397",
    annualPer: "/month billed annually",
    annualSave: "Save $1,200",
    hireCta: "Hire",
    missedCallsTitle: "You're Losing Money Right Now",
    roiMonthlyLoss: "/month in missed calls",
    roiMultiple: "x return on investment",
    configSummary: "What she knows:",
    // Toasts
    toast1: "Thank you for calling {biz}! How can I help you today?",
    toast2Title: "New call notification",
    toast2Body: "You'll get real-time alerts like this",
    toast3: "{name} is ready — she'll introduce herself by name on every call",
    toast4: "{name} will handle calls in a {personality} tone — in English and Spanish",
    toast5: "{name} can now answer {count} questions about {biz}",
    // Celebration
    celebrationTitle: "{name} is hired!",
    celebrationSub: "Your AI receptionist is ready to start answering calls.",
    whatsNext: "What's next",
    whatsNextDesc: "Connect your phone line so {name} can start answering calls",
    connectPhone: "Connect Your Phone",
    // Common
    next: "Next",
    back: "Back",
    saving: "Saving...",
    processing: "Processing...",
    step: "Step",
    of: "of",
  },
  es: {
    langToggle: "EN",
    step1Title: "¿Cuál es tu negocio?",
    step1Sub: "Personalizaremos tu recepcionista para tu industria.",
    bizName: "Nombre del Negocio",
    bizNamePlaceholder: "ej. Plomería Smith",
    tradeType: "Tipo de Negocio",
    tradePlaceholder: "Selecciona tu tipo",
    city: "Ciudad",
    cityPlaceholder: "ej. San Antonio",
    state: "Estado",
    statePlaceholder: "ej. TX",
    servicesTitle: "Servicios que Ofreces",
    addService: "Agregar",
    addServicePlaceholder: "Agregar servicio...",
    step2Title: "¿Cómo te contactamos?",
    step2Sub: "Recibirás notificaciones en tiempo real cuando agende citas.",
    ownerName: "Tu Nombre",
    ownerNamePlaceholder: "ej. Juan Pérez",
    email: "Correo Electrónico",
    emailPlaceholder: "juan@plomeriasmith.com",
    phone: "Teléfono",
    phonePlaceholder: "(210) 555-1234",
    step3Title: "Nombre tu recepcionista",
    step3Sub: "Se presentará con este nombre en cada llamada.",
    namePresets: ["Maria", "Sofia", "Isabella"],
    customName: "Nombre Personalizado",
    namePlaceholder: "Ingresa un nombre",
    step4Title: "Elige su personalidad",
    step4Sub: "¿Cómo debería sonar en el teléfono?",
    professional: "Profesional",
    professionalDesc: "Pulida y eficiente. Va directo al grano.",
    professionalSample: "Buenos días, gracias por llamar a {biz}. Soy {name}, ¿en qué puedo ayudarle?",
    friendly: "Amigable",
    friendlyDesc: "Cálida y accesible. Todos se sienten bienvenidos.",
    friendlySample: "¡Hola! ¡Gracias por llamar a {biz}! Soy {name} — ¿en qué te puedo ayudar?",
    warm: "Cálida y Atenta",
    warmDesc: "Extra empática. Perfecta para situaciones delicadas.",
    warmSample: "Hola, muchas gracias por llamar a {biz}. Soy {name}, estoy aquí para ayudarte. ¿Qué sucede?",
    step5Title: "Enséñale tu negocio",
    step5Sub: "Ayúdala a responder preguntas comunes de los clientes.",
    faqHoursQ: "¿Cuál es su horario?",
    faqHoursPlaceholder: "ej. Lun-Vie 8am-5pm, Sáb con cita",
    faqAreaQ: "¿Qué áreas cubren?",
    faqAreaPlaceholder: "ej. San Antonio y alrededores dentro de 30 millas",
    faqEstimatesQ: "¿Ofrecen estimados gratis?",
    faqEstimatesPlaceholder: "ej. Sí, ofrecemos estimados gratis en sitio para todos los servicios",
    offLimitsTitle: "Temas Prohibidos",
    offLimitsSub: "Redirigirá cortésmente si preguntan sobre estos.",
    offLimitsPricing: "No discutir precios por teléfono",
    offLimitsCompetitors: "No discutir competidores",
    offLimitsTiming: "No hacer promesas de tiempo",
    step6Title: "Contratar a",
    step6Sub: "está lista para contestar llamadas de",
    trialNote: "No se te cobrará por 14 días",
    cancelAnytime: "Cancela cuando quieras",
    guarantee: "Garantía de devolución de 30 días",
    monthlyLabel: "Mensual",
    annualLabel: "Anual",
    monthlyPrice: "$497",
    monthlyPer: "/mes",
    annualPrice: "$397",
    annualPer: "/mes facturado anualmente",
    annualSave: "Ahorra $1,200",
    hireCta: "Contratar a",
    missedCallsTitle: "Estás Perdiendo Dinero Ahora Mismo",
    roiMonthlyLoss: "/mes en llamadas perdidas",
    roiMultiple: "x retorno de inversión",
    configSummary: "Lo que ella sabe:",
    toast1: "¡Gracias por llamar a {biz}! ¿En qué puedo ayudarle?",
    toast2Title: "Nueva notificación de llamada",
    toast2Body: "Recibirás alertas como esta en tiempo real",
    toast3: "{name} está lista — se presentará por nombre en cada llamada",
    toast4: "{name} atenderá llamadas con tono {personality} — en inglés y español",
    toast5: "{name} ahora puede responder {count} preguntas sobre {biz}",
    celebrationTitle: "¡{name} está contratada!",
    celebrationSub: "Tu recepcionista de IA está lista para contestar llamadas.",
    whatsNext: "¿Qué sigue?",
    whatsNextDesc: "Conecta tu línea telefónica para que {name} empiece a contestar",
    connectPhone: "Conectar Tu Teléfono",
    next: "Siguiente",
    back: "Atrás",
    saving: "Guardando...",
    processing: "Procesando...",
    step: "Paso",
    of: "de",
  },
};

const TRADE_OPTIONS = [
  { value: "hvac", en: "HVAC", es: "HVAC" },
  { value: "plumbing", en: "Plumbing", es: "Plomería" },
  { value: "electrical", en: "Electrical", es: "Electricidad" },
  { value: "roofing", en: "Roofing", es: "Techado" },
  { value: "general_contractor", en: "General Contractor", es: "Contratista General" },
  { value: "restoration", en: "Restoration", es: "Restauración" },
  { value: "landscaping", en: "Landscaping", es: "Jardinería" },
  { value: "pest_control", en: "Pest Control", es: "Control de Plagas" },
  { value: "garage_door", en: "Garage Door", es: "Puertas de Garaje" },
  { value: "other", en: "Other", es: "Otro" },
];

const PERSONALITY_OPTIONS = ["professional", "friendly", "warm"] as const;

const TOTAL_STEPS = 6;

// ── Helpers ──

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function replaceVars(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), val);
  }
  return result;
}

// ── Main Component ──

export default function SetupClientWrapper() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "#0f1729", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 32, height: 32, border: "3px solid rgba(212,168,67,0.3)", borderTopColor: "#D4A843", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      }
    >
      <SetupClient />
    </Suspense>
  );
}

function SetupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<Lang>("en");
  const t = T[lang];

  // Session state
  const [session, setSession] = useState<SetupSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  // Step 1
  const [bizName, setBizName] = useState("");
  const [bizType, setBizType] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState("");

  // Step 2
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");

  // Step 3
  const [receptionistName, setReceptionistName] = useState("Maria");
  const [useCustomName, setUseCustomName] = useState(false);

  // Step 4
  const [personalityPreset, setPersonalityPreset] = useState("friendly");

  // Step 5
  const [faqAnswers, setFaqAnswers] = useState<Record<string, string>>({});
  const [offLimits, setOffLimits] = useState<Record<string, boolean>>({ pricing: false, competitors: false, timing: false });

  // Step 6
  const [planToggle, setPlanToggle] = useState<PlanType>("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [tradeData, setTradeData] = useState<TradeData | null>(null);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastContent, setToastContent] = useState<{ title: string; body?: string } | null>(null);

  // Celebration (post-payment)
  const [showCelebration, setShowCelebration] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Initialize session ──
  useEffect(() => {
    async function init() {
      // Check for celebration (post-payment return)
      const sessionId = searchParams.get("session_id");
      if (sessionId) {
        setShowCelebration(true);
        // Load session to show details
        const token = searchParams.get("token");
        if (token) {
          const res = await fetch(`/api/setup/session?token=${token}`);
          if (res.ok) {
            const data = await res.json();
            if (data.session) {
              populateFromSession(data.session);
            }
          }
        }
        setLoading(false);
        return;
      }

      // Check for redirect from canceled checkout
      const canceled = searchParams.get("canceled");
      const stepParam = searchParams.get("step");

      // Try to load existing session
      const tokenParam = searchParams.get("token");
      const url = tokenParam ? `/api/setup/session?token=${tokenParam}` : "/api/setup/session";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          populateFromSession(data.session);
          if (canceled && stepParam) {
            setStep(parseInt(stepParam, 10) || 6);
          } else if (stepParam) {
            setStep(parseInt(stepParam, 10) || data.session.currentStep);
          } else {
            setStep(data.session.currentStep);
          }
          setLoading(false);
          return;
        }
      }

      // Create new session
      const utmSource = searchParams.get("utm_source");
      const utmMedium = searchParams.get("utm_medium");
      const utmCampaign = searchParams.get("utm_campaign");
      const refCode = searchParams.get("ref");

      const createRes = await fetch("/api/setup/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utmSource,
          utmMedium,
          utmCampaign,
          refCode,
          language: lang,
        }),
      });

      if (createRes.ok) {
        const data = await createRes.json();
        setSession({ token: data.token, currentStep: 1 } as SetupSession);
      }

      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function populateFromSession(s: SetupSession) {
    setSession(s);
    if (s.language === "es") setLang("es");
    if (s.businessName) setBizName(s.businessName);
    if (s.businessType) setBizType(s.businessType);
    if (s.city) setCity(s.city);
    if (s.state) setState(s.state);
    if (s.services) setServices(s.services);
    if (s.ownerName) setOwnerName(s.ownerName);
    if (s.ownerEmail) setOwnerEmail(s.ownerEmail);
    if (s.ownerPhone) setOwnerPhone(s.ownerPhone);
    if (s.receptionistName) {
      setReceptionistName(s.receptionistName);
      if (!["Maria", "Sofia", "Isabella"].includes(s.receptionistName)) {
        setUseCustomName(true);
      }
    }
    if (s.personalityPreset) setPersonalityPreset(s.personalityPreset);
    if (s.faqAnswers) setFaqAnswers(s.faqAnswers);
    if (s.offLimits) setOffLimits(s.offLimits);
    if (s.selectedPlan) setPlanToggle(s.selectedPlan as PlanType);
  }

  // ── Trade data fetching ──
  useEffect(() => {
    if (bizType && bizType !== "other") {
      fetch(`/api/setup/trade-data/${bizType}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data) {
            setTradeData(data);
            // Auto-populate services if empty
            if (services.length === 0 && data.commonServices) {
              setServices(data.commonServices);
            }
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bizType]);

  // ── Save step ──
  const saveStep = useCallback(
    async (stepNum: number, data: Record<string, unknown>): Promise<boolean> => {
      setSaving(true);
      setErrors({});
      try {
        const res = await fetch(`/api/setup/step/${stepNum}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Save failed" }));
          setErrors({ _form: err.error || "Save failed" });
          return false;
        }
        return true;
      } catch {
        setErrors({ _form: "Network error" });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  // ── Show toast then advance ──
  const showToastAndAdvance = useCallback(
    (toast: { title: string; body?: string }, nextStep: number) => {
      setToastContent(toast);
      setToastVisible(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setToastVisible(false);
        setTimeout(() => {
          setStep(nextStep);
          setToastContent(null);
        }, 300);
      }, 2500);
    },
    [],
  );

  // ── Step handlers ──
  const handleNext = useCallback(async () => {
    if (step === 1) {
      if (!bizName.trim()) { setErrors({ bizName: "Required" }); return; }
      if (!bizType) { setErrors({ bizType: "Required" }); return; }
      if (!city.trim()) { setErrors({ city: "Required" }); return; }
      if (!state.trim()) { setErrors({ state: "Required" }); return; }
      const ok = await saveStep(1, { businessName: bizName.trim(), businessType: bizType, city: city.trim(), state: state.trim(), services });
      if (!ok) return;
      showToastAndAdvance(
        { title: replaceVars(t.toast1, { biz: bizName.trim() }) },
        2,
      );
    } else if (step === 2) {
      if (!ownerName.trim()) { setErrors({ ownerName: "Required" }); return; }
      if (!ownerEmail.trim() || !ownerEmail.includes("@")) { setErrors({ ownerEmail: "Valid email required" }); return; }
      if (!ownerPhone.trim() || ownerPhone.replace(/\D/g, "").length < 7) { setErrors({ ownerPhone: "Valid phone required" }); return; }
      const ok = await saveStep(2, { ownerName: ownerName.trim(), ownerEmail: ownerEmail.trim(), ownerPhone: ownerPhone.trim() });
      if (!ok) return;
      showToastAndAdvance(
        {
          title: t.toast2Title,
          body: replaceVars(t.toast2Body, { phone: ownerPhone }),
        },
        3,
      );
    } else if (step === 3) {
      if (!receptionistName.trim()) { setErrors({ receptionistName: "Required" }); return; }
      const ok = await saveStep(3, { receptionistName: receptionistName.trim() });
      if (!ok) return;
      showToastAndAdvance(
        { title: replaceVars(t.toast3, { name: receptionistName.trim() }) },
        4,
      );
    } else if (step === 4) {
      const ok = await saveStep(4, { personalityPreset });
      if (!ok) return;
      const personalityLabel = personalityPreset === "professional" ? t.professional.toLowerCase() : personalityPreset === "warm" ? t.warm.toLowerCase() : t.friendly.toLowerCase();
      showToastAndAdvance(
        {
          title: replaceVars(t.toast4, { name: receptionistName, personality: personalityLabel }),
        },
        5,
      );
    } else if (step === 5) {
      const ok = await saveStep(5, { faqAnswers, offLimits });
      if (!ok) return;
      const answerCount = Object.values(faqAnswers).filter((v) => v.trim()).length;
      showToastAndAdvance(
        {
          title: replaceVars(t.toast5, {
            name: receptionistName,
            count: String(answerCount || 3),
            biz: bizName,
          }),
        },
        6,
      );
    }
  }, [step, bizName, bizType, city, state, services, ownerName, ownerEmail, ownerPhone, receptionistName, personalityPreset, faqAnswers, offLimits, saveStep, showToastAndAdvance, t]);

  // ── Checkout ──
  const handleCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/setup/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planToggle }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Checkout failed" }));
        setErrors({ _form: err.error });
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setErrors({ _form: "Network error" });
    } finally {
      setCheckoutLoading(false);
    }
  }, [planToggle]);

  // ── Loading screen ──
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ width: 32, height: 32, border: "3px solid rgba(212,168,67,0.3)", borderTopColor: "#D4A843", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
        <style>{keyframes}</style>
      </div>
    );
  }

  // ── Celebration screen ──
  if (showCelebration) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.container, textAlign: "center" as const, paddingTop: 80 }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
          <h1 style={{ ...styles.title, fontSize: 32 }}>
            {replaceVars(t.celebrationTitle, { name: receptionistName })}
          </h1>
          <p style={styles.subtitle}>{t.celebrationSub}</p>

          <div style={styles.summaryCard}>
            <h3 style={{ color: "#D4A843", margin: "0 0 16px", fontSize: 16 }}>{t.configSummary}</h3>
            <div style={styles.summaryRow}><span style={styles.summaryLabel}>Business:</span> <span>{bizName}</span></div>
            <div style={styles.summaryRow}><span style={styles.summaryLabel}>Receptionist:</span> <span>{receptionistName}</span></div>
            <div style={styles.summaryRow}><span style={styles.summaryLabel}>Personality:</span> <span style={{ textTransform: "capitalize" as const }}>{personalityPreset}</span></div>
            {services.length > 0 && (
              <div style={styles.summaryRow}><span style={styles.summaryLabel}>Services:</span> <span>{services.slice(0, 4).join(", ")}{services.length > 4 ? ` +${services.length - 4}` : ""}</span></div>
            )}
          </div>

          <div style={{ ...styles.card, marginTop: 24 }}>
            <h3 style={{ color: "#fff", margin: "0 0 8px", fontSize: 16 }}>{t.whatsNext}</h3>
            <p style={{ color: "#94a3b8", margin: "0 0 20px", fontSize: 14 }}>
              {replaceVars(t.whatsNextDesc, { name: receptionistName })}
            </p>
            <button
              onClick={() => router.push("/dashboard/onboarding?step=8")}
              style={styles.primaryBtn}
            >
              {t.connectPhone} →
            </button>
          </div>
        </div>
        <style>{keyframes}</style>
      </div>
    );
  }

  // ── Main flow ──
  return (
    <div style={styles.page}>
      {/* Nav */}
      <nav style={styles.nav}>
        <span style={styles.logo}>Calltide</span>
        <button
          onClick={() => setLang(lang === "en" ? "es" : "en")}
          style={styles.langBtn}
        >
          {t.langToggle}
        </button>
      </nav>

      {/* Progress bar */}
      <div style={styles.progressContainer}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            style={{
              ...styles.progressSegment,
              background: i < step ? "#D4A843" : "rgba(212,168,67,0.2)",
            }}
          />
        ))}
      </div>

      {/* Toast overlay */}
      {toastContent && (
        <div
          style={{
            ...styles.toast,
            transform: toastVisible ? "translateY(0)" : "translateY(-120%)",
            opacity: toastVisible ? 1 : 0,
          }}
        >
          <div style={styles.toastCheck}>✓</div>
          <div>
            <div style={styles.toastTitle}>{toastContent.title}</div>
            {toastContent.body && <div style={styles.toastBody}>{toastContent.body}</div>}
          </div>
        </div>
      )}

      {/* Step content */}
      <div style={styles.container}>
        <div style={styles.stepLabel}>
          {t.step} {step} {t.of} {TOTAL_STEPS}
        </div>

        {step === 1 && (
          <div style={styles.stepContent}>
            <h1 style={styles.title}>{t.step1Title}</h1>
            <p style={styles.subtitle}>{t.step1Sub}</p>

            <div style={styles.field}>
              <label style={styles.label}>{t.bizName}</label>
              <input
                style={{ ...styles.input, ...(errors.bizName ? styles.inputError : {}) }}
                placeholder={t.bizNamePlaceholder}
                value={bizName}
                onChange={(e) => { setBizName(e.target.value); setErrors({}); }}
              />
              {errors.bizName && <span style={styles.error}>{errors.bizName}</span>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>{t.tradeType}</label>
              <select
                style={{ ...styles.input, ...(errors.bizType ? styles.inputError : {}) }}
                value={bizType}
                onChange={(e) => { setBizType(e.target.value); setErrors({}); }}
              >
                <option value="">{t.tradePlaceholder}</option>
                {TRADE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o[lang]}</option>
                ))}
              </select>
              {errors.bizType && <span style={styles.error}>{errors.bizType}</span>}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ ...styles.field, flex: 2 }}>
                <label style={styles.label}>{t.city}</label>
                <input
                  style={{ ...styles.input, ...(errors.city ? styles.inputError : {}) }}
                  placeholder={t.cityPlaceholder}
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setErrors({}); }}
                />
              </div>
              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label}>{t.state}</label>
                <input
                  style={{ ...styles.input, ...(errors.state ? styles.inputError : {}) }}
                  placeholder={t.statePlaceholder}
                  value={state}
                  onChange={(e) => { setState(e.target.value); setErrors({}); }}
                  maxLength={2}
                />
              </div>
            </div>

            {services.length > 0 && (
              <div style={styles.field}>
                <label style={styles.label}>{t.servicesTitle}</label>
                <div style={styles.chipContainer}>
                  {services.map((s, i) => (
                    <span key={i} style={styles.chip}>
                      {s}
                      <button
                        style={styles.chipRemove}
                        onClick={() => setServices(services.filter((_, j) => j !== i))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input
                    style={{ ...styles.input, flex: 1 }}
                    placeholder={t.addServicePlaceholder}
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newService.trim()) {
                        setServices([...services, newService.trim()]);
                        setNewService("");
                      }
                    }}
                  />
                  <button
                    style={styles.secondaryBtn}
                    onClick={() => {
                      if (newService.trim()) {
                        setServices([...services, newService.trim()]);
                        setNewService("");
                      }
                    }}
                  >
                    {t.addService}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={styles.stepContent}>
            <h1 style={styles.title}>{t.step2Title}</h1>
            <p style={styles.subtitle}>{t.step2Sub}</p>

            <div style={styles.field}>
              <label style={styles.label}>{t.ownerName}</label>
              <input
                style={{ ...styles.input, ...(errors.ownerName ? styles.inputError : {}) }}
                placeholder={t.ownerNamePlaceholder}
                value={ownerName}
                onChange={(e) => { setOwnerName(e.target.value); setErrors({}); }}
              />
              {errors.ownerName && <span style={styles.error}>{errors.ownerName}</span>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>{t.email}</label>
              <input
                type="email"
                style={{ ...styles.input, ...(errors.ownerEmail ? styles.inputError : {}) }}
                placeholder={t.emailPlaceholder}
                value={ownerEmail}
                onChange={(e) => { setOwnerEmail(e.target.value); setErrors({}); }}
              />
              {errors.ownerEmail && <span style={styles.error}>{errors.ownerEmail}</span>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>{t.phone}</label>
              <input
                type="tel"
                style={{ ...styles.input, ...(errors.ownerPhone ? styles.inputError : {}) }}
                placeholder={t.phonePlaceholder}
                value={ownerPhone}
                onChange={(e) => { setOwnerPhone(formatPhone(e.target.value)); setErrors({}); }}
              />
              {errors.ownerPhone && <span style={styles.error}>{errors.ownerPhone}</span>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={styles.stepContent}>
            <h1 style={styles.title}>{t.step3Title}</h1>
            <p style={styles.subtitle}>{t.step3Sub}</p>

            {/* Preset names */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" as const }}>
              {t.namePresets.map((name) => (
                <button
                  key={name}
                  onClick={() => { setReceptionistName(name); setUseCustomName(false); setErrors({}); }}
                  style={{
                    ...styles.card,
                    flex: 1,
                    minWidth: 100,
                    cursor: "pointer",
                    textAlign: "center" as const,
                    border: receptionistName === name && !useCustomName ? "2px solid #D4A843" : "2px solid transparent",
                    padding: "16px 12px",
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 4 }}>👩</div>
                  <div style={{ color: "#fff", fontWeight: 600 }}>{name}</div>
                </button>
              ))}
            </div>

            {/* Custom name */}
            <button
              onClick={() => { setUseCustomName(true); setReceptionistName(""); }}
              style={{
                ...styles.card,
                cursor: "pointer",
                width: "100%",
                textAlign: "left" as const,
                border: useCustomName ? "2px solid #D4A843" : "2px solid transparent",
                padding: "12px 16px",
                marginBottom: 12,
              }}
            >
              <span style={{ color: "#94a3b8" }}>{t.customName}</span>
            </button>
            {useCustomName && (
              <input
                style={{ ...styles.input, ...(errors.receptionistName ? styles.inputError : {}) }}
                placeholder={t.namePlaceholder}
                value={receptionistName}
                onChange={(e) => { setReceptionistName(e.target.value); setErrors({}); }}
                autoFocus
              />
            )}
            {errors.receptionistName && <span style={styles.error}>{errors.receptionistName}</span>}

            {/* Preview bubble */}
            {receptionistName && (
              <div style={styles.previewBubble}>
                <div style={styles.previewAvatar}>👩</div>
                <div>
                  <div style={{ color: "#D4A843", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{receptionistName}</div>
                  <div style={{ color: "#e2e8f0", fontSize: 14 }}>
                    &ldquo;{lang === "en"
                      ? `Hi! Thanks for calling ${bizName || "your business"}! I'm ${receptionistName} — how can I help?`
                      : `¡Hola! ¡Gracias por llamar a ${bizName || "tu negocio"}! Soy ${receptionistName} — ¿en qué puedo ayudar?`
                    }&rdquo;
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div style={styles.stepContent}>
            <h1 style={styles.title}>{t.step4Title}</h1>
            <p style={styles.subtitle}>{t.step4Sub}</p>

            <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
              {PERSONALITY_OPTIONS.map((preset) => {
                const labels = {
                  professional: { name: t.professional, desc: t.professionalDesc, sample: t.professionalSample },
                  friendly: { name: t.friendly, desc: t.friendlyDesc, sample: t.friendlySample },
                  warm: { name: t.warm, desc: t.warmDesc, sample: t.warmSample },
                };
                const l = labels[preset];
                return (
                  <button
                    key={preset}
                    onClick={() => setPersonalityPreset(preset)}
                    style={{
                      ...styles.card,
                      cursor: "pointer",
                      textAlign: "left" as const,
                      border: personalityPreset === preset ? "2px solid #D4A843" : "2px solid transparent",
                      padding: 20,
                    }}
                  >
                    <div style={{ color: "#fff", fontWeight: 600, marginBottom: 4 }}>{l.name}</div>
                    <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 12 }}>{l.desc}</div>
                    <div style={styles.previewBubble}>
                      <div style={styles.previewAvatar}>👩</div>
                      <div style={{ color: "#e2e8f0", fontSize: 13, fontStyle: "italic" as const }}>
                        &ldquo;{replaceVars(l.sample, { biz: bizName || "your business", name: receptionistName })}&rdquo;
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div style={styles.stepContent}>
            <h1 style={styles.title}>{t.step5Title}</h1>
            <p style={styles.subtitle}>{t.step5Sub}</p>

            {/* FAQ Questions */}
            {[
              { key: "hours", q: t.faqHoursQ, placeholder: t.faqHoursPlaceholder },
              { key: "area", q: t.faqAreaQ, placeholder: t.faqAreaPlaceholder },
              { key: "estimates", q: t.faqEstimatesQ, placeholder: t.faqEstimatesPlaceholder },
            ].map(({ key, q, placeholder }) => (
              <div key={key} style={styles.field}>
                <label style={styles.label}>{q}</label>
                <input
                  style={styles.input}
                  placeholder={placeholder}
                  value={faqAnswers[key] || ""}
                  onChange={(e) => setFaqAnswers({ ...faqAnswers, [key]: e.target.value })}
                />
              </div>
            ))}

            {/* Off-limits toggles */}
            <div style={{ marginTop: 24 }}>
              <label style={{ ...styles.label, marginBottom: 4 }}>{t.offLimitsTitle}</label>
              <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 12px" }}>{t.offLimitsSub}</p>
              {[
                { key: "pricing", label: t.offLimitsPricing },
                { key: "competitors", label: t.offLimitsCompetitors },
                { key: "timing", label: t.offLimitsTiming },
              ].map(({ key, label }) => (
                <label key={key} style={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={offLimits[key] || false}
                    onChange={(e) => setOffLimits({ ...offLimits, [key]: e.target.checked })}
                    style={{ accentColor: "#D4A843" }}
                  />
                  <span style={{ color: "#e2e8f0", fontSize: 14 }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div style={styles.stepContent}>
            <h1 style={styles.title}>{t.step6Title} {receptionistName}</h1>
            <p style={styles.subtitle}>
              {receptionistName} {t.step6Sub} {bizName}
            </p>

            {/* ROI Card */}
            {tradeData?.roi && (
              <div style={{ ...styles.card, marginBottom: 24, padding: 20 }}>
                <h3 style={{ color: "#D4A843", margin: "0 0 12px", fontSize: 15 }}>{t.missedCallsTitle}</h3>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#94a3b8", fontSize: 14 }}>
                    ${tradeData.roi.estimatedMonthlyLoss.toLocaleString()}{t.roiMonthlyLoss}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#10b981", fontSize: 14, fontWeight: 600 }}>
                    {tradeData.roi.roiMultiple}{t.roiMultiple}
                  </span>
                </div>
              </div>
            )}

            {/* Plan toggle */}
            <div style={styles.planToggleContainer}>
              <button
                onClick={() => setPlanToggle("monthly")}
                style={{
                  ...styles.planToggleBtn,
                  background: planToggle === "monthly" ? "#D4A843" : "transparent",
                  color: planToggle === "monthly" ? "#0f1729" : "#94a3b8",
                }}
              >
                {t.monthlyLabel}
              </button>
              <button
                onClick={() => setPlanToggle("annual")}
                style={{
                  ...styles.planToggleBtn,
                  background: planToggle === "annual" ? "#D4A843" : "transparent",
                  color: planToggle === "annual" ? "#0f1729" : "#94a3b8",
                }}
              >
                {t.annualLabel}
                <span style={{ fontSize: 11, marginLeft: 6, background: "#10b981", color: "#fff", padding: "2px 6px", borderRadius: 4 }}>
                  {t.annualSave}
                </span>
              </button>
            </div>

            <div style={{ ...styles.card, padding: 24, marginBottom: 24, textAlign: "center" as const }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#fff" }}>
                {planToggle === "monthly" ? t.monthlyPrice : t.annualPrice}
                <span style={{ fontSize: 16, fontWeight: 400, color: "#94a3b8" }}>
                  {planToggle === "monthly" ? t.monthlyPer : t.annualPer}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div style={styles.summaryCard}>
              <h3 style={{ color: "#D4A843", margin: "0 0 12px", fontSize: 14 }}>{t.configSummary}</h3>
              <div style={styles.summaryRow}><span style={styles.summaryLabel}>✓ {receptionistName}</span> <span style={{ color: "#94a3b8", textTransform: "capitalize" as const }}>{personalityPreset}</span></div>
              {bizType && (
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>✓ {TRADE_OPTIONS.find((o) => o.value === bizType)?.[lang] || bizType}</span>
                  <span style={{ color: "#94a3b8" }}>{city}, {state}</span>
                </div>
              )}
              {services.length > 0 && (
                <div style={styles.summaryRow}><span style={styles.summaryLabel}>✓ {services.length} services</span></div>
              )}
              <div style={styles.summaryRow}><span style={styles.summaryLabel}>✓ English & Spanish</span></div>
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, margin: "20px 0", alignItems: "center" }}>
              <span style={{ color: "#10b981", fontSize: 13 }}>🛡️ {t.trialNote}</span>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>{t.cancelAnytime} · {t.guarantee}</span>
            </div>

            {/* CTA */}
            {errors._form && <div style={{ ...styles.error, marginBottom: 12, textAlign: "center" as const }}>{errors._form}</div>}
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              style={{ ...styles.primaryBtn, width: "100%", fontSize: 18, padding: "16px 32px", opacity: checkoutLoading ? 0.7 : 1 }}
            >
              {checkoutLoading ? t.processing : `${t.hireCta} ${receptionistName} →`}
            </button>
          </div>
        )}

        {/* Navigation buttons (steps 1-5) */}
        {step < 6 && (
          <div style={styles.navButtons}>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} style={styles.backBtn}>
                {t.back}
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={saving}
              style={{ ...styles.primaryBtn, flex: 1, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? t.saving : t.next}
            </button>
          </div>
        )}

        {step === 6 && step > 1 && (
          <div style={{ marginTop: 12 }}>
            <button onClick={() => setStep(5)} style={styles.backBtn}>
              {t.back}
            </button>
          </div>
        )}

        {errors._form && step < 6 && (
          <div style={{ ...styles.error, marginTop: 8, textAlign: "center" as const }}>{errors._form}</div>
        )}
      </div>

      <style>{keyframes}</style>
    </div>
  );
}

// ── Styles ──

const keyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0f1729",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#e2e8f0",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    maxWidth: 600,
    margin: "0 auto",
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    color: "#D4A843",
    letterSpacing: "-0.02em",
  },
  langBtn: {
    background: "rgba(212,168,67,0.15)",
    color: "#D4A843",
    border: "1px solid rgba(212,168,67,0.3)",
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  progressContainer: {
    display: "flex",
    gap: 4,
    padding: "0 24px",
    maxWidth: 600,
    margin: "0 auto 24px",
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    transition: "background 0.3s ease",
  },
  container: {
    maxWidth: 520,
    margin: "0 auto",
    padding: "0 24px 60px",
  },
  stepLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 8,
    fontWeight: 500,
  },
  stepContent: {
    animation: "fadeIn 0.3s ease",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 8px",
    lineHeight: 1.3,
  },
  subtitle: {
    fontSize: 15,
    color: "#94a3b8",
    margin: "0 0 28px",
    lineHeight: 1.5,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#e2e8f0",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    color: "#fff",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  error: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 4,
    display: "block",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 16,
    transition: "border-color 0.2s",
  },
  chipContainer: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    background: "rgba(212,168,67,0.15)",
    border: "1px solid rgba(212,168,67,0.3)",
    borderRadius: 20,
    color: "#D4A843",
    fontSize: 13,
    fontWeight: 500,
  },
  chipRemove: {
    background: "none",
    border: "none",
    color: "#D4A843",
    cursor: "pointer",
    fontSize: 16,
    padding: 0,
    lineHeight: 1,
  },
  previewBubble: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    background: "rgba(212,168,67,0.08)",
    borderRadius: 12,
    padding: "12px 14px",
    marginTop: 16,
  },
  previewAvatar: {
    fontSize: 24,
    flexShrink: 0,
  },
  toggle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    cursor: "pointer",
  },
  summaryCard: {
    background: "rgba(212,168,67,0.06)",
    border: "1px solid rgba(212,168,67,0.2)",
    borderRadius: 12,
    padding: 20,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    fontSize: 14,
    color: "#e2e8f0",
  },
  summaryLabel: {
    fontWeight: 500,
  },
  planToggleContainer: {
    display: "flex",
    background: "rgba(255,255,255,0.06)",
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
  },
  planToggleBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 16px",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  navButtons: {
    display: "flex",
    gap: 12,
    marginTop: 32,
  },
  primaryBtn: {
    background: "#D4A843",
    color: "#0f1729",
    border: "none",
    borderRadius: 8,
    padding: "14px 28px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  secondaryBtn: {
    background: "rgba(212,168,67,0.15)",
    color: "#D4A843",
    border: "1px solid rgba(212,168,67,0.3)",
    borderRadius: 8,
    padding: "10px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  },
  backBtn: {
    background: "transparent",
    color: "#94a3b8",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    padding: "14px 24px",
    fontSize: 16,
    fontWeight: 500,
    cursor: "pointer",
  },
  toast: {
    position: "fixed" as const,
    top: 24,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(16,185,129,0.95)",
    backdropFilter: "blur(12px)",
    borderRadius: 12,
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    zIndex: 1000,
    maxWidth: 440,
    width: "90%",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    transition: "transform 0.3s ease, opacity 0.3s ease",
  },
  toastCheck: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#fff",
    color: "#10b981",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
  },
  toastTitle: {
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
  },
  toastBody: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 2,
  },
};
