"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { PageSkeleton } from "@/components/skeleton";
import MetricCard from "@/components/metric-card";
import PageHeader from "@/components/page-header";
import DateRangePicker, { type DateRange } from "@/components/date-range-picker";
import ExportCsvButton from "@/app/dashboard/_components/csv-export";
import Button from "@/components/ui/button";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

interface ReportingData {
  callsByHour: { hour: number; total: number }[];
  callsByDay: { day: number; label: string; total: number }[];
  dailyVolume: { date: string; total: number; missed: number; answered: number }[];
  durationBuckets: { bucket: string; label: string; total: number }[];
  languageBreakdown: { language: string; total: number }[];
  recoveryStats: { totalMissed: number; recovered: number; smsSent: number; rate: number };
  topServices: { service: string; total: number }[];
  estimatePipeline: { status: string; total: number; value: number }[];
  callerStats: { total: number; repeat: number; new: number };
  closeRate: number | null;
  outboundSummary?: {
    total: number;
    answered: number;
    answerRate: number;
    byType: { callType: string; total: number; answered: number }[];
  };
}

function toISO(d: Date): string { return d.toISOString().split("T")[0]; }

export default function ReportingPage() {
  const [lang] = useLang();
  const [data, setData] = useState<ReportingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const [dateRange, setDateRange] = useState<DateRange>({ from: toISO(thirtyDaysAgo), to: toISO(now) });

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ from: dateRange.from, to: dateRange.to });
    fetch(`/api/dashboard/reporting?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("load failed");
        return r.json();
      })
      .then(setData)
      .catch(() => {
        setError(t("reporting.failedToLoad", lang));
        toast.error(t("reporting.failedToLoadToast", lang));
      })
      .finally(() => setLoading(false));
  }, [dateRange, lang]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div>
        <PageHeader title={t("reporting.title", lang)} />
        <div className="mt-6">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title={t("reporting.title", lang)} />
        <div role="alert" aria-live="assertive" className="rounded-xl p-4 mt-4 flex items-center justify-between" style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)" }}>
          <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error || t("reporting.unableToLoad", lang)}</p>
          <Button variant="danger" size="sm" onClick={fetchData}>{t("action.retry", lang)}</Button>
        </div>
      </div>
    );
  }

  const maxHour = Math.max(...data.callsByHour.map((h) => h.total), 1);
  const totalCalls = data.callsByHour.reduce((s, h) => s + h.total, 0);
  const busiestHour = data.callsByHour.reduce((a, b) => (b.total > a.total ? b : a));
  const busiestDay = data.callsByDay.reduce((a, b) => (b.total > a.total ? b : a));
  const totalDuration = data.durationBuckets.reduce((s, b) => s + b.total, 0);
  const totalLang = data.languageBreakdown.reduce((s, l) => s + l.total, 0);
  const topServiceMax = data.topServices.length > 0 ? data.topServices[0].total : 1;

  // Daily volume for chart (last 30 or 7 days)
  const dailyVolumeSlice = data.dailyVolume.slice(-30);
  const maxDailyVolume = Math.max(...dailyVolumeSlice.map((d) => d.total), 1);

  const pipelineLabels: Record<string, string> = { new: t("reporting.pipelineNew", lang), sent: t("reporting.pipelineSent", lang), follow_up: t("reporting.pipelineFollowUp", lang), won: t("reporting.pipelineWon", lang), lost: t("reporting.pipelineLost", lang) };
  const pipelineColors: Record<string, string> = { new: "#3B82F6", sent: "#F59E0B", follow_up: "#8B5CF6", won: "#10B981", lost: "#EF4444" };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("reporting.title", lang)}
        description={t("reporting.description", lang)}
        actions={
          <div className="flex items-center gap-2">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <ExportCsvButton
              data={data.callsByHour.map((h) => ({ hour: formatHour(h.hour), calls: h.total }))}
              columns={[
                { header: t("reporting.csvHour", lang), accessor: (r: { hour: string }) => r.hour },
                { header: t("reporting.csvCalls", lang), accessor: (r: { calls: number }) => r.calls },
              ]}
              filename="reporting"
            />
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-grid">
        <MetricCard label={t("reporting.totalCalls", lang)} value={totalCalls} />
        <MetricCard label={t("reporting.busiestHour", lang)} value={formatHour(busiestHour.hour)} />
        <MetricCard label={t("reporting.busiestDay", lang)} value={busiestDay.label} />
        <MetricCard label={t("reporting.recoveryRate", lang)} value={data.recoveryStats.rate} suffix="%" />
      </div>

      {/* Row 1: Calls by Hour (horizontal bars) + Calls by Day of Week */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calls by Hour - Horizontal bar chart */}
        <Card title={t("reporting.callVolume", lang)}>
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {data.callsByHour.map((h) => (
              <div key={h.hour} className="flex items-center gap-2" style={{ height: "20px" }}>
                <span className="w-12 text-xs font-medium text-right flex-shrink-0" style={{ color: "var(--db-text-muted)" }}>
                  {formatHour(h.hour)}
                </span>
                <div className="flex-1 h-3.5 rounded-sm overflow-hidden" style={{ background: "var(--db-hover)" }}>
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${Math.max((h.total / maxHour) * 100, h.total > 0 ? 3 : 0)}%`,
                      background: h.hour >= 7 && h.hour <= 19 ? "var(--db-accent)" : "var(--db-border)",
                    }}
                  />
                </div>
                <span className="w-6 text-right text-xs font-semibold tabular-nums flex-shrink-0" style={{ color: "var(--db-text)" }}>
                  {h.total}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Calls by Day - Horizontal bar chart */}
        <Card title={t("reporting.callsByDay", lang)}>
          <div className="space-y-3">
            {data.callsByDay.map((d) => {
              const maxDay = Math.max(...data.callsByDay.map((x) => x.total), 1);
              return (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{d.label}</span>
                  <div className="flex-1 h-6 rounded-lg overflow-hidden" style={{ background: "var(--db-hover)" }}>
                    <div
                      className="h-full rounded-lg transition-all"
                      style={{
                        width: `${Math.max((d.total / maxDay) * 100, 2)}%`,
                        background: "var(--db-accent)",
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-semibold tabular-nums" style={{ color: "var(--db-text)" }}>{d.total}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Row 2: Daily Volume - Vertical stacked bar chart */}
      {dailyVolumeSlice.length > 0 && (
        <Card title={t("reporting.dailyCallVolume", lang)}>
          <div className="flex items-end gap-[2px]" style={{ height: "180px" }}>
            {dailyVolumeSlice.map((d) => {
              const answeredPct = maxDailyVolume > 0 ? ((d.answered ?? 0) / maxDailyVolume) * 100 : 0;
              const missedPct = maxDailyVolume > 0 ? ((d.missed ?? 0) / maxDailyVolume) * 100 : 0;
              const dateLabel = new Date(d.date + "T12:00:00").toLocaleDateString(lang === "es" ? "es-MX" : "en-US", { month: "short", day: "numeric" });
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative" style={{ minWidth: "4px" }}>
                  <div className="w-full flex flex-col justify-end" style={{ height: `${answeredPct + missedPct}%` }}>
                    {(d.missed ?? 0) > 0 && (
                      <div
                        className="w-full rounded-t-sm"
                        style={{
                          height: `${missedPct > 0 ? (missedPct / (answeredPct + missedPct)) * 100 : 0}%`,
                          background: "var(--db-danger)",
                          minHeight: d.missed > 0 ? "2px" : "0",
                        }}
                      />
                    )}
                    {(d.answered ?? 0) > 0 && (
                      <div
                        className="w-full"
                        style={{
                          height: `${answeredPct > 0 ? (answeredPct / (answeredPct + missedPct)) * 100 : 0}%`,
                          background: "var(--db-success)",
                          minHeight: d.answered > 0 ? "2px" : "0",
                          borderRadius: (d.missed ?? 0) > 0 ? "0" : "2px 2px 0 0",
                        }}
                      />
                    )}
                  </div>
                  <div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block rounded px-1.5 py-0.5 text-[9px] font-medium whitespace-nowrap z-10 pointer-events-none"
                    style={{ background: "var(--db-surface)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
                  >
                    {dateLabel}: {d.total} ({d.answered ?? 0}A / {d.missed ?? 0}M)
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--db-success)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{t("reporting.answered", lang)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--db-danger)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{t("reporting.missed", lang)}</span>
              </div>
            </div>
            {dailyVolumeSlice.length > 0 && (
              <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                {new Date(dailyVolumeSlice[0].date + "T12:00:00").toLocaleDateString(lang === "es" ? "es-MX" : "en-US", { month: "short", day: "numeric" })}
                {" - "}
                {new Date(dailyVolumeSlice[dailyVolumeSlice.length - 1].date + "T12:00:00").toLocaleDateString(lang === "es" ? "es-MX" : "en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Row 3: Duration + Language + Recovery */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Call Duration - Horizontal bar chart */}
        <Card title={t("reporting.callDuration", lang)}>
          <div className="space-y-3">
            {data.durationBuckets.map((b) => (
              <div key={b.bucket} className="flex items-center gap-3">
                <span className="w-16 text-xs" style={{ color: "var(--db-text-muted)" }}>{b.label}</span>
                <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{ background: "var(--db-hover)" }}>
                  <div
                    className="h-full rounded-lg"
                    style={{
                      width: `${totalDuration > 0 ? (b.total / totalDuration) * 100 : 0}%`,
                      background: "var(--db-accent)",
                    }}
                  />
                </div>
                <span className="w-8 text-right text-xs font-medium tabular-nums" style={{ color: "var(--db-text)" }}>{b.total}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Language - Progress bar style */}
        <Card title={t("reporting.languageBreakdown", lang)}>
          <div className="space-y-4 py-2">
            {data.languageBreakdown.map((l) => {
              const pct = totalLang > 0 ? Math.round((l.total / totalLang) * 100) : 0;
              const langLabel = l.language === "en" ? t("reporting.english", lang) : l.language === "es" ? t("reporting.spanish", lang) : l.language;
              const langColor = l.language === "en" ? "var(--db-accent)" : "#10B981";
              return (
                <div key={l.language}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: langColor }} />
                      <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{langLabel}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: "var(--db-text)" }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--db-hover)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: langColor }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>{l.total} {t("reporting.calls", lang)}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recovery */}
        <Card title={t("reporting.missedCallRecovery", lang)}>
          <div className="space-y-4 py-2">
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--db-accent)" }}>{data.recoveryStats.rate}%</p>
              <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>{t("reporting.recoveryRate", lang)}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatMini label={t("reporting.missed", lang)} value={data.recoveryStats.totalMissed} />
              <StatMini label={t("reporting.smsSent", lang)} value={data.recoveryStats.smsSent} />
              <StatMini label={t("reporting.recovered", lang)} value={data.recoveryStats.recovered} />
            </div>
          </div>
        </Card>
      </div>

      {/* Row 4: Top Services + Estimates + Callers */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Top Services - Horizontal bar chart */}
        <Card title={t("reporting.topServices", lang)}>
          {data.topServices.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--db-text-muted)" }}>{t("reporting.noAppointmentsYet", lang)}</p>
          ) : (
            <div className="space-y-3">
              {data.topServices.map((s, i) => (
                <div key={s.service} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold flex-shrink-0" style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block" style={{ color: "var(--db-text)" }}>{s.service}</span>
                    <div className="h-3 rounded-full overflow-hidden mt-1" style={{ background: "var(--db-hover)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(s.total / topServiceMax) * 100}%`, background: "var(--db-accent)" }}
                      />
                    </div>
                  </div>
                  <span className="w-6 text-right text-xs font-semibold tabular-nums flex-shrink-0" style={{ color: "var(--db-text)" }}>{s.total}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Estimate Pipeline */}
        <Card title={t("reporting.revenuePipeline", lang)}>
          {data.estimatePipeline.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--db-text-muted)" }}>{t("reporting.noEstimatesYet", lang)}</p>
          ) : (
            <div className="space-y-3">
              {data.closeRate != null && (
                <div className="rounded-lg p-3 mb-2 text-center" style={{ background: "var(--db-hover)" }}>
                  <p className="text-2xl font-bold tabular-nums" style={{ color: data.closeRate >= 50 ? "var(--db-success)" : "var(--db-text)" }}>{data.closeRate}%</p>
                  <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                    {t("reporting.closeRate", lang)} ({data.estimatePipeline.find(e => e.status === "won")?.total ?? 0}/{(data.estimatePipeline.find(e => e.status === "won")?.total ?? 0) + (data.estimatePipeline.find(e => e.status === "lost")?.total ?? 0)} {t("reporting.decided", lang)})
                  </p>
                </div>
              )}
              {data.estimatePipeline.map((e) => (
                <div key={e.status} className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: pipelineColors[e.status] ?? "var(--db-border)" }} />
                  <span className="flex-1 text-sm" style={{ color: "var(--db-text)" }}>{pipelineLabels[e.status] ?? e.status}</span>
                  <span className="text-xs font-medium tabular-nums" style={{ color: "var(--db-text-muted)" }}>{e.total}</span>
                  <span className="text-xs font-semibold text-right tabular-nums" style={{ color: "var(--db-text)" }}>${e.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Caller Stats */}
        <Card title={t("reporting.callerStats", lang)}>
          <div className="flex items-center justify-center py-4">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                {data.callerStats.total > 0 && (
                  <>
                    <circle
                      cx="18" cy="18" r="15.915" fill="none" strokeWidth="3.5"
                      stroke="#3B82F6"
                      strokeDasharray={`${(data.callerStats.new / data.callerStats.total) * 100} ${100 - (data.callerStats.new / data.callerStats.total) * 100}`}
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="18" cy="18" r="15.915" fill="none" strokeWidth="3.5"
                      stroke="#10B981"
                      strokeDasharray={`${(data.callerStats.repeat / data.callerStats.total) * 100} ${100 - (data.callerStats.repeat / data.callerStats.total) * 100}`}
                      strokeDashoffset={`${-(data.callerStats.new / data.callerStats.total) * 100}`}
                    />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--db-text)" }}>{data.callerStats.total}</span>
                <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{t("reporting.total", lang)}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: "#3B82F6" }} />
              <span className="text-xs font-medium" style={{ color: "var(--db-text)" }}>{t("reporting.new", lang)} ({data.callerStats.new})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: "#10B981" }} />
              <span className="text-xs font-medium" style={{ color: "var(--db-text)" }}>{t("reporting.repeat", lang)} ({data.callerStats.repeat})</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 5: Outbound Calls */}
      {data.outboundSummary && data.outboundSummary.total > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card title={t("reporting.outboundCalls", lang)}>
            <div className="space-y-4 py-2">
              <div className="text-center">
                <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--db-accent)" }}>{data.outboundSummary.total}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>{t("reporting.totalOutbound", lang)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <StatMini label={t("reporting.answered", lang)} value={data.outboundSummary.answered} />
                <StatMini label={t("reporting.answerRate", lang)} value={data.outboundSummary.answerRate} />
              </div>
            </div>
          </Card>
          <Card title={t("reporting.outboundByType", lang)}>
            <div className="space-y-3">
              {data.outboundSummary.byType.map((ob) => {
                const typeLabels: Record<string, string> = {
                  appointment_reminder: t("reporting.reminders", lang),
                  estimate_followup: t("reporting.estimateFollowUps", lang),
                  seasonal_reminder: t("reporting.seasonal", lang),
                };
                return (
                  <div key={ob.callType} className="flex items-center gap-3">
                    <span className="flex-1 text-sm" style={{ color: "var(--db-text)" }}>
                      {typeLabels[ob.callType] ?? ob.callType.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-medium tabular-nums" style={{ color: "var(--db-text-muted)" }}>
                      {ob.answered}/{ob.total}
                    </span>
                    <span className="text-xs font-semibold tabular-nums" style={{ color: ob.total > 0 ? "var(--db-success)" : "var(--db-text)" }}>
                      {ob.total > 0 ? Math.round((ob.answered / ob.total) * 100) : 0}%
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="db-card rounded-xl p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--db-text)" }}>{title}</h3>
      {children}
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg p-2.5 text-center" style={{ background: "var(--db-hover)" }}>
      <p className="text-lg font-bold tabular-nums" style={{ color: "var(--db-text)" }}>{value}</p>
      <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{label}</p>
    </div>
  );
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}
