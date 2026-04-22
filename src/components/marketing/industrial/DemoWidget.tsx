"use client";

/**
 * IndustrialDemoWidget — navy + gold + Truck White demo widget for the
 * brand-kit homepage. Same ElevenLabs plumbing as FieldDemoWidget
 * (useConversation + /api/demo/start + /api/demo/end), restyled for
 * the industrial premium aesthetic.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import type { Lang } from "@/lib/marketing/translations";

type DemoState = "idle" | "connecting" | "active" | "ended";

const C = {
  navy: "#1B2A4A",
  navyLight: "#263556",
  midnight: "#0F1729",
  gold: "#D4A843",
  goldDark: "#A17D1F",
  truck: "#F8FAFC",
  white: "#FFFFFF",
  ink: "#0F1729",
  inkMuted: "#475569",
  inkSoft: "#64748B",
  border: "#E2E8F0",
  borderSoft: "#F1F5F9",
  green: "#16A34A",
};

const LABELS = {
  en: {
    kicker: "Live demo",
    idleTitle: "Talk to Maria right now.",
    idleSub: "Mic on, under a minute, no signup. Try English or Spanish — she switches mid-sentence.",
    idleCta: "Start the call",
    micNote: "Uses your browser microphone. 5-minute max.",
    connecting: "Connecting…",
    listening: "Listening — speak naturally.",
    endCall: "End call",
    mute: "Mute",
    unmute: "Unmute",
    elapsed: "Elapsed",
    endingSoon: "ending soon",
    endedTitle: "Ready to put her on your line?",
    endedSub: "Start your 14-day free trial. Your receptionist is live in about five minutes.",
    endedCta: "Get Capta",
    retry: "Talk again",
    errorBusy: "She's on another call. Get Capta to talk anytime.",
    errorGeneric: "Couldn't connect. Try again.",
    trySpanish: "Try Spanish — she switches instantly.",
    you: "You",
    ai: "Maria",
    fallbackTitle: "Hear Maria live.",
    fallbackSub: "Call the line below and talk to her the way your customers will.",
    fallbackCta: "Call to try Maria",
  },
  es: {
    kicker: "Demo en vivo",
    idleTitle: "Habla con María ahora.",
    idleSub: "Micrófono activo, menos de un minuto, sin registro. Prueba en inglés o español — cambia a mitad de frase.",
    idleCta: "Iniciar llamada",
    micNote: "Usa el micrófono de tu navegador. Máximo 5 minutos.",
    connecting: "Conectando…",
    listening: "Escuchando — habla naturalmente.",
    endCall: "Terminar llamada",
    mute: "Silenciar",
    unmute: "Activar",
    elapsed: "Tiempo",
    endingSoon: "terminando pronto",
    endedTitle: "¿Lista para ponerla en tu línea?",
    endedSub: "Comienza tu prueba gratis de 14 días. Tu recepcionista está activa en unos cinco minutos.",
    endedCta: "Obtener Capta",
    retry: "Hablar otra vez",
    errorBusy: "Está en otra llamada. Obtén Capta para hablar cuando quieras.",
    errorGeneric: "No se pudo conectar. Inténtalo de nuevo.",
    trySpanish: "Prueba en español — cambia al instante.",
    you: "Tú",
    ai: "María",
    fallbackTitle: "Escucha a María en vivo.",
    fallbackSub: "Llama al número de abajo y habla con ella como lo harán tus clientes.",
    fallbackCta: "Llama para probar a María",
  },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Panel({
  lang,
  children,
  variant = "light",
}: {
  lang: Lang;
  children: React.ReactNode;
  variant?: "light" | "dark";
}) {
  const l = LABELS[lang];
  const isDark = variant === "dark";
  return (
    <div
      style={{
        background: isDark ? C.navy : C.white,
        border: `1px solid ${isDark ? "rgba(212,168,67,0.25)" : C.border}`,
      }}
    >
      <div
        style={{
          padding: "16px 20px 12px",
          borderBottom: `1px solid ${isDark ? "rgba(212,168,67,0.15)" : C.borderSoft}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: C.gold,
            display: "inline-block",
            boxShadow: `0 0 0 4px ${isDark ? "rgba(212,168,67,0.12)" : "rgba(212,168,67,0.14)"}`,
          }}
        />
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.gold,
            fontWeight: 800,
          }}
        >
          {l.kicker}
        </span>
      </div>
      <div style={{ padding: "20px", color: isDark ? C.truck : C.ink }}>{children}</div>
    </div>
  );
}

function DemoPhoneFallback({
  lang,
  phone,
  phoneHref,
  variant,
}: {
  lang: Lang;
  phone: string;
  phoneHref: string;
  variant?: "light" | "dark";
}) {
  const l = LABELS[lang];
  return (
    <Panel lang={lang} variant={variant}>
      <div
        style={{
          fontSize: 24,
          lineHeight: 1.15,
          fontWeight: 900,
          letterSpacing: "-0.02em",
          color: variant === "dark" ? C.white : C.ink,
        }}
      >
        {l.fallbackTitle}
      </div>
      <p
        style={{
          marginTop: 12,
          fontSize: 14,
          color: variant === "dark" ? "rgba(248,250,252,0.72)" : C.inkMuted,
          lineHeight: 1.5,
        }}
      >
        {l.fallbackSub}
      </p>
      <a
        href={phoneHref}
        style={{
          marginTop: 18,
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          background: C.gold,
          color: C.midnight,
          padding: "14px 20px",
          fontSize: 15,
          fontWeight: 700,
          textDecoration: "none",
          letterSpacing: "-0.005em",
          border: `1px solid ${C.gold}`,
        }}
      >
        {l.fallbackCta}
        <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{phone}</span>
        <span>→</span>
      </a>
    </Panel>
  );
}

export function IndustrialDemoWidget({
  lang,
  phone,
  phoneHref,
  variant = "light",
}: {
  lang: Lang;
  phone: string;
  phoneHref: string;
  variant?: "light" | "dark";
}) {
  if (!process.env.NEXT_PUBLIC_ELEVENLABS_DEMO_AGENT_ID) {
    return <DemoPhoneFallback lang={lang} phone={phone} phoneHref={phoneHref} variant={variant} />;
  }
  return <IndustrialDemoWidgetActive lang={lang} phone={phone} phoneHref={phoneHref} variant={variant} />;
}

function IndustrialDemoWidgetActive({
  lang,
  phone,
  phoneHref,
  variant,
}: {
  lang: Lang;
  phone: string;
  phoneHref: string;
  variant: "light" | "dark";
}) {
  const l = LABELS[lang];
  const isDark = variant === "dark";
  const [state, setState] = useState<DemoState>("idle");
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [recent, setRecent] = useState<{ role: string; content: string }[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<DemoState>("idle");
  const sessionIdRef = useRef<string | null>(null);
  const setupHref = lang === "es" ? "/es/setup" : "/setup";

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  const conversation = useConversation({
    micMuted: muted,
    onConnect: () => setState("active"),
    onDisconnect: () => {
      if (stateRef.current === "active") {
        setState("ended");
        const sid = sessionIdRef.current;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (sid) {
          void fetch("/api/demo/end", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sid, durationSeconds: duration }),
          }).catch(() => {});
        }
      } else if (stateRef.current === "connecting") {
        setError(l.errorGeneric);
        setState("idle");
      }
    },
    onError: () => {
      if (stateRef.current === "connecting") {
        setError(l.errorGeneric);
        setState("idle");
      }
    },
    onMessage: (msg) => {
      if (!msg.message) return;
      const role = msg.role === "agent" ? "assistant" : "user";
      setRecent((prev) => [...prev, { role, content: msg.message }].slice(-3));
    },
  });

  useEffect(() => {
    if (state === "active") {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  useEffect(() => {
    if (state !== "connecting") return;
    const t = setTimeout(() => {
      try { conversation.endSession(); } catch { /* ignore */ }
      setError(l.errorGeneric);
      setState("idle");
    }, 15_000);
    return () => clearTimeout(t);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = useCallback(async () => {
    setError("");
    setState("connecting");
    try {
      const res = await fetch("/api/demo/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.fallback ? l.errorBusy : data.error || l.errorGeneric);
        setState("idle");
        return;
      }
      setSessionId(data.sessionId);
      await conversation.startSession({ signedUrl: data.signedUrl });
    } catch {
      setError(l.errorGeneric);
      setState("idle");
    }
  }, [conversation, l]);

  const handleEnd = useCallback(async () => {
    try { await conversation.endSession(); } catch { /* ignore */ }
    setState("ended");
    if (sessionId) {
      try {
        await fetch("/api/demo/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            durationSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
          }),
        });
      } catch { /* non-critical */ }
    }
  }, [sessionId, conversation]);

  useEffect(() => {
    if (elapsed >= 300 && state === "active") handleEnd();
  }, [elapsed, state, handleEnd]);

  const handleReset = useCallback(() => {
    setState("idle");
    setSessionId(null);
    setElapsed(0);
    setRecent([]);
    setError("");
  }, []);

  if (state === "idle") {
    return (
      <Panel lang={lang} variant={variant}>
        <div
          style={{
            fontSize: 26,
            lineHeight: 1.1,
            fontWeight: 900,
            letterSpacing: "-0.025em",
            color: isDark ? C.white : C.ink,
          }}
        >
          {l.idleTitle}
        </div>
        <p
          style={{
            marginTop: 12,
            fontSize: 14,
            color: isDark ? "rgba(248,250,252,0.72)" : C.inkMuted,
            lineHeight: 1.5,
          }}
        >
          {l.idleSub}
        </p>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              background: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.05)",
              border: `1px solid rgba(239,68,68,0.25)`,
              fontSize: 13,
              color: isDark ? "#FCA5A5" : "#B91C1C",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleStart}
          style={{
            marginTop: 18,
            width: "100%",
            background: C.gold,
            color: C.midnight,
            fontSize: 15,
            fontWeight: 800,
            padding: "14px 20px",
            border: `1px solid ${C.gold}`,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            letterSpacing: "-0.005em",
            transition: "background 150ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.goldDark)}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.gold)}
        >
          {l.idleCta}
          <span>→</span>
        </button>

        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-2"
          style={{ fontSize: 12, color: isDark ? "rgba(248,250,252,0.65)" : C.inkMuted }}
        >
          <span>{l.micNote}</span>
          <a
            href={phoneHref}
            style={{
              color: isDark ? C.truck : C.ink,
              fontWeight: 700,
              textDecoration: "underline",
              textUnderlineOffset: 3,
              textDecorationColor: isDark ? "rgba(212,168,67,0.5)" : C.border,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {phone}
          </a>
        </div>
        <div
          className="mt-3"
          style={{
            fontSize: 12,
            color: C.gold,
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          {l.trySpanish}
        </div>
      </Panel>
    );
  }

  if (state === "connecting") {
    return (
      <Panel lang={lang} variant={variant}>
        <div className="flex items-center gap-3" style={{ padding: "20px 0" }}>
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: C.gold,
                  display: "inline-block",
                  animation: `industrialDemoBounce 1s ${i * 0.15}s infinite ease-in-out`,
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? C.white : C.ink }}>
            {l.connecting}
          </span>
        </div>
        <style>{`
          @keyframes industrialDemoBounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
            40% { transform: translateY(-4px); opacity: 1; }
          }
        `}</style>
      </Panel>
    );
  }

  if (state === "active") {
    return (
      <Panel lang={lang} variant={variant}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: C.green,
                display: "inline-block",
                boxShadow: `0 0 0 4px ${isDark ? "rgba(22,163,74,0.18)" : "rgba(22,163,74,0.12)"}`,
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? C.white : C.ink }}>
              {l.listening}
            </span>
          </div>
          <span
            style={{
              fontSize: 12,
              color: elapsed >= 270 ? C.gold : isDark ? "rgba(248,250,252,0.65)" : C.inkMuted,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.02em",
            }}
          >
            {l.elapsed} {formatTime(elapsed)}
            {elapsed >= 270 && (
              <span style={{ color: C.gold, marginLeft: 6, fontWeight: 600 }}>
                · {l.endingSoon}
              </span>
            )}
          </span>
        </div>

        {recent.length > 0 && (
          <div
            style={{
              background: isDark ? C.midnight : C.truck,
              border: `1px solid ${isDark ? "rgba(212,168,67,0.15)" : C.borderSoft}`,
              padding: "12px 14px",
              minHeight: 108,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {recent.map((msg, i) => {
              const isAI = msg.role === "assistant";
              return (
                <div key={i} style={{ fontSize: 13, lineHeight: 1.45 }}>
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: isAI ? C.gold : (isDark ? "rgba(248,250,252,0.65)" : C.inkMuted),
                      fontWeight: 800,
                      marginRight: 8,
                    }}
                  >
                    {isAI ? l.ai : l.you}
                  </span>
                  <span style={{ color: isDark ? C.truck : C.ink }}>{msg.content}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            style={{
              flex: 1,
              background: "transparent",
              color: isDark ? C.truck : C.ink,
              fontSize: 13,
              fontWeight: 700,
              padding: "11px 14px",
              border: `1px solid ${isDark ? "rgba(248,250,252,0.35)" : C.border}`,
              cursor: "pointer",
              letterSpacing: "-0.005em",
            }}
          >
            {muted ? l.unmute : l.mute}
          </button>
          <button
            type="button"
            onClick={handleEnd}
            style={{
              flex: 1,
              background: isDark ? C.white : C.ink,
              color: isDark ? C.ink : C.white,
              fontSize: 13,
              fontWeight: 700,
              padding: "11px 14px",
              border: `1px solid ${isDark ? C.white : C.ink}`,
              cursor: "pointer",
              letterSpacing: "-0.005em",
            }}
          >
            {l.endCall}
          </button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel lang={lang} variant={variant}>
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <span
          aria-hidden
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: C.green,
            display: "inline-block",
          }}
        />
        <span
          style={{
            fontSize: 12,
            color: isDark ? "rgba(248,250,252,0.65)" : C.inkMuted,
            letterSpacing: "0.04em",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {l.elapsed} {formatTime(elapsed)}
        </span>
      </div>
      <div
        style={{
          fontSize: 26,
          lineHeight: 1.1,
          fontWeight: 900,
          letterSpacing: "-0.025em",
          color: isDark ? C.white : C.ink,
        }}
      >
        {l.endedTitle}
      </div>
      <p
        style={{
          marginTop: 12,
          fontSize: 14,
          color: isDark ? "rgba(248,250,252,0.72)" : C.inkMuted,
          lineHeight: 1.5,
        }}
      >
        {l.endedSub}
      </p>
      <a
        href={setupHref}
        style={{
          marginTop: 18,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: C.gold,
          color: C.midnight,
          padding: "14px 20px",
          fontSize: 15,
          fontWeight: 800,
          textDecoration: "none",
          letterSpacing: "-0.005em",
          border: `1px solid ${C.gold}`,
        }}
      >
        {l.endedCta}
        <span>→</span>
      </a>
      <button
        type="button"
        onClick={handleReset}
        style={{
          marginTop: 14,
          background: "transparent",
          color: isDark ? "rgba(248,250,252,0.72)" : C.inkMuted,
          fontSize: 13,
          fontWeight: 700,
          border: "none",
          padding: 0,
          cursor: "pointer",
          textDecoration: "underline",
          textUnderlineOffset: 3,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {l.retry} →
      </button>
    </Panel>
  );
}
