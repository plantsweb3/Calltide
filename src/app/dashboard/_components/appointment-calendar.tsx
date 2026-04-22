"use client";

import { useState, useMemo, useEffect } from "react";

interface Appointment {
  id: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  notes: string | null;
  createdAt: string;
  leadName: string | null;
  leadPhone: string | null;
}

// Status-based color coding
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  confirmed: { bg: "var(--db-success-bg)", text: "var(--db-success)", border: "var(--db-success)" },
  cancelled: { bg: "var(--db-danger-bg)", text: "var(--db-danger)", border: "var(--db-danger)" },
  completed: { bg: "rgba(96,165,250,0.12)", text: "#60a5fa", border: "#60a5fa" },
  no_show: { bg: "var(--db-warning-bg)", text: "var(--db-warning)", border: "var(--db-warning)" },
};

function getStatusColor(status: string) {
  return STATUS_COLORS[status] || { bg: "rgba(148,163,184,0.12)", text: "var(--db-text-muted)", border: "var(--db-text-muted)" };
}

// Fixed hours: 7 AM to 7 PM
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // [7, 8, ..., 19]

function formatHour(hour: number): string {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

function formatTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr);
  const m = mStr || "00";
  if (h === 12) return `12:${m} PM`;
  if (h > 12) return `${h - 12}:${m} PM`;
  return `${h}:${m} AM`;
}

function getWeekDays(weekOffset: number): { label: string; short: string; fullLabel: string; date: string; isToday: boolean }[] {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - diff + weekOffset * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    return {
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      fullLabel: d.toLocaleDateString(undefined, { weekday: "long" }),
      short: d.toLocaleDateString(undefined, { day: "numeric" }),
      date: dateStr,
      isToday: dateStr === today.toISOString().slice(0, 10),
    };
  });
}

function getWeekLabel(weekOffset: number): string {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diff + weekOffset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${monday.toLocaleDateString(undefined, opts)} \u2013 ${sunday.toLocaleDateString(undefined, opts)}`;
}

function getDayLabel(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function getTodayIndex(weekDays: { date: string; isToday: boolean }[]): number {
  const idx = weekDays.findIndex((d) => d.isToday);
  return idx >= 0 ? idx : 0;
}

export default function AppointmentCalendar({
  appointments,
  onSelect,
}: {
  appointments: Appointment[];
  onSelect?: (appt: Appointment) => void;
}) {
  const MAX_WEEK_OFFSET = 13; // +/-3 months
  const [weekOffset, setWeekOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const weekDays = getWeekDays(weekOffset);

  // Detect narrow screens for day view
  useEffect(() => {
    function checkWidth() {
      setIsMobile(window.innerWidth < 768);
    }
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Reset selected day to today when changing weeks
  useEffect(() => {
    setSelectedDayIndex(getTodayIndex(weekDays));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  const appointmentsBySlot = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appt of appointments) {
      const apptHour = parseInt(appt.time.split(":")[0]);
      const key = `${appt.date}-${apptHour}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(appt);
    }
    return map;
  }, [appointments]);

  function getAppointmentsForSlot(date: string, hour: number): Appointment[] {
    return appointmentsBySlot.get(`${date}-${hour}`) || [];
  }

  // For mobile: navigate between days
  const selectedDay = weekDays[selectedDayIndex];

  function renderAppointmentBlock(appt: Appointment) {
    const c = getStatusColor(appt.status);
    const isCancelled = appt.status === "cancelled";

    return (
      <div
        key={appt.id}
        className={`rounded-md px-2 py-1.5 mb-1 transition-all ${onSelect ? "cursor-pointer hover:brightness-110 hover:shadow-sm" : "cursor-default"}`}
        style={{
          background: c.bg,
          borderLeft: `3px solid ${c.border}`,
          opacity: isCancelled ? 0.6 : 1,
        }}
        title={`${appt.service} \u2014 ${formatTime(appt.time)}${appt.leadName ? ` \u2014 ${appt.leadName}` : ""} (${appt.status})`}
        onClick={() => onSelect?.(appt)}
      >
        <p
          className="text-xs font-medium truncate"
          style={{
            color: c.text,
            textDecoration: isCancelled ? "line-through" : "none",
          }}
        >
          {appt.service}
        </p>
        <p
          className="text-xs truncate"
          style={{
            color: "var(--db-text-muted)",
            textDecoration: isCancelled ? "line-through" : "none",
          }}
        >
          {formatTime(appt.time)}
          {appt.leadName ? ` \u00B7 ${appt.leadName}` : appt.leadPhone ? ` \u00B7 ${appt.leadPhone}` : ""}
        </p>
      </div>
    );
  }

  // Mobile: single-day column view
  if (isMobile) {
    return (
      <div
        className="rounded-[4px] overflow-hidden transition-colors duration-300"
        style={{
          background: "var(--db-card)",
          border: "1px solid var(--db-border)",
          boxShadow: "var(--db-card-shadow)",
        }}
      >
        {/* Week navigation */}
        <div
          className="flex items-center justify-between px-3 py-2.5"
          style={{ borderBottom: "1px solid var(--db-border)" }}
        >
          <button
            onClick={() => setWeekOffset((o) => Math.max(-MAX_WEEK_OFFSET, o - 1))}
            disabled={weekOffset <= -MAX_WEEK_OFFSET}
            className="rounded-lg p-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: "var(--db-text-secondary)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
              {getWeekLabel(weekOffset)}
            </span>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="rounded px-2 py-0.5 text-xs mt-0.5"
                style={{ color: "var(--db-accent)", background: "var(--db-accent-bg)" }}
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={() => setWeekOffset((o) => Math.min(MAX_WEEK_OFFSET, o + 1))}
            disabled={weekOffset >= MAX_WEEK_OFFSET}
            className="rounded-lg p-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: "var(--db-text-secondary)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        {/* Day selector pills */}
        <div
          className="flex overflow-x-auto gap-1 px-3 py-2"
          style={{ borderBottom: "1px solid var(--db-border)" }}
        >
          {weekDays.map((day, i) => (
            <button
              key={day.date}
              onClick={() => setSelectedDayIndex(i)}
              className="flex flex-col items-center min-w-[44px] rounded-lg px-2 py-1.5 transition-colors"
              style={{
                background:
                  i === selectedDayIndex
                    ? "var(--db-accent)"
                    : day.isToday
                    ? "var(--db-accent-bg)"
                    : "transparent",
                color:
                  i === selectedDayIndex
                    ? "#fff"
                    : day.isToday
                    ? "var(--db-accent)"
                    : "var(--db-text-muted)",
              }}
            >
              <span className="text-xs font-medium">{day.label}</span>
              <span className="text-sm font-semibold">{day.short}</span>
            </button>
          ))}
        </div>

        {/* Day label */}
        <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--db-border-light)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
            {getDayLabel(selectedDay.date)}
          </p>
        </div>

        {/* Time slots for selected day */}
        <div>
          {HOURS.map((hour) => {
            const appts = getAppointmentsForSlot(selectedDay.date, hour);
            return (
              <div
                key={hour}
                className="flex"
                style={{ borderBottom: "1px solid var(--db-border-light)", minHeight: "48px" }}
              >
                <div className="w-[52px] shrink-0 p-2 flex items-start justify-end pr-2">
                  <span className="text-xs tabular-nums" style={{ color: "var(--db-text-muted)" }}>
                    {formatHour(hour)}
                  </span>
                </div>
                <div
                  className="flex-1 p-1"
                  style={{ borderLeft: "1px solid var(--db-border-light)" }}
                >
                  {appts.map(renderAppointmentBlock)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status legend */}
        <div className="flex flex-wrap gap-3 px-3 py-2.5" style={{ borderTop: "1px solid var(--db-border)" }}>
          {Object.entries(STATUS_COLORS).map(([status, c]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: c.border }}
              />
              <span className="text-xs capitalize" style={{ color: "var(--db-text-muted)" }}>
                {status.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Desktop: full week view
  return (
    <div
      className="rounded-[4px] overflow-hidden transition-colors duration-300"
      style={{
        background: "var(--db-card)",
        border: "1px solid var(--db-border)",
        boxShadow: "var(--db-card-shadow)",
      }}
    >
      {/* Week navigation */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--db-border)" }}
      >
        <button
          onClick={() => setWeekOffset((o) => Math.max(-MAX_WEEK_OFFSET, o - 1))}
          disabled={weekOffset <= -MAX_WEEK_OFFSET}
          className="db-hover-bg rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          style={{ color: "var(--db-text-secondary)", border: "1px solid var(--db-border)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Previous
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
            {getWeekLabel(weekOffset)}
          </span>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="rounded px-2 py-0.5 text-xs"
              style={{ color: "var(--db-accent)", background: "var(--db-accent-bg)" }}
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset((o) => Math.min(MAX_WEEK_OFFSET, o + 1))}
          disabled={weekOffset >= MAX_WEEK_OFFSET}
          className="db-hover-bg rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          style={{ color: "var(--db-text-secondary)", border: "1px solid var(--db-border)" }}
        >
          Next
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)]" style={{ borderBottom: "1px solid var(--db-border)" }}>
            <div className="p-2" />
            {weekDays.map((day) => (
              <div
                key={day.date}
                className="p-2 text-center"
                style={{
                  borderLeft: "1px solid var(--db-border-light)",
                  background: day.isToday ? "var(--db-accent-bg)" : "transparent",
                }}
              >
                <p className="text-xs" style={{ color: day.isToday ? "var(--db-accent)" : "var(--db-text-muted)" }}>
                  {day.label}
                </p>
                <p
                  className={`text-sm font-semibold mt-0.5 ${day.isToday ? "rounded-full w-7 h-7 flex items-center justify-center mx-auto" : ""}`}
                  style={{
                    color: day.isToday ? "#fff" : "var(--db-text)",
                    background: day.isToday ? "var(--db-accent)" : "transparent",
                  }}
                >
                  {day.short}
                </p>
              </div>
            ))}
          </div>

          {/* Time slots */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[60px_repeat(7,1fr)]"
              style={{ borderBottom: "1px solid var(--db-border-light)", minHeight: "56px" }}
            >
              <div className="p-2 flex items-start justify-end pr-3">
                <span className="text-xs tabular-nums" style={{ color: "var(--db-text-muted)" }}>
                  {formatHour(hour)}
                </span>
              </div>
              {weekDays.map((day) => {
                const appts = getAppointmentsForSlot(day.date, hour);
                return (
                  <div
                    key={`${day.date}-${hour}`}
                    className="p-1"
                    style={{
                      borderLeft: "1px solid var(--db-border-light)",
                      background: day.isToday ? "var(--db-accent-bg)" : "transparent",
                    }}
                  >
                    {appts.map(renderAppointmentBlock)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-4 px-4 py-2.5" style={{ borderTop: "1px solid var(--db-border)" }}>
        {Object.entries(STATUS_COLORS).map(([status, c]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: c.border }}
            />
            <span className="text-xs capitalize" style={{ color: "var(--db-text-muted)" }}>
              {status.replace(/_/g, " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
