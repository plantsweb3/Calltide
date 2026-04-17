"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const PHONE = process.env.NEXT_PUBLIC_PHONE ?? "(830) 521-7133";

const content = {
  en: {
    title: "Audit Scheduled!",
    callingSoon: "We'll call your business within the next few minutes during business hours (9am-5pm CT, Mon-Fri).",
    callingNext: "We'll call your business next business day between 10am-3pm CT.",
    emailNote: "Check your email for the full report after we call.",
    whileYouWait: "While you wait — here's what our AI receptionist sounds like:",
    transcript: [
      { speaker: "Caller", text: "Hi, I've got a busted pipe in my kitchen, water's everywhere." },
      { speaker: "Maria (AI)", text: "I'm so sorry to hear that! I can get a plumber out to you right away. Can I get your name and address?" },
      { speaker: "Caller", text: "Yeah, it's Mike, 4521 Oak Lane." },
      { speaker: "Maria (AI)", text: "Got it, Mike. I have a technician available at 2pm today. Does that work for you?" },
      { speaker: "Caller", text: "Perfect, thank you!" },
      { speaker: "Maria (AI)", text: "You're all set! You'll receive a confirmation text shortly. Is there anything else I can help with?" },
    ],
    back: "Back to Capta",
    blog: "Read our blog",
  },
  es: {
    title: "¡Auditoría Programada!",
    callingSoon: "Llamaremos a su negocio dentro de los próximos minutos durante horario de oficina (9am-5pm CT, Lun-Vie).",
    callingNext: "Llamaremos a su negocio el próximo día hábil entre 10am-3pm CT.",
    emailNote: "Revise su correo electrónico para el reporte completo después de que llamemos.",
    whileYouWait: "Mientras espera — así suena nuestra recepcionista de IA:",
    transcript: [
      { speaker: "Llamante", text: "Hola, tengo una tubería rota en mi cocina, hay agua por todos lados." },
      { speaker: "Maria (IA)", text: "¡Lamento mucho escuchar eso! Puedo enviar un plomero de inmediato. ¿Me puede dar su nombre y dirección?" },
      { speaker: "Llamante", text: "Sí, soy Miguel, 4521 Oak Lane." },
      { speaker: "Maria (IA)", text: "Entendido, Miguel. Tengo un técnico disponible a las 2pm hoy. ¿Le funciona?" },
      { speaker: "Llamante", text: "¡Perfecto, gracias!" },
      { speaker: "Maria (IA)", text: "¡Listo! Recibirá un mensaje de confirmación pronto. ¿Hay algo más en lo que pueda ayudarle?" },
    ],
    back: "Volver a Capta",
    blog: "Leer nuestro blog",
  },
};

type Lang = "en" | "es";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const lang = (searchParams.get("lang") as Lang) || "en";
  const t = content[lang] ?? content.en;

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      {/* Minimal nav */}
      <nav className="border-b border-cream-border bg-white px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/">
            <img src="/images/logo-inline-navy.webp" alt="Capta" className="h-6 w-auto" />
          </Link>
          <Link href="/audit" className="text-sm text-charcoal-muted hover:text-charcoal transition-colors">
            {t.back}
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        {/* Success */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="mt-6 text-[32px] font-extrabold tracking-tight text-charcoal sm:text-[40px]">
            {t.title}
          </h1>
          <p className="mt-4 text-lg leading-[1.7] text-charcoal-muted">
            {t.callingSoon}
          </p>
          <p className="mt-3 text-base text-charcoal-muted">
            {t.emailNote}
          </p>
        </div>

        {/* Transcript demo */}
        <div className="mt-16">
          <h2 className="text-center text-lg font-semibold text-charcoal">{t.whileYouWait}</h2>
          <div className="mt-8 space-y-4 rounded-xl border border-cream-border bg-white p-6 sm:p-8 card-shadow">
            {t.transcript.map((line, i) => {
              const isAi = /\((?:AI|IA)\)/.test(line.speaker);
              return (
              <div key={i} className={`flex gap-3 ${isAi ? "" : "flex-row-reverse text-right"}`}>
                <div
                  className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    isAi
                      ? "bg-amber/10 text-amber"
                      : "bg-slate-100 text-charcoal-muted"
                  }`}
                >
                  {isAi ? "AI" : "C"}
                </div>
                <div>
                  <p className="text-xs font-medium text-charcoal-light">{line.speaker}</p>
                  <p className="mt-1 text-sm leading-relaxed text-charcoal-muted">{line.text}</p>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* Links */}
        <div className="mt-12 flex justify-center gap-6 text-sm">
          <Link href="/" className="text-amber font-semibold hover:underline">{t.back}</Link>
          <Link href="/blog" className="text-charcoal-muted hover:text-charcoal transition-colors">{t.blog}</Link>
        </div>
      </main>
    </div>
  );
}

export default function AuditConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  );
}
