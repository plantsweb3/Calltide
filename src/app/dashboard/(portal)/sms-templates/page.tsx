"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";
import Button from "@/components/ui/button";
import StatusBadge from "@/components/ui/status-badge";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import ConfirmDialog from "@/components/confirm-dialog";
import { TableSkeleton } from "@/components/skeleton";

/* ── Types ───────────────────────────────────────────────── */

interface SmsTemplate {
  id: string;
  businessId: string;
  templateKey: string;
  name: string;
  bodyEn: string;
  bodyEs: string;
  isActive?: boolean;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

type Category = "confirmation" | "reminder" | "follow_up" | "marketing" | "custom";

const CATEGORIES: Category[] = ["confirmation", "reminder", "follow_up", "marketing", "custom"];

const VARIABLES = [
  "{customer_name}",
  "{business_name}",
  "{date}",
  "{time}",
  "{service}",
  "{amount}",
  "{link}",
  "{review_link}",
];

/* ── Helpers ─────────────────────────────────────────────── */

function categoryFromKey(key: string): Category {
  if (key.includes("confirm")) return "confirmation";
  if (key.includes("reminder")) return "reminder";
  if (key.includes("followup") || key.includes("follow_up") || key.includes("follow-up")) return "follow_up";
  if (key.includes("marketing") || key.includes("promo")) return "marketing";
  return "custom";
}

const categoryVariant: Record<Category, "info" | "success" | "warning" | "accent" | "neutral"> = {
  confirmation: "success",
  reminder: "info",
  follow_up: "warning",
  marketing: "accent",
  custom: "neutral",
};

/** Count SMS segments (standard: 160 chars for single, 153 for concat) */
function smsSegments(text: string): number {
  if (!text) return 0;
  if (text.length <= 160) return 1;
  return Math.ceil(text.length / 153);
}

/** Render message body with variable placeholders highlighted */
function HighlightedMessage({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\{[^}]+\})/g);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.startsWith("{") && part.endsWith("}") ? (
          <span
            key={i}
            className="rounded px-1 py-0.5 text-xs font-mono font-medium"
            style={{ background: "var(--db-accent-bg)", color: "var(--db-accent)" }}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

/* ── Main component ──────────────────────────────────────── */

export default function SmsTemplatesPage() {
  const [lang] = useLang();
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<Category>("custom");
  const [formBodyEn, setFormBodyEn] = useState("");
  const [formBodyEs, setFormBodyEs] = useState("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<SmsTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch ─────────────────────────────────────────────── */

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/sms-templates");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setTemplates(data.templates ?? []);
    } catch {
      setError(t("smsTemplates.failedToLoad", lang));
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  /* ── Open modal ────────────────────────────────────────── */

  function openCreate() {
    setEditingTemplate(null);
    setFormName("");
    setFormCategory("custom");
    setFormBodyEn("");
    setFormBodyEs("");
    setShowModal(true);
  }

  function openEdit(tpl: SmsTemplate) {
    setEditingTemplate(tpl);
    setFormName(tpl.name);
    setFormCategory(categoryFromKey(tpl.templateKey));
    setFormBodyEn(tpl.bodyEn);
    setFormBodyEs(tpl.bodyEs);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingTemplate(null);
  }

  /* ── Save (create or update) ───────────────────────────── */

  async function handleSave() {
    if (!formName.trim() || !formBodyEn.trim() || !formBodyEs.trim()) return;
    setSaving(true);
    try {
      if (editingTemplate && !editingTemplate.isDefault) {
        // Update existing
        const res = await fetch(`/api/dashboard/sms-templates/${editingTemplate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            bodyEn: formBodyEn.trim(),
            bodyEs: formBodyEs.trim(),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update");
        }
        toast.success(t("smsTemplates.updated", lang));
      } else {
        // Create new
        const templateKey = formCategory + "_" + formName.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
        const res = await fetch("/api/dashboard/sms-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateKey,
            name: formName.trim(),
            bodyEn: formBodyEn.trim(),
            bodyEs: formBodyEs.trim(),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create");
        }
        toast.success(t("smsTemplates.created", lang));
      }
      closeModal();
      fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("smsTemplates.saveFailed", lang));
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete ────────────────────────────────────────────── */

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/dashboard/sms-templates/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success(t("smsTemplates.deleted", lang));
      setDeleteTarget(null);
      fetchTemplates();
    } catch {
      toast.error(t("smsTemplates.deleteFailed", lang));
    } finally {
      setDeleting(false);
    }
  }

  /* ── Render ────────────────────────────────────────────── */

  return (
    <div>
      <PageHeader
        title={t("smsTemplates.title", lang)}
        description={t("smsTemplates.description", lang)}
        actions={
          <Button onClick={openCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            {t("smsTemplates.newTemplate", lang)}
          </Button>
        }
      />

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-xl p-4 mb-4 flex items-center justify-between"
          style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)" }}
        >
          <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
          <Button variant="danger" size="sm" onClick={fetchTemplates}>
            {t("action.retry", lang)}
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && templates.length === 0 && !error && (
        <TableSkeleton rows={5} columns={3} />
      )}

      {/* Empty state */}
      {!loading && templates.length === 0 && (
        <EmptyState
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6" />
              <path d="M12 18v-6" />
              <path d="M9 15h6" />
            </svg>
          }
          title={t("smsTemplates.emptyTitle", lang)}
          description={t("smsTemplates.emptyDescription", lang)}
          action={{ label: t("smsTemplates.createFirst", lang), onClick: openCreate }}
        />
      )}

      {/* Template cards */}
      {!loading && templates.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => {
            const cat = categoryFromKey(tpl.templateKey);
            const bodyPreview = lang === "es" ? tpl.bodyEs : tpl.bodyEn;
            const truncated = bodyPreview.length > 120
              ? bodyPreview.slice(0, 120) + "..."
              : bodyPreview;

            return (
              <div
                key={tpl.id}
                className="db-card rounded-xl p-5 flex flex-col gap-3 transition-all hover:shadow-md"
                style={{ border: "1px solid var(--db-border)" }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--db-text)" }}
                      title={tpl.name}
                    >
                      {tpl.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge
                        label={t(`smsTemplates.cat.${cat}`, lang)}
                        variant={categoryVariant[cat]}
                      />
                      {tpl.isDefault && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                          style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
                        >
                          {t("smsTemplates.default", lang)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(tpl)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: "var(--db-text-muted)" }}
                      title={t("action.edit", lang)}
                      aria-label={`${t("action.edit", lang)} ${tpl.name}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                    {!tpl.isDefault && (
                      <button
                        onClick={() => setDeleteTarget(tpl)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--db-text-muted)" }}
                        title={t("action.delete", lang)}
                        aria-label={`${t("action.delete", lang)} ${tpl.name}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" x2="10" y1="11" y2="17" />
                          <line x1="14" x2="14" y1="11" y2="17" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Message preview with highlighted variables */}
                <div
                  className="text-sm leading-relaxed line-clamp-3"
                  style={{ color: "var(--db-text-secondary)" }}
                >
                  <HighlightedMessage text={truncated} />
                </div>

                {/* Footer — segment count */}
                <div className="mt-auto pt-2 flex items-center justify-between" style={{ borderTop: "1px solid var(--db-border)" }}>
                  <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                    {t("smsTemplates.segments", lang, { count: smsSegments(bodyPreview) })}
                  </span>
                  <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                    {bodyPreview.length} {t("smsTemplates.chars", lang)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Suggestion cards when there are few templates */}
      {!loading && templates.length > 0 && templates.length < 3 && (
        <div className="mt-6">
          <p className="text-sm font-medium mb-3" style={{ color: "var(--db-text-muted)" }}>
            {t("smsTemplates.suggestions", lang)}
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { name: t("smsTemplates.suggestReminder", lang), cat: "reminder" as Category },
              { name: t("smsTemplates.suggestFollowUp", lang), cat: "follow_up" as Category },
              { name: t("smsTemplates.suggestThankYou", lang), cat: "marketing" as Category },
            ].map((s) => (
              <button
                key={s.name}
                onClick={() => {
                  setEditingTemplate(null);
                  setFormName(s.name);
                  setFormCategory(s.cat);
                  setFormBodyEn("");
                  setFormBodyEs("");
                  setShowModal(true);
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: "var(--db-surface)",
                  color: "var(--db-text-muted)",
                  border: "1px dashed var(--db-border)",
                }}
              >
                + {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          className="db-modal-backdrop"
          onClick={closeModal}
          onKeyDown={(e) => { if (e.key === "Escape") closeModal(); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tpl-modal-title"
            className="modal-content w-full max-w-lg rounded-xl p-6"
            style={{
              background: "var(--db-surface)",
              border: "1px solid var(--db-border)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="tpl-modal-title"
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--db-text)" }}
            >
              {editingTemplate
                ? t("smsTemplates.editTemplate", lang)
                : t("smsTemplates.newTemplate", lang)}
            </h3>

            {/* Name */}
            <label className="db-label">{t("smsTemplates.nameLabel", lang)}</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value.slice(0, 100))}
              placeholder={t("smsTemplates.namePlaceholder", lang)}
              className="db-input mb-3"
              autoFocus
            />

            {/* Category */}
            <label className="db-label">{t("smsTemplates.categoryLabel", lang)}</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as Category)}
              className="db-input mb-3"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`smsTemplates.cat.${cat}`, lang)}
                </option>
              ))}
            </select>

            {/* English message */}
            <label className="db-label">{t("smsTemplates.messageEn", lang)}</label>
            <textarea
              value={formBodyEn}
              onChange={(e) => setFormBodyEn(e.target.value.slice(0, 500))}
              placeholder={t("smsTemplates.messagePlaceholder", lang)}
              rows={4}
              className="db-input mb-1"
              style={{ resize: "vertical" }}
            />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: formBodyEn.length > 160 ? "var(--db-warning)" : "var(--db-text-muted)" }}>
                {formBodyEn.length}/500 &middot; {smsSegments(formBodyEn)} {t("smsTemplates.segmentLabel", lang)}
              </span>
            </div>

            {/* Spanish message */}
            <label className="db-label">{t("smsTemplates.messageEs", lang)}</label>
            <textarea
              value={formBodyEs}
              onChange={(e) => setFormBodyEs(e.target.value.slice(0, 500))}
              placeholder={t("smsTemplates.messagePlaceholderEs", lang)}
              rows={4}
              className="db-input mb-1"
              style={{ resize: "vertical" }}
            />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: formBodyEs.length > 160 ? "var(--db-warning)" : "var(--db-text-muted)" }}>
                {formBodyEs.length}/500 &middot; {smsSegments(formBodyEs)} {t("smsTemplates.segmentLabel", lang)}
              </span>
            </div>

            {/* Variable hints */}
            <div
              className="rounded-lg p-3 mb-4"
              style={{ background: "var(--db-hover)" }}
            >
              <p className="text-xs font-medium mb-1.5" style={{ color: "var(--db-text-muted)" }}>
                {t("smsTemplates.variableHint", lang)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      // Insert into the last focused textarea (EN by default)
                      const activeEl = document.activeElement as HTMLTextAreaElement | null;
                      if (activeEl?.tagName === "TEXTAREA") {
                        const start = activeEl.selectionStart;
                        const end = activeEl.selectionEnd;
                        const val = activeEl.value;
                        const newVal = val.slice(0, start) + v + val.slice(end);
                        // Determine which field to update
                        if (activeEl.value === formBodyEs) {
                          setFormBodyEs(newVal.slice(0, 500));
                        } else {
                          setFormBodyEn(newVal.slice(0, 500));
                        }
                      }
                    }}
                    className="rounded px-1.5 py-0.5 text-[11px] font-mono font-medium transition-colors cursor-pointer"
                    style={{ background: "var(--db-accent-bg)", color: "var(--db-accent)" }}
                    title={t("smsTemplates.clickToInsert", lang)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={closeModal}>
                {t("action.cancel", lang)}
              </Button>
              <Button
                className="flex-1"
                disabled={!formName.trim() || !formBodyEn.trim() || !formBodyEs.trim() || saving}
                onClick={handleSave}
              >
                {saving
                  ? t("smsTemplates.saving", lang)
                  : editingTemplate
                    ? t("smsTemplates.saveChanges", lang)
                    : t("smsTemplates.create", lang)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={t("smsTemplates.deleteTitle", lang)}
        description={t("smsTemplates.deleteDescription", lang, { name: deleteTarget?.name ?? "" })}
        confirmLabel={t("action.delete", lang)}
        cancelLabel={t("action.cancel", lang)}
        loadingLabel={t("smsTemplates.deleting", lang)}
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
