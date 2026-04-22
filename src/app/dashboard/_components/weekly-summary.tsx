"use client";

import { t, type Lang } from "@/lib/i18n/strings";

interface WeeklySummaryData {
  totalCalls: number;
  appointmentsBooked: number;
  estimatedRevenue: number;
  missedCallsRecovered: number;
  avgCallDuration: number;
  busiestHour: string;
  trendingService: string;
  topService: { name: string; percentage: number };
  languageBreakdown: { en: number; es: number };
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function WeeklySummary({ data, lang = "en" }: { data: WeeklySummaryData; lang?: Lang }) {
  return (
    <div
      className="relative p-5 transition-colors duration-300"
      style={{
        background: "var(--db-card)",
        border: "1px solid var(--db-border)",
        borderRadius: 4,
        boxShadow: "var(--db-card-shadow)",
        paddingTop: 22,
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 40,
          height: 3,
          background: "var(--db-accent)",
        }}
      />
      <h3
        className="mb-4"
        style={{
          fontSize: 11,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--db-text-muted)",
          fontWeight: 800,
        }}
      >
        {t("weeklySummary.title", lang)}
      </h3>

      <div className="space-y-3">
        <SummaryRow
          label={t("weeklySummary.callsHandled", lang)}
          value={String(data.totalCalls)}
          sub={t("weeklySummary.languageBreakdown", lang, { en: data.languageBreakdown.en, es: data.languageBreakdown.es })}
        />
        <SummaryRow
          label={t("weeklySummary.appointmentsBooked", lang)}
          value={String(data.appointmentsBooked)}
          sub={t("weeklySummary.estimatedRevenue", lang, { amount: data.estimatedRevenue.toLocaleString() })}
          highlight
        />
        <SummaryRow
          label={t("weeklySummary.missedCallsRecovered", lang)}
          value={String(data.missedCallsRecovered)}
          sub={t("weeklySummary.wouldHaveGoneToVoicemail", lang)}
          positive
        />
        <SummaryRow
          label={t("weeklySummary.avgCallDuration", lang)}
          value={formatDuration(data.avgCallDuration)}
          sub={t("weeklySummary.callersHighlyEngaged", lang)}
        />

        <div
          className="mt-2 pt-3 space-y-2"
          style={{ borderTop: "1px solid var(--db-border-light)" }}
        >
          <DetailRow icon="clock" text={t("weeklySummary.busiestHour", lang, { hour: data.busiestHour })} />
          <DetailRow icon="star" text={t("weeklySummary.topService", lang, { name: data.topService.name, percentage: data.topService.percentage })} />
          <DetailRow icon="trending" text={t("weeklySummary.trending", lang, { service: data.trendingService })} />
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  sub,
  highlight,
  positive,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
          {label}
        </p>
        <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
          {sub}
        </p>
      </div>
      <span
        className="text-lg font-semibold tabular-nums"
        style={{
          color: positive ? "var(--db-success)" : highlight ? "var(--db-accent)" : "var(--db-text)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function DetailRow({ icon, text }: { icon: string; text: string }) {
  const icons: Record<string, React.ReactNode> = {
    clock: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    star: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    trending: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-2">
      <span style={{ color: "var(--db-accent)" }}>{icons[icon]}</span>
      <span className="text-xs" style={{ color: "var(--db-text-secondary)" }}>
        {text}
      </span>
    </div>
  );
}
