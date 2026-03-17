"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  id: string;
  role: string;
  content: string;
  toolsUsed?: string[];
  createdAt: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [receptionistName, setReceptionistName] = useState("Maria");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load chat history when opened
  useEffect(() => {
    if (!open || loaded) return;

    const controller = new AbortController();
    fetch("/api/dashboard/chat", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setMessages(data.messages || []);
        setGreeting(data.greeting || "");
        setReceptionistName(data.receptionistName || "Maria");
        setLoaded(true);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLoadError(true);
        setLoaded(true);
      });

    return () => controller.abort();
  }, [open, loaded]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open, scrollToBottom]);

  // Focus input when opened
  useEffect(() => {
    if (open && loaded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, loaded]);

  // Escape key closes the panel
  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  // Cleanup inflight request on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);

    // Abort any previous inflight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Add user message optimistically
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/dashboard/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      const assistantMsg: Message = {
        id: `resp-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        toolsUsed: data.toolsUsed,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't process that. Please try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(iso: string): string {
    try {
      return new Date(iso).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  const hasInput = input.trim().length > 0;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="chat-fab fixed z-50 flex items-center gap-2.5 rounded-full px-5 py-3.5 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_30px_rgba(212,168,67,0.3)]"
          style={{
            bottom: "1.5rem",
            right: "4.5rem",
            background: "linear-gradient(135deg, #1B2A4A 0%, #2a3d6a 100%)",
            color: "#fff",
            border: "1px solid rgba(212, 168, 67, 0.2)",
          }}
          aria-label={`Chat with ${receptionistName}`}
        >
          {/* Gold accent ring */}
          <div className="relative flex h-6 w-6 items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {/* Online pulse */}
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
          </div>
          <span className="text-sm font-medium hidden sm:inline tracking-wide">Ask {receptionistName}</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:bg-black/20 md:backdrop-blur-none"
            onClick={() => setOpen(false)}
            style={{ animation: "fadeIn 0.2s ease-out" }}
          />
          <aside
            className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[420px] flex-col"
            style={{
              background: "var(--db-bg)",
              borderLeft: "1px solid var(--db-border)",
              animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "-8px 0 30px rgba(0, 0, 0, 0.15)",
            }}
            role="dialog"
            aria-label={`Chat with ${receptionistName}`}
          >
            {/* Header — frosted glass */}
            <div
              className="relative flex items-center gap-3.5 px-5 py-4"
              style={{
                background: "linear-gradient(135deg, #1B2A4A 0%, #223358 50%, #2a3d6a 100%)",
                borderBottom: "1px solid rgba(212, 168, 67, 0.15)",
              }}
            >
              {/* Avatar with gold ring */}
              <div className="relative">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    background: "linear-gradient(135deg, rgba(212, 168, 67, 0.25), rgba(212, 168, 67, 0.1))",
                    color: "#D4A843",
                    boxShadow: "0 0 0 2px rgba(212, 168, 67, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)",
                    letterSpacing: "0.5px",
                  }}
                >
                  {receptionistName[0]}
                </div>
                {/* Online indicator */}
                <span
                  className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full"
                  style={{ background: "#1B2A4A", padding: "2px" }}
                >
                  <span className="h-full w-full rounded-full bg-emerald-400" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-white tracking-tight">{receptionistName}</p>
                <p className="text-xs font-medium" style={{ color: "rgba(212, 168, 67, 0.8)" }}>
                  Your AI Office Manager
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200"
                style={{
                  color: "rgba(255,255,255,0.5)",
                  background: "rgba(255,255,255,0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                aria-label="Close chat"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {/* Loading state */}
              {!loaded && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                      style={{ borderColor: "rgba(212, 168, 67, 0.3)", borderTopColor: "transparent" }}
                    />
                    <p className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
                      Loading conversation...
                    </p>
                  </div>
                </div>
              )}

              {/* Load error */}
              {loaded && loadError && messages.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                    Couldn&apos;t load chat history. You can still send messages.
                  </p>
                </div>
              )}

              {/* Empty state with suggestions */}
              {loaded && messages.length === 0 && !loadError && (
                <div className="chat-msg-enter flex flex-col items-center py-8">
                  {/* Large avatar */}
                  <div
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold"
                    style={{
                      background: "linear-gradient(135deg, rgba(212, 168, 67, 0.2), rgba(212, 168, 67, 0.05))",
                      color: "#D4A843",
                      boxShadow: "0 0 0 3px rgba(212, 168, 67, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {receptionistName[0]}
                  </div>
                  {greeting ? (
                    <p className="text-sm text-center mb-6 max-w-[280px] leading-relaxed" style={{ color: "var(--db-text)" }}>
                      {greeting}
                    </p>
                  ) : (
                    <p className="text-sm text-center mb-6 max-w-[280px] leading-relaxed" style={{ color: "var(--db-text-muted)" }}>
                      Ask me anything about your calls, appointments, customers, or business.
                    </p>
                  )}
                  {/* Quick action chips */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      "What\u2019s my schedule today?",
                      "How many calls this week?",
                      "Any missed calls?",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInput(suggestion);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        className="rounded-full px-3.5 py-2 text-xs font-medium transition-all duration-200"
                        style={{
                          background: "var(--db-surface)",
                          color: "var(--db-text-muted)",
                          border: "1px solid var(--db-border)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "rgba(212, 168, 67, 0.4)";
                          e.currentTarget.style.color = "#D4A843";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--db-border)";
                          e.currentTarget.style.color = "var(--db-text-muted)";
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`chat-msg-enter flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                  style={{ animationDelay: `${Math.min(idx * 30, 200)}ms` }}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-1"
                      style={{
                        background: "linear-gradient(135deg, rgba(212, 168, 67, 0.2), rgba(212, 168, 67, 0.08))",
                        color: "#D4A843",
                      }}
                    >
                      {receptionistName[0]}
                    </div>
                  )}
                  <div className="max-w-[80%]">
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        msg.role === "user"
                          ? "rounded-br-md"
                          : "rounded-bl-md"
                      }`}
                      style={
                        msg.role === "user"
                          ? {
                              background: "linear-gradient(135deg, #D4A843 0%, #c49a3a 100%)",
                              color: "#0f1729",
                              boxShadow: "0 2px 8px rgba(212, 168, 67, 0.25)",
                            }
                          : {
                              background: "var(--db-surface)",
                              color: "var(--db-text)",
                              border: "1px solid var(--db-border)",
                              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
                            }
                      }
                    >
                      <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 px-1">
                      <span className="text-[10px] font-medium" style={{ color: "var(--db-text-muted)", opacity: 0.7 }}>
                        {formatTime(msg.createdAt)}
                      </span>
                      {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium"
                          style={{
                            background: "rgba(212, 168, 67, 0.1)",
                            color: "#D4A843",
                          }}
                        >
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                          </svg>
                          {msg.toolsUsed.map((t) => t.replace(/_/g, " ").replace("get ", "")).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {sending && (
                <div className="chat-msg-enter flex gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-1"
                    style={{
                      background: "linear-gradient(135deg, rgba(212, 168, 67, 0.2), rgba(212, 168, 67, 0.08))",
                      color: "#D4A843",
                    }}
                  >
                    {receptionistName[0]}
                  </div>
                  <div
                    className="rounded-2xl rounded-bl-md px-4 py-3"
                    style={{
                      background: "var(--db-surface)",
                      border: "1px solid var(--db-border)",
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="typing-dot" style={{ animationDelay: "0ms" }} />
                      <span className="typing-dot" style={{ animationDelay: "160ms" }} />
                      <span className="typing-dot" style={{ animationDelay: "320ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div
              className="px-5 py-4"
              style={{
                borderTop: "1px solid var(--db-border)",
                background: "var(--db-bg)",
              }}
            >
              <div
                className="chat-input-wrap flex items-end gap-2 rounded-2xl px-4 py-3 transition-all duration-200"
                style={{
                  background: "var(--db-surface)",
                  border: `1.5px solid ${hasInput ? "rgba(212, 168, 67, 0.4)" : "var(--db-border)"}`,
                  boxShadow: hasInput
                    ? "0 0 0 3px rgba(212, 168, 67, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)"
                    : "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${receptionistName}...`}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none"
                  style={{
                    color: "var(--db-text)",
                    maxHeight: "100px",
                  }}
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={!hasInput || sending}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200"
                  style={{
                    background: hasInput && !sending
                      ? "linear-gradient(135deg, #D4A843, #c49a3a)"
                      : "transparent",
                    color: hasInput && !sending ? "#0f1729" : "var(--db-text-muted)",
                    opacity: hasInput && !sending ? 1 : 0.3,
                    boxShadow: hasInput && !sending
                      ? "0 2px 8px rgba(212, 168, 67, 0.3)"
                      : "none",
                    transform: hasInput && !sending ? "scale(1)" : "scale(0.9)",
                  }}
                  aria-label="Send message"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] font-medium tracking-wide" style={{ color: "var(--db-text-muted)", opacity: 0.6 }}>
                {receptionistName} can look up your calls, appointments, customers, and more
              </p>
            </div>
          </aside>

          <style jsx>{`
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0.8;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .chat-msg-enter {
              animation: msgSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            @keyframes msgSlideUp {
              from {
                opacity: 0;
                transform: translateY(8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .typing-dot {
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: var(--db-text-muted);
              opacity: 0.6;
              animation: typingPulse 1.4s ease-in-out infinite;
            }
            @keyframes typingPulse {
              0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.4;
              }
              30% {
                transform: translateY(-5px);
                opacity: 0.9;
              }
            }
          `}</style>
        </>
      )}
    </>
  );
}
