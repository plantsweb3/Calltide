"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { VoiceProvider, useVoice, VoiceReadyState } from "@humeai/voice-react";
import CaptaSpinner from "@/components/capta-spinner";

type DemoState = "idle" | "connecting" | "active" | "ended";
type Lang = "en" | "es";

interface ConversionData {
  businessType: string | null;
  businessName: string | null;
  tradeLabel: string | null;
  estimatedMonthlyLoss: number | null;
  callsToPayForMaria: number | null;
  roiMultiple: number | null;
  roiNote: string | null;
}

const LABELS = {
  en: {
    idleTitle: "Talk to Maria",
    idleSub: "Want to see how Maria handles your calls? Talk to her right now — no signup, no email. Just a conversation.",
    idleCta: "Talk to Maria Now",
    idleCallCta: "Or call her",
    connectingTitle: "Maria is getting ready...",
    activeListening: "Listening... speak naturally",
    activeEnd: "End Conversation",
    activeMute: "Mute",
    activeUnmute: "Unmute",
    endedTitle: "Ready to Hire Maria",
    endedTitleBiz: "Ready to Hire Maria for",
    endedTrade: "Your trade",
    endedLoss: "Estimated missed-call cost",
    endedPayback: "Maria pays for herself after",
    endedCalls: "calls",
    endedCta: "Get Capta",
    endedCtaSub: "Maria will be live in 5 minutes",
    endedRetry: "Talk to Maria again",
    micNote: "Uses your browser microphone",
    elapsed: "Elapsed",
    errorBusy: "Maria's busy right now. Get Capta to talk to her anytime.",
    errorGeneric: "Could not connect. Please try again.",
    trySpanish: "Try speaking Spanish — she'll switch instantly.",
    perMonth: "/mo",
  },
  es: {
    idleTitle: "Habla con Maria",
    idleSub: "¿Quieres ver cómo Maria maneja tus llamadas? Habla con ella ahora — sin registro, sin correo. Solo una conversación.",
    idleCta: "Habla con Maria Ahora",
    idleCallCta: "O llámala",
    connectingTitle: "Maria se está preparando...",
    activeListening: "Escuchando... habla naturalmente",
    activeEnd: "Terminar Conversación",
    activeMute: "Silenciar",
    activeUnmute: "Activar",
    endedTitle: "¿Lista para Contratar a Maria?",
    endedTitleBiz: "¿Lista para Contratar a Maria para",
    endedTrade: "Tu industria",
    endedLoss: "Costo estimado de llamadas perdidas",
    endedPayback: "Maria se paga sola después de",
    endedCalls: "llamadas",
    endedCta: "Obtén Capta",
    endedCtaSub: "Maria estará activa en 5 minutos",
    endedRetry: "Habla con Maria de nuevo",
    micNote: "Usa el micrófono de tu navegador",
    elapsed: "Tiempo",
    errorBusy: "Maria está ocupada ahora. Obtén Capta para hablar con ella cuando quieras.",
    errorGeneric: "No se pudo conectar. Inténtalo de nuevo.",
    trySpanish: "Intenta hablar en español — ella cambia al instante.",
    perMonth: "/mes",
  },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function DemoWidgetInner({ lang, phoneTel }: { lang: Lang; phoneTel: string }) {
  const { connect, disconnect, readyState, messages } = useVoice();
  const [state, setState] = useState<DemoState>("idle");
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [conversionData, setConversionData] = useState<ConversionData | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const transcriptRef = useRef<{ role: string; content: string }[]>([]);
  const l = LABELS[lang];

  // Track elapsed time
  useEffect(() => {
    if (state === "active") {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  // Track messages for transcript
  useEffect(() => {
    const filtered = messages.filter(
      (m): m is typeof m & { message: { role: string; content: string } } =>
        "message" in m &&
        typeof (m as { message?: { content?: string } }).message?.content === "string",
    );
    transcriptRef.current = filtered.map((m) => ({
      role: m.message.role,
      content: m.message.content,
    }));
  }, [messages]);

  // Update state based on readyState
  useEffect(() => {
    if (readyState === VoiceReadyState.OPEN && state === "connecting") {
      setState("active");
    } else if (readyState === VoiceReadyState.CLOSED && state === "active") {
      handleEnd();
    }
  }, [readyState]); // eslint-disable-line react-hooks/exhaustive-deps

  // 5-minute auto-end
  useEffect(() => {
    if (elapsed >= 300 && state === "active") {
      handleEnd();
    }
  }, [elapsed, state]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = useCallback(async () => {
    setError("");
    setState("connecting");

    try {
      const res = await fetch("/api/demo/start", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.fallback ? l.errorBusy : (data.error || l.errorGeneric));
        setState("idle");
        return;
      }

      setSessionId(data.sessionId);

      await connect({
        auth: { type: "accessToken" as const, value: data.accessToken },
        configId: data.configId,
      });
    } catch {
      setError(l.errorGeneric);
      setState("idle");
    }
  }, [connect, l]);

  const handleEnd = useCallback(async () => {
    if (readyState === VoiceReadyState.OPEN) {
      disconnect();
    }
    setState("ended");

    if (sessionId) {
      try {
        const res = await fetch("/api/demo/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            durationSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
            transcript: transcriptRef.current,
          }),
        });
        const data = await res.json();
        if (res.ok) setConversionData(data);
      } catch {
        // Non-critical — conversion card just won't show trade-specific data
      }
    }
  }, [sessionId, readyState, disconnect]);

  const handleReset = useCallback(() => {
    setState("idle");
    setSessionId(null);
    setElapsed(0);
    setConversionData(null);
    setError("");
    transcriptRef.current = [];
  }, []);

  const recentMessages = messages
    .filter(
      (m): m is typeof m & { message: { role: string; content: string } } =>
        "message" in m &&
        typeof (m as { message?: { content?: string } }).message?.content === "string",
    )
    .slice(-4);

  // ── IDLE STATE ──
  if (state === "idle") {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(197,154,39,0.15)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C59A27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white">{l.idleTitle}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{l.idleSub}</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">{error}</div>
        )}

        <button
          onClick={handleStart}
          className="w-full rounded-lg px-6 py-4 text-base font-semibold text-white transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg, #C59A27, #A17D1F)" }}
        >
          {l.idleCta}
        </button>

        <div className="flex items-center justify-center gap-4">
          <a
            href={phoneTel}
            className="text-sm font-medium text-slate-400 transition hover:text-white"
          >
            {l.idleCallCta} &rarr;
          </a>
        </div>

        <p className="text-center text-xs text-slate-500">{l.micNote}</p>
        <p className="text-center text-xs font-medium text-amber-400/70">{l.trySpanish}</p>
      </div>
    );
  }

  // ── CONNECTING STATE ──
  if (state === "connecting") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(197,154,39,0.15)" }}>
          <CaptaSpinner size={32} />
        </div>
        <p className="text-lg font-semibold text-white">{l.connectingTitle}</p>
        <div className="mt-4 flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-amber-500"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── ACTIVE STATE ──
  if (state === "active") {
    return (
      <div className="space-y-4">
        {/* Header with timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-400">{l.activeListening}</span>
          </div>
          <span className="tabular-nums text-sm text-slate-500">
            {l.elapsed} {formatTime(elapsed)}
            {elapsed >= 270 && <span className="ml-2 text-amber-400">(ending soon)</span>}
          </span>
        </div>

        {/* Avatar + waveform */}
        <div className="flex flex-col items-center py-4">
          <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "rgba(197,154,39,0.15)" }}>
            <div className="absolute inset-0 animate-ping rounded-full bg-amber-500/10" style={{ animationDuration: "2s" }} />
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C59A27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          </div>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="wave-bar h-8 w-1.5 rounded-full bg-[#C59A27]"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>

        {/* Live transcript */}
        {recentMessages.length > 0 && (
          <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg bg-black/40 p-3">
            {recentMessages.map((msg, i) => {
              const isAI = msg.message.role === "assistant";
              return (
                <div key={i} className={`text-sm ${isAI ? "text-slate-200" : "text-slate-400"}`}>
                  <span className={`text-xs font-medium ${isAI ? "text-[#C59A27]" : "text-slate-500"}`}>
                    {isAI ? "Maria" : lang === "en" ? "You" : "Tú"}:
                  </span>{" "}
                  {msg.message.content}
                </div>
              );
            })}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={() => setMuted(!muted)}
            className="flex-1 rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors"
            style={{ background: muted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)" }}
          >
            {muted ? l.activeUnmute : l.activeMute}
          </button>
          <button
            onClick={handleEnd}
            className="flex-1 rounded-lg bg-red-500/90 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500"
          >
            {l.activeEnd}
          </button>
        </div>
      </div>
    );
  }

  // ── ENDED STATE — Conversion Card ──
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">
          {conversionData?.businessName
            ? `${l.endedTitleBiz} ${conversionData.businessName}?`
            : `${l.endedTitle}`}
        </h3>
      </div>

      {/* Stats from conversation */}
      {conversionData && (conversionData.tradeLabel || conversionData.estimatedMonthlyLoss) && (
        <div className="space-y-2 rounded-lg bg-white/5 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
            {lang === "en" ? "Based on our conversation:" : "Basado en nuestra conversación:"}
          </p>
          {conversionData.tradeLabel && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{l.endedTrade}</span>
              <span className="font-medium text-white">{conversionData.tradeLabel}</span>
            </div>
          )}
          {conversionData.estimatedMonthlyLoss && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{l.endedLoss}</span>
              <span className="font-semibold text-red-400">
                ${conversionData.estimatedMonthlyLoss.toLocaleString()}{l.perMonth}
              </span>
            </div>
          )}
          {conversionData.callsToPayForMaria && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{l.endedPayback}</span>
              <span className="font-semibold text-green-400">
                {conversionData.callsToPayForMaria} {l.endedCalls}
              </span>
            </div>
          )}
        </div>
      )}

      <a
        href="#signup"
        className="block w-full rounded-lg px-6 py-4 text-center text-base font-semibold text-white transition-all hover:brightness-110"
        style={{ background: "linear-gradient(135deg, #C59A27, #A17D1F)" }}
      >
        {l.endedCta}
        <span className="mt-1 block text-xs font-normal text-white/70">{l.endedCtaSub}</span>
      </a>

      <button
        onClick={handleReset}
        className="w-full text-center text-sm font-medium text-slate-400 transition hover:text-white"
      >
        {l.endedRetry} &rarr;
      </button>
    </div>
  );
}

export default function MariaDemoWidget({ lang = "en", phoneTel = "" }: { lang?: Lang; phoneTel?: string }) {
  return (
    <VoiceProvider
      onError={(err) => console.error("Demo voice error:", err)}
      onClose={() => {}}
    >
      <DemoWidgetInner lang={lang} phoneTel={phoneTel} />
    </VoiceProvider>
  );
}
