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

  // Hide help FAB when chat is open
  useEffect(() => {
    const helpFab = document.querySelector("[data-help-fab]") as HTMLElement | null;
    if (helpFab) helpFab.style.display = open ? "none" : "";
    return () => { if (helpFab) helpFab.style.display = ""; };
  }, [open]);

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

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open, scrollToBottom]);

  useEffect(() => {
    if (open && loaded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, loaded]);

  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

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
        content: "Sorry, I couldn\u2019t process that. Please try again.",
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
          className="fixed z-50 flex items-center gap-2.5 rounded-full px-5 py-3 shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
          style={{
            bottom: "1.5rem",
            right: "4.5rem",
            background: "linear-gradient(135deg, #1B2A4A 0%, #243356 100%)",
            color: "#fff",
          }}
          aria-label={`Chat with ${receptionistName}`}
        >
          <div className="relative">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="absolute -right-1 -top-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
          </div>
          <span className="text-[13px] font-medium hidden sm:inline">Ask {receptionistName}</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-50 md:pointer-events-none"
            onClick={() => setOpen(false)}
            style={{
              background: "rgba(0,0,0,0.3)",
              animation: "chatFadeIn 0.15s ease-out",
            }}
          />
          <aside
            className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[420px] flex-col"
            style={{
              background: "var(--db-bg)",
              borderLeft: "1px solid var(--db-border)",
              animation: "chatSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.12)",
            }}
            role="dialog"
            aria-label={`Chat with ${receptionistName}`}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-5 py-3.5"
              style={{
                background: "linear-gradient(135deg, #1B2A4A 0%, #243356 100%)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Avatar */}
              <div className="relative">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
                  style={{
                    background: "rgba(212, 168, 67, 0.15)",
                    color: "#D4A843",
                    border: "1.5px solid rgba(212, 168, 67, 0.25)",
                  }}
                >
                  {receptionistName[0]}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full"
                  style={{ background: "#1B2A4A", padding: "2px" }}
                >
                  <span className="block h-full w-full rounded-full bg-emerald-400" />
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-white leading-tight">{receptionistName}</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                  AI Office Manager
                </p>
              </div>

              {/* Help button in header */}
              <button
                onClick={() => {
                  // Find and click the help FAB to open help panel
                  const helpFab = document.querySelector("[data-help-fab]") as HTMLElement | null;
                  if (helpFab) {
                    setOpen(false);
                    setTimeout(() => helpFab.click(), 100);
                  } else {
                    window.open("/help", "_blank");
                  }
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-150"
                style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                aria-label="Help articles"
                title="Help articles"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>

              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-150"
                style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                aria-label="Close chat"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {!loaded && (
                <div className="flex items-center justify-center py-16">
                  <div
                    className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
                    style={{ borderColor: "var(--db-border)", borderTopColor: "transparent" }}
                  />
                </div>
              )}

              {loaded && loadError && messages.length === 0 && (
                <div className="flex items-center justify-center py-16">
                  <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                    Couldn&apos;t load chat history. You can still send messages.
                  </p>
                </div>
              )}

              {/* Empty state */}
              {loaded && messages.length === 0 && !loadError && (
                <div className="flex flex-col items-center pt-12 pb-4">
                  <div
                    className="mb-5 flex h-14 w-14 items-center justify-center rounded-full text-xl font-semibold"
                    style={{
                      background: "rgba(212, 168, 67, 0.1)",
                      color: "#D4A843",
                      border: "1.5px solid rgba(212, 168, 67, 0.15)",
                    }}
                  >
                    {receptionistName[0]}
                  </div>
                  <p className="text-sm text-center mb-1 font-medium" style={{ color: "var(--db-text)" }}>
                    {greeting || `How can I help?`}
                  </p>
                  <p className="text-xs text-center mb-8 max-w-[260px]" style={{ color: "var(--db-text-muted)" }}>
                    Ask about calls, appointments, customers, or your business.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 max-w-[320px]">
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
                        className="rounded-full px-3 py-1.5 text-[12px] transition-colors duration-150"
                        style={{
                          background: "var(--db-surface)",
                          color: "var(--db-text-muted)",
                          border: "1px solid var(--db-border)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--db-text-muted)";
                          e.currentTarget.style.color = "var(--db-text)";
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
                  className={`chatMsgIn flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}
                  style={{ animationDelay: `${Math.min(idx * 20, 150)}ms` }}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold mt-0.5"
                      style={{
                        background: "rgba(212, 168, 67, 0.1)",
                        color: "#D4A843",
                      }}
                    >
                      {receptionistName[0]}
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === "user" ? "flex flex-col items-end" : ""}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 ${
                        msg.role === "user" ? "rounded-br-md" : "rounded-bl-md"
                      }`}
                      style={
                        msg.role === "user"
                          ? {
                              background: "linear-gradient(135deg, #D4A843, #bf9438)",
                              color: "#0f1729",
                            }
                          : {
                              background: "var(--db-surface)",
                              color: "var(--db-text)",
                              border: "1px solid var(--db-border)",
                            }
                      }
                    >
                      <p className="text-[13px] leading-[1.5] whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <span className="text-[10px]" style={{ color: "var(--db-text-muted)", opacity: 0.6 }}>
                        {formatTime(msg.createdAt)}
                      </span>
                      {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                        <span
                          className="text-[9px] font-medium rounded-full px-1.5 py-0.5"
                          style={{ background: "rgba(212, 168, 67, 0.08)", color: "rgba(212, 168, 67, 0.7)" }}
                        >
                          {msg.toolsUsed.map((t) => t.replace(/_/g, " ").replace("get ", "")).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="chatMsgIn flex gap-2.5">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold mt-0.5"
                    style={{ background: "rgba(212, 168, 67, 0.1)", color: "#D4A843" }}
                  >
                    {receptionistName[0]}
                  </div>
                  <div
                    className="rounded-2xl rounded-bl-md px-4 py-3"
                    style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
                  >
                    <div className="flex items-center gap-1">
                      <span className="chatDot" style={{ animationDelay: "0ms" }} />
                      <span className="chatDot" style={{ animationDelay: "160ms" }} />
                      <span className="chatDot" style={{ animationDelay: "320ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input — clean, no border gimmicks */}
            <div className="px-4 pb-4 pt-2">
              <div
                className="flex items-center gap-2 rounded-2xl px-4 py-1"
                style={{
                  background: "var(--db-surface)",
                  border: "1px solid var(--db-border)",
                  minHeight: "44px",
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${receptionistName}...`}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-[13px] leading-[20px] outline-none border-none shadow-none placeholder:text-[var(--db-text-muted)] focus:outline-none focus:ring-0 focus:border-none"
                  style={{ color: "var(--db-text)", maxHeight: "80px", WebkitAppearance: "none", padding: "10px 0" }}
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={!hasInput || sending}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-200"
                  style={{
                    background: hasInput && !sending ? "#D4A843" : "transparent",
                    color: hasInput && !sending ? "#0f1729" : "var(--db-text-muted)",
                    opacity: hasInput && !sending ? 1 : 0.25,
                    transform: `scale(${hasInput && !sending ? 1 : 0.85})`,
                  }}
                  aria-label="Send message"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px]" style={{ color: "var(--db-text-muted)", opacity: 0.5 }}>
                {receptionistName} can look up your calls, appointments, customers, and more
              </p>
            </div>
          </aside>

          <style jsx>{`
            aside textarea, aside textarea:focus, aside textarea:focus-visible {
              outline: none !important;
              border: none !important;
              box-shadow: none !important;
              -webkit-appearance: none;
            }
            @keyframes chatSlideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            @keyframes chatFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .chatMsgIn {
              animation: chatMsgSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
            }
            @keyframes chatMsgSlide {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .chatDot {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: var(--db-text-muted);
              opacity: 0.4;
              animation: chatDotBounce 1.4s ease-in-out infinite;
            }
            @keyframes chatDotBounce {
              0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
              30% { transform: translateY(-4px); opacity: 0.7; }
            }
          `}</style>
        </>
      )}
    </>
  );
}
