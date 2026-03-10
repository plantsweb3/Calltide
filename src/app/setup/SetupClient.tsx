"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PHONE, PHONE_TEL } from "@/lib/marketing/translations";
import s from "./setup.module.css";

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
    step1Title: "Let's build your receptionist",
    step1Sub: "She'll know your trade, your services, and your market.",
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
    step2Title: "How should we reach you?",
    step2Sub: "She'll text you the moment a job is booked.",
    ownerName: "Your Name",
    ownerNamePlaceholder: "e.g. John Smith",
    email: "Email",
    emailPlaceholder: "john@smithplumbing.com",
    phone: "Phone",
    phonePlaceholder: "(210) 555-1234",
    step3Title: "Meet your receptionist",
    step3Sub: "Name her and choose how she sounds on the phone.",
    namePresets: ["Maria", "Sofia", "Isabella", "Rachel", "Alex"],
    customName: "Custom Name",
    namePlaceholder: "Enter a name",
    personalityTitle: "Choose her personality",
    previewGreeting: "Preview greeting",
    previewNote: "Your actual receptionist sounds even better.",
    professional: "Professional",
    professionalDesc: "Polished and efficient. Gets straight to business.",
    professionalSample: "Good morning, thank you for calling {biz}. This is {name}, how may I assist you today?",
    friendly: "Friendly",
    friendlyDesc: "Warm and approachable. Makes every caller feel welcome.",
    friendlySample: "Hi there! Thanks for calling {biz}! I'm {name} — what can I help you with today?",
    warm: "Warm & Caring",
    warmDesc: "Extra empathetic. Perfect for sensitive situations.",
    warmSample: "Hello, thank you so much for calling {biz}. I'm {name}, and I'm here to help. What's going on?",
    step5Title: "She already knows your trade",
    step5Sub: "Add the details only you know.",
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
    phoneReassurance: "Works with your existing phone number \u2014 just forward calls when you can\u2019t answer.",
    roiSource: "Based on average {trade} businesses in {city}",
    roiMissedPerDay: "missed calls/day",
    roiCostPerMissed: "avg. lost per missed call",
    roiBreakeven: "Pays for herself after {count} answered calls",
    comparisonAnchor: "A bilingual receptionist costs $3,000\u2013$4,000/month",
    questions: "Questions?",
    step6Sub: "is ready to answer phones for",
    trialNote: "30-day money-back guarantee.",
    cancelAnytime: "Cancel anytime",
    guarantee: "30-day money-back guarantee",
    monthlyLabel: "Monthly",
    annualLabel: "Annual",
    monthlyPrice: "$497",
    monthlyPer: "/month",
    annualPrice: "$397",
    annualPer: "/month billed annually",
    annualSave: "Save $1,200",
    hireCta: "Get Capta with",
    missedCallsTitle: "You're Losing Money Right Now",
    roiMonthlyLoss: "/month in missed calls",
    roiMultiple: "x return on investment",
    configSummary: "What she knows:",
    services: "services",
    bilingualLabel: "English & Spanish",
    toast1: "Thank you for calling {biz}! How can I help you today?",
    toast2Title: "New call notification",
    toast2Body: "You'll get real-time alerts like this at {phone}",
    toast3: "{name} is ready — she'll introduce herself by name on every call",
    toast4: "{name} will handle calls in a {personality} tone — in English and Spanish",
    toast5: "{name} can now answer {count} questions about {biz}",
    celebrationTitle: "{name} is hired!",
    celebrationSub: "Your AI receptionist is ready to start answering calls.",
    recommended: "Most popular",
    whatsNext: "What's next",
    whatsNextDesc: "Connect your phone line so {name} can start answering calls. Takes 2 minutes.",
    connectPhone: "Start Answering Calls",
    businessLabel: "Business",
    receptionistLabel: "Receptionist",
    personalityLabel: "Personality",
    servicesLabel: "Services",
    yourBusiness: "your business",
    authenticating: "Setting up your account...",
    authFailed: "We're still processing your payment. Try refreshing in a few seconds.",
    next: "Next",
    back: "Back",
    saving: "Saving...",
    processing: "Processing...",
    step: "Step",
    of: "of",
    required: "Required",
    validEmail: "Valid email required",
    validPhone: "Valid phone required (10 digits)",
    sessionError: "Could not start setup. Please refresh the page.",
  },
  es: {
    step1Title: "Construyamos tu recepcionista",
    step1Sub: "Ella conocerá tu industria, tus servicios y tu mercado.",
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
    step2Sub: "Te enviará un mensaje en cuanto agende un trabajo.",
    ownerName: "Tu Nombre",
    ownerNamePlaceholder: "ej. Juan Pérez",
    email: "Correo Electrónico",
    emailPlaceholder: "juan@plomeriasmith.com",
    phone: "Teléfono",
    phonePlaceholder: "(210) 555-1234",
    step3Title: "Conoce a tu recepcionista",
    step3Sub: "Ponle nombre y elige cómo suena en el teléfono.",
    namePresets: ["Maria", "Sofia", "Isabella", "Rachel", "Alex"],
    customName: "Nombre Personalizado",
    namePlaceholder: "Ingresa un nombre",
    personalityTitle: "Elige su personalidad",
    previewGreeting: "Escuchar saludo",
    previewNote: "Tu recepcionista real suena aún mejor.",
    professional: "Profesional",
    professionalDesc: "Pulida y eficiente. Va directo al grano.",
    professionalSample: "Buenos días, gracias por llamar a {biz}. Soy {name}, ¿en qué puedo ayudarle?",
    friendly: "Amigable",
    friendlyDesc: "Cálida y accesible. Todos se sienten bienvenidos.",
    friendlySample: "¡Hola! ¡Gracias por llamar a {biz}! Soy {name} — ¿en qué te puedo ayudar?",
    warm: "Cálida y Atenta",
    warmDesc: "Extra empática. Perfecta para situaciones delicadas.",
    warmSample: "Hola, muchas gracias por llamar a {biz}. Soy {name}, estoy aquí para ayudarte. ¿Qué sucede?",
    step5Title: "Ella ya conoce tu industria",
    step5Sub: "Agrega los detalles que solo tú sabes.",
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
    phoneReassurance: "Funciona con tu número actual \u2014 solo redirige llamadas cuando no puedas contestar.",
    roiSource: "Basado en negocios promedio de {trade} en {city}",
    roiMissedPerDay: "llamadas perdidas/día",
    roiCostPerMissed: "pérdida promedio por llamada perdida",
    roiBreakeven: "Se paga sola después de {count} llamadas contestadas",
    comparisonAnchor: "Una recepcionista bilingüe cuesta $3,000\u2013$4,000/mes",
    questions: "¿Preguntas?",
    step6Sub: "está lista para contestar llamadas de",
    trialNote: "Garantía de devolución de 30 días.",
    cancelAnytime: "Cancela cuando quieras",
    guarantee: "Garantía de devolución de 30 días",
    monthlyLabel: "Mensual",
    annualLabel: "Anual",
    monthlyPrice: "$497",
    monthlyPer: "/mes",
    annualPrice: "$397",
    annualPer: "/mes facturado anualmente",
    annualSave: "Ahorra $1,200",
    hireCta: "Obtén Capta con",
    missedCallsTitle: "Estás Perdiendo Dinero Ahora Mismo",
    roiMonthlyLoss: "/mes en llamadas perdidas",
    roiMultiple: "x retorno de inversión",
    configSummary: "Lo que ella sabe:",
    services: "servicios",
    bilingualLabel: "Inglés y Español",
    toast1: "¡Gracias por llamar a {biz}! ¿En qué puedo ayudarle?",
    toast2Title: "Nueva notificación de llamada",
    toast2Body: "Recibirás alertas como esta en tiempo real al {phone}",
    toast3: "{name} está lista — se presentará por nombre en cada llamada",
    toast4: "{name} atenderá llamadas con tono {personality} — en inglés y español",
    toast5: "{name} ahora puede responder {count} preguntas sobre {biz}",
    celebrationTitle: "¡{name} está contratada!",
    celebrationSub: "Tu recepcionista de IA está lista para contestar llamadas.",
    recommended: "Más popular",
    whatsNext: "¿Qué sigue?",
    whatsNextDesc: "Conecta tu línea telefónica para que {name} empiece a contestar. Toma 2 minutos.",
    connectPhone: "Empezar a Contestar Llamadas",
    businessLabel: "Negocio",
    receptionistLabel: "Recepcionista",
    personalityLabel: "Personalidad",
    servicesLabel: "Servicios",
    yourBusiness: "tu negocio",
    authenticating: "Configurando tu cuenta...",
    authFailed: "Aún estamos procesando tu pago. Intenta refrescar en unos segundos.",
    next: "Siguiente",
    back: "Atrás",
    saving: "Guardando...",
    processing: "Procesando...",
    step: "Paso",
    of: "de",
    required: "Requerido",
    validEmail: "Correo válido requerido",
    validPhone: "Teléfono válido requerido (10 dígitos)",
    sessionError: "No se pudo iniciar. Por favor, recarga la página.",
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
const VISUAL_STEPS = 5;

/** Map server step (1-6) to visual step (1-5) since steps 3+4 are merged */
function serverStepToVisual(serverStep: number): number {
  if (serverStep <= 2) return serverStep;
  if (serverStep <= 4) return 3;
  return serverStep - 1;
}

// ── Helpers ──

function formatPhone(value: string): string {
  // Strip country code prefix (+1) if present
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function replaceVars(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), val);
  }
  return result;
}

function clampStep(n: number): number {
  return Math.max(1, Math.min(VISUAL_STEPS, isNaN(n) ? 1 : n));
}

// ── Main Component ──

export default function SetupClientWrapper() {
  return (
    <Suspense
      fallback={
        <div className={s.page} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className={s.spinner} />
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
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("capta-lang");
      if (saved === "es") return "es";
    }
    return "en";
  });
  const t = T[lang];

  // Session
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [initError, setInitError] = useState("");

  // Step 1
  const [bizName, setBizName] = useState("");
  const [bizType, setBizType] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState("");
  const servicesLoadedRef = useRef(false);

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
  const [planToggle, setPlanToggle] = useState<PlanType>("annual");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [tradeData, setTradeData] = useState<TradeData | null>(null);

  // Speech preview
  const [hasSpeech, setHasSpeech] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastContent, setToastContent] = useState<{ title: string; body?: string } | null>(null);

  // Celebration (post-payment)
  const [showCelebration, setShowCelebration] = useState(false);
  const [authState, setAuthState] = useState<"pending" | "success" | "failed">("pending");
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  // Errors — per-field errors only, cleared per-field
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastInnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittingRef = useRef(false);

  // Cleanup timers + speech on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastInnerTimerRef.current) clearTimeout(toastInnerTimerRef.current);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Clear form-level errors + autofocus first input on step change
  useEffect(() => {
    setErrors((prev) => {
      if (!prev._form) return prev;
      const next = { ...prev };
      delete next._form;
      return next;
    });
    // Autofocus first input after step transition animation
    const timer = setTimeout(() => {
      const container = document.querySelector(`.${s.stepContent}`);
      const firstInput = container?.querySelector<HTMLInputElement | HTMLSelectElement>("input, select");
      if (firstInput && firstInput.type !== "checkbox") firstInput.focus();
    }, 350);
    return () => clearTimeout(timer);
  }, [step]);

  // Detect speech synthesis support
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const check = () => setHasSpeech(window.speechSynthesis.getVoices().length > 0);
    check();
    // Chrome loads voices async
    window.speechSynthesis.addEventListener("voiceschanged", check);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", check);
  }, []);

  const playGreeting = useCallback(() => {
    if (!window.speechSynthesis || isPlaying) return;
    window.speechSynthesis.cancel();
    const labels: Record<string, { sample: string }> = {
      professional: { sample: t.professionalSample },
      friendly: { sample: t.friendlySample },
      warm: { sample: t.warmSample },
    };
    const text = replaceVars(labels[personalityPreset]?.sample || labels.friendly.sample, {
      biz: bizName || t.yourBusiness,
      name: receptionistName || "Maria",
    });
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    utterance.lang = lang === "es" ? "es-US" : "en-US";
    // Try to find a female voice matching the current language
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = lang === "es" ? "es" : "en";
    const preferred = voices.find((v) => v.lang.startsWith(langPrefix) && v.name.toLowerCase().includes("female"))
      || voices.find((v) => v.lang.startsWith(langPrefix) && /samantha|victoria|karen|zira|jenny|paulina|monica/i.test(v.name))
      || voices.find((v) => v.lang.startsWith(langPrefix));
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  }, [isPlaying, personalityPreset, bizName, receptionistName, t]);

  // ── Initialize session ──
  useEffect(() => {
    const abortController = new AbortController();

    async function init() {
      const sessionId = searchParams.get("session_id");
      if (sessionId) {
        // Post-payment return — show celebration
        setShowCelebration(true);
        const token = searchParams.get("token");
        if (token) {
          try {
            const res = await fetch(`/api/setup/session?token=${token}&include_converted=1`, { signal: abortController.signal });
            if (res.ok) {
              const data = await res.json();
              if (data.session) populateFromSession(data.session);
            }
          } catch (e) {
            if ((e as Error).name !== "AbortError") { /* ok */ }
          }
        }
        // Authenticate — poll with retry since Stripe webhook may not have fired yet
        setLoading(false);
        const MAX_ATTEMPTS = 10;
        const RETRY_DELAY = 3000; // 3s between attempts
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          if (abortController.signal.aborted) return;
          try {
            const authRes = await fetch("/api/setup/auth", { method: "POST", signal: abortController.signal });
            if (authRes.ok) {
              const authData = await authRes.json().catch(() => null);
              if (authData?.generatedPassword && authData?.email) {
                setCredentials({ email: authData.email, password: authData.generatedPassword });
              }
              setAuthState("success");
              return;
            }
            // 404 = webhook hasn't fired yet, retry
            if (authRes.status !== 404) {
              setAuthState("failed");
              return;
            }
          } catch (e) {
            if ((e as Error).name === "AbortError") return;
          }
          // Wait before next attempt
          if (attempt < MAX_ATTEMPTS - 1) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY));
          }
        }
        setAuthState("failed");
        return;
      }

      const canceled = searchParams.get("canceled");
      const stepParam = searchParams.get("step");
      const tokenParam = searchParams.get("token");

      // Try to load existing session
      try {
        const url = tokenParam ? `/api/setup/session?token=${tokenParam}` : "/api/setup/session";
        const res = await fetch(url, { signal: abortController.signal });
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            populateFromSession(data.session);

            if (canceled && stepParam) {
              setStep(clampStep(serverStepToVisual(parseInt(stepParam, 10))));
            } else if (stepParam) {
              setStep(clampStep(serverStepToVisual(parseInt(stepParam, 10))));
            } else {
              setStep(clampStep(serverStepToVisual(data.session.currentStep)));
            }
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }

      // Create new session
      try {
        const createRes = await fetch("/api/setup/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            utmSource: searchParams.get("utm_source"),
            utmMedium: searchParams.get("utm_medium"),
            utmCampaign: searchParams.get("utm_campaign"),
            refCode: searchParams.get("ref"),
            language: lang,
          }),
          signal: abortController.signal,
        });
        if (!createRes.ok) {
          setInitError(t.sessionError);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") setInitError(t.sessionError);
      }

      setLoading(false);
    }

    init();
    return () => abortController.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function populateFromSession(sess: SetupSession) {
    if (sess.language === "es") setLang("es");
    if (sess.businessName) setBizName(sess.businessName);
    if (sess.businessType) setBizType(sess.businessType);
    if (sess.city) setCity(sess.city);
    if (sess.state) setState(sess.state);
    if (sess.services && sess.services.length > 0) {
      setServices(sess.services);
      servicesLoadedRef.current = true;
    }
    if (sess.ownerName) setOwnerName(sess.ownerName);
    if (sess.ownerEmail) setOwnerEmail(sess.ownerEmail);
    if (sess.ownerPhone) setOwnerPhone(sess.ownerPhone);
    if (sess.receptionistName) {
      setReceptionistName(sess.receptionistName);
      if (!["Maria", "Sofia", "Isabella", "Rachel", "Alex"].includes(sess.receptionistName)) {
        setUseCustomName(true);
      }
    }
    if (sess.personalityPreset) setPersonalityPreset(sess.personalityPreset);
    if (sess.faqAnswers) setFaqAnswers(sess.faqAnswers);
    if (sess.offLimits) setOffLimits(sess.offLimits);
    if (sess.selectedPlan === "monthly" || sess.selectedPlan === "annual") {
      setPlanToggle(sess.selectedPlan);
    }
  }

  // ── Trade data fetching ──
  useEffect(() => {
    if (!bizType) return;
    const abortController = new AbortController();

    fetch(`/api/setup/trade-data/${bizType}`, { signal: abortController.signal })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setTradeData(data);
          // Auto-populate services only if user hasn't added their own yet
          if (!servicesLoadedRef.current && data.commonServices) {
            setServices(data.commonServices);
            servicesLoadedRef.current = true;
          }
        }
      })
      .catch(() => {});

    return () => abortController.abort();
  }, [bizType]);

  // ── Persist language ──
  const switchLang = useCallback((newLang: Lang) => {
    setLang(newLang);
    try { localStorage.setItem("capta-lang", newLang); } catch {}
    // Fire and forget — persist to server session
    fetch("/api/setup/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: newLang }),
    }).catch(() => {});
  }, []);

  // ── Field error setter (per-field, not global) ──
  const setFieldError = useCallback((field: string, msg: string) => {
    setErrors((prev) => ({ ...prev, [field]: msg }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  // ── Save step ──
  const saveStep = useCallback(
    async (stepNum: number, data: Record<string, unknown>): Promise<boolean> => {
      setSaving(true);
      try {
        const res = await fetch(`/api/setup/step/${stepNum}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Save failed" }));
          setErrors((prev) => ({ ...prev, _form: err.error || "Save failed" }));
          return false;
        }
        return true;
      } catch {
        setErrors((prev) => ({ ...prev, _form: "Network error" }));
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
      // Cancel any pending toast
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastInnerTimerRef.current) clearTimeout(toastInnerTimerRef.current);

      setToastContent(toast);
      setToastVisible(true);
      toastTimerRef.current = setTimeout(() => {
        setToastVisible(false);
        toastInnerTimerRef.current = setTimeout(() => {
          setStep(clampStep(nextStep));
          setToastContent(null);
        }, 300);
      }, 2500);
    },
    [],
  );

  // ── Step handlers (with double-submit guard) ──
  const handleNext = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    try {
      if (step === 1) {
        let hasError = false;
        if (!bizName.trim()) { setFieldError("bizName", t.required); hasError = true; }
        if (!bizType) { setFieldError("bizType", t.required); hasError = true; }
        if (!city.trim()) { setFieldError("city", t.required); hasError = true; }
        if (!state.trim()) { setFieldError("state", t.required); hasError = true; }
        if (hasError) return;
        const ok = await saveStep(1, { businessName: bizName.trim(), businessType: bizType, city: city.trim(), state: state.trim(), services });
        if (!ok) return;
        showToastAndAdvance({ title: replaceVars(t.toast1, { biz: bizName.trim() }) }, 2);
      } else if (step === 2) {
        let hasError = false;
        if (!ownerName.trim()) { setFieldError("ownerName", t.required); hasError = true; }
        if (!ownerEmail.trim() || !isValidEmail(ownerEmail.trim())) { setFieldError("ownerEmail", t.validEmail); hasError = true; }
        if (ownerPhone.replace(/\D/g, "").length < 10) { setFieldError("ownerPhone", t.validPhone); hasError = true; }
        if (hasError) return;
        const ok = await saveStep(2, { ownerName: ownerName.trim(), ownerEmail: ownerEmail.trim(), ownerPhone: ownerPhone.trim() });
        if (!ok) return;
        showToastAndAdvance({ title: t.toast2Title, body: replaceVars(t.toast2Body, { phone: ownerPhone }) }, 3);
      } else if (step === 3) {
        // Merged step: save name (server 3) then personality (server 4)
        if (!receptionistName.trim()) { setFieldError("receptionistName", t.required); return; }
        // Keep saving=true across both calls to prevent button flash
        setSaving(true);
        const okName = await saveStep(3, { receptionistName: receptionistName.trim() });
        if (!okName) return;
        const okPers = await saveStep(4, { personalityPreset });
        if (!okPers) return;
        const personalityLabel = personalityPreset === "professional" ? t.professional.toLowerCase() : personalityPreset === "warm" ? t.warm.toLowerCase() : t.friendly.toLowerCase();
        showToastAndAdvance({ title: replaceVars(t.toast4, { name: receptionistName, personality: personalityLabel }) }, 4);
      } else if (step === 4) {
        // FAQ/Off-limits → server step 5
        const ok = await saveStep(5, { faqAnswers, offLimits });
        if (!ok) return;
        const answerCount = Object.values(faqAnswers).filter((v) => v.trim()).length;
        showToastAndAdvance({ title: replaceVars(t.toast5, { name: receptionistName, count: String(answerCount || 3), biz: bizName }) }, 5);
      }
    } finally {
      submittingRef.current = false;
    }
  }, [step, bizName, bizType, city, state, services, ownerName, ownerEmail, ownerPhone, receptionistName, personalityPreset, faqAnswers, offLimits, saveStep, showToastAndAdvance, setFieldError, t]);

  // ── Checkout ──
  const handleCheckout = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/setup/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planToggle }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Checkout failed" }));
        setErrors((prev) => ({ ...prev, _form: err.error }));
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrors((prev) => ({ ...prev, _form: "Checkout failed" }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, _form: "Network error" }));
    } finally {
      setCheckoutLoading(false);
      submittingRef.current = false;
    }
  }, [planToggle]);

  // ── Enter key to advance ──
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && step < 5 && !saving) {
      const target = e.target as HTMLElement;
      // Don't intercept Enter on textareas, buttons, or the service add input
      if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON") return;
      if (target.id === "newService" || target.closest("[data-service-input]")) return;
      e.preventDefault();
      handleNext();
    }
  }, [step, saving, handleNext]);

  // ── Loading screen ──
  if (loading) {
    return (
      <div className={s.page} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className={s.spinner} />
      </div>
    );
  }

  // ── Celebration screen (post-payment) ──
  if (showCelebration) {
    return (
      <div className={s.page}>
        <div className={s.container} style={{ textAlign: "center", paddingTop: 80 }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
          <h1 className={s.title} style={{ fontSize: 32 }}>
            {replaceVars(t.celebrationTitle, { name: receptionistName })}
          </h1>
          <p className={s.subtitle}>{t.celebrationSub}</p>

          <div className={s.summaryCard}>
            <h3 style={{ color: "#D4A843", margin: "0 0 16px", fontSize: 16 }}>{t.configSummary}</h3>
            {bizName && <div className={s.summaryRow}><span className={s.summaryLabel}>{t.businessLabel}:</span> <span>{bizName}</span></div>}
            <div className={s.summaryRow}><span className={s.summaryLabel}>{t.receptionistLabel}:</span> <span>{receptionistName}</span></div>
            <div className={s.summaryRow}><span className={s.summaryLabel}>{t.personalityLabel}:</span> <span style={{ textTransform: "capitalize" }}>{personalityPreset}</span></div>
            {services.length > 0 && (
              <div className={s.summaryRow}><span className={s.summaryLabel}>{t.servicesLabel}:</span> <span>{services.slice(0, 4).join(", ")}{services.length > 4 ? ` +${services.length - 4}` : ""}</span></div>
            )}
          </div>

          <div className={s.card} style={{ marginTop: 24, padding: 20 }}>
            <h3 style={{ color: "#fff", margin: "0 0 8px", fontSize: 16 }}>{t.whatsNext}</h3>
            <p style={{ color: "#94a3b8", margin: "0 0 20px", fontSize: 14 }}>
              {replaceVars(t.whatsNextDesc, { name: receptionistName })}
            </p>
            {authState === "pending" && (
              <p style={{ color: "#D4A843", fontSize: 14 }}>{t.authenticating}</p>
            )}
            {authState === "success" && (
              <>
                {credentials && (
                  <div style={{ background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, textAlign: "left" }}>
                    <p style={{ color: "#D4A843", fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>
                      {lang === "en" ? "Save your login credentials:" : "Guarda tus credenciales:"}
                    </p>
                    <p style={{ color: "#e2e8f0", fontSize: 13, margin: "0 0 4px" }}>
                      <span style={{ color: "#94a3b8" }}>Email:</span> {credentials.email}
                    </p>
                    <p style={{ color: "#e2e8f0", fontSize: 13, margin: 0 }}>
                      <span style={{ color: "#94a3b8" }}>{lang === "en" ? "Password:" : "Contraseña:"}</span>{" "}
                      <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace" }}>{credentials.password}</code>
                    </p>
                  </div>
                )}
                <button
                  onClick={() => router.push("/dashboard/onboarding?step=8")}
                  className={s.primaryBtn}
                >
                  {t.connectPhone} →
                </button>
              </>
            )}
            {authState === "failed" && (
              <div>
                <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
                  {lang === "en"
                    ? "We're still processing your payment. This usually takes a few seconds — try refreshing."
                    : "Aún estamos procesando tu pago. Esto normalmente toma unos segundos — intenta refrescar."}
                </p>
                <button className={s.primaryBtn} onClick={() => window.location.reload()} style={{ fontSize: 14 }}>
                  {lang === "en" ? "Refresh" : "Refrescar"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Init error ──
  if (initError) {
    return (
      <div className={s.page} style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <p className={s.error} style={{ fontSize: 16 }}>{initError}</p>
        <button className={s.primaryBtn} onClick={() => window.location.reload()}>
          {lang === "en" ? "Try Again" : "Intentar de Nuevo"}
        </button>
      </div>
    );
  }

  // ── Main flow ──
  return (
    <div className={s.page} onKeyDown={handleKeyDown}>
      {/* Nav */}
      <nav className={s.nav}>
        <img src="/images/logo-inline-white.webp" alt="Capta" style={{ height: 28, width: "auto" }} />
        <div className={s.navRight}>
          <a href={PHONE_TEL} className={s.helpLink}>{t.questions} {PHONE}</a>
          <div className={s.langSwitch} role="radiogroup" aria-label="Language">
            <button
              onClick={() => switchLang("en")}
              className={`${s.langOption} ${lang === "en" ? s.langOptionActive : ""}`}
              role="radio"
              aria-checked={lang === "en"}
            >
              EN
            </button>
            <span className={s.langDivider}>|</span>
            <button
              onClick={() => switchLang("es")}
              className={`${s.langOption} ${lang === "es" ? s.langOptionActive : ""}`}
              role="radio"
              aria-checked={lang === "es"}
            >
              ES
            </button>
          </div>
        </div>
      </nav>

      {/* Progress bar */}
      <div className={s.progressContainer} role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={VISUAL_STEPS} aria-label={`${t.step} ${step} ${t.of} ${VISUAL_STEPS}`}>
        {Array.from({ length: VISUAL_STEPS }, (_, i) => (
          <div key={i} className={`${s.progressSegment} ${i < step ? s.progressActive : s.progressInactive}`} />
        ))}
      </div>

      {/* Toast overlay */}
      {toastContent && (
        <div className={`${s.toast} ${toastVisible ? s.toastVisible : s.toastHidden}`} role="alert" aria-live="polite">
          <div className={s.toastCheck}>✓</div>
          <div>
            <div className={s.toastTitle}>{toastContent.title}</div>
            {toastContent.body && <div className={s.toastBody}>{toastContent.body}</div>}
          </div>
        </div>
      )}

      {/* Step content */}
      <div className={s.container}>
        <div className={s.stepLabel}>{t.step} {step} {t.of} {VISUAL_STEPS}</div>

        {/* ── STEP 1: Business Info ── */}
        {step === 1 && (
          <div className={s.stepContent} key="step1">
            <h1 className={s.title}>{t.step1Title}</h1>
            <p className={s.subtitle}>{t.step1Sub}</p>

            <div className={s.field}>
              <label className={s.label} htmlFor="bizName">{t.bizName}</label>
              <input
                id="bizName"
                className={`${s.input} ${errors.bizName ? s.inputError : ""}`}
                placeholder={t.bizNamePlaceholder}
                value={bizName}
                onChange={(e) => { setBizName(e.target.value); clearFieldError("bizName"); }}
              />
              {errors.bizName && <span className={s.error}>{errors.bizName}</span>}
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor="bizType">{t.tradeType}</label>
              <select
                id="bizType"
                className={`${s.select} ${errors.bizType ? s.inputError : ""}`}
                value={bizType}
                onChange={(e) => { setBizType(e.target.value); clearFieldError("bizType"); servicesLoadedRef.current = false; }}
              >
                <option value="">{t.tradePlaceholder}</option>
                {TRADE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o[lang]}</option>
                ))}
              </select>
              {errors.bizType && <span className={s.error}>{errors.bizType}</span>}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div className={s.field} style={{ flex: 2 }}>
                <label className={s.label} htmlFor="city">{t.city}</label>
                <input
                  id="city"
                  className={`${s.input} ${errors.city ? s.inputError : ""}`}
                  placeholder={t.cityPlaceholder}
                  value={city}
                  onChange={(e) => { setCity(e.target.value); clearFieldError("city"); }}
                />
                {errors.city && <span className={s.error}>{errors.city}</span>}
              </div>
              <div className={s.field} style={{ flex: 1 }}>
                <label className={s.label} htmlFor="state">{t.state}</label>
                <input
                  id="state"
                  className={`${s.input} ${errors.state ? s.inputError : ""}`}
                  placeholder={t.statePlaceholder}
                  value={state}
                  onChange={(e) => { setState(e.target.value.toUpperCase()); clearFieldError("state"); }}
                  maxLength={2}
                />
                {errors.state && <span className={s.error}>{errors.state}</span>}
              </div>
            </div>

            {/* Services — always show so "Other" users can add services */}
            <div className={s.field}>
              <label className={s.label}>{t.servicesTitle}</label>
              {services.length > 0 && (
                <div className={s.chipContainer}>
                  {services.map((svc, i) => (
                    <span key={i} className={s.chip}>
                      {svc}
                      <button className={s.chipRemove} onClick={() => setServices(services.filter((_, j) => j !== i))} aria-label={`Remove ${svc}`}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: services.length > 0 ? 8 : 0 }} data-service-input>
                <input
                  className={s.input}
                  style={{ flex: 1 }}
                  placeholder={t.addServicePlaceholder}
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newService.trim()) {
                      e.preventDefault();
                      const trimmed = newService.trim();
                      if (!services.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
                        setServices([...services, trimmed]);
                      }
                      setNewService("");
                    }
                  }}
                />
                <button
                  className={s.secondaryBtn}
                  onClick={() => {
                    const trimmed = newService.trim();
                    if (trimmed && !services.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
                      setServices([...services, trimmed]);
                    }
                    setNewService("");
                  }}
                >
                  {t.addService}
                </button>
              </div>
            </div>

            {/* Phone reassurance */}
            <div className={s.phoneReassurance}>
              <span>📞</span>
              <span>{t.phoneReassurance}</span>
            </div>
          </div>
        )}

        {/* ── STEP 2: Contact Info ── */}
        {step === 2 && (
          <div className={s.stepContent} key="step2">
            <h1 className={s.title}>{t.step2Title}</h1>
            <p className={s.subtitle}>{t.step2Sub}</p>

            <div className={s.field}>
              <label className={s.label} htmlFor="ownerName">{t.ownerName}</label>
              <input
                id="ownerName"
                className={`${s.input} ${errors.ownerName ? s.inputError : ""}`}
                placeholder={t.ownerNamePlaceholder}
                value={ownerName}
                onChange={(e) => { setOwnerName(e.target.value); clearFieldError("ownerName"); }}
              />
              {errors.ownerName && <span className={s.error}>{errors.ownerName}</span>}
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor="ownerEmail">{t.email}</label>
              <input
                id="ownerEmail"
                type="email"
                className={`${s.input} ${errors.ownerEmail ? s.inputError : ""}`}
                placeholder={t.emailPlaceholder}
                value={ownerEmail}
                onChange={(e) => { setOwnerEmail(e.target.value); clearFieldError("ownerEmail"); }}
              />
              {errors.ownerEmail && <span className={s.error}>{errors.ownerEmail}</span>}
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor="ownerPhone">{t.phone}</label>
              <input
                id="ownerPhone"
                type="tel"
                className={`${s.input} ${errors.ownerPhone ? s.inputError : ""}`}
                placeholder={t.phonePlaceholder}
                value={ownerPhone}
                onChange={(e) => { setOwnerPhone(formatPhone(e.target.value)); clearFieldError("ownerPhone"); }}
              />
              {errors.ownerPhone && <span className={s.error}>{errors.ownerPhone}</span>}
            </div>
          </div>
        )}

        {/* ── STEP 3: Meet Your Receptionist (Name + Personality merged) ── */}
        {step === 3 && (
          <div className={s.stepContent} key="step3">
            <h1 className={s.title}>{t.step3Title}</h1>
            <p className={s.subtitle}>{t.step3Sub}</p>

            {/* Name grid */}
            <div className={s.nameGrid}>
              {t.namePresets.map((name) => (
                <button
                  key={name}
                  onClick={() => { setReceptionistName(name); setUseCustomName(false); clearFieldError("receptionistName"); }}
                  className={`${s.cardSelectable} ${receptionistName === name && !useCustomName ? s.cardSelected : ""}`}
                  style={{ textAlign: "center", padding: "16px 12px" }}
                  aria-pressed={receptionistName === name && !useCustomName}
                >
                  <div style={{ color: "#fff", fontWeight: 600 }}>{name}</div>
                </button>
              ))}
              <button
                onClick={() => { setUseCustomName(true); setReceptionistName(""); }}
                className={`${s.cardSelectable} ${useCustomName ? s.cardSelected : ""}`}
                style={{ textAlign: "center", padding: "16px 12px" }}
                aria-pressed={useCustomName}
              >
                <div style={{ color: useCustomName ? "#fff" : "#94a3b8", fontWeight: 600 }}>{t.customName}</div>
              </button>
            </div>
            {useCustomName && (
              <input
                id="receptionistName"
                className={`${s.input} ${errors.receptionistName ? s.inputError : ""}`}
                placeholder={t.namePlaceholder}
                value={receptionistName}
                onChange={(e) => { setReceptionistName(e.target.value); clearFieldError("receptionistName"); }}
                style={{ marginTop: 12 }}
                autoFocus
              />
            )}
            {errors.receptionistName && <span className={s.error}>{errors.receptionistName}</span>}

            {/* Personality section */}
            <h3 style={{ color: "#fff", fontWeight: 600, fontSize: 16, margin: "28px 0 12px" }}>{t.personalityTitle}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PERSONALITY_OPTIONS.map((preset) => {
                const labels = {
                  professional: { name: t.professional, desc: t.professionalDesc },
                  friendly: { name: t.friendly, desc: t.friendlyDesc },
                  warm: { name: t.warm, desc: t.warmDesc },
                };
                const l = labels[preset];
                return (
                  <button
                    key={preset}
                    onClick={() => setPersonalityPreset(preset)}
                    className={`${s.cardSelectable} ${personalityPreset === preset ? s.cardSelected : ""}`}
                    style={{ textAlign: "left", padding: 16 }}
                    aria-pressed={personalityPreset === preset}
                  >
                    <div style={{ color: "#fff", fontWeight: 600, marginBottom: 4 }}>{l.name}</div>
                    <div style={{ color: "#94a3b8", fontSize: 14 }}>{l.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Greeting preview bubble */}
            {receptionistName.trim() && (
              <div className={s.previewBubble}>
                <div className={s.previewAvatar} style={{ background: "rgba(212,168,67,0.15)", color: "#D4A843", fontSize: 16, fontWeight: 700 }}>{receptionistName.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#D4A843", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{receptionistName}</div>
                  <div style={{ color: "#e2e8f0", fontSize: 14 }}>
                    &ldquo;{replaceVars(
                      personalityPreset === "professional" ? t.professionalSample
                        : personalityPreset === "warm" ? t.warmSample
                        : t.friendlySample,
                      { biz: bizName || t.yourBusiness, name: receptionistName }
                    )}&rdquo;
                  </div>
                  {hasSpeech && (
                    <>
                      <button onClick={playGreeting} disabled={isPlaying} className={s.previewBtn}>
                        {isPlaying ? "..." : `🔊 ${t.previewGreeting}`}
                      </button>
                      <div style={{ color: "#64748b", fontSize: 11, marginTop: 4, fontStyle: "italic" }}>{t.previewNote}</div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: FAQ + Off-Limits (was step 5) ── */}
        {step === 4 && (
          <div className={s.stepContent} key="step4">
            <h1 className={s.title}>{t.step5Title}</h1>
            <p className={s.subtitle}>{t.step5Sub}</p>

            {[
              { key: "hours", q: t.faqHoursQ, placeholder: t.faqHoursPlaceholder },
              { key: "area", q: t.faqAreaQ, placeholder: t.faqAreaPlaceholder },
              { key: "estimates", q: t.faqEstimatesQ, placeholder: t.faqEstimatesPlaceholder },
            ].map(({ key, q, placeholder }) => (
              <div key={key} className={s.field}>
                <label className={s.label} htmlFor={`faq-${key}`}>{q}</label>
                <input
                  id={`faq-${key}`}
                  className={s.input}
                  placeholder={placeholder}
                  value={faqAnswers[key] || ""}
                  onChange={(e) => setFaqAnswers({ ...faqAnswers, [key]: e.target.value })}
                />
              </div>
            ))}

            <div style={{ marginTop: 24 }}>
              <label className={s.label}>{t.offLimitsTitle}</label>
              <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 12px" }}>{t.offLimitsSub}</p>
              {[
                { key: "pricing", label: t.offLimitsPricing },
                { key: "competitors", label: t.offLimitsCompetitors },
                { key: "timing", label: t.offLimitsTiming },
              ].map(({ key, label }) => (
                <label key={key} className={s.toggle} htmlFor={`offlimit-${key}`}>
                  <input
                    id={`offlimit-${key}`}
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

        {/* ── STEP 5: Hire / Checkout (was step 6) ── */}
        {step === 5 && (
          <div className={s.stepContent} key="step5">
            <h1 className={s.title}>{receptionistName} {t.step6Sub} {bizName || t.yourBusiness}</h1>
            <p className={s.subtitle}>
              {t.trialNote}
            </p>

            {/* ROI Card — enhanced */}
            {tradeData?.roi && (
              <div className={s.card} style={{ marginBottom: 24, padding: 20 }}>
                <h3 style={{ color: "#D4A843", margin: "0 0 12px", fontSize: 15 }}>{t.missedCallsTitle}</h3>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#94a3b8", fontSize: 14 }}>{tradeData.roi.missedPerDay} {t.roiMissedPerDay}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#94a3b8", fontSize: 14 }}>${tradeData.avgJobValue} {t.roiCostPerMissed}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#ef4444", fontSize: 14, fontWeight: 600 }}>
                    ${tradeData.roi.estimatedMonthlyLoss.toLocaleString()}{t.roiMonthlyLoss}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#10b981", fontSize: 14, fontWeight: 600, background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 4 }}>
                    {replaceVars(t.roiBreakeven, { count: String(tradeData.roi.callsToPayForMaria) })}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#10b981", fontSize: 14, fontWeight: 600 }}>
                    {tradeData.roi.roiMultiple}{t.roiMultiple}
                  </span>
                </div>
                {bizType && city && (
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 8, fontStyle: "italic" }}>
                    {replaceVars(t.roiSource, {
                      trade: TRADE_OPTIONS.find((o) => o.value === bizType)?.[lang] || bizType,
                      city: city,
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Comparison anchor */}
            <div className={s.comparisonAnchor}>
              <span className={s.comparisonStrike}>{t.comparisonAnchor}</span>
            </div>

            {/* Plan toggle */}
            <div className={s.recommendedLabel}>{t.recommended}</div>
            <div className={s.planToggleContainer}>
              <button
                onClick={() => setPlanToggle("monthly")}
                className={`${s.planToggleBtn} ${planToggle === "monthly" ? s.planToggleBtnActive : ""}`}
              >
                {t.monthlyLabel}
              </button>
              <button
                onClick={() => setPlanToggle("annual")}
                className={`${s.planToggleBtn} ${planToggle === "annual" ? s.planToggleBtnActive : ""}`}
              >
                {t.annualLabel}
                <span className={s.saveBadge}>{t.annualSave}</span>
              </button>
            </div>

            <div className={s.priceCard}>
              <span className={s.priceAmount}>
                {planToggle === "monthly" ? t.monthlyPrice : t.annualPrice}
              </span>
              <span className={s.pricePer}>
                {planToggle === "monthly" ? t.monthlyPer : t.annualPer}
              </span>
            </div>

            {/* Summary */}
            <div className={s.summaryCard}>
              <h3 style={{ color: "#D4A843", margin: "0 0 12px", fontSize: 14 }}>{t.configSummary}</h3>
              <div className={s.summaryRow}><span className={s.summaryLabel}>✓ {receptionistName}</span> <span style={{ color: "#94a3b8", textTransform: "capitalize" }}>{personalityPreset}</span></div>
              {bizType && (
                <div className={s.summaryRow}>
                  <span className={s.summaryLabel}>✓ {TRADE_OPTIONS.find((o) => o.value === bizType)?.[lang] || bizType}</span>
                  <span style={{ color: "#94a3b8" }}>{city}, {state}</span>
                </div>
              )}
              {services.length > 0 && (
                <div className={s.summaryRow}><span className={s.summaryLabel}>✓ {services.length} {t.services}</span></div>
              )}
              <div className={s.summaryRow}><span className={s.summaryLabel}>✓ {t.bilingualLabel}</span></div>
            </div>

            {/* Trust badges */}
            <div className={s.trustBadges}>
              <span style={{ color: "#10b981", fontSize: 13 }}>🛡️ {t.cancelAnytime} · {t.guarantee}</span>
              <span style={{ color: "#10b981", fontSize: 12 }}>📞 {t.phoneReassurance}</span>
            </div>

            {/* CTA */}
            {errors._form && <div className={s.error} style={{ marginBottom: 12, textAlign: "center" }}>{errors._form}</div>}
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className={s.primaryBtn}
              style={{ width: "100%", fontSize: 18, padding: "16px 32px" }}
            >
              {checkoutLoading ? t.processing : `${t.hireCta} ${receptionistName} →`}
            </button>
          </div>
        )}

        {/* Nav buttons (steps 1-4) */}
        {step < 5 && (
          <div className={s.navButtons}>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className={s.backBtn}>{t.back}</button>
            )}
            <button
              onClick={handleNext}
              disabled={saving}
              className={s.primaryBtn}
              style={{ flex: 1 }}
            >
              {saving ? t.saving : t.next}
            </button>
          </div>
        )}

        {step === 5 && (
          <div style={{ marginTop: 12 }}>
            <button onClick={() => setStep(4)} className={s.backBtn}>{t.back}</button>
          </div>
        )}

        {errors._form && step < 5 && (
          <div className={s.error} style={{ marginTop: 8, textAlign: "center" }}>{errors._form}</div>
        )}
      </div>
    </div>
  );
}
