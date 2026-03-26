"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackCompleteRegistration, trackPurchase } from "@/lib/tracking";
import CaptaSpinner from "@/components/capta-spinner";

// ── Types ──

type Lang = "en" | "es";

interface BusinessData {
  name: string;
  type: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  twilioNumber: string;
  services: string[];
  businessHours: Record<string, { open: string; close: string; closed?: boolean }>;
  greeting: string;
  greetingEs: string;
  defaultLanguage: string;
  serviceArea: string;
  emergencyPhone: string;
  receptionistName: string;
  personalityPreset: string;
  stripeSubscriptionStatus?: string;
  paymentStatus?: string;
}

interface CallRecord {
  id: string;
  duration?: number;
  transcript?: Array<{ speaker: string; text: string }>;
  summary?: string;
  createdAt: string;
}

// ── Bilingual Content ──

const T = {
  en: {
    // Step 1
    step1Title: "Tell Us About Your Business",
    step1Sub: "This helps your receptionist answer calls professionally from day one.",
    bizName: "Business Name",
    bizAddress: "City, State",
    bizAddressHint: "e.g. San Antonio, TX",
    industry: "Trade / Industry",
    industryPlaceholder: "Select your trade",
    ownerNameLabel: "Your Name",
    ownerPhoneLabel: "Your Phone",
    ownerPhoneHint: "For escalations and notifications",
    servicesTitle: "Services You Offer",
    addService: "Add",
    addServicePlaceholder: "Add a custom service...",
    hoursTitle: "Business Hours",
    quickSet: "Quick set:",
    monFri85: "Mon–Fri 8–5",
    monSat86: "Mon–Sat 8–6",
    closed: "Closed",
    // Step 2
    step2Title: "Meet Your Receptionist",
    step2Sub: "Choose a name for your AI receptionist.",
    nameRecommended: "Recommended",
    nameCustom: "Custom Name",
    namePlaceholder: "Enter a name",
    // Step 3
    step3Title: "Choose Her Style",
    step3Sub: "How should she sound on the phone?",
    professional: "Professional",
    professionalDesc: "Polished and efficient. Gets straight to business.",
    friendly: "Friendly",
    friendlyDesc: "Warm and approachable. Makes every caller feel welcome.",
    warm: "Warm & Caring",
    warmDesc: "Extra empathetic. Perfect for sensitive clients.",
    // Step 4
    step4Title: "Teach Her Your Business",
    step4Sub: "Help your receptionist answer common questions and stay on-brand.",
    faqLabel: "Common Questions",
    faqSub: "When callers ask these, she'll use your answers.",
    faqHoursQ: "What are your hours?",
    faqAreaQ: "What areas do you serve?",
    faqEstimatesQ: "Do you offer free estimates?",
    faqEmergencyQ: "What's your emergency number?",
    faqServicesQ: "What services do you provide?",
    offLimitsLabel: "Off-Limits Topics",
    offLimitsSub: "She'll politely redirect if callers ask about these.",
    offLimitsPricing: "Don't discuss pricing over the phone",
    offLimitsCompetitors: "Don't discuss competitors",
    offLimitsTiming: "Don't make promises about timing",
    phrasesLabel: "Preferred Phrases",
    phrasesSub: "Words or phrases she should weave into conversations.",
    phrasesPlaceholder: "e.g. \"We offer a satisfaction guarantee\"\n\"Same-day service available\"",
    // Step 5
    step5Title: "Interview",
    step5Sub: "Call now and see how she handles a real conversation.",
    callNow: "Call now:",
    tapToCall: "Tap to call",
    waiting: "Waiting for your call...",
    connected: "Call connected! She's answering...",
    callComplete: "Interview complete!",
    duration: "Duration",
    seconds: "seconds",
    transcript: "Transcript",
    hireReport: "Hire Report",
    answeredAs: "answered as",
    language: "Language: English & Spanish",
    personality: "Personality",
    knowsYourBusiness: "She knows your hours, services, and emergency protocol",
    skipTest: "Skip for now",
    skipNudge: "We recommend interviewing before she goes live — it takes 2 minutes!",
    // Step 6 - Paywall
    step6Title: "Activate",
    step6TitleSuffix: "on Your Line",
    step6Sub: "is ready to answer phones for",
    missedCallsStat: "miss an average of 3 calls per week",
    lostRevenue: "in lost revenue per month",
    roiReturn: "return",
    costsOnly: "costs $497/month — a",
    monthlyLabel: "Monthly",
    annualLabel: "Annual",
    monthlyPrice: "$497",
    monthlyPer: "/month",
    annualPrice: "$397",
    annualPer: "/month billed annually",
    annualTotal: "$4,764/year",
    annualSave: "Save $1,200",
    hireCta: "Start Free Trial",
    guarantee: "14-day free trial",
    cancelAnytime: "Cancel anytime",
    liveIn24: "Live in 24 hours",
    orCall: "Or call her yourself:",
    // Step 7
    step7Title: "Payment",
    step7Sub: "Completing your subscription...",
    alreadyActive: "Your subscription is active!",
    redirectingToCheckout: "Redirecting to secure checkout...",
    paymentComplete: "Payment complete!",
    // Step 8
    step8Title: "Connect Your Phone",
    step8Sub: "Forward your business calls to your receptionist's number.",
    herNumber: "Her Number",
    forwardInstr: "Call Forwarding Instructions",
    attInstr: "Dial *21*[NUMBER]# from your business phone",
    verizonInstr: "Dial *72 then [NUMBER]",
    tmobileInstr: "Dial **21*[NUMBER]#",
    otherInstr: "Contact your provider and ask to forward unanswered calls to [NUMBER]",
    conditionalTip: "Tip: Ask for 'conditional forwarding' — forwards only when busy or unanswered.",
    forwardingDone: "I've set up call forwarding",
    testVerify: "Call your business number now to verify she answers",
    activateCta: "Activate My Receptionist",
    activating: "Activating...",
    testSetup: "Test Your Setup",
    testSetupDesc: "We'll call your Capta number to verify everything is working.",
    testCalling: "Calling...",
    testSuccess: "Test call placed! Check your phone.",
    testError: "Could not place test call. Try again.",
    isLive: "is LIVE!",
    celebrationSub: "Your AI receptionist is now answering calls.",
    goToDashboard: "Go to Dashboard",
    trainHer: "Train Her",
    viewCalls: "View Call History",
    redirecting: "Redirecting to your dashboard...",
    // Common
    next: "Next",
    back: "Back",
    saving: "Saving...",
    saved: "Saved!",
    required: "Required",
    step: "Step",
    of: "of",
    langToggle: "ES",
  },
  es: {
    step1Title: "Cuéntanos Sobre Tu Negocio",
    step1Sub: "Esto ayuda a tu recepcionista a contestar llamadas profesionalmente desde el primer día.",
    bizName: "Nombre del Negocio",
    bizAddress: "Ciudad, Estado",
    bizAddressHint: "ej. San Antonio, TX",
    industry: "Tipo de Negocio",
    industryPlaceholder: "Selecciona tu tipo",
    ownerNameLabel: "Tu Nombre",
    ownerPhoneLabel: "Tu Teléfono",
    ownerPhoneHint: "Para escalaciones y notificaciones",
    servicesTitle: "Servicios que Ofreces",
    addService: "Agregar",
    addServicePlaceholder: "Agregar servicio...",
    hoursTitle: "Horario de Atención",
    quickSet: "Configurar rápido:",
    monFri85: "Lun–Vie 8–5",
    monSat86: "Lun–Sáb 8–6",
    closed: "Cerrado",
    step2Title: "Conoce a Tu Recepcionista",
    step2Sub: "Elige un nombre para tu recepcionista de IA.",
    nameRecommended: "Recomendado",
    nameCustom: "Nombre Personalizado",
    namePlaceholder: "Ingresa un nombre",
    step3Title: "Elige Su Estilo",
    step3Sub: "¿Cómo debería sonar en el teléfono?",
    professional: "Profesional",
    professionalDesc: "Pulida y eficiente. Va directo al grano.",
    friendly: "Amigable",
    friendlyDesc: "Cálida y accesible. Todos se sienten bienvenidos.",
    warm: "Cálida y Atenta",
    warmDesc: "Extra empática. Perfecta para clientes sensibles.",
    step4Title: "Enséñale Tu Negocio",
    step4Sub: "Ayuda a tu recepcionista a responder preguntas comunes.",
    faqLabel: "Preguntas Comunes",
    faqSub: "Cuando los llamantes pregunten, ella usará tus respuestas.",
    faqHoursQ: "¿Cuál es su horario?",
    faqAreaQ: "¿Qué áreas cubren?",
    faqEstimatesQ: "¿Ofrecen estimados gratis?",
    faqEmergencyQ: "¿Cuál es su número de emergencia?",
    faqServicesQ: "¿Qué servicios ofrecen?",
    offLimitsLabel: "Temas Prohibidos",
    offLimitsSub: "Ella redirigirá cortésmente si preguntan sobre estos.",
    offLimitsPricing: "No discutir precios por teléfono",
    offLimitsCompetitors: "No discutir competidores",
    offLimitsTiming: "No hacer promesas de tiempo",
    phrasesLabel: "Frases Preferidas",
    phrasesSub: "Palabras o frases que debe usar naturalmente.",
    phrasesPlaceholder: "ej. \"Ofrecemos garantía de satisfacción\"\n\"Servicio el mismo día\"",
    step5Title: "Entrevístala",
    step5Sub: "Llama ahora y mira cómo maneja una conversación real.",
    callNow: "Llama ahora:",
    tapToCall: "Toca para llamar",
    waiting: "Esperando tu llamada...",
    connected: "¡Llamada conectada! Ella está contestando...",
    callComplete: "¡Entrevista completa!",
    duration: "Duración",
    seconds: "segundos",
    transcript: "Transcripción",
    hireReport: "Reporte de Contratación",
    answeredAs: "contestó como",
    language: "Idioma: Inglés y Español",
    personality: "Personalidad",
    knowsYourBusiness: "Conoce tus horarios, servicios y protocolo de emergencia",
    skipTest: "Omitir por ahora",
    skipNudge: "Recomendamos entrevistarla antes — ¡toma solo 2 minutos!",
    step6Title: "Activa a",
    step6TitleSuffix: "en Tu Línea",
    step6Sub: "está lista para contestar llamadas de",
    missedCallsStat: "pierden un promedio de 3 llamadas por semana",
    lostRevenue: "en ingresos perdidos por mes",
    roiReturn: "de retorno",
    costsOnly: "cuesta $497/mes — un",
    monthlyLabel: "Mensual",
    annualLabel: "Anual",
    monthlyPrice: "$497",
    monthlyPer: "/mes",
    annualPrice: "$397",
    annualPer: "/mes facturado anualmente",
    annualTotal: "$4,764/año",
    annualSave: "Ahorra $1,200",
    hireCta: "Comenzar Prueba Gratuita",
    guarantee: "Prueba gratuita de 14 días",
    cancelAnytime: "Cancela cuando quieras",
    liveIn24: "En línea en 24 horas",
    orCall: "O llámala tú mismo:",
    step7Title: "Pago",
    step7Sub: "Completando tu suscripción...",
    alreadyActive: "¡Tu suscripción está activa!",
    redirectingToCheckout: "Redirigiendo al pago seguro...",
    paymentComplete: "¡Pago completado!",
    step8Title: "Conecta Tu Teléfono",
    step8Sub: "Redirige las llamadas de tu negocio al número de tu recepcionista.",
    herNumber: "Su Número",
    forwardInstr: "Instrucciones de Desvío",
    attInstr: "Marca *21*[NUMBER]# desde tu teléfono",
    verizonInstr: "Marca *72 y luego [NUMBER]",
    tmobileInstr: "Marca **21*[NUMBER]#",
    otherInstr: "Contacta a tu proveedor y pide desviar llamadas no contestadas a [NUMBER]",
    conditionalTip: "Tip: Pide 'desvío condicional' — solo desvía cuando estés ocupado.",
    forwardingDone: "Ya configuré el desvío de llamadas",
    testVerify: "Llama a tu número de negocio para verificar que ella contesta",
    activateCta: "Activar Mi Recepcionista",
    activating: "Activando...",
    testSetup: "Probar Tu Configuración",
    testSetupDesc: "Llamaremos a tu número de Capta para verificar que todo funciona.",
    testCalling: "Llamando...",
    testSuccess: "¡Llamada de prueba realizada! Revisa tu teléfono.",
    testError: "No se pudo realizar la llamada de prueba. Intenta de nuevo.",
    isLive: "¡está EN LÍNEA!",
    celebrationSub: "Tu recepcionista de IA ahora está contestando llamadas.",
    goToDashboard: "Ir al Panel",
    trainHer: "Entrénala",
    viewCalls: "Ver Llamadas",
    redirecting: "Redirigiendo a tu panel...",
    next: "Siguiente",
    back: "Atrás",
    saving: "Guardando...",
    saved: "¡Guardado!",
    required: "Requerido",
    step: "Paso",
    of: "de",
    langToggle: "EN",
  },
};

// ── Industry-specific service templates ──

const SERVICE_TEMPLATES: Record<string, string[]> = {
  hvac: ["AC Repair", "AC Installation", "Heating Repair", "Heating Installation", "Duct Cleaning", "Maintenance Plans"],
  plumbing: ["Drain Cleaning", "Leak Repair", "Water Heater", "Sewer Line", "Faucet/Fixture", "Emergency Plumbing"],
  electrical: ["Panel Upgrade", "Outlet/Switch", "Lighting", "Ceiling Fan", "Generator", "Rewiring"],
  general_contractor: ["Kitchen Remodel", "Bathroom Remodel", "Flooring", "Painting", "Drywall", "Concrete"],
  landscaping: ["Lawn Mowing", "Tree Trimming", "Irrigation", "Hardscaping", "Garden Design", "Sod Installation"],
  roofing: ["Roof Repair", "Roof Replacement", "Leak Detection", "Gutter Install", "Shingle Repair", "Storm Damage"],
};

const INDUSTRIES = [
  { value: "plumbing", label: "Plumbing" },
  { value: "hvac", label: "HVAC" },
  { value: "electrical", label: "Electrical" },
  { value: "roofing", label: "Roofing" },
  { value: "landscaping", label: "Landscaping" },
  { value: "general_contractor", label: "General Contractor" },
  { value: "other", label: "Other" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS: Record<string, { en: string; es: string }> = {
  Mon: { en: "Mon", es: "Lun" }, Tue: { en: "Tue", es: "Mar" }, Wed: { en: "Wed", es: "Mié" },
  Thu: { en: "Thu", es: "Jue" }, Fri: { en: "Fri", es: "Vie" }, Sat: { en: "Sat", es: "Sáb" },
  Sun: { en: "Sun", es: "Dom" },
};

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

// ROI data by trade
const AVG_JOB_VALUES: Record<string, number> = {
  plumbing: 800, hvac: 1200, electrical: 600, roofing: 3500, landscaping: 400, general_contractor: 2000, other: 500,
};
const TRADE_LABELS: Record<string, string> = {
  plumbing: "Plumbers", hvac: "HVAC contractors", electrical: "Electricians", roofing: "Roofers",
  landscaping: "Landscapers", general_contractor: "General contractors", other: "Contractors",
};

const CARRIER_TABS = ["att", "verizon", "tmobile", "other"] as const;

const TOTAL_STEPS = 8;

// ── Component ──

export default function OnboardingPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <CaptaSpinner size={32} />
      </div>
    }>
      <OnboardingPage />
    </Suspense>
  );
}

function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"" | "saving" | "saved">("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1
  const [bizName, setBizName] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState("");
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed?: boolean }>>({
    Mon: { open: "08:00", close: "17:00" }, Tue: { open: "08:00", close: "17:00" },
    Wed: { open: "08:00", close: "17:00" }, Thu: { open: "08:00", close: "17:00" },
    Fri: { open: "08:00", close: "17:00" }, Sat: { open: "09:00", close: "13:00" },
    Sun: { open: "00:00", close: "00:00", closed: true },
  });

  // Step 2
  const [receptionistName, setReceptionistName] = useState("Maria");
  const [useCustomName, setUseCustomName] = useState(false);

  // Step 3
  const [personalityPreset, setPersonalityPreset] = useState("friendly");

  // Step 4
  const [faqAnswers, setFaqAnswers] = useState<Record<string, string>>({});
  const [offLimits, setOffLimits] = useState<Record<string, boolean>>({ pricing: false, competitors: false, timing: false });
  const [preferredPhrases, setPreferredPhrases] = useState("");
  const [digestPref, setDigestPref] = useState("sms");
  const [showPricing, setShowPricing] = useState(false);
  const [onboardingPricing, setOnboardingPricing] = useState<Array<{ label: string; min: string; max: string; unit: string }>>([
    { label: "", min: "", max: "", unit: "per_job" },
    { label: "", min: "", max: "", unit: "per_job" },
    { label: "", min: "", max: "", unit: "per_job" },
  ]);

  // Step 5
  const [twilioNumber, setTwilioNumber] = useState("");
  const [testCallStatus, setTestCallStatus] = useState<"waiting" | "connected" | "complete">("waiting");
  const [testCall, setTestCall] = useState<CallRecord | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialCallCountRef = useRef<number | null>(null);

  // Step 6 - Paywall
  const [planToggle, setPlanToggle] = useState<"monthly" | "annual">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Step 7 - Payment
  const [paymentDone, setPaymentDone] = useState(false);

  // Step 8
  const [carrierTab, setCarrierTab] = useState<typeof CARRIER_TABS[number]>("att");
  const [forwardingDone, setForwardingDone] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activating, setActivating] = useState(false);
  const [testForwardingStatus, setTestForwardingStatus] = useState<"idle" | "calling" | "success" | "error">("idle");

  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = T[lang];

  // ── Load onboarding state ──
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard/onboarding");
        if (!res.ok) return;
        const data = await res.json();

        if (data.onboardingCompletedAt) {
          router.replace("/dashboard");
          return;
        }

        // Handle return from Stripe checkout
        const sessionId = searchParams.get("session_id");
        const stepParam = searchParams.get("step");
        if (sessionId) {
          trackPurchase();
          setPaymentDone(true);
          setStep(8); // Go to phone setup after payment
          saveProgress(8);
          setLoading(false);
          return;
        }

        // Resume from last step
        const resumeStep = stepParam ? parseInt(stepParam) : (data.onboardingStep ?? 1);
        setStep(Math.min(resumeStep, TOTAL_STEPS));

        const biz = data.businessData;
        if (biz) {
          setBizName(biz.name || "");
          setBizAddress(biz.serviceArea || "");
          setIndustry(biz.type || "");
          setOwnerName(biz.ownerName || "");
          setOwnerPhone(biz.ownerPhone || "");
          setServices(biz.services || []);
          if (biz.businessHours && Object.keys(biz.businessHours).length > 0) setHours(biz.businessHours);
          setTwilioNumber(biz.twilioNumber || "");
          if (biz.receptionistName) setReceptionistName(biz.receptionistName);
          if (biz.personalityPreset) setPersonalityPreset(biz.personalityPreset);
          // Check if already paid
          if (biz.stripeSubscriptionStatus === "active" || biz.stripeSubscriptionStatus === "trialing") {
            setPaymentDone(true);
          }
        }
      } catch {
        // Continue with defaults
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    const stored = localStorage.getItem("capta-lang") as Lang | null;
    if (stored === "en" || stored === "es") setLang(stored);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  // ── Save progress ──
  const saveProgress = useCallback(async (nextStep: number, skippedStep?: number) => {
    try {
      await fetch("/api/dashboard/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: nextStep, skippedStep }),
      });
    } catch { /* Non-critical */ }
  }, []);

  const saveSettings = useCallback(async (data: Record<string, unknown>) => {
    setSaving(true);
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
      return true;
    } catch (err) {
      setErrors({ save: err instanceof Error ? err.message : "Failed to save" });
      setSaveStatus("");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Step navigation ──
  const goNext = useCallback(async () => {
    setErrors({});
    const nextStep = step + 1;

    // Step 1: Validate & save business info
    if (step === 1) {
      const errs: Record<string, string> = {};
      if (!bizName.trim()) errs.bizName = t.required;
      if (!industry) errs.industry = t.required;
      if (!ownerName.trim()) errs.ownerName = t.required;
      if (!ownerPhone.trim()) errs.ownerPhone = t.required;
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }

      const ok = await saveSettings({
        name: bizName.trim(),
        type: industry,
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.replace(/\D/g, "").replace(/^(\d{10})$/, "1$1"),
        businessHours: hours,
        services,
        serviceArea: bizAddress.trim(),
      });
      if (!ok) return;
    }

    // Step 2: Save receptionist name
    if (step === 2) {
      const ok = await saveSettings({ receptionistName });
      if (!ok) return;
    }

    // Step 3: Save personality
    if (step === 3) {
      const ok = await saveSettings({ personalityPreset });
      if (!ok) return;
    }

    // Step 4: Save FAQ, off-limits, phrases
    if (step === 4) {
      try {
        for (const [key, answer] of Object.entries(faqAnswers)) {
          if (!answer.trim()) continue;
          const questionMap: Record<string, string> = {
            hours: t.faqHoursQ, area: t.faqAreaQ, estimates: t.faqEstimatesQ,
            emergency: t.faqEmergencyQ, services: t.faqServicesQ,
          };
          await fetch("/api/receptionist/responses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: "faq", triggerText: questionMap[key] || key, responseText: answer.trim() }),
          });
        }
        const offLimitsMap: Record<string, { trigger: string; redirect: string }> = {
          pricing: { trigger: "Specific pricing or quotes", redirect: `${ownerName || "The owner"} can provide a detailed quote.` },
          competitors: { trigger: "Competitor comparisons", redirect: "I focus on how we can help you." },
          timing: { trigger: "Exact timing promises", redirect: `${ownerName || "The owner"} can confirm specific timing.` },
        };
        for (const [key, checked] of Object.entries(offLimits)) {
          if (!checked) continue;
          const item = offLimitsMap[key];
          if (!item) continue;
          await fetch("/api/receptionist/responses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: "off_limits", triggerText: item.trigger, responseText: item.redirect }),
          });
        }
        const phrases = preferredPhrases.split("\n").map((p) => p.replace(/^["']|["']$/g, "").trim()).filter(Boolean);
        for (const phrase of phrases.slice(0, 10)) {
          await fetch("/api/receptionist/responses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category: "phrase", triggerText: phrase }),
          });
        }
      } catch { /* Non-critical */ }

      // Save pricing ranges if any were filled
      if (showPricing) {
        try {
          for (const row of onboardingPricing) {
            if (!row.label.trim()) continue;
            await fetch("/api/dashboard/estimate-pricing", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mode: "quick",
                jobTypeKey: row.label.toLowerCase().replace(/\s+/g, "_"),
                jobTypeLabel: row.label,
                tradeType: industry || "other",
                scopeLevel: "residential",
                minPrice: Number(row.min) || null,
                maxPrice: Number(row.max) || null,
                unit: row.unit,
              }),
            });
          }
        } catch { /* Non-critical */ }
      }

      // Save digest preference
      try {
        await fetch("/api/dashboard/digest/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ digestPreference: digestPref }),
        });
      } catch { /* Non-critical */ }
    }

    await saveProgress(nextStep);
    setStep(nextStep);
  }, [step, bizName, bizAddress, industry, ownerName, ownerPhone, hours, services, receptionistName, personalityPreset, faqAnswers, offLimits, preferredPhrases, digestPref, showPricing, onboardingPricing, saveSettings, saveProgress, t]);

  const goBack = useCallback(() => { if (step > 1) setStep(step - 1); }, [step]);

  const skipStep = useCallback(async (stepNum: number) => {
    await saveProgress(stepNum + 1, stepNum);
    setStep(stepNum + 1);
  }, [saveProgress]);

  // ── Step 5: Poll for test call ──
  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    fetch("/api/dashboard/calls?limit=1").then((r) => { if (!r.ok) throw new Error(); return r.json(); }).then((data) => { initialCallCountRef.current = data.total ?? 0; }).catch(() => { initialCallCountRef.current = 0; });
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/dashboard/calls?limit=1");
        if (!res.ok) return;
        const data = await res.json();
        if (data.total > (initialCallCountRef.current ?? 0) && data.calls?.length > 0) {
          const latest = data.calls[0];
          if (latest.status === "in_progress") setTestCallStatus("connected");
          else if (latest.status === "completed") {
            setTestCallStatus("complete");
            setTestCall(latest);
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          }
        }
      } catch { /* Continue */ }
    }, 3000);
  }, []);

  useEffect(() => {
    if (step === 5) startPolling();
    return () => { if (step !== 5 && pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [step, startPolling]);

  // ── Step 6: Checkout handler ──
  const handleCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/dashboard/onboarding/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planToggle }),
      });
      const data = await res.json();
      if (data.alreadyActive) {
        setPaymentDone(true);
        setStep(8);
        await saveProgress(8);
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        setErrors({ checkout: data.error || "Failed to start checkout" });
      }
    } catch {
      setErrors({ checkout: "Something went wrong" });
    }
    setCheckoutLoading(false);
  }, [planToggle, saveProgress]);

  // ── Step 8: Activate & celebration ──
  const handleActivate = useCallback(async () => {
    setActivating(true);
    try {
      const res = await fetch("/api/dashboard/activate", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Activation failed" }));
        setErrors({ activate: err.error || "Activation failed" });
        return;
      }
      setShowConfetti(true);
      await saveProgress(8);
      trackCompleteRegistration();
      redirectTimerRef.current = setTimeout(() => router.push("/dashboard"), 8000);
    } catch {
      setErrors({ activate: "Something went wrong" });
    } finally {
      setActivating(false);
    }
  }, [saveProgress, router]);

  // ── Test forwarding call ──
  const handleTestForwarding = useCallback(async () => {
    setTestForwardingStatus("calling");
    try {
      const res = await fetch("/api/dashboard/test-forwarding", { method: "POST" });
      if (!res.ok) {
        setTestForwardingStatus("error");
        return;
      }
      setTestForwardingStatus("success");
      setTimeout(() => setTestForwardingStatus("idle"), 8000);
    } catch {
      setTestForwardingStatus("error");
      setTimeout(() => setTestForwardingStatus("idle"), 5000);
    }
  }, []);

  const handleIndustryChange = useCallback((value: string) => {
    setIndustry(value);
    const template = SERVICE_TEMPLATES[value];
    setServices(template ?? []);
  }, []);

  const quickSetHours = useCallback((preset: "mf85" | "ms86") => {
    const c = preset === "ms86" ? "18:00" : "17:00";
    setHours({
      Mon: { open: "08:00", close: c }, Tue: { open: "08:00", close: c },
      Wed: { open: "08:00", close: c }, Thu: { open: "08:00", close: c },
      Fri: { open: "08:00", close: c },
      Sat: preset === "ms86" ? { open: "08:00", close: "18:00" } : { open: "00:00", close: "00:00", closed: true },
      Sun: { open: "00:00", close: "00:00", closed: true },
    });
  }, []);

  const toggleLang = useCallback(() => {
    const next = lang === "en" ? "es" : "en";
    setLang(next);
    localStorage.setItem("capta-lang", next);
  }, [lang]);

  const formatPhone = (num: string) => {
    const d = num.replace(/\D/g, "");
    if (d.length === 11 && d[0] === "1") return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    return num;
  };

  // ROI calculations
  const avgJob = AVG_JOB_VALUES[industry] || 500;
  const missedPerWeek = 3;
  const monthlyLoss = avgJob * missedPerWeek * 4;
  const roi = Math.round(monthlyLoss / 497);
  const tradeLabel = TRADE_LABELS[industry] || "Contractors";

  const rName = receptionistName || "Maria";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--db-bg, #fff)" }}>
        <div className="flex flex-col items-center gap-3">
          <CaptaSpinner size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--db-bg, #FBFBFC)" }}>
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#111827" /><path d="M8 16c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8" stroke="#C59A27" strokeWidth="2.5" strokeLinecap="round" /><circle cx="16" cy="16" r="3" fill="#C59A27" /></svg>
            <span className="text-lg font-bold text-gray-900">Capta</span>
          </div>
          <div className="flex items-center gap-3">
            {bizName && <span className="hidden text-sm text-gray-500 sm:inline">{bizName}</span>}
            <button onClick={toggleLang} className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">{t.langToggle}</button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b border-gray-100 bg-white px-4 py-2 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span>{t.step} {step} {t.of} {TOTAL_STEPS}</span>
            {saveStatus === "saving" && <span className="text-amber-500">{t.saving}</span>}
            {saveStatus === "saved" && <span className="text-green-500">{t.saved}</span>}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                style={{ background: i < step ? "var(--db-accent, #C59A27)" : "var(--db-border, #E5E7EB)" }} />
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">

        {/* ── STEP 1: Business Info ── */}
        {step === 1 && (
          <div>
            <h1 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">{t.step1Title}</h1>
            <p className="mb-6 text-sm text-gray-500">{t.step1Sub}</p>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.bizName} error={errors.bizName} required>
                  <input type="text" value={bizName} onChange={(e) => setBizName(e.target.value)} className="db-input" placeholder="Garcia Plumbing & HVAC" />
                </Field>
                <Field label={t.industry} error={errors.industry} required>
                  <select value={industry} onChange={(e) => handleIndustryChange(e.target.value)} className="db-select">
                    <option value="">{t.industryPlaceholder}</option>
                    {INDUSTRIES.map((ind) => (<option key={ind.value} value={ind.value}>{ind.label}</option>))}
                  </select>
                </Field>
              </div>
              <Field label={t.bizAddress} hint={t.bizAddressHint}>
                <input type="text" value={bizAddress} onChange={(e) => setBizAddress(e.target.value)} className="db-input" placeholder="San Antonio, TX" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.ownerNameLabel} error={errors.ownerName} required>
                  <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="db-input" placeholder="Mike Garcia" />
                </Field>
                <Field label={t.ownerPhoneLabel} error={errors.ownerPhone} hint={t.ownerPhoneHint} required>
                  <input type="tel" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} className="db-input" placeholder="(210) 555-0123" />
                </Field>
              </div>

              {/* Services */}
              <div className="pt-4 border-t border-gray-100">
                <p className="mb-3 text-sm font-semibold text-gray-800">{t.servicesTitle}</p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {services.map((svc, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700">
                      {svc}
                      <button onClick={() => setServices(services.filter((_, j) => j !== i))} className="ml-0.5 text-gray-400 hover:text-red-500">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newService} onChange={(e) => setNewService(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && newService.trim() && services.length < 20) { setServices([...services, newService.trim()]); setNewService(""); } }}
                    className="db-input flex-1" placeholder={t.addServicePlaceholder} maxLength={50} />
                  <button onClick={() => { if (newService.trim() && services.length < 20) { setServices([...services, newService.trim()]); setNewService(""); } }}
                    disabled={!newService.trim()} className="db-btn rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed" data-variant="primary">{t.addService}</button>
                </div>
                {industry && SERVICE_TEMPLATES[industry] && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SERVICE_TEMPLATES[industry].filter((s) => !services.includes(s)).map((svc) => (
                      <button key={svc} onClick={() => services.length < 20 && setServices([...services, svc])}
                        className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700">+ {svc}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Hours */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800">{t.hoursTitle}</p>
                  <div className="flex gap-2">
                    <span className="text-xs text-gray-400 self-center">{t.quickSet}</span>
                    <button onClick={() => quickSetHours("mf85")} className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-600 hover:bg-amber-50 hover:border-amber-300">{t.monFri85}</button>
                    <button onClick={() => quickSetHours("ms86")} className="rounded-full border border-gray-200 px-2.5 py-0.5 text-xs text-gray-600 hover:bg-amber-50 hover:border-amber-300">{t.monSat86}</button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {DAYS.map((day) => {
                    const h = hours[day] || { open: "08:00", close: "17:00" };
                    const isClosed = h.closed === true;
                    return (
                      <div key={day} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white p-2">
                        <span className="w-10 text-xs font-medium text-gray-700">{DAY_LABELS[day][lang]}</span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={!isClosed} onChange={() => setHours({ ...hours, [day]: isClosed ? { open: "08:00", close: "17:00" } : { open: "00:00", close: "00:00", closed: true } })} className="accent-amber-500" />
                        </label>
                        {!isClosed ? (
                          <div className="flex items-center gap-1 text-sm flex-1">
                            <select value={h.open} onChange={(e) => setHours({ ...hours, [day]: { ...h, open: e.target.value } })} className="rounded border border-gray-200 px-1.5 py-1 text-xs">
                              {TIME_OPTIONS.map((to) => (<option key={to} value={to}>{to}</option>))}
                            </select>
                            <span className="text-gray-400">–</span>
                            <select value={h.close} onChange={(e) => setHours({ ...hours, [day]: { ...h, close: e.target.value } })} className="rounded border border-gray-200 px-1.5 py-1 text-xs">
                              {TIME_OPTIONS.map((to) => (<option key={to} value={to}>{to}</option>))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">{t.closed}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {errors.save && <ErrorBanner message={errors.save} />}
            <StepNav onBack={goBack} onNext={goNext} saving={saving} t={t} showBack={false} />
          </div>
        )}

        {/* ── STEP 2: Name Your Receptionist ── */}
        {step === 2 && (
          <div>
            <h1 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">{t.step2Title}</h1>
            <p className="mb-6 text-sm text-gray-500">{t.step2Sub}</p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["Maria", "Sofia", "Isabella"] as const).map((name, i) => (
                <button key={name} onClick={() => { setReceptionistName(name); setUseCustomName(false); }}
                  className="relative flex flex-col items-center rounded-xl border-2 p-4 text-center transition-all hover:shadow-md"
                  style={{ borderColor: !useCustomName && receptionistName === name ? "var(--db-accent)" : "var(--db-border, #E5E7EB)", background: !useCustomName && receptionistName === name ? "var(--db-accent-bg)" : "var(--db-card, #fff)" }}>
                  <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-lg font-bold text-amber-600">{name[0]}</div>
                  <p className="text-sm font-semibold text-gray-900">{name}</p>
                  {i === 0 && <span className="mt-1 text-xs font-medium uppercase tracking-wider text-amber-500">{t.nameRecommended}</span>}
                </button>
              ))}
              <button onClick={() => { setUseCustomName(true); if (["Maria", "Sofia", "Isabella"].includes(receptionistName)) setReceptionistName(""); }}
                className="flex flex-col items-center rounded-xl border-2 border-dashed p-4 text-center transition-all hover:shadow-md"
                style={{ borderColor: useCustomName ? "var(--db-accent)" : "var(--db-border, #D1D5DB)", background: useCustomName ? "var(--db-accent-bg)" : "var(--db-card, #fff)" }}>
                <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">{t.nameCustom}</p>
              </button>
            </div>
            {useCustomName && (
              <div className="mt-3">
                <input type="text" value={receptionistName} onChange={(e) => { const val = e.target.value.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑüÜ\s]/g, ""); if (val.length <= 20) setReceptionistName(val); }}
                  className="db-input" placeholder={t.namePlaceholder} maxLength={20} autoFocus />
              </div>
            )}

            {/* Preview bubble */}
            {receptionistName && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-amber-700">{receptionistName[0]}</div>
                  <div>
                    <p className="text-sm font-medium text-amber-700">{receptionistName}</p>
                    <p className="mt-0.5 text-sm text-gray-700 italic">
                      &ldquo;{lang === "es" ? `¡Hola! Soy ${receptionistName}. Contestaré las llamadas de ${bizName || "su negocio"}.` : `Hi! I'm ${receptionistName}. I'll be answering phones for ${bizName || "your business"}.`}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            )}

            {errors.save && <ErrorBanner message={errors.save} />}
            <StepNav onBack={goBack} onNext={goNext} saving={saving} t={t} nextDisabled={!receptionistName.trim()} />
          </div>
        )}

        {/* ── STEP 3: Personality ── */}
        {step === 3 && (
          <div>
            <h1 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">{t.step3Title}</h1>
            <p className="mb-6 text-sm text-gray-500">{t.step3Sub}</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {([
                { key: "professional", icon: "briefcase", label: t.professional, desc: t.professionalDesc, color: "#3B82F6",
                  sample: lang === "es" ? `Gracias por llamar a ${bizName || "su negocio"}. ¿En qué le puedo ayudar?` : `Thank you for calling ${bizName || "your business"}. How may I assist you today?` },
                { key: "friendly", icon: "smile", label: t.friendly, desc: t.friendlyDesc, color: "#10B981",
                  sample: lang === "es" ? `¡Hola! Gracias por llamar a ${bizName || "su negocio"}. ¿En qué le puedo ayudar hoy?` : `Hi there! Thanks for calling ${bizName || "your business"}. What can I help you with today?` },
                { key: "warm", icon: "heart", label: t.warm, desc: t.warmDesc, color: "#F59E0B",
                  sample: lang === "es" ? `Hola, muchas gracias por llamar a ${bizName || "su negocio"}. Estoy aquí para ayudarle.` : `Hello, thank you so much for calling ${bizName || "your business"}. I'm here to help — what's going on?` },
              ] as const).map((p) => (
                <button key={p.key} onClick={() => setPersonalityPreset(p.key)}
                  className="flex flex-col items-center rounded-xl border-2 p-5 text-center transition-all hover:shadow-md"
                  style={{ borderColor: personalityPreset === p.key ? p.color : "var(--db-border, #E5E7EB)", background: personalityPreset === p.key ? `${p.color}08` : "var(--db-card, #fff)" }}>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: `${p.color}15` }}>
                    {p.icon === "briefcase" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>}
                    {p.icon === "smile" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>}
                    {p.icon === "heart" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{p.label}</p>
                  <p className="mt-1 text-xs text-gray-500">{p.desc}</p>
                  {personalityPreset === p.key && (
                    <div className="mt-3 w-full border-t border-gray-100 pt-3">
                      <p className="text-xs font-medium text-gray-400 mb-1">{rName}:</p>
                      <p className="text-xs text-gray-600 italic">&ldquo;{p.sample}&rdquo;</p>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {errors.save && <ErrorBanner message={errors.save} />}
            <StepNav onBack={goBack} onNext={goNext} saving={saving} t={t} />
          </div>
        )}

        {/* ── STEP 4: Teach Her Your Business ── */}
        {step === 4 && (
          <div>
            <h1 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">{t.step4Title}</h1>
            <p className="mb-6 text-sm text-gray-500">{t.step4Sub}</p>

            <div className="space-y-8">
              <div>
                <p className="mb-1 text-sm font-semibold text-gray-800">{t.faqLabel}</p>
                <p className="mb-4 text-xs text-gray-400">{t.faqSub}</p>
                <div className="space-y-3">
                  {([
                    { key: "hours", q: t.faqHoursQ, prefill: hours ? Object.entries(hours).filter(([, v]) => !v.closed).map(([d, v]) => `${d}: ${v.open}–${v.close}`).join(", ") : "" },
                    { key: "area", q: t.faqAreaQ, prefill: "" },
                    { key: "estimates", q: t.faqEstimatesQ, prefill: "" },
                    { key: "emergency", q: t.faqEmergencyQ, prefill: ownerPhone ? `For emergencies, call us at ${formatPhone(ownerPhone)}` : "" },
                    { key: "services", q: t.faqServicesQ, prefill: services.length > 0 ? `We offer ${services.join(", ")}` : "" },
                  ] as const).map((faq) => (
                    <div key={faq.key} className="rounded-lg border border-gray-100 bg-white p-3">
                      <p className="mb-1.5 text-sm font-medium text-gray-700">&ldquo;{faq.q}&rdquo;</p>
                      <textarea value={faqAnswers[faq.key] || ""} onChange={(e) => setFaqAnswers((prev) => ({ ...prev, [faq.key]: e.target.value }))}
                        className="db-input min-h-[50px] resize-y" placeholder={faq.prefill || ""} maxLength={500} rows={2} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1 text-sm font-semibold text-gray-800">{t.offLimitsLabel}</p>
                <p className="mb-3 text-xs text-gray-400">{t.offLimitsSub}</p>
                <div className="space-y-2">
                  {([
                    { key: "pricing", label: t.offLimitsPricing },
                    { key: "competitors", label: t.offLimitsCompetitors },
                    { key: "timing", label: t.offLimitsTiming },
                  ] as const).map((item) => (
                    <label key={item.key} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" checked={offLimits[item.key] || false} onChange={(e) => setOffLimits((prev) => ({ ...prev, [item.key]: e.target.checked }))} className="h-4 w-4 accent-amber-500" />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1 text-sm font-semibold text-gray-800">{t.phrasesLabel}</p>
                <p className="mb-3 text-xs text-gray-400">{t.phrasesSub}</p>
                <textarea value={preferredPhrases} onChange={(e) => setPreferredPhrases(e.target.value)}
                  className="db-input min-h-[80px] resize-y" placeholder={t.phrasesPlaceholder} maxLength={1000} rows={3} />
              </div>

              {/* Optional: Set Up Pricing */}
              <div className="rounded-lg border border-gray-100 bg-gray-50">
                <button
                  onClick={() => setShowPricing(!showPricing)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {lang === "es" ? "Opcional: Configurar Precios" : "Optional: Set Up Pricing"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {lang === "es"
                        ? `¿Debería ${rName} compartir rangos de precios con los llamantes?`
                        : `Should ${rName} quote price ranges to callers?`}
                    </p>
                  </div>
                  <span className="text-gray-400">{showPricing ? "▲" : "▼"}</span>
                </button>
                {showPricing && (
                  <div className="border-t border-gray-100 p-4 space-y-3">
                    {onboardingPricing.map((row, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={lang === "es" ? "Tipo de trabajo" : "Job type"}
                          value={row.label}
                          onChange={(e) => {
                            const updated = [...onboardingPricing];
                            updated[i] = { ...row, label: e.target.value };
                            setOnboardingPricing(updated);
                          }}
                          className="db-input flex-1"
                        />
                        <span className="text-xs text-gray-400">$</span>
                        <input
                          type="number"
                          placeholder="Min"
                          value={row.min}
                          onChange={(e) => {
                            const updated = [...onboardingPricing];
                            updated[i] = { ...row, min: e.target.value };
                            setOnboardingPricing(updated);
                          }}
                          className="db-input w-20"
                        />
                        <span className="text-xs text-gray-400">–</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={row.max}
                          onChange={(e) => {
                            const updated = [...onboardingPricing];
                            updated[i] = { ...row, max: e.target.value };
                            setOnboardingPricing(updated);
                          }}
                          className="db-input w-20"
                        />
                        <select
                          value={row.unit}
                          onChange={(e) => {
                            const updated = [...onboardingPricing];
                            updated[i] = { ...row, unit: e.target.value };
                            setOnboardingPricing(updated);
                          }}
                          className="db-select w-24 text-xs"
                        >
                          <option value="per_job">per job</option>
                          <option value="per_hour">per hour</option>
                          <option value="per_room">per room</option>
                          <option value="per_sqft">per sqft</option>
                        </select>
                      </div>
                    ))}
                    <button
                      onClick={() => setOnboardingPricing([...onboardingPricing, { label: "", min: "", max: "", unit: "per_job" }])}
                      className="text-xs text-amber-600 hover:text-amber-700"
                    >
                      + {lang === "es" ? "Agregar otro" : "Add another"}
                    </button>
                    <p className="text-xs text-gray-400">
                      {lang === "es"
                        ? "Puedes agregar más en Configuración → Precios."
                        : "You can always add more in Settings → Pricing."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Optional: Daily Report Preference ── */}
            <div className="mt-6 rounded-xl border border-gray-100 bg-white p-5">
              <p className="mb-2 text-sm font-semibold text-gray-900">
                {lang === "es" ? "Informe Diario" : "Daily Report"}
              </p>
              <p className="mb-3 text-xs text-gray-500">
                {lang === "es"
                  ? `${rName} te enviará un resumen diario cada noche con tus llamadas, nuevos clientes potenciales y lo que necesita tu atención.`
                  : `${rName} will send you a daily report every evening with your calls, new leads, and what needs your attention.`}
              </p>
              <div className="flex gap-2 mb-3">
                {[
                  { value: "sms", label: lang === "es" ? "Mensaje de texto" : "Text Message" },
                  { value: "email", label: "Email" },
                  { value: "both", label: lang === "es" ? "Ambos" : "Both" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDigestPref(opt.value)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                    style={
                      digestPref === opt.value
                        ? { background: "var(--db-warning-bg)", borderColor: "var(--db-warning)", color: "var(--db-warning, #92400e)" }
                        : { background: "var(--db-card, #fff)", borderColor: "var(--db-border, #e5e7eb)", color: "var(--db-text-muted, #6b7280)" }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {lang === "es"
                  ? "Puedes cambiar esto en cualquier momento en Configuración."
                  : "You can change this anytime in Settings."}
              </p>
            </div>

            {errors.save && <ErrorBanner message={errors.save} />}
            <StepNav onBack={goBack} onNext={goNext} saving={saving} t={t} showSkip onSkip={() => skipStep(4)} />
          </div>
        )}

        {/* ── STEP 5: Test Call (The Aha Moment) ── */}
        {step === 5 && (
          <div className="flex flex-1 flex-col">
            <h1 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">
              {t.step5Title} {rName}
            </h1>
            <p className="mb-6 text-sm text-gray-500">{t.step5Sub}</p>

            {twilioNumber && (
              <div className="mb-6 text-center">
                <p className="mb-1 text-xs text-gray-400">{t.callNow}</p>
                <a href={`tel:${twilioNumber}`} className="inline-block rounded-xl border-2 border-amber-200 bg-amber-50 px-8 py-4 text-2xl font-bold text-gray-900 transition-all hover:border-amber-300 hover:bg-amber-100 sm:text-3xl">
                  {formatPhone(twilioNumber)}
                </a>
                <p className="mt-1 text-xs text-amber-600 sm:hidden">{t.tapToCall}</p>
              </div>
            )}

            <div className="flex-1">
              {testCallStatus === "waiting" && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-8">
                  <div className="relative mb-4"><div className="h-4 w-4 rounded-full bg-amber-400 animate-pulse" /><div className="absolute inset-0 h-4 w-4 rounded-full bg-amber-400 animate-ping" /></div>
                  <p className="text-sm text-gray-500">{t.waiting}</p>
                </div>
              )}
              {testCallStatus === "connected" && (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-green-200 bg-green-50 p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  </div>
                  <p className="font-medium text-green-700">{t.connected}</p>
                </div>
              )}
              {testCallStatus === "complete" && (
                <div className="space-y-4">
                  {/* Transcript */}
                  {testCall?.transcript && testCall.transcript.length > 0 && (
                    <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                        <p className="font-medium text-green-700">{t.callComplete}</p>
                      </div>
                      {testCall.duration != null && <p className="mb-2 text-sm text-gray-600">{t.duration}: {testCall.duration} {t.seconds}</p>}
                      <div className="rounded-lg border border-green-100 bg-white p-3 max-h-48 overflow-y-auto space-y-2">
                        {testCall.transcript.map((turn, i) => (
                          <div key={i} className={`text-sm ${turn.speaker === "ai" ? "text-amber-700" : "text-gray-700"}`}>
                            <span className="font-medium">{turn.speaker === "ai" ? rName : (lang === "es" ? "Tú" : "You")}:</span> {turn.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hire Report */}
                  <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-600">{t.hireReport}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                        <p className="text-sm text-gray-700"><strong>{rName}</strong> {t.answeredAs} <strong>{bizName || "your business"}</strong></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                        <p className="text-sm text-gray-700">{t.language}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                        <p className="text-sm text-gray-700">{t.personality}: <span className="capitalize">{personalityPreset}</span></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                        <p className="text-sm text-gray-700">{t.knowsYourBusiness}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <StepNav onBack={goBack}
              onNext={async () => { await saveProgress(6); setStep(6); }}
              saving={saving} t={t}
              nextDisabled={testCallStatus !== "complete"}
              showSkip onSkip={() => skipStep(5)}
              skipLabel={t.skipTest} skipNudge={t.skipNudge} />
          </div>
        )}

        {/* ── STEP 6: THE PAYWALL ── */}
        {step === 6 && (
          <div className="flex flex-1 flex-col items-center text-center">
            {/* Hero */}
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C59A27" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <h1 className="mb-1 text-2xl font-bold text-gray-900 sm:text-3xl">
              {t.step6Title} {rName} {t.step6TitleSuffix}
            </h1>
            <p className="mb-6 text-gray-500">
              {rName} {t.step6Sub} {bizName || (lang === "es" ? "tu negocio" : "your business")}.
            </p>

            {/* ROI card */}
            <div className="mb-6 w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 text-left">
              <p className="text-sm text-gray-600 mb-2">
                {tradeLabel} {t.missedCallsStat}.
              </p>
              <p className="text-lg font-bold text-red-600 mb-1">
                ${monthlyLoss.toLocaleString()} {t.lostRevenue}
              </p>
              <p className="text-sm text-gray-600">
                {rName} {t.costsOnly} <span className="font-bold text-green-600">{roi}:1 {t.roiReturn}</span>.
              </p>
            </div>

            {/* Plan toggle */}
            <div className="mb-4 inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
              <button onClick={() => setPlanToggle("monthly")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${planToggle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                {t.monthlyLabel}
              </button>
              <button onClick={() => setPlanToggle("annual")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${planToggle === "annual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                {t.annualLabel}
              </button>
            </div>

            {/* Price display */}
            <div className="mb-6">
              {planToggle === "monthly" ? (
                <div>
                  <span className="text-4xl font-bold text-gray-900">{t.monthlyPrice}</span>
                  <span className="text-gray-500">{t.monthlyPer}</span>
                </div>
              ) : (
                <div>
                  <span className="text-4xl font-bold text-gray-900">{t.annualPrice}</span>
                  <span className="text-gray-500">{t.annualPer}</span>
                  <p className="text-sm text-gray-400 mt-0.5">{t.annualTotal}</p>
                  <span className="inline-block mt-1 rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700">{t.annualSave}</span>
                </div>
              )}
            </div>

            {/* CTA */}
            <button onClick={handleCheckout} disabled={checkoutLoading}
              className="db-btn w-full max-w-sm rounded-lg px-8 py-3.5 text-base font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
              data-variant="primary">
              {checkoutLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {t.saving}
                </span>
              ) : `${t.hireCta} ${rName} →`}
            </button>

            {errors.checkout && <ErrorBanner message={errors.checkout} />}

            {/* Trust signals */}
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                {t.guarantee}
              </span>
              <span>{t.cancelAnytime}</span>
              <span>{t.liveIn24}</span>
            </div>

            {/* Call CTA */}
            {twilioNumber && (
              <p className="mt-4 text-sm text-gray-400">
                {t.orCall} <a href={`tel:${twilioNumber}`} className="font-medium text-amber-600 underline">{formatPhone(twilioNumber)}</a>
              </p>
            )}

            <div className="mt-6">
              <button onClick={goBack} className="text-sm text-gray-400 underline hover:text-gray-600">{t.back}</button>
            </div>
          </div>
        )}

        {/* ── STEP 7: Payment (transition step) ── */}
        {step === 7 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            {paymentDone ? (
              <>
                <div className="mb-4 text-4xl">&#10003;</div>
                <h1 className="mb-2 text-2xl font-bold text-gray-900">{t.paymentComplete}</h1>
                <StepNav onBack={goBack} onNext={async () => { await saveProgress(8); setStep(8); }} saving={false} t={t} />
              </>
            ) : (
              <>
                <CaptaSpinner size={32} className="mb-4" />
                <p className="text-gray-500">{t.redirectingToCheckout}</p>
              </>
            )}
          </div>
        )}

        {/* ── STEP 8: Phone Setup + Welcome ── */}
        {step === 8 && !showConfetti && (
          <div>
            <h1 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">{t.step8Title}</h1>
            <p className="mb-6 text-sm text-gray-500">{t.step8Sub}</p>

            {twilioNumber ? (
              <>
                <div className="mb-6 rounded-xl border-2 border-amber-200 bg-amber-50 p-6 text-center">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-amber-600">{t.herNumber}</p>
                  <p className="text-2xl font-bold text-gray-900 sm:text-3xl">{formatPhone(twilioNumber)}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(twilioNumber); }}
                    className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200 transition-colors"
                  >
                    Copy Number
                  </button>
                </div>

                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-gray-700">{t.forwardInstr}</p>
                  <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                    {CARRIER_TABS.map((tab) => (
                      <button key={tab} onClick={() => setCarrierTab(tab)}
                        className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${carrierTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        {tab === "att" ? "AT&T" : tab === "verizon" ? "Verizon" : tab === "tmobile" ? "T-Mobile" : "Other"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4 rounded-lg border border-gray-100 bg-white p-4">
                  <p className="text-sm text-gray-700 font-mono">
                    {(t[`${carrierTab}Instr` as keyof typeof t] as string).replace(/\[NUMBER\]/g, formatPhone(twilioNumber))}
                  </p>
                </div>

                <p className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">{t.conditionalTip}</p>

                <label className="mb-2 flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={forwardingDone} onChange={(e) => setForwardingDone(e.target.checked)} className="h-5 w-5 accent-amber-500" />
                  <span className="text-sm font-medium text-gray-700">{t.forwardingDone}</span>
                </label>

                {forwardingDone && (
                  <>
                    <p className="mb-4 text-xs text-gray-500 italic">{t.testVerify}</p>

                    {/* Test Your Setup */}
                    <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                      <p className="mb-2 text-sm font-medium text-gray-700">{t.testSetup}</p>
                      <p className="mb-3 text-xs text-gray-500">{t.testSetupDesc}</p>
                      <button
                        onClick={handleTestForwarding}
                        disabled={testForwardingStatus === "calling"}
                        className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                      >
                        {testForwardingStatus === "calling" ? t.testCalling : t.testSetup}
                      </button>
                      {testForwardingStatus === "success" && (
                        <p className="mt-2 text-xs font-medium text-green-600">{t.testSuccess}</p>
                      )}
                      {testForwardingStatus === "error" && (
                        <p className="mt-2 text-xs font-medium text-red-500">{t.testError}</p>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
                <p className="text-sm text-gray-500">{lang === "es" ? "Tu numero esta siendo configurado." : "Your phone number is being set up."}</p>
              </div>
            )}

            {errors.activate && <ErrorBanner message={errors.activate} />}

            <div className="mt-8 flex items-center justify-between">
              <button onClick={goBack} className="db-btn rounded-lg px-5 py-2.5 text-sm font-medium transition-colors" data-variant="secondary">{t.back}</button>
              <button
                onClick={handleActivate}
                disabled={activating}
                className="db-btn rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                data-variant="primary"
              >
                {activating ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    {t.activating}
                  </span>
                ) : t.activateCta}
              </button>
            </div>
          </div>
        )}

        {/* Confetti / Celebration */}
        {step === 8 && showConfetti && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            {/* Confetti-style animation */}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes celebrationPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
              }
              @keyframes confettiFloat {
                0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
              }
              @keyframes onb-shimmer {
                0% { background-position: -200% center; }
                100% { background-position: 200% center; }
              }
              @keyframes onb-fadeInUp {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
              }
              .celebration-card {
                animation: celebrationPulse 3s ease-in-out infinite, onb-fadeInUp 0.6s ease-out;
              }
              .celebration-title {
                animation: onb-fadeInUp 0.6s ease-out 0.2s both;
              }
              .celebration-sub {
                animation: onb-fadeInUp 0.6s ease-out 0.4s both;
              }
              .celebration-actions {
                animation: onb-fadeInUp 0.6s ease-out 0.6s both;
              }
              .gold-shimmer {
                background: linear-gradient(90deg, #C59A27, #F0D78C, #D4A843, #F0D78C, #C59A27);
                background-size: 200% auto;
                animation: onb-shimmer 3s linear infinite;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
              }
              .confetti-dot {
                position: fixed;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                pointer-events: none;
                z-index: 50;
              }
            ` }} />

            {/* Confetti particles */}
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="confetti-dot"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-${Math.random() * 20}px`,
                  background: ["#D4A843", "#C59A27", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6"][i % 6],
                  width: `${4 + Math.random() * 8}px`,
                  height: `${4 + Math.random() * 8}px`,
                  borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                  animation: `confettiFloat ${2 + Math.random() * 3}s ease-out ${Math.random() * 2}s forwards`,
                }}
              />
            ))}

            <div className="mb-6 text-6xl" style={{ animation: "fadeInUp 0.4s ease-out" }}>&#127881;</div>

            <h1 className="celebration-title mb-2 text-3xl font-extrabold sm:text-4xl">
              <span className="gold-shimmer">{rName} {t.isLive}</span>
            </h1>
            <p className="celebration-sub mb-8 text-lg text-gray-500">
              {t.celebrationSub}
            </p>

            <div className="celebration-card mb-8 w-full max-w-sm overflow-hidden rounded-2xl shadow-xl" style={{ border: "2px solid var(--db-accent, #D4A843)" }}>
              <div style={{ background: "linear-gradient(135deg, #1B2A4A, #243656)", padding: "32px 24px", textAlign: "center" }}>
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, #D4A843, #F0D78C)" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-white">{rName}</p>
                <p className="mt-1 text-sm capitalize" style={{ color: "var(--db-accent, #D4A843)" }}>{personalityPreset} {lang === "es" ? "personalidad" : "personality"}</p>
                {twilioNumber && <p className="mt-3 text-sm font-mono text-gray-300">{formatPhone(twilioNumber)}</p>}
                <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-green-400" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 8px rgba(16,185,129,0.6)", animation: "celebrationPulse 2s ease-in-out infinite" }} />
                  {lang === "es" ? "EN LINEA" : "LIVE"}
                </div>
              </div>
              <div style={{ background: "var(--db-bg, #f8f9fa)", padding: "16px 24px" }}>
                <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span style={{ color: "var(--db-success, #10b981)" }}>&#10003;</span> {lang === "es" ? "24/7" : "24/7"}
                  </span>
                  <span className="flex items-center gap-1">
                    <span style={{ color: "var(--db-success, #10b981)" }}>&#10003;</span> {lang === "es" ? "Bilingue" : "Bilingual"}
                  </span>
                  <span className="flex items-center gap-1">
                    <span style={{ color: "var(--db-success, #10b981)" }}>&#10003;</span> {lang === "es" ? "Agendamiento" : "Booking"}
                  </span>
                </div>
              </div>
            </div>

            <div className="celebration-actions flex flex-col gap-3 sm:flex-row">
              <button onClick={() => router.push("/dashboard")}
                className="rounded-lg px-8 py-3 text-sm font-bold text-white transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, var(--db-accent, #C59A27), #D4A82E)", boxShadow: "0 4px 14px rgba(212,168,67,0.4)" }}>
                {t.goToDashboard}
              </button>
              <button onClick={() => router.push("/dashboard/settings")}
                className="rounded-lg border-2 border-amber-300 bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                {t.trainHer}
              </button>
              <button onClick={() => router.push("/dashboard/calls")}
                className="rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                {t.viewCalls}
              </button>
            </div>

            <p className="mt-8 text-xs text-gray-400">{t.redirecting}</p>
          </div>
        )}
      </main>

      {/* Form inputs use db-input / db-select from globals.css */}
    </div>
  );
}

// ── Sub-components ──

function Field({ label, hint, error, required, children }: { label: string; hint?: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="db-label mb-1">{label}{required && <span className="ml-0.5" style={{ color: "var(--db-danger)" }}>*</span>}</label>
      {children}
      {hint && !error && <p className="mt-0.5 text-xs" style={{ color: "var(--db-text-muted)" }}>{hint}</p>}
      {error && <p className="mt-0.5 text-xs" style={{ color: "var(--db-danger)" }}>{error}</p>}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return <div role="alert" aria-live="assertive" className="mt-4 rounded-lg px-4 py-3 text-sm" style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}>{message}</div>;
}

function StepNav({ onBack, onNext, saving, t, showBack = true, nextDisabled = false, nextLabel, showSkip = false, onSkip, skipLabel, skipNudge }: {
  onBack: () => void; onNext: () => void; saving: boolean; t: typeof T.en; showBack?: boolean; nextDisabled?: boolean;
  nextLabel?: string; showSkip?: boolean; onSkip?: () => void; skipLabel?: string; skipNudge?: string;
}) {
  return (
    <div className="mt-8 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        {showBack ? (
          <button onClick={onBack} className="db-btn rounded-lg px-5 py-2.5 text-sm font-medium transition-colors" data-variant="secondary">{t.back}</button>
        ) : <div />}
        <button onClick={onNext} disabled={saving || nextDisabled}
          className="db-btn rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          data-variant="primary">
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              {t.saving}
            </span>
          ) : nextLabel || t.next}
        </button>
      </div>
      {showSkip && onSkip && (
        <div className="text-center">
          <button onClick={onSkip} className="text-sm text-gray-400 underline hover:text-gray-600">{skipLabel || "Skip"}</button>
          {skipNudge && <p className="mt-1 text-xs text-gray-400 italic">{skipNudge}</p>}
        </div>
      )}
    </div>
  );
}
