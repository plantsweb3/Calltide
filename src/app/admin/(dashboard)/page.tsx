"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import MetricCard from "../_components/metric-card";
import AnimatedCounter from "@/app/dashboard/_components/animated-counter";

interface HQData {
  xp: { today: number; allTime: number; level: number; nextLevelAt: number };
  streak: { current: number; longest: number; lastHitDate: string | null };
  metrics: { mrr: number; mrrDelta: number; pipeline: number; todayTouches: number; activeClients: number };
  pipeline: {
    fresh: PipelineStage;
    contacted: PipelineStage;
    interested: PipelineStage;
    demo: PipelineStage;
    won: PipelineStage;
  };
  todayActivity: Array<{ id: string; description: string; xp: number; createdAt: string }>;
  action: { title: string; description: string; link: string };
}

interface PipelineStage {
  count: number;
  top3: Array<{ id: string; name: string }>;
}

export default function FounderHQPage() {
  const [data, setData] = useState<HQData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prevData = useRef<HQData | null>(null);

  const fetchData = useCallback(() => {
    setError(null);
    fetch("/api/admin/founder-hq")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((newData: HQData) => {
        const prev = prevData.current;
        if (prev) {
          // Milestone toasts
          if (newData.metrics.todayTouches >= 100 && prev.metrics.todayTouches < 100) {
            toast.success("Rule of 100 hit! You're on fire today.");
          } else if (newData.metrics.todayTouches >= 50 && prev.metrics.todayTouches < 50) {
            toast("Halfway there — 50 touches logged!");
          }
          if (newData.streak.current > prev.streak.current && newData.streak.current > 1) {
            toast.success(`Streak extended to ${newData.streak.current} days!`);
          }
          if (newData.xp.level > prev.xp.level) {
            toast.success(`Level up! You're now Level ${newData.xp.level}`);
          }
        }
        prevData.current = newData;
        setData(newData);
      })
      .catch(() => setError("Failed to load HQ data"));
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!data) {
    return (
      <div className="space-y-4">
        {error ? (
          <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <p className="text-sm" style={{ color: "var(--db-danger, #f87171)" }}>{error}</p>
            <button onClick={fetchData} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ background: "rgba(248,113,113,0.15)", color: "var(--db-danger, #f87171)" }}>
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="animate-pulse rounded-xl h-16 w-full" style={{ background: "var(--db-border)" }} />
            <div className="animate-pulse rounded-xl h-32 w-full" style={{ background: "var(--db-border)" }} />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl h-24" style={{ background: "var(--db-border)" }} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const touchesRemaining = Math.max(0, 100 - data.metrics.todayTouches);
  const touchProgress = Math.min(100, (data.metrics.todayTouches / 100) * 100);
  const levelProgress = data.xp.nextLevelAt > 0
    ? Math.min(100, (data.metrics.activeClients / data.xp.nextLevelAt) * 100)
    : 100;

  // Running XP total for activity log
  let runningXp = 0;
  for (const a of data.todayActivity) runningXp += a.xp;

  return (
    <div className="space-y-6">
      {/* Catalog marker — Founder HQ */}
      <div
        className="hidden sm:flex items-center justify-between"
        style={{
          fontFamily: "var(--font-mono), ui-monospace, Menlo, monospace",
          fontSize: 11,
          color: "var(--db-text-muted)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        <span style={{ color: "var(--db-accent)", fontWeight: 800 }}>§ Founder HQ · Admin</span>
        <span>CAT · REV 2026.04</span>
      </div>

      {/* Section A: Game Bar — brand-kit stamped */}
      <div
        className="sticky top-0 z-10 relative p-4"
        style={{
          background: "var(--db-surface)",
          border: "1px solid var(--db-border)",
          borderRadius: 4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          paddingTop: 20,
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 56,
            height: 4,
            background: "var(--db-accent)",
          }}
        />
        <div className="flex flex-wrap items-center gap-4">
          {/* Level Badge */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold"
            style={{
              background: "linear-gradient(135deg, #D4A843, #D4A843)",
              color: "#1B2A4A",
              boxShadow: "0 2px 8px rgba(212,168,67,0.4)",
            }}
          >
            {data.xp.level}
          </div>

          {/* XP Progress Bar */}
          <div className="flex-1 min-w-[120px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: "var(--db-text-muted)" }}>Level {data.xp.level}</span>
              <span style={{ color: "var(--db-text-muted)" }}>
                {data.metrics.activeClients}/{data.xp.nextLevelAt} clients
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--db-border)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${levelProgress}%`,
                  background: "linear-gradient(90deg, #D4A843, #E8C76A)",
                }}
              />
            </div>
          </div>

          {/* Streak Counter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-xl ${data.streak.current >= 7 ? "animate-pulse" : ""}`}
              role="img"
              aria-label="streak"
            >
              {data.streak.current >= 7 ? "\uD83D\uDD25\uD83D\uDD25" : "\uD83D\uDD25"}
            </span>
            <div className="text-center">
              <p className="text-lg font-bold leading-none" style={{ color: data.streak.current >= 7 ? "#f59e0b" : "var(--db-text)" }}>
                {data.streak.current}
              </p>
              <p className="text-[10px]" style={{ color: "var(--db-text-muted)" }}>streak</p>
            </div>
          </div>

          {/* Today's XP */}
          <div className="shrink-0 rounded-lg px-3 py-1.5" style={{ background: "rgba(212,168,67,0.12)" }}>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Today</p>
            <p className="text-lg font-bold" style={{ color: "#D4A843" }}>
              <AnimatedCounter value={data.xp.today} suffix=" XP" />
            </p>
          </div>
        </div>
      </div>

      {/* Section B: "Do This Now" Action Card */}
      <Link
        href={data.action.link}
        className="block rounded-xl p-5 transition-all hover:scale-[1.01]"
        style={{
          background: "var(--db-card)",
          border: "2px solid #D4A843",
          boxShadow: "0 0 20px rgba(212,168,67,0.1)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#D4A843" }}>
              Do This Now
            </p>
            <h2 className="text-xl font-semibold" style={{ color: "var(--db-text)" }}>
              {data.action.title}
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--db-text-muted)" }}>
              {data.action.description}
            </p>
          </div>
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold"
            style={{
              background: "linear-gradient(135deg, #D4A843, #D4A843)",
              color: "#1B2A4A",
            }}
          >
            &rarr;
          </span>
        </div>
      </Link>

      {/* Section C: The 5 Numbers */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <MetricCard
          label="MRR"
          value={data.metrics.mrr}
          prefix="$"
          change={data.metrics.mrrDelta !== 0
            ? `${data.metrics.mrrDelta > 0 ? "+" : ""}$${data.metrics.mrrDelta} this week`
            : undefined}
          changeType={data.metrics.mrrDelta > 0 ? "positive" : data.metrics.mrrDelta < 0 ? "negative" : "neutral"}
        />
        <MetricCard
          label="Pipeline"
          value={data.metrics.pipeline}
          change="active prospects"
          changeType="neutral"
        />
        <MetricCard
          label="Rule of 100"
          value={data.metrics.todayTouches}
          suffix="/100"
          change={touchesRemaining > 0 ? `${touchesRemaining} to go` : "Target hit!"}
          changeType={touchesRemaining === 0 ? "positive" : "neutral"}
        />
        <MetricCard
          label="Active Clients"
          value={data.metrics.activeClients}
        />
        <MetricCard
          label="Streak"
          value={data.streak.current}
          suffix={data.streak.current >= 7 ? " days \uD83D\uDD25" : " days"}
          change={`Best: ${data.streak.longest}`}
          changeType="neutral"
        />
      </div>

      {/* Rule of 100 Progress Bar */}
      <div className="rounded-xl p-4" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium" style={{ color: "var(--db-text)" }}>Rule of 100</span>
          <span style={{ color: touchesRemaining === 0 ? "var(--db-success, #4ade80)" : "var(--db-text-muted)" }}>
            {data.metrics.todayTouches}/100 touches
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--db-border)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${touchProgress}%`,
              background: touchesRemaining === 0
                ? "linear-gradient(90deg, #4ade80, #22c55e)"
                : "linear-gradient(90deg, #D4A843, #E8C76A)",
            }}
          />
        </div>
      </div>

      {/* Section D: Pipeline Funnel */}
      <div>
        <h2 className="text-sm font-medium mb-3" style={{ color: "var(--db-text-muted)" }}>
          Sales Pipeline
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollSnapType: "x mandatory" }}>
          {(
            [
              { key: "fresh", label: "Fresh", color: "#94a3b8" },
              { key: "contacted", label: "Contacted", color: "var(--db-info, #60a5fa)" },
              { key: "interested", label: "Interested", color: "#D4A843" },
              { key: "demo", label: "Demo Booked", color: "#a78bfa" },
              { key: "won", label: "Won", color: "var(--db-success, #4ade80)" },
            ] as const
          ).map((stage, i) => {
            const stageData = data.pipeline[stage.key];
            return (
              <div key={stage.key} className="flex items-center shrink-0" style={{ scrollSnapAlign: "start" }}>
                <Link
                  href={stage.key === "won" ? "/admin/clients" : "/admin/outreach"}
                  className="rounded-xl p-4 transition-all hover:scale-[1.02]"
                  style={{
                    background: "var(--db-card)",
                    border: "1px solid var(--db-border)",
                    minWidth: 150,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
                    <span className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
                      {stage.label}
                    </span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: "var(--db-text)" }}>
                    {stageData.count}
                  </p>
                  {stageData.top3.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {stageData.top3.map((p) => (
                        <p key={p.id} className="truncate text-xs" style={{ color: "var(--db-text-muted)", maxWidth: 130 }}>
                          {p.name}
                        </p>
                      ))}
                    </div>
                  )}
                </Link>
                {i < 4 && (
                  <span className="mx-1 text-lg shrink-0" style={{ color: "var(--db-border)" }}>
                    &rsaquo;
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section E: Today's Activity Log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium" style={{ color: "var(--db-text-muted)" }}>
            Today&apos;s Activity
          </h2>
          <span className="text-sm font-semibold" style={{ color: "#D4A843" }}>
            <AnimatedCounter value={runningXp} suffix=" XP total" />
          </span>
        </div>
        {data.todayActivity.length === 0 ? (
          <div
            className="rounded-xl p-6 text-center"
            style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
          >
            <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
              No activity yet today. Start your outreach!
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--db-card)", border: "1px solid var(--db-border)", maxHeight: 400, overflowY: "auto" }}
          >
            {data.todayActivity.map((activity) => {
              const ago = getRelativeTime(activity.createdAt);
              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: "1px solid var(--db-border)" }}
                >
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold"
                    style={{ background: "rgba(212,168,67,0.12)", color: "#D4A843" }}
                  >
                    +{activity.xp} XP
                  </span>
                  <span className="flex-1 truncate text-sm" style={{ color: "var(--db-text)" }}>
                    {activity.description}
                  </span>
                  <span className="shrink-0 text-xs" style={{ color: "var(--db-text-muted)" }}>
                    {ago}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick link to ops dashboard */}
      <div className="text-center">
        <Link
          href="/admin/ops-dashboard"
          className="text-sm font-medium transition-colors hover:underline"
          style={{ color: "var(--db-text-muted)" }}
        >
          View full Ops Dashboard &rarr;
        </Link>
      </div>
    </div>
  );
}

function getRelativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}
