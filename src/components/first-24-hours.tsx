"use client";

import { useState } from "react";

type Lang = "en" | "es";

const TIMELINE = {
  en: [
    { time: "Now", title: "Forward your number", desc: "Set up call forwarding so Maria can start answering.", icon: "📞" },
    { time: "Hour 1-2", title: "Maria handles calls", desc: "She'll greet callers, book appointments, and take messages.", icon: "🎙️" },
    { time: "Hour 6", title: "Check your dashboard", desc: "See call logs, transcripts, and booked appointments.", icon: "📊" },
    { time: "Day 2", title: "Weekly digest", desc: "Get a summary of all calls and key metrics.", icon: "📧" },
    { time: "Day 7", title: "ROI report", desc: "See how many calls Maria answered and revenue impact.", icon: "💰" },
  ],
  es: [
    { time: "Ahora", title: "Redirige tu número", desc: "Configura el desvío de llamadas para que Maria empiece a contestar.", icon: "📞" },
    { time: "Hora 1-2", title: "Maria contesta llamadas", desc: "Saludará, agendará citas y tomará mensajes.", icon: "🎙️" },
    { time: "Hora 6", title: "Revisa tu panel", desc: "Ve registros de llamadas, transcripciones y citas.", icon: "📊" },
    { time: "Día 2", title: "Resumen semanal", desc: "Recibe un resumen de todas las llamadas y métricas.", icon: "📧" },
    { time: "Día 7", title: "Reporte de ROI", desc: "Ve cuántas llamadas contestó Maria y su impacto.", icon: "💰" },
  ],
};

interface First24HoursProps {
  lang?: Lang;
  onDismiss?: () => void;
  dismissible?: boolean;
}

export default function First24Hours({ lang = "en", onDismiss, dismissible = false }: First24HoursProps) {
  const [dismissed, setDismissed] = useState(false);
  const items = TIMELINE[lang];

  if (dismissed) return null;

  return (
    <div style={{
      background: "var(--db-card, rgba(255,255,255,0.04))",
      border: "1px solid var(--db-border, rgba(255,255,255,0.08))",
      borderRadius: 12,
      padding: "20px 24px",
      position: "relative",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ color: "var(--db-text, #fff)", fontSize: 16, fontWeight: 700, margin: 0 }}>
          {lang === "es" ? "Primeras 24 Horas" : "First 24 Hours"}
        </h3>
        {dismissible && onDismiss && (
          <button
            onClick={() => { setDismissed(true); onDismiss(); }}
            style={{
              background: "none", border: "none", color: "var(--db-text-muted, #64748b)",
              cursor: "pointer", fontSize: 18, padding: "4px 8px", lineHeight: 1,
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 12 }}>
            {/* Timeline line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: i === 0 ? "rgba(212,168,67,0.2)" : "rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>
                {item.icon}
              </div>
              {i < items.length - 1 && (
                <div style={{ width: 2, flex: 1, background: "var(--db-border, rgba(255,255,255,0.08))", minHeight: 20 }} />
              )}
            </div>
            {/* Content */}
            <div style={{ paddingBottom: i < items.length - 1 ? 16 : 0, flex: 1 }}>
              <div style={{ color: "var(--db-accent, #D4A843)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {item.time}
              </div>
              <div style={{ color: "var(--db-text, #fff)", fontSize: 14, fontWeight: 600, margin: "2px 0" }}>
                {item.title}
              </div>
              <div style={{ color: "var(--db-text-muted, #94a3b8)", fontSize: 13 }}>
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
