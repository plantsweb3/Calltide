"use client";

interface Appointment {
  id: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  leadName: string | null;
  leadPhone: string | null;
}

const SERVICE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "AC Repair": { bg: "rgba(96,165,250,0.12)", text: "#60a5fa", border: "#60a5fa" },
  "Pipe Leak Repair": { bg: "rgba(248,113,113,0.12)", text: "#f87171", border: "#f87171" },
  "Property Showing": { bg: "rgba(139,92,246,0.12)", text: "#8b5cf6", border: "#8b5cf6" },
  "Drain Cleaning": { bg: "rgba(74,222,128,0.12)", text: "#4ade80", border: "#4ade80" },
  "Water Heater Install": { bg: "rgba(251,191,36,0.12)", text: "#fbbf24", border: "#fbbf24" },
  "Toilet Repair": { bg: "rgba(45,212,191,0.12)", text: "#2dd4bf", border: "#2dd4bf" },
  "Re-piping Estimate": { bg: "rgba(244,114,182,0.12)", text: "#f472b6", border: "#f472b6" },
};

function getServiceColor(service: string) {
  return SERVICE_COLORS[service] || { bg: "rgba(148,163,184,0.12)", text: "#94a3b8", border: "#94a3b8" };
}

function getWeekDays(): { label: string; short: string; date: string; isToday: boolean }[] {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - diff);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    return {
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      short: d.toLocaleDateString(undefined, { day: "numeric" }),
      date: dateStr,
      isToday: dateStr === today.toISOString().slice(0, 10),
    };
  });
}

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

export default function AppointmentCalendar({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const weekDays = getWeekDays();

  function getAppointmentsForSlot(date: string, hour: number) {
    return appointments.filter((appt) => {
      if (appt.date !== date) return false;
      const apptHour = parseInt(appt.time.split(":")[0]);
      return apptHour === hour;
    });
  }

  return (
    <div
      className="rounded-xl overflow-hidden transition-colors duration-300"
      style={{
        background: "var(--db-card)",
        border: "1px solid var(--db-border)",
        boxShadow: "var(--db-card-shadow)",
      }}
    >
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)]" style={{ borderBottom: "1px solid var(--db-border)" }}>
            <div className="p-2" />
            {weekDays.map((day) => (
              <div
                key={day.date}
                className="p-2 text-center"
                style={{ borderLeft: "1px solid var(--db-border-light)" }}
              >
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
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
                <span className="text-[11px] tabular-nums" style={{ color: "var(--db-text-muted)" }}>
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                </span>
              </div>
              {weekDays.map((day) => {
                const appts = getAppointmentsForSlot(day.date, hour);
                return (
                  <div
                    key={`${day.date}-${hour}`}
                    className="p-1"
                    style={{ borderLeft: "1px solid var(--db-border-light)" }}
                  >
                    {appts.map((appt) => {
                      const c = getServiceColor(appt.service);
                      return (
                        <div
                          key={appt.id}
                          className="rounded-md px-2 py-1.5 mb-1 cursor-default"
                          style={{
                            background: c.bg,
                            borderLeft: `3px solid ${c.border}`,
                          }}
                          title={`${appt.service} — ${appt.leadName || appt.leadPhone}`}
                        >
                          <p className="text-[11px] font-medium truncate" style={{ color: c.text }}>
                            {appt.service}
                          </p>
                          <p className="text-[10px] truncate" style={{ color: "var(--db-text-muted)" }}>
                            {appt.leadName || appt.leadPhone}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
