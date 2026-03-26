"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PHONE, PHONE_TEL } from "@/lib/marketing/translations";
import dynamic from "next/dynamic";
import s from "./setup.module.css";

const Confetti = dynamic(() => import("@/components/confetti"), { ssr: false });
const First24Hours = dynamic(() => import("@/components/first-24-hours"), { ssr: false });

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
  voiceId: string | null;
  faqAnswers: Record<string, string> | null;
  offLimits: Record<string, boolean> | null;
  selectedPlan: string | null;
  currentStep: number;
  maxStepReached: number;
  status: string;
  language: string;
  timezone?: string | null;
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
    trialNote: "Free for 14 days, then $497/mo.",
    cancelAnytime: "Cancel anytime",
    guarantee: "14-day free trial",
    monthlyLabel: "Monthly",
    annualLabel: "Annual",
    monthlyPrice: "$497",
    monthlyPer: "/month",
    annualPrice: "$397",
    annualPer: "/month billed annually",
    annualSave: "Save $1,200",
    hireCta: "Start Free Trial with",
    missedCallsTitle: "You're Losing Money Right Now",
    roiMonthlyLoss: "/month in missed calls",
    roiMultiple: "x return on investment",
    configSummary: "What she knows:",
    services: "services",
    bilingualLabel: "English & Spanish",
    toast1: "{biz} profile created — let's connect you",
    toast2Title: "Contact info saved",
    toast2Body: "You'll get call alerts at {phone}",
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
    tryMariaTitle: "Try {name} before you buy",
    tryMariaSub: "Have a real conversation — ask about scheduling, pricing, or anything a caller would.",
    tryMariaCta: "Start Test Call",
    tryMariaEnd: "End Call",
    tryMariaConnecting: "Connecting...",
    tryMariaActive: "Speak naturally — {name} is listening",
    tryMariaEnded: "How was that?",
    tryMariaEndedSub: "{name} handled that call using your business info, services, and personality settings.",
    tryMariaContinue: "Continue to Pricing",
    tryMariaSkip: "Skip test call",
    tryMariaTimer: "Time remaining",
    tryMariaMicNote: "Uses your browser microphone",
    tryMariaRetry: "Try Again",
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
    trialNote: "Gratis por 14 días, luego $497/mes.",
    cancelAnytime: "Cancela cuando quieras",
    guarantee: "Prueba gratuita de 14 días",
    monthlyLabel: "Mensual",
    annualLabel: "Anual",
    monthlyPrice: "$497",
    monthlyPer: "/mes",
    annualPrice: "$397",
    annualPer: "/mes facturado anualmente",
    annualSave: "Ahorra $1,200",
    hireCta: "Comenzar Prueba Gratuita con",
    missedCallsTitle: "Estás Perdiendo Dinero Ahora Mismo",
    roiMonthlyLoss: "/mes en llamadas perdidas",
    roiMultiple: "x retorno de inversión",
    configSummary: "Lo que ella sabe:",
    services: "servicios",
    bilingualLabel: "Inglés y Español",
    toast1: "Perfil de {biz} creado — vamos a conectarte",
    toast2Title: "Contacto guardado",
    toast2Body: "Recibirás alertas de llamadas al {phone}",
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
    tryMariaTitle: "Prueba a {name} antes de comprar",
    tryMariaSub: "Ten una conversación real — pregunta sobre citas, precios o cualquier cosa que un cliente preguntaría.",
    tryMariaCta: "Iniciar Llamada de Prueba",
    tryMariaEnd: "Terminar Llamada",
    tryMariaConnecting: "Conectando...",
    tryMariaActive: "Habla naturalmente — {name} está escuchando",
    tryMariaEnded: "¿Qué te pareció?",
    tryMariaEndedSub: "{name} manejó esa llamada usando la información de tu negocio, servicios y personalidad.",
    tryMariaContinue: "Continuar a Precios",
    tryMariaSkip: "Saltar llamada de prueba",
    tryMariaTimer: "Tiempo restante",
    tryMariaMicNote: "Usa el micrófono de tu navegador",
    tryMariaRetry: "Intentar de Nuevo",
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
const VISUAL_STEPS = 6;

/** Map server step (1-6) to visual step (1-6) since steps 3+4 are merged, and test call is visual 5 */
function serverStepToVisual(serverStep: number): number {
  if (serverStep <= 2) return serverStep;
  if (serverStep <= 4) return 3;
  if (serverStep === 5) return 4;
  return 6; // server 6 = paywall = visual 6
}

// ── Helpers ──

function formatPhone(value: string): { formatted: string; error?: string } {
  // Strip country code prefix (+1) if present
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  if (digits.length > 10) {
    return { formatted: value, error: "Phone number cannot exceed 10 digits" };
  }
  let formatted: string;
  if (digits.length <= 3) formatted = digits;
  else if (digits.length <= 6) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  else formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return { formatted };
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

// ── Hours Schedule Builder ──

const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

const TIME_OPTIONS = [
  "5:00 AM", "5:30 AM", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM",
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM",
  "11:00 PM",
];

interface DaySchedule { open: boolean; from: string; to: string }

function parseHoursString(val: string): Record<string, DaySchedule> {
  const defaults: Record<string, DaySchedule> = {};
  for (const d of DAYS_EN) {
    defaults[d] = d === "Sat" || d === "Sun"
      ? { open: false, from: "8:00 AM", to: "5:00 PM" }
      : { open: true, from: "8:00 AM", to: "5:00 PM" };
  }
  if (!val) return defaults;
  // Try to detect existing schedule from string
  for (const d of DAYS_EN) {
    const pattern = new RegExp(`${d}[:\\s]+([\\d:]+\\s*[AaPp][Mm])\\s*[-–]\\s*([\\d:]+\\s*[AaPp][Mm])`, "i");
    const m = val.match(pattern);
    if (m) {
      const from = TIME_OPTIONS.find((t) => t.toLowerCase().replace(/\s/g, "") === m[1].toLowerCase().replace(/\s/g, ""));
      const to = TIME_OPTIONS.find((t) => t.toLowerCase().replace(/\s/g, "") === m[2].toLowerCase().replace(/\s/g, ""));
      if (from && to) defaults[d] = { open: true, from, to };
    }
  }
  return defaults;
}

function scheduleToString(schedule: Record<string, DaySchedule>): string {
  const groups: { days: string[]; from: string; to: string }[] = [];
  const closedDays: string[] = [];

  for (const d of DAYS_EN) {
    const day = schedule[d];
    if (!day.open) { closedDays.push(d); continue; }
    const last = groups[groups.length - 1];
    if (last && last.from === day.from && last.to === day.to) {
      last.days.push(d);
    } else {
      groups.push({ days: [d], from: day.from, to: day.to });
    }
  }

  const parts = groups.map((g) => {
    const dayRange = g.days.length > 2
      ? `${g.days[0]}-${g.days[g.days.length - 1]}`
      : g.days.join(", ");
    return `${dayRange} ${g.from}-${g.to}`;
  });

  if (closedDays.length > 0 && closedDays.length < 7) {
    const closedRange = closedDays.length > 2
      ? `${closedDays[0]}-${closedDays[closedDays.length - 1]}`
      : closedDays.join(", ");
    parts.push(`${closedRange} Closed`);
  }

  return parts.join(", ");
}

function HoursSchedule({ lang, value, onChange }: { lang: Lang; value: string; onChange: (v: string) => void }) {
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(() => parseHoursString(value));
  const days = lang === "es" ? DAYS_ES : DAYS_EN;
  const closedLabel = lang === "es" ? "Cerrado" : "Closed";

  const update = (day: string, patch: Partial<DaySchedule>) => {
    const next = { ...schedule, [day]: { ...schedule[day], ...patch } };
    setSchedule(next);
    onChange(scheduleToString(next));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {DAYS_EN.map((dayKey, i) => {
        const day = schedule[dayKey];
        return (
          <div
            key={dayKey}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 8,
              background: day.open ? "var(--db-surface, rgba(255,255,255,0.06))" : "var(--db-bg, rgba(255,255,255,0.02))",
              border: "1px solid var(--db-border, rgba(255,255,255,0.08))",
            }}
          >
            <button
              type="button"
              onClick={() => update(dayKey, { open: !day.open })}
              style={{
                width: 48, flexShrink: 0, fontWeight: 600, fontSize: 13,
                color: day.open ? "var(--db-accent, #D4A843)" : "var(--db-text-muted, #64748b)",
                background: "none", border: "none", cursor: "pointer",
                textAlign: "left", padding: 0,
              }}
            >
              {days[i]}
            </button>

            {day.open ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                <select
                  value={day.from}
                  onChange={(e) => update(dayKey, { from: e.target.value })}
                  className={s.select}
                  style={{ flex: 1, padding: "6px 28px 6px 8px", fontSize: 13, minWidth: 0 }}
                >
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span style={{ color: "var(--db-text-muted, #64748b)", fontSize: 13, flexShrink: 0 }}>–</span>
                <select
                  value={day.to}
                  onChange={(e) => update(dayKey, { to: e.target.value })}
                  className={s.select}
                  style={{ flex: 1, padding: "6px 28px 6px 8px", fontSize: 13, minWidth: 0 }}
                >
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => update(dayKey, { open: true })}
                style={{
                  flex: 1, color: "var(--db-text-muted, #64748b)", fontSize: 13,
                  background: "none", border: "none", cursor: "pointer",
                  textAlign: "left", padding: 0,
                }}
              >
                {closedLabel}
              </button>
            )}

            <button
              type="button"
              onClick={() => update(dayKey, { open: !day.open })}
              style={{
                width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                background: day.open ? "var(--db-accent, #D4A843)" : "var(--db-border, rgba(255,255,255,0.12))",
                border: "none", cursor: "pointer", position: "relative",
                transition: "background 0.2s",
              }}
            >
              <span style={{
                position: "absolute", top: 2, width: 16, height: 16,
                borderRadius: "50%", background: "#fff",
                transition: "left 0.2s",
                left: day.open ? 18 : 2,
              }} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Setup ROI Calculator ──

function SetupROI({ lang, defaultMissed, defaultJobValue, tradeName, city }: {
  lang: Lang;
  defaultMissed: number;
  defaultJobValue: number;
  tradeName: string;
  city: string;
}) {
  const [missedCalls, setMissedCalls] = useState(defaultMissed);
  const [jobValue, setJobValue] = useState(defaultJobValue);

  const monthlyLoss = Math.round(jobValue * missedCalls * 4.33);
  const captaCost = 497;
  const roiMultiple = monthlyLoss > captaCost
    ? Math.round(((monthlyLoss - captaCost) / captaCost) * 10) / 10
    : 0;

  const jobPct = ((jobValue - 100) / (5000 - 100)) * 100;
  const callsPct = ((missedCalls - 1) / (10 - 1)) * 100;

  const l = lang === "es" ? {
    title: "Tu Costo Real de Llamadas Perdidas",
    jobLabel: "Valor promedio del trabajo",
    callsLabel: "Llamadas perdidas por día",
    losing: "Perdiendo",
    costs: "Capta cuesta",
    roi: "Tu ROI",
    perMonth: "/mes",
    returnLabel: "retorno",
    source: `Basado en negocios de ${tradeName} en ${city}`,
  } : {
    title: "Your Real Cost of Missed Calls",
    jobLabel: "Average job value",
    callsLabel: "Missed calls per day",
    losing: "You're losing",
    costs: "Capta costs",
    roi: "Your ROI",
    perMonth: "/month",
    returnLabel: "return",
    source: `Based on ${tradeName} businesses in ${city}`,
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          background: "var(--db-surface, rgba(255,255,255,0.04))",
          border: "1px solid var(--db-border, rgba(255,255,255,0.08))",
          borderRadius: 12,
          padding: "24px 20px",
        }}
      >
        <h3 style={{ color: "var(--db-text, #fff)", fontSize: 15, fontWeight: 700, margin: "0 0 20px", textAlign: "center" }}>
          {l.title}
        </h3>

        {/* Sliders */}
        <div style={{ display: "grid", gap: 20 }}>
          {/* Job Value */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ color: "var(--db-text-muted, #94a3b8)", fontSize: 13 }}>{l.jobLabel}</span>
              <span style={{ color: "var(--db-text, #fff)", fontWeight: 700, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
                ${jobValue.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={100}
              max={5000}
              step={50}
              value={jobValue}
              onChange={(e) => setJobValue(+e.target.value)}
              className="roi-slider"
              style={{ "--fill": `${jobPct}%` } as React.CSSProperties}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ color: "var(--db-text-muted, #475569)", fontSize: 11 }}>$100</span>
              <span style={{ color: "var(--db-text-muted, #475569)", fontSize: 11 }}>$5,000</span>
            </div>
          </div>

          {/* Missed Calls */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ color: "var(--db-text-muted, #94a3b8)", fontSize: 13 }}>{l.callsLabel}</span>
              <span style={{ color: "var(--db-text, #fff)", fontWeight: 700, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
                {missedCalls}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={missedCalls}
              onChange={(e) => setMissedCalls(+e.target.value)}
              className="roi-slider"
              style={{ "--fill": `${callsPct}%` } as React.CSSProperties}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ color: "var(--db-text-muted, #475569)", fontSize: 11 }}>1</span>
              <span style={{ color: "var(--db-text-muted, #475569)", fontSize: 11 }}>10</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid var(--db-border, rgba(255,255,255,0.06))", margin: "20px 0" }} />

        {/* Output */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
          <div>
            <p style={{ color: "var(--db-text-muted, #94a3b8)", fontSize: 11, margin: "0 0 4px", fontWeight: 500 }}>{l.losing}</p>
            <p style={{ color: "var(--db-danger, #ef4444)", fontSize: 22, fontWeight: 800, margin: 0, fontVariantNumeric: "tabular-nums" }}>
              ${monthlyLoss.toLocaleString()}
            </p>
            <p style={{ color: "var(--db-text-muted, #475569)", fontSize: 10, margin: "2px 0 0" }}>{l.perMonth}</p>
          </div>
          <div>
            <p style={{ color: "var(--db-text-muted, #94a3b8)", fontSize: 11, margin: "0 0 4px", fontWeight: 500 }}>{l.costs}</p>
            <p style={{ color: "var(--db-text, #fff)", fontSize: 22, fontWeight: 800, margin: 0 }}>$497</p>
            <p style={{ color: "var(--db-text-muted, #475569)", fontSize: 10, margin: "2px 0 0" }}>{l.perMonth}</p>
          </div>
          <div>
            <p style={{ color: "var(--db-text-muted, #94a3b8)", fontSize: 11, margin: "0 0 4px", fontWeight: 500 }}>{l.roi}</p>
            <p style={{ color: "var(--db-accent, #d4a843)", fontSize: 22, fontWeight: 800, margin: 0 }}>
              {roiMultiple > 0 ? `${roiMultiple.toFixed(1)}x` : "—"}
            </p>
            <p style={{ color: "var(--db-text-muted, #475569)", fontSize: 10, margin: "2px 0 0" }}>{l.returnLabel}</p>
          </div>
        </div>

        {/* Source note */}
        {tradeName && city && (
          <p style={{ textAlign: "center", color: "var(--db-text-muted, #475569)", fontSize: 11, margin: "16px 0 0" }}>
            {l.source}
          </p>
        )}
      </div>
    </div>
  );
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

function SetupVoicePreview({ voiceId, name, lang }: { voiceId: string; name: string; lang: Lang }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    try {
      const sampleText = lang === "es"
        ? `Hola, gracias por llamar. Esta es una demostración de la voz de ${name}.`
        : `Hi, thanks for calling! This is a preview of the ${name} voice.`;
      const res = await fetch("/api/setup/greeting-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId, text: sampleText }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setPlaying(false); URL.revokeObjectURL(url); };
      audio.play();
    } catch {
      setPlaying(false);
    }
  };

  return (
    <button onClick={play} style={{ marginTop: 4, fontSize: 12, fontWeight: 500, color: playing ? "#D4A843" : "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>
      {playing ? (lang === "es" ? "Detener" : "Stop") : (lang === "es" ? "Escuchar" : "Preview")}
    </button>
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

  // Step 1 (timezone)
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";
    } catch {
      return "America/Chicago";
    }
  });

  // Step 2
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");

  // Step 3
  const [receptionistName, setReceptionistName] = useState("Maria");
  const [useCustomName, setUseCustomName] = useState(false);

  // Step 4
  const [personalityPreset, setPersonalityPreset] = useState("friendly");
  const [selectedVoiceId, setSelectedVoiceId] = useState("");

  // Step 5
  const [faqAnswers, setFaqAnswers] = useState<Record<string, string>>({});
  const [offLimits, setOffLimits] = useState<Record<string, boolean>>({ pricing: true, competitors: false, timing: false });

  // Step 6
  const [planToggle, setPlanToggle] = useState<PlanType>("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [tradeData, setTradeData] = useState<TradeData | null>(null);

  // Test call
  const [testCallState, setTestCallState] = useState<"idle" | "connecting" | "active" | "ended" | "error">("idle");
  const [testCallTimer, setTestCallTimer] = useState(90);
  const testCallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const testCallAudioRef = useRef<{ disconnect: () => void } | null>(null);
  const testCallConnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Audio preview
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastContent, setToastContent] = useState<{ title: string; body?: string } | null>(null);

  // Celebration (post-payment)
  const [showCelebration, setShowCelebration] = useState(false);
  const [authState, setAuthState] = useState<"pending" | "success" | "failed">("pending");
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);

  // Errors — per-field errors only, cleared per-field
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginUrl, setLoginUrl] = useState<string | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastInnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittingRef = useRef(false);

  // Cleanup timers + audio on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastInnerTimerRef.current) clearTimeout(toastInnerTimerRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (testCallTimerRef.current) clearInterval(testCallTimerRef.current);
      if (testCallConnectTimeoutRef.current) clearTimeout(testCallConnectTimeoutRef.current);
    };
  }, []);

  const playGreetingPreview = useCallback(async () => {
    // Stop if already playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPreviewPlaying(false);
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await fetch("/api/setup/greeting-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: bizName || "your business",
          personality: personalityPreset,
          receptionistName: receptionistName || "Maria",
          lang,
          voiceId: selectedVoiceId || undefined,
        }),
      });

      if (!res.ok) return;

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("audio")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { setPreviewPlaying(false); audioRef.current = null; URL.revokeObjectURL(url); };
        audio.onerror = () => { setPreviewPlaying(false); audioRef.current = null; URL.revokeObjectURL(url); };
        setPreviewPlaying(true);
        await audio.play();
      } else {
        // Fallback: browser SpeechSynthesis
        const data = await res.json();
        if (data.text && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(data.text);
          utterance.lang = lang === "es" ? "es-MX" : "en-US";
          utterance.rate = 0.95;
          utterance.onend = () => setPreviewPlaying(false);
          utterance.onerror = () => setPreviewPlaying(false);
          setPreviewPlaying(true);
          speechSynthesis.speak(utterance);
        }
      }
    } catch {
      // Silently fail — preview is nice-to-have
    } finally {
      setPreviewLoading(false);
    }
  }, [bizName, personalityPreset, receptionistName, lang]);

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
          setPollAttempt(attempt + 1);
          try {
            const authRes = await fetch("/api/setup/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ attempt, session_id: sessionId }),
              signal: abortController.signal,
            });
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
      const voiceParam = searchParams.get("voice");
      if (voiceParam) setSelectedVoiceId(voiceParam);

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
    if (sess.voiceId) setSelectedVoiceId(sess.voiceId);
    if (sess.faqAnswers) setFaqAnswers(sess.faqAnswers);
    if (sess.offLimits) setOffLimits(sess.offLimits);
    if (sess.selectedPlan === "monthly" || sess.selectedPlan === "annual") {
      setPlanToggle(sess.selectedPlan);
    }
    if (sess.timezone) {
      setTimezone(sess.timezone);
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
          if (err.loginUrl) setLoginUrl(err.loginUrl);
          return false;
        }
        setLoginUrl(null);
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
        if (services.length === 0) { setFieldError("services", t.required); hasError = true; }
        if (hasError) return;
        const ok = await saveStep(1, { businessName: bizName.trim(), businessType: bizType, city: city.trim(), state: state.trim(), services, timezone });
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
        const okPers = await saveStep(4, { personalityPreset, voiceId: selectedVoiceId || undefined });
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
  }, [step, bizName, bizType, city, state, services, timezone, ownerName, ownerEmail, ownerPhone, receptionistName, personalityPreset, faqAnswers, offLimits, saveStep, showToastAndAdvance, setFieldError, t]);

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
    if (e.key === "Enter" && step <= 4 && !saving) {
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
        <Confetti />
        <div className={s.container} style={{ textAlign: "center", paddingTop: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
          <h1 className={s.title} style={{ fontSize: 32 }}>
            {replaceVars(t.celebrationTitle, { name: receptionistName })}
          </h1>
          <p className={s.subtitle}>
            {lang === "en"
              ? `Welcome! ${receptionistName} is ready to answer your calls 24/7 in English and Spanish.`
              : `¡Bienvenido! ${receptionistName} está lista para contestar tus llamadas 24/7 en inglés y español.`}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", margin: "12px 0 8px" }}>
            <span style={{ color: "#10b981", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
              ✓ {services.length || 0} {lang === "es" ? "servicios configurados" : "services configured"}
            </span>
            <span style={{ color: "#10b981", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
              ✓ {t.bilingualLabel}
            </span>
            <span style={{ color: "#10b981", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
              ✓ {lang === "es" ? "Disponible fuera de horario" : "After-hours coverage"}
            </span>
          </div>

          <div className={s.summaryCard}>
            <h3 style={{ color: "#D4A843", margin: "0 0 16px", fontSize: 16 }}>{t.configSummary}</h3>
            {bizName && <div className={s.summaryRow}><span className={s.summaryLabel}>{t.businessLabel}:</span> <span>{bizName}</span></div>}
            <div className={s.summaryRow}><span className={s.summaryLabel}>{t.receptionistLabel}:</span> <span>{receptionistName}</span></div>
            <div className={s.summaryRow}><span className={s.summaryLabel}>{t.personalityLabel}:</span> <span style={{ textTransform: "capitalize" }}>{personalityPreset}</span></div>
            {services.length > 0 && (
              <div className={s.summaryRow}><span className={s.summaryLabel}>{t.servicesLabel}:</span> <span>{services.slice(0, 4).join(", ")}{services.length > 4 ? ` +${services.length - 4}` : ""}</span></div>
            )}
          </div>

          <div style={{ marginTop: 24, textAlign: "left" }}>
            <First24Hours lang={lang} />
          </div>

          <div className={s.card} style={{ marginTop: 24, padding: 20 }}>
            <h3 style={{ color: "#fff", margin: "0 0 8px", fontSize: 16 }}>{t.whatsNext}</h3>
            <p style={{ color: "#94a3b8", margin: "0 0 20px", fontSize: 14 }}>
              {replaceVars(t.whatsNextDesc, { name: receptionistName })}
            </p>
            {authState === "pending" && (
              <div>
                <p style={{ color: "#D4A843", fontSize: 14 }}>
                  {t.authenticating}
                </p>
                {pollAttempt >= 5 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>
                      {lang === "en"
                        ? "Payment processing is taking longer than expected. Click below to check status."
                        : "El procesamiento del pago está tomando más tiempo de lo esperado. Haz clic para verificar."}
                    </p>
                    <button
                      className={s.secondaryBtn}
                      style={{ fontSize: 13 }}
                      onClick={() => window.location.reload()}
                    >
                      {lang === "en" ? "Check Payment Status" : "Verificar Estado del Pago"}
                    </button>
                  </div>
                )}
              </div>
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
                    <p style={{ color: "#e2e8f0", fontSize: 13, margin: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ color: "#94a3b8" }}>{lang === "en" ? "Password:" : "Contraseña:"}</span>{" "}
                      <code style={{ background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace" }}>{credentials.password}</code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(credentials.password).then(() => {
                            setPasswordCopied(true);
                            setTimeout(() => setPasswordCopied(false), 2000);
                          });
                        }}
                        style={{
                          background: passwordCopied ? "rgba(16,185,129,0.2)" : "rgba(212,168,67,0.2)",
                          border: `1px solid ${passwordCopied ? "rgba(16,185,129,0.4)" : "rgba(212,168,67,0.4)"}`,
                          borderRadius: 4,
                          color: passwordCopied ? "#10b981" : "#D4A843",
                          fontSize: 12,
                          padding: "2px 8px",
                          cursor: "pointer",
                          fontWeight: 600,
                          transition: "all 0.2s",
                        }}
                      >
                        {passwordCopied ? (lang === "en" ? "Copied!" : "¡Copiado!") : (lang === "en" ? "Copy" : "Copiar")}
                      </button>
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
        <p className={s.error} role="alert" aria-live="assertive" style={{ fontSize: 16 }}>{initError}</p>
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
                <select
                  id="state"
                  className={`${s.select} ${errors.state ? s.inputError : ""}`}
                  value={state}
                  onChange={(e) => { setState(e.target.value); clearFieldError("state"); }}
                >
                  <option value="">{t.statePlaceholder}</option>
                  {["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","PR","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.state && <span className={s.error}>{errors.state}</span>}
              </div>
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor="timezone">{lang === "es" ? "Zona Horaria" : "Time Zone"}</label>
              <select
                id="timezone"
                className={s.select}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="America/New_York">{lang === "es" ? "Este (Nueva York)" : "Eastern (New York)"}</option>
                <option value="America/Chicago">{lang === "es" ? "Central (Chicago)" : "Central (Chicago)"}</option>
                <option value="America/Denver">{lang === "es" ? "Montana (Denver)" : "Mountain (Denver)"}</option>
                <option value="America/Los_Angeles">{lang === "es" ? "Pacifico (Los Angeles)" : "Pacific (Los Angeles)"}</option>
                <option value="America/Phoenix">{lang === "es" ? "Arizona (sin horario de verano)" : "Arizona (no DST)"}</option>
                <option value="Pacific/Honolulu">{lang === "es" ? "Hawaii" : "Hawaii"}</option>
              </select>
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
                onChange={(e) => {
                  const { formatted, error } = formatPhone(e.target.value);
                  if (error) { setFieldError("ownerPhone", error); } else { clearFieldError("ownerPhone"); }
                  setOwnerPhone(formatted);
                }}
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

            {/* Voice selection */}
            <h3 style={{ color: "#fff", fontWeight: 600, fontSize: 16, margin: "28px 0 12px" }}>{lang === "es" ? "Voz" : "Voice"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", desc: lang === "es" ? "Profesional" : "Professional" },
                { id: "jBpfAFnaylXS5xpurlZD", name: "Lily", desc: lang === "es" ? "Amigable" : "Friendly" },
                { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", desc: lang === "es" ? "Cálido" : "Warm" },
                { id: "pFZP5JQG7iQjIQuC4Bku", name: "Rachel", desc: lang === "es" ? "Clara" : "Clear" },
              ].map((voice) => (
                <div key={voice.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <button
                    onClick={() => setSelectedVoiceId(voice.id)}
                    className={`${s.cardSelectable} ${selectedVoiceId === voice.id ? s.cardSelected : ""}`}
                    style={{ textAlign: "center", padding: "14px 12px", width: "100%" }}
                    aria-pressed={selectedVoiceId === voice.id}
                  >
                    <div style={{ color: "#fff", fontWeight: 600, marginBottom: 2 }}>{voice.name}</div>
                    <div style={{ color: "#94a3b8", fontSize: 13 }}>{voice.desc}</div>
                  </button>
                  <SetupVoicePreview voiceId={voice.id} name={voice.name} lang={lang} />
                </div>
              ))}
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
                </div>
                <button
                  type="button"
                  onClick={playGreetingPreview}
                  disabled={previewLoading}
                  style={{
                    background: "none",
                    border: "1px solid rgba(212,168,67,0.3)",
                    borderRadius: 8,
                    color: previewPlaying ? "#ef4444" : "#D4A843",
                    padding: "6px 12px",
                    fontSize: 13,
                    cursor: "pointer",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.2s",
                    animation: previewPlaying ? "pulse 1.5s ease-in-out infinite" : undefined,
                  }}
                >
                  {previewLoading ? "..." : previewPlaying ? "■" : "▶"} {previewPlaying ? (lang === "es" ? "Parar" : "Stop") : t.previewGreeting}
                </button>
              </div>
            )}
            {receptionistName.trim() && (
              <p style={{ color: "#64748b", fontSize: 12, textAlign: "center", margin: "4px 0 0" }}>{t.previewNote}</p>
            )}
          </div>
        )}

        {/* ── STEP 4: FAQ + Off-Limits (was step 5) ── */}
        {step === 4 && (
          <div className={s.stepContent} key="step4">
            <h1 className={s.title}>{t.step5Title}</h1>
            <p className={s.subtitle}>{t.step5Sub}</p>

            {/* Hours schedule builder */}
            <div className={s.field}>
              <label className={s.label}>{t.faqHoursQ}</label>
              <HoursSchedule
                lang={lang}
                value={faqAnswers.hours || ""}
                onChange={(val) => setFaqAnswers({ ...faqAnswers, hours: val })}
              />
            </div>

            {[
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

        {/* ── STEP 5: Try Maria (test call) ── */}
        {step === 5 && (
          <div className={s.stepContent} key="step5">
            <h1 className={s.title}>{replaceVars(t.tryMariaTitle, { name: receptionistName || "Maria" })}</h1>
            <p className={s.subtitle}>{replaceVars(t.tryMariaSub, { name: receptionistName || "Maria" })}</p>

            <div style={{
              background: "rgba(212,168,67,0.06)",
              border: "1px solid rgba(212,168,67,0.2)",
              borderRadius: 16,
              padding: "32px 24px",
              textAlign: "center",
              marginTop: 16,
            }}>
              {testCallState === "idle" && (
                <>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎙️</div>
                  <button
                    onClick={async () => {
                      setTestCallState("connecting");
                      // 15-second timeout for connecting state
                      if (testCallConnectTimeoutRef.current) clearTimeout(testCallConnectTimeoutRef.current);
                      testCallConnectTimeoutRef.current = setTimeout(() => {
                        setTestCallState((current) => current === "connecting" ? "error" : current);
                      }, 15000);
                      try {
                        const res = await fetch("/api/setup/test-call", { method: "POST" });
                        if (!res.ok) {
                          if (testCallConnectTimeoutRef.current) clearTimeout(testCallConnectTimeoutRef.current);
                          setTestCallState("error");
                          return;
                        }
                        const data = await res.json();
                        // Connection established — start the test call session
                        if (testCallConnectTimeoutRef.current) clearTimeout(testCallConnectTimeoutRef.current);
                        setTestCallState("active");
                        setTestCallTimer(90);
                        // Start countdown
                        if (testCallTimerRef.current) clearInterval(testCallTimerRef.current);
                        testCallTimerRef.current = setInterval(() => {
                          setTestCallTimer((prev) => {
                            if (prev <= 1) {
                              if (testCallTimerRef.current) clearInterval(testCallTimerRef.current);
                              setTestCallState("ended");
                              return 0;
                            }
                            return prev - 1;
                          });
                        }, 1000);
                      } catch {
                        if (testCallConnectTimeoutRef.current) clearTimeout(testCallConnectTimeoutRef.current);
                        setTestCallState("error");
                      }
                    }}
                    className={s.primaryBtn}
                    style={{ fontSize: 16, padding: "14px 32px" }}
                  >
                    {t.tryMariaCta}
                  </button>
                  <p style={{ color: "#64748b", fontSize: 12, marginTop: 12 }}>{t.tryMariaMicNote}</p>
                </>
              )}

              {testCallState === "error" && (
                <>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
                  <p style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                    {lang === "en" ? "Voice system unavailable. You can skip this step." : "Sistema de voz no disponible. Puedes omitir este paso."}
                  </p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
                    <button
                      onClick={() => { setTestCallState("idle"); }}
                      className={s.secondaryBtn}
                    >
                      {t.tryMariaRetry}
                    </button>
                    <button
                      onClick={() => setStep(6)}
                      className={s.primaryBtn}
                    >
                      {lang === "en" ? "Skip Test Call" : "Omitir Llamada de Prueba"} →
                    </button>
                  </div>
                </>
              )}

              {testCallState === "connecting" && (
                <>
                  <div className={s.spinner} style={{ margin: "0 auto 16px" }} />
                  <p style={{ color: "#D4A843", fontSize: 16, fontWeight: 600 }}>{t.tryMariaConnecting}</p>
                </>
              )}

              {testCallState === "active" && (
                <>
                  <div style={{
                    width: 80, height: 80, borderRadius: "50%",
                    background: "rgba(212,168,67,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}>
                    <span style={{ fontSize: 32 }}>🎙️</span>
                  </div>
                  <p style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
                    {replaceVars(t.tryMariaActive, { name: receptionistName || "Maria" })}
                  </p>
                  <p style={{ color: "#D4A843", fontSize: 24, fontWeight: 700, fontVariantNumeric: "tabular-nums", marginBottom: 16 }}>
                    {Math.floor(testCallTimer / 60)}:{(testCallTimer % 60).toString().padStart(2, "0")}
                  </p>
                  <button
                    onClick={() => {
                      if (testCallTimerRef.current) clearInterval(testCallTimerRef.current);
                      setTestCallState("ended");
                    }}
                    className={s.secondaryBtn}
                    style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}
                  >
                    {t.tryMariaEnd}
                  </button>
                </>
              )}

              {testCallState === "ended" && (
                <>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
                    {t.tryMariaEnded}
                  </h3>
                  <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20 }}>
                    {replaceVars(t.tryMariaEndedSub, { name: receptionistName || "Maria" })}
                  </p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                      onClick={() => {
                        setTestCallState("idle");
                        setTestCallTimer(90);
                      }}
                      className={s.secondaryBtn}
                    >
                      {t.tryMariaRetry}
                    </button>
                    <button
                      onClick={() => setStep(6)}
                      className={s.primaryBtn}
                    >
                      {t.tryMariaContinue} →
                    </button>
                  </div>
                </>
              )}
            </div>

            {testCallState === "idle" && (
              <button
                onClick={() => setStep(6)}
                style={{
                  background: "none", border: "none", color: "#64748b",
                  fontSize: 14, cursor: "pointer", marginTop: 16, padding: 8,
                  textDecoration: "underline", display: "block", marginLeft: "auto", marginRight: "auto",
                }}
              >
                {t.tryMariaSkip}
              </button>
            )}

            <div style={{ marginTop: 12 }}>
              <button onClick={() => setStep(4)} className={s.backBtn}>{t.back}</button>
            </div>
          </div>
        )}

        {/* ── STEP 6: Hire / Checkout ── */}
        {step === 6 && (
          <div className={s.stepContent} key="step6">
            <h1 className={s.title}>{receptionistName} {t.step6Sub} {bizName || t.yourBusiness}</h1>
            <p className={s.subtitle}>
              {t.trialNote}
            </p>

            {/* ROI Calculator */}
            <SetupROI
              lang={lang}
              defaultMissed={tradeData?.roi?.missedPerDay ?? 3}
              defaultJobValue={tradeData?.avgJobValue ?? 500}
              tradeName={TRADE_OPTIONS.find((o) => o.value === bizType)?.[lang] || bizType}
              city={city}
            />

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
              <span style={{ color: "#10b981", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                {t.cancelAnytime} · {t.guarantee}
              </span>
              <span style={{ color: "#10b981", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
                {t.phoneReassurance}
              </span>
            </div>

            {/* CTA */}
            {errors._form && <div className={s.error} role="alert" aria-live="assertive" style={{ marginBottom: 12, textAlign: "center" }}>{errors._form}</div>}
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className={s.primaryBtn}
              style={{ width: "100%", fontSize: 18, padding: "16px 32px" }}
            >
              {checkoutLoading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                  <svg style={{ animation: "spin 1s linear infinite", height: 20, width: 20 }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {t.processing}
                </span>
              ) : `${t.hireCta} ${receptionistName} →`}
            </button>
          </div>
        )}

        {/* Nav buttons (steps 1-4) */}
        {step <= 4 && (
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
              {saving ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <svg style={{ animation: "spin 1s linear infinite", height: 16, width: 16 }} viewBox="0 0 24 24" fill="none"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {t.saving}
                </span>
              ) : t.next}
            </button>
          </div>
        )}

        {step === 6 && (
          <div style={{ marginTop: 12 }}>
            <button onClick={() => setStep(5)} className={s.backBtn}>{t.back}</button>
          </div>
        )}

        {errors._form && step <= 4 && (
          <div className={s.error} role="alert" aria-live="assertive" style={{ marginTop: 8, textAlign: "center" }}>
            {errors._form}
            {loginUrl && (
              <>
                {" "}
                <a href={loginUrl} style={{ color: "#D4A843", textDecoration: "underline", fontWeight: 600 }}>
                  {lang === "en" ? "Log in here" : "Inicia sesión aquí"}
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
