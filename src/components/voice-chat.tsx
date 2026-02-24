"use client";

import { useState, useEffect, useCallback } from "react";
import { VoiceProvider, useVoice, VoiceReadyState } from "@humeai/voice-react";

function VoiceChatInner({ onClose }: { onClose: () => void }) {
  const { connect, disconnect, readyState, messages } = useVoice();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/hume/token")
      .then((r) => r.json())
      .then((data) => {
        if (data.accessToken) setAccessToken(data.accessToken);
        else setError("Could not connect. Please try calling instead.");
      })
      .catch(() => setError("Could not connect. Please try calling instead."));
  }, []);

  const handleToggle = useCallback(() => {
    if (readyState === VoiceReadyState.OPEN) {
      disconnect();
    } else if (accessToken) {
      connect({
        auth: { type: "accessToken" as const, value: accessToken },
        configId: process.env.NEXT_PUBLIC_HUME_CONFIG_ID,
      }).catch(() => setError("Connection failed. Please try again."));
    }
  }, [readyState, accessToken, connect, disconnect]);

  const isConnected = readyState === VoiceReadyState.OPEN;
  const isConnecting = readyState === VoiceReadyState.CONNECTING;

  // Get the last few messages for display
  const recentMessages = messages
    .filter(
      (m): m is typeof m & { message: { role: string; content: string } } =>
        "message" in m &&
        typeof (m as { message?: { content?: string } }).message?.content ===
          "string",
    )
    .slice(-4);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-[#1A2A44] bg-[#0F1D32] p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={() => {
            if (isConnected) disconnect();
            onClose();
          }}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5A623]/15">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F5A623"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-semibold text-white">
            Talk to Our AI Receptionist
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {isConnected
              ? "Listening... speak naturally"
              : "Press the button below to start a live conversation"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Messages */}
        {recentMessages.length > 0 && (
          <div className="mb-5 max-h-48 space-y-2 overflow-y-auto rounded-xl bg-[#0A1628] p-4">
            {recentMessages.map((msg, i) => {
              const role = msg.message.role;
              const isAI = role === "assistant";
              return (
                <div
                  key={i}
                  className={`text-sm ${isAI ? "text-slate-200" : "text-slate-400"}`}
                >
                  <span
                    className={`text-xs font-medium ${isAI ? "text-[#F5A623]" : "text-slate-500"}`}
                  >
                    {isAI ? "AI" : "You"}:
                  </span>{" "}
                  {msg.message.content}
                </div>
              );
            })}
          </div>
        )}

        {/* Waveform animation when connected */}
        {isConnected && (
          <div className="mb-5 flex items-center justify-center gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="wave-bar h-8 w-1.5 rounded-full bg-[#F5A623]"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}

        {/* Action button */}
        <button
          onClick={handleToggle}
          disabled={(!accessToken && !error) || isConnecting}
          className={`w-full rounded-xl px-6 py-3.5 text-sm font-semibold transition-all ${
            isConnected
              ? "bg-red-500/90 text-white hover:bg-red-500"
              : "bg-[#F5A623] text-[#0A1628] hover:bg-[#D4901E] disabled:opacity-40 disabled:cursor-not-allowed"
          }`}
        >
          {isConnecting
            ? "Connecting..."
            : isConnected
              ? "End Conversation"
              : accessToken
                ? "Start Talking"
                : "Loading..."}
        </button>

        <p className="mt-3 text-center text-xs text-slate-500">
          This is a live demo using your browser microphone
        </p>
      </div>
    </div>
  );
}

export default function VoiceChat({ onClose }: { onClose: () => void }) {
  return (
    <VoiceProvider>
      <VoiceChatInner onClose={onClose} />
    </VoiceProvider>
  );
}
