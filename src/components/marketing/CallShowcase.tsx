"use client";

import { SpotlightCard } from "@/components/marketing/SpotlightCard";

type Lang = "en" | "es";

interface Scenario {
  title: string;
  description: string;
  transcript: Array<{ speaker: "maria" | "caller"; text: string }>;
}

const SCENARIOS_EN: Scenario[] = [
  {
    title: "Emergency at 2 AM",
    description:
      "Gas leak detected. She gives safety instructions, dispatches on-call tech, and texts the owner — all in 45 seconds.",
    transcript: [
      { speaker: "caller", text: "I smell gas in my kitchen, I don't know what to do..." },
      { speaker: "maria", text: "I understand, safety first. Please open your windows and step outside immediately." },
      { speaker: "maria", text: "I'm dispatching your on-call technician right now and texting the owner." },
    ],
  },
  {
    title: "Booking in Spanish",
    description:
      "Seamless language switch mid-call. She detects Spanish and responds naturally — no transfer needed.",
    transcript: [
      { speaker: "caller", text: "Hola, necesito programar una cita para manana..." },
      { speaker: "maria", text: "Claro que si! Tengo disponibilidad manana a las 10 AM o 2 PM. Cual le funciona mejor?" },
      { speaker: "caller", text: "Las 2 de la tarde, por favor." },
    ],
  },
  {
    title: "Estimate on the Call",
    description:
      "Caller needs a price range before committing. She generates a ballpark estimate using your pricing data.",
    transcript: [
      { speaker: "caller", text: "How much would it cost to replace a water heater?" },
      { speaker: "maria", text: "Based on your area, a standard tank replacement typically runs $1,200 to $1,800 including labor." },
      { speaker: "maria", text: "Want me to book a free in-home assessment for an exact quote?" },
    ],
  },
  {
    title: "Missed Call Recovery",
    description:
      "Caller hangs up after 8 seconds. She texts them within 60 seconds and books a callback.",
    transcript: [
      { speaker: "maria", text: "Hi! I noticed you just called ABC Plumbing. Sorry I missed you." },
      { speaker: "maria", text: "I can help with scheduling, estimates, or answer any questions. Just reply here!" },
      { speaker: "caller", text: "Yes, I need a plumber tomorrow morning." },
    ],
  },
];

const SCENARIOS_ES: Scenario[] = [
  {
    title: "Emergencia a las 2 AM",
    description:
      "Fuga de gas detectada. Da instrucciones de seguridad, despacha t\u00E9cnico de guardia y avisa al due\u00F1o \u2014 todo en 45 segundos.",
    transcript: [
      { speaker: "caller", text: "Huelo a gas en mi cocina, no se que hacer..." },
      { speaker: "maria", text: "Entiendo, lo primero es tu seguridad. Abre las ventanas y sal de la casa de inmediato." },
      { speaker: "maria", text: "Estoy enviando a tu t\u00E9cnico de guardia ahora y avisando al due\u00F1o." },
    ],
  },
  {
    title: "Reserva en Espa\u00F1ol",
    description:
      "Cambio de idioma fluido durante la llamada. Detecta espa\u00F1ol y responde naturalmente.",
    transcript: [
      { speaker: "caller", text: "Hola, necesito programar una cita para manana..." },
      { speaker: "maria", text: "Claro que si! Tengo disponibilidad manana a las 10 AM o 2 PM. Cual le funciona mejor?" },
      { speaker: "caller", text: "Las 2 de la tarde, por favor." },
    ],
  },
  {
    title: "Cotizaci\u00F3n en la Llamada",
    description:
      "El cliente necesita un rango de precio. Genera una estimaci\u00F3n usando tus datos de precios.",
    transcript: [
      { speaker: "caller", text: "Cuanto cuesta reemplazar un calentador de agua?" },
      { speaker: "maria", text: "Segun tu area, un reemplazo estandar normalmente cuesta entre $1,200 y $1,800 incluyendo mano de obra." },
      { speaker: "maria", text: "Quieres que agende una evaluacion gratuita en casa para un precio exacto?" },
    ],
  },
  {
    title: "Recuperaci\u00F3n de Llamada",
    description:
      "El cliente cuelga a los 8 segundos. Le env\u00EDa un texto en 60 segundos y agenda una llamada.",
    transcript: [
      { speaker: "maria", text: "Hola! Note que acaba de llamar a ABC Plomeria. Disculpe que no lo alcance." },
      { speaker: "maria", text: "Puedo ayudarle con citas, cotizaciones, o cualquier pregunta. Responda aqui!" },
      { speaker: "caller", text: "Si, necesito un plomero manana en la manana." },
    ],
  },
];

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  return (
    <SpotlightCard className="rounded-xl overflow-hidden">
      <div className="p-6 sm:p-8" style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}>
        <h3 className="text-lg font-bold text-charcoal">{scenario.title}</h3>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          {scenario.description}
        </p>

        {/* Transcript excerpt */}
        <div className="mt-5 space-y-2.5">
          {scenario.transcript.map((line, i) => (
            <div
              key={i}
              className="flex gap-2.5 text-[13px] leading-relaxed"
            >
              <div
                className="w-0.5 shrink-0 rounded-full self-stretch"
                style={{
                  background:
                    line.speaker === "maria" ? "#C59A27" : "#d1d5db",
                }}
              />
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{
                  color: line.speaker === "maria" ? "#C59A27" : "#9ca3af",
                }}>
                  {line.speaker === "maria" ? "Maria" : "Caller"}
                </span>
                <p
                  className="mt-0.5"
                  style={{
                    color:
                      line.speaker === "maria" ? "#4a3d1f" : "#6b7280",
                  }}
                >
                  {line.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SpotlightCard>
  );
}

export default function CallShowcase({ lang }: { lang: Lang }) {
  const scenarios = lang === "es" ? SCENARIOS_ES : SCENARIOS_EN;

  return (
    <section className="bg-[#FBFBFC] px-6 sm:px-8 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="reveal text-center mb-16">
          <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-charcoal-light">
            {lang === "en" ? "Hear Her in Action" : "Esc\u00FAchala en Acci\u00F3n"}
          </p>
          <h2 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-charcoal sm:text-[44px]">
            {lang === "en"
              ? "Real Scenarios. Real Results."
              : "Escenarios Reales. Resultados Reales."}
          </h2>
          <p className="mt-4 text-base text-charcoal-muted max-w-2xl mx-auto">
            {lang === "en"
              ? "These are conversations your receptionist handles every day for home service businesses across the country."
              : "Estas son conversaciones que tu recepcionista maneja todos los dias para negocios de servicios a domicilio."}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {scenarios.map((scenario, i) => (
            <ScenarioCard key={i} scenario={scenario} />
          ))}
        </div>
      </div>
    </section>
  );
}
