"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import LoadingSpinner from "@/app/dashboard/_components/loading-spinner";
import { CaptaSpinnerInline } from "@/components/capta-spinner";
import WebhookManager from "@/components/webhook-manager";
import { formatPhone } from "@/lib/format";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { useReceptionistName } from "@/app/dashboard/_hooks/use-receptionist-name";
import { t } from "@/lib/i18n/strings";
import type { Lang } from "@/lib/i18n/strings";

interface BusinessHourEntry {
  open: string;
  close: string;
  closed?: boolean;
}

interface SettingsData {
  name: string;
  type: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  twilioNumber: string;
  businessHours: Record<string, BusinessHourEntry>;
  services: string[];
  greeting: string | null;
  greetingEs: string | null;
  defaultLanguage: string;
  serviceArea: string | null;
  additionalInfo: string | null;
  personalityNotes: string | null;
  emergencyPhone: string | null;
  timezone: string;
  active: boolean;
  memberSince: string;
  receptionistName: string;
  personalityPreset: string;
  voiceId: string;
  enableWeeklyDigest: boolean;
  digestDeliveryMethod: string;
  enableDailySummary: boolean;
  digestPreference: string;
  digestTime: string;
  googleReviewUrl: string;
  enableReviewRequests: boolean;
  enableMissedCallRecovery: boolean;
  enableCustomerRecall: boolean;
  notifyOnEveryCall: boolean;
  notifyOnMissedOnly: boolean;
  ownerQuietHoursStart: string;
  ownerQuietHoursEnd: string;
  setupChecklistDismissed: boolean;
}

type SettingsTab = "general" | "receptionist" | "pricing" | "integrations";

const SETTINGS_TAB_KEYS: SettingsTab[] = [
  "general", "receptionist", "pricing", "integrations",
];

interface CustomResponse {
  id: string;
  businessId: string;
  category: string;
  triggerText: string;
  responseText: string | null;
  sortOrder: number;
  active: boolean;
}

const PERSONALITY_OPTIONS = [
  { key: "professional", labelKey: "settings.professional" as const, descKey: "settings.professionalDesc" as const, color: "#3B82F6", icon: "briefcase" },
  { key: "friendly", labelKey: "settings.friendly" as const, descKey: "settings.friendlyDesc" as const, color: "#10B981", icon: "smile" },
  { key: "warm", labelKey: "settings.warmCaring" as const, descKey: "settings.warmCaringDesc" as const, color: "#F59E0B", icon: "heart" },
] as const;

interface PricingEntry {
  id: string;
  serviceName: string;
  priceMin: number | null;
  priceMax: number | null;
  unit: string;
  description: string | null;
  isActive: boolean;
}

const DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAY_I18N_KEYS: Record<string, string> = {
  Mon: "day.monday", Tue: "day.tuesday", Wed: "day.wednesday", Thu: "day.thursday",
  Fri: "day.friday", Sat: "day.saturday", Sun: "day.sunday",
};

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of ["00", "30"]) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, "0")}:${m}`);
  }
}

function formatTime12(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${ampm}`;
}

interface FieldError {
  field: string;
  message: string;
}

function validateField(field: string, value: string, lang: Lang): string | null {
  switch (field) {
    case "name":
    case "ownerName":
      if (!value.trim()) return t("settings.validation.required", lang);
      if (value.length > 100) return t("settings.validation.max100", lang);
      return null;
    case "ownerEmail":
      if (!value.trim()) return t("settings.validation.emailRequired", lang);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t("settings.validation.invalidEmail", lang);
      return null;
    case "ownerPhone":
    case "emergencyPhone":
      if (field === "ownerPhone" && !value.trim()) return t("settings.validation.phoneRequired", lang);
      if (value.trim() && !/^\+?1?\d{10,11}$/.test(value.replace(/\D/g, ""))) return t("settings.validation.invalidPhone", lang);
      return null;
    case "serviceArea":
      if (value.length > 200) return t("settings.validation.max200", lang);
      return null;
    case "additionalInfo":
      if (value.length > 1000) return t("settings.validation.max1000", lang);
      return null;
    case "greeting":
    case "greetingEs":
      if (value.length > 500) return t("settings.validation.max500", lang);
      return null;
    default:
      return null;
  }
}

function VoicePreviewButton({ voiceId, name, greeting, lang }: { voiceId: string; name: string; greeting: string | null; lang: Lang }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    try {
      const res = await fetch("/api/setup/greeting-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId, text: greeting || `Hi, thank you for calling! This is a preview of the ${name} voice.` }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setPlaying(false); URL.revokeObjectURL(url); };
      audio.play();
    } catch {
      setPlaying(false);
    }
  };

  return (
    <button onClick={play} className="mt-1 text-xs font-medium transition-colors" style={{ color: playing ? "#D4A843" : "var(--db-text-muted)" }}>
      {playing ? t("settings.stop", lang) : t("settings.preview", lang)}
    </button>
  );
}

export default function SettingsPage() {
  const [lang] = useLang();
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as SettingsTab;
      if (SETTINGS_TAB_KEYS.includes(hash)) return hash;
    }
    return "general";
  });
  const [data, setData] = useState<SettingsData | null>(null);
  const [initialData, setInitialData] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [newService, setNewService] = useState("");
  const [showGreetingPreview, setShowGreetingPreview] = useState(false);

  // Custom responses state
  const [customResponses, setCustomResponses] = useState<Record<string, CustomResponse[]>>({ faq: [], off_limits: [], phrase: [], emergency_keyword: [] });
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [newResponse, setNewResponse] = useState<{ category: string; triggerText: string; responseText: string } | null>(null);

  // Pricing state
  const [pricingEnabled, setPricingEnabled] = useState(false);
  const [pricing, setPricing] = useState<PricingEntry[]>([]);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceData, setEditingPriceData] = useState<{ serviceName: string; priceMin: string; priceMax: string; unit: string }>({ serviceName: "", priceMin: "", priceMax: "", unit: "per_job" });
  const [newPriceRow, setNewPriceRow] = useState<{ serviceName: string; priceMin: string; priceMax: string; unit: string } | null>(null);
  const [confirmDeletePriceId, setConfirmDeletePriceId] = useState<string | null>(null);

  // Estimate pricing state
  const [estimateMode, setEstimateMode] = useState<"quick" | "advanced" | "both">("quick");
  const [estimateRanges, setEstimateRanges] = useState<Array<{
    id: string; mode: string; jobTypeKey: string; jobTypeLabel: string; jobTypeLabelEs?: string | null;
    tradeType: string; scopeLevel: string; minPrice: number | null; maxPrice: number | null;
    unit: string; formulaJson?: unknown; sortOrder: number;
  }>>([]);
  const [estimateRangesLoading, setEstimateRangesLoading] = useState(true);
  const [newEstimateRow, setNewEstimateRow] = useState<{ jobTypeLabel: string; minPrice: string; maxPrice: string; unit: string } | null>(null);
  const [advancedFormula, setAdvancedFormula] = useState<{
    jobTypeLabel: string; baseRate: string; baseUnit: string; baseUnitVariable: string;
    additionalRates: Array<{ rate: string; unit: string; variable: string; label: string }>;
    multipliers: Array<{ label: string; value: string; condition: string }>;
    marginLow: string; marginHigh: string;
  } | null>(null);
  const [confirmDeleteEstimateId, setConfirmDeleteEstimateId] = useState<string | null>(null);

  const loadSettings = useCallback(() => {
    setError(null);
    fetch("/api/dashboard/settings")
      .then((r) => {
        if (!r.ok) throw new Error(t("settings.failedLoad", lang));
        return r.json();
      })
      .then((d: SettingsData) => {
        setData(d);
        setInitialData(JSON.stringify(d));
      })
      .catch(() => setError(t("settings.failedLoad", lang)));

    fetch("/api/dashboard/pricing")
      .then((r) => r.ok ? r.json() : { pricing: [] })
      .then((d) => {
        setPricing(d.pricing || []);
        setPricingEnabled(d.pricing?.length > 0);
      })
      .catch(() => setPricing([]))
      .finally(() => setPricingLoading(false));

    fetch("/api/dashboard/estimate-pricing")
      .then((r) => r.ok ? r.json() : { ranges: [], mode: "quick" })
      .then((d) => {
        setEstimateRanges(d.ranges || []);
        if (d.mode) setEstimateMode(d.mode);
      })
      .catch(() => setEstimateRanges([]))
      .finally(() => setEstimateRangesLoading(false));

    fetch("/api/receptionist/responses")
      .then((r) => r.ok ? r.json() : { responses: {} })
      .then((d) => setCustomResponses(d.responses || {}))
      .catch(() => {});
  }, [lang]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // Sync tab with URL hash
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "") as SettingsTab;
      if (SETTINGS_TAB_KEYS.includes(hash)) setActiveTab(hash);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const switchTab = useCallback((tab: SettingsTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  }, []);

  const isDirty = data ? JSON.stringify(data) !== initialData : false;

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const setField = useCallback(<K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setData((prev) => prev ? { ...prev, [key]: value } : prev);
    setSuccessMsg(null);
    if (typeof value === "string") {
      const err = validateField(key, value, lang);
      if (!err) {
        setFieldErrors((prev) => prev.filter((e) => e.field !== key));
      }
    }
  }, [lang]);

  const handleBlur = useCallback((field: string, value: string) => {
    const err = validateField(field, value, lang);
    setFieldErrors((prev) => {
      const filtered = prev.filter((e) => e.field !== field);
      if (err) filtered.push({ field, message: err });
      return filtered;
    });
  }, [lang]);

  const getFieldError = useCallback((field: string) => {
    return fieldErrors.find((e) => e.field === field)?.message;
  }, [fieldErrors]);

  const handleSave = async () => {
    if (!data || saving) return;

    // Validate all fields
    const errors: FieldError[] = [];
    for (const [field, val] of Object.entries({
      name: data.name, ownerName: data.ownerName, ownerEmail: data.ownerEmail || "",
      ownerPhone: data.ownerPhone, emergencyPhone: data.emergencyPhone || "",
      serviceArea: data.serviceArea || "", additionalInfo: data.additionalInfo || "",
      greeting: data.greeting || "", greetingEs: data.greetingEs || "",
    })) {
      const err = validateField(field, val, lang);
      if (err) errors.push({ field, message: err });
    }

    if (errors.length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Normalize phone numbers — strip formatting for API
      const phoneDigits = (p: string) => p.replace(/\D/g, "");

      const payload = {
        name: data.name,
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        ownerPhone: phoneDigits(data.ownerPhone),
        businessHours: data.businessHours,
        services: data.services,
        greeting: data.greeting || "",
        greetingEs: data.greetingEs || "",
        defaultLanguage: data.defaultLanguage,
        emergencyPhone: data.emergencyPhone ? phoneDigits(data.emergencyPhone) : "",
        serviceArea: data.serviceArea || "",
        additionalInfo: data.additionalInfo || "",
        personalityNotes: data.personalityNotes || "",
        receptionistName: data.receptionistName || "Maria",
        personalityPreset: data.personalityPreset || "friendly",
        voiceId: data.voiceId || "sarah",
        enableWeeklyDigest: data.enableWeeklyDigest,
        digestDeliveryMethod: data.digestDeliveryMethod,
        enableDailySummary: data.enableDailySummary,
        digestPreference: data.digestPreference || "sms",
        digestTime: data.digestTime || "18:00",
        googleReviewUrl: data.googleReviewUrl || "",
        enableReviewRequests: data.enableReviewRequests,
        enableMissedCallRecovery: data.enableMissedCallRecovery,
        enableCustomerRecall: data.enableCustomerRecall,
        notifyOnEveryCall: data.notifyOnEveryCall,
        notifyOnMissedOnly: data.notifyOnMissedOnly,
        ownerQuietHoursStart: data.ownerQuietHoursStart,
        ownerQuietHoursEnd: data.ownerQuietHoursEnd,
        setupChecklistDismissed: data.setupChecklistDismissed,
      };

      const res = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || t("settings.failedSave", lang));
      }

      const updated: SettingsData = await res.json();
      setData(updated);
      setInitialData(JSON.stringify(updated));
      setSuccessMsg(t("settings.savedSuccess", lang));
      toast.success(t("settings.savedToast", lang));
      setFieldErrors([]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("settings.failedSave", lang);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const addService = () => {
    if (!data || !newService.trim()) return;
    if (data.services.length >= 20) return;
    if (data.services.includes(newService.trim())) {
      setNewService("");
      return;
    }
    setField("services", [...data.services, newService.trim()]);
    setNewService("");
  };

  const removeService = (index: number) => {
    if (!data) return;
    setField("services", data.services.filter((_, i) => i !== index));
  };

  const updateHours = (day: string, field: "open" | "close", value: string) => {
    if (!data) return;
    const current = data.businessHours[day] || { open: "08:00", close: "17:00" };
    setField("businessHours", {
      ...data.businessHours,
      [day]: { ...current, [field]: value, closed: false },
    });
  };

  const toggleDayClosed = (day: string) => {
    if (!data) return;
    const current = data.businessHours[day];
    const isClosed = current?.closed || !current;
    setField("businessHours", {
      ...data.businessHours,
      [day]: isClosed
        ? { open: "08:00", close: "17:00", closed: false }
        : { open: "00:00", close: "00:00", closed: true },
    });
  };

  if (error && !data) {
    return (
      <div className="rounded-xl p-4 flex items-center justify-between" role="alert" aria-live="assertive" style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)" }}>
        <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
        <button
          onClick={loadSettings}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}
        >
          {t("action.retry", lang)}
        </button>
      </div>
    );
  }

  if (!data) return <LoadingSpinner message={t("settings.loadingSettings", lang)} />;

  const rName = data.receptionistName || "Maria";
  const defaultGreeting = `Thank you for calling ${data.name}, this is ${rName}. How can I help you?`;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--db-text)" }}
          >
            {t("settings.title", lang)}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
            {t("settings.subtitle", lang, { name: rName })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <span style={{ color: "var(--db-warning)", fontSize: 13 }}>
              {lang === "es" ? "Cambios sin guardar" : "Unsaved changes"}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="rounded-lg px-5 py-2.5 text-sm font-medium transition-all"
            style={{
              background: isDirty ? "var(--db-accent)" : "var(--db-hover)",
              color: isDirty ? "#fff" : "var(--db-text-muted)",
              cursor: isDirty && !saving ? "pointer" : "not-allowed",
              opacity: isDirty ? 1 : 0.6,
            }}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <CaptaSpinnerInline size={16} />
                {t("settings.saving", lang)}
              </span>
            ) : (
              t("settings.save", lang)
            )}
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div
          className="rounded-xl p-4 flex items-center gap-2"
          style={{ background: "var(--db-success-bg)", border: "1px solid var(--db-success)" }}
        >
          <span style={{ color: "var(--db-success)" }}>&#10003;</span>
          <p className="text-sm font-medium" style={{ color: "var(--db-success)" }}>{successMsg}</p>
        </div>
      )}

      {/* Error Banner */}
      {error && data && (
        <div
          className="rounded-xl p-4 flex items-center gap-2"
          role="alert"
          aria-live="assertive"
          style={{ background: "var(--db-danger-bg)", border: "1px solid var(--db-danger)" }}
        >
          <p className="text-sm" style={{ color: "var(--db-danger)" }}>{error}</p>
        </div>
      )}

      {/* AI Status Banner */}
      <div
        className="flex items-center gap-3 rounded-xl p-4"
        style={{
          background: data.active ? "var(--db-success-bg)" : "var(--db-danger-bg)",
          border: `1px solid ${data.active ? "var(--db-success)" : "var(--db-danger)"}`,
        }}
      >
        <span className="relative flex h-3 w-3">
          {data.active && (
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ background: "var(--db-success)" }}
            />
          )}
          <span
            className="relative inline-flex h-3 w-3 rounded-full"
            style={{ background: data.active ? "var(--db-success)" : "var(--db-danger)" }}
          />
        </span>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
            {rName} — {data.active ? t("settings.activeStatus", lang) : t("settings.inactiveStatus", lang)}
          </p>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {data.active ? t("settings.answering247", lang, { name: rName }) : t("settings.contactSupport", lang)}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="flex gap-1 overflow-x-auto"
      >
        {SETTINGS_TAB_KEYS.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => switchTab(tabKey)}
            className="db-tab"
            data-active={activeTab === tabKey}
          >
            {t(`settings.tab.${tabKey}`, lang)}
          </button>
        ))}
      </div>

      {/* ═══ GENERAL TAB ═══ */}
      {activeTab === "general" && <>

      {/* ── Section: Business Information ── */}
      <Card title={t("settings.businessInfo", lang)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label={t("settings.businessName", lang)}
            value={data.name}
            onChange={(v) => setField("name", v)}
            onBlur={() => handleBlur("name", data.name)}
            error={getFieldError("name")}
            required
          />
          <div>
            <label className="db-label">
              {t("settings.industry", lang)}
            </label>
            <div
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                background: "var(--db-hover)",
                border: "1px solid var(--db-border)",
                color: "var(--db-text-muted)",
              }}
            >
              {data.type}
              <span className="ml-2 text-xs opacity-60">{t("settings.readOnly", lang)}</span>
            </div>
          </div>
          <InputField
            label={t("settings.serviceArea", lang)}
            value={data.serviceArea || ""}
            onChange={(v) => setField("serviceArea", v || null)}
            onBlur={() => handleBlur("serviceArea", data.serviceArea || "")}
            error={getFieldError("serviceArea")}
            placeholder={t("settings.placeholder.serviceArea", lang)}
          />
          <div>
            <label className="db-label">
              {t("settings.aiPhoneNumber", lang)}
            </label>
            <div
              className="rounded-lg px-3 py-2 text-sm font-medium"
              style={{
                background: "var(--db-hover)",
                border: "1px solid var(--db-border)",
                color: "var(--db-accent)",
              }}
            >
              {formatPhone(data.twilioNumber)}
              <span className="ml-2 text-xs opacity-60" style={{ color: "var(--db-text-muted)" }}>{t("settings.managedByCapta", lang)}</span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="db-label">
              {t("settings.businessDescription", lang)}
            </label>
            <textarea
              value={data.additionalInfo || ""}
              onChange={(e) => setField("additionalInfo", e.target.value || null)}
              onBlur={() => handleBlur("additionalInfo", data.additionalInfo || "")}
              rows={3}
              maxLength={1000}
              placeholder={t("settings.descriptionPlaceholder", lang)}
              className="db-input w-full resize-none"
              style={getFieldError("additionalInfo") ? { borderColor: "var(--db-danger)" } : undefined}
            />
            <div className="flex justify-between mt-1">
              {getFieldError("additionalInfo") && (
                <span className="text-xs" style={{ color: "var(--db-danger)" }}>{getFieldError("additionalInfo")}</span>
              )}
              <span className="text-xs ml-auto" style={{ color: "var(--db-text-muted)" }}>
                {(data.additionalInfo || "").length}/1000
              </span>
            </div>
          </div>
        </div>
      </Card>

      </>}

      {/* ═══ RECEPTIONIST TAB ═══ */}
      {activeTab === "receptionist" && <>

      {/* ── Section: Your Receptionist ── */}
      <Card title={t("settings.yourReceptionist", lang)}>
        <div className="space-y-4">
          <InputField
            label={t("settings.receptionistNameField", lang)}
            value={data.receptionistName || "Maria"}
            onChange={(v) => {
              const val = v.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑüÜ\s]/g, "");
              if (val.length <= 20) setField("receptionistName", val);
            }}
            placeholder="Maria"
          />
          <div>
            <label className="db-label">
              {t("settings.personality", lang)}
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {PERSONALITY_OPTIONS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setField("personalityPreset", p.key)}
                  className="flex flex-col items-center rounded-lg p-3 text-center transition-all"
                  style={{
                    border: `2px solid ${data.personalityPreset === p.key ? p.color : "var(--db-border)"}`,
                    background: data.personalityPreset === p.key ? `${p.color}08` : "var(--db-bg)",
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>{t(p.labelKey, lang)}</p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--db-text-muted)" }}>{t(p.descKey, lang)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Section: Voice ── */}
      <Card title={t("settings.voiceTitle", lang, { name: rName })}>
        <p className="text-sm mb-3" style={{ color: "var(--db-text-muted)" }}>
          {t("settings.voiceDesc", lang, { name: rName })}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", descKey: "settings.voiceProfessional" },
            { id: "jBpfAFnaylXS5xpurlZD", name: "Lily", descKey: "settings.voiceFriendly" },
            { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", descKey: "settings.voiceWarm" },
            { id: "pFZP5JQG7iQjIQuC4Bku", name: "Rachel", descKey: "settings.voiceClear" },
          ].map((voice) => (
            <div key={voice.id} className="flex flex-col">
              <button
                onClick={() => {
                  setField("voiceId", voice.id);
                  handleBlur("voiceId", voice.id);
                }}
                className="flex flex-col items-center rounded-lg p-3 text-center transition-all"
                style={{
                  border: `2px solid ${data.voiceId === voice.id ? "#D4A843" : "var(--db-border)"}`,
                  background: data.voiceId === voice.id ? "rgba(212,168,67,0.08)" : "var(--db-bg)",
                }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>{voice.name}</p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--db-text-muted)" }}>{t(voice.descKey, lang)}</p>
              </button>
              <VoicePreviewButton voiceId={voice.id} name={voice.name} greeting={data.greeting} lang={lang} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
          {t("settings.voiceChanges", lang)}
        </p>
      </Card>

      {/* ── Section: Special Instructions ── */}
      <Card title={t("settings.specialInstructionsTitle", lang, { name: rName })}>
        <p className="text-sm mb-3" style={{ color: "var(--db-text-muted)" }}>
          {t("settings.specialInstructionsDesc", lang, { name: rName })}
        </p>
        <textarea
          value={data.personalityNotes || ""}
          onChange={(e) => setField("personalityNotes", e.target.value || null)}
          onBlur={() => handleBlur("personalityNotes", data.personalityNotes || "")}
          rows={4}
          maxLength={1000}
          placeholder={t("settings.specialInstructionsPlaceholder", lang)}
          className="db-input w-full resize-none"
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {(data.personalityNotes || "").length}/1000
          </span>
        </div>
      </Card>

      </>}

      {/* ═══ GENERAL TAB (Owner Contact + Security) ═══ */}
      {activeTab === "general" && <>

      {/* ── Section: Owner Contact ── */}
      <Card title={t("settings.ownerContact", lang)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label={t("settings.ownerName", lang)}
            value={data.ownerName}
            onChange={(v) => setField("ownerName", v)}
            onBlur={() => handleBlur("ownerName", data.ownerName)}
            error={getFieldError("ownerName")}
            required
          />
          <InputField
            label={t("settings.ownerEmail", lang)}
            type="email"
            value={data.ownerEmail || ""}
            onChange={(v) => setField("ownerEmail", v)}
            onBlur={() => handleBlur("ownerEmail", data.ownerEmail || "")}
            error={getFieldError("ownerEmail")}
            required
          />
          <InputField
            label={t("settings.ownerPhone", lang)}
            value={data.ownerPhone}
            onChange={(v) => setField("ownerPhone", v)}
            onBlur={() => handleBlur("ownerPhone", data.ownerPhone)}
            error={getFieldError("ownerPhone")}
            placeholder="+15125551234"
            required
          />
        </div>
      </Card>

      {/* ── Section: Security ── */}
      <SecuritySection lang={lang} />

      {/* ── Section: Weekly Digest ── */}
      <Card title={t("settings.weeklyDigest", lang)}>
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {t("settings.weeklyDigestLong", lang)}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                {t("settings.weeklyDigestEnable", lang)}
              </p>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{t("settings.weeklyDigestDesc", lang)}</p>
            </div>
            <ToggleSwitch
              checked={data.enableWeeklyDigest}
              onChange={(v) => setData({ ...data, enableWeeklyDigest: v })}
            />
          </div>
          {data.enableWeeklyDigest && (
            <div>
              <label className="db-label">
                {t("settings.deliveryMethod", lang)}
              </label>
              <div className="flex gap-2">
                {[
                  { value: "both", labelKey: "settings.emailPlusSms" },
                  { value: "email", labelKey: "settings.emailOnly" },
                  { value: "sms", labelKey: "settings.smsOnly" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setData({ ...data, digestDeliveryMethod: opt.value })}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    style={
                      data.digestDeliveryMethod === opt.value
                        ? { background: "rgba(212,168,67,0.15)", color: "var(--db-accent)", border: "1px solid rgba(212,168,67,0.3)" }
                        : { background: "var(--db-hover)", color: "var(--db-text-muted)", border: "1px solid var(--db-border)" }
                    }
                  >
                    {t(opt.labelKey, lang)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Section: Daily Report ── */}
      <Card title={t("settings.dailyReport", lang)}>
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {t("settings.dailySummaryDesc", lang, { name: data.receptionistName || "Maria" })}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                {t("settings.enableDailySummary", lang)}
              </p>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{t("settings.dailySummarySubDesc", lang)}</p>
            </div>
            <ToggleSwitch
              checked={data.enableDailySummary}
              onChange={(v) => setData({ ...data, enableDailySummary: v })}
            />
          </div>
          {data.enableDailySummary && (
            <>
              <div>
                <label className="db-label">
                  {t("settings.howReceiveDaily", lang)}
                </label>
                <div className="flex gap-2">
                  {[
                    { value: "sms", labelKey: "settings.textMessage" },
                    { value: "email", labelKey: "misc.email" },
                    { value: "both", labelKey: "settings.both" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setData({ ...data, digestPreference: opt.value })}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                      style={
                        data.digestPreference === opt.value
                          ? { background: "rgba(212,168,67,0.15)", color: "var(--db-accent)", border: "1px solid rgba(212,168,67,0.3)" }
                          : { background: "var(--db-hover)", color: "var(--db-text-muted)", border: "1px solid var(--db-border)" }
                      }
                    >
                      {t(opt.labelKey, lang)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="db-label">
                  {t("settings.deliveryTime", lang)}
                </label>
                <select
                  value={data.digestTime}
                  onChange={(e) => setData({ ...data, digestTime: e.target.value })}
                  className="db-select"
                  style={{ width: "auto" }}
                >
                  {["17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"].map((t) => (
                    <option key={t} value={t}>{formatTime12(t)}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* ── Section: Automations ── */}
      <Card title={t("settings.automatedFeatures", lang)}>
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {t("settings.automatedFeaturesDesc", lang)}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{t("settings.googleReviewRequestsLabel", lang)}</p>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{t("settings.googleReviewRequestsDesc", lang)}</p>
            </div>
            <ToggleSwitch checked={data.enableReviewRequests} onChange={(v) => setField("enableReviewRequests", v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{t("settings.missedCallRecoveryLabel", lang)}</p>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{t("settings.missedCallRecoveryDesc", lang)}</p>
            </div>
            <ToggleSwitch checked={data.enableMissedCallRecovery} onChange={(v) => setField("enableMissedCallRecovery", v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{t("settings.customerRecall", lang)}</p>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{t("settings.customerRecallDesc", lang)}</p>
            </div>
            <ToggleSwitch checked={data.enableCustomerRecall} onChange={(v) => setField("enableCustomerRecall", v)} />
          </div>
        </div>
      </Card>

      {/* ── Section: Call Notifications ── */}
      <Card title={t("settings.callNotifications", lang)}>
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {t("settings.callNotificationsDesc", lang)}
          </p>
          <div className="space-y-3">
            <label
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
              style={{
                background: data.notifyOnEveryCall ? "rgba(212,168,67,0.06)" : "var(--db-bg)",
                border: `1px solid ${data.notifyOnEveryCall ? "rgba(212,168,67,0.25)" : "var(--db-border)"}`,
              }}
            >
              <input
                type="radio"
                name="callNotify"
                checked={data.notifyOnEveryCall}
                onChange={() => {
                  setField("notifyOnEveryCall", true);
                  setField("notifyOnMissedOnly", false);
                }}
                className="sr-only"
              />
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{
                  border: `2px solid ${data.notifyOnEveryCall ? "var(--db-accent)" : "var(--db-border)"}`,
                }}
              >
                {data.notifyOnEveryCall && (
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--db-accent)" }} />
                )}
              </span>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{t("settings.everyCall", lang)}</p>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{t("settings.everyCallDesc", lang)}</p>
              </div>
            </label>

            <label
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
              style={{
                background: data.notifyOnMissedOnly ? "rgba(212,168,67,0.06)" : "var(--db-bg)",
                border: `1px solid ${data.notifyOnMissedOnly ? "rgba(212,168,67,0.25)" : "var(--db-border)"}`,
              }}
            >
              <input
                type="radio"
                name="callNotify"
                checked={data.notifyOnMissedOnly}
                onChange={() => {
                  setField("notifyOnMissedOnly", true);
                  setField("notifyOnEveryCall", false);
                }}
                className="sr-only"
              />
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{
                  border: `2px solid ${data.notifyOnMissedOnly ? "var(--db-accent)" : "var(--db-border)"}`,
                }}
              >
                {data.notifyOnMissedOnly && (
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--db-accent)" }} />
                )}
              </span>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{t("settings.missedCallsOnly", lang)}</p>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{t("settings.missedCallsOnlyDesc", lang)}</p>
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* ── Section: Quiet Hours ── */}
      <Card title={t("settings.quietHours", lang)}>
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {t("settings.quietHoursDesc", lang)}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="db-label">{t("settings.quietHoursStart", lang)}</label>
              <select
                value={data.ownerQuietHoursStart}
                onChange={(e) => setField("ownerQuietHoursStart", e.target.value)}
                className="db-select"
              >
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{formatTime12(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="db-label">{t("settings.quietHoursEnd", lang)}</label>
              <select
                value={data.ownerQuietHoursEnd}
                onChange={(e) => setField("ownerQuietHoursEnd", e.target.value)}
                className="db-select"
              >
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{formatTime12(t)}</option>)}
              </select>
            </div>
          </div>
          <div
            className="rounded-lg p-3"
            style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)" }}
          >
            <p className="text-xs font-medium" style={{ color: "var(--db-text)" }}>
              {t("settings.currentWindow", lang)} {formatTime12(data.ownerQuietHoursStart)} &mdash; {formatTime12(data.ownerQuietHoursEnd)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
              {t("settings.quietHoursNote", lang, { name: data.receptionistName || "Maria" })}
            </p>
          </div>
        </div>
      </Card>

      </>}

      {/* ═══ INTEGRATIONS TAB (Automations) ═══ */}
      {activeTab === "integrations" && <>

      {/* ── Section: Google Review Requests ── */}
      <Card title={t("settings.googleReviewRequests", lang)}>
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {t("settings.googleReviewAutoDesc", lang)}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                {t("settings.enableReviewRequests", lang)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setData({ ...data, enableReviewRequests: !data.enableReviewRequests });
              }}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{ background: data.enableReviewRequests ? "var(--db-accent)" : "var(--db-border)" }}
            >
              <span
                className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
                style={{ transform: data.enableReviewRequests ? "translateX(22px)" : "translateX(4px)" }}
              />
            </button>
          </div>
          {data.enableReviewRequests && (
            <div>
              <label className="db-label">
                {t("settings.googleReviewUrl", lang)}
              </label>
              <input
                type="url"
                value={data.googleReviewUrl || ""}
                onChange={(e) => setData({ ...data, googleReviewUrl: e.target.value })}
                placeholder="https://g.page/r/your-business/review"
                className="db-input"
              />
              <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
                {t("settings.googleReviewUrlHint", lang)}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* ── Section: Missed Call Recovery ── */}
      <Card title={t("settings.missedCallRecovery", lang)}>
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {t("settings.missedCallRecoveryAutoDesc", lang)}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                {t("settings.enableMissedCallRecovery", lang)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setData({ ...data, enableMissedCallRecovery: !data.enableMissedCallRecovery });
              }}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{ background: data.enableMissedCallRecovery ? "var(--db-accent)" : "var(--db-border)" }}
            >
              <span
                className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
                style={{ transform: data.enableMissedCallRecovery ? "translateX(22px)" : "translateX(4px)" }}
              />
            </button>
          </div>
        </div>
      </Card>

      </>}

      {/* ═══ GENERAL TAB (Business Hours + Services) ═══ */}
      {activeTab === "general" && <>

      {/* ── Section: Business Hours ── */}
      <Card title={t("settings.businessHours", lang)}>
        <div className="space-y-3">
          {DAY_KEYS.map((day) => {
            const hours = data.businessHours[day];
            const isClosed = !hours || hours.closed;
            return (
              <div key={day} className="flex items-center gap-3 py-1">
                <span className="text-sm font-medium w-24 shrink-0" style={{ color: "var(--db-text)" }}>
                  {t(DAY_I18N_KEYS[day], lang)}
                </span>
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  {!isClosed ? (
                    <>
                      <select
                        value={hours?.open || "08:00"}
                        onChange={(e) => updateHours(day, "open", e.target.value)}
                        className="db-select text-sm"
                        style={{ width: "auto", padding: "0.375rem 2rem 0.375rem 0.5rem" }}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{formatTime12(t)}</option>
                        ))}
                      </select>
                      <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{t("settings.to", lang)}</span>
                      <select
                        value={hours?.close || "17:00"}
                        onChange={(e) => updateHours(day, "close", e.target.value)}
                        className="db-select text-sm"
                        style={{ width: "auto", padding: "0.375rem 2rem 0.375rem 0.5rem" }}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{formatTime12(t)}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>{t("settings.closed", lang)}</span>
                  )}
                </div>
                <button
                  onClick={() => toggleDayClosed(day)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0"
                  style={{
                    background: isClosed ? "var(--db-danger-bg)" : "var(--db-success-bg)",
                    color: isClosed ? "var(--db-danger)" : "var(--db-success)",
                    border: `1px solid ${isClosed ? "var(--db-danger)" : "var(--db-success)"}`,
                  }}
                >
                  {isClosed ? t("settings.closed", lang) : t("settings.open", lang)}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--db-text-muted)" }}>
          {t("settings.hoursScheduleNote", lang, { name: rName })}
        </p>
      </Card>

      {/* ── Section: Services ── */}
      <Card title={t("settings.servicesCanBook", lang)}>
        <div className="flex flex-wrap gap-2 mb-3">
          {data.services.map((service, i) => (
            <span
              key={`${service}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{
                background: "var(--db-hover)",
                color: "var(--db-text-secondary)",
                border: "1px solid var(--db-border)",
              }}
            >
              {service}
              <button
                onClick={() => removeService(i)}
                className="ml-1 hover:opacity-100 opacity-50 transition-opacity"
                style={{ color: "var(--db-danger)" }}
                title={t("settings.removeService", lang)}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        {data.services.length < 20 && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addService(); } }}
              placeholder={t("settings.addServicePlaceholder", lang)}
              maxLength={50}
              className="db-input flex-1"
              style={{ width: "auto" }}
            />
            <button
              onClick={addService}
              disabled={!newService.trim()}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: newService.trim() ? "var(--db-accent)" : "var(--db-hover)",
                color: newService.trim() ? "#fff" : "var(--db-text-muted)",
              }}
            >
              {t("action.add", lang)}
            </button>
          </div>
        )}
        <p className="mt-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
          {t("settings.servicesCount", lang, { n: data.services.length })}
        </p>
      </Card>

      </>}

      {/* ═══ INTEGRATIONS TAB (Service Pricing) ═══ */}
      {activeTab === "integrations" && <>

      {/* ── Section: Service Pricing ── */}
      <Card title={t("settings.servicePricing", lang)}>
        <div className="space-y-4">
          {/* Master toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                {t("settings.enablePricingDiscuss", lang, { name: rName })}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
                {t("settings.enablePricingDiscussDesc", lang, { name: rName })}
              </p>
            </div>
            <button
              onClick={async () => {
                const newVal = !pricingEnabled;
                setPricingEnabled(newVal);
                try {
                  await fetch("/api/dashboard/pricing/toggle", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ enabled: newVal }),
                  });
                  toast.success(newVal ? t("settings.toast.pricingEnabled", lang) : t("settings.toast.pricingDisabled", lang));
                } catch {
                  setPricingEnabled(!newVal);
                  toast.error(t("settings.toast.failedTogglePricing", lang));
                }
              }}
              className={`relative w-11 h-6 rounded-full transition-colors ${pricingEnabled ? "" : ""}`}
              style={{ background: pricingEnabled ? "var(--db-accent)" : "var(--db-border)" }}
            >
              <div
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                style={{ transform: pricingEnabled ? "translateX(20px)" : "translateX(0)" }}
              />
            </button>
          </div>

          {pricingEnabled && (
            <>
              {/* Pricing table */}
              {pricingLoading ? (
                <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>{t("settings.loadingPricing", lang)}</p>
              ) : (
                <div className="space-y-2">
                  {pricing.map((p) => (
                    <div
                      key={p.id}
                      className="db-table-row flex flex-wrap items-center gap-2 rounded-lg p-3"
                      style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)" }}
                    >
                      {editingPriceId === p.id ? (
                        <>
                          <input
                            type="text"
                            value={editingPriceData.serviceName}
                            onChange={(e) => setEditingPriceData((d) => ({ ...d, serviceName: e.target.value }))}
                            className="db-input flex-1 min-w-[120px] rounded px-2 py-1 text-sm"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>$</span>
                            <input
                              type="number"
                              value={editingPriceData.priceMin}
                              onChange={(e) => setEditingPriceData((d) => ({ ...d, priceMin: e.target.value }))}
                              className="db-input w-20 rounded px-2 py-1 text-sm"
                              placeholder="Min"
                            />
                            <span style={{ color: "var(--db-text-muted)" }}>—</span>
                            <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>$</span>
                            <input
                              type="number"
                              value={editingPriceData.priceMax}
                              onChange={(e) => setEditingPriceData((d) => ({ ...d, priceMax: e.target.value }))}
                              className="db-input w-20 rounded px-2 py-1 text-sm"
                              placeholder="Max"
                            />
                          </div>
                          <select
                            value={editingPriceData.unit}
                            onChange={(e) => setEditingPriceData((d) => ({ ...d, unit: e.target.value }))}
                            className="db-select rounded px-2 py-1 text-xs"
                          >
                            <option value="per_job">{t("settings.perJob", lang)}</option>
                            <option value="per_hour">{t("settings.perHour", lang)}</option>
                            <option value="per_sqft">{t("settings.perSqft", lang)}</option>
                            <option value="per_unit">{t("settings.perUnit", lang)}</option>
                          </select>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/dashboard/pricing/${p.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    serviceName: editingPriceData.serviceName,
                                    priceMin: editingPriceData.priceMin ? parseFloat(editingPriceData.priceMin) : null,
                                    priceMax: editingPriceData.priceMax ? parseFloat(editingPriceData.priceMax) : null,
                                    unit: editingPriceData.unit,
                                  }),
                                });
                                if (res.ok) {
                                  const { pricing: updated } = await res.json();
                                  setPricing((prev) => prev.map((x) => x.id === p.id ? updated : x));
                                  setEditingPriceId(null);
                                  toast.success(t("settings.toast.pricingUpdated", lang));
                                }
                              } catch {
                                toast.error(t("settings.toast.failedSave", lang));
                              }
                            }}
                            className="rounded px-2 py-1 text-xs font-medium"
                            style={{ background: "var(--db-accent)", color: "#fff" }}
                          >
                            {t("action.save", lang)}
                          </button>
                          <button
                            onClick={() => setEditingPriceId(null)}
                            className="rounded px-2 py-1 text-xs"
                            style={{ color: "var(--db-text-muted)" }}
                          >
                            {t("action.cancel", lang)}
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm font-medium" style={{ color: "var(--db-text)" }}>
                            {p.serviceName}
                          </span>
                          <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
                            {p.priceMin != null && p.priceMax != null
                              ? `$${p.priceMin} – $${p.priceMax}`
                              : p.priceMin != null
                              ? t("settings.price.from", lang, { amount: `$${p.priceMin}` })
                              : p.priceMax != null
                              ? t("settings.price.upTo", lang, { amount: `$${p.priceMax}` })
                              : "—"}
                          </span>
                          <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                            {p.unit.replace(/_/g, " ")}
                          </span>
                          <button
                            onClick={() => {
                              setEditingPriceId(p.id);
                              setEditingPriceData({
                                serviceName: p.serviceName,
                                priceMin: p.priceMin != null ? String(p.priceMin) : "",
                                priceMax: p.priceMax != null ? String(p.priceMax) : "",
                                unit: p.unit,
                              });
                            }}
                            className="text-xs font-medium"
                            style={{ color: "var(--db-accent)" }}
                          >
                            {t("action.edit", lang)}
                          </button>
                          <button
                            onClick={() => setConfirmDeletePriceId(p.id)}
                            className="text-xs"
                            style={{ color: "var(--db-danger)" }}
                          >
                            {t("action.delete", lang)}
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add new pricing row */}
              {newPriceRow ? (
                <div
                  className="flex flex-wrap items-center gap-2 rounded-lg p-3"
                  style={{ background: "var(--db-bg)", border: "1px dashed var(--db-border)" }}
                >
                  <input
                    type="text"
                    value={newPriceRow.serviceName}
                    onChange={(e) => setNewPriceRow({ ...newPriceRow, serviceName: e.target.value })}
                    placeholder={t("settings.placeholder.serviceName", lang)}
                    className="db-input flex-1 min-w-[120px] rounded px-2 py-1 text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>$</span>
                    <input
                      type="number"
                      value={newPriceRow.priceMin}
                      onChange={(e) => setNewPriceRow({ ...newPriceRow, priceMin: e.target.value })}
                      placeholder="Min"
                      className="db-input w-20 rounded px-2 py-1 text-sm"
                    />
                    <span style={{ color: "var(--db-text-muted)" }}>—</span>
                    <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>$</span>
                    <input
                      type="number"
                      value={newPriceRow.priceMax}
                      onChange={(e) => setNewPriceRow({ ...newPriceRow, priceMax: e.target.value })}
                      placeholder="Max"
                      className="db-input w-20 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <select
                    value={newPriceRow.unit}
                    onChange={(e) => setNewPriceRow({ ...newPriceRow, unit: e.target.value })}
                    className="db-select rounded px-2 py-1 text-xs"
                  >
                    <option value="per_job">{t("settings.perJob", lang)}</option>
                    <option value="per_hour">{t("settings.perHour", lang)}</option>
                    <option value="per_sqft">{t("settings.perSqft", lang)}</option>
                    <option value="per_unit">{t("settings.perUnit", lang)}</option>
                  </select>
                  <button
                    onClick={async () => {
                      if (!newPriceRow.serviceName.trim()) return;
                      try {
                        const res = await fetch("/api/dashboard/pricing", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            serviceName: newPriceRow.serviceName,
                            priceMin: newPriceRow.priceMin ? parseFloat(newPriceRow.priceMin) : null,
                            priceMax: newPriceRow.priceMax ? parseFloat(newPriceRow.priceMax) : null,
                            unit: newPriceRow.unit,
                          }),
                        });
                        if (res.ok) {
                          const { pricing: created } = await res.json();
                          if (created) setPricing((prev) => [...prev, created]);
                          setNewPriceRow(null);
                          toast.success(t("settings.toast.pricingAdded", lang));
                        }
                      } catch {
                        toast.error(t("settings.toast.failedAddPricing", lang));
                      }
                    }}
                    disabled={!newPriceRow.serviceName.trim()}
                    className="rounded px-2 py-1 text-xs font-medium"
                    style={{ background: "var(--db-accent)", color: "#fff", opacity: newPriceRow.serviceName.trim() ? 1 : 0.5 }}
                  >
                    {t("action.add", lang)}
                  </button>
                  <button
                    onClick={() => setNewPriceRow(null)}
                    className="rounded px-2 py-1 text-xs"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    {t("action.cancel", lang)}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setNewPriceRow({ serviceName: "", priceMin: "", priceMax: "", unit: "per_job" })}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  style={{ background: "var(--db-hover)", color: "var(--db-text-secondary)", border: "1px dashed var(--db-border)" }}
                >
                  {t("settings.addServicePricing", lang)}
                </button>
              )}
            </>
          )}
        </div>
      </Card>

      {/* ── Import Data ── */}
      <Card title={t("settings.importData", lang)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: "var(--db-text)" }}>
              {t("settings.importDataDesc", lang)}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
              {t("settings.importDataSupports", lang)}
            </p>
          </div>
          <a
            href="/dashboard/import"
            className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ background: "var(--db-accent)" }}
          >
            {t("settings.importDataButton", lang)}
          </a>
        </div>
      </Card>

      </>}

      {/* ═══ RECEPTIONIST TAB (Greeting + Language + Emergency) ═══ */}
      {activeTab === "receptionist" && <>

      {/* ── Section: Greeting ── */}
      <Card title={t("settings.greetingTitle", lang, { name: rName })}>
        <div className="space-y-4">
          <div>
            <label className="db-label">
              {t("settings.englishGreeting", lang)}
            </label>
            <textarea
              value={data.greeting || ""}
              onChange={(e) => setField("greeting", e.target.value || null)}
              onBlur={() => handleBlur("greeting", data.greeting || "")}
              rows={3}
              maxLength={500}
              placeholder={defaultGreeting}
              className="db-input w-full resize-none"
              style={getFieldError("greeting") ? { borderColor: "var(--db-danger)" } : undefined}
            />
            <div className="flex justify-between mt-1">
              {getFieldError("greeting") && (
                <span className="text-xs" style={{ color: "var(--db-danger)" }}>{getFieldError("greeting")}</span>
              )}
              <span className="text-xs ml-auto" style={{ color: "var(--db-text-muted)" }}>
                {(data.greeting || "").length}/500
              </span>
            </div>
          </div>
          <div>
            <label className="db-label">
              {t("settings.spanishGreeting", lang)}
            </label>
            <textarea
              value={data.greetingEs || ""}
              onChange={(e) => setField("greetingEs", e.target.value || null)}
              onBlur={() => handleBlur("greetingEs", data.greetingEs || "")}
              rows={3}
              maxLength={500}
              placeholder={`Gracias por llamar a ${data.name}, habla ${rName}. ¿En qué le puedo ayudar?`}
              className="db-input w-full resize-none"
              style={getFieldError("greetingEs") ? { borderColor: "var(--db-danger)" } : undefined}
            />
            <div className="flex justify-between mt-1">
              {getFieldError("greetingEs") && (
                <span className="text-xs" style={{ color: "var(--db-danger)" }}>{getFieldError("greetingEs")}</span>
              )}
              <span className="text-xs ml-auto" style={{ color: "var(--db-text-muted)" }}>
                {(data.greetingEs || "").length}/500
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowGreetingPreview(!showGreetingPreview)}
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--db-accent)" }}
          >
            {showGreetingPreview ? t("settings.hidePreview", lang) : t("settings.previewGreeting", lang)}
          </button>
          {showGreetingPreview && (
            <div
              className="rounded-xl p-4 mt-2"
              style={{
                background: "rgba(99,102,241,0.06)",
                border: "1px solid rgba(99,102,241,0.15)",
              }}
            >
              <p className="text-xs font-medium mb-2" style={{ color: "var(--db-text-muted)" }}>
                {t("settings.whenSomeoneCalls", lang, { name: rName })}
              </p>
              <p className="text-sm italic" style={{ color: "var(--db-text)" }}>
                &ldquo;{data.greeting || defaultGreeting}&rdquo;
              </p>
              {(data.greetingEs || data.defaultLanguage === "es") && (
                <>
                  <p className="text-xs font-medium mt-3 mb-2" style={{ color: "var(--db-text-muted)" }}>
                    {t("settings.forSpanishCallers", lang)}
                  </p>
                  <p className="text-sm italic" style={{ color: "var(--db-text)" }}>
                    &ldquo;{data.greetingEs || `Gracias por llamar a ${data.name}, habla ${rName}. ¿En qué le puedo ayudar?`}&rdquo;
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* ── Section: Language Preference ── */}
      <Card title={t("settings.languagePreference", lang)}>
        <div className="flex gap-4">
          {(["en", "es"] as const).map((langOpt) => (
            <label
              key={langOpt}
              className="flex items-center gap-2 cursor-pointer rounded-lg px-4 py-3 transition-colors"
              style={{
                background: data.defaultLanguage === langOpt ? "rgba(99,102,241,0.08)" : "var(--db-hover)",
                border: `1px solid ${data.defaultLanguage === langOpt ? "rgba(99,102,241,0.3)" : "var(--db-border)"}`,
              }}
            >
              <input
                type="radio"
                name="language"
                value={langOpt}
                checked={data.defaultLanguage === langOpt}
                onChange={() => setField("defaultLanguage", langOpt)}
                className="accent-[var(--db-accent)]"
              />
              <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                {langOpt === "en" ? t("settings.english", lang) : t("settings.spanish", lang)}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
          {t("settings.bilingualNote", lang, { name: rName })}
        </p>
      </Card>

      {/* ── Section: Emergency Contact ── */}
      <Card title={t("settings.emergencyContact", lang)}>
        <InputField
          label={t("settings.emergencyPhoneLabel", lang)}
          value={data.emergencyPhone || ""}
          onChange={(v) => setField("emergencyPhone", v || null)}
          onBlur={() => handleBlur("emergencyPhone", data.emergencyPhone || "")}
          error={getFieldError("emergencyPhone")}
          placeholder="+15125559999"
        />
        <p className="mt-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
          {t("settings.emergencyNote", lang, { name: rName })}
        </p>
      </Card>

      {/* ── Section: Train Your Receptionist ── */}
      <Card title={t("settings.trainReceptionist", lang, { name: rName })}>
        <p className="text-sm mb-4" style={{ color: "var(--db-text-muted)" }}>
          {t("settings.trainDesc", lang, { name: rName })}
        </p>
        <div className="space-y-2">
          {([
            { key: "faq", labelKey: "settings.faqResponses", descKey: "settings.faqResponsesDesc", max: 20, hasResponse: true },
            { key: "off_limits", labelKey: "settings.offLimitsTopics", descKey: "settings.offLimitsTopicsDesc", max: 10, hasResponse: true },
            { key: "phrase", labelKey: "settings.preferredPhrases", descKey: "settings.preferredPhrasesDesc", max: 10, hasResponse: false },
            { key: "emergency_keyword", labelKey: "settings.emergencyKeywords", descKey: "settings.emergencyKeywordsDesc", max: 10, hasResponse: false },
          ] as const).map((cat) => {
            const items = customResponses[cat.key] || [];
            const isExpanded = expandedCategory === cat.key;
            return (
              <div key={cat.key} className="rounded-lg" style={{ border: "1px solid var(--db-border)" }}>
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.key)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{t(cat.labelKey, lang)}</p>
                    <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{t(cat.descKey, lang)} ({items.length}/{cat.max})</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--db-text-muted)", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: "var(--db-border)" }}>
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start gap-2 rounded-lg p-2" style={{ background: "var(--db-bg)" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--db-text)" }}>{item.triggerText}</p>
                          {item.responseText && (
                            <p className="text-xs truncate" style={{ color: "var(--db-text-muted)" }}>{item.responseText}</p>
                          )}
                        </div>
                        <button
                          onClick={async () => {
                            if (!confirm(t("settings.removeResponse", lang))) return;
                            await fetch(`/api/receptionist/responses/${item.id}`, { method: "DELETE" });
                            setCustomResponses((prev) => ({
                              ...prev,
                              [cat.key]: prev[cat.key].filter((r) => r.id !== item.id),
                            }));
                            toast.success(t("settings.toast.removed", lang));
                          }}
                          className="shrink-0 p-1 rounded transition-colors"
                          style={{ color: "var(--db-danger)" }}
                          title={t("action.delete", lang)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                    {newResponse?.category === cat.key ? (
                      <div className="space-y-2 rounded-lg p-3" style={{ background: "var(--db-bg)", border: "1px dashed var(--db-border)" }}>
                        <input
                          type="text"
                          value={newResponse.triggerText}
                          onChange={(e) => setNewResponse({ ...newResponse, triggerText: e.target.value })}
                          placeholder={cat.key === "faq" ? t("settings.placeholder.faqTrigger", lang) : cat.key === "off_limits" ? t("settings.placeholder.offLimitsTrigger", lang) : cat.key === "phrase" ? t("settings.placeholder.phraseTrigger", lang) : t("settings.placeholder.emergencyTrigger", lang)}
                          className="db-input w-full"
                          maxLength={200}
                        />
                        {cat.hasResponse && (
                          <input
                            type="text"
                            value={newResponse.responseText}
                            onChange={(e) => setNewResponse({ ...newResponse, responseText: e.target.value })}
                            placeholder={cat.key === "faq" ? t("settings.placeholder.faqResponse", lang) : t("settings.placeholder.offLimitsResponse", lang)}
                            className="db-input w-full"
                            maxLength={500}
                          />
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              if (!newResponse.triggerText.trim()) return;
                              const res = await fetch("/api/receptionist/responses", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  category: cat.key,
                                  triggerText: newResponse.triggerText.trim(),
                                  responseText: newResponse.responseText.trim() || undefined,
                                }),
                              });
                              if (res.ok) {
                                const created = await res.json();
                                setCustomResponses((prev) => ({
                                  ...prev,
                                  [cat.key]: [...(prev[cat.key] || []), created],
                                }));
                                setNewResponse(null);
                                toast.success(t("settings.toast.added", lang));
                              } else {
                                const err = await res.json().catch(() => null);
                                toast.error(err?.error || t("settings.toast.failedAdd", lang));
                              }
                            }}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                            style={{ background: "var(--db-accent)" }}
                          >
                            {t("action.save", lang)}
                          </button>
                          <button
                            onClick={() => setNewResponse(null)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium"
                            style={{ color: "var(--db-text-muted)", border: "1px solid var(--db-border)" }}
                          >
                            {t("action.cancel", lang)}
                          </button>
                        </div>
                      </div>
                    ) : items.length < cat.max && (
                      <button
                        onClick={() => setNewResponse({ category: cat.key, triggerText: "", responseText: "" })}
                        className="w-full rounded-lg py-2 text-xs font-medium transition-colors"
                        style={{ color: "var(--db-text-secondary)", border: "1px dashed var(--db-border)" }}
                      >
                        + {t("action.add", lang)}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      </>}

      {/* ═══ PRICING TAB (Estimate Engine) ═══ */}
      {activeTab === "pricing" && <>

      {/* ── Section: Estimate Mode ── */}
      <Card title={t("settings.estimateMode", lang)}>
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {t("settings.estimateModeDesc", lang, { name: data?.receptionistName || "Maria" })}
          </p>
          <div className="flex gap-2">
            {(["quick", "advanced", "both"] as const).map((mode) => (
              <button
                key={mode}
                onClick={async () => {
                  setEstimateMode(mode);
                  try {
                    await fetch("/api/dashboard/estimate-pricing/mode", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ estimateMode: mode }),
                    });
                    toast.success(t("settings.toast.estimateModeSet", lang, { mode }));
                  } catch {
                    toast.error(t("settings.toast.failedUpdateEstimateMode", lang));
                  }
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: estimateMode === mode ? "var(--db-accent)" : "var(--db-hover)",
                  color: estimateMode === mode ? "#fff" : "var(--db-text)",
                  border: `1px solid ${estimateMode === mode ? "var(--db-accent)" : "var(--db-border)"}`,
                }}
              >
                {mode === "quick" ? t("settings.quickSetup", lang) : mode === "advanced" ? t("settings.advanced", lang) : t("settings.both", lang)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Section: Quick Pricing Ranges ── */}
      <Card title={t("settings.pricingRanges", lang)}>
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {t("settings.pricingRangesDesc", lang, { name: data?.receptionistName || "Maria" })}
          </p>

          {estimateRangesLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : (
            <div className="space-y-2">
              {estimateRanges.filter((r) => r.mode === "quick").map((range) => (
                <div
                  key={range.id}
                  className="db-table-row flex items-center gap-3 rounded-lg border p-3"
                  style={{ borderColor: "var(--db-border)" }}
                >
                  <span className="flex-1 text-sm font-medium" style={{ color: "var(--db-text)" }}>
                    {range.jobTypeLabel}
                  </span>
                  <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>
                    ${range.minPrice?.toLocaleString() || "0"} – ${range.maxPrice?.toLocaleString() || "0"}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}>
                    {range.unit?.replace("per_", "per ") || "per job"}
                  </span>
                  <button
                    onClick={async () => {
                      if (confirmDeleteEstimateId === range.id) {
                        try {
                          await fetch(`/api/dashboard/estimate-pricing/${range.id}`, { method: "DELETE" });
                          setEstimateRanges((prev) => prev.filter((r) => r.id !== range.id));
                          toast.success(t("settings.toast.pricingRangeRemoved", lang));
                        } catch {
                          toast.error(t("settings.toast.failedDelete", lang));
                        }
                        setConfirmDeleteEstimateId(null);
                      } else {
                        setConfirmDeleteEstimateId(range.id);
                        setTimeout(() => setConfirmDeleteEstimateId(null), 3000);
                      }
                    }}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: confirmDeleteEstimateId === range.id ? "var(--db-danger)" : "var(--db-text-muted)" }}
                  >
                    {confirmDeleteEstimateId === range.id ? t("settings.confirm", lang) : "×"}
                  </button>
                </div>
              ))}

              {/* Add new quick range */}
              {newEstimateRow ? (
                <div
                  className="flex items-center gap-2 rounded-lg border p-3"
                  style={{ borderColor: "var(--db-accent)" }}
                >
                  <input
                    type="text"
                    placeholder={t("settings.placeholder.jobType", lang)}
                    value={newEstimateRow.jobTypeLabel}
                    onChange={(e) => setNewEstimateRow({ ...newEstimateRow, jobTypeLabel: e.target.value })}
                    className="db-input flex-1 rounded px-2 py-1 text-sm"
                  />
                  <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>$</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={newEstimateRow.minPrice}
                    onChange={(e) => setNewEstimateRow({ ...newEstimateRow, minPrice: e.target.value })}
                    className="db-input w-20 rounded px-2 py-1 text-sm"
                  />
                  <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={newEstimateRow.maxPrice}
                    onChange={(e) => setNewEstimateRow({ ...newEstimateRow, maxPrice: e.target.value })}
                    className="db-input w-20 rounded px-2 py-1 text-sm"
                  />
                  <select
                    value={newEstimateRow.unit}
                    onChange={(e) => setNewEstimateRow({ ...newEstimateRow, unit: e.target.value })}
                    className="db-select rounded px-2 py-1 text-sm"
                  >
                    <option value="per_job">{t("settings.perJob", lang)}</option>
                    <option value="per_hour">{t("settings.perHour", lang)}</option>
                    <option value="per_room">{t("settings.perRoom", lang)}</option>
                    <option value="per_sqft">{t("settings.perSqft", lang)}</option>
                    <option value="per_unit">{t("settings.perUnit", lang)}</option>
                  </select>
                  <button
                    onClick={async () => {
                      if (!newEstimateRow.jobTypeLabel.trim()) return;
                      try {
                        const res = await fetch("/api/dashboard/estimate-pricing", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            mode: "quick",
                            jobTypeKey: newEstimateRow.jobTypeLabel.toLowerCase().replace(/\s+/g, "_"),
                            jobTypeLabel: newEstimateRow.jobTypeLabel,
                            tradeType: data?.type || "other",
                            scopeLevel: "residential",
                            minPrice: Number(newEstimateRow.minPrice) || null,
                            maxPrice: Number(newEstimateRow.maxPrice) || null,
                            unit: newEstimateRow.unit,
                          }),
                        });
                        if (res.ok) {
                          const { range: created } = await res.json();
                          setEstimateRanges((prev) => [...prev, created]);
                          setNewEstimateRow(null);
                          toast.success(t("settings.toast.pricingRangeAdded", lang));
                        }
                      } catch {
                        toast.error(t("settings.toast.failedCreatePricingRange", lang));
                      }
                    }}
                    className="rounded px-3 py-1 text-sm font-medium"
                    style={{ background: "var(--db-accent)", color: "#fff" }}
                  >
                    {t("action.save", lang)}
                  </button>
                  <button
                    onClick={() => setNewEstimateRow(null)}
                    className="text-sm"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    {t("action.cancel", lang)}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setNewEstimateRow({ jobTypeLabel: "", minPrice: "", maxPrice: "", unit: "per_job" })}
                  className="w-full rounded-lg border border-dashed py-2 text-sm"
                  style={{ borderColor: "var(--db-border)", color: "var(--db-text-muted)" }}
                >
                  {t("settings.addJobType", lang)}
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* ── Section: Advanced Formula Builder ── */}
      {(estimateMode === "advanced" || estimateMode === "both") && (
        <Card title={t("settings.advancedFormulas", lang)}>
          <div className="space-y-4">
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              {t("settings.advancedFormulasDesc", lang)}
            </p>

            {/* Existing advanced ranges */}
            {estimateRanges.filter((r) => r.mode === "advanced").map((range) => (
              <div
                key={range.id}
                className="rounded-lg border p-4 space-y-2"
                style={{ borderColor: "var(--db-border)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                    {range.jobTypeLabel}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--db-info-bg)", color: "var(--db-info)" }}>
                      {t("settings.advancedBadge", lang)}
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          await fetch(`/api/dashboard/estimate-pricing/${range.id}`, { method: "DELETE" });
                          setEstimateRanges((prev) => prev.filter((r) => r.id !== range.id));
                          toast.success(t("settings.toast.formulaRemoved", lang));
                        } catch {
                          toast.error(t("settings.toast.failedDelete", lang));
                        }
                      }}
                      className="text-xs"
                      style={{ color: "var(--db-text-muted)" }}
                    >
                      {t("action.remove", lang)}
                    </button>
                  </div>
                </div>
                {range.formulaJson != null && (
                  <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                    Base: ${(range.formulaJson as { base_rate?: number }).base_rate || 0}/{(range.formulaJson as { base_unit?: string }).base_unit || "unit"}
                    {" · "}
                    Margin: {((range.formulaJson as { margin_range?: number[] }).margin_range?.[0] || 0.85) * 100}% – {((range.formulaJson as { margin_range?: number[] }).margin_range?.[1] || 1.15) * 100}%
                  </p>
                )}
              </div>
            ))}

            {/* New formula builder */}
            {advancedFormula ? (
              <div className="rounded-lg border p-4 space-y-4" style={{ borderColor: "var(--db-accent)" }}>
                <input
                  type="text"
                  placeholder={t("settings.placeholder.formulaJobType", lang)}
                  value={advancedFormula.jobTypeLabel}
                  onChange={(e) => setAdvancedFormula({ ...advancedFormula, jobTypeLabel: e.target.value })}
                  className="db-input w-full"
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="db-label text-xs">{t("settings.baseRate", lang)}</label>
                    <input
                      type="number"
                      value={advancedFormula.baseRate}
                      onChange={(e) => setAdvancedFormula({ ...advancedFormula, baseRate: e.target.value })}
                      className="db-input w-full rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="db-label text-xs">{t("settings.per", lang)}</label>
                    <select
                      value={advancedFormula.baseUnit}
                      onChange={(e) => setAdvancedFormula({ ...advancedFormula, baseUnit: e.target.value })}
                      className="db-select w-full rounded px-2 py-1 text-sm"
                    >
                      <option value="unit">unit</option>
                      <option value="room">room</option>
                      <option value="sqft">sqft</option>
                      <option value="hour">hour</option>
                    </select>
                  </div>
                  <div>
                    <label className="db-label text-xs">{t("settings.variableKey", lang)}</label>
                    <input
                      type="text"
                      placeholder="e.g. unit_count"
                      value={advancedFormula.baseUnitVariable}
                      onChange={(e) => setAdvancedFormula({ ...advancedFormula, baseUnitVariable: e.target.value })}
                      className="db-input w-full rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                {/* Additional rates */}
                <div>
                  <label className="db-label">{t("settings.additionalRates", lang)}</label>
                  {advancedFormula.additionalRates.map((rate, i) => (
                    <div key={i} className="flex gap-2 mt-1">
                      <input type="number" placeholder="Rate" value={rate.rate}
                        onChange={(e) => {
                          const updated = [...advancedFormula.additionalRates];
                          updated[i] = { ...rate, rate: e.target.value };
                          setAdvancedFormula({ ...advancedFormula, additionalRates: updated });
                        }}
                        className="db-input w-20 rounded px-2 py-1 text-sm"
                      />
                      <input type="text" placeholder="per sqft" value={rate.unit}
                        onChange={(e) => {
                          const updated = [...advancedFormula.additionalRates];
                          updated[i] = { ...rate, unit: e.target.value };
                          setAdvancedFormula({ ...advancedFormula, additionalRates: updated });
                        }}
                        className="db-input w-24 rounded px-2 py-1 text-sm"
                      />
                      <input type="text" placeholder="variable key" value={rate.variable}
                        onChange={(e) => {
                          const updated = [...advancedFormula.additionalRates];
                          updated[i] = { ...rate, variable: e.target.value };
                          setAdvancedFormula({ ...advancedFormula, additionalRates: updated });
                        }}
                        className="db-input w-28 rounded px-2 py-1 text-sm"
                      />
                      <input type="text" placeholder="Label" value={rate.label}
                        onChange={(e) => {
                          const updated = [...advancedFormula.additionalRates];
                          updated[i] = { ...rate, label: e.target.value };
                          setAdvancedFormula({ ...advancedFormula, additionalRates: updated });
                        }}
                        className="db-input flex-1 rounded px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => {
                          const updated = advancedFormula.additionalRates.filter((_, j) => j !== i);
                          setAdvancedFormula({ ...advancedFormula, additionalRates: updated });
                        }}
                        className="text-sm" style={{ color: "var(--db-text-muted)" }}
                      >×</button>
                    </div>
                  ))}
                  <button
                    onClick={() => setAdvancedFormula({
                      ...advancedFormula,
                      additionalRates: [...advancedFormula.additionalRates, { rate: "", unit: "sqft", variable: "", label: "" }],
                    })}
                    className="mt-1 text-xs" style={{ color: "var(--db-accent)" }}
                  >{t("settings.addRate", lang)}</button>
                </div>

                {/* Margin range */}
                <div className="flex gap-4">
                  <div>
                    <label className="db-label text-xs">{t("settings.marginLow", lang)}</label>
                    <input
                      type="number"
                      value={advancedFormula.marginLow}
                      onChange={(e) => setAdvancedFormula({ ...advancedFormula, marginLow: e.target.value })}
                      className="db-input w-20 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="db-label text-xs">{t("settings.marginHigh", lang)}</label>
                    <input
                      type="number"
                      value={advancedFormula.marginHigh}
                      onChange={(e) => setAdvancedFormula({ ...advancedFormula, marginHigh: e.target.value })}
                      className="db-input w-20 rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!advancedFormula.jobTypeLabel.trim()) return;
                      const formulaJson = {
                        base_rate: Number(advancedFormula.baseRate) || 0,
                        base_unit: advancedFormula.baseUnit,
                        base_unit_variable: advancedFormula.baseUnitVariable,
                        additional_rates: advancedFormula.additionalRates.map((r) => ({
                          rate: Number(r.rate) || 0,
                          unit: r.unit,
                          variable: r.variable,
                          label: r.label,
                        })),
                        multipliers: advancedFormula.multipliers.map((m) => ({
                          label: m.label,
                          value: Number(m.value) || 1,
                          condition: m.condition,
                        })),
                        variables_needed: [
                          advancedFormula.baseUnitVariable,
                          ...advancedFormula.additionalRates.map((r) => r.variable),
                        ].filter(Boolean),
                        margin_range: [
                          (Number(advancedFormula.marginLow) || 85) / 100,
                          (Number(advancedFormula.marginHigh) || 115) / 100,
                        ] as [number, number],
                      };
                      try {
                        const res = await fetch("/api/dashboard/estimate-pricing", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            mode: "advanced",
                            jobTypeKey: advancedFormula.jobTypeLabel.toLowerCase().replace(/\s+/g, "_"),
                            jobTypeLabel: advancedFormula.jobTypeLabel,
                            tradeType: data?.type || "other",
                            scopeLevel: "commercial",
                            formulaJson,
                            unit: "per_job",
                          }),
                        });
                        if (res.ok) {
                          const { range: created } = await res.json();
                          setEstimateRanges((prev) => [...prev, created]);
                          setAdvancedFormula(null);
                          toast.success(t("settings.toast.formulaAdded", lang));
                        }
                      } catch {
                        toast.error(t("settings.toast.failedCreateFormula", lang));
                      }
                    }}
                    className="rounded px-4 py-2 text-sm font-medium"
                    style={{ background: "var(--db-accent)", color: "#fff" }}
                  >
                    {t("settings.saveFormula", lang)}
                  </button>
                  <button
                    onClick={() => setAdvancedFormula(null)}
                    className="rounded px-4 py-2 text-sm"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    {t("action.cancel", lang)}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAdvancedFormula({
                  jobTypeLabel: "", baseRate: "", baseUnit: "unit", baseUnitVariable: "unit_count",
                  additionalRates: [], multipliers: [], marginLow: "85", marginHigh: "115",
                })}
                className="w-full rounded-lg border border-dashed py-2 text-sm"
                style={{ borderColor: "var(--db-border)", color: "var(--db-text-muted)" }}
              >
                {t("settings.addAdvancedFormula", lang)}
              </button>
            )}
          </div>
        </Card>
      )}

      </>}

      {/* ═══ INTEGRATIONS TAB (Outbound + Google Calendar + Webhooks + Export) ═══ */}
      {activeTab === "integrations" && <>

      {/* ── Section: Outbound Calling ── */}
      <OutboundSettingsSection lang={lang} />
      <GoogleCalendarSection lang={lang} />
      <WebhookManager />
      <DataExportSection lang={lang} />

      </>}

      {/* Sticky Save Bar (mobile) */}
      {isDirty && (
        <div
          className="fixed bottom-0 left-0 right-0 p-4 sm:hidden z-50"
          style={{ background: "var(--db-card)", borderTop: "1px solid var(--db-border)" }}
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg py-3 text-sm font-medium"
            style={{ background: "var(--db-accent)", color: "#fff" }}
          >
            {saving ? t("settings.saving", lang) : t("settings.save", lang)}
          </button>
        </div>
      )}

      {/* Delete Pricing Confirmation */}
      {confirmDeletePriceId && (
        <div
          className="db-modal-backdrop"
          onClick={() => setConfirmDeletePriceId(null)}
          onKeyDown={(e) => { if (e.key === "Escape") setConfirmDeletePriceId(null); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-price-title"
        >
          <div
            className="w-full max-w-sm rounded-xl p-6 space-y-4"
            style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-price-title" className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
              {t("settings.deletePricing", lang)}
            </h3>
            <p className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
              {t("settings.deletePricingDesc", lang)}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDeletePriceId(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: "var(--db-text-secondary)" }}
              >
                {t("action.cancel", lang)}
              </button>
              <button
                autoFocus
                onClick={async () => {
                  const id = confirmDeletePriceId;
                  setConfirmDeletePriceId(null);
                  try {
                    await fetch(`/api/dashboard/pricing/${id}`, { method: "DELETE" });
                    setPricing((prev) => prev.filter((x) => x.id !== id));
                    toast.success(t("settings.toast.pricingRemoved", lang));
                  } catch {
                    toast.error(t("settings.toast.failedDelete", lang));
                  }
                }}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ background: "var(--db-danger)" }}
              >
                {t("action.delete", lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Reusable sub-components ── */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "var(--db-card)",
        border: "1px solid var(--db-border)",
        boxShadow: "var(--db-card-shadow)",
      }}
    >
      <h3
        className="mb-4 text-sm font-semibold uppercase tracking-wider"
        style={{ color: "var(--db-text-muted)" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function InputField({
  label, value, onChange, onBlur, error, placeholder, type = "text", required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string | undefined;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="db-label">
        {label}
        {required && <span style={{ color: "var(--db-danger)" }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="db-input"
        style={error ? { borderColor: "var(--db-danger)" } : undefined}
      />
      {error && <p className="mt-1 text-xs" style={{ color: "var(--db-danger)" }}>{error}</p>}
    </div>
  );
}

/* ── Outbound Settings Section ── */

interface OutboundSettings {
  outboundEnabled: boolean;
  appointmentReminders: boolean;
  estimateFollowups: boolean;
  seasonalReminders: boolean;
  outboundCallingHoursStart: string;
  outboundCallingHoursEnd: string;
  outboundMaxCallsPerDay: number;
}

interface OutboundCallItem {
  id: string;
  callType: string;
  customerPhone: string;
  status: string;
  outcome: string | null;
  scheduledFor: string;
  duration: number | null;
}

interface SeasonalService {
  id: string;
  serviceName: string;
  reminderIntervalMonths: number;
  reminderMessage?: string | null;
  seasonStart?: number | null;
  seasonEnd?: number | null;
  isActive: boolean;
}

const CALL_TYPE_I18N_KEYS: Record<string, string> = {
  appointment_reminder: "settings.outbound.aptReminder",
  estimate_followup: "settings.outbound.estimateFollowup",
  seasonal_reminder: "settings.outbound.seasonal",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#3b82f6",
  initiated: "#f59e0b",
  completed: "#22c55e",
  failed: "#ef4444",
  retry: "#f59e0b",
  consent_blocked: "#ef4444",
};

const MONTH_LABELS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function OutboundSettingsSection({ lang }: { lang: Lang }) {
  const rName = useReceptionistName();
  const [settings, setSettings] = useState<OutboundSettings | null>(null);
  const [calls, setCalls] = useState<OutboundCallItem[]>([]);
  const [seasonal, setSeasonal] = useState<SeasonalService[]>([]);
  const [stats, setStats] = useState<{ total: number; completed: number; answered: number; noAnswer: number; scheduled: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSeasonal, setShowSeasonal] = useState(false);
  const [newService, setNewService] = useState({ serviceName: "", reminderIntervalMonths: "12", reminderMessage: "", seasonStart: "", seasonEnd: "" });
  const [addingService, setAddingService] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/outbound")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        setSettings(d.settings);
        setCalls(d.recentCalls ?? []);
        setStats(d.stats ?? null);
      })
      .catch(() => {});

    fetch("/api/dashboard/seasonal-services")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setSeasonal(d.items ?? []))
      .catch(() => {});
  }, []);

  const updateSetting = async (key: string, value: unknown) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value } as OutboundSettings;
    setSettings(updated);
    setSaving(true);
    try {
      await fetch("/api/dashboard/outbound", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      toast.success(t("settings.toast.settingUpdated", lang));
    } catch {
      toast.error(t("settings.toast.failedSave", lang));
    } finally {
      setSaving(false);
    }
  };

  const addSeasonalService = async () => {
    if (!newService.serviceName) return;
    setAddingService(true);
    try {
      const res = await fetch("/api/dashboard/seasonal-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: newService.serviceName,
          reminderIntervalMonths: parseInt(newService.reminderIntervalMonths) || 12,
          reminderMessage: newService.reminderMessage || undefined,
          seasonStart: newService.seasonStart ? parseInt(newService.seasonStart) : undefined,
          seasonEnd: newService.seasonEnd ? parseInt(newService.seasonEnd) : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSeasonal((prev) => [...prev, { ...newService, id: data.id, reminderIntervalMonths: parseInt(newService.reminderIntervalMonths) || 12, isActive: true, seasonStart: newService.seasonStart ? parseInt(newService.seasonStart) : null, seasonEnd: newService.seasonEnd ? parseInt(newService.seasonEnd) : null }]);
        setNewService({ serviceName: "", reminderIntervalMonths: "12", reminderMessage: "", seasonStart: "", seasonEnd: "" });
        toast.success(t("settings.toast.serviceAdded", lang));
      }
    } catch {
      toast.error(t("settings.toast.failedAddService", lang));
    } finally {
      setAddingService(false);
    }
  };

  const deleteSeasonalService = async (id: string) => {
    try {
      await fetch(`/api/dashboard/seasonal-services/${id}`, { method: "DELETE" });
      setSeasonal((prev) => prev.filter((s) => s.id !== id));
      toast.success(t("settings.toast.serviceRemoved", lang));
    } catch {
      toast.error(t("settings.toast.failedRemove", lang));
    }
  };

  if (!settings) return null;

  return (
    <Card title={t("settings.outboundCalling", lang)}>
      <div className="space-y-4">
        {/* Master toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
              {t("settings.enableOutbound", lang)}
            </p>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              {t("settings.letMariaCalls", lang, { name: rName })}
            </p>
          </div>
          <ToggleSwitch
            checked={settings.outboundEnabled}
            onChange={(v) => updateSetting("outboundEnabled", v)}
          />
        </div>

        {settings.outboundEnabled && (
          <>
            {/* Call type toggles */}
            <div className="space-y-3 pl-1">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{t("settings.appointmentReminders", lang)}</span>
                <ToggleSwitch
                  checked={settings.appointmentReminders}
                  onChange={(v) => updateSetting("appointmentReminders", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{t("settings.estimateFollowups", lang)}</span>
                <ToggleSwitch
                  checked={settings.estimateFollowups}
                  onChange={(v) => updateSetting("estimateFollowups", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{t("settings.seasonalReminders", lang)}</span>
                <ToggleSwitch
                  checked={settings.seasonalReminders}
                  onChange={(v) => updateSetting("seasonalReminders", v)}
                />
              </div>
            </div>

            {/* Calling hours */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="db-label">
                  {t("settings.callWindowStart", lang)}
                </label>
                <select
                  value={settings.outboundCallingHoursStart}
                  onChange={(e) => updateSetting("outboundCallingHoursStart", e.target.value)}
                  className="db-select"
                >
                  {Array.from({ length: 13 }, (_, i) => i + 7).map((h) => (
                    <option key={h} value={`${h.toString().padStart(2, "0")}:00`}>
                      {h > 12 ? `${h - 12}:00 PM` : h === 12 ? "12:00 PM" : `${h}:00 AM`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="db-label">
                  {t("settings.callWindowEnd", lang)}
                </label>
                <select
                  value={settings.outboundCallingHoursEnd}
                  onChange={(e) => updateSetting("outboundCallingHoursEnd", e.target.value)}
                  className="db-select"
                >
                  {Array.from({ length: 13 }, (_, i) => i + 12).map((h) => (
                    <option key={h} value={`${h.toString().padStart(2, "0")}:00`}>
                      {h > 12 ? `${h - 12}:00 PM` : `12:00 PM`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Max calls per day */}
            <div>
              <label className="db-label">
                {t("settings.maxCallsPerDay", lang)}
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.outboundMaxCallsPerDay}
                onChange={(e) => updateSetting("outboundMaxCallsPerDay", parseInt(e.target.value) || 20)}
                className="db-input"
                style={{ width: "6rem" }}
              />
            </div>

            {/* Seasonal services */}
            {settings.seasonalReminders && (
              <div className="pt-2">
                <button
                  onClick={() => setShowSeasonal(!showSeasonal)}
                  className="text-sm font-medium transition-colors"
                  style={{ color: "var(--db-accent)" }}
                >
                  {showSeasonal ? t("settings.hideSeasonalServices", lang) : t("settings.manageSeasonalServices", lang)} ({seasonal.length})
                </button>

                {showSeasonal && (
                  <div className="mt-3 space-y-3">
                    {seasonal.map((svc) => (
                      <div
                        key={svc.id}
                        className="db-table-row flex items-center justify-between rounded-lg p-3"
                        style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)" }}
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                            {svc.serviceName}
                          </p>
                          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                            {t("settings.outbound.everyNMonths", lang, { n: svc.reminderIntervalMonths })}
                            {svc.seasonStart && svc.seasonEnd
                              ? ` (${MONTH_LABELS[svc.seasonStart]}–${MONTH_LABELS[svc.seasonEnd]})`
                              : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteSeasonalService(svc.id)}
                          className="text-xs font-medium px-2 py-1 rounded"
                          style={{ color: "var(--db-danger)" }}
                        >
                          {t("action.remove", lang)}
                        </button>
                      </div>
                    ))}

                    {/* Add new */}
                    <div
                      className="rounded-lg p-3 space-y-2"
                      style={{ background: "var(--db-bg)", border: "1px dashed var(--db-border)" }}
                    >
                      <input
                        value={newService.serviceName}
                        onChange={(e) => setNewService((p) => ({ ...p, serviceName: e.target.value }))}
                        placeholder={t("settings.placeholder.seasonalServiceName", lang)}
                        className="db-input"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={newService.reminderIntervalMonths}
                          onChange={(e) => setNewService((p) => ({ ...p, reminderIntervalMonths: e.target.value }))}
                          className="db-select text-xs"
                        >
                          {[3, 6, 12, 18, 24].map((m) => (
                            <option key={m} value={m}>{t("settings.outbound.everyNMonths", lang, { n: m })}</option>
                          ))}
                        </select>
                        <select
                          value={newService.seasonStart}
                          onChange={(e) => setNewService((p) => ({ ...p, seasonStart: e.target.value }))}
                          className="db-select text-xs"
                        >
                          <option value="">{t("settings.outbound.seasonStart", lang)}</option>
                          {MONTH_LABELS.slice(1).map((m, i) => (
                            <option key={i + 1} value={i + 1}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={newService.seasonEnd}
                          onChange={(e) => setNewService((p) => ({ ...p, seasonEnd: e.target.value }))}
                          className="db-select text-xs"
                        >
                          <option value="">{t("settings.outbound.seasonEnd", lang)}</option>
                          {MONTH_LABELS.slice(1).map((m, i) => (
                            <option key={i + 1} value={i + 1}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        value={newService.reminderMessage}
                        onChange={(e) => setNewService((p) => ({ ...p, reminderMessage: e.target.value }))}
                        placeholder={t("settings.placeholder.customMessage", lang)}
                        className="db-input"
                      />
                      <button
                        onClick={addSeasonalService}
                        disabled={!newService.serviceName || addingService}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium"
                        style={{
                          background: newService.serviceName ? "var(--db-accent)" : "var(--db-border)",
                          color: newService.serviceName ? "#fff" : "var(--db-text-muted)",
                        }}
                      >
                        {addingService ? t("settings.adding", lang) : t("settings.addService", lang)}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent outbound calls */}
            {stats && stats.total > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
                    {t("settings.outbound.total", lang)} {stats.total}
                  </span>
                  <span className="text-xs" style={{ color: "var(--db-success)" }}>
                    {t("settings.outbound.answered", lang)} {stats.answered}
                  </span>
                  <span className="text-xs" style={{ color: "var(--db-warning-alt)" }}>
                    {t("settings.outbound.noAnswer", lang)} {stats.noAnswer}
                  </span>
                  <span className="text-xs" style={{ color: "var(--db-info)" }}>
                    {t("settings.outbound.scheduled", lang)} {stats.scheduled}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {calls.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      className="db-table-row flex items-center gap-3 rounded-lg px-3 py-2"
                      style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)" }}
                    >
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-semibold"
                        style={{ background: `${STATUS_COLORS[c.status] ?? "#94a3b8"}15`, color: STATUS_COLORS[c.status] ?? "#94a3b8" }}
                      >
                        {CALL_TYPE_I18N_KEYS[c.callType] ? t(CALL_TYPE_I18N_KEYS[c.callType], lang) : c.callType}
                      </span>
                      <span className="flex-1 truncate text-xs" style={{ color: "var(--db-text-secondary)" }}>
                        {c.customerPhone}
                      </span>
                      <span className="text-xs" style={{ color: STATUS_COLORS[c.status] ?? "#94a3b8" }}>
                        {c.outcome ?? c.status}
                      </span>
                      {c.duration != null && (
                        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                          {c.duration}s
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

/* ── Security Section ── */

function getStrength(pw: string): "weak" | "fair" | "strong" {
  if (pw.length < 8 || !/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return "weak";
  if (pw.length >= 12 && /[^a-zA-Z0-9]/.test(pw)) return "strong";
  return "fair";
}

const STRENGTH_CONFIG = {
  weak: { color: "var(--db-danger)", labelKey: "auth.strength.weak", width: "33%" },
  fair: { color: "#facc15", labelKey: "auth.strength.fair", width: "66%" },
  strong: { color: "var(--db-success)", labelKey: "auth.strength.strong", width: "100%" },
} as const;

function SecuritySection({ lang }: { lang: Lang }) {
  const [hasPassword, setHasPassword] = useState(false);
  const [passwordChangedAt, setPasswordChangedAt] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [secError, setSecError] = useState("");
  const [secSuccess, setSecSuccess] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/settings/password")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        setHasPassword(d.hasPassword);
        setPasswordChangedAt(d.passwordChangedAt);
      })
      .catch(() => {});
  }, []);

  const strength = getStrength(newPassword);
  const strengthCfg = STRENGTH_CONFIG[strength];
  const passwordsMatch = confirmPassword === newPassword;
  const isValid = newPassword.length >= 8 && /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && passwordsMatch && (!hasPassword || currentPassword.length > 0);

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    setSecError("");
    setSecSuccess("");

    try {
      const res = await fetch("/api/dashboard/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : undefined,
          newPassword,
        }),
      });

      if (res.ok) {
        setSecSuccess(hasPassword ? t("settings.passwordUpdated", lang) : t("settings.passwordSetSuccess", lang));
        setHasPassword(true);
        setPasswordChangedAt(new Date().toISOString());
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setExpanded(false);
        toast.success(hasPassword ? t("settings.passwordUpdated", lang) : t("settings.passwordSetLabel", lang));
      } else {
        const data = await res.json();
        setSecError(data.error || t("error.somethingWentWrong", lang));
      }
    } catch {
      setSecError(t("error.somethingWentWrong", lang));
    }
    setSaving(false);
  }

  return (
    <Card title={t("settings.security", lang)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
              {t("settings.password", lang)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
              {hasPassword
                ? passwordChangedAt
                  ? t("settings.lastChanged", lang, { date: new Date(passwordChangedAt).toLocaleDateString() })
                  : t("settings.passwordSet", lang)
                : t("settings.noPasswordSet", lang)}
            </p>
          </div>
          <button
            onClick={() => { setExpanded(!expanded); setSecError(""); setSecSuccess(""); }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: "var(--db-surface)",
              border: "1px solid var(--db-border)",
              color: "var(--db-text)",
            }}
          >
            {expanded ? t("action.cancel", lang) : hasPassword ? t("settings.change", lang) : t("settings.setPassword", lang)}
          </button>
        </div>

        {secSuccess && !expanded && (
          <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--db-success-bg)", color: "var(--db-success)" }}>
            {secSuccess}
          </div>
        )}

        {expanded && (
          <div className="space-y-3 pt-2" style={{ borderTop: "1px solid var(--db-border)" }}>
            {secError && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--db-danger-bg)", color: "var(--db-danger)" }}>
                {secError}
              </div>
            )}

            {hasPassword && (
              <div>
                <label className="db-label">
                  {t("settings.currentPassword", lang)}
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="db-input"
                />
              </div>
            )}

            <div>
              <label className="db-label">
                {t("settings.newPassword", lang)}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="db-input"
                  style={{ paddingRight: "2.25rem" }}
                  placeholder={t("settings.validation.min8chars", lang)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--db-text-muted)" }}
                  tabIndex={-1}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <>
                        <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {newPassword && (
                <div className="mt-1.5 space-y-1">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--db-border)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ background: strengthCfg.color, width: strengthCfg.width }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: strengthCfg.color }}>{t(strengthCfg.labelKey, lang)}</span>
                </div>
              )}
            </div>

            <div>
              <label className="db-label">
                {t("settings.confirmNewPassword", lang)}
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="db-input"
                style={confirmPassword && !passwordsMatch ? { borderColor: "var(--db-danger)" } : undefined}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="mt-0.5 text-xs" style={{ color: "var(--db-danger)" }}>{t("settings.passwordsDontMatch", lang)}</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving || !isValid}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                style={{ background: "var(--db-accent)" }}
              >
                {saving ? t("settings.saving", lang) : hasPassword ? t("settings.updatePassword", lang) : t("settings.setPassword", lang)}
              </button>
              <button
                onClick={() => { setExpanded(false); setSecError(""); }}
                className="rounded-lg px-4 py-2 text-sm transition-colors"
                style={{ color: "var(--db-text-muted)" }}
              >
                {t("action.cancel", lang)}
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ── Google Calendar Section ── */

interface GCalStatus {
  connected: boolean;
  googleEmail?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  syncEnabled?: boolean;
}

function DataExportSection({ lang }: { lang: Lang }) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = async (type: "calls" | "customers" | "appointments" | "invoices" | "all") => {
    setDownloading(type);
    try {
      const res = await fetch(`/api/dashboard/data-export?type=${type}`);
      if (res.status === 429) {
        toast.error(t("settings.export.rateLimit", lang));
        return;
      }
      if (!res.ok) {
        toast.error(t("settings.export.downloadFailed", lang));
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `capta-${type}-export.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("settings.export.downloadFailed", lang));
    } finally {
      setDownloading(null);
    }
  };

  const exportTypes: { key: "calls" | "customers" | "appointments" | "invoices"; labelKey: string; icon: React.ReactNode }[] = [
    {
      key: "calls",
      labelKey: "settings.export.calls",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      ),
    },
    {
      key: "customers",
      labelKey: "settings.export.customers",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      key: "appointments",
      labelKey: "settings.export.appointments",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      key: "invoices",
      labelKey: "settings.export.invoices",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
    },
  ];

  return (
    <Card title={t("settings.export.title", lang)}>
      <p className="text-sm mb-4" style={{ color: "var(--db-text-muted)" }}>
        {t("settings.export.description", lang)}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {exportTypes.map((item) => (
          <button
            key={item.key}
            onClick={() => handleExport(item.key)}
            disabled={downloading !== null}
            className="flex items-center gap-3 rounded-lg p-3 text-left transition-colors"
            style={{
              background: "var(--db-hover)",
              border: "1px solid var(--db-border)",
              opacity: downloading !== null && downloading !== item.key ? 0.5 : 1,
            }}
          >
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ background: "rgba(212, 168, 67, 0.1)", color: "#D4A843" }}
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                {t(item.labelKey, lang)}
              </p>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                {downloading === item.key ? t("settings.export.downloading", lang) : "CSV"}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--db-text-muted)", flexShrink: 0 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        ))}
      </div>
      <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--db-border)" }}>
        <button
          onClick={() => handleExport("all")}
          disabled={downloading !== null}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          style={{
            background: "var(--db-accent)",
            color: "#fff",
            opacity: downloading !== null ? 0.6 : 1,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {downloading === "all" ? t("settings.export.downloading", lang) : t("settings.export.all", lang)}
        </button>
      </div>
    </Card>
  );
}

function GoogleCalendarSection({ lang }: { lang: Lang }) {
  const [status, setStatus] = useState<GCalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/integrations/google/status")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setStatus(d))
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false));

    // Check for gcal query param from OAuth callback
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const gcal = params.get("gcal");
      if (gcal === "connected") {
        toast.success(t("settings.toast.gcalConnected", lang));
        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete("gcal");
        window.history.replaceState({}, "", url.pathname + url.hash);
      } else if (gcal === "error") {
        toast.error(t("settings.toast.gcalFailedConnect", lang));
        const url = new URL(window.location.href);
        url.searchParams.delete("gcal");
        url.searchParams.delete("reason");
        window.history.replaceState({}, "", url.pathname + url.hash);
      }
    }
  }, [lang]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/dashboard/integrations/google/auth");
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t("settings.toast.gcalFailedStart", lang));
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      toast.error(t("settings.toast.failedConnect", lang));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/dashboard/integrations/google/auth", { method: "DELETE" });
      if (res.ok) {
        setStatus({ connected: false });
        toast.success(t("settings.toast.gcalDisconnected", lang));
      } else {
        toast.error(t("settings.toast.failedDisconnect", lang));
      }
    } catch {
      toast.error(t("settings.toast.failedDisconnect", lang));
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <Card title={t("settings.integrations", lang)}>
        <div className="flex items-center gap-2">
          <CaptaSpinnerInline />
          <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>{t("action.loading", lang)}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card title={t("settings.googleCalendar", lang)}>
      <div className="space-y-4">
        {status?.connected ? (
          <>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: "rgba(66, 133, 244, 0.1)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="#4285F4" strokeWidth="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                  {t("settings.connected", lang)}
                </p>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                  {status.googleEmail}
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ background: "var(--db-success-bg)", color: "var(--db-success)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--db-success)" }} />
                {t("settings.active", lang)}
              </span>
            </div>

            {status.lastSyncAt && (
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                {t("settings.lastSync", lang)} {new Date(status.lastSyncAt).toLocaleString()}
              </p>
            )}

            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              {t("settings.gcalConnectedDesc", lang)}
            </p>

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: "var(--db-surface)",
                border: "1px solid var(--db-border)",
                color: "var(--db-danger)",
              }}
            >
              {disconnecting ? t("settings.disconnecting", lang) : t("settings.disconnect", lang)}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: "var(--db-surface)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="var(--db-text-muted)" strokeWidth="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="var(--db-text-muted)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                  {t("settings.googleCalendar", lang)}
                </p>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                  {t("settings.gcalDesc", lang)}
                </p>
              </div>
            </div>

            <div className="rounded-lg p-3" style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                {t("settings.gcalFeatures", lang)}
              </p>
              <ul className="mt-2 space-y-1 text-xs" style={{ color: "var(--db-text-secondary)" }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: "#22c55e" }}>&#10003;</span>
                  {t("settings.gcalFeature1", lang)}
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: "#22c55e" }}>&#10003;</span>
                  {t("settings.gcalFeature2", lang)}
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: "#22c55e" }}>&#10003;</span>
                  {t("settings.gcalFeature3", lang)}
                </li>
              </ul>
            </div>

            <button
              onClick={handleConnect}
              disabled={connecting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
              style={{ background: "#4285F4" }}
            >
              {connecting ? t("settings.connecting", lang) : t("settings.connectGoogleCalendar", lang)}
            </button>
          </>
        )}
      </div>
    </Card>
  );
}

/* ── Toggle Switch component ── */

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors"
      style={{ background: checked ? "var(--db-accent)" : "var(--db-border)" }}
    >
      <span
        className="inline-block h-5 w-5 rounded-full transition-transform"
        style={{
          background: "#fff",
          transform: checked ? "translateX(22px)" : "translateX(2px)",
          marginTop: "2px",
        }}
      />
    </button>
  );
}
