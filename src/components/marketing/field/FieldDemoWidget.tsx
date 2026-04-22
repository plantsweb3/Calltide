"use client";

/**
 * Field Manual-styled ElevenLabs demo widget.
 *
 * Wraps @elevenlabs/react's useConversation + the server-side
 * /api/demo/start and /api/demo/end endpoints. Same plumbing as
 * the legacy MariaDemoWidget, restyled for the cream/navy/amber
 * Field Manual aesthetic.
 *
 * States: idle → connecting → active → ended. A 5-min timer
 * auto-ends the session. When NEXT_PUBLIC_ELEVENLABS_DEMO_AGENT_ID
 * is unset, renders a phone fallback.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import type { Lang } from "@/lib/marketing/translations";
import { C } from "./palette";
import { Mono } from "./atoms";

type DemoState = "idle" | "connecting" | "active" | "ended";

const LABELS = {
  en: {
    kicker: "Hear a real call",
    idleTitle: "Talk to Maria right now.",
    idleSub: "Mic on, 60 seconds, no signup. Try English or Spanish — she'll switch mid-sentence.",
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
    endedSub: "Start your 14-day trial. Your receptionist is live in about five minutes.",
    endedCta: "Start 14-day free trial",
    retry: "Talk again",
    errorBusy: "She's on another call. Start your free trial to talk anytime.",
    errorGeneric: "Couldn't connect. Try again.",
    trySpanish: "Try Spanish — she switches instantly.",
    you: "You",
    ai: "Maria",
    fallbackTitle: "Hear Maria live.",
    fallbackSub: "Call the line below and talk to her the way your customers will.",
    fallbackCta: "Call to try Maria",
  },
  es: {
    kicker: "Escucha una llamada real",
    idleTitle: "Habla con María ahora.",
    idleSub: "Micrófono activo, 60 segundos, sin registro. Prueba en inglés o español — ella cambia a mitad de frase.",
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
    endedSub: "Comienza tu prueba de 14 días. Tu recepcionista está activa en unos cinco minutos.",
    endedCta: "Comenzar prueba de 14 días",
    retry: "Hablar otra vez",
    errorBusy: "Está en otra llamada. Comienza tu prueba gratis para hablar cuando quieras.",
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

/* ═══════════════════════════════════════════════════════════════════
   Shared shell — cream panel, navy/amber accents
   ═══════════════════════════════════════════════════════════════════ */

function Panel({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const l = LABELS[lang];
  return (
    <div
      style={{
        background: C.paper,
        border: `1px solid ${C.rule}`,
      }}
    >
      <div
        style={{
          padding: "14px 18px 10px",
          borderBottom: `1px solid ${C.ruleSoft}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: C.amber,
            display: "inline-block",
          }}
        />
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.amber,
            fontWeight: 700,
          }}
        >
          {l.kicker}
        </span>
      </div>
      <div style={{ padding: "18px" }}>{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Fallback — shown when no demo agent is configured
   ═══════════════════════════════════════════════════════════════════ */

function DemoPhoneFallback({
  lang,
  phone,
  phoneHref,
}: {
  lang: Lang;
  phone: string;
  phoneHref: string;
}) {
  const l = LABELS[lang];
  return (
    <Panel lang={lang}>
      <div
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontVariationSettings: '"SOFT" 30, "WONK" 0',
          fontSize: 22,
          lineHeight: 1.25,
          color: C.ink,
          letterSpacing: "-0.005em",
          fontWeight: 500,
        }}
      >
        {l.fallbackTitle}
      </div>
      <p style={{ marginTop: 10, fontSize: 14, color: C.inkMuted, lineHeight: 1.5 }}>
        {l.fallbackSub}
      </p>
      <a
        href={phoneHref}
        style={{
          marginTop: 16,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: C.navy,
          color: C.paper,
          padding: "12px 18px",
          borderRadius: 4,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          letterSpacing: "-0.005em",
          border: `1px solid ${C.navy}`,
        }}
      >
        {l.fallbackCta}
        <Mono style={{ fontSize: 13, color: C.paper }}>{phone}</Mono>
        <span style={{ fontSize: 13 }}>→</span>
      </a>
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Active widget — idle/connecting/active/ended states
   ═══════════════════════════════════════════════════════════════════ */

export function FieldDemoWidget({
  lang,
  phone,
  phoneHref,
}: {
  lang: Lang;
  phone: string;
  phoneHref: string;
}) {
  if (!process.env.NEXT_PUBLIC_ELEVENLABS_DEMO_AGENT_ID) {
    return <DemoPhoneFallback lang={lang} phone={phone} phoneHref={phoneHref} />;
  }
  return <FieldDemoWidgetActive lang={lang} phone={phone} phoneHref={phoneHref} />;
}

function FieldDemoWidgetActive({
  lang,
  phone,
  phoneHref,
}: {
  lang: Lang;
  phone: string;
  phoneHref: string;
}) {
  const l = LABELS[lang];
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

  // Keep refs in sync so the useConversation callbacks (which capture the
  // closure at mount time) can read current values without a stale closure.
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const conversation = useConversation({
    micMuted: muted,
    onConnect: () => setState("active"),
    onDisconnect: () => {
      // The SDK has already torn down the session — we just log + transition.
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

  // Elapsed timer while active
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  // Connection timeout — abort after 15s stuck
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

  // 5-minute auto-end — defined after handleEnd so the reference is resolved.
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

  /* ── IDLE ─────────────────────────────────────────────────────── */
  if (state === "idle") {
    return (
      <Panel lang={lang}>
        <div
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontVariationSettings: '"SOFT" 30, "WONK" 0',
            fontSize: 22,
            lineHeight: 1.25,
            color: C.ink,
            letterSpacing: "-0.005em",
            fontWeight: 500,
          }}
        >
          {l.idleTitle}
        </div>
        <p style={{ marginTop: 10, fontSize: 14, color: C.inkMuted, lineHeight: 1.5 }}>
          {l.idleSub}
        </p>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              background: C.paperDark,
              border: `1px solid ${C.rule}`,
              fontSize: 13,
              color: C.ink,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleStart}
          style={{
            marginTop: 16,
            width: "100%",
            background: C.navy,
            color: C.paper,
            fontSize: 15,
            fontWeight: 600,
            padding: "14px 18px",
            borderRadius: 4,
            border: `1px solid ${C.navy}`,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            letterSpacing: "-0.005em",
            transition: "background 150ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.navyLight)}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.navy)}
        >
          {l.idleCta}
          <span style={{ fontSize: 13, opacity: 0.9 }}>→</span>
        </button>

        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-2"
          style={{ fontSize: 12, color: C.inkMuted }}
        >
          <span>{l.micNote}</span>
          <a
            href={phoneHref}
            style={{
              color: C.ink,
              fontWeight: 600,
              textDecoration: "underline",
              textUnderlineOffset: 3,
              textDecorationColor: C.rule,
            }}
          >
            <Mono>{phone}</Mono>
          </a>
        </div>
        <div
          className="mt-3"
          style={{
            fontSize: 12,
            color: C.amber,
            fontWeight: 600,
            fontStyle: "italic",
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontVariationSettings: '"SOFT" 100, "WONK" 0',
          }}
        >
          {l.trySpanish}
        </div>
      </Panel>
    );
  }

  /* ── CONNECTING ───────────────────────────────────────────────── */
  if (state === "connecting") {
    return (
      <Panel lang={lang}>
        <div className="flex items-center gap-3" style={{ padding: "20px 0" }}>
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: C.amber,
                  display: "inline-block",
                  animation: `fieldDemoBounce 1s ${i * 0.15}s infinite ease-in-out`,
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{l.connecting}</span>
        </div>
        <style>{`
          @keyframes fieldDemoBounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
            40% { transform: translateY(-4px); opacity: 1; }
          }
        `}</style>
      </Panel>
    );
  }

  /* ── ACTIVE ───────────────────────────────────────────────────── */
  if (state === "active") {
    return (
      <Panel lang={lang}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: C.forest,
                display: "inline-block",
                boxShadow: `0 0 0 4px ${C.paperDark}`,
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{l.listening}</span>
          </div>
          <Mono
            style={{
              fontSize: 12,
              color: elapsed >= 270 ? C.amber : C.inkMuted,
              fontWeight: 600,
            }}
          >
            {l.elapsed} {formatTime(elapsed)}
            {elapsed >= 270 && (
              <span style={{ color: C.amber, marginLeft: 6, fontWeight: 500 }}>
                · {l.endingSoon}
              </span>
            )}
          </Mono>
        </div>

        {recent.length > 0 && (
          <div
            style={{
              background: C.paperDark,
              border: `1px solid ${C.ruleSoft}`,
              padding: "10px 12px",
              minHeight: 96,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {recent.map((msg, i) => {
              const isAI = msg.role === "assistant";
              return (
                <div key={i} style={{ fontSize: 13, lineHeight: 1.4 }}>
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: isAI ? C.amber : C.inkMuted,
                      fontWeight: 700,
                      marginRight: 8,
                    }}
                  >
                    {isAI ? l.ai : l.you}
                  </span>
                  <span style={{ color: C.ink }}>{msg.content}</span>
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
              color: C.ink,
              fontSize: 13,
              fontWeight: 600,
              padding: "10px 14px",
              borderRadius: 4,
              border: `1px solid ${C.rule}`,
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
              background: C.ink,
              color: C.paper,
              fontSize: 13,
              fontWeight: 600,
              padding: "10px 14px",
              borderRadius: 4,
              border: `1px solid ${C.ink}`,
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

  /* ── ENDED ────────────────────────────────────────────────────── */
  return (
    <Panel lang={lang}>
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <span
          aria-hidden
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: C.forest,
            display: "inline-block",
          }}
        />
        <Mono style={{ fontSize: 12, color: C.inkMuted, letterSpacing: "0.04em" }}>
          {l.elapsed} {formatTime(elapsed)}
        </Mono>
      </div>
      <div
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontVariationSettings: '"SOFT" 30, "WONK" 0',
          fontSize: 22,
          lineHeight: 1.25,
          color: C.ink,
          letterSpacing: "-0.005em",
          fontWeight: 500,
        }}
      >
        {l.endedTitle}
      </div>
      <p style={{ marginTop: 10, fontSize: 14, color: C.inkMuted, lineHeight: 1.5 }}>
        {l.endedSub}
      </p>
      <a
        href={setupHref}
        style={{
          marginTop: 16,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: C.navy,
          color: C.paper,
          padding: "12px 18px",
          borderRadius: 4,
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          letterSpacing: "-0.005em",
          border: `1px solid ${C.navy}`,
        }}
      >
        {l.endedCta}
        <span style={{ fontSize: 13 }}>→</span>
      </a>
      <button
        type="button"
        onClick={handleReset}
        style={{
          marginTop: 12,
          background: "transparent",
          color: C.inkMuted,
          fontSize: 13,
          fontWeight: 600,
          border: "none",
          padding: 0,
          cursor: "pointer",
          textDecoration: "underline",
          textUnderlineOffset: 3,
          textDecorationColor: C.rule,
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
