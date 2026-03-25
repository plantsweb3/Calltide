"use client";

interface TranscriptLine {
  speaker: "ai" | "caller";
  text: string;
}

interface CallDetail {
  id: string;
  leadName: string | null;
  callerPhone: string | null;
  duration: number | null;
  language: string | null;
  status: string;
  summary: string | null;
  createdAt: string;
}

function Waveform() {
  const bars = [3, 6, 9, 5, 8, 11, 7, 4, 8, 10, 6, 11, 5, 7, 10, 4, 8, 6, 11, 7, 5, 9, 6, 4, 8, 10, 7, 5, 9, 6, 3, 7, 10, 5, 8, 4, 9, 6, 11, 7];
  return (
    <div className="flex items-center gap-[2px] h-8">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            height: `${h * 8}%`,
            background: "var(--db-accent)",
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CallTranscript({
  call,
  transcript,
  onClose,
}: {
  call: CallDetail;
  transcript: TranscriptLine[] | null;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transcript-title"
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-lg flex-col overflow-y-auto animate-slide-in-right"
        style={{
          background: "var(--db-surface)",
          borderLeft: "1px solid var(--db-border)",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-5"
          style={{
            background: "var(--db-surface)",
            borderBottom: "1px solid var(--db-border)",
          }}
        >
          <div>
            <h2 id="transcript-title" className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
              {call.leadName || call.callerPhone || "Unknown Caller"}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                {new Date(call.createdAt).toLocaleString(undefined, {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </span>
              <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                {formatDuration(call.duration)}
              </span>
              {call.language && (
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase"
                  style={{
                    background: call.language === "es" ? "var(--db-accent-bg)" : "rgba(96,165,250,0.1)",
                    color: call.language === "es" ? "#C59A27" : "#60a5fa",
                  }}
                >
                  {call.language}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors"
            style={{ color: "var(--db-text-muted)" }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l8 8M14 6l-8 8" />
            </svg>
          </button>
        </div>

        {/* Waveform */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--db-border-light)" }}>
          <div className="flex items-center gap-3">
            <button
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ background: "var(--db-accent)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>
            <div className="flex-1">
              <Waveform />
            </div>
            <span className="text-xs tabular-nums" style={{ color: "var(--db-text-muted)" }}>
              {formatDuration(call.duration)}
            </span>
          </div>
        </div>

        {/* Transcript */}
        <div className="flex-1 p-5 space-y-4">
          {transcript ? (
            transcript.map((line, i) => (
              <div
                key={i}
                className={`flex ${line.speaker === "ai" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className="max-w-[85%] rounded-2xl px-4 py-2.5"
                  style={{
                    background: line.speaker === "ai"
                      ? "var(--db-hover)"
                      : "var(--db-accent-bg)",
                    borderBottomLeftRadius: line.speaker === "ai" ? "4px" : undefined,
                    borderBottomRightRadius: line.speaker === "caller" ? "4px" : undefined,
                  }}
                >
                  <p className="text-[10px] font-medium uppercase tracking-wider mb-1"
                    style={{
                      color: line.speaker === "ai" ? "#60a5fa" : "var(--db-accent)",
                    }}
                  >
                    {line.speaker === "ai" ? "AI Assistant" : call.leadName || "Caller"}
                  </p>
                  <p className="text-sm" style={{ color: "var(--db-text)" }}>
                    {line.text}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
                Transcript not available for this call
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        {call.summary && (
          <div
            className="sticky bottom-0 p-5"
            style={{
              background: "var(--db-surface)",
              borderTop: "1px solid var(--db-border)",
            }}
          >
            <p className="text-[10px] font-medium uppercase tracking-wider mb-1"
              style={{ color: "var(--db-text-muted)" }}
            >
              AI Summary
            </p>
            <p className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
              {call.summary}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
