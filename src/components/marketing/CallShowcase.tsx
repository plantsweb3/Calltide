"use client";

import { useState } from "react";
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
      "Fuga de gas detectada. Da instrucciones de seguridad, despacha tecnico de guardia y avisa al dueno — todo en 45 segundos.",
    transcript: [
      { speaker: "caller", text: "Huelo a gas en mi cocina, no se que hacer..." },
      { speaker: "maria", text: "Entiendo, lo primero es tu seguridad. Abre las ventanas y sal de la casa de inmediato." },
      { speaker: "maria", text: "Estoy enviando a tu tecnico de guardia ahora y avisando al dueno." },
    ],
  },
  {
    title: "Reserva en Espanol",
    description:
      "Cambio de idioma fluido durante la llamada. Detecta espanol y responde naturalmente.",
    transcript: [
      { speaker: "caller", text: "Hola, necesito programar una cita para manana..." },
      { speaker: "maria", text: "Claro que si! Tengo disponibilidad manana a las 10 AM o 2 PM. Cual le funciona mejor?" },
      { speaker: "caller", text: "Las 2 de la tarde, por favor." },
    ],
  },
  {
    title: "Cotizacion en la Llamada",
    description:
      "El cliente necesita un rango de precio. Genera una estimacion usando tus datos de precios.",
    transcript: [
      { speaker: "caller", text: "Cuanto cuesta reemplazar un calentador de agua?" },
      { speaker: "maria", text: "Segun tu area, un reemplazo estandar normalmente cuesta entre $1,200 y $1,800 incluyendo mano de obra." },
      { speaker: "maria", text: "Quieres que agende una evaluacion gratuita en casa para un precio exacto?" },
    ],
  },
  {
    title: "Recuperacion de Llamada",
    description:
      "El cliente cuelga a los 8 segundos. Le envia un texto en 60 segundos y agenda una llamada.",
    transcript: [
      { speaker: "maria", text: "Hola! Note que acaba de llamar a ABC Plomeria. Disculpe que no lo alcance." },
      { speaker: "maria", text: "Puedo ayudarle con citas, cotizaciones, o cualquier pregunta. Responda aqui!" },
      { speaker: "caller", text: "Si, necesito un plomero manana en la manana." },
    ],
  },
];

function WaveformBars({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-center gap-[2px] h-8">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all"
          style={{
            height: playing
              ? `${12 + Math.sin(i * 0.8) * 10 + Math.random() * 6}px`
              : `${4 + Math.sin(i * 0.5) * 3}px`,
            background: playing ? "#C59A27" : "rgba(197,154,39,0.3)",
            transition: playing ? "height 0.15s ease" : "height 0.5s ease",
          }}
        />
      ))}
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const [playing, setPlaying] = useState(false);

  return (
    <SpotlightCard className="rounded-xl overflow-hidden">
      <div className="p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 className="text-lg font-bold text-white">{scenario.title}</h3>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          {scenario.description}
        </p>

        {/* Audio player placeholder */}
        <div
          className="mt-4 flex items-center gap-3 rounded-lg px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            onClick={() => setPlaying(!playing)}
            disabled
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-opacity opacity-40 cursor-not-allowed"
            style={{ background: "rgba(197,154,39,0.15)" }}
            aria-label="Play audio"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="#C59A27"
              stroke="none"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
          <WaveformBars playing={false} />
          <span className="ml-auto text-xs text-slate-500">
            Coming soon
          </span>
        </div>

        {/* Transcript excerpt */}
        <div className="mt-4 space-y-2">
          {scenario.transcript.map((line, i) => (
            <div
              key={i}
              className="flex gap-2 text-[13px] leading-relaxed"
            >
              <div
                className="w-0.5 shrink-0 rounded-full"
                style={{
                  background:
                    line.speaker === "maria" ? "#C59A27" : "rgba(255,255,255,0.15)",
                }}
              />
              <p
                style={{
                  color:
                    line.speaker === "maria" ? "#e2d5b8" : "rgba(255,255,255,0.5)",
                }}
              >
                {line.text}
              </p>
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
