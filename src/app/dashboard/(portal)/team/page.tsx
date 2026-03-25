"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/page-header";
import DataTable, { type Column } from "@/components/data-table";
import StatusBadge from "@/components/ui/status-badge";
import Button from "@/components/ui/button";
import EmptyState from "@/components/empty-state";
import ConfirmDialog from "@/components/confirm-dialog";
import { formatPhone } from "@/lib/format";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

/* ── Types ── */

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
  sortOrder: number;
  todayJobs: number;
  createdAt: string;
}

/* ── Color Palette ── */

const COLOR_OPTIONS = [
  { label: "Blue", value: "#3B82F6" },
  { label: "Green", value: "#10B981" },
  { label: "Amber", value: "#F59E0B" },
  { label: "Red", value: "#EF4444" },
  { label: "Purple", value: "#8B5CF6" },
  { label: "Pink", value: "#EC4899" },
  { label: "Teal", value: "#14B8A6" },
  { label: "Orange", value: "#F97316" },
  { label: "Indigo", value: "#6366F1" },
  { label: "Lime", value: "#84CC16" },
];

/* ── Helpers ── */

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/* ── Component ── */

export default function TeamPage() {
  const [lang] = useLang();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSkills, setFormSkills] = useState<string[]>([]);
  const [formSkillInput, setFormSkillInput] = useState("");
  const [formColor, setFormColor] = useState(COLOR_OPTIONS[0].value);

  // Confirm delete
  const [deleteTarget, setDeleteTarget] = useState<Technician | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Unavailability modal
  const [unavailTarget, setUnavailTarget] = useState<Technician | null>(null);
  const [unavailReason, setUnavailReason] = useState("");
  const [unavailUntil, setUnavailUntil] = useState("");
  const [unavailLoading, setUnavailLoading] = useState(false);

  const fetchTechnicians = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/technicians");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setTechnicians(data.technicians);
    } catch {
      setError(t("error.failedToLoad", lang));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  function openAddModal() {
    setEditingTech(null);
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormSkills([]);
    setFormSkillInput("");
    setFormColor(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)].value);
    setModalOpen(true);
  }

  function openEditModal(tech: Technician) {
    setEditingTech(tech);
    setFormName(tech.name);
    setFormPhone(tech.phone || "");
    setFormEmail(tech.email || "");
    setFormSkills(tech.skills || []);
    setFormSkillInput("");
    setFormColor(tech.color || COLOR_OPTIONS[0].value);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error(t("toast.nameRequired", lang));
      return;
    }

    setFormLoading(true);
    try {
      if (editingTech) {
        // Update
        const res = await fetch(`/api/dashboard/technicians/${editingTech.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            phone: formPhone.trim() || null,
            email: formEmail.trim() || null,
            skills: formSkills,
            color: formColor,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update");
        }
        toast.success(t("toast.teamMemberUpdated", lang));
      } else {
        // Create
        const res = await fetch("/api/dashboard/technicians", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            phone: formPhone.trim() || undefined,
            email: formEmail.trim() || undefined,
            skills: formSkills,
            color: formColor,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create");
        }
        toast.success(t("toast.teamMemberAdded", lang));
      }
      setModalOpen(false);
      fetchTechnicians();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error.somethingWentWrong", lang));
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/dashboard/technicians/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove");
      toast.success(t("toast.nameRemoved", lang, { name: deleteTarget.name }));
      setDeleteTarget(null);
      fetchTechnicians();
    } catch {
      toast.error(t("toast.failedToRemoveTeamMember", lang));
    } finally {
      setDeleteLoading(false);
    }
  }

  async function toggleOnCall(tech: Technician) {
    try {
      const res = await fetch(`/api/dashboard/technicians/${tech.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnCall: !tech.isOnCall }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(!tech.isOnCall ? t("toast.nowOnCall", lang, { name: tech.name }) : t("toast.noLongerOnCall", lang, { name: tech.name }));
      fetchTechnicians();
    } catch {
      toast.error(t("toast.failedToUpdateOnCall", lang));
    }
  }

  function openUnavailModal(tech: Technician) {
    setUnavailTarget(tech);
    setUnavailReason("");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setUnavailUntil(toDateInput(tomorrow));
  }

  async function handleMarkUnavailable() {
    if (!unavailTarget) return;
    setUnavailLoading(true);
    try {
      const res = await fetch(`/api/dashboard/technicians/${unavailTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isUnavailable: true,
          unavailableReason: unavailReason.trim() || null,
          unavailableUntil: unavailUntil || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(t("toast.markedUnavailable", lang, { name: unavailTarget.name }));
      setUnavailTarget(null);
      fetchTechnicians();
    } catch {
      toast.error(t("toast.failedToUpdateAvailability", lang));
    } finally {
      setUnavailLoading(false);
    }
  }

  async function handleMarkAvailable(tech: Technician) {
    try {
      const res = await fetch(`/api/dashboard/technicians/${tech.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isUnavailable: false,
          unavailableReason: null,
          unavailableUntil: null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(t("toast.nowAvailable", lang, { name: tech.name }));
      fetchTechnicians();
    } catch {
      toast.error(t("toast.failedToUpdateAvailability", lang));
    }
  }

  function addSkill() {
    const skill = formSkillInput.trim();
    if (skill && !formSkills.includes(skill)) {
      setFormSkills([...formSkills, skill]);
    }
    setFormSkillInput("");
  }

  function removeSkill(skill: string) {
    setFormSkills(formSkills.filter((s) => s !== skill));
  }

  const filteredTechs = showInactive
    ? technicians
    : technicians.filter((t) => t.isActive);

  const activeTechs = technicians.filter((t) => t.isActive);
  const onCallTechs = technicians.filter((t) => t.isOnCall && t.isActive);
  const unavailableTechs = technicians.filter((t) => t.isUnavailable && t.isActive);

  const columns: Column<Technician>[] = [
    {
      key: "name",
      label: t("misc.name", lang),
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span
            className="h-3 w-3 rounded-full flex-shrink-0"
            style={{ background: row.color || "#3B82F6" }}
          />
          <div>
            <p className="font-medium" style={{ color: "var(--db-text)" }}>{row.name}</p>
            {row.email && (
              <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>{row.email}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      label: t("misc.phone", lang),
      render: (row) => (
        <span className="text-sm" style={{ color: "var(--db-text)" }}>
          {formatPhone(row.phone)}
        </span>
      ),
    },
    {
      key: "skills",
      label: t("team.skills", lang),
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.skills || []).slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-xs font-medium px-1.5 py-0.5 rounded"
              style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
            >
              {skill}
            </span>
          ))}
          {(row.skills || []).length > 3 && (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}>
              +{row.skills.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: t("team.status", lang),
      render: (row) => (
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge
            label={row.isActive ? t("team.active", lang) : t("team.inactive", lang)}
            variant={row.isActive ? "success" : "neutral"}
            dot
          />
          {row.isOnCall && row.isActive && (
            <StatusBadge label={t("team.onCall", lang)} variant="danger" />
          )}
          {row.isUnavailable && row.isActive && (
            <StatusBadge label={t("team.unavailable", lang)} variant="danger" />
          )}
        </div>
      ),
    },
    {
      key: "todayJobs",
      label: t("team.today", lang),
      render: (row) => (
        <span
          className="text-sm font-medium tabular-nums"
          style={{ color: row.todayJobs > 0 ? "var(--db-text)" : "var(--db-text-muted)" }}
        >
          {row.todayJobs} {row.todayJobs !== 1 ? t("team.jobs", lang) : t("team.job", lang)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-1">
          {/* Unavailability toggle */}
          {row.isActive && (
            row.isUnavailable ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAvailable(row);
                }}
                title={t("team.markAvailable", lang)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#10B981" }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  openUnavailModal(row);
                }}
                title={t("team.markUnavailable", lang)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--db-text-muted)" }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              </Button>
            )
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              toggleOnCall(row);
            }}
            title={row.isOnCall ? t("team.removeFromOnCall", lang) : t("team.setOnCall", lang)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={row.isOnCall ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: row.isOnCall ? "var(--db-danger)" : "var(--db-text-muted)" }}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
          >
            {t("action.edit", lang)}
          </Button>
          {row.isActive && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(row);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--db-text-muted)" }}>
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("team.title", lang)}
        description={`${activeTechs.length} ${activeTechs.length !== 1 ? t("team.techniciansPlural", lang) : t("team.technicians", lang)}${onCallTechs.length > 0 ? ` \u00B7 ${onCallTechs.length} ${t("team.onCallCount", lang)}` : ""}${unavailableTechs.length > 0 ? ` \u00B7 ${unavailableTechs.length} ${t("team.unavailableCount", lang)}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            {technicians.some((tech) => !tech.isActive) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInactive(!showInactive)}
              >
                {showInactive ? t("team.hideInactive", lang) : t("team.showInactive", lang)}
              </Button>
            )}
            <Button onClick={openAddModal}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t("team.addTechnician", lang)}
            </Button>
          </div>
        }
      />

      {/* Error */}
      {error && (
        <div role="alert" aria-live="assertive" className="rounded-xl p-4 mb-4 flex items-center justify-between" style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)" }}>
          <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
          <Button variant="danger" size="sm" onClick={fetchTechnicians}>{t("action.retry", lang)}</Button>
        </div>
      )}

      {/* Loading */}
      {loading && technicians.length === 0 && !error && (
        <div className="db-card rounded-xl overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse" style={{ borderBottom: "1px solid var(--db-border)" }}>
              <div className="h-3 w-3 rounded-full" style={{ background: "var(--db-hover)" }} />
              <div className="h-4 w-32 rounded" style={{ background: "var(--db-hover)" }} />
              <div className="h-4 w-24 rounded ml-auto" style={{ background: "var(--db-hover)" }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && technicians.length === 0 && (
        <EmptyState
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          title={t("team.noTeamMembers", lang)}
          description={t("team.noTeamMembersDesc", lang)}
          action={{ label: t("team.addTechnician", lang), onClick: openAddModal }}
        />
      )}

      {/* Data Table */}
      {filteredTechs.length > 0 && (
        <DataTable
          columns={columns}
          data={filteredTechs}
          onRowClick={openEditModal}
        />
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !formLoading && setModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tech-form-title"
            className="modal-content db-card w-full max-w-lg rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape" && !formLoading) setModalOpen(false); }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id="tech-form-title" className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
                {editingTech ? t("team.editTechnician", lang) : t("team.addTechnician", lang)}
              </h3>
              <button
                onClick={() => { if (!formLoading) setModalOpen(false); }}
                className="p-1 rounded-lg transition-colors"
                style={{ color: "var(--db-text-muted)" }}
                disabled={formLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--db-text-muted)" }}>
                  {t("misc.name", lang)} *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="John Smith"
                  required
                  maxLength={200}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                  style={{
                    background: "var(--db-surface, var(--db-bg))",
                    border: "1px solid var(--db-border)",
                    color: "var(--db-text)",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
                />
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--db-text-muted)" }}>
                    {t("misc.phone", lang)}
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    maxLength={30}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                    style={{
                      background: "var(--db-surface, var(--db-bg))",
                      border: "1px solid var(--db-border)",
                      color: "var(--db-text)",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--db-text-muted)" }}>
                    {t("misc.email", lang)}
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="john@example.com"
                    maxLength={254}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                    style={{
                      background: "var(--db-surface, var(--db-bg))",
                      border: "1px solid var(--db-border)",
                      color: "var(--db-text)",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--db-text-muted)" }}>
                  {t("team.skills", lang)}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formSkillInput}
                    onChange={(e) => setFormSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addSkill(); }
                    }}
                    placeholder={t("team.skillPlaceholder", lang)}
                    maxLength={100}
                    className="flex-1 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                    style={{
                      background: "var(--db-surface, var(--db-bg))",
                      border: "1px solid var(--db-border)",
                      color: "var(--db-text)",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={addSkill}>
                    {t("action.add", lang)}
                  </Button>
                </div>
                {formSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md"
                        style={{ background: "var(--db-hover)", color: "var(--db-text)" }}
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-0.5 transition-colors"
                          style={{ color: "var(--db-text-muted)" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--db-text-muted)" }}>
                  {t("team.color", lang)}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormColor(c.value)}
                      className="h-7 w-7 rounded-full transition-all"
                      style={{
                        background: c.value,
                        boxShadow: formColor === c.value ? `0 0 0 2px var(--db-card), 0 0 0 4px ${c.value}` : "none",
                        transform: formColor === c.value ? "scale(1.1)" : "scale(1)",
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: "1px solid var(--db-border)" }}>
                <Button type="button" variant="ghost" onClick={() => { if (!formLoading) setModalOpen(false); }} disabled={formLoading}>
                  {t("action.cancel", lang)}
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? t("team.saving", lang) : editingTech ? t("action.save", lang) : t("team.addTechnician", lang)}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unavailability Modal */}
      {unavailTarget && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !unavailLoading && setUnavailTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unavail-dialog-title"
            className="modal-content db-card w-full max-w-md rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape" && !unavailLoading) setUnavailTarget(null); }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id="unavail-dialog-title" className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
                {t("team.markNameUnavailable", lang, { name: unavailTarget.name })}
              </h3>
              <button
                onClick={() => { if (!unavailLoading) setUnavailTarget(null); }}
                className="p-1 rounded-lg transition-colors"
                style={{ color: "var(--db-text-muted)" }}
                disabled={unavailLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--db-text-muted)" }}>
                  {t("team.reason", lang)}
                </label>
                <input
                  type="text"
                  value={unavailReason}
                  onChange={(e) => setUnavailReason(e.target.value)}
                  placeholder={t("team.reasonPlaceholder", lang)}
                  maxLength={200}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                  style={{
                    background: "var(--db-surface, var(--db-bg))",
                    border: "1px solid var(--db-border)",
                    color: "var(--db-text)",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--db-text-muted)" }}>
                  {t("team.until", lang)}
                </label>
                <input
                  type="date"
                  value={unavailUntil}
                  onChange={(e) => setUnavailUntil(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                  style={{
                    background: "var(--db-surface, var(--db-bg))",
                    border: "1px solid var(--db-border)",
                    color: "var(--db-text)",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: "1px solid var(--db-border)" }}>
                <Button type="button" variant="ghost" onClick={() => { if (!unavailLoading) setUnavailTarget(null); }} disabled={unavailLoading}>
                  {t("action.cancel", lang)}
                </Button>
                <Button onClick={handleMarkUnavailable} disabled={unavailLoading}>
                  {unavailLoading ? t("team.saving", lang) : t("team.markUnavailable", lang)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={t("team.removeConfirmTitle", lang, { name: deleteTarget?.name || "" })}
        description={t("team.removeConfirmDesc", lang)}
        confirmLabel={t("action.remove", lang)}
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
