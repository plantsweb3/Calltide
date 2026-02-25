"use client";

interface FeedEvent {
  id: string;
  time: string;
  type: string;
  title: string;
  description: string;
  person: string;
  language?: string;
  value?: number;
  recovered?: boolean;
  urgent?: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function EventIcon({ type, urgent, recovered }: { type: string; urgent?: boolean; recovered?: boolean }) {
  if (recovered) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "rgba(74,222,128,0.15)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }
  if (urgent) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "rgba(248,113,113,0.15)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
    );
  }
  if (type === "call_missed") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "rgba(251,191,36,0.15)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        </svg>
      </div>
    );
  }
  if (type === "call_completed") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "rgba(96,165,250,0.15)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
        </svg>
      </div>
    );
  }
  if (type === "sms_sent" || type === "sms_received") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "rgba(139,92,246,0.15)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
    );
  }
  if (type === "appointment_booked") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "rgba(197,154,39,0.15)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C59A27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
    );
  }
  return <div className="h-8 w-8 rounded-full" style={{ background: "var(--db-hover)" }} />;
}

export default function ActivityFeed({ events }: { events: FeedEvent[] }) {
  return (
    <div
      className="rounded-xl p-5 transition-colors duration-300"
      style={{
        background: "var(--db-card)",
        border: "1px solid var(--db-border)",
        boxShadow: "var(--db-card-shadow)",
      }}
    >
      <h3
        className="mb-4 text-sm font-semibold uppercase tracking-wider"
        style={{ color: "var(--db-text-muted)" }}
      >
        Recent Activity
      </h3>
      <div className="space-y-0">
        {events.map((evt, i) => (
          <div key={evt.id} className="flex gap-3 py-3" style={{ borderTop: i > 0 ? "1px solid var(--db-border-light)" : "none" }}>
            <div className="flex flex-col items-center">
              <EventIcon type={evt.type} urgent={evt.urgent} recovered={evt.recovered} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                  {evt.person}
                </span>
                {evt.language && (
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase"
                    style={{
                      background: evt.language === "es" ? "rgba(197,154,39,0.15)" : "rgba(96,165,250,0.1)",
                      color: evt.language === "es" ? "#C59A27" : "#60a5fa",
                    }}
                  >
                    {evt.language}
                  </span>
                )}
                {evt.recovered && (
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                    style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}
                  >
                    Recovered
                  </span>
                )}
                {evt.value && (
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}
                  >
                    +${evt.value}
                  </span>
                )}
              </div>
              <p className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
                {evt.title}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--db-text-muted)" }}>
                {evt.description}
              </p>
            </div>
            <span className="shrink-0 text-xs tabular-nums" style={{ color: "var(--db-text-muted)" }}>
              {formatTime(evt.time)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
