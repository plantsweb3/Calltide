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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load chat history when opened
  useEffect(() => {
    if (!open || loaded) return;

    fetch("/api/dashboard/chat")
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
      .catch(() => {
        setLoaded(true);
      });
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

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);

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
    } catch {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't process that. Please try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
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

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed z-40 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg transition-transform hover:scale-105"
          style={{
            bottom: "1.5rem",
            right: "4.5rem",
            background: "linear-gradient(135deg, #1B2A4A, #2a3d6a)",
            color: "#fff",
          }}
          aria-label={`Chat with ${receptionistName}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-sm font-medium hidden sm:inline">Ask {receptionistName}</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/30 md:bg-transparent md:pointer-events-none"
            onClick={() => setOpen(false)}
          />
          <aside
            className="fixed right-0 top-0 z-40 flex h-screen w-full max-w-[420px] flex-col"
            style={{
              background: "var(--db-surface)",
              borderLeft: "1px solid var(--db-border)",
              animation: "slideInRight 0.2s ease-out",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{
                borderBottom: "1px solid var(--db-border)",
                background: "linear-gradient(135deg, #1B2A4A, #2a3d6a)",
              }}
            >
              {/* Avatar */}
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: "rgba(212, 168, 67, 0.2)", color: "#D4A843" }}
              >
                {receptionistName[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{receptionistName}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Your AI Office Manager
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 transition-colors"
                style={{ color: "rgba(255,255,255,0.6)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {/* Greeting */}
              {messages.length === 0 && greeting && (
                <div className="flex gap-2">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5"
                    style={{ background: "rgba(212, 168, 67, 0.15)", color: "#D4A843" }}
                  >
                    {receptionistName[0]}
                  </div>
                  <div
                    className="rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%]"
                    style={{ background: "var(--db-hover)", color: "var(--db-text)" }}
                  >
                    <p className="text-sm">{greeting}</p>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5"
                      style={{ background: "rgba(212, 168, 67, 0.15)", color: "#D4A843" }}
                    >
                      {receptionistName[0]}
                    </div>
                  )}
                  <div className="max-w-[85%]">
                    <div
                      className={`rounded-xl px-3 py-2 ${
                        msg.role === "user"
                          ? "rounded-tr-sm"
                          : "rounded-tl-sm"
                      }`}
                      style={
                        msg.role === "user"
                          ? { background: "#1B2A4A", color: "#fff" }
                          : { background: "var(--db-hover)", color: "var(--db-text)" }
                      }
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 px-1">
                      <span className="text-[10px]" style={{ color: "var(--db-text-muted)" }}>
                        {formatTime(msg.createdAt)}
                      </span>
                      {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                        <span className="text-[10px]" style={{ color: "var(--db-text-muted)" }}>
                          {msg.toolsUsed.map((t) => t.replace(/_/g, " ").replace("get ", "")).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {sending && (
                <div className="flex gap-2">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5"
                    style={{ background: "rgba(212, 168, 67, 0.15)", color: "#D4A843" }}
                  >
                    {receptionistName[0]}
                  </div>
                  <div
                    className="rounded-xl rounded-tl-sm px-3 py-2"
                    style={{ background: "var(--db-hover)" }}
                  >
                    <div className="flex gap-1">
                      <span className="typing-dot" style={{ animationDelay: "0ms" }} />
                      <span className="typing-dot" style={{ animationDelay: "150ms" }} />
                      <span className="typing-dot" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="px-4 py-3"
              style={{ borderTop: "1px solid var(--db-border)" }}
            >
              <div
                className="flex items-end gap-2 rounded-xl px-3 py-2"
                style={{
                  background: "var(--db-hover)",
                  border: "1px solid var(--db-border)",
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${receptionistName}...`}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm outline-none"
                  style={{
                    color: "var(--db-text)",
                    maxHeight: "100px",
                  }}
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all"
                  style={{
                    background: input.trim() && !sending ? "#1B2A4A" : "transparent",
                    color: input.trim() && !sending ? "#fff" : "var(--db-text-muted)",
                    opacity: input.trim() && !sending ? 1 : 0.4,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <p className="mt-1 text-center text-[10px]" style={{ color: "var(--db-text-muted)" }}>
                {receptionistName} can look up your calls, appointments, customers, and more
              </p>
            </div>
          </aside>

          <style jsx>{`
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
              }
              to {
                transform: translateX(0);
              }
            }
            .typing-dot {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: var(--db-text-muted);
              animation: typingBounce 1s infinite;
            }
            @keyframes typingBounce {
              0%, 60%, 100% {
                transform: translateY(0);
              }
              30% {
                transform: translateY(-4px);
              }
            }
          `}</style>
        </>
      )}
    </>
  );
}
