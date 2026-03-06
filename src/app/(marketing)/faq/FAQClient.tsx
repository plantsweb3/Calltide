"use client";

import { useState } from "react";
import { PHONE, PHONE_TEL, BOOKING_URL, type Lang } from "@/lib/marketing/translations";
import { useScrollReveal } from "@/lib/marketing/hooks";

interface FAQItem {
  q: string;
  a: string;
}

interface Category {
  title: string;
  items: FAQItem[];
}

const content = {
  en: {
    badge: "Frequently Asked Questions",
    hero: "Got Questions?\nWe've Got Answers.",
    heroSub: "Everything you need to know about Calltide, your AI receptionist.",
    categories: [
      {
        title: "Getting Started",
        items: [
          {
            q: "How long does setup take?",
            a: "Most businesses are fully set up in under 10 minutes. Name your receptionist, customize her greeting, forward your number, and you're live.",
          },
          {
            q: "Do I need special equipment?",
            a: "No. Just forward your existing business phone number to the number we give you. You can do it from your phone's settings or by calling your carrier. Takes about 2 minutes.",
          },
          {
            q: "Can I try it before committing?",
            a: "Yes — every plan starts with a free 14-day trial. No credit card required to start. Cancel anytime during the trial and you won't be charged.",
          },
        ],
      },
      {
        title: "About Maria",
        items: [
          {
            q: "Will my callers know they're talking to AI?",
            a: "Your receptionist is designed to sound natural and warm — like someone who's worked at your business for years. She uses natural speech patterns, handles interruptions, and adapts her tone to the caller. Most callers don't notice.",
          },
          {
            q: "Can I customize what she says?",
            a: "Yes! You choose her name, personality, greeting, and train her with custom responses for your specific services. She'll learn your business hours, service area, pricing ranges, and how you want different situations handled.",
          },
          {
            q: "What happens if there's an emergency?",
            a: "She detects emergency keywords like 'gas leak', 'burst pipe', 'flooding', or 'fire' and immediately transfers the call to your designated emergency contact number. You set the rules for what qualifies as an emergency.",
          },
          {
            q: "Does she actually book appointments?",
            a: "Yes. She connects to your calendar and books appointments in real-time based on your availability. Callers also get an instant SMS confirmation with the appointment details.",
          },
        ],
      },
      {
        title: "Billing & Pricing",
        items: [
          {
            q: "What does Calltide cost?",
            a: "One plan: $497/month or $4,764/year (save $1,200). Everything included — unlimited calls, bilingual support, booking, CRM, analytics, compliance. No per-minute charges, no hidden fees.",
          },
          {
            q: "What if I want to cancel?",
            a: "Cancel anytime from your dashboard. No contracts, no cancellation fees, no phone calls required. Your account stays active until the end of your billing period.",
          },
        ],
      },
      {
        title: "Technical",
        items: [
          {
            q: "Is my data secure?",
            a: "Yes. We use encryption in transit and at rest, comply with TCPA regulations, and follow data privacy best practices. We never share or sell your data. Full details in our Privacy Policy and Data Processing Agreement.",
          },
          {
            q: "What languages does she speak?",
            a: "English and Spanish — natively. She detects the caller's language automatically and responds in kind. This isn't a translation layer — she's fully conversational in both languages.",
          },
          {
            q: "Can she handle multiple calls at the same time?",
            a: "Yes. Unlike a human receptionist, your AI receptionist can handle multiple simultaneous calls. No busy signals, no hold music, no missed calls.",
          },
          {
            q: "What if the internet or your servers go down?",
            a: "We have redundancy built in. If our primary systems experience issues, calls are routed to backup systems. We monitor uptime 24/7 and our status page is always available at calltide.app/status.",
          },
        ],
      },
    ] as Category[],
    ctaH: "Still have questions?",
    ctaSub: "Talk to us — or better yet, talk to your receptionist.",
    ctaButton: "Get Calltide",
    ctaBook: "Book a Demo",
    ctaCall: "Or call us:",
  },
  es: {
    badge: "Preguntas Frecuentes",
    hero: "¿Tienes Preguntas?\nTenemos Respuestas.",
    heroSub: "Todo lo que necesitas saber sobre Calltide, tu recepcionista IA.",
    categories: [
      {
        title: "Primeros Pasos",
        items: [
          {
            q: "¿Cuánto tiempo toma la configuración?",
            a: "La mayoría de los negocios están completamente configurados en menos de 10 minutos. Nombra tu recepcionista, personaliza su saludo, redirige tu número, y estás en vivo.",
          },
          {
            q: "¿Necesito equipo especial?",
            a: "No. Solo redirige tu número de negocio existente al número que te damos. Puedes hacerlo desde la configuración de tu teléfono o llamando a tu operador. Toma unos 2 minutos.",
          },
          {
            q: "¿Puedo probarlo antes de comprometerme?",
            a: "Sí — cada plan empieza con una prueba gratuita de 14 días. No se requiere tarjeta de crédito para empezar. Cancela en cualquier momento durante la prueba y no se te cobrará.",
          },
        ],
      },
      {
        title: "Sobre Maria",
        items: [
          {
            q: "¿Sabrán mis clientes que están hablando con IA?",
            a: "Tu recepcionista está diseñada para sonar natural y cálida — como alguien que ha trabajado en tu negocio por años. Usa patrones de habla naturales, maneja interrupciones y adapta su tono al llamante. La mayoría no lo nota.",
          },
          {
            q: "¿Puedo personalizar lo que dice?",
            a: "¡Sí! Tú eliges su nombre, personalidad, saludo y la entrenas con respuestas personalizadas para tus servicios específicos. Ella aprenderá tus horarios, área de servicio, rangos de precios y cómo quieres que maneje diferentes situaciones.",
          },
          {
            q: "¿Qué pasa si hay una emergencia?",
            a: "Ella detecta palabras clave de emergencia como 'fuga de gas', 'tubería rota', 'inundación' o 'incendio' y transfiere la llamada inmediatamente a tu número de contacto de emergencia designado. Tú defines las reglas de lo que califica como emergencia.",
          },
          {
            q: "¿Realmente agenda citas?",
            a: "Sí. Se conecta a tu calendario y agenda citas en tiempo real basándose en tu disponibilidad. Los llamantes también reciben una confirmación SMS instantánea con los detalles de la cita.",
          },
        ],
      },
      {
        title: "Facturación y Precios",
        items: [
          {
            q: "¿Cuánto cuesta Calltide?",
            a: "Un plan: $497/mes o $4,764/año (ahorra $1,200). Todo incluido — llamadas ilimitadas, soporte bilingüe, agendamiento, CRM, analíticas, cumplimiento. Sin cargos por minuto, sin costos ocultos.",
          },
          {
            q: "¿Qué pasa si quiero cancelar?",
            a: "Cancela en cualquier momento desde tu panel. Sin contratos, sin cuotas de cancelación, sin llamadas telefónicas requeridas. Tu cuenta permanece activa hasta el final de tu período de facturación.",
          },
        ],
      },
      {
        title: "Técnico",
        items: [
          {
            q: "¿Mis datos están seguros?",
            a: "Sí. Usamos encriptación en tránsito y en reposo, cumplimos con las regulaciones TCPA y seguimos las mejores prácticas de privacidad de datos. Nunca compartimos ni vendemos tus datos. Detalles completos en nuestra Política de Privacidad y Acuerdo de Procesamiento de Datos.",
          },
          {
            q: "¿Qué idiomas habla?",
            a: "Inglés y español — de forma nativa. Detecta el idioma del llamante automáticamente y responde en el mismo idioma. Esto no es una capa de traducción — es completamente conversacional en ambos idiomas.",
          },
          {
            q: "¿Puede manejar múltiples llamadas al mismo tiempo?",
            a: "Sí. A diferencia de una recepcionista humana, tu recepcionista IA puede manejar múltiples llamadas simultáneas. Sin señales de ocupado, sin música de espera, sin llamadas perdidas.",
          },
          {
            q: "¿Qué pasa si se cae el internet o sus servidores?",
            a: "Tenemos redundancia incorporada. Si nuestros sistemas principales experimentan problemas, las llamadas se enrutan a sistemas de respaldo. Monitoreamos el tiempo de actividad 24/7 y nuestra página de estado siempre está disponible en calltide.app/status.",
          },
        ],
      },
    ] as Category[],
    ctaH: "¿Todavía tienes preguntas?",
    ctaSub: "Habla con nosotros — o mejor aún, habla con tu recepcionista.",
    ctaButton: "Obtén Calltide",
    ctaBook: "Agenda una Demo",
    ctaCall: "O llámanos:",
  },
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className={`flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    >
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="text-base font-semibold text-white group-hover:text-[#d4a843] transition-colors">
          {item.q}
        </span>
        <span className="text-slate-400">
          <ChevronIcon open={isOpen} />
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: isOpen ? "300px" : "0",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <p className="pb-5 text-sm leading-relaxed text-slate-400">{item.a}</p>
      </div>
    </div>
  );
}

export default function FAQClient() {
  const [lang] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("calltide-lang");
      if (saved === "en" || saved === "es") return saved;
    }
    return "en";
  });
  useScrollReveal();

  const c = content[lang];

  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {/* Hero */}
      <section className="relative px-6 sm:px-8 py-28 sm:py-36 dark-section grain-overlay" style={{ background: "#0f1729" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(212,168,67,0.06) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{c.badge}</p>
          <h1 className="mt-6 text-[36px] font-black leading-[1.1] tracking-tight text-white sm:text-[52px] whitespace-pre-line">
            {c.hero}
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-xl mx-auto">{c.heroSub}</p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="px-6 sm:px-8 py-24 sm:py-32 dark-section" style={{ background: "#0f1729" }}>
        <div className="mx-auto max-w-3xl space-y-16">
          {c.categories.map((cat, catIdx) => (
            <div key={cat.title} className="reveal">
              <h2
                className="text-[22px] font-extrabold tracking-tight sm:text-[26px] mb-6"
                style={{ color: "#d4a843" }}
              >
                {cat.title}
              </h2>
              <div
                className="rounded-2xl overflow-hidden px-6"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {cat.items.map((item, itemIdx) => {
                  const key = `${catIdx}-${itemIdx}`;
                  return (
                    <AccordionItem
                      key={key}
                      item={item}
                      isOpen={!!openItems[key]}
                      onToggle={() => toggleItem(key)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 sm:px-8 py-24 sm:py-32 dark-section grain-overlay" style={{ background: "#111827" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(212,168,67,0.06) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-xl text-center">
          <h2 className="reveal text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[40px]">
            {c.ctaH}
          </h2>
          <p className="mt-4 text-slate-400">{c.ctaSub}</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/pricing"
              className="cta-gold cta-shimmer inline-flex items-center justify-center gap-2 rounded-xl px-10 py-4 text-lg font-semibold text-white"
            >
              {c.ctaButton} &rarr;
            </a>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold text-slate-300 hover:text-white transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}
            >
              {c.ctaBook}
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            {c.ctaCall}{" "}
            <a href={PHONE_TEL} className="font-semibold hover:underline" style={{ color: "#d4a843" }}>{PHONE}</a>
          </p>
        </div>
      </section>
    </>
  );
}
