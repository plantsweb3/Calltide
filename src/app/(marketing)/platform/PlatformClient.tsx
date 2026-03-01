"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { T, PHONE, PHONE_TEL, type Lang } from "@/lib/marketing/translations";
import { useScrollReveal } from "@/lib/marketing/hooks";
import { DashboardMockup } from "@/components/marketing/DashboardMockup";
import { IconGlobe, IconCalendar, IconMessageCircle, IconAlertTriangle, IconBarChart, IconPhone, IconHeadset, IconClipboard } from "@/components/marketing/icons";
import { SignupForm } from "@/components/marketing/SignupForm";

const features = {
  en: [
    {
      icon: IconPhone,
      title: "24/7 Call Answering",
      desc: "Your receptionist never sleeps. Every call is answered — nights, weekends, holidays. No more missed calls, no more lost jobs.",
      detail: "She picks up in under 30 seconds, greets callers by your business name, and handles the conversation naturally.",
    },
    {
      icon: IconGlobe,
      title: "Truly Bilingual — English & Spanish",
      desc: "Native-level English and Spanish, not machine translation. She switches languages mid-conversation when callers prefer it.",
      detail: "Texas has millions of Spanish-speaking homeowners. Stop losing those calls to the language barrier.",
    },
    {
      icon: IconCalendar,
      title: "Real-Time Appointment Booking",
      desc: "She checks your calendar and books appointments on the spot. No phone tag, no callbacks needed.",
      detail: "Callers get confirmed appointments with SMS confirmations sent automatically.",
    },
    {
      icon: IconMessageCircle,
      title: "SMS Confirmations & Follow-Up",
      desc: "Every booked appointment triggers an instant SMS to the caller with details — address, time, and your business info.",
      detail: "Reduces no-shows and keeps your customers informed without any manual work.",
    },
    {
      icon: IconAlertTriangle,
      title: "Emergency Detection & Transfer",
      desc: "Gas leak? Burst pipe? Flooding? She detects emergency keywords and immediately transfers the call to your emergency number.",
      detail: "You define the emergency keywords and transfer number. She handles the rest.",
    },
    {
      icon: IconBarChart,
      title: "Full Dashboard with Transcripts",
      desc: "See every call, full transcript, appointment, and message in your dashboard. Know exactly what's happening at all times.",
      detail: "Filter by date, status, language, and more. Export data anytime.",
      mockup: true,
    },
    {
      icon: IconHeadset,
      title: "7 AI Agents Working for You",
      desc: "Beyond answering calls — automated onboarding, quality assurance, customer retention, reactivation campaigns, and more.",
      detail: "Each agent handles a specific business function so you can focus on the work, not the office.",
    },
    {
      icon: IconClipboard,
      title: "Custom Training & Personality",
      desc: "Name her, pick her personality, train her with your FAQs, off-limits topics, preferred phrases, and emergency keywords.",
      detail: "She sounds like she's been working at your business for years — because you taught her everything she needs to know.",
    },
  ],
  es: [
    {
      icon: IconPhone,
      title: "Atención de Llamadas 24/7",
      desc: "Tu recepcionista nunca duerme. Cada llamada es contestada — noches, fines de semana, días festivos. Sin llamadas perdidas, sin trabajos perdidos.",
      detail: "Contesta en menos de 30 segundos, saluda por el nombre de tu negocio, y maneja la conversación naturalmente.",
    },
    {
      icon: IconGlobe,
      title: "Verdaderamente Bilingüe — Inglés y Español",
      desc: "Inglés y español a nivel nativo, no traducción automática. Cambia de idioma a mitad de conversación cuando el llamante lo prefiere.",
      detail: "Texas tiene millones de propietarios hispanohablantes. Deja de perder esas llamadas por la barrera del idioma.",
    },
    {
      icon: IconCalendar,
      title: "Agenda de Citas en Tiempo Real",
      desc: "Revisa tu calendario y agenda citas en el momento. Sin juego telefónico, sin necesidad de devolver llamadas.",
      detail: "Los llamantes reciben citas confirmadas con SMS automáticos.",
    },
    {
      icon: IconMessageCircle,
      title: "Confirmaciones SMS y Seguimiento",
      desc: "Cada cita genera un SMS instantáneo al llamante con detalles — dirección, hora, e información de tu negocio.",
      detail: "Reduce las ausencias y mantiene a tus clientes informados sin trabajo manual.",
    },
    {
      icon: IconAlertTriangle,
      title: "Detección y Transferencia de Emergencias",
      desc: "¿Fuga de gas? ¿Tubería rota? ¿Inundación? Detecta palabras clave de emergencia y transfiere inmediatamente a tu número de emergencia.",
      detail: "Tú defines las palabras clave y el número de transferencia. Ella se encarga del resto.",
    },
    {
      icon: IconBarChart,
      title: "Panel Completo con Transcripciones",
      desc: "Ve cada llamada, transcripción completa, cita y mensaje en tu panel. Sabe exactamente qué está pasando en todo momento.",
      detail: "Filtra por fecha, estado, idioma, y más. Exporta datos cuando quieras.",
      mockup: true,
    },
    {
      icon: IconHeadset,
      title: "7 Agentes IA Trabajando para Ti",
      desc: "Más allá de contestar llamadas — onboarding automatizado, control de calidad, retención de clientes, campañas de reactivación, y más.",
      detail: "Cada agente maneja una función específica para que te enfoques en el trabajo, no en la oficina.",
    },
    {
      icon: IconClipboard,
      title: "Entrenamiento y Personalidad Personalizados",
      desc: "Ponle nombre, elige su personalidad, entrénala con tus preguntas frecuentes, temas prohibidos, frases preferidas, y palabras de emergencia.",
      detail: "Suena como si hubiera trabajado en tu negocio por años — porque tú le enseñaste todo lo que necesita saber.",
    },
  ],
};

export default function PlatformPage() {
  const [lang] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("calltide-lang");
      if (saved === "en" || saved === "es") return saved;
    }
    return "en";
  });
  useScrollReveal();

  const t = T[lang];
  const featureList = features[lang];

  return (
    <>
      {/* Hero */}
      <section className="bg-navy px-6 sm:px-8 py-20 sm:py-28 dark-section grain-overlay">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">{t.footer.platform}</p>
          <h1 className="mt-4 text-[36px] font-black leading-[1.1] tracking-tight text-white sm:text-[52px]">
            {lang === "en"
              ? "Built for Service Businesses That Can't Afford to Miss a Call"
              : "Hecho para Negocios de Servicio Que No Pueden Perder una Llamada"}
          </h1>
          <p className="mt-6 text-lg text-slate-300">
            {lang === "en"
              ? "Everything your front office needs — in one AI receptionist that works 24/7."
              : "Todo lo que tu oficina necesita — en una recepcionista IA que trabaja 24/7."}
          </p>
        </div>
      </section>

      {/* Feature Sections — alternating layout */}
      {featureList.map((feature, i) => {
        const Icon = feature.icon;
        const isEven = i % 2 === 0;
        const isDark = i % 2 !== 0;

        return (
          <section
            key={i}
            className={`px-6 sm:px-8 py-20 sm:py-28 ${isDark ? "bg-navy dark-section" : "bg-[#FBFBFC]"}`}
          >
            <div className="mx-auto max-w-5xl">
              <motion.div
                className={`reveal grid items-center gap-12 md:grid-cols-2 ${!isEven ? "md:[direction:rtl]" : ""}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={!isEven ? "md:[direction:ltr]" : ""}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isDark ? "bg-amber/10" : "bg-amber/10"}`}>
                    <Icon size={24} className="text-amber" />
                  </div>
                  <h2 className={`mt-5 text-[28px] font-extrabold tracking-tight sm:text-[36px] ${isDark ? "text-white" : "text-charcoal"}`}>
                    {feature.title}
                  </h2>
                  <p className={`mt-4 text-base leading-[1.7] ${isDark ? "text-slate-300" : "text-charcoal-muted"}`}>
                    {feature.desc}
                  </p>
                  <p className={`mt-3 text-sm leading-[1.7] ${isDark ? "text-slate-400" : "text-charcoal-light"}`}>
                    {feature.detail}
                  </p>
                </div>
                <div className={!isEven ? "md:[direction:ltr]" : ""}>
                  {"mockup" in feature && feature.mockup ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                      <DashboardMockup />
                    </div>
                  ) : (
                    <div className={`flex items-center justify-center rounded-2xl p-12 ${isDark ? "bg-white/5" : "bg-navy/5"}`}>
                      <Icon size={96} className={`${isDark ? "text-amber/30" : "text-amber/20"}`} />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </section>
        );
      })}

      {/* CTA */}
      <section id="signup" className="relative px-6 sm:px-8 py-24 sm:py-32 overflow-hidden dark-section grain-overlay">
        <img src="/images/grit-texture.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-center" loading="lazy" />
        <div className="grit-overlay-cta absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="reveal text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[40px]">
            {t.cta.h2}
          </h2>
          <SignupForm lang={lang} />
          <p className="mt-6 text-sm text-slate-400">{t.cta.sub}</p>
          <p className="mt-4 text-sm text-slate-500">
            {lang === "en" ? "Or call us:" : "O llámanos:"}{" "}
            <a href={PHONE_TEL} className="font-semibold text-amber hover:underline">{PHONE}</a>
          </p>
        </div>
      </section>
    </>
  );
}
