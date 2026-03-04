"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { trackCompleteRegistration, trackPurchase } from "@/lib/tracking";

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
    welcome: "Hire Your Receptionist",
    welcomeSub: "You're about to bring someone onto your team who never misses a call.",
    bullet1: "We'll set up your business profile, services, and hours",
    bullet2: "You'll name her, pick her personality, and customize her greeting",
    bullet3: "Then interview her with a test call before she starts",
    timeNote: "This takes about 10 minutes. Your changes save automatically.",
    letsGo: "Let's Go",
    // Step 2
    bizInfoTitle: "Business Information",
    bizInfoSub: "Tell us about your business so your receptionist knows how to help your callers.",
    bizName: "Business Name",
    bizAddress: "Business Address / Service Area",
    bizAddressHint: "e.g. San Antonio and surrounding areas",
    bizPhone: "Business Phone",
    bizPhoneHint: "The number your customers see",
    industry: "Industry",
    industryPlaceholder: "Select your industry",
    ownerNameLabel: "Owner Name",
    ownerEmailLabel: "Owner Email",
    ownerPhoneLabel: "Owner Phone",
    ownerPhoneHint: "Escalations and notifications go here",
    // Step 3
    servicesTitle: "Services You Offer",
    servicesSub: "Select the services you offer, or add your own. Your receptionist will mention these to callers.",
    addService: "Add",
    addServicePlaceholder: "Add a custom service...",
    // Step 4
    hoursTitle: "Business Hours",
    hoursSub: "When is your business open? Outside these hours, your receptionist will take messages and handle emergencies.",
    quickSet: "Quick set:",
    monFri85: "Mon–Fri 8–5",
    monSat86: "Mon–Sat 8–6",
    custom: "Custom",
    closed: "Closed",
    // Step 5
    greetingTitle: "Meet Your Receptionist",
    greetingSub: "Name her, pick her personality, and customize her greeting.",
    greetingEn: "English Greeting",
    greetingEs: "Spanish Greeting",
    preview: "Preview",
    previewLabel: "When someone calls, she will say:",
    hearMaria: "Hear Her",
    comingSoon: "Coming soon",
    charCount: "characters",
    nameLabel: "Her Name",
    namePlaceholder: "Maria",
    nameCustom: "Custom Name",
    nameRecommended: "Recommended",
    personalityLabel: "Her Personality",
    personalityProfessional: "Professional",
    personalityProfessionalDesc: "Polished and efficient. Gets straight to business.",
    personalityProfessionalSample: "Thank you for calling. How may I assist you today?",
    personalityFriendly: "Friendly",
    personalityFriendlyDesc: "Warm and approachable. Makes every caller feel welcome.",
    personalityFriendlySample: "Hi there! Thanks for calling. What can I help you with today?",
    personalityWarm: "Warm & Caring",
    personalityWarmDesc: "Extra empathetic. Perfect for sensitive clients.",
    personalityWarmSample: "Hello, thank you so much for calling. I'm here to help — what's going on?",
    // Step 6 - Teach Her
    teachTitle: "Teach Her Your Business",
    teachSub: "Help your receptionist answer common questions and stay on-brand.",
    faqLabel: "Common Questions",
    faqSub: "When callers ask these questions, she'll use your answers.",
    faqHoursQ: "What are your hours?",
    faqHoursPlaceholder: "We're open Monday through Friday, 8 AM to 5 PM...",
    faqAreaQ: "What's your service area?",
    faqAreaPlaceholder: "We serve San Antonio and all surrounding areas...",
    faqEstimatesQ: "Do you offer free estimates?",
    faqEstimatesPlaceholder: "Yes, we offer free estimates for all services...",
    faqEmergencyQ: "What's your emergency number?",
    faqEmergencyPlaceholder: "For emergencies, call us at...",
    faqServicesQ: "What services do you offer?",
    faqServicesPlaceholder: "We offer a full range of services including...",
    offLimitsLabel: "Off-Limits Topics",
    offLimitsSub: "She will politely redirect if callers ask about these.",
    offLimitsPricing: "Specific pricing or quotes",
    offLimitsCompetitors: "Competitor comparisons",
    offLimitsTiming: "Exact timing promises",
    phrasesLabel: "Preferred Phrases",
    phrasesSub: "Words or phrases she should naturally weave into conversations.",
    phrasesPlaceholder: "e.g. \"We offer a satisfaction guarantee\"\n\"Same-day service available\"\n\"Military and senior discounts\"",
    // Step 7
    phoneTitle: "Connect Your Phone",
    phoneSub: "Forward your business calls to your receptionist's number. She'll answer them for you.",
    mariasNumber: "Her Number",
    forwardingInstructions: "Call Forwarding Instructions",
    attTab: "AT&T",
    verizonTab: "Verizon",
    tmobileTab: "T-Mobile",
    otherTab: "Other / Landline",
    attInstr: "Dial *21*[NUMBER]# from your business phone",
    verizonInstr: "Dial *72 then [NUMBER]",
    tmobileInstr: "Dial **21*[NUMBER]#",
    otherInstr: "Contact your phone provider and ask them to forward unanswered calls to [NUMBER]",
    conditionalNote: "Tip: Ask for 'conditional forwarding' — forwards only when you're busy or don't answer (recommended).",
    forwardingDone: "I've set up call forwarding",
    needHelp: "I need help",
    noNumberYet: "Your phone number is being set up. We'll notify you when it's ready.",
    // Step 7
    testTitle: "Interview Her",
    testSub: "Call now and see how she handles a real conversation.",
    callNow: "Call now:",
    tapToCall: "Tap to call",
    waiting: "Waiting for your call...",
    connected: "Call connected! She's answering...",
    callComplete: "Interview complete! Here's what happened:",
    duration: "Duration",
    seconds: "seconds",
    transcript: "Transcript",
    handledIt: "She nailed it!",
    skipTest: "Skip for now",
    skipNudge: "We recommend interviewing before she goes live — it takes 2 minutes!",
    // Step 8
    doneTitle: "Welcome Aboard!",
    doneSub: "She's ready to answer your next call.",
    goToDashboard: "Go to Dashboard",
    viewCalls: "View Call History",
    trainHer: "Train Her",
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
    welcome: "Contrata a Tu Recepcionista",
    welcomeSub: "Estás a punto de sumar a alguien a tu equipo que nunca pierde una llamada.",
    bullet1: "Configuraremos tu perfil de negocio, servicios y horarios",
    bullet2: "Le pondrás nombre, elegirás su personalidad y personalizarás su saludo",
    bullet3: "Luego la entrevistarás con una llamada de prueba antes de que empiece",
    timeNote: "Esto toma unos 10 minutos. Tus cambios se guardan automáticamente.",
    letsGo: "¡Empezar!",
    bizInfoTitle: "Información del Negocio",
    bizInfoSub: "Cuéntanos sobre tu negocio para que tu recepcionista sepa cómo ayudar a tus llamantes.",
    bizName: "Nombre del Negocio",
    bizAddress: "Dirección / Área de Servicio",
    bizAddressHint: "ej. San Antonio y áreas cercanas",
    bizPhone: "Teléfono del Negocio",
    bizPhoneHint: "El número que ven tus clientes",
    industry: "Industria",
    industryPlaceholder: "Selecciona tu industria",
    ownerNameLabel: "Nombre del Dueño",
    ownerEmailLabel: "Email del Dueño",
    ownerPhoneLabel: "Teléfono del Dueño",
    ownerPhoneHint: "Las escalaciones y notificaciones van aquí",
    servicesTitle: "Servicios que Ofreces",
    servicesSub: "Selecciona los servicios que ofreces o agrega los tuyos. Tu recepcionista los mencionará a los llamantes.",
    addService: "Agregar",
    addServicePlaceholder: "Agregar servicio personalizado...",
    hoursTitle: "Horario de Atención",
    hoursSub: "¿Cuándo está abierto tu negocio? Fuera de horario, tu recepcionista tomará mensajes y manejará emergencias.",
    quickSet: "Configurar rápido:",
    monFri85: "Lun–Vie 8–5",
    monSat86: "Lun–Sáb 8–6",
    custom: "Personalizado",
    closed: "Cerrado",
    greetingTitle: "Conoce a Tu Recepcionista",
    greetingSub: "Ponle nombre, elige su personalidad y personaliza su saludo.",
    greetingEn: "Saludo en Inglés",
    greetingEs: "Saludo en Español",
    preview: "Vista Previa",
    previewLabel: "Cuando alguien llame, ella dirá:",
    hearMaria: "Escúchala",
    comingSoon: "Próximamente",
    charCount: "caracteres",
    nameLabel: "Su Nombre",
    namePlaceholder: "María",
    nameCustom: "Nombre Personalizado",
    nameRecommended: "Recomendado",
    personalityLabel: "Su Personalidad",
    personalityProfessional: "Profesional",
    personalityProfessionalDesc: "Pulida y eficiente. Va directo al grano.",
    personalityProfessionalSample: "Gracias por llamar. ¿En qué le puedo ayudar hoy?",
    personalityFriendly: "Amigable",
    personalityFriendlyDesc: "Cálida y accesible. Hace que todos se sientan bienvenidos.",
    personalityFriendlySample: "¡Hola! Gracias por llamar. ¿En qué le puedo ayudar hoy?",
    personalityWarm: "Cálida y Atenta",
    personalityWarmDesc: "Extra empática. Perfecta para clientes sensibles.",
    personalityWarmSample: "Hola, muchas gracias por llamar. Estoy aquí para ayudarle — ¿qué necesita?",
    teachTitle: "Enséñale Tu Negocio",
    teachSub: "Ayuda a tu recepcionista a responder preguntas comunes y mantenerse fiel a tu marca.",
    faqLabel: "Preguntas Comunes",
    faqSub: "Cuando los llamantes hagan estas preguntas, ella usará tus respuestas.",
    faqHoursQ: "¿Cuál es su horario?",
    faqHoursPlaceholder: "Estamos abiertos de lunes a viernes, de 8 AM a 5 PM...",
    faqAreaQ: "¿Cuál es su área de servicio?",
    faqAreaPlaceholder: "Servimos San Antonio y todas las áreas cercanas...",
    faqEstimatesQ: "¿Ofrecen estimados gratis?",
    faqEstimatesPlaceholder: "Sí, ofrecemos estimados gratis para todos los servicios...",
    faqEmergencyQ: "¿Cuál es su número de emergencia?",
    faqEmergencyPlaceholder: "Para emergencias, llámenos al...",
    faqServicesQ: "¿Qué servicios ofrecen?",
    faqServicesPlaceholder: "Ofrecemos una gama completa de servicios incluyendo...",
    offLimitsLabel: "Temas Prohibidos",
    offLimitsSub: "Ella redirigirá cortésmente si los llamantes preguntan sobre estos.",
    offLimitsPricing: "Precios o cotizaciones específicas",
    offLimitsCompetitors: "Comparaciones con competidores",
    offLimitsTiming: "Promesas de tiempo exactas",
    phrasesLabel: "Frases Preferidas",
    phrasesSub: "Palabras o frases que ella debe usar naturalmente en las conversaciones.",
    phrasesPlaceholder: "ej. \"Ofrecemos garantía de satisfacción\"\n\"Servicio el mismo día disponible\"\n\"Descuentos militares y para personas mayores\"",
    phoneTitle: "Conecta Tu Teléfono",
    phoneSub: "Redirige las llamadas de tu negocio al número de tu recepcionista. Ella las contestará por ti.",
    mariasNumber: "Su Número",
    forwardingInstructions: "Instrucciones de Desvío de Llamadas",
    attTab: "AT&T",
    verizonTab: "Verizon",
    tmobileTab: "T-Mobile",
    otherTab: "Otro / Fijo",
    attInstr: "Marca *21*[NUMBER]# desde tu teléfono de negocio",
    verizonInstr: "Marca *72 y luego [NUMBER]",
    tmobileInstr: "Marca **21*[NUMBER]#",
    otherInstr: "Contacta a tu proveedor telefónico y pide que desvíen las llamadas no contestadas a [NUMBER]",
    conditionalNote: "Tip: Pide 'desvío condicional' — solo desvía cuando estés ocupado o no contestes (recomendado).",
    forwardingDone: "Ya configuré el desvío de llamadas",
    needHelp: "Necesito ayuda",
    noNumberYet: "Tu número está siendo configurado. Te notificaremos cuando esté listo.",
    testTitle: "Entrevístala",
    testSub: "Llama ahora y mira cómo maneja una conversación real.",
    callNow: "Llama ahora:",
    tapToCall: "Toca para llamar",
    waiting: "Esperando tu llamada...",
    connected: "¡Llamada conectada! Ella está contestando...",
    callComplete: "¡Entrevista completa! Esto es lo que pasó:",
    duration: "Duración",
    seconds: "segundos",
    transcript: "Transcripción",
    handledIt: "¡Lo clavó!",
    skipTest: "Omitir por ahora",
    skipNudge: "Recomendamos entrevistarla antes de activar — ¡toma solo 2 minutos!",
    doneTitle: "¡Bienvenida a Bordo!",
    doneSub: "Está lista para contestar tu próxima llamada.",
    goToDashboard: "Ir al Panel",
    viewCalls: "Ver Historial de Llamadas",
    trainHer: "Entrénala",
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

const SERVICE_TEMPLATES: Record<string, { en: string[]; es: string[] }> = {
  hvac: {
    en: ["AC Repair", "AC Installation", "Heating Repair", "Heating Installation", "Duct Cleaning", "Maintenance Plans", "Thermostat Installation", "Indoor Air Quality"],
    es: ["Reparación de AC", "Instalación de AC", "Reparación de Calefacción", "Instalación de Calefacción", "Limpieza de Ductos", "Planes de Mantenimiento", "Instalación de Termostato", "Calidad del Aire Interior"],
  },
  plumbing: {
    en: ["Drain Cleaning", "Leak Repair", "Water Heater", "Sewer Line", "Faucet/Fixture", "Garbage Disposal", "Repiping", "Emergency Plumbing"],
    es: ["Limpieza de Drenajes", "Reparación de Fugas", "Calentador de Agua", "Línea de Drenaje", "Grifería/Accesorios", "Triturador de Basura", "Retubería", "Plomería de Emergencia"],
  },
  electrical: {
    en: ["Panel Upgrade", "Outlet/Switch", "Lighting", "Ceiling Fan", "Generator", "EV Charger", "Rewiring", "Troubleshooting"],
    es: ["Actualización de Panel", "Tomacorrientes/Interruptores", "Iluminación", "Ventilador de Techo", "Generador", "Cargador de Vehículo Eléctrico", "Recableado", "Diagnóstico"],
  },
  general_contractor: {
    en: ["Kitchen Remodel", "Bathroom Remodel", "Flooring", "Painting", "Drywall", "Framing", "Roofing", "Concrete"],
    es: ["Remodelación de Cocina", "Remodelación de Baño", "Pisos", "Pintura", "Tablaroca", "Estructura", "Techos", "Concreto"],
  },
  landscaping: {
    en: ["Lawn Mowing", "Tree Trimming", "Irrigation", "Hardscaping", "Garden Design", "Mulching", "Sod Installation", "Pressure Washing"],
    es: ["Corte de Césped", "Poda de Árboles", "Irrigación", "Hardscaping", "Diseño de Jardines", "Mantillo", "Instalación de Césped", "Lavado a Presión"],
  },
  roofing: {
    en: ["Roof Repair", "Roof Replacement", "Leak Detection", "Gutter Install", "Shingle Repair", "Flat Roof", "Roof Inspection", "Storm Damage"],
    es: ["Reparación de Techo", "Reemplazo de Techo", "Detección de Fugas", "Instalación de Canaletas", "Reparación de Tejas", "Techo Plano", "Inspección de Techo", "Daño por Tormenta"],
  },
};

const INDUSTRIES = [
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "general_contractor", label: "General Contractor" },
  { value: "landscaping", label: "Landscaping" },
  { value: "roofing", label: "Roofing" },
  { value: "other", label: "Other" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS: Record<string, { en: string; es: string }> = {
  Mon: { en: "Monday", es: "Lunes" },
  Tue: { en: "Tuesday", es: "Martes" },
  Wed: { en: "Wednesday", es: "Miércoles" },
  Thu: { en: "Thursday", es: "Jueves" },
  Fri: { en: "Friday", es: "Viernes" },
  Sat: { en: "Saturday", es: "Sábado" },
  Sun: { en: "Sunday", es: "Domingo" },
};

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

const CARRIER_TABS = ["att", "verizon", "tmobile", "other"] as const;

// ── Component ──

export default function OnboardingPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"" | "saving" | "saved">("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 2 - Business Info
  const [bizName, setBizName] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");

  // Step 3 - Services
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState("");

  // Step 3 - Pricing (optional)
  const [showPricing, setShowPricing] = useState(false);
  const [pricingEnabled, setPricingEnabled] = useState(false);
  const [servicePricingData, setServicePricingData] = useState<Record<string, { min: string; max: string; unit: string }>>({});

  // Step 4 - Hours
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed?: boolean }>>({
    Mon: { open: "08:00", close: "17:00" },
    Tue: { open: "08:00", close: "17:00" },
    Wed: { open: "08:00", close: "17:00" },
    Thu: { open: "08:00", close: "17:00" },
    Fri: { open: "08:00", close: "17:00" },
    Sat: { open: "09:00", close: "13:00" },
    Sun: { open: "00:00", close: "00:00", closed: true },
  });

  // Step 5 - Greeting + Receptionist
  const [receptionistName, setReceptionistName] = useState("Maria");
  const [personalityPreset, setPersonalityPreset] = useState("friendly");
  const [greetingEn, setGreetingEn] = useState("");
  const [greetingEsp, setGreetingEsp] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [defaultLang, setDefaultLang] = useState<"en" | "es">("en");
  const [useCustomName, setUseCustomName] = useState(false);

  // Step 6 - Teach Her Your Business
  const [faqAnswers, setFaqAnswers] = useState<Record<string, string>>({});
  const [offLimits, setOffLimits] = useState<Record<string, boolean>>({
    pricing: false,
    competitors: false,
    timing: false,
  });
  const [preferredPhrases, setPreferredPhrases] = useState("");

  // Step 7 - Phone
  const [twilioNumber, setTwilioNumber] = useState("");
  const [carrierTab, setCarrierTab] = useState<typeof CARRIER_TABS[number]>("att");
  const [forwardingDone, setForwardingDone] = useState(false);

  // Step 8 - Test Call
  const [testCallStatus, setTestCallStatus] = useState<"waiting" | "connected" | "complete">("waiting");
  const [testCall, setTestCall] = useState<CallRecord | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialCallCountRef = useRef<number | null>(null);

  // Step 9 - Done
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

        setStep(data.onboardingStep ?? 1);

        const biz = data.businessData;
        if (biz) {
          setBizName(biz.name || "");
          setBizAddress(biz.serviceArea || "");
          setBizPhone(biz.ownerPhone || "");
          setIndustry(biz.type || "");
          setOwnerName(biz.ownerName || "");
          setOwnerEmail(biz.ownerEmail || "");
          setOwnerPhone(biz.ownerPhone || "");
          setServices(biz.services || []);
          if (biz.businessHours && Object.keys(biz.businessHours).length > 0) {
            setHours(biz.businessHours);
          }
          setGreetingEn(biz.greeting || "");
          setGreetingEsp(biz.greetingEs || "");
          setDefaultLang(biz.defaultLanguage || "en");
          setTwilioNumber(biz.twilioNumber || "");
          if (biz.receptionistName) setReceptionistName(biz.receptionistName);
          if (biz.personalityPreset) setPersonalityPreset(biz.personalityPreset);
        }
      } catch {
        // Continue with defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  // ── Load language from localStorage ──
  useEffect(() => {
    const stored = localStorage.getItem("calltide-lang") as Lang | null;
    if (stored === "en" || stored === "es") setLang(stored);
  }, []);

  // ── Track purchase from Stripe redirect ──
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("session_id=")) {
      trackPurchase();
    }
  }, []);

  // ── Cleanup polling on unmount ──
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
    } catch {
      // Non-critical
    }
  }, []);

  // ── Save settings ──
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

    if (step === 2) {
      // Validate step 2
      const errs: Record<string, string> = {};
      if (!bizName.trim()) errs.bizName = t.required;
      if (!bizAddress.trim()) errs.bizAddress = t.required;
      if (!industry) errs.industry = t.required;
      if (!ownerName.trim()) errs.ownerName = t.required;
      if (!ownerEmail.trim()) errs.ownerEmail = t.required;
      if (!ownerPhone.trim()) errs.ownerPhone = t.required;
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }

      const ok = await saveSettings({
        name: bizName.trim(),
        type: industry,
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        ownerPhone: ownerPhone.replace(/\D/g, "").replace(/^(\d{10})$/, "1$1"),
        businessHours: hours,
        services,
        defaultLanguage: defaultLang,
        serviceArea: bizAddress.trim(),
      });
      if (!ok) return;
    }

    if (step === 3) {
      const ok = await saveSettings({
        name: bizName.trim(),
        type: industry,
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        ownerPhone: ownerPhone.replace(/\D/g, "").replace(/^(\d{10})$/, "1$1"),
        businessHours: hours,
        services,
        defaultLanguage: defaultLang,
        serviceArea: bizAddress.trim(),
      });
      if (!ok) return;

      // Save pricing data if any was entered
      if (pricingEnabled) {
        try {
          await fetch("/api/dashboard/pricing/toggle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enabled: true }),
          });
          for (const [serviceName, pricing] of Object.entries(servicePricingData)) {
            if (pricing.min || pricing.max) {
              await fetch("/api/dashboard/pricing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  serviceName,
                  priceMin: pricing.min ? parseFloat(pricing.min) : null,
                  priceMax: pricing.max ? parseFloat(pricing.max) : null,
                  unit: pricing.unit || "per_job",
                }),
              });
            }
          }
        } catch {
          // Non-critical — pricing can be configured later in settings
        }
      }
    }

    if (step === 4) {
      const ok = await saveSettings({
        name: bizName.trim(),
        type: industry,
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        ownerPhone: ownerPhone.replace(/\D/g, "").replace(/^(\d{10})$/, "1$1"),
        businessHours: hours,
        services,
        defaultLanguage: defaultLang,
        serviceArea: bizAddress.trim(),
      });
      if (!ok) return;
    }

    if (step === 5) {
      const ok = await saveSettings({
        name: bizName.trim(),
        type: industry,
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        ownerPhone: ownerPhone.replace(/\D/g, "").replace(/^(\d{10})$/, "1$1"),
        businessHours: hours,
        services,
        greeting: greetingEn || undefined,
        greetingEs: greetingEsp || undefined,
        defaultLanguage: defaultLang,
        serviceArea: bizAddress.trim(),
        receptionistName,
        personalityPreset,
      });
      if (!ok) return;
    }

    if (step === 6) {
      // Save FAQ answers, off-limits, and preferred phrases as custom responses
      try {
        // Save FAQ answers
        for (const [key, answer] of Object.entries(faqAnswers)) {
          if (!answer.trim()) continue;
          const questionMap: Record<string, string> = {
            hours: t.faqHoursQ,
            area: t.faqAreaQ,
            estimates: t.faqEstimatesQ,
            emergency: t.faqEmergencyQ,
            services: t.faqServicesQ,
          };
          await fetch("/api/receptionist/responses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: "faq",
              triggerText: questionMap[key] || key,
              responseText: answer.trim(),
            }),
          });
        }

        // Save off-limits topics
        const offLimitsMap: Record<string, { trigger: string; redirect: string }> = {
          pricing: {
            trigger: lang === "es" ? "Precios o cotizaciones específicas" : "Specific pricing or quotes",
            redirect: lang === "es" ? `${ownerName || "El dueño"} puede darle una cotización detallada.` : `${ownerName || "The owner"} can provide a detailed quote.`,
          },
          competitors: {
            trigger: lang === "es" ? "Comparaciones con competidores" : "Competitor comparisons",
            redirect: lang === "es" ? "Me enfoco en cómo podemos ayudarle a usted." : "I focus on how we can help you.",
          },
          timing: {
            trigger: lang === "es" ? "Promesas de tiempo exactas" : "Exact timing promises",
            redirect: lang === "es" ? `${ownerName || "El dueño"} puede confirmar los tiempos específicos.` : `${ownerName || "The owner"} can confirm specific timing.`,
          },
        };
        for (const [key, checked] of Object.entries(offLimits)) {
          if (!checked) continue;
          const item = offLimitsMap[key];
          if (!item) continue;
          await fetch("/api/receptionist/responses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: "off_limits",
              triggerText: item.trigger,
              responseText: item.redirect,
            }),
          });
        }

        // Save preferred phrases
        const phrases = preferredPhrases
          .split("\n")
          .map((p) => p.replace(/^["']|["']$/g, "").trim())
          .filter(Boolean);
        for (const phrase of phrases.slice(0, 10)) {
          await fetch("/api/receptionist/responses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category: "phrase",
              triggerText: phrase,
            }),
          });
        }
      } catch {
        // Non-critical — can be configured later in settings
      }
    }

    await saveProgress(nextStep);
    setStep(nextStep);
  }, [step, bizName, bizAddress, industry, ownerName, ownerEmail, ownerPhone, hours, services, greetingEn, greetingEsp, defaultLang, receptionistName, personalityPreset, faqAnswers, offLimits, preferredPhrases, lang, saveSettings, saveProgress, t]);

  const goBack = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  const skipStep = useCallback(async (stepNum: number) => {
    await saveProgress(stepNum + 1, stepNum);
    setStep(stepNum + 1);
  }, [saveProgress]);

  // ── Step 7: Poll for test call ──
  const startPolling = useCallback(() => {
    if (pollRef.current) return;

    // First, get the current call count so we can detect new calls
    fetch("/api/dashboard/calls?limit=1")
      .then((r) => r.json())
      .then((data) => {
        initialCallCountRef.current = data.total ?? 0;
      })
      .catch(() => {
        initialCallCountRef.current = 0;
      });

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/dashboard/calls?limit=1");
        if (!res.ok) return;
        const data = await res.json();

        if (data.total > (initialCallCountRef.current ?? 0) && data.calls?.length > 0) {
          const latestCall = data.calls[0];
          if (latestCall.status === "in_progress") {
            setTestCallStatus("connected");
          } else if (latestCall.status === "completed") {
            setTestCallStatus("complete");
            setTestCall(latestCall);
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          }
        }
      } catch {
        // Continue polling
      }
    }, 3000);
  }, []);

  useEffect(() => {
    if (step === 8) {
      startPolling();
    }
    return () => {
      if (step !== 8 && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [step, startPolling]);

  // ── Step 9: Auto-redirect ──
  useEffect(() => {
    if (step === 9) {
      trackCompleteRegistration();
      redirectTimerRef.current = setTimeout(() => {
        router.push("/dashboard");
      }, 5000);
    }
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, [step, router]);

  // ── Industry change → update services ──
  const handleIndustryChange = useCallback((value: string) => {
    setIndustry(value);
    const template = SERVICE_TEMPLATES[value];
    if (template) {
      setServices(template.en);
    } else {
      setServices([]);
    }
  }, []);

  // ── Quick-set hours ──
  const quickSetHours = useCallback((preset: "mf85" | "ms86") => {
    const base = {
      Mon: { open: "08:00", close: preset === "ms86" ? "18:00" : "17:00" },
      Tue: { open: "08:00", close: preset === "ms86" ? "18:00" : "17:00" },
      Wed: { open: "08:00", close: preset === "ms86" ? "18:00" : "17:00" },
      Thu: { open: "08:00", close: preset === "ms86" ? "18:00" : "17:00" },
      Fri: { open: "08:00", close: preset === "ms86" ? "18:00" : "17:00" },
      Sat: preset === "ms86" ? { open: "08:00", close: "18:00" } : { open: "00:00", close: "00:00", closed: true },
      Sun: { open: "00:00", close: "00:00", closed: true },
    };
    setHours(base);
  }, []);

  const toggleLang = useCallback(() => {
    const next = lang === "en" ? "es" : "en";
    setLang(next);
    localStorage.setItem("calltide-lang", next);
  }, [lang]);

  const formatPhone = (num: string) => {
    const digits = num.replace(/\D/g, "");
    if (digits.length === 11 && digits[0] === "1") {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return num;
  };

  const defaultGreetingEn = `Thank you for calling ${bizName || "your business"}, this is ${receptionistName}. How can I help you today?`;
  const defaultGreetingEs = `Gracias por llamar a ${bizName || "su negocio"}, habla ${receptionistName}. ¿En qué puedo ayudarle?`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#fff" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-amber-500" />
          <span className="text-sm text-gray-500">{lang === "es" ? "Cargando..." : "Loading..."}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#FBFBFC" }}>
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#111827" />
              <path d="M8 16c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8" stroke="#C59A27" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="16" cy="16" r="3" fill="#C59A27" />
            </svg>
            <span className="text-lg font-bold text-gray-900">Calltide</span>
          </div>
          <div className="flex items-center gap-3">
            {bizName && (
              <span className="hidden text-sm text-gray-500 sm:inline">{bizName}</span>
            )}
            <button
              onClick={toggleLang}
              className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              {t.langToggle}
            </button>
          </div>
        </div>
      </header>

      {/* ── Progress Bar ── */}
      <div className="border-b border-gray-100 bg-white px-4 py-2 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span>{t.step} {step} {t.of} 9</span>
            {saveStatus === "saving" && <span className="text-amber-500">{t.saving}</span>}
            {saveStatus === "saved" && <span className="text-green-500">{t.saved}</span>}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 9 }, (_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                style={{
                  background: i < step ? "#C59A27" : i === step - 1 ? "#C59A27" : "#E5E7EB",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Step Content ── */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">

        {/* ── STEP 1: Welcome ── */}
        {step === 1 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C59A27" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">{t.welcome}</h1>
            <p className="mb-8 text-lg text-gray-500">{t.welcomeSub}</p>
            <div className="mb-8 w-full max-w-md space-y-3 text-left">
              {[t.bullet1, t.bullet2, t.bullet3].map((b, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 text-xs font-bold text-amber-600">
                    {i + 1}
                  </div>
                  <span className="text-sm text-gray-700">{b}</span>
                </div>
              ))}
            </div>
            <p className="mb-6 text-xs text-gray-400">{t.timeNote}</p>
            <button
              onClick={() => { setStep(2); saveProgress(2); }}
              className="rounded-lg px-8 py-3 text-base font-semibold text-white transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #C59A27, #D4A82E)" }}
            >
              {t.letsGo}
            </button>
          </div>
        )}

        {/* ── STEP 2: Business Info ── */}
        {step === 2 && (
          <div>
            <h1 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">{t.bizInfoTitle}</h1>
            <p className="mb-6 text-sm text-gray-500">{t.bizInfoSub}</p>
            <div className="space-y-4">
              <Field label={t.bizName} error={errors.bizName} required>
                <input
                  type="text"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  className="input-field"
                  placeholder="Garcia Plumbing & HVAC"
                />
              </Field>
              <Field label={t.bizAddress} error={errors.bizAddress} hint={t.bizAddressHint} required>
                <input
                  type="text"
                  value={bizAddress}
                  onChange={(e) => setBizAddress(e.target.value)}
                  className="input-field"
                  placeholder="San Antonio, TX and surrounding areas"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.industry} error={errors.industry} required>
                  <select
                    value={industry}
                    onChange={(e) => handleIndustryChange(e.target.value)}
                    className="input-field"
                  >
                    <option value="">{t.industryPlaceholder}</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind.value} value={ind.value}>{ind.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t.bizPhone} hint={t.bizPhoneHint}>
                  <input
                    type="tel"
                    value={bizPhone}
                    onChange={(e) => setBizPhone(e.target.value)}
                    className="input-field"
                    placeholder="(210) 555-0123"
                  />
                </Field>
              </div>
              <hr className="border-gray-100" />
              <Field label={t.ownerNameLabel} error={errors.ownerName} required>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="input-field"
                  placeholder="Mike Garcia"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.ownerEmailLabel} error={errors.ownerEmail} required>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="input-field"
                    placeholder="mike@garciaplumbing.com"
                  />
                </Field>
                <Field label={t.ownerPhoneLabel} error={errors.ownerPhone} hint={t.ownerPhoneHint} required>
                  <input
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="input-field"
                    placeholder="(210) 555-0124"
                  />
                </Field>
              </div>
            </div>
            {errors.save && <ErrorBanner message={errors.save} />}
            <StepNav onBack={goBack} onNext={goNext} saving={saving} t={t} showBack={false} />
          </div>
        )}

        {/* ── STEP 3: Services ── */}
        {step === 3 && (
          <div>
            <h1 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">{t.servicesTitle}</h1>
            <p className="mb-6 text-sm text-gray-500">{t.servicesSub}</p>

            {/* Service chips */}
            <div className="mb-4 flex flex-wrap gap-2">
              {services.map((svc, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
                >
                  {svc}
                  <button
                    onClick={() => setServices(services.filter((_, j) => j !== i))}
                    className="ml-0.5 text-gray-400 hover:text-red-500"
                    aria-label={`Remove ${svc}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              ))}
              {services.length === 0 && (
                <p className="text-sm text-gray-400 italic">
                  {lang === "es" ? "No hay servicios seleccionados. Agrega los tuyos abajo." : "No services selected. Add yours below."}
                </p>
              )}
            </div>

            {/* Add custom service */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newService.trim() && services.length < 20) {
                    setServices([...services, newService.trim()]);
                    setNewService("");
                  }
                }}
                className="input-field flex-1"
                placeholder={t.addServicePlaceholder}
                maxLength={50}
              />
              <button
                onClick={() => {
                  if (newService.trim() && services.length < 20) {
                    setServices([...services, newService.trim()]);
                    setNewService("");
                  }
                }}
                disabled={!newService.trim() || services.length >= 20}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
              >
                {t.addService}
              </button>
            </div>
            {services.length >= 20 && (
              <p className="mt-1 text-xs text-amber-500">Maximum 20 services</p>
            )}

            {/* Pre-populated suggestions if industry has templates and there are unused ones */}
            {industry && SERVICE_TEMPLATES[industry] && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                  {lang === "es" ? "Sugerencias para tu industria" : "Suggestions for your industry"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_TEMPLATES[industry].en
                    .filter((s) => !services.includes(s))
                    .map((svc) => (
                      <button
                        key={svc}
                        onClick={() => services.length < 20 && setServices([...services, svc])}
                        className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-sm text-gray-500 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                      >
                        + {svc}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* ── Pricing sub-section (optional) ── */}
            <div className="mt-8 rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setShowPricing(!showPricing)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    {lang === "es" ? "Agregar Precios (Opcional)" : "Add Pricing (Optional)"}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lang === "es"
                      ? "Permite que María dé precios aproximados a los llamantes"
                      : "Let María quote ballpark prices to callers"}
                  </p>
                </div>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`transition-transform ${showPricing ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showPricing && (
                <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                  {/* Enable toggle */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setPricingEnabled(!pricingEnabled)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${pricingEnabled ? "bg-amber-500" : "bg-gray-300"}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${pricingEnabled ? "translate-x-5" : ""}`} />
                    </div>
                    <span className="text-sm text-gray-600">
                      {lang === "es" ? "Activar cotizaciones de precios" : "Enable pricing quotes"}
                    </span>
                  </label>

                  {pricingEnabled && services.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-400">
                        {lang === "es"
                          ? "Ingresa rangos de precios para tus servicios. El precio final puede variar."
                          : "Enter price ranges for your services. Final price may vary."}
                      </p>
                      {services.map((svc) => {
                        const pricing = servicePricingData[svc] || { min: "", max: "", unit: "per_job" };
                        return (
                          <div key={svc} className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-gray-700 w-full sm:w-auto sm:min-w-[140px] font-medium">{svc}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm text-gray-400">$</span>
                              <input
                                type="number"
                                min="0"
                                placeholder="Min"
                                value={pricing.min}
                                onChange={(e) => setServicePricingData((prev) => ({
                                  ...prev,
                                  [svc]: { ...prev[svc] || { min: "", max: "", unit: "per_job" }, min: e.target.value },
                                }))}
                                className="input-field w-20 text-sm"
                              />
                              <span className="text-gray-400">—</span>
                              <span className="text-sm text-gray-400">$</span>
                              <input
                                type="number"
                                min="0"
                                placeholder="Max"
                                value={pricing.max}
                                onChange={(e) => setServicePricingData((prev) => ({
                                  ...prev,
                                  [svc]: { ...prev[svc] || { min: "", max: "", unit: "per_job" }, max: e.target.value },
                                }))}
                                className="input-field w-20 text-sm"
                              />
                              <select
                                value={pricing.unit}
                                onChange={(e) => setServicePricingData((prev) => ({
                                  ...prev,
                                  [svc]: { ...prev[svc] || { min: "", max: "", unit: "per_job" }, unit: e.target.value },
                                }))}
                                className="input-field text-xs w-24"
                              >
                                <option value="per_job">{lang === "es" ? "por trabajo" : "per job"}</option>
                                <option value="per_hour">{lang === "es" ? "por hora" : "per hour"}</option>
                                <option value="per_sqft">{lang === "es" ? "por pie²" : "per sq ft"}</option>
                                <option value="per_unit">{lang === "es" ? "por unidad" : "per unit"}</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {pricingEnabled && services.length === 0 && (
                    <p className="text-xs text-gray-400 italic">
                      {lang === "es" ? "Agrega servicios arriba primero" : "Add services above first"}
                    </p>
                  )}
                </div>
              )}
            </div>

            {errors.save && <ErrorBanner message={errors.save} />}
            <StepNav onBack={goBack} onNext={goNext} saving={saving} t={t} />
          </div>
        )}

        {/* ── STEP 4: Business Hours ── */}
        {step === 4 && (
          <div>
            <h1 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">{t.hoursTitle}</h1>
            <p className="mb-4 text-sm text-gray-500">{t.hoursSub}</p>

            {/* Quick-set buttons */}
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="text-xs text-gray-400 self-center mr-1">{t.quickSet}</span>
              <button
                onClick={() => quickSetHours("mf85")}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-amber-50 hover:border-amber-300"
              >
                {t.monFri85}
              </button>
              <button
                onClick={() => quickSetHours("ms86")}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-amber-50 hover:border-amber-300"
              >
                {t.monSat86}
              </button>
            </div>

            {/* Day grid */}
            <div className="space-y-2">
              {DAYS.map((day) => {
                const h = hours[day] || { open: "08:00", close: "17:00" };
                const isClosed = h.closed === true;
                return (
                  <div key={day} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white p-3 sm:gap-4">
                    <span className="w-20 text-sm font-medium text-gray-700 sm:w-24">
                      {DAY_LABELS[day][lang]}
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!isClosed}
                        onChange={() => {
                          setHours({
                            ...hours,
                            [day]: isClosed
                              ? { open: "08:00", close: "17:00" }
                              : { open: "00:00", close: "00:00", closed: true },
                          });
                        }}
                        className="accent-amber-500"
                      />
                      <span className="text-xs text-gray-500 hidden sm:inline">
                        {isClosed ? t.closed : ""}
                      </span>
                    </label>
                    {!isClosed && (
                      <div className="flex flex-1 items-center gap-1 text-sm sm:gap-2">
                        <select
                          value={h.open}
                          onChange={(e) => setHours({ ...hours, [day]: { ...h, open: e.target.value } })}
                          className="rounded border border-gray-200 px-1.5 py-1 text-xs sm:px-2 sm:text-sm"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <span className="text-gray-400">–</span>
                        <select
                          value={h.close}
                          onChange={(e) => setHours({ ...hours, [day]: { ...h, close: e.target.value } })}
                          className="rounded border border-gray-200 px-1.5 py-1 text-xs sm:px-2 sm:text-sm"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {isClosed && (
                      <span className="flex-1 text-xs text-gray-400 italic sm:hidden">{t.closed}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {errors.save && <ErrorBanner message={errors.save} />}
            <StepNav onBack={goBack} onNext={goNext} saving={saving} t={t} />
          </div>
        )}

        {/* ── STEP 5: Meet Your Receptionist ── */}
        {step === 5 && (
          <div>
            <h1 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">{t.greetingTitle}</h1>
            <p className="mb-6 text-sm text-gray-500">{t.greetingSub}</p>

            <div className="space-y-6">
              {/* Name Suggestions */}
              <div>
                <p className="mb-3 text-sm font-medium text-gray-700">{t.nameLabel}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {([
                    { name: "Maria", recommended: true },
                    { name: "Sofia", recommended: false },
                    { name: "Isabella", recommended: false },
                  ] as const).map((opt) => (
                    <button
                      key={opt.name}
                      onClick={() => { setReceptionistName(opt.name); setUseCustomName(false); }}
                      className="relative flex flex-col items-center rounded-xl border-2 p-3 text-center transition-all hover:shadow-md"
                      style={{
                        borderColor: !useCustomName && receptionistName === opt.name ? "#C59A27" : "#E5E7EB",
                        background: !useCustomName && receptionistName === opt.name ? "rgba(197,154,39,0.05)" : "#fff",
                      }}
                    >
                      <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-lg font-bold text-amber-600">
                        {opt.name[0]}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{opt.name}</p>
                      {opt.recommended && (
                        <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-amber-500">{t.nameRecommended}</span>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => { setUseCustomName(true); if (["Maria", "Sofia", "Isabella"].includes(receptionistName)) setReceptionistName(""); }}
                    className="flex flex-col items-center rounded-xl border-2 border-dashed p-3 text-center transition-all hover:shadow-md"
                    style={{
                      borderColor: useCustomName ? "#C59A27" : "#D1D5DB",
                      background: useCustomName ? "rgba(197,154,39,0.05)" : "#fff",
                    }}
                  >
                    <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-400">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{t.nameCustom}</p>
                  </button>
                </div>
                {useCustomName && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={receptionistName}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑüÜ\s]/g, "");
                        if (val.length <= 20) setReceptionistName(val);
                      }}
                      className="input-field"
                      placeholder={t.namePlaceholder}
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Live Preview Bubble */}
              {receptionistName && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-amber-700">
                      {receptionistName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-700">{receptionistName}</p>
                      <p className="mt-0.5 text-sm text-gray-700 italic">
                        &ldquo;{lang === "es"
                          ? `¡Hola! Soy ${receptionistName}. Contestaré sus llamadas.`
                          : `Hi, I'm ${receptionistName}! I'll be answering your phones.`
                        }&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Personality Cards with Sample Greetings */}
              <div>
                <p className="mb-3 text-sm font-medium text-gray-700">{t.personalityLabel}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {([
                    { key: "professional", icon: "briefcase", label: t.personalityProfessional, desc: t.personalityProfessionalDesc, sample: t.personalityProfessionalSample, color: "#3B82F6" },
                    { key: "friendly", icon: "smile", label: t.personalityFriendly, desc: t.personalityFriendlyDesc, sample: t.personalityFriendlySample, color: "#10B981" },
                    { key: "warm", icon: "heart", label: t.personalityWarm, desc: t.personalityWarmDesc, sample: t.personalityWarmSample, color: "#F59E0B" },
                  ] as const).map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setPersonalityPreset(p.key)}
                      className="flex flex-col items-center rounded-xl border-2 p-4 text-center transition-all hover:shadow-md"
                      style={{
                        borderColor: personalityPreset === p.key ? p.color : "#E5E7EB",
                        background: personalityPreset === p.key ? `${p.color}08` : "#fff",
                      }}
                    >
                      <div
                        className="mb-2 flex h-10 w-10 items-center justify-center rounded-full"
                        style={{ background: `${p.color}15` }}
                      >
                        {p.icon === "briefcase" && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
                        )}
                        {p.icon === "smile" && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                        )}
                        {p.icon === "heart" && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{p.label}</p>
                      <p className="mt-1 text-xs text-gray-500">{p.desc}</p>
                      {personalityPreset === p.key && (
                        <p className="mt-2 text-xs text-gray-600 italic border-t border-gray-100 pt-2 w-full">
                          &ldquo;{p.sample}&rdquo;
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Greeting Textareas */}
              <Field label={t.greetingEn}>
                <textarea
                  value={greetingEn}
                  onChange={(e) => setGreetingEn(e.target.value)}
                  className="input-field min-h-[80px] resize-y"
                  placeholder={defaultGreetingEn}
                  maxLength={500}
                  rows={3}
                />
                <div className="mt-1 text-right text-xs text-gray-400">
                  {(greetingEn || "").length}/500 {t.charCount}
                </div>
              </Field>

              <Field label={t.greetingEs}>
                <textarea
                  value={greetingEsp}
                  onChange={(e) => setGreetingEsp(e.target.value)}
                  className="input-field min-h-[80px] resize-y"
                  placeholder={defaultGreetingEs}
                  maxLength={500}
                  rows={3}
                />
                <div className="mt-1 text-right text-xs text-gray-400">
                  {(greetingEsp || "").length}/500 {t.charCount}
                </div>
              </Field>

              {/* Language preference */}
              <div className="rounded-lg border border-gray-100 bg-white p-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  {lang === "es" ? "Idioma preferido" : "Preferred Language"}
                </p>
                <div className="flex gap-3">
                  {(["en", "es"] as const).map((l) => (
                    <label key={l} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="defaultLang"
                        value={l}
                        checked={defaultLang === l}
                        onChange={() => setDefaultLang(l)}
                        className="accent-amber-500"
                      />
                      <span className="text-sm text-gray-700">{l === "en" ? "English" : "Español"}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Full Preview */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  {t.preview}
                </button>
              </div>

              {showPreview && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-600">
                    {t.previewLabel}
                  </p>
                  <p className="text-sm text-gray-800 italic leading-relaxed">
                    &ldquo;{greetingEn || defaultGreetingEn}&rdquo;
                  </p>
                  {(greetingEsp || defaultGreetingEs) && (
                    <p className="mt-2 text-sm text-gray-600 italic leading-relaxed">
                      &ldquo;{greetingEsp || defaultGreetingEs}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>

            {errors.save && <ErrorBanner message={errors.save} />}
            <StepNav onBack={goBack} onNext={goNext} saving={saving} t={t} />
          </div>
        )}

        {/* ── STEP 6: Teach Her Your Business ── */}
        {step === 6 && (
          <div>
            <h1 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">{t.teachTitle}</h1>
            <p className="mb-6 text-sm text-gray-500">{t.teachSub}</p>

            <div className="space-y-8">
              {/* FAQ Builder */}
              <div>
                <p className="mb-1 text-sm font-semibold text-gray-800">{t.faqLabel}</p>
                <p className="mb-4 text-xs text-gray-400">{t.faqSub}</p>
                <div className="space-y-3">
                  {([
                    { key: "hours", q: t.faqHoursQ, placeholder: t.faqHoursPlaceholder },
                    { key: "area", q: t.faqAreaQ, placeholder: t.faqAreaPlaceholder },
                    { key: "estimates", q: t.faqEstimatesQ, placeholder: t.faqEstimatesPlaceholder },
                    { key: "emergency", q: t.faqEmergencyQ, placeholder: t.faqEmergencyPlaceholder },
                    { key: "services", q: t.faqServicesQ, placeholder: t.faqServicesPlaceholder },
                  ] as const).map((faq) => (
                    <div key={faq.key} className="rounded-lg border border-gray-100 bg-white p-3">
                      <p className="mb-1.5 text-sm font-medium text-gray-700">&ldquo;{faq.q}&rdquo;</p>
                      <textarea
                        value={faqAnswers[faq.key] || ""}
                        onChange={(e) => setFaqAnswers((prev) => ({ ...prev, [faq.key]: e.target.value }))}
                        className="input-field min-h-[60px] resize-y"
                        placeholder={faq.placeholder}
                        maxLength={500}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Off-Limits */}
              <div>
                <p className="mb-1 text-sm font-semibold text-gray-800">{t.offLimitsLabel}</p>
                <p className="mb-3 text-xs text-gray-400">{t.offLimitsSub}</p>
                <div className="space-y-2">
                  {([
                    { key: "pricing", label: t.offLimitsPricing },
                    { key: "competitors", label: t.offLimitsCompetitors },
                    { key: "timing", label: t.offLimitsTiming },
                  ] as const).map((item) => (
                    <label key={item.key} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={offLimits[item.key] || false}
                        onChange={(e) => setOffLimits((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                        className="h-4 w-4 accent-amber-500"
                      />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preferred Phrases */}
              <div>
                <p className="mb-1 text-sm font-semibold text-gray-800">{t.phrasesLabel}</p>
                <p className="mb-3 text-xs text-gray-400">{t.phrasesSub}</p>
                <textarea
                  value={preferredPhrases}
                  onChange={(e) => setPreferredPhrases(e.target.value)}
                  className="input-field min-h-[100px] resize-y"
                  placeholder={t.phrasesPlaceholder}
                  maxLength={1000}
                  rows={4}
                />
              </div>
            </div>

            {errors.save && <ErrorBanner message={errors.save} />}
            <StepNav onBack={goBack} onNext={goNext} saving={saving} t={t} showSkip onSkip={() => skipStep(6)} />
          </div>
        )}

        {/* ── STEP 7: Phone Setup ── */}
        {step === 7 && (
          <div>
            <h1 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">{t.phoneTitle}</h1>
            <p className="mb-6 text-sm text-gray-500">{t.phoneSub}</p>

            {twilioNumber ? (
              <>
                {/* Maria's number display */}
                <div className="mb-6 rounded-xl border-2 border-amber-200 bg-amber-50 p-6 text-center">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-amber-600">
                    {t.mariasNumber}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 sm:text-3xl">
                    {formatPhone(twilioNumber)}
                  </p>
                </div>

                {/* Carrier tabs */}
                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-gray-700">{t.forwardingInstructions}</p>
                  <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                    {CARRIER_TABS.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setCarrierTab(tab)}
                        className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                          carrierTab === tab
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {t[`${tab}Tab` as keyof typeof t]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4 rounded-lg border border-gray-100 bg-white p-4">
                  <p className="text-sm text-gray-700 font-mono">
                    {(t[`${carrierTab}Instr` as keyof typeof t] as string).replace(
                      /\[NUMBER\]/g,
                      formatPhone(twilioNumber)
                    )}
                  </p>
                </div>

                <p className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
                  {t.conditionalNote}
                </p>

                <label className="mb-4 flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forwardingDone}
                    onChange={(e) => setForwardingDone(e.target.checked)}
                    className="h-5 w-5 accent-amber-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{t.forwardingDone}</span>
                </label>

                <a
                  href="mailto:support@calltide.app"
                  className="text-sm text-amber-600 underline"
                >
                  {t.needHelp}
                </a>
              </>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" className="mx-auto mb-3">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <p className="text-sm text-gray-500">{t.noNumberYet}</p>
              </div>
            )}

            {errors.save && <ErrorBanner message={errors.save} />}
            <StepNav
              onBack={goBack}
              onNext={async () => {
                await saveProgress(8);
                setStep(8);
              }}
              saving={saving}
              t={t}
              nextDisabled={twilioNumber ? !forwardingDone : false}
              showSkip
              onSkip={() => skipStep(7)}
            />
          </div>
        )}

        {/* ── STEP 8: Test Call ── */}
        {step === 8 && (
          <div className="flex flex-1 flex-col">
            <h1 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">{t.testTitle}</h1>
            <p className="mb-6 text-sm text-gray-500">{t.testSub}</p>

            {twilioNumber && (
              <div className="mb-6 text-center">
                <p className="mb-1 text-xs text-gray-400">{t.callNow}</p>
                <a
                  href={`tel:${twilioNumber}`}
                  className="inline-block rounded-xl border-2 border-amber-200 bg-amber-50 px-8 py-4 text-2xl font-bold text-gray-900 transition-all hover:border-amber-300 hover:bg-amber-100 sm:text-3xl"
                >
                  {formatPhone(twilioNumber)}
                </a>
                <p className="mt-1 text-xs text-amber-600 sm:hidden">{t.tapToCall}</p>
              </div>
            )}

            {/* Status indicator */}
            <div className="flex-1">
              {testCallStatus === "waiting" && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-8">
                  <div className="relative mb-4">
                    <div className="h-4 w-4 rounded-full bg-amber-400 animate-pulse" />
                    <div className="absolute inset-0 h-4 w-4 rounded-full bg-amber-400 animate-ping" />
                  </div>
                  <p className="text-sm text-gray-500">{t.waiting}</p>
                </div>
              )}

              {testCallStatus === "connected" && (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-green-200 bg-green-50 p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <p className="font-medium text-green-700">{t.connected}</p>
                </div>
              )}

              {testCallStatus === "complete" && testCall && (
                <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <p className="font-medium text-green-700">{t.callComplete}</p>
                  </div>
                  {testCall.duration != null && (
                    <p className="mb-2 text-sm text-gray-600">
                      {t.duration}: {testCall.duration} {t.seconds}
                    </p>
                  )}
                  {testCall.transcript && testCall.transcript.length > 0 && (
                    <div className="mt-3 rounded-lg border border-green-100 bg-white p-3">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">{t.transcript}</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {testCall.transcript.map((turn, i) => (
                          <div key={i} className={`text-sm ${turn.speaker === "ai" ? "text-amber-700" : "text-gray-700"}`}>
                            <span className="font-medium">{turn.speaker === "ai" ? receptionistName : lang === "es" ? "Tú" : "You"}:</span>{" "}
                            {turn.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <StepNav
              onBack={goBack}
              onNext={async () => {
                await saveProgress(9);
                setStep(9);
              }}
              saving={saving}
              t={t}
              nextLabel={testCallStatus === "complete" ? t.handledIt : undefined}
              nextDisabled={testCallStatus !== "complete"}
              showSkip
              onSkip={() => skipStep(8)}
              skipLabel={t.skipTest}
              skipNudge={t.skipNudge}
            />
          </div>
        )}

        {/* ── STEP 9: Welcome Aboard! ── */}
        {step === 9 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            {/* Celebration */}
            <div className="mb-6 text-5xl">&#127881;</div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              {lang === "es" ? `¡Bienvenida a Bordo, ${receptionistName}!` : `Welcome Aboard, ${receptionistName}!`}
            </h1>
            <p className="mb-6 text-lg text-gray-500">{t.doneSub}</p>

            {/* Receptionist summary card */}
            <div className="mb-8 w-full max-w-sm rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
              <div className="mb-3 flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-amber-100">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C59A27" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <p className="text-lg font-bold text-gray-900">{receptionistName}</p>
              <p className="text-sm text-gray-500 capitalize">{personalityPreset} {lang === "es" ? "personalidad" : "personality"}</p>
              {twilioNumber && (
                <p className="mt-2 text-sm text-gray-600">{formatPhone(twilioNumber)}</p>
              )}
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                {lang === "es" ? "Lista" : "Ready"}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => router.push("/dashboard")}
                className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #C59A27, #D4A82E)" }}
              >
                {t.goToDashboard}
              </button>
              <button
                onClick={() => router.push("/dashboard/settings")}
                className="rounded-lg border border-amber-300 bg-amber-50 px-6 py-3 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100"
              >
                {lang === "es" ? `Entrenar a ${receptionistName}` : `Train ${receptionistName}`}
              </button>
              <button
                onClick={() => router.push("/dashboard/calls")}
                className="rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {t.viewCalls}
              </button>
            </div>

            <p className="mt-6 text-xs text-gray-400">{t.redirecting}</p>
          </div>
        )}
      </main>

      {/* ── Global Styles ── */}
      <style jsx global>{`
        .input-field {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #E5E7EB;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #111827;
          background: white;
          transition: border-color 0.15s;
          outline: none;
        }
        .input-field:focus {
          border-color: #C59A27;
          box-shadow: 0 0 0 3px rgba(197, 154, 39, 0.1);
        }
        .input-field::placeholder {
          color: #9CA3AF;
        }
        .input-field.error {
          border-color: #EF4444;
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ──

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-0.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  saving,
  t,
  showBack = true,
  nextDisabled = false,
  nextLabel,
  showSkip = false,
  onSkip,
  skipLabel,
  skipNudge,
}: {
  onBack: () => void;
  onNext: () => void;
  saving: boolean;
  t: typeof T.en;
  showBack?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  showSkip?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
  skipNudge?: string;
}) {
  return (
    <div className="mt-8 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        {showBack ? (
          <button
            onClick={onBack}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            {t.back}
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={onNext}
          disabled={saving || nextDisabled}
          className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          style={{ background: "linear-gradient(135deg, #C59A27, #D4A82E)" }}
        >
          {saving ? t.saving : nextLabel || t.next}
        </button>
      </div>
      {showSkip && onSkip && (
        <div className="text-center">
          <button
            onClick={onSkip}
            className="text-sm text-gray-400 underline transition-colors hover:text-gray-600"
          >
            {skipLabel || "Skip"}
          </button>
          {skipNudge && (
            <p className="mt-1 text-xs text-gray-400 italic">{skipNudge}</p>
          )}
        </div>
      )}
    </div>
  );
}
