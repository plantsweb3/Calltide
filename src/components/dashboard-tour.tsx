"use client";

import { useState, useEffect, useCallback } from "react";

interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
}

const TOUR_STEPS: { en: TourStep[]; es: TourStep[] } = {
  en: [
    { target: "overview-metrics", title: "Your Overview", description: "These metrics update in real-time as Maria handles calls." },
    { target: "calls-link", title: "Call Logs", description: "See detailed call logs, transcripts, and sentiment analysis." },
    { target: "settings-link", title: "Customize Maria", description: "Adjust Maria's personality, greeting, and business info." },
    { target: "crm-link", title: "Your CRM", description: "Every caller automatically becomes a contact. Track leads and customers." },
  ],
  es: [
    { target: "overview-metrics", title: "Tu Resumen", description: "Estas métricas se actualizan en tiempo real mientras Maria contesta llamadas." },
    { target: "calls-link", title: "Registro de Llamadas", description: "Ve registros detallados, transcripciones y análisis de sentimiento." },
    { target: "settings-link", title: "Personaliza a Maria", description: "Ajusta la personalidad, saludo e información del negocio." },
    { target: "crm-link", title: "Tu CRM", description: "Cada llamante se convierte en un contacto automáticamente." },
  ],
};

interface DashboardTourProps {
  lang?: "en" | "es";
  onComplete: () => void;
}

export default function DashboardTour({ lang = "en", onComplete }: DashboardTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const steps = TOUR_STEPS[lang];

  const updatePosition = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setPosition(null);
    }
  }, [currentStep, steps]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [updatePosition]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourCompleted: true }),
      });
    } catch {
      // Non-critical
    }
    onComplete();
  };

  const step = steps[currentStep];
  if (!step) return null;

  const isLast = currentStep === steps.length - 1;
  const skipLabel = lang === "es" ? "Saltar" : "Skip";
  const nextLabel = lang === "es" ? "Siguiente" : "Next";
  const doneLabel = lang === "es" ? "¡Listo!" : "Done!";
  const stepLabel = `${currentStep + 1} / ${steps.length}`;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          pointerEvents: "none",
        }}
      >
        {/* Dark overlay with spotlight cutout via box-shadow */}
        {position && (
          <div
            style={{
              position: "absolute",
              top: position.top - 4,
              left: position.left - 4,
              width: position.width + 8,
              height: position.height + 8,
              borderRadius: 8,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
              zIndex: 9998,
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        style={{
          position: "fixed",
          top: position ? Math.min(position.top + position.height + 12, window.innerHeight - 200) : "50%",
          left: position ? Math.max(16, Math.min(position.left, window.innerWidth - 320)) : "50%",
          transform: position ? undefined : "translate(-50%, -50%)",
          zIndex: 9999,
          background: "#1e293b",
          border: "1px solid rgba(212,168,67,0.3)",
          borderRadius: 12,
          padding: "16px 20px",
          maxWidth: 300,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ color: "#D4A843", fontSize: 11, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {stepLabel}
        </div>
        <h4 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>
          {step.title}
        </h4>
        <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 16px", lineHeight: 1.5 }}>
          {step.description}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={handleComplete}
            style={{
              background: "none", border: "none", color: "#64748b",
              fontSize: 13, cursor: "pointer", padding: "4px 8px",
            }}
          >
            {skipLabel}
          </button>
          <button
            onClick={handleNext}
            style={{
              background: "#D4A843", color: "#0f1729", border: "none",
              borderRadius: 6, padding: "8px 20px", fontSize: 13,
              fontWeight: 600, cursor: "pointer",
            }}
          >
            {isLast ? doneLabel : nextLabel}
          </button>
        </div>
      </div>
    </>
  );
}
