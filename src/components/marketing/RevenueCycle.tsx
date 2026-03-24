"use client";

import { useEffect, useRef, useState } from "react";

type Lang = "en" | "es";

const STEPS_EN = [
  { icon: "phone-missed", label: "Missed Call" },
  { icon: "headset", label: "Maria Answers" },
  { icon: "globe", label: "Detects Language" },
  { icon: "calendar", label: "Books Appointment" },
  { icon: "file-text", label: "Generates Estimate" },
  { icon: "smartphone", label: "Texts Owner" },
  { icon: "check", label: "Owner Approves" },
  { icon: "dollar", label: "Invoice Created" },
  { icon: "bell", label: "Reminder Sent" },
  { icon: "check-circle", label: "Job Completed" },
  { icon: "message", label: "Review Requested" },
  { icon: "star", label: "5-Star Review" },
];

const STEPS_ES = [
  { icon: "phone-missed", label: "Llamada Perdida" },
  { icon: "headset", label: "Maria Contesta" },
  { icon: "globe", label: "Detecta Idioma" },
  { icon: "calendar", label: "Agenda Cita" },
  { icon: "file-text", label: "Genera Cotizacion" },
  { icon: "smartphone", label: "Avisa al Dueno" },
  { icon: "check", label: "Dueno Aprueba" },
  { icon: "dollar", label: "Factura Creada" },
  { icon: "bell", label: "Recordatorio" },
  { icon: "check-circle", label: "Trabajo Hecho" },
  { icon: "message", label: "Solicita Resena" },
  { icon: "star", label: "Resena 5 Estrellas" },
];

function StepIcon({ icon }: { icon: string }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (icon) {
    case "phone-missed":
      return (
        <svg {...props}>
          <line x1="23" y1="1" x2="17" y2="7" />
          <line x1="17" y1="1" x2="23" y2="7" />
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case "headset":
      return (
        <svg {...props}>
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      );
    case "globe":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "file-text":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case "smartphone":
      return (
        <svg {...props}>
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "dollar":
      return (
        <svg {...props}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "bell":
      return (
        <svg {...props}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    case "check-circle":
      return (
        <svg {...props}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case "message":
      return (
        <svg {...props}>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      );
    case "star":
      return (
        <svg {...props}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    default:
      return null;
  }
}

export default function RevenueCycle({ lang }: { lang: Lang }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const steps = lang === "es" ? STEPS_ES : STEPS_EN;

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="relative px-6 sm:px-8 py-24 sm:py-32 dark-section grain-overlay overflow-hidden"
      style={{ background: "#0f1729" }}
    >
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="reveal text-center mb-16">
          <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-slate-400">
            {lang === "en" ? "The Full Revenue Cycle" : "El Ciclo Completo de Ingresos"}
          </p>
          <h2 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[44px]">
            {lang === "en"
              ? "12 Steps. Fully Automated."
              : "12 Pasos. Totalmente Automatizado."}
          </h2>
          <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto">
            {lang === "en"
              ? "From missed call to 5-star review — no other platform automates the complete revenue cycle."
              : "De llamada perdida a resena de 5 estrellas — ninguna otra plataforma automatiza el ciclo completo."}
          </p>
        </div>

        <div
          ref={ref}
          className={`${active ? "cycle-active" : ""}`}
        >
          {/* Desktop: horizontal scroll with grid */}
          <div className="hidden sm:block overflow-x-auto pb-4">
            <div className="flex items-center gap-0 min-w-max mx-auto justify-center">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center">
                  <div className="cycle-step flex flex-col items-center" style={{ width: "90px" }}>
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300"
                      style={{
                        background: "rgba(197,154,39,0.12)",
                        color: "#C59A27",
                        border: "2px solid rgba(197,154,39,0.3)",
                      }}
                    >
                      <StepIcon icon={step.icon} />
                    </div>
                    <p className="mt-2 text-[11px] font-medium text-center leading-tight text-slate-300">
                      {step.label}
                    </p>
                  </div>
                  {i < steps.length - 1 && (
                    <svg
                      className="cycle-line shrink-0"
                      width="32"
                      height="2"
                      viewBox="0 0 32 2"
                      style={{ margin: "0 -2px", marginBottom: "20px" }}
                    >
                      <line
                        x1="0"
                        y1="1"
                        x2="32"
                        y2="1"
                        stroke="rgba(197,154,39,0.4)"
                        strokeWidth="2"
                        strokeDasharray="40"
                        strokeDashoffset="0"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: horizontal scroll-snap */}
          <div className="sm:hidden overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6">
            <div className="flex gap-4 min-w-max">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="cycle-step snap-center flex flex-col items-center shrink-0"
                  style={{ width: "80px" }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{
                      background: "rgba(197,154,39,0.12)",
                      color: "#C59A27",
                      border: "2px solid rgba(197,154,39,0.3)",
                    }}
                  >
                    <StepIcon icon={step.icon} />
                  </div>
                  <p className="mt-2 text-[10px] font-medium text-center leading-tight text-slate-300">
                    {step.label}
                  </p>
                  {i < steps.length - 1 && (
                    <span className="text-[10px] text-slate-500 mt-1">&rarr;</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
