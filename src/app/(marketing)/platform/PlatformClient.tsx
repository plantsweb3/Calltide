"use client";

import { useState, useCallback } from "react";
import { PHONE, PHONE_TEL, BOOKING_URL } from "@/lib/marketing/translations";
import type { Lang } from "@/lib/marketing/translations";

/* ── Lucide-style SVG icons ── */
const icons = {
  phone: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.81.36 1.6.7 2.35a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.75.34 1.54.57 2.35.7A2 2 0 0122 16.92z" /></svg>
  ),
  globe: (p: IconProps) => (
    <svg {...svgProps(p)}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
  ),
  alert: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  ),
  moon: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
  ),
  mic: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
  ),
  userCheck: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>
  ),
  smile: (p: IconProps) => (
    <svg {...svgProps(p)}><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
  ),
  fileText: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
  ),
  calendar: (p: IconProps) => (
    <svg {...svgProps(p)}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
  ),
  message: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
  ),
  bell: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
  ),
  users: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
  ),
  kanban: (p: IconProps) => (
    <svg {...svgProps(p)}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 7v4" /><path d="M12 7v8" /><path d="M16 7v2" /></svg>
  ),
  brain: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96.44A2.5 2.5 0 015 17.5a2.5 2.5 0 01.49-4.89A2.5 2.5 0 014.5 9a2.5 2.5 0 012-4.45A2.5 2.5 0 019.5 2z" /><path d="M14.5 2A2.5 2.5 0 0012 4.5v15a2.5 2.5 0 004.96.44A2.5 2.5 0 0019 17.5a2.5 2.5 0 00-.49-4.89A2.5 2.5 0 0019.5 9a2.5 2.5 0 00-2-4.45A2.5 2.5 0 0014.5 2z" /></svg>
  ),
  star: (p: IconProps) => (
    <svg {...svgProps(p)}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
  ),
  layout: (p: IconProps) => (
    <svg {...svgProps(p)}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
  ),
  gift: (p: IconProps) => (
    <svg {...svgProps(p)}><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" /></svg>
  ),
  activity: (p: IconProps) => (
    <svg {...svgProps(p)}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
  ),
  shield: (p: IconProps) => (
    <svg {...svgProps(p)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
  ),
  lock: (p: IconProps) => (
    <svg {...svgProps(p)}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
  ),
};

type IconProps = { size?: number; className?: string };
function svgProps({ size = 24, className = "" }: IconProps) {
  return { className, width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
}

/* ── Additional icons for new categories ── */
const iconPhoneMissed = (p: IconProps) => (
  <svg {...svgProps(p)}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);
const iconCalculator = (p: IconProps) => (
  <svg {...svgProps(p)}><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="8" y2="10.01" /><line x1="12" y1="10" x2="12" y2="10.01" /><line x1="16" y1="10" x2="16" y2="10.01" /><line x1="8" y1="14" x2="8" y2="14.01" /><line x1="12" y1="14" x2="12" y2="14.01" /><line x1="16" y1="14" x2="16" y2="14.01" /><line x1="8" y1="18" x2="16" y2="18" /></svg>
);
const iconCamera = (p: IconProps) => (
  <svg {...svgProps(p)}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
);
const iconSmartphone = (p: IconProps) => (
  <svg {...svgProps(p)}><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
);
const iconRefreshCw = (p: IconProps) => (
  <svg {...svgProps(p)}><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
);
const iconTrendingUp = (p: IconProps) => (
  <svg {...svgProps(p)}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
);
const iconMail = (p: IconProps) => (
  <svg {...svgProps(p)}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
);
const iconUpload = (p: IconProps) => (
  <svg {...svgProps(p)}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
);
const iconPhoneOutgoing = (p: IconProps) => (
  <svg {...svgProps(p)}><polyline points="23 7 23 1 17 1" /><line x1="16" y1="8" x2="23" y2="1" /><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.81.36 1.6.7 2.35a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.75.34 1.54.57 2.35.7A2 2 0 0122 16.92z" /></svg>
);
const iconMapPin = (p: IconProps) => (
  <svg {...svgProps(p)}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
);

/* ── Bilingual content ── */
const T = {
  en: {
    heroLabel: "Platform",
    heroH1: "The Complete AI Front Office",
    heroSub: "Every feature you need to answer calls, generate estimates, recover missed calls, and grow your business.",
    tradeLabel: "See It In Action",
    tradeH2: "How Maria Handles Real Calls",
    trades: [
      { trade: "Plumbing", emoji: "\u{1F527}", scenario: "\"I've got water leaking from under the kitchen sink.\" Maria collects the address, asks for photos, generates a $250\u2013$400 estimate for a supply line repair, and texts it to the owner for one-tap approval." },
      { trade: "HVAC", emoji: "\u2744\uFE0F", scenario: "\"My AC stopped cooling and it's 95 degrees.\" Maria flags the urgency, collects the unit age and model, generates a diagnostic visit estimate, and books the next available slot on the owner's calendar." },
      { trade: "Electrical", emoji: "\u26A1", scenario: "\"Half my outlets stopped working after the storm.\" Maria asks about the panel and breaker status, generates an estimate for a circuit troubleshoot, and sends the owner a text with photos the caller took of the panel." },
      { trade: "Roofing", emoji: "\u{1F3E0}", scenario: "\"I've got a leak in my attic after the rain.\" Maria collects the roof age, damage area, and insurance info, generates an inspection estimate, and schedules a visit \u2014 all within the same call." },
    ],
    ctaH2: "Everything included. One plan. $497/month.",
    ctaSub: "No tiers, no upsells. Everything on this page is included.",
    ctaPricing: "See Pricing",
    ctaGet: "Get Calltide",
    ctaCall: "Or call Maria:",
    screenshot: "Platform screenshot",
    categories: [
      {
        id: "revenue", label: "Revenue Recovery", icon: iconPhoneMissed,
        features: [
          { icon: iconPhoneMissed, title: "Missed Call Recovery SMS", desc: "When a caller hangs up, Maria auto-texts them within 60 seconds to bring them back. Recovers jobs that would otherwise go to competitors." },
          { icon: icons.fileText, title: "AI Job Intake", desc: "Maria asks the right questions \u2014 problem type, property address, urgency, photos \u2014 and creates a complete job card automatically." },
          { icon: iconCalculator, title: "AI Estimate Generation", desc: "Based on job details and your pricing rules, Maria generates a price range on the call and texts it to the customer for review." },
          { icon: iconCamera, title: "Job Cards with Photo Intake", desc: "Callers text photos of the job site. Images attach to the job card alongside all details, giving you full context before arriving." },
          { icon: iconSmartphone, title: "Owner Response Loop", desc: "You get a text with the job summary and estimate. Approve, adjust, or decline with one tap \u2014 the customer is notified instantly." },
          { icon: iconRefreshCw, title: "Estimate Follow-Up Automation", desc: "Cold estimates get automatic follow-ups on a schedule you set. Maria re-engages leads that haven't responded." },
        ],
      },
      {
        id: "growth", label: "Growth & Automation", icon: iconTrendingUp,
        features: [
          { icon: iconRefreshCw, title: "Customer Recall", desc: "Automatically re-engage past customers for seasonal maintenance, annual inspections, or follow-up work. Turns one-time jobs into recurring revenue." },
          { icon: icons.star, title: "Google Review Requests", desc: "After a completed job, Maria texts the customer asking for a Google review. Builds your online reputation on autopilot." },
          { icon: iconMail, title: "Weekly Digest", desc: "Your dashboard shows a comprehensive weekly summary \u2014 calls, appointments, estimates, revenue recovered, and key metrics at a glance." },
          { icon: icons.users, title: "Partner Referral Network", desc: "Get referrals from other trades when they can't handle a job. A plumber refers HVAC leads, an electrician refers plumbing leads." },
          { icon: iconPhoneOutgoing, title: "Outbound Call Automation", desc: "Maria makes outbound calls for appointment confirmations, follow-ups, and customer re-engagement \u2014 not just inbound." },
        ],
      },
      {
        id: "calls", label: "Calls & Voice", icon: icons.phone,
        features: [
          { icon: icons.phone, title: "24/7 Bilingual Answering", desc: "Every call answered in English or Spanish. Auto-detects the caller's language \u2014 no phone menus, no press-1-for-English." },
          { icon: icons.userCheck, title: "Returning Caller Recognition", desc: "Recognizes repeat callers automatically. Greets them by context and picks up where the last conversation left off." },
          { icon: icons.alert, title: "Emergency Detection + Live Transfer", desc: "Detects emergency keywords like 'gas leak' or 'flooding' and immediately transfers the call to your emergency number." },
          { icon: icons.moon, title: "After-Hours Intelligent Routing", desc: "Different behavior for business hours vs. nights and weekends. Takes messages, books next-day appointments, or transfers urgencies." },
          { icon: icons.smile, title: "Custom Greetings & Personality", desc: "Name her, choose her personality (friendly, professional, warm), set preferred phrases, and define off-limits topics." },
          { icon: icons.fileText, title: "Recordings + Transcripts", desc: "Full audio recording and AI-generated transcript for every call. Searchable, filterable, and exportable from your dashboard." },
        ],
      },
      {
        id: "scheduling", label: "Scheduling", icon: icons.calendar,
        features: [
          { icon: icons.calendar, title: "Appointment Management", desc: "Maria books, reschedules, and cancels appointments through natural conversation. Your schedule stays organized without any manual entry." },
          { icon: icons.mic, title: "Voice Booking", desc: "Callers book appointments naturally through conversation \u2014 no app downloads, no online forms, no hold music." },
          { icon: icons.message, title: "SMS Confirmations", desc: "Instant text confirmation sent to the caller with appointment details, your business info, and the service address." },
          { icon: icons.bell, title: "Appointment Reminders", desc: "Automated outbound reminders reduce no-shows. Sent via SMS at configurable intervals before the appointment." },
        ],
      },
      {
        id: "tools", label: "Business Tools", icon: icons.kanban,
        features: [
          { icon: icons.users, title: "Auto-Populated CRM", desc: "Every caller becomes a customer record automatically. Phone, name, call history, appointments, and notes \u2014 all in one place." },
          { icon: icons.kanban, title: "Estimate Pipeline", desc: "Track every estimate from request to signed. See status, follow-up history, and close rates across all your jobs." },
          { icon: icons.brain, title: "AI-Powered Call Summaries", desc: "Claude AI reads the transcript and generates a concise summary with action items. Know what happened without listening to the call." },
          { icon: iconUpload, title: "CSV Import", desc: "Import your existing customer database from any CRM or spreadsheet. Calltide maps the fields and gives Maria full context from day one." },
        ],
      },
      {
        id: "ops", label: "Operations", icon: icons.layout,
        features: [
          { icon: icons.layout, title: "Dashboard + Analytics", desc: "Real-time metrics: calls answered, appointments booked, revenue recovered, response times, and trends over time." },
          { icon: icons.gift, title: "Referral Program ($497 Credit)", desc: "Refer another business and earn a full month free ($497 credit). They get 50% off their first month." },
          { icon: iconMapPin, title: "Multi-Location Support", desc: "Manage multiple business locations from one account. Each location gets its own number, settings, and reporting." },
          { icon: icons.activity, title: "Status Page + Incident Engine", desc: "Public status page shows real-time service health. Automatic incident detection, escalation, and postmortem generation." },
        ],
      },
      {
        id: "compliance", label: "Compliance", icon: icons.shield,
        features: [
          { icon: icons.shield, title: "You're Protected", desc: "Calltide handles the legal stuff \u2014 GDPR, CCPA, and TCPA compliance built in so you don't have to think about it." },
          { icon: icons.mic, title: "Call Recording Notices", desc: "Every call starts with a recording disclosure so you're always covered. Configurable by state." },
          { icon: icons.lock, title: "Your Data Is Secure", desc: "Encrypted connections, secure login, and strict access controls. Your business data and customer info stay private." },
        ],
      },
    ],
  },
  es: {
    heroLabel: "Plataforma",
    heroH1: "La Oficina IA Completa",
    heroSub: "Todo lo que necesitas para contestar llamadas, generar presupuestos, recuperar llamadas perdidas y hacer crecer tu negocio.",
    tradeLabel: "Míralo en Acción",
    tradeH2: "Cómo Maria Maneja Llamadas Reales",
    trades: [
      { trade: "Plomería", emoji: "\u{1F527}", scenario: "\"Tengo una fuga de agua debajo del fregadero.\" Maria recopila la dirección, pide fotos, genera un presupuesto de $250\u2013$400 para reparación de tubería, y se lo envía al dueño para aprobación con un toque." },
      { trade: "Aire Acondicionado", emoji: "\u2744\uFE0F", scenario: "\"Mi aire acondicionado dejó de enfriar y estamos a 35 grados.\" Maria marca la urgencia, recopila la edad y modelo del equipo, genera un presupuesto de diagnóstico, y agenda la siguiente cita disponible." },
      { trade: "Electricidad", emoji: "\u26A1", scenario: "\"La mitad de mis enchufes dejaron de funcionar después de la tormenta.\" Maria pregunta sobre el panel y los breakers, genera un presupuesto para diagnóstico de circuito, y envía al dueño las fotos del panel." },
      { trade: "Techos", emoji: "\u{1F3E0}", scenario: "\"Tengo una gotera en el ático después de la lluvia.\" Maria recopila la edad del techo, el área dañada y la info del seguro, genera un presupuesto de inspección, y agenda una visita \u2014 todo en la misma llamada." },
    ],
    ctaH2: "Todo incluido. Un plan. $497/mes.",
    ctaSub: "Sin niveles, sin ventas adicionales. Todo en esta página está incluido.",
    ctaPricing: "Ver Precios",
    ctaGet: "Obtén Calltide",
    ctaCall: "O llama a Maria:",
    screenshot: "Captura de la plataforma",
    categories: [
      {
        id: "revenue", label: "Recuperación de Ingresos", icon: iconPhoneMissed,
        features: [
          { icon: iconPhoneMissed, title: "SMS de Llamadas Perdidas", desc: "Cuando un llamante cuelga, Maria le envía un texto en 60 segundos para traerlo de vuelta. Recupera trabajos que de otra forma irían a la competencia." },
          { icon: icons.fileText, title: "Intake de Trabajo IA", desc: "Maria hace las preguntas correctas \u2014 tipo de problema, dirección, urgencia, fotos \u2014 y crea una tarjeta de trabajo completa automáticamente." },
          { icon: iconCalculator, title: "Generación de Presupuestos IA", desc: "Basándose en los detalles del trabajo y tus reglas de precios, Maria genera un rango de precio en la llamada y se lo envía al cliente." },
          { icon: iconCamera, title: "Tarjetas de Trabajo con Fotos", desc: "Los llamantes envían fotos del sitio por texto. Las imágenes se adjuntan a la tarjeta de trabajo con todos los detalles, dándote contexto completo." },
          { icon: iconSmartphone, title: "Respuesta del Dueño", desc: "Recibes un texto con el resumen del trabajo y presupuesto. Aprueba, ajusta o rechaza con un toque \u2014 el cliente es notificado al instante." },
          { icon: iconRefreshCw, title: "Seguimiento de Presupuestos", desc: "Los presupuestos fríos reciben seguimiento automático en el horario que configures. Maria vuelve a contactar leads que no respondieron." },
        ],
      },
      {
        id: "growth", label: "Crecimiento y Automatización", icon: iconTrendingUp,
        features: [
          { icon: iconRefreshCw, title: "Reactivación de Clientes", desc: "Vuelve a contactar clientes anteriores para mantenimiento estacional, inspecciones anuales o trabajo de seguimiento. Convierte trabajos únicos en ingresos recurrentes." },
          { icon: icons.star, title: "Solicitud de Reseñas en Google", desc: "Después de un trabajo completado, Maria envía un texto al cliente pidiendo una reseña en Google. Construye tu reputación en piloto automático." },
          { icon: iconMail, title: "Resumen Semanal", desc: "Tu panel muestra un resumen semanal completo \u2014 llamadas, citas, presupuestos, ingresos recuperados y métricas clave." },
          { icon: icons.users, title: "Red de Referidos entre Oficios", desc: "Recibe referidos de otros oficios cuando no pueden manejar un trabajo. Un plomero refiere leads de HVAC, un electricista refiere leads de plomería." },
          { icon: iconPhoneOutgoing, title: "Llamadas Salientes Automatizadas", desc: "Maria hace llamadas salientes para confirmaciones de citas, seguimientos y reactivación de clientes \u2014 no solo entrantes." },
        ],
      },
      {
        id: "calls", label: "Llamadas y Voz", icon: icons.phone,
        features: [
          { icon: icons.phone, title: "Respuesta Bilingüe 24/7", desc: "Cada llamada contestada en inglés o español. Detecta el idioma automáticamente \u2014 sin menús telefónicos, sin presionar 1 para inglés." },
          { icon: icons.userCheck, title: "Reconocimiento de Llamantes", desc: "Reconoce llamantes repetidos automáticamente. Los saluda por contexto y continúa donde quedó la última conversación." },
          { icon: icons.alert, title: "Detección de Emergencias", desc: "Detecta palabras clave de emergencia como 'fuga de gas' o 'inundación' y transfiere la llamada inmediatamente a tu número de emergencia." },
          { icon: icons.moon, title: "Ruteo Inteligente Fuera de Horario", desc: "Comportamiento diferente para horario laboral vs. noches y fines de semana. Toma mensajes, agenda citas para el día siguiente, o transfiere urgencias." },
          { icon: icons.smile, title: "Saludos y Personalidad", desc: "Ponle nombre, elige su personalidad (amigable, profesional, cálida), configura frases preferidas y temas prohibidos." },
          { icon: icons.fileText, title: "Grabaciones + Transcripciones", desc: "Grabación completa y transcripción generada por IA para cada llamada. Buscable, filtrable y exportable desde tu panel." },
        ],
      },
      {
        id: "scheduling", label: "Agenda", icon: icons.calendar,
        features: [
          { icon: icons.calendar, title: "Gestión de Citas", desc: "Maria agenda, reprograma y cancela citas a través de conversación natural. Tu agenda se mantiene organizada sin entrada manual." },
          { icon: icons.mic, title: "Reserva por Voz", desc: "Los llamantes agendan citas naturalmente por conversación \u2014 sin descargar apps, sin formularios, sin música de espera." },
          { icon: icons.message, title: "Confirmaciones por SMS", desc: "Confirmación por texto instantánea enviada al llamante con detalles de la cita, info de tu negocio y la dirección del servicio." },
          { icon: icons.bell, title: "Recordatorios de Citas", desc: "Recordatorios automáticos reducen las ausencias. Enviados por SMS en intervalos configurables antes de la cita." },
        ],
      },
      {
        id: "tools", label: "Herramientas", icon: icons.kanban,
        features: [
          { icon: icons.users, title: "CRM Automático", desc: "Cada llamante se convierte en un registro de cliente automáticamente. Teléfono, nombre, historial, citas y notas \u2014 todo en un solo lugar." },
          { icon: icons.kanban, title: "Pipeline de Presupuestos", desc: "Rastrea cada presupuesto desde la solicitud hasta la firma. Ve estado, historial de seguimiento y tasas de cierre en todos tus trabajos." },
          { icon: icons.brain, title: "Resúmenes de Llamadas IA", desc: "La IA lee la transcripción y genera un resumen conciso con acciones a tomar. Sabe qué pasó sin escuchar la llamada." },
          { icon: iconUpload, title: "Importación CSV", desc: "Importa tu base de datos de clientes existente desde cualquier CRM o hoja de cálculo. Calltide mapea los campos y le da a Maria contexto completo." },
        ],
      },
      {
        id: "ops", label: "Operaciones", icon: icons.layout,
        features: [
          { icon: icons.layout, title: "Panel + Analíticas", desc: "Métricas en tiempo real: llamadas contestadas, citas agendadas, ingresos recuperados, tiempos de respuesta y tendencias." },
          { icon: icons.gift, title: "Programa de Referidos ($497)", desc: "Refiere otro negocio y gana un mes gratis ($497 de crédito). Ellos reciben 50% de descuento en su primer mes." },
          { icon: iconMapPin, title: "Soporte Multi-Ubicación", desc: "Administra múltiples ubicaciones desde una cuenta. Cada ubicación tiene su propio número, configuración y reportes." },
          { icon: icons.activity, title: "Página de Estado", desc: "Página pública de estado muestra la salud del servicio en tiempo real. Detección automática de incidentes y escalación." },
        ],
      },
      {
        id: "compliance", label: "Cumplimiento", icon: icons.shield,
        features: [
          { icon: icons.shield, title: "Estás Protegido", desc: "Calltide maneja lo legal \u2014 cumplimiento con GDPR, CCPA y TCPA integrado para que no tengas que pensar en eso." },
          { icon: icons.mic, title: "Avisos de Grabación", desc: "Cada llamada comienza con un aviso de grabación para que siempre estés cubierto. Configurable por estado." },
          { icon: icons.lock, title: "Tus Datos Están Seguros", desc: "Conexiones encriptadas, inicio de sesión seguro y controles de acceso estrictos. Tu información de negocio y clientes se mantiene privada." },
        ],
      },
    ],
  },
};

export default function PlatformClient() {
  const [activeTab, setActiveTab] = useState("revenue");
  const [lang, setLang] = useState<Lang>("en");

  // Restore language preference
  useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("calltide-lang");
      if (saved === "en" || saved === "es") setLang(saved);
    }
  });

  const toggleLang = useCallback((l: Lang) => {
    setLang(l);
    if (typeof window !== "undefined") localStorage.setItem("calltide-lang", l);
  }, []);

  const t = T[lang];
  const categories = t.categories;
  const activeCategory = categories.find((c) => c.id === activeTab) ?? categories[0];

  return (
    <>
      {/* Language toggle */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-1 rounded-full px-1 py-1" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
        <button onClick={() => toggleLang("en")} className="rounded-full px-3 py-1 text-xs font-semibold transition-all" style={{ background: lang === "en" ? "rgba(212,168,67,0.2)" : "transparent", color: lang === "en" ? "#d4a843" : "#94a3b8" }}>EN</button>
        <button onClick={() => toggleLang("es")} className="rounded-full px-3 py-1 text-xs font-semibold transition-all" style={{ background: lang === "es" ? "rgba(212,168,67,0.2)" : "transparent", color: lang === "es" ? "#d4a843" : "#94a3b8" }}>ES</button>
      </div>

      {/* Hero */}
      <section className="relative px-6 sm:px-8 pt-24 pb-12 sm:pt-32 sm:pb-16" style={{ background: "#0f1729" }}>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{t.heroLabel}</p>
          <h1 className="mt-4 text-[36px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[52px]">
            {t.heroH1}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
            {t.heroSub}
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-6 sm:px-8 pb-24 sm:pb-32" style={{ background: "#0f1729" }}>
        <div className="mx-auto max-w-5xl">
          {/* Tab bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-14">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.id === activeTab;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: isActive ? "rgba(212,168,67,0.15)" : "rgba(255,255,255,0.04)",
                    color: isActive ? "#d4a843" : "#94a3b8",
                    border: isActive ? "1px solid rgba(212,168,67,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <Icon size={16} className={isActive ? "text-[#d4a843]" : "text-slate-500"} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Feature cards grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeCategory.features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={`${activeTab}-${i}`}
                  className="rounded-xl p-8"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "rgba(212,168,67,0.1)" }}>
                    <Icon size={20} className="text-[#d4a843]" />
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold tracking-tight text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Screenshot placeholder */}
          <div
            className="mt-14 flex items-center justify-center rounded-2xl p-16"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}
          >
            <p className="text-sm text-slate-600">{t.screenshot} — {activeCategory.label}</p>
          </div>
        </div>
      </section>

      {/* Trade Examples */}
      <section className="px-6 sm:px-8 py-24 sm:py-32" style={{ background: "#111a2e" }}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{t.tradeLabel}</p>
            <h2 className="mt-4 text-[28px] font-extrabold tracking-tight text-white sm:text-[36px]">
              {t.tradeH2}
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {t.trades.map((ex) => (
              <div
                key={ex.trade}
                className="rounded-2xl p-8"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{ex.emoji}</span>
                  <h3 className="text-lg font-extrabold tracking-tight text-white">{ex.trade}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-400 italic">{ex.scenario}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTAs */}
      <section className="px-6 sm:px-8 py-20 sm:py-28" style={{ background: "#0f1729" }}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {t.ctaH2}
          </h2>
          <p className="mt-4 text-base text-slate-400">
            {t.ctaSub}
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="/pricing" className="rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition hover:border-white/40">
              {t.ctaPricing} &rarr;
            </a>
            <a href={BOOKING_URL} className="cta-gold cta-shimmer rounded-xl px-8 py-4 text-base font-semibold text-white">
              {t.ctaGet} &rarr;
            </a>
          </div>
          <p className="mt-8 text-sm text-slate-500">
            {t.ctaCall}{" "}
            <a href={PHONE_TEL} className="font-semibold transition hover:underline" style={{ color: "#d4a843" }}>{PHONE}</a>
          </p>
        </div>
      </section>
    </>
  );
}
