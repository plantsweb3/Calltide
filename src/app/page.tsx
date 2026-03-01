"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform, useInView } from "framer-motion";
import dynamic from "next/dynamic";

const VoiceChat = dynamic(() => import("@/components/voice-chat"), { ssr: false });

const PHONE = process.env.NEXT_PUBLIC_PHONE ?? "(830) 521-7133";
const PHONE_TEL = `tel:${process.env.NEXT_PUBLIC_PHONE_TEL ?? "+18305217133"}`;

/* ═══════════════════════════════════════════════════════════════
   BILINGUAL CONTENT
   ═══════════════════════════════════════════════════════════════ */

type Lang = "en" | "es";

const T = {
  en: {
    nav: { login: "Log In", cta: "Hire Your Receptionist" },
    hero: {
      badge: "AI Receptionist for Home Services",
      h1a: "Hire a Bilingual Receptionist",
      h1b: "for $16/day.",
      sub: "She answers every call. Books appointments. Speaks English and Spanish. Starts in 5 minutes.",
      cta: "Hire Your Receptionist — 14 Days Free",
      audioLabel: "Hear her in action",
      audioSub: "\"Hi, I need to schedule a plumber...\"",
      audioDuration: "0:47",
      audioComing: "Demo coming soon",
      trustItems: ["24/7 Coverage", "Bilingual EN/ES", "$16/day", "Cancel Anytime", "No Setup Fee"],
    },
    problem: {
      label: "The Problem",
      h2: "You're losing money every time the phone rings and nobody answers.",
      stat1: "Small businesses miss 62% of incoming calls",
      stat2: "80% of callers won't leave a voicemail — they call your competitor",
      calcTitle: "ROI Calculator",
      calcCalls: "How many calls do you get per week?",
      calcMiss: "What percentage do you miss?",
      calcValue: "What's your average job value?",
      calcResult: "You're losing approximately",
      calcPerMonth: "per month in missed calls.",
      calcCta: "Your receptionist recovers that revenue for $16/day",
    },
    howItWorks: {
      label: "How It Works",
      h2: "Three steps. Five minutes.",
      steps: [
        { title: "Hire Her", desc: "Name her, pick her personality, and customize her greeting." },
        { title: "Forward Your Calls", desc: "Point your business line to her number. Takes 2 minutes." },
        { title: "She Handles Everything", desc: "She books appointments, takes messages, handles emergencies — in English and Spanish." },
      ],
    },
    features: {
      label: "Features",
      h2: "Everything you need. Nothing you don't.",
      cards: [
        { title: "24/7 Availability", desc: "Your receptionist never sleeps, never takes breaks, never calls in sick." },
        { title: "Truly Bilingual", desc: "Native English and Spanish. Not a translation — a real conversation." },
        { title: "Appointment Booking", desc: "She checks your calendar and books appointments in real-time." },
        { title: "SMS Confirmations", desc: "Callers get instant text confirmations with appointment details." },
        { title: "Emergency Detection", desc: "Gas leak? Burst pipe? She detects emergencies and transfers immediately." },
        { title: "Full Dashboard", desc: "See every call, transcript, appointment, and message. Know exactly what's happening." },
      ],
    },
    social: {
      label: "Built for Service Businesses",
      testimonials: [
        { quote: "Every missed call is a lost job. Your receptionist makes sure that never happens — in English or Spanish.", name: "Why Calltide?", biz: "24/7 AI receptionist for Texas service businesses" },
        { quote: "Your customers call once. If nobody answers, they call your competitor. She answers every time.", name: "Never Miss Again", biz: "Answers, books, follows up — automatically" },
      ],
      stats: [
        { value: 24, suffix: "/7", label: "Always Available" },
        { value: 2, suffix: "", label: "Languages (EN + ES)" },
        { value: 30, suffix: "s", label: "Avg Response Time" },
      ],
    },
    pricing: {
      label: "Pricing",
      h2: "One price. Everything included.",
      price: "$497",
      period: "/month",
      perDay: "$16/day",
      sub: "Everything included. No per-minute charges. No hidden fees.",
      features: [
        "Unlimited calls",
        "Bilingual EN/ES",
        "Appointment booking",
        "SMS notifications",
        "Full dashboard",
        "Emergency detection",
        "7 AI agents working for your business",
      ],
      comparison: "vs. $3,000+/month for a bilingual receptionist",
      cta: "Hire Your Receptionist",
      guarantee: "Interview her yourself — free for 14 days. Cancel anytime.",
    },
    faq: {
      label: "Frequently Asked Questions",
      h2: "Got questions? We've got answers.",
      items: [
        { q: "Will my callers know they're talking to AI?", a: "Your receptionist is designed to sound natural and warm — like someone who's worked at your business for years. Most callers don't notice." },
        { q: "What happens if there's an emergency?", a: "She detects emergency keywords like 'gas leak', 'burst pipe', or 'flooding' and immediately transfers the call to your emergency contact number." },
        { q: "Can I customize what she says?", a: "Yes! You name her, pick her personality, set your greeting, business hours, services, and train her with custom responses." },
        { q: "Do I need special equipment?", a: "No. Just forward your existing business phone number to her number. Takes 2 minutes." },
        { q: "What if I want to cancel?", a: "Cancel anytime from your dashboard. No contracts, no cancellation fees." },
        { q: "Is my data secure?", a: "Yes. We use encryption, comply with TCPA and data privacy regulations, and never share your data." },
        { q: "Can she book appointments on my calendar?", a: "Yes. She connects to your calendar and books appointments in real-time based on your availability." },
      ],
    },
    cta: {
      h2: "Stop losing calls. Hire your receptionist today.",
      placeholder: "Enter your business email",
      button: "Hire Your Receptionist — 14 Days Free",
      sub: "Setup takes less than 10 minutes. No credit card required to start.",
      sending: "Starting...",
      existsError: "Looks like you already have an account.",
      loginLink: "Log in instead →",
    },
    footer: {
      tagline: "Every call answered. Every job booked.",
      platform: "Platform",
      company: "Company",
      legal: "Legal",
      contact: "Contact",
      bookCall: "Book a Call",
      clientLogin: "Client Login",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      copyright: `© ${new Date().getFullYear()} Calltide. All rights reserved.`,
      builtIn: "Built in Texas",
    },
  },
  es: {
    nav: { login: "Iniciar Sesión", cta: "Contrata Tu Recepcionista" },
    hero: {
      badge: "Recepcionista IA para Servicios del Hogar",
      h1a: "Contrata una Recepcionista Bilingüe",
      h1b: "por $16/día.",
      sub: "Ella contesta cada llamada. Agenda citas. Habla inglés y español. Empieza en 5 minutos.",
      cta: "Contrata Tu Recepcionista — 14 Días Gratis",
      audioLabel: "Escúchala en acción",
      audioSub: "\"Hola, necesito programar un plomero...\"",
      audioDuration: "0:52",
      audioComing: "Demo próximamente",
      trustItems: ["24/7 Cobertura", "Bilingüe EN/ES", "$16/día", "Cancela Cuando Quieras", "Sin Cuota de Instalación"],
    },
    problem: {
      label: "El Problema",
      h2: "Estás perdiendo dinero cada vez que suena el teléfono y nadie contesta.",
      stat1: "Las pequeñas empresas pierden el 62% de las llamadas entrantes",
      stat2: "El 80% de las personas no dejan mensaje de voz — llaman a tu competencia",
      calcTitle: "Calculadora de ROI",
      calcCalls: "¿Cuántas llamadas recibes por semana?",
      calcMiss: "¿Qué porcentaje pierdes?",
      calcValue: "¿Cuál es el valor promedio de un trabajo?",
      calcResult: "Estás perdiendo aproximadamente",
      calcPerMonth: "por mes en llamadas perdidas.",
      calcCta: "Tu recepcionista recupera esos ingresos por $16/día",
    },
    howItWorks: {
      label: "Cómo Funciona",
      h2: "Tres pasos. Cinco minutos.",
      steps: [
        { title: "Contrátala", desc: "Ponle nombre, elige su personalidad y personaliza su saludo." },
        { title: "Redirige tus Llamadas", desc: "Apunta tu línea de negocio a su número. Toma 2 minutos." },
        { title: "Ella se Encarga de Todo", desc: "Agenda citas, toma mensajes, maneja emergencias — en inglés y español." },
      ],
    },
    features: {
      label: "Características",
      h2: "Todo lo que necesitas. Nada que no.",
      cards: [
        { title: "Disponible 24/7", desc: "Tu recepcionista nunca duerme, nunca toma descansos, nunca se enferma." },
        { title: "Verdaderamente Bilingüe", desc: "Inglés y español nativo. No es una traducción — es una conversación real." },
        { title: "Agenda de Citas", desc: "Ella revisa tu calendario y agenda citas en tiempo real." },
        { title: "Confirmaciones por SMS", desc: "Los llamantes reciben confirmación por texto con los detalles de la cita." },
        { title: "Detección de Emergencias", desc: "¿Fuga de gas? ¿Tubería rota? Ella detecta emergencias y transfiere inmediatamente." },
        { title: "Panel Completo", desc: "Ve cada llamada, transcripción, cita y mensaje. Sabe exactamente qué está pasando." },
      ],
    },
    social: {
      label: "Hecho para Negocios de Servicio",
      testimonials: [
        { quote: "Cada llamada perdida es un trabajo perdido. Tu recepcionista se asegura de que eso nunca pase — en inglés o español.", name: "¿Por qué Calltide?", biz: "Recepcionista IA 24/7 para negocios de servicio en Texas" },
        { quote: "Tus clientes llaman una vez. Si nadie contesta, llaman a tu competencia. Ella contesta siempre.", name: "Nunca Pierdas Otra Llamada", biz: "Contesta, agenda, da seguimiento — automáticamente" },
      ],
      stats: [
        { value: 24, suffix: "/7", label: "Siempre Disponible" },
        { value: 2, suffix: "", label: "Idiomas (EN + ES)" },
        { value: 30, suffix: "s", label: "Tiempo de Respuesta" },
      ],
    },
    pricing: {
      label: "Precios",
      h2: "Un precio. Todo incluido.",
      price: "$497",
      period: "/mes",
      perDay: "$16/día",
      sub: "Todo incluido. Sin cargos por minuto. Sin costos ocultos.",
      features: [
        "Llamadas ilimitadas",
        "Bilingüe EN/ES",
        "Agenda de citas",
        "Notificaciones SMS",
        "Panel completo",
        "Detección de emergencias",
        "7 agentes de IA trabajando para tu negocio",
      ],
      comparison: "vs. $3,000+/mes por una recepcionista bilingüe",
      cta: "Contrata Tu Recepcionista",
      guarantee: "Entrevístala tú mismo — gratis por 14 días. Cancela cuando quieras.",
    },
    faq: {
      label: "Preguntas Frecuentes",
      h2: "¿Tienes preguntas? Tenemos respuestas.",
      items: [
        { q: "¿Sabrán mis clientes que están hablando con IA?", a: "Tu recepcionista está diseñada para sonar natural y cálida — como alguien que ha trabajado en tu negocio por años. La mayoría no lo nota." },
        { q: "¿Qué pasa si hay una emergencia?", a: "Ella detecta palabras clave de emergencia como 'fuga de gas', 'tubería rota' o 'inundación' y transfiere la llamada inmediatamente a tu número de emergencia." },
        { q: "¿Puedo personalizar lo que dice?", a: "¡Sí! Le pones nombre, eliges su personalidad, configuras tu saludo, horarios, servicios y la entrenas con respuestas personalizadas." },
        { q: "¿Necesito equipo especial?", a: "No. Solo redirige tu número de negocio existente a su número. Toma 2 minutos." },
        { q: "¿Qué pasa si quiero cancelar?", a: "Cancela en cualquier momento desde tu panel. Sin contratos, sin cuotas de cancelación." },
        { q: "¿Mis datos están seguros?", a: "Sí. Usamos encriptación, cumplimos con TCPA y regulaciones de privacidad, y nunca compartimos tus datos." },
        { q: "¿Puede agendar citas en mi calendario?", a: "Sí. Ella se conecta a tu calendario y agenda citas en tiempo real basándose en tu disponibilidad." },
      ],
    },
    cta: {
      h2: "Deja de perder llamadas. Contrata a tu recepcionista hoy.",
      placeholder: "Ingresa tu correo de negocio",
      button: "Contrata Tu Recepcionista — 14 Días Gratis",
      sub: "La configuración toma menos de 10 minutos. No se requiere tarjeta de crédito.",
      sending: "Iniciando...",
      existsError: "Parece que ya tienes una cuenta.",
      loginLink: "Inicia sesión →",
    },
    footer: {
      tagline: "Cada llamada contestada. Cada trabajo agendado.",
      platform: "Plataforma",
      company: "Empresa",
      legal: "Legal",
      contact: "Contacto",
      bookCall: "Agendar Llamada",
      clientLogin: "Portal de Clientes",
      terms: "Términos de Servicio",
      privacy: "Política de Privacidad",
      copyright: `© ${new Date().getFullYear()} Calltide. Todos los derechos reservados.`,
      builtIn: "Hecho en Texas",
    },
  },
};

/* ═══════════════════════════════════════════════════════════════
   SVG ICONS
   ═══════════════════════════════════════════════════════════════ */

function IconGlobe({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
function IconCalendar({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconClipboard({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
    </svg>
  );
}
function IconAlertTriangle({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function IconMessageCircle({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
function IconBarChart({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}
function IconPhone({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}
function IconHeadset({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

const FEATURE_ICONS = [IconGlobe, IconGlobe, IconCalendar, IconMessageCircle, IconAlertTriangle, IconBarChart];
const STEP_ICONS = [IconClipboard, IconPhone, IconHeadset];

/* ═══════════════════════════════════════════════════════════════
   UTILITY COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function SpotlightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div ref={cardRef} className={`relative overflow-hidden ${className}`} onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300" style={{ opacity: isHovered ? 1 : 0, background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.06), transparent 40%)` }} />
      {children}
    </div>
  );
}

function Counter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`);

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, motionVal, value]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("visible"); }); },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    const timeout = setTimeout(() => { document.querySelectorAll(".reveal:not(.visible)").forEach((el) => el.classList.add("visible")); }, 3000);
    return () => { observer.disconnect(); clearTimeout(timeout); };
  }, []);
}

/* ═══════════════════════════════════════════════════════════════
   ROI CALCULATOR
   ═══════════════════════════════════════════════════════════════ */

function ROICalculator({ lang }: { lang: Lang }) {
  const t = T[lang].problem;
  const [calls, setCalls] = useState(30);
  const [missRate, setMissRate] = useState(40);
  const [jobValue, setJobValue] = useState(350);

  const monthlyLoss = Math.round(calls * (missRate / 100) * jobValue * 4.33);

  return (
    <div className="reveal mt-16 mx-auto max-w-xl">
      <div className="card-shadow rounded-xl border border-cream-border bg-white p-8 sm:p-10">
        <h3 className="text-xl font-extrabold tracking-tight text-charcoal">{t.calcTitle}</h3>

        <div className="mt-6 space-y-6">
          <div>
            <label className="flex justify-between text-sm font-medium text-charcoal-muted">
              <span>{t.calcCalls}</span>
              <span className="font-bold text-charcoal">{calls}</span>
            </label>
            <input type="range" min={5} max={100} step={1} value={calls} onChange={(e) => setCalls(+e.target.value)}
              className="mt-2 w-full accent-amber" />
          </div>

          <div>
            <label className="flex justify-between text-sm font-medium text-charcoal-muted">
              <span>{t.calcMiss}</span>
              <span className="font-bold text-charcoal">{missRate}%</span>
            </label>
            <input type="range" min={10} max={80} step={5} value={missRate} onChange={(e) => setMissRate(+e.target.value)}
              className="mt-2 w-full accent-amber" />
          </div>

          <div>
            <label className="flex justify-between text-sm font-medium text-charcoal-muted">
              <span>{t.calcValue}</span>
              <span className="font-bold text-charcoal">${jobValue}</span>
            </label>
            <input type="range" min={100} max={2000} step={50} value={jobValue} onChange={(e) => setJobValue(+e.target.value)}
              className="mt-2 w-full accent-amber" />
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-navy p-6 text-center">
          <p className="text-sm text-slate-400">{t.calcResult}</p>
          <p className="mt-1 text-[40px] font-extrabold tracking-tight text-white">
            ${monthlyLoss.toLocaleString()}
          </p>
          <p className="text-sm text-slate-400">{t.calcPerMonth}</p>
        </div>

        <a
          href="#signup"
          className="cta-gold cta-shimmer mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-base font-semibold text-white"
        >
          {t.calcCta}
        </a>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FAQ ACCORDION
   ═══════════════════════════════════════════════════════════════ */

function FAQ({ lang }: { lang: Lang }) {
  const t = T[lang].faq;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-2xl divide-y divide-cream-border">
      {t.items.map((faq, i) => (
        <div key={i} className="faq-item">
          <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="flex w-full items-center justify-between py-6 text-left">
            <span className="pr-4 text-lg font-semibold text-charcoal">{faq.q}</span>
            <span className={`faq-plus shrink-0 text-xl font-bold transition-all duration-300 ${openIndex === i ? "text-amber" : "text-charcoal-light"}`}>
              {openIndex === i ? "\u2212" : "+"}
            </span>
          </button>
          <div className={`faq-answer ${openIndex === i ? "open" : ""}`}>
            <div><p className="pb-6 text-base leading-[1.7] text-charcoal-muted">{faq.a}</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIGNUP FORM
   ═══════════════════════════════════════════════════════════════ */

function SignupForm({ lang, plan = "monthly" }: { lang: Lang; plan?: "monthly" | "annual" }) {
  const t = T[lang].cta;
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exists, setExists] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setError(null);
    setExists(false);
    setLoading(true);

    try {
      // Step 1: Validate email
      const startRes = await fetch("/api/signup/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (startRes.status === 409) {
        setExists(true);
        setLoading(false);
        return;
      }

      if (!startRes.ok) {
        const data = await startRes.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong");
      }

      // Step 2: Create Stripe Checkout
      const checkoutRes = await fetch("/api/signup/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), plan }),
      });

      if (!checkoutRes.ok) {
        const data = await checkoutRes.json().catch(() => null);
        throw new Error(data?.error || "Failed to create checkout session");
      }

      const { url } = await checkoutRes.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => { setEmail(e.target.value); setExists(false); setError(null); }}
        placeholder={t.placeholder}
        className="flex-1 rounded-lg border border-white/20 bg-white/10 px-5 py-4 text-base text-white placeholder-white/40 backdrop-blur-sm focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
      />
      <button
        type="submit"
        disabled={loading}
        className="cta-gold cta-shimmer shrink-0 rounded-lg px-8 py-4 text-base font-semibold text-white disabled:opacity-50"
      >
        {loading ? t.sending : t.button}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD MOCKUP
   ═══════════════════════════════════════════════════════════════ */

function DashboardMockup() {
  const mockCalls = [
    { name: "Maria G.", time: "9:14 AM", status: "Booked", service: "AC Repair", lang: "ES" },
    { name: "James T.", time: "10:32 AM", status: "Booked", service: "Pipe Leak", lang: "EN" },
    { name: "Roberto S.", time: "11:45 AM", status: "Callback", service: "Estimate", lang: "ES" },
    { name: "Jennifer K.", time: "1:08 PM", status: "Booked", service: "AC Install", lang: "EN" },
    { name: "David L.", time: "2:51 PM", status: "Voicemail", service: "\u2014", lang: "EN" },
    { name: "Sofia M.", time: "4:22 PM", status: "Booked", service: "Drain Clean", lang: "ES" },
  ];
  const statusStyle: Record<string, string> = {
    Booked: "bg-green-500/10 text-green-400",
    Callback: "bg-blue-500/10 text-blue-400",
    Voicemail: "bg-slate-500/10 text-slate-400",
  };

  return (
    <div className="h-full w-full bg-slate-950 p-3 text-[10px] overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-green-500">Calltide</span>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[8px] text-slate-400">PORTAL</span>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 mb-3">
        <div className="text-center"><p className="text-sm font-bold text-slate-100">23</p><p className="text-[7px] text-slate-500">Calls</p></div>
        <div className="h-6 w-px bg-slate-800" />
        <div className="text-center"><p className="text-sm font-bold text-green-400">18</p><p className="text-[7px] text-slate-500">Booked</p></div>
        <div className="h-6 w-px bg-slate-800" />
        <div className="text-center"><p className="text-sm font-bold text-amber">$4.2k</p><p className="text-[7px] text-slate-500">Revenue</p></div>
      </div>
      <p className="text-[9px] font-medium text-slate-400 mb-1.5">Recent Calls</p>
      <div className="space-y-1">
        {mockCalls.map((call, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-slate-900 px-2 py-1.5">
            <div className="min-w-0">
              <p className="text-[9px] font-medium text-slate-200 truncate">{call.name}</p>
              <p className="text-[8px] text-slate-500">{call.time} &middot; {call.service}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className={`rounded-full px-1.5 py-0.5 text-[7px] font-medium ${statusStyle[call.status] ?? "bg-slate-500/10 text-slate-400"}`}>{call.status}</span>
              <span className="text-[7px] text-slate-500">{call.lang}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE CTA
   ═══════════════════════════════════════════════════════════════ */

function MobileCTA({ lang }: { lang: Lang }) {
  const t = T[lang].hero;
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    function onScroll() { setShow(window.scrollY > 400); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm px-4 py-3 md:hidden transition-transform duration-300 ${show ? "translate-y-0" : "translate-y-full"}`}>
      <div className="flex items-center gap-2">
        <a href="#signup" className="cta-gold cta-shimmer flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-sm font-bold text-white shadow-lg">
          {t.cta}
        </a>
        <button onClick={() => setDismissed(true)} className="flex h-10 w-10 shrink-0 items-center justify-center text-charcoal-light" aria-label="Dismiss">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [planChoice, setPlanChoice] = useState<"monthly" | "annual">("annual");
  const scrolled = useScrolled();
  useScrollReveal();

  // Persist language preference
  useEffect(() => {
    const saved = localStorage.getItem("calltide-lang");
    if (saved === "en" || saved === "es") setLang(saved);
  }, []);
  const toggleLang = useCallback((l: Lang) => {
    setLang(l);
    localStorage.setItem("calltide-lang", l);
  }, []);

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
            description: "AI receptionist for home service businesses. Answers every call in English and Spanish, 24/7. Books appointments.",
          }),
        }}
      />
      {showVoiceChat && <VoiceChat onClose={() => setShowVoiceChat(false)} />}
      <MobileCTA lang={lang} />

      {/* ── NAVIGATION ── */}
      <nav className={`sticky top-0 z-40 border-b transition-all duration-300 ${scrolled ? "nav-scrolled border-transparent" : "border-cream-border bg-cream"}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 sm:px-8 py-4">
          <img src="/images/logo.webp" alt="Calltide" className="h-7 w-auto sm:h-8" />
          <div className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">
              {t.howItWorks.label}
            </a>
            <a href="#features" className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">
              {t.features.label}
            </a>
            <a href="#pricing" className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">
              {t.pricing.label}
            </a>
            <a href="#faq" className="text-sm font-medium text-charcoal-muted transition hover:text-charcoal">
              {t.faq.label.split(" ")[0]}
            </a>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <div className="flex rounded-full overflow-hidden text-xs font-semibold" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
              <button onClick={() => toggleLang("en")} className={`px-3 py-1.5 transition ${lang === "en" ? "bg-navy text-white" : "text-charcoal-muted hover:bg-cream-dark"}`}>EN</button>
              <button onClick={() => toggleLang("es")} className={`px-3 py-1.5 transition ${lang === "es" ? "bg-navy text-white" : "text-charcoal-muted hover:bg-cream-dark"}`}>ES</button>
            </div>
            <a href="/dashboard/login" className="hidden text-sm font-medium text-charcoal-muted transition hover:text-charcoal sm:inline-block">
              {t.nav.login}
            </a>
            <a href="#signup" className="cta-shimmer hidden items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light sm:inline-flex">
              {t.nav.cta}
            </a>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="flex h-10 w-10 items-center justify-center rounded-lg text-charcoal md:hidden" aria-label="Menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>}
              </svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-cream-border bg-white px-6 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-charcoal-muted">{t.howItWorks.label}</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-charcoal-muted">{t.features.label}</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-charcoal-muted">{t.pricing.label}</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-charcoal-muted">FAQ</a>
              <a href="/dashboard/login" className="text-sm font-medium text-charcoal-muted">{t.nav.login}</a>
              <a href="#signup" onClick={() => setMobileMenuOpen(false)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white">{t.nav.cta}</a>
            </div>
          </div>
        )}
      </nav>

      {/* ── 1. HERO ── */}
      <section className="relative overflow-hidden grain-overlay">
        <img src="/images/grit-hvac.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-center" fetchPriority="high" />
        <div className="hero-bg-overlay absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8 py-24 sm:py-32">
          <div className="grid items-center gap-16 md:grid-cols-5">
            <div className="md:col-span-3">
              <div className="flex items-center gap-2 mb-6">
                <span className="status-dot" />
                <span className="text-xs font-medium tracking-wide text-slate-400">{lang === "en" ? "Answering calls right now" : "Contestando llamadas ahora"}</span>
              </div>
              <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-amber">{t.hero.badge}</p>
              <h1 className="mt-6 text-[clamp(40px,5.5vw,72px)] font-extrabold leading-[1.05] tracking-tight text-white">
                {t.hero.h1a}
                <br />
                <span className="gold-gradient-text">{t.hero.h1b}</span>
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

              {/* Audio Demo Player */}
              <div className="mt-10 ambient-edge rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowVoiceChat(true)}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber text-white transition hover:bg-amber-dark"
                    aria-label={t.hero.audioLabel}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21" /></svg>
                  </button>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-white">{t.hero.audioLabel}</p>
                    <p className="text-xs text-slate-400">{t.hero.audioSub}</p>
                    <div className="mt-3 flex items-end gap-[3px] h-6">
                      {[35, 60, 45, 80, 55, 70, 40, 85, 50, 75, 60, 35, 70, 45, 80, 55, 65, 40, 75, 50, 60, 45, 70, 55].map((h, i) => (
                        <div key={i} className="waveform-bar w-[3px] rounded-full bg-amber/30" style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs tabular-nums text-slate-500">{t.hero.audioDuration}</span>
                </div>
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

            <div className="md:col-span-2 relative hidden md:block">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(212,145,10,0.15),transparent_70%)]" />
              <div className="phone-mockup-premium phone-mockup-glow relative mx-auto w-[280px] rounded-[2.5rem] border-[6px] border-slate-700 bg-black p-2">
                <div role="img" aria-label="Calltide client portal" className="overflow-hidden rounded-[2rem]" style={{ aspectRatio: "600/1053" }}>
                  <DashboardMockup />
                </div>
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
              <p className="mt-3 text-base leading-[1.7] text-charcoal-muted">{t.problem.stat2}</p>
            </div>
          </div>

          <ROICalculator lang={lang} />
        </div>
      </section>

      {/* ── 3. HOW IT WORKS ── */}
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

      {/* ── 4. FEATURES GRID ── */}
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

      {/* ── 5. SOCIAL PROOF ── */}
      <section className="bg-[#FBFBFC] px-6 sm:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-charcoal-light">{t.social.label}</p>
          </div>

          {/* Placeholder stats — update with real numbers */}
          <div className="snap-scroll-mobile mt-12 grid gap-8 sm:grid-cols-3">
            {t.social.stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="card-shadow card-hover rounded-xl border border-cream-border bg-white p-10 text-center"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="gold-gradient-text text-[48px] font-extrabold">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-sm font-semibold text-charcoal">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Placeholder testimonials — replace with real client quotes */}
          <div className="reveal mt-12 grid gap-8 sm:grid-cols-2">
            {t.social.testimonials.map((test, i) => (
              <div key={i} className="card-shadow card-hover rounded-xl border border-cream-border bg-white p-10">
                <p className="text-lg leading-[1.7] text-charcoal-muted italic">&ldquo;{test.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/10 text-sm font-bold text-amber">
                    {test.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal">{test.name}</p>
                    <p className="text-sm text-charcoal-muted">{test.biz}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. PRICING ── */}
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
                background: planChoice === "monthly" ? "#C8AA6E" : "transparent",
                color: planChoice === "monthly" ? "#0f0f0f" : "#A0A3A8",
                border: planChoice === "monthly" ? "1px solid #C8AA6E" : "1px solid rgba(255,255,255,0.15)",
              }}
            >
              {lang === "en" ? "Monthly" : "Mensual"}
            </button>
            <button
              onClick={() => setPlanChoice("annual")}
              className="relative rounded-full px-5 py-2 text-sm font-semibold transition"
              style={{
                background: planChoice === "annual" ? "#C8AA6E" : "transparent",
                color: planChoice === "annual" ? "#0f0f0f" : "#A0A3A8",
                border: planChoice === "annual" ? "1px solid #C8AA6E" : "1px solid rgba(255,255,255,0.15)",
              }}
            >
              {lang === "en" ? "Annual" : "Anual"}
              <span className="absolute -top-2.5 -right-2 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                {lang === "en" ? "Save 20%" : "-20%"}
              </span>
            </button>
          </div>

          <div className="reveal mt-8 mx-auto max-w-lg">
            <div className="pricing-glow ambient-edge relative rounded-xl border-2 border-[#C8AA6E] bg-[#1A1D0F] p-10 text-center sm:p-14">
              <p className="mt-2 text-[56px] font-extrabold tracking-tight text-[#E8E9EB]">
                {planChoice === "annual" ? "$397" : "$497"}
              </p>
              <p className="text-sm text-[#A0A3A8]">
                {planChoice === "annual"
                  ? (lang === "en" ? "/mo — billed annually at $4,764/yr" : "/mes — facturado anualmente a $4,764/año")
                  : t.pricing.period}
              </p>
              {planChoice !== "annual" && (
                <p className="mt-1 text-xs text-[#C8AA6E]">
                  {t.pricing.perDay}
                </p>
              )}
              {planChoice === "annual" && (
                <p className="mt-2 text-sm font-semibold text-green-400">
                  {lang === "en" ? "Save $1,200/year" : "Ahorra $1,200/año"}
                </p>
              )}
              <p className="mt-4 text-base text-[#A0A3A8]">{t.pricing.sub}</p>

              <ul className="mt-8 space-y-4 text-left text-sm text-[#E8E9EB]">
                {t.pricing.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#C8AA6E]">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>

              <p className="mt-8 text-sm italic text-[#A0A3A8]">{t.pricing.comparison}</p>

              <a href="#signup" className="cta-gold cta-shimmer mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold text-white">
                {t.pricing.cta} &rarr;
              </a>

              <p className="mt-4 text-xs text-[#A0A3A8]">{t.pricing.guarantee}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. FAQ ── */}
      <section id="faq" className="relative bg-[#FBFBFC] px-6 sm:px-8 py-24 sm:py-32 overflow-hidden">
        <div className="mx-auto max-w-3xl">
          <div className="reveal text-center">
            <h2 className="text-[36px] font-extrabold leading-[1.1] tracking-tight text-charcoal sm:text-[48px]">
              {t.faq.h2}
            </h2>
            {/* FAQ Language Toggle */}
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

      {/* ── 8. FINAL CTA + SIGNUP ── */}
      <section id="signup" className="relative px-6 sm:px-8 py-24 sm:py-32 overflow-hidden dark-section grain-overlay">
        <img src="/images/grit-texture.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-center" loading="lazy" />
        <div className="grit-overlay-cta absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="reveal text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[40px] lg:text-[48px]">
            {t.cta.h2}
          </h2>

          <SignupForm lang={lang} plan={planChoice} />

          {/* Show "already have account" and error inline */}
          <SignupStatus lang={lang} />

          <p className="mt-6 text-sm text-slate-400">{t.cta.sub}</p>
          <p className="mt-4 text-sm text-slate-500">
            {lang === "en" ? "Or hear Maria first:" : "O escucha a María primero:"}{" "}
            <a href={PHONE_TEL} className="font-semibold text-amber hover:underline">{PHONE}</a>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-charcoal px-6 sm:px-8 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <img src="/images/logo.webp" alt="Calltide" className="h-7 w-auto brightness-0 invert opacity-70" />
              <p className="mt-4 text-sm text-white/40">{t.footer.tagline}</p>
            </div>
            <div>
              <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-white/50">{t.footer.platform}</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a href="#features" className="text-white/40 transition hover:text-white/60">{t.features.label}</a></li>
                <li><a href="#how-it-works" className="text-white/40 transition hover:text-white/60">{t.howItWorks.label}</a></li>
                <li><a href="#pricing" className="text-white/40 transition hover:text-white/60">{t.pricing.label}</a></li>
                <li><a href="#faq" className="text-white/40 transition hover:text-white/60">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-white/50">{t.footer.company}</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a href="mailto:hello@calltide.app" className="text-white/40 transition hover:text-white/60">{t.footer.contact}</a></li>
                <li><a href="/dashboard/login" className="text-white/40 transition hover:text-white/60">{t.footer.clientLogin}</a></li>
                <li><a href="/blog" className="text-white/40 transition hover:text-white/60">Blog</a></li>
                <li><a href="/help" className="text-white/40 transition hover:text-white/60">Help</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-white/50">{t.footer.legal}</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li><a href="/legal/terms" className="text-white/40 transition hover:text-white/60">{t.footer.terms}</a></li>
                <li><a href="/legal/privacy" className="text-white/40 transition hover:text-white/60">{t.footer.privacy}</a></li>
                <li><a href="/status" className="text-white/40 transition hover:text-white/60">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-14 flex flex-col items-center gap-3 border-t border-white/10 pt-8 text-center text-sm sm:flex-row sm:justify-between sm:text-left">
            <p className="text-white/30">{t.footer.copyright}</p>
            <p className="text-white/30">{t.footer.builtIn}</p>
          </div>
        </div>
      </footer>

      <div className="h-16 md:hidden" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIGNUP STATUS (renders under form)
   ═══════════════════════════════════════════════════════════════ */

function SignupStatus({ lang }: { lang: Lang }) {
  // This reads URL params for post-Stripe-cancel feedback
  const [canceled, setCanceled] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("canceled=true")) {
      setCanceled(true);
    }
  }, []);

  if (!canceled) return null;

  return (
    <p className="mt-4 text-sm text-amber">
      {lang === "en" ? "Checkout was canceled. Try again when you're ready!" : "Se canceló el checkout. Intenta de nuevo cuando estés listo."}
    </p>
  );
}
