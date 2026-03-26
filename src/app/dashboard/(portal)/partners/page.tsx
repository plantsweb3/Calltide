"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import LoadingSpinner from "@/app/dashboard/_components/loading-spinner";
import Button from "@/components/ui/button";
import ConfirmDialog from "@/components/confirm-dialog";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import { formatPhone } from "@/lib/format";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";
import { useReceptionistName } from "@/app/dashboard/_hooks/use-receptionist-name";

interface Partner {
  id: string;
  partnerName: string;
  partnerTrade: string;
  partnerPhone: string;
  partnerContactName: string | null;
  partnerEmail: string | null;
  language: string;
  relationship: string;
  notes: string | null;
  active: boolean;
  createdAt: string;
}

interface Referral {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerTrade: string;
  callerName: string | null;
  callerPhone: string | null;
  requestedTrade: string;
  jobDescription: string | null;
  referralMethod: string;
  partnerNotified: boolean;
  outcome: string;
  createdAt: string;
}

type Tab = "partners" | "referrals";

const TRADE_OPTIONS = [
  "hvac", "plumbing", "electrical", "roofing", "general_contractor",
  "restoration", "landscaping", "pest_control", "garage_door", "painting",
  "flooring", "concrete", "fencing", "windows", "insulation", "other",
];

const TRADE_LABELS: Record<string, string> = {
  hvac: "HVAC", plumbing: "Plumbing", electrical: "Electrical", roofing: "Roofing",
  general_contractor: "General Contracting", restoration: "Restoration",
  landscaping: "Landscaping", pest_control: "Pest Control", garage_door: "Garage Door",
  painting: "Painting", flooring: "Flooring", concrete: "Concrete",
  fencing: "Fencing", windows: "Windows & Doors", insulation: "Insulation", other: "Other",
};

const RELATIONSHIP_STYLES: Record<string, { bg: string; color: string }> = {
  preferred: { bg: "rgba(212,168,67,0.15)", color: "#D4A843" },
  trusted: { bg: "rgba(96,165,250,0.15)", color: "#60a5fa" },
  occasional: { bg: "rgba(148,163,184,0.15)", color: "var(--db-text-muted)" },
};

const OUTCOME_STYLES: Record<string, { bg: string; color: string }> = {
  pending: { bg: "rgba(148,163,184,0.15)", color: "var(--db-text-muted)" },
  connected: { bg: "var(--db-success-bg)", color: "var(--db-success)" },
  no_response: { bg: "var(--db-warning-bg)", color: "var(--db-warning)" },
  declined: { bg: "var(--db-danger-bg)", color: "var(--db-danger)" },
};

export default function PartnersPage() {
  const [lang] = useLang();
  const receptionistName = useReceptionistName();
  const [tab, setTab] = useState<Tab>("partners");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formTrade, setFormTrade] = useState("plumbing");
  const [formPhone, setFormPhone] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formLanguage, setFormLanguage] = useState("en");
  const [formRelationship, setFormRelationship] = useState("trusted");
  const [formNotes, setFormNotes] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [pRes, rRes] = await Promise.all([
        fetch("/api/dashboard/partners"),
        fetch("/api/dashboard/partners/referrals"),
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        setPartners(pData.partners || []);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        setReferrals(rData.referrals || []);
      }
    } catch {
      toast.error(t("toast.failedToLoadPartners", lang));
      return;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function resetForm() {
    setFormName("");
    setFormTrade("plumbing");
    setFormPhone("");
    setFormContact("");
    setFormEmail("");
    setFormLanguage("en");
    setFormRelationship("trusted");
    setFormNotes("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(p: Partner) {
    setFormName(p.partnerName);
    setFormTrade(p.partnerTrade);
    setFormPhone(p.partnerPhone);
    setFormContact(p.partnerContactName || "");
    setFormEmail(p.partnerEmail || "");
    setFormLanguage(p.language || "en");
    setFormRelationship(p.relationship);
    setFormNotes(p.notes || "");
    setEditingId(p.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formName.trim() || !formPhone.trim()) {
      toast.error(t("toast.namePhoneRequired", lang));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        partnerName: formName.trim(),
        partnerTrade: formTrade,
        partnerPhone: formPhone.trim(),
        partnerContactName: formContact.trim() || null,
        partnerEmail: formEmail.trim() || null,
        language: formLanguage,
        relationship: formRelationship,
        notes: formNotes.trim() || null,
      };

      const url = editingId
        ? `/api/dashboard/partners/${editingId}`
        : "/api/dashboard/partners";

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || t("toast.failedToSavePartner", lang));
        return;
      }

      toast.success(editingId ? t("toast.partnerUpdated", lang) : t("toast.partnerAdded", lang));
      resetForm();
      fetchData();
    } catch {
      toast.error(t("toast.failedToSavePartner", lang));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/dashboard/partners/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error(t("toast.failedToRemovePartner", lang));
        return;
      }
      toast.success(t("toast.partnerRemoved", lang));
      fetchData();
    } catch {
      toast.error(t("toast.failedToRemovePartner", lang));
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmId(null);
    }
  }

  if (loading) return <LoadingSpinner message={t("partners.loadingPartners", lang)} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("partners.title", lang)}
        description={t("partners.description", lang)}
        actions={
          tab === "partners" && !showForm ? (
            <Button onClick={() => setShowForm(true)}>+ {t("partners.addPartner", lang)}</Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--db-surface)" }}>
        {([
          { key: "partners" as Tab, label: t("partners.partners", lang), count: partners.length },
          { key: "referrals" as Tab, label: t("partners.referralLog", lang), count: referrals.length },
        ]).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors"
            style={{
              background: tab === key ? "var(--db-card)" : "transparent",
              color: tab === key ? "var(--db-text)" : "var(--db-text-muted)",
              boxShadow: tab === key ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Partners Tab */}
      {tab === "partners" && (
        <div className="space-y-4">
          {/* Add/Edit Form */}
          {showForm && (
            <div
              className="rounded-xl p-5 space-y-4"
              style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
            >
              <h3 className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
                {editingId ? t("partners.editPartner", lang) : t("partners.addNewPartner", lang)}
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="db-label">{t("partners.businessName", lang)} *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Rodriguez Plumbing"
                    className="db-input"
                  />
                </div>
                <div>
                  <label className="db-label">{t("partners.trade", lang)} *</label>
                  <select
                    value={formTrade}
                    onChange={(e) => setFormTrade(e.target.value)}
                    className="db-select"
                  >
                    {TRADE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{TRADE_LABELS[t] || t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="db-label">{t("partners.phone", lang)} *</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(210) 555-1234"
                    className="db-input"
                  />
                </div>
                <div>
                  <label className="db-label">{t("partners.contactName", lang)}</label>
                  <input
                    type="text"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="Carlos Rodriguez"
                    className="db-input"
                  />
                </div>
                <div>
                  <label className="db-label">{t("partners.email", lang)}</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="carlos@example.com"
                    className="db-input"
                  />
                </div>
                <div>
                  <label className="db-label">{t("partners.relationship", lang)}</label>
                  <select
                    value={formRelationship}
                    onChange={(e) => setFormRelationship(e.target.value)}
                    className="db-select"
                  >
                    <option value="preferred">{t("partners.preferred", lang)}</option>
                    <option value="trusted">{t("partners.trusted", lang)}</option>
                    <option value="occasional">{t("partners.occasional", lang)}</option>
                  </select>
                </div>
                <div>
                  <label className="db-label">{t("partners.language", lang)}</label>
                  <select
                    value={formLanguage}
                    onChange={(e) => setFormLanguage(e.target.value)}
                    className="db-select"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="db-label">{t("partners.notes", lang)}</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Fast response times, specializes in commercial..."
                  rows={2}
                  className="db-input"
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={resetForm}
                  className="rounded-lg px-4 py-2 text-sm"
                  style={{ color: "var(--db-text-muted)", border: "1px solid var(--db-border)" }}
                >
                  {t("action.cancel", lang)}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity"
                  style={{ background: "var(--db-accent)", color: "#fff", opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? t("action.loading", lang) : editingId ? t("action.save", lang) : t("partners.addPartner", lang)}
                </button>
              </div>
            </div>
          )}

          {/* Partner List */}
          {partners.length === 0 && !showForm ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
            >
              <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
                {t("partners.noPartnersYet", lang)}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {partners.map((p) => {
                const relStyle = RELATIONSHIP_STYLES[p.relationship] ?? RELATIONSHIP_STYLES.trusted;
                return (
                  <div
                    key={p.id}
                    className="rounded-xl p-4 flex items-start justify-between gap-4"
                    style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm" style={{ color: "var(--db-text)" }}>
                          {p.partnerName}
                        </span>
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ background: relStyle.bg, color: relStyle.color }}
                        >
                          {p.relationship}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
                        <span>{TRADE_LABELS[p.partnerTrade] || p.partnerTrade}</span>
                        <span>{formatPhone(p.partnerPhone)}</span>
                        {p.partnerContactName && <span>{p.partnerContactName}</span>}
                        {p.partnerEmail && <span>{p.partnerEmail}</span>}
                      </div>
                      {p.notes && (
                        <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>{p.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => startEdit(p)}
                      >
                        {t("action.edit", lang)}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteConfirmId(p.id)}
                      >
                        {t("action.remove", lang)}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Referrals Tab */}
      {tab === "referrals" && (
        <div>
          {referrals.length === 0 ? (
            <EmptyState
              icon={
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              }
              title={t("partners.noReferralsYet", lang)}
              description={t("partners.noReferralsDesc", lang)}
            />
          ) : (
            <div
              className="rounded-xl overflow-hidden overflow-x-auto"
              style={{ border: "1px solid var(--db-border)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--db-hover)" }}>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{t("partners.date", lang)}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{t("partners.caller", lang)}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{t("partners.trade", lang)}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{t("partners.partner", lang)}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>{t("partners.status", lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => {
                    const outcomeStyle = OUTCOME_STYLES[r.outcome] ?? OUTCOME_STYLES.pending;
                    return (
                      <tr key={r.id} className="db-table-row" style={{ borderTop: "1px solid var(--db-border)" }}>
                        <td className="px-4 py-3 tabular-nums whitespace-nowrap" style={{ color: "var(--db-text-secondary)" }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--db-text)" }}>
                          <div>{r.callerName || "Unknown"}</div>
                          {r.jobDescription && (
                            <div className="text-xs truncate max-w-[200px]" style={{ color: "var(--db-text-muted)" }}>
                              {r.jobDescription}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--db-text-secondary)" }}>
                          {TRADE_LABELS[r.requestedTrade] || r.requestedTrade}
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--db-text)" }}>
                          {r.partnerName}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ background: outcomeStyle.bg, color: outcomeStyle.color }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: outcomeStyle.color }} />
                            {r.outcome.replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirmId}
        title={t("partners.removePartner", lang)}
        description={t("partners.removePartnerDesc", lang)}
        confirmLabel={t("partners.removePartnerConfirm", lang)}
        variant="danger"
        loading={deleteLoading}
        onConfirm={() => { if (deleteConfirmId) handleDelete(deleteConfirmId); }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
