"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import PageHeader from "@/components/page-header";
import StatusBadge, { statusToVariant } from "@/components/ui/status-badge";
import Button from "@/components/ui/button";
import EmptyState from "@/components/empty-state";
import ConfirmDialog from "@/components/confirm-dialog";
import { formatPhone } from "@/lib/format";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

/* ── Types ── */

interface DispatchAppointment {
  id: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  notes: string | null;
  technicianId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  recommendedTechId?: string | null;
  recommendedReason?: string | null;
}

interface Technician {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  skills: string[];
  isActive: boolean;
  isOnCall: boolean;
  isUnavailable: boolean;
  unavailableReason: string | null;
  unavailableUntil: string | null;
  color: string | null;
  appointments: DispatchAppointment[];
}

/* ── Helpers ── */

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(date: string, locale: string = "en-US"): string {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

const DEFAULT_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

function getTechColor(tech: Technician, index: number): string {
  return tech.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

/* ── Main Component ── */

export default function DispatchPage() {
  const [lang] = useLang();
  const [date, setDate] = useState(toDateString(new Date()));
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [unassigned, setUnassigned] = useState<DispatchAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assign modal
  const [assignAppt, setAssignAppt] = useState<DispatchAppointment | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);

  // Notify
  const [notifyLoading, setNotifyLoading] = useState<string | null>(null);
  const [sendAllLoading, setSendAllLoading] = useState(false);

  // Selected appointment detail
  const [selectedAppt, setSelectedAppt] = useState<DispatchAppointment | null>(null);

  // Reassign dropdown
  const [reassignApptId, setReassignApptId] = useState<string | null>(null);

  const fetchDispatch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/dispatch?date=${date}`);
      if (!res.ok) throw new Error(t("error.failedToLoad", lang));
      const data = await res.json();
      setTechnicians(data.technicians);
      setUnassigned(data.unassigned);
    } catch {
      setError(t("toast.failedToLoadDispatch", lang));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchDispatch();
  }, [fetchDispatch]);

  function navigateDate(delta: number) {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + delta);
    setDate(toDateString(d));
  }

  function goToToday() {
    setDate(toDateString(new Date()));
  }

  async function handleAssign(appointmentId: string, technicianId: string | null) {
    setAssignLoading(true);
    try {
      const res = await fetch(`/api/dashboard/appointments/${appointmentId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId }),
      });
      if (!res.ok) throw new Error(t("error.failedToAssign", lang));
      toast.success(technicianId ? t("toast.technicianAssigned", lang) : t("toast.technicianUnassigned", lang));
      setAssignAppt(null);
      setReassignApptId(null);
      fetchDispatch();
    } catch {
      toast.error(t("toast.failedToAssign", lang));
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleQuickAssign(appointmentId: string, technicianId: string) {
    try {
      const res = await fetch(`/api/dashboard/appointments/${appointmentId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId }),
      });
      if (!res.ok) throw new Error(t("error.failedToAssign", lang));
      toast.success(t("toast.technicianAssigned", lang));
      fetchDispatch();
    } catch {
      toast.error(t("toast.failedToAssign", lang));
    }
  }

  async function handleNotify(techId: string) {
    setNotifyLoading(techId);
    try {
      const res = await fetch("/api/dashboard/dispatch/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId: techId, date }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("error.failedToSend", lang));
      }
      const data = await res.json();
      toast.success(t("toast.scheduleSent", lang, { count: String(data.jobCount) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.failedToSendSchedule", lang));
    } finally {
      setNotifyLoading(null);
    }
  }

  async function handleSendAll() {
    const techsWithJobs = technicians.filter((t) => t.appointments.length > 0 && t.phone && !t.isUnavailable);
    if (techsWithJobs.length === 0) {
      toast.error(t("toast.noTechsToNotify", lang));
      return;
    }

    setSendAllLoading(true);
    let sent = 0;
    for (const tech of techsWithJobs) {
      try {
        const res = await fetch("/api/dashboard/dispatch/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ technicianId: tech.id, date }),
        });
        if (res.ok) sent++;
      } catch {
        // Continue to next
      }
    }
    toast.success(t("toast.schedulesSent", lang, { sent: String(sent), total: String(techsWithJobs.length) }));
    setSendAllLoading(false);
  }

  // Available techs are those that are not unavailable
  const availableTechs = technicians.filter((t) => !t.isUnavailable);
  const unavailableTechs = technicians.filter((t) => t.isUnavailable);

  const isToday = date === toDateString(new Date());
  const totalJobs = technicians.reduce((sum, t) => sum + t.appointments.length, 0) + unassigned.length;

  return (
    <div>
      <PageHeader
        catalog="Dispatch"
        title={t("dispatch.title", lang)}
        description={
          isToday
            ? t(totalJobs !== 1 ? "dispatch.jobCountPlural" : "dispatch.jobCount", lang, { count: totalJobs })
            : t(totalJobs !== 1 ? "dispatch.jobCountOnDatePlural" : "dispatch.jobCountOnDate", lang, { count: totalJobs, date: formatDateLabel(date, lang === "es" ? "es-MX" : "en-US") })
        }
        actions={
          <div className="flex items-center gap-3">
            <Link href="/dashboard/job-cards" className="text-sm font-medium" style={{ color: "var(--db-accent)" }}>
              {t("dispatch.viewJobCards", lang)} &rarr;
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSendAll}
              disabled={sendAllLoading || technicians.every((t) => t.appointments.length === 0)}
            >
              {sendAllLoading ? t("dispatch.sending", lang) : t("dispatch.sendAllSchedules", lang)}
            </Button>
          </div>
        }
      />

      {/* Date Navigation */}
      <div
        className="flex items-center justify-between rounded-xl px-4 py-3 mb-6"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
      >
        <button
          onClick={() => navigateDate(-1)}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium db-hover-bg"
          style={{ color: "var(--db-text-muted)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t("dispatch.prev", lang)}
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
            {formatDateLabel(date, lang === "es" ? "es-MX" : "en-US")}
          </h2>
          {!isToday && (
            <button
              onClick={goToToday}
              className="rounded-md px-2 py-1 text-xs font-medium transition-colors"
              style={{ background: "var(--db-accent)", color: "#fff" }}
            >
              {t("dispatch.today", lang)}
            </button>
          )}
        </div>

        <button
          onClick={() => navigateDate(1)}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium db-hover-bg"
          style={{ color: "var(--db-text-muted)" }}
        >
          {t("dispatch.next", lang)}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" aria-live="assertive" className="rounded-xl p-4 mb-4 flex items-center justify-between" style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)" }}>
          <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
          <Button variant="danger" size="sm" onClick={fetchDispatch}>{t("action.retry", lang)}</Button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
              <div className="h-4 w-32 rounded mb-3" style={{ background: "var(--db-hover)" }} />
              <div className="space-y-2">
                <div className="h-16 rounded-lg" style={{ background: "var(--db-hover)" }} />
                <div className="h-16 rounded-lg" style={{ background: "var(--db-hover)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && technicians.length === 0 && unassigned.length === 0 && (
        <EmptyState
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          title={t("dispatch.noTechniciansYet", lang)}
          description={t("dispatch.noTechniciansDesc", lang)}
          action={{ label: t("dispatch.addTeam", lang), href: "/dashboard/team" }}
        />
      )}

      {/* Dispatch Grid */}
      {!loading && (technicians.length > 0 || unassigned.length > 0) && (
        <div className="space-y-6">
          {/* Unassigned jobs */}
          {unassigned.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "2px dashed var(--db-border)" }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: "var(--db-hover)" }}
              >
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--db-warning)" }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
                    {t("dispatch.unassigned", lang)} ({unassigned.length})
                  </span>
                </div>
              </div>
              <div className="p-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {unassigned.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    borderColor="var(--db-border)"
                    onClick={() => setSelectedAppt(appt)}
                    quickAssignTechs={availableTechs}
                    onQuickAssign={(techId) => handleQuickAssign(appt.id, techId)}
                    recommendedTechId={appt.recommendedTechId}
                    recommendedReason={appt.recommendedReason}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Available Technician columns */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableTechs.map((tech, idx) => {
              const color = getTechColor(tech, idx);
              return (
                <div
                  key={tech.id}
                  className="rounded-xl overflow-hidden"
                  style={{ border: `1px solid var(--db-border)`, background: "var(--db-card)" }}
                >
                  {/* Technician Header */}
                  <div
                    className="px-4 py-3"
                    style={{ borderBottom: `2px solid ${color}` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ background: color }}
                        />
                        <div>
                          <h3 className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
                            {tech.name}
                          </h3>
                          {tech.phone && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
                              {formatPhone(tech.phone)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {tech.isOnCall && (
                          <span
                            className="text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}
                          >
                            {t("team.onCall", lang)}
                          </span>
                        )}
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
                        >
                          {tech.appointments.length} {tech.appointments.length !== 1 ? t("team.jobs", lang) : t("team.job", lang)}
                        </span>
                      </div>
                    </div>

                    {/* Skills */}
                    {tech.skills && tech.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tech.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="text-xs font-medium px-1.5 py-0.5 rounded"
                            style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
                          >
                            {skill}
                          </span>
                        ))}
                        {tech.skills.length > 3 && (
                          <span
                            className="text-xs font-medium px-1.5 py-0.5 rounded"
                            style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
                          >
                            +{tech.skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Notify button */}
                    {tech.appointments.length > 0 && tech.phone && (
                      <button
                        onClick={() => handleNotify(tech.id)}
                        disabled={notifyLoading === tech.id}
                        className="mt-2 flex items-center gap-1 text-xs font-medium transition-colors"
                        style={{ color: "var(--db-accent)" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9z" />
                        </svg>
                        {notifyLoading === tech.id ? t("dispatch.sending", lang) : t("dispatch.sendSchedule", lang)}
                      </button>
                    )}
                  </div>

                  {/* Appointments */}
                  <div className="p-3 space-y-2 min-h-[80px]">
                    {tech.appointments.length === 0 ? (
                      <p className="text-xs text-center py-4" style={{ color: "var(--db-text-muted)" }}>
                        {t("dispatch.noJobsScheduled", lang)}
                      </p>
                    ) : (
                      tech.appointments.map((appt) => (
                        <AppointmentCard
                          key={appt.id}
                          appointment={appt}
                          borderColor={color}
                          onClick={() => setSelectedAppt(appt)}
                          showReassign
                          showUnassign
                          reassignOpen={reassignApptId === appt.id}
                          onReassignToggle={() => setReassignApptId(reassignApptId === appt.id ? null : appt.id)}
                          reassignTechs={availableTechs.filter((t) => t.id !== tech.id)}
                          onReassign={(techId) => handleQuickAssign(appt.id, techId)}
                          onUnassign={() => handleAssign(appt.id, null)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unavailable Techs - grayed out */}
          {unavailableTechs.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--db-text-muted)" }}>
                {t("team.offDuty", lang)} ({unavailableTechs.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {unavailableTechs.map((tech, idx) => {
                  const color = getTechColor(tech, idx);
                  return (
                    <div
                      key={tech.id}
                      className="rounded-xl overflow-hidden"
                      style={{
                        border: `1px solid var(--db-border)`,
                        background: "var(--db-card)",
                        opacity: 0.5,
                        filter: "grayscale(0.5)",
                      }}
                    >
                      <div className="px-4 py-3" style={{ borderBottom: `2px solid ${color}` }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: color }} />
                            <div>
                              <h3 className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
                                {tech.name}
                              </h3>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}
                            >
                              {t("team.offDuty", lang)}
                            </span>
                          </div>
                        </div>
                        {tech.unavailableReason && (
                          <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
                            {tech.unavailableReason}
                            {tech.unavailableUntil && ` - ${t("dispatch.untilDate", lang, { date: new Date(tech.unavailableUntil + "T12:00:00").toLocaleDateString(lang === "es" ? "es-MX" : "en-US", { month: "short", day: "numeric" }) })}`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assign Modal */}
      {assignAppt && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !assignLoading && setAssignAppt(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-dialog-title"
            className="modal-content db-card w-full max-w-md rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape" && !assignLoading) setAssignAppt(null); }}
          >
            <h3 id="assign-dialog-title" className="text-lg font-semibold mb-1" style={{ color: "var(--db-text)" }}>
              {t("dispatch.assign", lang)}
            </h3>
            <p className="text-sm mb-4" style={{ color: "var(--db-text-muted)" }}>
              {t("dispatch.serviceAtTime", lang, { service: assignAppt.service, time: formatTime12h(assignAppt.time) })}
              {assignAppt.customerName ? ` - ${assignAppt.customerName}` : ""}
            </p>

            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {availableTechs.map((tech, idx) => (
                <button
                  key={tech.id}
                  onClick={() => handleAssign(assignAppt.id, tech.id)}
                  disabled={assignLoading}
                  className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left db-hover-bg"
                  style={{ border: "1px solid var(--db-border)" }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ background: getTechColor(tech, idx) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--db-text)" }}>{tech.name}</p>
                    <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                      {tech.appointments.length} {t("dispatch.jobsToday", lang)}
                      {tech.skills?.length ? ` \u00B7 ${tech.skills.slice(0, 2).join(", ")}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setAssignAppt(null)} disabled={assignLoading}>
                {t("action.cancel", lang)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppt && !assignAppt && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAppt(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="modal-content db-card w-full max-w-lg rounded-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape") setSelectedAppt(null); }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 id="modal-title" className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
                  {selectedAppt.service}
                </h3>
                <p className="text-sm mt-1" style={{ color: "var(--db-text-muted)" }}>
                  {formatTime12h(selectedAppt.time)}
                  {selectedAppt.duration > 0 && ` \u00B7 ${selectedAppt.duration} min`}
                </p>
              </div>
              <button
                onClick={() => setSelectedAppt(null)}
                className="p-1 rounded-lg transition-colors"
                style={{ color: "var(--db-text-muted)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <DetailRow label={t("dispatch.detailStatus", lang)}>
                <StatusBadge label={selectedAppt.status} variant={statusToVariant(selectedAppt.status)} dot />
              </DetailRow>
              {selectedAppt.customerName && (
                <DetailRow label={t("dispatch.detailCustomer", lang)}>
                  <span className="text-sm" style={{ color: "var(--db-text)" }}>
                    {selectedAppt.customerName}
                    {selectedAppt.customerPhone ? ` \u00B7 ${formatPhone(selectedAppt.customerPhone)}` : ""}
                  </span>
                </DetailRow>
              )}
              {selectedAppt.customerAddress && (
                <DetailRow label={t("dispatch.detailAddress", lang)}>
                  <span className="text-sm" style={{ color: "var(--db-text)" }}>{selectedAppt.customerAddress}</span>
                </DetailRow>
              )}
              {selectedAppt.notes && (
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider block mb-1" style={{ color: "var(--db-text-muted)" }}>{t("dispatch.detailNotes", lang)}</span>
                  <p className="text-sm rounded-lg p-3" style={{ background: "var(--db-hover)", color: "var(--db-text)" }}>
                    {selectedAppt.notes}
                  </p>
                </div>
              )}
              {selectedAppt.technicianId && (
                <DetailRow label={t("dispatch.detailAssigned", lang)}>
                  <span className="text-sm" style={{ color: "var(--db-text)" }}>
                    {technicians.find((t) => t.id === selectedAppt.technicianId)?.name || t("dispatch.unknown", lang)}
                  </span>
                </DetailRow>
              )}
            </div>

            <div className="flex items-center gap-2 pt-3" style={{ borderTop: "1px solid var(--db-border)" }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedAppt(null);
                  setAssignAppt(selectedAppt);
                }}
              >
                {selectedAppt.technicianId ? t("dispatch.reschedule", lang) : t("dispatch.assign", lang)}
              </Button>
              {selectedAppt.technicianId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleAssign(selectedAppt.id, null);
                    setSelectedAppt(null);
                  }}
                >
                  {t("dispatch.unassign", lang)}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Subcomponents ── */

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium uppercase tracking-wider w-20 flex-shrink-0" style={{ color: "var(--db-text-muted)" }}>{label}</span>
      {children}
    </div>
  );
}

/* ── Quick-Assign Tech Circle ── */

interface TechCircleProps {
  tech: Technician;
  index: number;
  isRecommended: boolean;
  recommendedReason?: string | null;
  onClick: () => void;
}

function TechCircle({ tech, index, isRecommended, recommendedReason, onClick }: TechCircleProps) {
  const [lang] = useLang();
  const color = getTechColor(tech, index);
  const initial = tech.name.charAt(0).toUpperCase();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white transition-transform hover:scale-110"
        style={{
          background: color,
          boxShadow: isRecommended ? `0 0 0 2px var(--db-card), 0 0 0 4px var(--db-accent)` : "none",
        }}
        title={`${tech.name} - ${t("dispatch.jobsCountLabel", lang, { count: tech.appointments.length })}`}
      >
        {initial}
      </button>
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 rounded-md text-xs font-medium whitespace-nowrap z-10 pointer-events-none"
          style={{
            background: "var(--db-surface, var(--db-card))",
            color: "var(--db-text)",
            border: "1px solid var(--db-border)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <p className="font-semibold">{tech.name}</p>
          <p style={{ color: "var(--db-text-muted)" }}>{tech.appointments.length} {t("dispatch.jobsToday", lang)}</p>
          {isRecommended && (
            <p style={{ color: "var(--db-accent)" }}>
              {recommendedReason ? `${t("dispatch.recommended", lang)} - ${recommendedReason}` : t("dispatch.recommended", lang)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Appointment Card ── */

interface AppointmentCardProps {
  appointment: DispatchAppointment;
  borderColor: string;
  onClick?: () => void;
  // Quick-assign (for unassigned cards)
  quickAssignTechs?: Technician[];
  onQuickAssign?: (techId: string) => void;
  recommendedTechId?: string | null;
  recommendedReason?: string | null;
  // Reassign / Unassign (for assigned cards)
  showReassign?: boolean;
  showUnassign?: boolean;
  reassignOpen?: boolean;
  onReassignToggle?: () => void;
  reassignTechs?: Technician[];
  onReassign?: (techId: string) => void;
  onUnassign?: () => void;
}

function AppointmentCard({
  appointment,
  borderColor,
  onClick,
  quickAssignTechs,
  onQuickAssign,
  recommendedTechId,
  recommendedReason,
  showReassign,
  showUnassign,
  reassignOpen,
  onReassignToggle,
  reassignTechs,
  onReassign,
  onUnassign,
}: AppointmentCardProps) {
  const [lang] = useLang();
  return (
    <div
      className="rounded-lg p-3 transition-all db-hover-bg"
      style={{
        background: "var(--db-surface, var(--db-bg))",
        borderLeft: `3px solid ${borderColor}`,
        border: `1px solid var(--db-border)`,
        borderLeftWidth: "3px",
        borderLeftColor: borderColor,
      }}
    >
      <div
        className="cursor-pointer"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
              {formatTime12h(appointment.time)}
            </p>
            <p className="text-sm mt-0.5 truncate" style={{ color: "var(--db-text)" }}>
              {appointment.service}
            </p>
            {appointment.customerName && (
              <p className="text-xs mt-1 truncate" style={{ color: "var(--db-text-muted)" }}>
                {appointment.customerName}
                {appointment.customerPhone ? ` \u00B7 ${formatPhone(appointment.customerPhone)}` : ""}
              </p>
            )}
            {appointment.customerAddress && (
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--db-text-muted)" }}>
                {appointment.customerAddress}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <StatusBadge label={appointment.status} variant={statusToVariant(appointment.status)} />
            {appointment.duration > 0 && (
              <span className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
                {appointment.duration}m
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick-assign circles for unassigned appointments */}
      {quickAssignTechs && quickAssignTechs.length > 0 && onQuickAssign && (
        <div className="mt-2.5 pt-2" style={{ borderTop: "1px solid var(--db-border)" }}>
          <p className="text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--db-text-muted)" }}>
            {t("dispatch.dragToAssign", lang)}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickAssignTechs.map((tech, idx) => (
              <TechCircle
                key={tech.id}
                tech={tech}
                index={idx}
                isRecommended={tech.id === recommendedTechId}
                recommendedReason={recommendedReason}
                onClick={() => onQuickAssign(tech.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Reassign / Unassign for assigned appointments */}
      {(showReassign || showUnassign) && (
        <div className="mt-2 pt-2 flex items-center gap-2" style={{ borderTop: "1px solid var(--db-border)" }}>
          {showReassign && (
            <button
              className="flex items-center gap-1 text-xs font-medium transition-colors"
              style={{ color: "var(--db-accent)" }}
              onClick={(e) => {
                e.stopPropagation();
                onReassignToggle?.();
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
              {t("dispatch.reassign", lang)}
            </button>
          )}
          {showUnassign && (
            <button
              className="flex items-center gap-1 text-xs font-medium transition-colors"
              style={{ color: "var(--db-text-muted)" }}
              onClick={(e) => {
                e.stopPropagation();
                onUnassign?.();
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              {t("dispatch.unassign", lang)}
            </button>
          )}
        </div>
      )}

      {/* Reassign dropdown */}
      {reassignOpen && reassignTechs && onReassign && (
        <div
          className="mt-2 p-2 rounded-lg space-y-1"
          style={{ background: "var(--db-hover)", border: "1px solid var(--db-border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {reassignTechs.length === 0 ? (
            <p className="text-xs text-center py-1" style={{ color: "var(--db-text-muted)" }}>{t("dispatch.noOtherTechs", lang)}</p>
          ) : (
            reassignTechs.map((tech, idx) => {
              const color = getTechColor(tech, idx);
              return (
                <button
                  key={tech.id}
                  onClick={() => onReassign(tech.id)}
                  className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-left text-xs db-hover-bg"
                >
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="font-medium" style={{ color: "var(--db-text)" }}>{tech.name}</span>
                  <span style={{ color: "var(--db-text-muted)" }}>({t("dispatch.jobsCountLabel", lang, { count: tech.appointments.length })})</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
