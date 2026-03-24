"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import CaptaSpinner from "@/components/capta-spinner";

type DemoState = "idle" | "connecting" | "active" | "ended";
type Lang = "en" | "es";

const DEMO_VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", desc: { en: "Professional & polished", es: "Profesional y pulida" }, gender: "female" },
  { id: "jBpfAFnaylXS5xpurlZD", name: "Lily", desc: { en: "Friendly & approachable", es: "Amigable y accesible" }, gender: "female" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", desc: { en: "Warm & caring", es: "Cálido y atento" }, gender: "male" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Rachel", desc: { en: "Clear & confident", es: "Clara y segura" }, gender: "female" },
] as const;

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
    idleTitle: "Talk to Your Receptionist",
    idleSub: "Want to see how she handles your calls? Talk to her right now — no signup, no email. Just a conversation.",
    idleCta: "Start a Conversation",
    idleCallCta: "Or call her",
    connectingTitle: "Getting ready...",
    activeListening: "Listening... speak naturally",
    activeEnd: "End Conversation",
    activeMute: "Mute",
    activeUnmute: "Unmute",
    endedTitle: "Ready to Get Started?",
    endedTitleBiz: "Ready to Get Capta for",
    endedTrade: "Your trade",
    endedLoss: "Estimated missed-call cost",
    endedPayback: "Capta pays for itself after",
    endedCalls: "calls",
    endedCta: "Get Capta",
    endedCtaSub: "Your receptionist will be live in 5 minutes",
    endedRetry: "Talk again",
    micNote: "Uses your browser microphone",
    elapsed: "Elapsed",
    errorBusy: "She's busy right now. Get Capta to talk to her anytime.",
    errorGeneric: "Could not connect. Please try again.",
    trySpanish: "Try speaking Spanish — she'll switch instantly.",
    perMonth: "/mo",
  },
  es: {
    idleTitle: "Habla con Tu Recepcionista",
    idleSub: "¿Quieres ver cómo maneja tus llamadas? Habla con ella ahora — sin registro, sin correo. Solo una conversación.",
    idleCta: "Iniciar Conversación",
    idleCallCta: "O llámala",
    connectingTitle: "Preparándose...",
    activeListening: "Escuchando... habla naturalmente",
    activeEnd: "Terminar Conversación",
    activeMute: "Silenciar",
    activeUnmute: "Activar",
    endedTitle: "¿Lista para Empezar?",
    endedTitleBiz: "¿Lista para Obtener Capta para",
    endedTrade: "Tu industria",
    endedLoss: "Costo estimado de llamadas perdidas",
    endedPayback: "Capta se paga solo después de",
    endedCalls: "llamadas",
    endedCta: "Obtén Capta",
    endedCtaSub: "Tu recepcionista estará activa en 5 minutos",
    endedRetry: "Hablar de nuevo",
    micNote: "Usa el micrófono de tu navegador",
    elapsed: "Tiempo",
    errorBusy: "Está ocupada ahora. Obtén Capta para hablar con ella cuando quieras.",
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

export default function MariaDemoWidget({ lang = "en", phoneTel = "" }: { lang?: Lang; phoneTel?: string }) {
  const [state, setState] = useState<DemoState>("idle");
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [conversionData, setConversionData] = useState<ConversionData | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>(DEMO_VOICES[0].id);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const transcriptRef = useRef<{ role: string; content: string }[]>([]);
  const [recentMessages, setRecentMessages] = useState<{ role: string; content: string }[]>([]);
  const l = LABELS[lang];

  const conversation = useConversation({
    micMuted: muted,
    onConnect: () => {
      setState("active");
    },
    onDisconnect: () => {
      if (state === "active") {
        handleEnd();
      } else if (state === "connecting") {
        setError(l.errorGeneric);
        setState("idle");
      }
    },
    onError: (message) => {
      console.error("Demo voice error:", message);
      if (state === "connecting") {
        setError(l.errorGeneric);
        setState("idle");
      }
    },
    onMessage: (msg) => {
      if (msg.message) {
        const role = msg.role === "agent" ? "assistant" : "user";
        const content = msg.message;
        transcriptRef.current.push({ role, content });
        setRecentMessages((prev) => [...prev, { role, content }].slice(-4));
      }
    },
  });

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

  // Connection timeout — if stuck in "connecting" for 15s, abort
  useEffect(() => {
    if (state !== "connecting") return;
    const timeout = setTimeout(() => {
      try { conversation.endSession(); } catch { /* ignore */ }
      setError(l.errorGeneric);
      setState("idle");
    }, 15_000);
    return () => clearTimeout(timeout);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  // 5-minute auto-end
  useEffect(() => {
    if (elapsed >= 300 && state === "active") {
      handleEnd();
    }
  }, [elapsed, state]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreviewVoice = useCallback(async (voiceId: string) => {
    // Stop any current preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewingVoice === voiceId) {
      setPreviewingVoice(null);
      return;
    }
    setPreviewingVoice(voiceId);
    try {
      const sampleText = lang === "es"
        ? "Hola, gracias por llamar. ¿En qué puedo ayudarte hoy?"
        : "Hi there, thanks for calling. How can I help you today?";
      const res = await fetch("/api/setup/greeting-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sampleText, voiceId, lang }),
      });
      if (!res.ok) { setPreviewingVoice(null); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      audio.onended = () => { setPreviewingVoice(null); URL.revokeObjectURL(url); };
      audio.play();
    } catch {
      setPreviewingVoice(null);
    }
  }, [previewingVoice, lang]);

  const handleStart = useCallback(async () => {
    // Stop any voice preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setPreviewingVoice(null);
    }
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

      // Connect using ElevenLabs signed URL with voice override
      await conversation.startSession({
        signedUrl: data.signedUrl,
        overrides: {
          tts: { voiceId: selectedVoice },
        },
      });
    } catch {
      setError(l.errorGeneric);
      setState("idle");
    }
  }, [conversation, l, selectedVoice]);

  const handleEnd = useCallback(async () => {
    try { await conversation.endSession(); } catch { /* ignore */ }
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
  }, [sessionId, conversation]);

  const handleReset = useCallback(() => {
    setState("idle");
    setSessionId(null);
    setElapsed(0);
    setConversionData(null);
    setError("");
    setRecentMessages([]);
    transcriptRef.current = [];
  }, []);

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

        {/* Voice picker */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {lang === "en" ? "Choose a voice" : "Elige una voz"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_VOICES.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVoice(v.id)}
                className="group relative rounded-lg px-3 py-2.5 text-left text-sm transition-all"
                style={{
                  background: selectedVoice === v.id ? "rgba(197,154,39,0.15)" : "rgba(255,255,255,0.04)",
                  border: selectedVoice === v.id ? "1px solid rgba(197,154,39,0.4)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{v.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePreviewVoice(v.id); }}
                    className="text-xs text-slate-500 transition hover:text-[#C59A27]"
                  >
                    {previewingVoice === v.id
                      ? (lang === "en" ? "Stop" : "Parar")
                      : "▶"}
                  </button>
                </div>
                <span className="text-xs text-slate-400">{v.desc[lang]}</span>
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">{error}</div>
            {phoneTel && (
              <a
                href={phoneTel}
                className="block w-full rounded-lg px-6 py-4 text-center text-base font-semibold text-white transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #C59A27, #A17D1F)" }}
              >
                {l.idleCallCta} &rarr;
              </a>
            )}
            <button
              onClick={() => { setError(""); handleStart(); }}
              className="w-full text-center text-sm font-medium text-slate-400 transition hover:text-white"
            >
              {lang === "en" ? "Try again" : "Intentar de nuevo"} &rarr;
            </button>
          </div>
        ) : (
          <>
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
          </>
        )}
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
        {phoneTel && (
          <a
            href={phoneTel}
            className="mt-4 text-sm text-slate-400 transition hover:text-white"
          >
            {l.idleCallCta} &rarr;
          </a>
        )}
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
              const isAI = msg.role === "assistant";
              return (
                <div key={i} className={`text-sm ${isAI ? "text-slate-200" : "text-slate-400"}`}>
                  <span className={`text-xs font-medium ${isAI ? "text-[#C59A27]" : "text-slate-500"}`}>
                    {isAI ? "AI" : lang === "en" ? "You" : "Tú"}:
                  </span>{" "}
                  {msg.content}
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
        href={`/setup${selectedVoice !== DEMO_VOICES[0].id ? `?voice=${selectedVoice}` : ""}`}
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
