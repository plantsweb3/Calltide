"use client";

import { IconGlobe } from "@/components/icons";

interface Insight {
  text: string;
  icon: string;
}

interface BilingualStats {
  spanishCalls: number;
  totalCalls: number;
  percentage: number;
}

function InsightIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    calendar: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    clock: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    trending: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    star: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    moon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
    globe: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    recovery: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    ),
    speed: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    sparkle: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" /><path d="M19 15l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z" />
      </svg>
    ),
  };
  return <span style={{ color: "var(--db-accent)" }}>{icons[icon] || null}</span>;
}

export default function BusinessInsights({
  insights,
  bilingualStats,
}: {
  insights: Insight[];
  bilingualStats?: BilingualStats;
}) {
  return (
    <div className="space-y-4">
      {/* Insights Card */}
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
          AI Insights
        </h3>
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <InsightIcon icon={insight.icon} />
              </div>
              <p className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
                {insight.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bilingual Impact Card */}
      {bilingualStats && (
        <div
          className="rounded-xl p-5 transition-colors duration-300"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
            boxShadow: "var(--db-card-shadow)",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "var(--db-accent-bg)" }}
            >
              <IconGlobe size={16} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--db-text)" }}>
                {bilingualStats.spanishCalls}
              </p>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                Spanish-speaking leads this month
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 rounded-full h-2" style={{ background: "var(--db-border)" }}>
            <div
              className="h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${bilingualStats.percentage}%`,
                background: "var(--db-accent)",
              }}
            />
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
            {bilingualStats.percentage}% of calls handled in Spanish — without bilingual AI, these leads would be lost
          </p>
        </div>
      )}
    </div>
  );
}
