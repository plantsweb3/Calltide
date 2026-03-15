"use client";

import { useEffect, useState } from "react";

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
}

export default function ReportingPage() {
  const [data, setData] = useState<ReportingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/reporting")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--db-text)" }}>Reporting</h1>
        <div className="mt-8 flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: "var(--db-accent)" }} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--db-text)" }}>Reporting</h1>
        <p className="mt-4 text-sm" style={{ color: "var(--db-text-muted)" }}>Unable to load reporting data.</p>
      </div>
    );
  }

  const maxHour = Math.max(...data.callsByHour.map((h) => h.total), 1);
  const maxDay = Math.max(...data.callsByDay.map((d) => d.total), 1);
  const totalCalls = data.callsByHour.reduce((s, h) => s + h.total, 0);
  const busiestHour = data.callsByHour.reduce((a, b) => (b.total > a.total ? b : a));
  const busiestDay = data.callsByDay.reduce((a, b) => (b.total > a.total ? b : a));
  const totalDuration = data.durationBuckets.reduce((s, b) => s + b.total, 0);
  const totalLang = data.languageBreakdown.reduce((s, l) => s + l.total, 0);
  const topServiceMax = data.topServices.length > 0 ? data.topServices[0].total : 1;

  const pipelineLabels: Record<string, string> = { new: "New", sent: "Sent", follow_up: "Follow Up", won: "Won", lost: "Lost" };
  const pipelineColors: Record<string, string> = { new: "#3B82F6", sent: "#F59E0B", follow_up: "#8B5CF6", won: "#10B981", lost: "#EF4444" };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--db-text)" }}>Reporting</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>Last 30 days of call analytics and business insights.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total Calls" value={totalCalls.toString()} sub="Last 30 days" />
        <SummaryCard label="Busiest Hour" value={formatHour(busiestHour.hour)} sub={`${busiestHour.total} calls`} />
        <SummaryCard label="Busiest Day" value={busiestDay.label} sub={`${busiestDay.total} calls`} />
        <SummaryCard
          label="Recovery Rate"
          value={`${data.recoveryStats.rate}%`}
          sub={`${data.recoveryStats.recovered}/${data.recoveryStats.totalMissed} recovered`}
          accent
        />
      </div>

      {/* Row 1: Calls by Hour + Calls by Day */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calls by Hour */}
        <Card title="Calls by Hour of Day">
          <div className="flex items-end gap-[3px] h-40">
            {data.callsByHour.map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div
                  className="w-full rounded-t transition-colors"
                  style={{
                    height: `${Math.max((h.total / maxHour) * 100, 2)}%`,
                    background: h.hour >= 7 && h.hour <= 19 ? "var(--db-accent)" : "var(--db-border)",
                    opacity: h.total > 0 ? 1 : 0.3,
                  }}
                />
                <span className="absolute -top-6 hidden group-hover:block rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: "var(--db-surface)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}>
                  {formatHour(h.hour)}: {h.total}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px]" style={{ color: "var(--db-text-muted)" }}>
            <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
          </div>
        </Card>

        {/* Calls by Day */}
        <Card title="Calls by Day of Week">
          <div className="space-y-3">
            {data.callsByDay.map((d) => (
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
                <span className="w-8 text-right text-xs font-semibold" style={{ color: "var(--db-text)" }}>{d.total}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 2: Duration + Language + Recovery */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Call Duration */}
        <Card title="Call Duration">
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
                <span className="w-8 text-right text-xs font-medium" style={{ color: "var(--db-text)" }}>{b.total}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Language */}
        <Card title="Language Breakdown">
          <div className="flex items-center justify-center py-4">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                {data.languageBreakdown.map((l, i) => {
                  const pct = totalLang > 0 ? (l.total / totalLang) * 100 : 0;
                  const offset = data.languageBreakdown.slice(0, i).reduce((s, x) => s + (totalLang > 0 ? (x.total / totalLang) * 100 : 0), 0);
                  return (
                    <circle
                      key={l.language}
                      cx="18" cy="18" r="15.915"
                      fill="none"
                      strokeWidth="3.5"
                      stroke={l.language === "en" ? "var(--db-accent)" : "#10B981"}
                      strokeDasharray={`${pct} ${100 - pct}`}
                      strokeDashoffset={`${-offset}`}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
          <div className="flex justify-center gap-6">
            {data.languageBreakdown.map((l) => (
              <div key={l.language} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: l.language === "en" ? "var(--db-accent)" : "#10B981" }} />
                <span className="text-xs font-medium" style={{ color: "var(--db-text)" }}>
                  {l.language === "en" ? "English" : "Spanish"} ({totalLang > 0 ? Math.round((l.total / totalLang) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recovery */}
        <Card title="Missed Call Recovery">
          <div className="space-y-4 py-2">
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: "var(--db-accent)" }}>{data.recoveryStats.rate}%</p>
              <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>Recovery Rate</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatMini label="Missed" value={data.recoveryStats.totalMissed} />
              <StatMini label="SMS Sent" value={data.recoveryStats.smsSent} />
              <StatMini label="Recovered" value={data.recoveryStats.recovered} />
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3: Top Services + Estimates + Callers */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Top Services */}
        <Card title="Top Services Booked">
          {data.topServices.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--db-text-muted)" }}>No appointments yet</p>
          ) : (
            <div className="space-y-3">
              {data.topServices.map((s, i) => (
                <div key={s.service} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm truncate" style={{ color: "var(--db-text)" }}>{s.service}</span>
                  <div className="w-20 h-4 rounded-full overflow-hidden" style={{ background: "var(--db-hover)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(s.total / topServiceMax) * 100}%`, background: "var(--db-accent)" }} />
                  </div>
                  <span className="w-6 text-right text-xs font-semibold" style={{ color: "var(--db-text)" }}>{s.total}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Estimate Pipeline */}
        <Card title="Estimate Pipeline">
          {data.estimatePipeline.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--db-text-muted)" }}>No estimates yet</p>
          ) : (
            <div className="space-y-3">
              {data.closeRate != null && (
                <div className="rounded-lg p-3 mb-2 text-center" style={{ background: "var(--db-hover)" }}>
                  <p className="text-2xl font-bold" style={{ color: data.closeRate >= 50 ? "#22c55e" : "var(--db-text)" }}>{data.closeRate}%</p>
                  <p className="text-[10px]" style={{ color: "var(--db-text-muted)" }}>
                    Close Rate ({data.estimatePipeline.find(e => e.status === "won")?.total ?? 0}/{(data.estimatePipeline.find(e => e.status === "won")?.total ?? 0) + (data.estimatePipeline.find(e => e.status === "lost")?.total ?? 0)} decided)
                  </p>
                </div>
              )}
              {data.estimatePipeline.map((e) => (
                <div key={e.status} className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ background: pipelineColors[e.status] ?? "var(--db-border)" }} />
                  <span className="flex-1 text-sm" style={{ color: "var(--db-text)" }}>{pipelineLabels[e.status] ?? e.status}</span>
                  <span className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{e.total}</span>
                  <span className="text-xs font-semibold" style={{ color: "var(--db-text)" }}>${e.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Caller Stats */}
        <Card title="Caller Breakdown">
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
                <span className="text-2xl font-bold" style={{ color: "var(--db-text)" }}>{data.callerStats.total}</span>
                <span className="text-[10px]" style={{ color: "var(--db-text-muted)" }}>Total</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: "#3B82F6" }} />
              <span className="text-xs font-medium" style={{ color: "var(--db-text)" }}>New ({data.callerStats.new})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: "#10B981" }} />
              <span className="text-xs font-medium" style={{ color: "var(--db-text)" }}>Repeat ({data.callerStats.repeat})</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
      <p className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: accent ? "var(--db-accent)" : "var(--db-text)" }}>{value}</p>
      <p className="mt-0.5 text-xs" style={{ color: "var(--db-text-muted)" }}>{sub}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--db-text)" }}>{title}</h3>
      {children}
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg p-2.5 text-center" style={{ background: "var(--db-hover)" }}>
      <p className="text-lg font-bold" style={{ color: "var(--db-text)" }}>{value}</p>
      <p className="text-[10px]" style={{ color: "var(--db-text-muted)" }}>{label}</p>
    </div>
  );
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}
