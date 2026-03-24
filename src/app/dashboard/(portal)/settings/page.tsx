"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import LoadingSpinner from "@/app/dashboard/_components/loading-spinner";
import { CaptaSpinnerInline } from "@/components/capta-spinner";
import WebhookManager from "@/components/webhook-manager";

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

type SettingsTab = "general" | "receptionist" | "responses" | "notifications" | "pricing" | "automations" | "integrations";

const SETTINGS_TABS: { key: SettingsTab; label: string }[] = [
  { key: "general", label: "General" },
  { key: "receptionist", label: "Receptionist" },
  { key: "responses", label: "Custom Responses" },
  { key: "notifications", label: "Notifications" },
  { key: "pricing", label: "Pricing" },
  { key: "automations", label: "Automations" },
  { key: "integrations", label: "Integrations" },
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
  { key: "professional", label: "Professional", desc: "Polished and efficient. Gets straight to business.", color: "#3B82F6", icon: "briefcase" },
  { key: "friendly", label: "Friendly", desc: "Warm and approachable. Makes every caller feel welcome.", color: "#10B981", icon: "smile" },
  { key: "warm", label: "Warm & Caring", desc: "Extra empathetic. Perfect for sensitive clients.", color: "#F59E0B", icon: "heart" },
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
const DAY_LABELS: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
  Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
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

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits[0] === "1") {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

interface FieldError {
  field: string;
  message: string;
}

function validateField(field: string, value: string): string | null {
  switch (field) {
    case "name":
    case "ownerName":
      if (!value.trim()) return "This field is required";
      if (value.length > 100) return "Max 100 characters";
      return null;
    case "ownerEmail":
      if (!value.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address";
      return null;
    case "ownerPhone":
    case "emergencyPhone":
      if (field === "ownerPhone" && !value.trim()) return "Phone is required";
      if (value.trim() && !/^\+?1?\d{10,11}$/.test(value.replace(/\D/g, ""))) return "Invalid US phone number";
      return null;
    case "serviceArea":
      if (value.length > 200) return "Max 200 characters";
      return null;
    case "additionalInfo":
      if (value.length > 1000) return "Max 1000 characters";
      return null;
    case "greeting":
    case "greetingEs":
      if (value.length > 500) return "Max 500 characters";
      return null;
    default:
      return null;
  }
}

function VoicePreviewButton({ voiceId, name, greeting }: { voiceId: string; name: string; greeting: string | null }) {
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
      {playing ? "Stop" : "Preview"}
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as SettingsTab;
      if (SETTINGS_TABS.some((t) => t.key === hash)) return hash;
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

  useEffect(() => {
    fetch("/api/dashboard/settings")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load settings");
        return r.json();
      })
      .then((d: SettingsData) => {
        setData(d);
        setInitialData(JSON.stringify(d));
      })
      .catch(() => setError("Failed to load settings"));

    // Fetch pricing data
    fetch("/api/dashboard/pricing")
      .then((r) => r.ok ? r.json() : { pricing: [] })
      .then((d) => {
        setPricing(d.pricing || []);
        setPricingEnabled(d.pricing?.length > 0);
      })
      .catch(() => setPricing([]))
      .finally(() => setPricingLoading(false));

    // Fetch estimate pricing data + mode
    fetch("/api/dashboard/estimate-pricing")
      .then((r) => r.ok ? r.json() : { ranges: [], mode: "quick" })
      .then((d) => {
        setEstimateRanges(d.ranges || []);
        if (d.mode) setEstimateMode(d.mode);
      })
      .catch(() => setEstimateRanges([]))
      .finally(() => setEstimateRangesLoading(false));

    // Fetch custom responses
    fetch("/api/receptionist/responses")
      .then((r) => r.ok ? r.json() : { responses: {} })
      .then((d) => setCustomResponses(d.responses || {}))
      .catch(() => {});
  }, []);

  // Sync tab with URL hash
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "") as SettingsTab;
      if (SETTINGS_TABS.some((t) => t.key === hash)) setActiveTab(hash);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const switchTab = useCallback((tab: SettingsTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  }, []);

  const isDirty = data ? JSON.stringify(data) !== initialData : false;

  const setField = useCallback(<K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setData((prev) => prev ? { ...prev, [key]: value } : prev);
    setSuccessMsg(null);
  }, []);

  const handleBlur = useCallback((field: string, value: string) => {
    const err = validateField(field, value);
    setFieldErrors((prev) => {
      const filtered = prev.filter((e) => e.field !== field);
      if (err) filtered.push({ field, message: err });
      return filtered;
    });
  }, []);

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
      const err = validateField(field, val);
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
        throw new Error(errData?.error || "Failed to save settings");
      }

      const updated: SettingsData = await res.json();
      setData(updated);
      setInitialData(JSON.stringify(updated));
      setSuccessMsg("Settings saved successfully");
      toast.success("Settings saved — changes take effect on the next call");
      setFieldErrors([]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save settings";
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
      <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
        <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
      </div>
    );
  }

  if (!data) return <LoadingSpinner message="Loading settings..." />;

  const rName = data.receptionistName || "Maria";
  const defaultGreeting = `Thank you for calling ${data.name}, this is ${rName}. How can I help you?`;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-body), system-ui, sans-serif", color: "var(--db-text)" }}
          >
            Settings
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
            Customize {rName} and your business information
          </p>
        </div>
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
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div
          className="rounded-xl p-4 flex items-center gap-2"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}
        >
          <span style={{ color: "#4ade80" }}>&#10003;</span>
          <p className="text-sm font-medium" style={{ color: "#4ade80" }}>{successMsg}</p>
        </div>
      )}

      {/* Error Banner */}
      {error && data && (
        <div
          className="rounded-xl p-4 flex items-center gap-2"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
        >
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
        </div>
      )}

      {/* AI Status Banner */}
      <div
        className="flex items-center gap-3 rounded-xl p-4"
        style={{
          background: data.active ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
          border: `1px solid ${data.active ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
        }}
      >
        <span className="relative flex h-3 w-3">
          {data.active && (
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ background: "#4ade80" }}
            />
          )}
          <span
            className="relative inline-flex h-3 w-3 rounded-full"
            style={{ background: data.active ? "#4ade80" : "#f87171" }}
          />
        </span>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
            {rName} — {data.active ? "Active" : "Inactive"}
          </p>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {data.active ? `${rName} is answering calls 24/7` : "Contact support to reactivate"}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="flex gap-1 overflow-x-auto rounded-xl p-1"
        style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
      >
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => switchTab(tab.key)}
            className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.key ? "var(--db-accent)" : "transparent",
              color: activeTab === tab.key ? "#fff" : "var(--db-text-muted)",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ GENERAL TAB ═══ */}
      {activeTab === "general" && <>

      {/* ── Section: Business Information ── */}
      <Card title="Business Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Business Name"
            value={data.name}
            onChange={(v) => setField("name", v)}
            onBlur={() => handleBlur("name", data.name)}
            error={getFieldError("name")}
            required
          />
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--db-text-muted)" }}>
              Industry
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
              <span className="ml-2 text-xs opacity-60">(read-only)</span>
            </div>
          </div>
          <InputField
            label="Service Area"
            value={data.serviceArea || ""}
            onChange={(v) => setField("serviceArea", v || null)}
            onBlur={() => handleBlur("serviceArea", data.serviceArea || "")}
            error={getFieldError("serviceArea")}
            placeholder="e.g. San Antonio and surrounding areas"
          />
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--db-text-muted)" }}>
              AI Phone Number
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
              <span className="ml-2 text-xs opacity-60" style={{ color: "var(--db-text-muted)" }}>(managed by Capta)</span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--db-text-muted)" }}>
              Business Description
            </label>
            <textarea
              value={data.additionalInfo || ""}
              onChange={(e) => setField("additionalInfo", e.target.value || null)}
              onBlur={() => handleBlur("additionalInfo", data.additionalInfo || "")}
              rows={3}
              maxLength={1000}
              placeholder="Extra context for your AI receptionist (e.g. specialties, policies)"
              className="w-full rounded-lg px-3 py-2 text-sm resize-none"
              style={{
                background: "var(--db-bg)",
                border: `1px solid ${getFieldError("additionalInfo") ? "#f87171" : "var(--db-border)"}`,
                color: "var(--db-text)",
              }}
            />
            <div className="flex justify-between mt-1">
              {getFieldError("additionalInfo") && (
                <span className="text-xs" style={{ color: "#f87171" }}>{getFieldError("additionalInfo")}</span>
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
      <Card title="Your Receptionist">
        <div className="space-y-4">
          <InputField
            label="Name"
            value={data.receptionistName || "Maria"}
            onChange={(v) => {
              const val = v.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑüÜ\s]/g, "");
              if (val.length <= 20) setField("receptionistName", val);
            }}
            placeholder="Maria"
          />
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--db-text-muted)" }}>
              Personality
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
                  <p className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>{p.label}</p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--db-text-muted)" }}>{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Section: Voice ── */}
      <Card title={`${rName}'s Voice`}>
        <p className="text-sm mb-3" style={{ color: "var(--db-text-muted)" }}>
          Choose how {rName} sounds on calls. Click the play button to preview.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", desc: "Professional" },
            { id: "jBpfAFnaylXS5xpurlZD", name: "Lily", desc: "Friendly" },
            { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", desc: "Warm" },
            { id: "pFZP5JQG7iQjIQuC4Bku", name: "Rachel", desc: "Clear" },
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
                <p className="mt-0.5 text-xs" style={{ color: "var(--db-text-muted)" }}>{voice.desc}</p>
              </button>
              <VoicePreviewButton voiceId={voice.id} name={voice.name} greeting={data.greeting} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
          Voice changes take effect on the next call.
        </p>
      </Card>

      {/* ── Section: Special Instructions ── */}
      <Card title={`${rName}'s Special Instructions`}>
        <p className="text-sm mb-3" style={{ color: "var(--db-text-muted)" }}>
          Customize how {rName} sounds on calls. These instructions shape her tone and behavior.
        </p>
        <textarea
          value={data.personalityNotes || ""}
          onChange={(e) => setField("personalityNotes", e.target.value || null)}
          onBlur={() => handleBlur("personalityNotes", data.personalityNotes || "")}
          rows={4}
          maxLength={1000}
          placeholder={"Examples:\n• Be extra friendly and casual\n• Always mention we offer military discounts\n• If someone asks about pricing, say we offer free estimates\n• Mention our satisfaction guarantee"}
          className="w-full rounded-lg px-3 py-2 text-sm resize-none"
          style={{
            background: "var(--db-bg)",
            border: `1px solid var(--db-border)`,
            color: "var(--db-text)",
          }}
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
      <Card title="Owner Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Owner Name"
            value={data.ownerName}
            onChange={(v) => setField("ownerName", v)}
            onBlur={() => handleBlur("ownerName", data.ownerName)}
            error={getFieldError("ownerName")}
            required
          />
          <InputField
            label="Email"
            type="email"
            value={data.ownerEmail || ""}
            onChange={(v) => setField("ownerEmail", v)}
            onBlur={() => handleBlur("ownerEmail", data.ownerEmail || "")}
            error={getFieldError("ownerEmail")}
            required
          />
          <InputField
            label="Phone"
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
      <SecuritySection />

      </>}

      {/* ═══ NOTIFICATIONS TAB ═══ */}
      {activeTab === "notifications" && <>

      {/* ── Section: Weekly Digest ── */}
      <Card title="Weekly Digest">
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            Get a weekly performance report every Monday — calls answered, appointments booked, revenue estimates, and more.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                Enable Weekly Digest
              </p>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Performance report delivered every Monday</p>
            </div>
            <ToggleSwitch
              checked={data.enableWeeklyDigest}
              onChange={(v) => setData({ ...data, enableWeeklyDigest: v })}
            />
          </div>
          {data.enableWeeklyDigest && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--db-text-muted)" }}>
                Delivery Method
              </label>
              <div className="flex gap-2">
                {[
                  { value: "both", label: "Email + SMS" },
                  { value: "email", label: "Email Only" },
                  { value: "sms", label: "SMS Only" },
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
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Section: Daily Report ── */}
      <Card title="Daily Report">
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {data.receptionistName || "Maria"} sends you a daily end-of-day briefing with new leads, estimates, tomorrow&apos;s appointments, and action items.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                Enable Daily Summary
              </p>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>End-of-day briefing with key stats and action items</p>
            </div>
            <ToggleSwitch
              checked={data.enableDailySummary}
              onChange={(v) => setData({ ...data, enableDailySummary: v })}
            />
          </div>
          {data.enableDailySummary && (
            <>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--db-text-muted)" }}>
                  How do you want to receive your daily report?
                </label>
                <div className="flex gap-2">
                  {[
                    { value: "sms", label: "Text Message" },
                    { value: "email", label: "Email" },
                    { value: "both", label: "Both" },
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
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--db-text-muted)" }}>
                  Delivery Time
                </label>
                <select
                  value={data.digestTime}
                  onChange={(e) => setData({ ...data, digestTime: e.target.value })}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
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
      <Card title="Automated Features">
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            Toggle automated SMS features that run in the background to help you grow.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>Google Review Requests</p>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Auto-text customers after appointments asking for a Google review</p>
            </div>
            <ToggleSwitch checked={data.enableReviewRequests} onChange={(v) => setField("enableReviewRequests", v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>Missed Call Recovery</p>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Auto-text callers who hang up within 15 seconds to recover the lead</p>
            </div>
            <ToggleSwitch checked={data.enableMissedCallRecovery} onChange={(v) => setField("enableMissedCallRecovery", v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>Customer Recall</p>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Remind past customers when seasonal maintenance is due</p>
            </div>
            <ToggleSwitch checked={data.enableCustomerRecall} onChange={(v) => setField("enableCustomerRecall", v)} />
          </div>
        </div>
      </Card>

      {/* ── Section: Call Notifications ── */}
      <Card title="Call Notifications">
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            Control when and how you receive notifications about calls.
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
                <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>Every call</p>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Get an SMS after every answered call</p>
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
                <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>Missed calls only</p>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Only get notified when a call is missed or abandoned</p>
              </div>
            </label>
          </div>
        </div>
      </Card>

      {/* ── Section: Quiet Hours ── */}
      <Card title="Quiet Hours">
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            No owner notifications will be sent during these hours (except emergencies). Skipped notifications are included in your daily digest instead.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--db-text-muted)" }}>Start</label>
              <select
                value={data.ownerQuietHoursStart}
                onChange={(e) => setField("ownerQuietHoursStart", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
              >
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{formatTime12(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--db-text-muted)" }}>End</label>
              <select
                value={data.ownerQuietHoursEnd}
                onChange={(e) => setField("ownerQuietHoursEnd", e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
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
              Current window: {formatTime12(data.ownerQuietHoursStart)} &mdash; {formatTime12(data.ownerQuietHoursEnd)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
              {data.receptionistName || "Maria"} still answers calls 24/7 &mdash; only your personal notifications are paused.
            </p>
          </div>
        </div>
      </Card>

      </>}

      {/* ═══ AUTOMATIONS TAB ═══ */}
      {activeTab === "automations" && <>

      {/* ── Section: Google Review Requests ── */}
      <Card title="Google Review Requests">
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            Automatically text customers 24 hours after their appointment asking for a Google review. Bilingual EN/ES, max once per customer every 90 days.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                Enable Review Requests
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
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--db-text)" }}>
                Google Review URL
              </label>
              <input
                type="url"
                value={data.googleReviewUrl || ""}
                onChange={(e) => setData({ ...data, googleReviewUrl: e.target.value })}
                placeholder="https://g.page/r/your-business/review"
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  background: "var(--db-surface)",
                  border: "1px solid var(--db-border)",
                  color: "var(--db-text)",
                }}
              />
              <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
                Find your link in Google Business Profile → Share review form
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* ── Section: Missed Call Recovery ── */}
      <Card title="Missed Call Recovery">
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            If a caller hangs up within 15 seconds, automatically text them to recover the lead. They can reply YES to request a callback.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                Enable Missed Call Recovery
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
      <Card title="Business Hours">
        <div className="space-y-3">
          {DAY_KEYS.map((day) => {
            const hours = data.businessHours[day];
            const isClosed = !hours || hours.closed;
            return (
              <div key={day} className="flex items-center gap-3 py-1">
                <span className="text-sm font-medium w-24 shrink-0" style={{ color: "var(--db-text)" }}>
                  {DAY_LABELS[day]}
                </span>
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  {!isClosed ? (
                    <>
                      <select
                        value={hours?.open || "08:00"}
                        onChange={(e) => updateHours(day, "open", e.target.value)}
                        className="rounded-lg px-2 py-1.5 text-sm"
                        style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{formatTime12(t)}</option>
                        ))}
                      </select>
                      <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>to</span>
                      <select
                        value={hours?.close || "17:00"}
                        onChange={(e) => updateHours(day, "close", e.target.value)}
                        className="rounded-lg px-2 py-1.5 text-sm"
                        style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{formatTime12(t)}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>Closed</span>
                  )}
                </div>
                <button
                  onClick={() => toggleDayClosed(day)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0"
                  style={{
                    background: isClosed ? "rgba(239,68,68,0.1)" : "rgba(74,222,128,0.08)",
                    color: isClosed ? "#f87171" : "#4ade80",
                    border: `1px solid ${isClosed ? "rgba(239,68,68,0.2)" : "rgba(74,222,128,0.2)"}`,
                  }}
                >
                  {isClosed ? "Closed" : "Open"}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--db-text-muted)" }}>
          {rName} answers calls 24/7, but appointments are only scheduled during business hours.
        </p>
      </Card>

      {/* ── Section: Services ── */}
      <Card title="Services Your AI Can Book">
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
                style={{ color: "#f87171" }}
                title="Remove service"
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
              placeholder="Add a service..."
              maxLength={50}
              className="flex-1 rounded-lg px-3 py-2 text-sm"
              style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
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
              Add
            </button>
          </div>
        )}
        <p className="mt-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
          {data.services.length}/20 services
        </p>
      </Card>

      </>}

      {/* ═══ AUTOMATIONS TAB (Service Pricing) ═══ */}
      {activeTab === "automations" && <>

      {/* ── Section: Service Pricing ── */}
      <Card title="Service Pricing">
        <div className="space-y-4">
          {/* Master toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                Enable {rName} to discuss pricing
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
                When enabled, {rName} will quote ballpark prices with a &quot;final price may vary&quot; disclaimer
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
                  toast.success(newVal ? "Pricing quotes enabled" : "Pricing quotes disabled");
                } catch {
                  setPricingEnabled(!newVal);
                  toast.error("Failed to toggle pricing");
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
                <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>Loading pricing...</p>
              ) : (
                <div className="space-y-2">
                  {pricing.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg p-3"
                      style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)" }}
                    >
                      {editingPriceId === p.id ? (
                        <>
                          <input
                            type="text"
                            value={editingPriceData.serviceName}
                            onChange={(e) => setEditingPriceData((d) => ({ ...d, serviceName: e.target.value }))}
                            className="flex-1 min-w-[120px] rounded px-2 py-1 text-sm"
                            style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>$</span>
                            <input
                              type="number"
                              value={editingPriceData.priceMin}
                              onChange={(e) => setEditingPriceData((d) => ({ ...d, priceMin: e.target.value }))}
                              className="w-20 rounded px-2 py-1 text-sm"
                              style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                              placeholder="Min"
                            />
                            <span style={{ color: "var(--db-text-muted)" }}>—</span>
                            <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>$</span>
                            <input
                              type="number"
                              value={editingPriceData.priceMax}
                              onChange={(e) => setEditingPriceData((d) => ({ ...d, priceMax: e.target.value }))}
                              className="w-20 rounded px-2 py-1 text-sm"
                              style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                              placeholder="Max"
                            />
                          </div>
                          <select
                            value={editingPriceData.unit}
                            onChange={(e) => setEditingPriceData((d) => ({ ...d, unit: e.target.value }))}
                            className="rounded px-2 py-1 text-xs"
                            style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                          >
                            <option value="per_job">per job</option>
                            <option value="per_hour">per hour</option>
                            <option value="per_sqft">per sq ft</option>
                            <option value="per_unit">per unit</option>
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
                                  toast.success("Pricing updated");
                                }
                              } catch {
                                toast.error("Failed to save");
                              }
                            }}
                            className="rounded px-2 py-1 text-xs font-medium"
                            style={{ background: "var(--db-accent)", color: "#fff" }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPriceId(null)}
                            className="rounded px-2 py-1 text-xs"
                            style={{ color: "var(--db-text-muted)" }}
                          >
                            Cancel
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
                              ? `from $${p.priceMin}`
                              : p.priceMax != null
                              ? `up to $${p.priceMax}`
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
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDeletePriceId(p.id)}
                            className="text-xs"
                            style={{ color: "#f87171" }}
                          >
                            Delete
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
                    placeholder="Service name"
                    className="flex-1 min-w-[120px] rounded px-2 py-1 text-sm"
                    style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>$</span>
                    <input
                      type="number"
                      value={newPriceRow.priceMin}
                      onChange={(e) => setNewPriceRow({ ...newPriceRow, priceMin: e.target.value })}
                      placeholder="Min"
                      className="w-20 rounded px-2 py-1 text-sm"
                      style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                    />
                    <span style={{ color: "var(--db-text-muted)" }}>—</span>
                    <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>$</span>
                    <input
                      type="number"
                      value={newPriceRow.priceMax}
                      onChange={(e) => setNewPriceRow({ ...newPriceRow, priceMax: e.target.value })}
                      placeholder="Max"
                      className="w-20 rounded px-2 py-1 text-sm"
                      style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                    />
                  </div>
                  <select
                    value={newPriceRow.unit}
                    onChange={(e) => setNewPriceRow({ ...newPriceRow, unit: e.target.value })}
                    className="rounded px-2 py-1 text-xs"
                    style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                  >
                    <option value="per_job">per job</option>
                    <option value="per_hour">per hour</option>
                    <option value="per_sqft">per sq ft</option>
                    <option value="per_unit">per unit</option>
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
                          toast.success("Pricing added");
                        }
                      } catch {
                        toast.error("Failed to add pricing");
                      }
                    }}
                    disabled={!newPriceRow.serviceName.trim()}
                    className="rounded px-2 py-1 text-xs font-medium"
                    style={{ background: "var(--db-accent)", color: "#fff", opacity: newPriceRow.serviceName.trim() ? 1 : 0.5 }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setNewPriceRow(null)}
                    className="rounded px-2 py-1 text-xs"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setNewPriceRow({ serviceName: "", priceMin: "", priceMax: "", unit: "per_job" })}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  style={{ background: "var(--db-hover)", color: "var(--db-text-secondary)", border: "1px dashed var(--db-border)" }}
                >
                  + Add Service Pricing
                </button>
              )}
            </>
          )}
        </div>
      </Card>

      {/* ── Import Data ── */}
      <Card title="Import Your Data">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: "var(--db-text)" }}>
              Switching from another system? Import your customers, appointments, and estimates from a CSV file.
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
              Supports exports from Jobber, ServiceTitan, Housecall Pro, and more.
            </p>
          </div>
          <a
            href="/dashboard/import"
            className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ background: "var(--db-accent)" }}
          >
            Import Data
          </a>
        </div>
      </Card>

      </>}

      {/* ═══ RECEPTIONIST TAB (Greeting + Language + Emergency) ═══ */}
      {activeTab === "receptionist" && <>

      {/* ── Section: Greeting ── */}
      <Card title={`${rName}'s Greeting`}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--db-text-muted)" }}>
              English Greeting
            </label>
            <textarea
              value={data.greeting || ""}
              onChange={(e) => setField("greeting", e.target.value || null)}
              onBlur={() => handleBlur("greeting", data.greeting || "")}
              rows={3}
              maxLength={500}
              placeholder={defaultGreeting}
              className="w-full rounded-lg px-3 py-2 text-sm resize-none"
              style={{
                background: "var(--db-bg)",
                border: `1px solid ${getFieldError("greeting") ? "#f87171" : "var(--db-border)"}`,
                color: "var(--db-text)",
              }}
            />
            <div className="flex justify-between mt-1">
              {getFieldError("greeting") && (
                <span className="text-xs" style={{ color: "#f87171" }}>{getFieldError("greeting")}</span>
              )}
              <span className="text-xs ml-auto" style={{ color: "var(--db-text-muted)" }}>
                {(data.greeting || "").length}/500
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--db-text-muted)" }}>
              Spanish Greeting
            </label>
            <textarea
              value={data.greetingEs || ""}
              onChange={(e) => setField("greetingEs", e.target.value || null)}
              onBlur={() => handleBlur("greetingEs", data.greetingEs || "")}
              rows={3}
              maxLength={500}
              placeholder={`Gracias por llamar a ${data.name}, habla ${rName}. ¿En qué le puedo ayudar?`}
              className="w-full rounded-lg px-3 py-2 text-sm resize-none"
              style={{
                background: "var(--db-bg)",
                border: `1px solid ${getFieldError("greetingEs") ? "#f87171" : "var(--db-border)"}`,
                color: "var(--db-text)",
              }}
            />
            <div className="flex justify-between mt-1">
              {getFieldError("greetingEs") && (
                <span className="text-xs" style={{ color: "#f87171" }}>{getFieldError("greetingEs")}</span>
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
            {showGreetingPreview ? "Hide Preview" : "Preview Greeting"}
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
                When someone calls, {rName} will say:
              </p>
              <p className="text-sm italic" style={{ color: "var(--db-text)" }}>
                &ldquo;{data.greeting || defaultGreeting}&rdquo;
              </p>
              {(data.greetingEs || data.defaultLanguage === "es") && (
                <>
                  <p className="text-xs font-medium mt-3 mb-2" style={{ color: "var(--db-text-muted)" }}>
                    For Spanish callers:
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
      <Card title="Language Preference">
        <div className="flex gap-4">
          {(["en", "es"] as const).map((lang) => (
            <label
              key={lang}
              className="flex items-center gap-2 cursor-pointer rounded-lg px-4 py-3 transition-colors"
              style={{
                background: data.defaultLanguage === lang ? "rgba(99,102,241,0.08)" : "var(--db-hover)",
                border: `1px solid ${data.defaultLanguage === lang ? "rgba(99,102,241,0.3)" : "var(--db-border)"}`,
              }}
            >
              <input
                type="radio"
                name="language"
                value={lang}
                checked={data.defaultLanguage === lang}
                onChange={() => setField("defaultLanguage", lang)}
                className="accent-[var(--db-accent)]"
              />
              <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                {lang === "en" ? "English" : "Spanish"}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
          {rName} is bilingual and will switch languages automatically. This sets the default.
        </p>
      </Card>

      {/* ── Section: Emergency Contact ── */}
      <Card title="Emergency Contact">
        <InputField
          label="Emergency Phone Number"
          value={data.emergencyPhone || ""}
          onChange={(v) => setField("emergencyPhone", v || null)}
          onBlur={() => handleBlur("emergencyPhone", data.emergencyPhone || "")}
          error={getFieldError("emergencyPhone")}
          placeholder="+15125559999"
        />
        <p className="mt-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
          If set, {rName} will SMS this number in addition to the owner during emergency transfers.
          Leave blank to only notify the owner phone.
        </p>
      </Card>

      </>}

      {/* ═══ CUSTOM RESPONSES TAB ═══ */}
      {activeTab === "responses" && <>

      {/* ── Section: Train Your Receptionist ── */}
      <Card title={`Train ${rName}`}>
        <p className="text-sm mb-4" style={{ color: "var(--db-text-muted)" }}>
          Teach {rName} custom responses for common questions, off-limits topics, preferred phrases, and additional emergency triggers.
        </p>
        <div className="space-y-2">
          {([
            { key: "faq", label: "FAQ Responses", desc: "Custom answers to common questions", max: 20, hasResponse: true },
            { key: "off_limits", label: "Off-Limits Topics", desc: "Topics to avoid, with optional redirect", max: 10, hasResponse: true },
            { key: "phrase", label: "Preferred Phrases", desc: "Phrases to naturally weave in", max: 10, hasResponse: false },
            { key: "emergency_keyword", label: "Emergency Keywords", desc: "Additional emergency triggers", max: 10, hasResponse: false },
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
                    <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{cat.label}</p>
                    <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{cat.desc} ({items.length}/{cat.max})</p>
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
                            if (!confirm("Remove this response?")) return;
                            await fetch(`/api/receptionist/responses/${item.id}`, { method: "DELETE" });
                            setCustomResponses((prev) => ({
                              ...prev,
                              [cat.key]: prev[cat.key].filter((r) => r.id !== item.id),
                            }));
                            toast.success("Removed");
                          }}
                          className="shrink-0 p-1 rounded transition-colors"
                          style={{ color: "#ef4444" }}
                          title="Delete"
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
                          placeholder={cat.key === "faq" ? "Question or topic..." : cat.key === "off_limits" ? "Topic to avoid..." : cat.key === "phrase" ? "Phrase to use..." : "Emergency keyword..."}
                          className="w-full rounded-lg px-3 py-1.5 text-sm"
                          style={{ background: "var(--db-card)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                          maxLength={200}
                        />
                        {cat.hasResponse && (
                          <input
                            type="text"
                            value={newResponse.responseText}
                            onChange={(e) => setNewResponse({ ...newResponse, responseText: e.target.value })}
                            placeholder={cat.key === "faq" ? "Answer..." : "Redirect message (optional)..."}
                            className="w-full rounded-lg px-3 py-1.5 text-sm"
                            style={{ background: "var(--db-card)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
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
                                toast.success("Added");
                              } else {
                                const err = await res.json().catch(() => null);
                                toast.error(err?.error || "Failed to add");
                              }
                            }}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                            style={{ background: "var(--db-accent)" }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setNewResponse(null)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium"
                            style={{ color: "var(--db-text-muted)", border: "1px solid var(--db-border)" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : items.length < cat.max && (
                      <button
                        onClick={() => setNewResponse({ category: cat.key, triggerText: "", responseText: "" })}
                        className="w-full rounded-lg py-2 text-xs font-medium transition-colors"
                        style={{ color: "var(--db-text-secondary)", border: "1px dashed var(--db-border)" }}
                      >
                        + Add {cat.label.replace(/s$/, "")}
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
      <Card title="Estimate Mode">
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            Choose how {data?.receptionistName || "Maria"} quotes prices to callers. Quick mode uses flat min/max ranges. Advanced mode uses formula-based calculations with multipliers.
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
                    toast.success(`Estimate mode set to ${mode}`);
                  } catch {
                    toast.error("Failed to update estimate mode");
                  }
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: estimateMode === mode ? "var(--db-accent)" : "var(--db-hover)",
                  color: estimateMode === mode ? "#fff" : "var(--db-text)",
                  border: `1px solid ${estimateMode === mode ? "var(--db-accent)" : "var(--db-border)"}`,
                }}
              >
                {mode === "quick" ? "Quick Setup" : mode === "advanced" ? "Advanced" : "Both"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Section: Quick Pricing Ranges ── */}
      <Card title="Pricing Ranges">
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            Set min/max price ranges for common job types. {data?.receptionistName || "Maria"} will share these as ballpark estimates with callers.
          </p>

          {estimateRangesLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : (
            <div className="space-y-2">
              {estimateRanges.filter((r) => r.mode === "quick").map((range) => (
                <div
                  key={range.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
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
                          toast.success("Pricing range removed");
                        } catch {
                          toast.error("Failed to delete");
                        }
                        setConfirmDeleteEstimateId(null);
                      } else {
                        setConfirmDeleteEstimateId(range.id);
                        setTimeout(() => setConfirmDeleteEstimateId(null), 3000);
                      }
                    }}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: confirmDeleteEstimateId === range.id ? "#ef4444" : "var(--db-text-muted)" }}
                  >
                    {confirmDeleteEstimateId === range.id ? "Confirm?" : "×"}
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
                    placeholder="Job type (e.g. Drain Cleaning)"
                    value={newEstimateRow.jobTypeLabel}
                    onChange={(e) => setNewEstimateRow({ ...newEstimateRow, jobTypeLabel: e.target.value })}
                    className="flex-1 rounded border px-2 py-1 text-sm"
                    style={{ background: "var(--db-bg)", color: "var(--db-text)", borderColor: "var(--db-border)" }}
                  />
                  <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>$</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={newEstimateRow.minPrice}
                    onChange={(e) => setNewEstimateRow({ ...newEstimateRow, minPrice: e.target.value })}
                    className="w-20 rounded border px-2 py-1 text-sm"
                    style={{ background: "var(--db-bg)", color: "var(--db-text)", borderColor: "var(--db-border)" }}
                  />
                  <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={newEstimateRow.maxPrice}
                    onChange={(e) => setNewEstimateRow({ ...newEstimateRow, maxPrice: e.target.value })}
                    className="w-20 rounded border px-2 py-1 text-sm"
                    style={{ background: "var(--db-bg)", color: "var(--db-text)", borderColor: "var(--db-border)" }}
                  />
                  <select
                    value={newEstimateRow.unit}
                    onChange={(e) => setNewEstimateRow({ ...newEstimateRow, unit: e.target.value })}
                    className="rounded border px-2 py-1 text-sm"
                    style={{ background: "var(--db-bg)", color: "var(--db-text)", borderColor: "var(--db-border)" }}
                  >
                    <option value="per_job">per job</option>
                    <option value="per_hour">per hour</option>
                    <option value="per_room">per room</option>
                    <option value="per_sqft">per sqft</option>
                    <option value="per_unit">per unit</option>
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
                          toast.success("Pricing range added");
                        }
                      } catch {
                        toast.error("Failed to create pricing range");
                      }
                    }}
                    className="rounded px-3 py-1 text-sm font-medium"
                    style={{ background: "var(--db-accent)", color: "#fff" }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setNewEstimateRow(null)}
                    className="text-sm"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setNewEstimateRow({ jobTypeLabel: "", minPrice: "", maxPrice: "", unit: "per_job" })}
                  className="w-full rounded-lg border border-dashed py-2 text-sm"
                  style={{ borderColor: "var(--db-border)", color: "var(--db-text-muted)" }}
                >
                  + Add Job Type
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* ── Section: Advanced Formula Builder ── */}
      {(estimateMode === "advanced" || estimateMode === "both") && (
        <Card title="Advanced Formulas">
          <div className="space-y-4">
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              Formula-based pricing for complex or commercial jobs. Creates calculated estimates using intake data.
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
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                      Advanced
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          await fetch(`/api/dashboard/estimate-pricing/${range.id}`, { method: "DELETE" });
                          setEstimateRanges((prev) => prev.filter((r) => r.id !== range.id));
                          toast.success("Formula removed");
                        } catch {
                          toast.error("Failed to delete");
                        }
                      }}
                      className="text-xs"
                      style={{ color: "var(--db-text-muted)" }}
                    >
                      Remove
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
                  placeholder="Job Type Label (e.g. Apartment Complex Repaint)"
                  value={advancedFormula.jobTypeLabel}
                  onChange={(e) => setAdvancedFormula({ ...advancedFormula, jobTypeLabel: e.target.value })}
                  className="w-full rounded border px-3 py-2 text-sm"
                  style={{ background: "var(--db-bg)", color: "var(--db-text)", borderColor: "var(--db-border)" }}
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs" style={{ color: "var(--db-text-muted)" }}>Base Rate ($)</label>
                    <input
                      type="number"
                      value={advancedFormula.baseRate}
                      onChange={(e) => setAdvancedFormula({ ...advancedFormula, baseRate: e.target.value })}
                      className="w-full rounded border px-2 py-1 text-sm"
                      style={{ background: "var(--db-bg)", color: "var(--db-text)", borderColor: "var(--db-border)" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs" style={{ color: "var(--db-text-muted)" }}>Per</label>
                    <select
                      value={advancedFormula.baseUnit}
                      onChange={(e) => setAdvancedFormula({ ...advancedFormula, baseUnit: e.target.value })}
                      className="w-full rounded border px-2 py-1 text-sm"
                      style={{ background: "var(--db-bg)", color: "var(--db-text)", borderColor: "var(--db-border)" }}
                    >
                      <option value="unit">unit</option>
                      <option value="room">room</option>
                      <option value="sqft">sqft</option>
                      <option value="hour">hour</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs" style={{ color: "var(--db-text-muted)" }}>Variable Key</label>
                    <input
                      type="text"
                      placeholder="e.g. unit_count"
                      value={advancedFormula.baseUnitVariable}
                      onChange={(e) => setAdvancedFormula({ ...advancedFormula, baseUnitVariable: e.target.value })}
                      className="w-full rounded border px-2 py-1 text-sm"
                      style={{ background: "var(--db-bg)", color: "var(--db-text)", borderColor: "var(--db-border)" }}
                    />
                  </div>
                </div>

                {/* Additional rates */}
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--db-text)" }}>Additional Rates</label>
                  {advancedFormula.additionalRates.map((rate, i) => (
                    <div key={i} className="flex gap-2 mt-1">
                      <input type="number" placeholder="Rate" value={rate.rate}
                        onChange={(e) => {
                          const updated = [...advancedFormula.additionalRates];
                          updated[i] = { ...rate, rate: e.target.value };
                          setAdvancedFormula({ ...advancedFormula, additionalRates: updated });
                        }}
                        className="w-20 rounded border px-2 py-1 text-sm"
                        style={{ background: "var(--db-bg)", color: "var(--db-text)", borderColor: "var(--db-border)" }}
                      />
                      <input type="text" placeholder="per sqft" value={rate.unit}
                        onChange={(e) => {
                          const updated = [...advancedFormula.additionalRates];
                          updated[i] = { ...rate, unit: e.target.value };
                          setAdvancedFormula({ ...advancedFormula, additionalRates: updated });
                        }}
                        className="w-24 rounded border px-2 py-1 text-sm"
                        style={{ background: "var(--db-bg)", color: "var(--db-text)", borderColor: "var(--db-border)" }}
                      />
                      <input type="text" placeholder="variable key" value={rate.variable}
                        onChange={(e) => {
                          const updated = [...advancedFormula.additionalRates];
                          updated[i] = { ...rate, variable: e.target.value };
                          setAdvancedFormula({ ...advancedFormula, additionalRates: updated });
                        }}
                        className="w-28 rounded border px-2 py-1 text-sm"
                        style={{ background: "var(--db-bg)", color: "var(--db-text)", borderColor: "var(--db-border)" }}
                      />
                      <input type="text" placeholder="Label" value={rate.label}
                        onChange={(e) => {
                          const updated = [...advancedFormula.additionalRates];
                          updated[i] = { ...rate, label: e.target.value };
                          setAdvancedFormula({ ...advancedFormula, additionalRates: updated });
                        }}
                        className="flex-1 rounded border px-2 py-1 text-sm"
                        style={{ background: "var(--db-bg)", color: "var(--db-text)", borderColor: "var(--db-border)" }}
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
                  >+ Add rate</button>
                </div>

                {/* Margin range */}
                <div className="flex gap-4">
                  <div>
                    <label className="text-xs" style={{ color: "var(--db-text-muted)" }}>Margin Low (%)</label>
                    <input
                      type="number"
                      value={advancedFormula.marginLow}
                      onChange={(e) => setAdvancedFormula({ ...advancedFormula, marginLow: e.target.value })}
                      className="w-20 rounded border px-2 py-1 text-sm"
                      style={{ background: "var(--db-bg)", color: "var(--db-text)", borderColor: "var(--db-border)" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs" style={{ color: "var(--db-text-muted)" }}>Margin High (%)</label>
                    <input
                      type="number"
                      value={advancedFormula.marginHigh}
                      onChange={(e) => setAdvancedFormula({ ...advancedFormula, marginHigh: e.target.value })}
                      className="w-20 rounded border px-2 py-1 text-sm"
                      style={{ background: "var(--db-bg)", color: "var(--db-text)", borderColor: "var(--db-border)" }}
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
                          toast.success("Formula added");
                        }
                      } catch {
                        toast.error("Failed to create formula");
                      }
                    }}
                    className="rounded px-4 py-2 text-sm font-medium"
                    style={{ background: "var(--db-accent)", color: "#fff" }}
                  >
                    Save Formula
                  </button>
                  <button
                    onClick={() => setAdvancedFormula(null)}
                    className="rounded px-4 py-2 text-sm"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    Cancel
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
                + Add Advanced Formula
              </button>
            )}
          </div>
        </Card>
      )}

      </>}

      {/* ═══ AUTOMATIONS TAB (Outbound Calling) ═══ */}
      {activeTab === "automations" && <>

      {/* ── Section: Outbound Calling ── */}
      <OutboundSettingsSection />

      </>}

      {/* ═══ INTEGRATIONS TAB ═══ */}
      {activeTab === "integrations" && <>

      <GoogleCalendarSection />
      <WebhookManager />

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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      {/* Delete Pricing Confirmation */}
      {confirmDeletePriceId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
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
              Delete Pricing?
            </h3>
            <p className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
              This will remove the pricing entry. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDeletePriceId(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: "var(--db-text-secondary)" }}
              >
                Cancel
              </button>
              <button
                autoFocus
                onClick={async () => {
                  const id = confirmDeletePriceId;
                  setConfirmDeletePriceId(null);
                  try {
                    await fetch(`/api/dashboard/pricing/${id}`, { method: "DELETE" });
                    setPricing((prev) => prev.filter((x) => x.id !== id));
                    toast.success("Pricing removed");
                  } catch {
                    toast.error("Failed to delete");
                  }
                }}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ background: "#ef4444" }}
              >
                Delete
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
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--db-text-muted)" }}>
        {label}
        {required && <span style={{ color: "#f87171" }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{
          background: "var(--db-bg)",
          border: `1px solid ${error ? "#f87171" : "var(--db-border)"}`,
          color: "var(--db-text)",
        }}
      />
      {error && <p className="mt-1 text-xs" style={{ color: "#f87171" }}>{error}</p>}
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

const CALL_TYPE_LABELS: Record<string, string> = {
  appointment_reminder: "Apt Reminder",
  estimate_followup: "Estimate F/U",
  seasonal_reminder: "Seasonal",
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

function OutboundSettingsSection() {
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
      toast.success("Setting updated");
    } catch {
      toast.error("Failed to save");
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
        toast.success("Service added");
      }
    } catch {
      toast.error("Failed to add");
    } finally {
      setAddingService(false);
    }
  };

  const deleteSeasonalService = async (id: string) => {
    try {
      await fetch(`/api/dashboard/seasonal-services/${id}`, { method: "DELETE" });
      setSeasonal((prev) => prev.filter((s) => s.id !== id));
      toast.success("Service removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  if (!settings) return null;

  return (
    <Card title="Outbound Calling">
      <div className="space-y-4">
        {/* Master toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
              Enable Outbound Calls
            </p>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              Let María make calls on your behalf
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
                <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>Appointment Reminders</span>
                <ToggleSwitch
                  checked={settings.appointmentReminders}
                  onChange={(v) => updateSetting("appointmentReminders", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>Estimate Follow-ups</span>
                <ToggleSwitch
                  checked={settings.estimateFollowups}
                  onChange={(v) => updateSetting("estimateFollowups", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>Seasonal Reminders</span>
                <ToggleSwitch
                  checked={settings.seasonalReminders}
                  onChange={(v) => updateSetting("seasonalReminders", v)}
                />
              </div>
            </div>

            {/* Calling hours */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--db-text-muted)" }}>
                  Call Window Start
                </label>
                <select
                  value={settings.outboundCallingHoursStart}
                  onChange={(e) => updateSetting("outboundCallingHoursStart", e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                >
                  {Array.from({ length: 13 }, (_, i) => i + 7).map((h) => (
                    <option key={h} value={`${h.toString().padStart(2, "0")}:00`}>
                      {h > 12 ? `${h - 12}:00 PM` : h === 12 ? "12:00 PM" : `${h}:00 AM`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--db-text-muted)" }}>
                  Call Window End
                </label>
                <select
                  value={settings.outboundCallingHoursEnd}
                  onChange={(e) => updateSetting("outboundCallingHoursEnd", e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
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
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--db-text-muted)" }}>
                Max Calls Per Day
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.outboundMaxCallsPerDay}
                onChange={(e) => updateSetting("outboundMaxCallsPerDay", parseInt(e.target.value) || 20)}
                className="w-24 rounded-lg px-3 py-2 text-sm"
                style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
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
                  {showSeasonal ? "Hide Seasonal Services" : "Manage Seasonal Services"} ({seasonal.length})
                </button>

                {showSeasonal && (
                  <div className="mt-3 space-y-3">
                    {seasonal.map((svc) => (
                      <div
                        key={svc.id}
                        className="flex items-center justify-between rounded-lg p-3"
                        style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)" }}
                      >
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                            {svc.serviceName}
                          </p>
                          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                            Every {svc.reminderIntervalMonths} months
                            {svc.seasonStart && svc.seasonEnd
                              ? ` (${MONTH_LABELS[svc.seasonStart]}–${MONTH_LABELS[svc.seasonEnd]})`
                              : ""}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteSeasonalService(svc.id)}
                          className="text-xs font-medium px-2 py-1 rounded"
                          style={{ color: "#f87171" }}
                        >
                          Remove
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
                        placeholder="Service name (e.g., AC Tune-Up)"
                        className="w-full rounded px-2 py-1.5 text-sm"
                        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={newService.reminderIntervalMonths}
                          onChange={(e) => setNewService((p) => ({ ...p, reminderIntervalMonths: e.target.value }))}
                          className="rounded px-2 py-1.5 text-xs"
                          style={{ background: "var(--db-card)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                        >
                          {[3, 6, 12, 18, 24].map((m) => (
                            <option key={m} value={m}>Every {m} months</option>
                          ))}
                        </select>
                        <select
                          value={newService.seasonStart}
                          onChange={(e) => setNewService((p) => ({ ...p, seasonStart: e.target.value }))}
                          className="rounded px-2 py-1.5 text-xs"
                          style={{ background: "var(--db-card)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                        >
                          <option value="">Season start</option>
                          {MONTH_LABELS.slice(1).map((m, i) => (
                            <option key={i + 1} value={i + 1}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={newService.seasonEnd}
                          onChange={(e) => setNewService((p) => ({ ...p, seasonEnd: e.target.value }))}
                          className="rounded px-2 py-1.5 text-xs"
                          style={{ background: "var(--db-card)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                        >
                          <option value="">Season end</option>
                          {MONTH_LABELS.slice(1).map((m, i) => (
                            <option key={i + 1} value={i + 1}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        value={newService.reminderMessage}
                        onChange={(e) => setNewService((p) => ({ ...p, reminderMessage: e.target.value }))}
                        placeholder="Custom message (optional)"
                        className="w-full rounded px-2 py-1.5 text-sm"
                        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
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
                        {addingService ? "Adding..." : "Add Service"}
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
                    Total: {stats.total}
                  </span>
                  <span className="text-xs" style={{ color: "#22c55e" }}>
                    Answered: {stats.answered}
                  </span>
                  <span className="text-xs" style={{ color: "#f59e0b" }}>
                    No Answer: {stats.noAnswer}
                  </span>
                  <span className="text-xs" style={{ color: "#3b82f6" }}>
                    Scheduled: {stats.scheduled}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {calls.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2"
                      style={{ background: "var(--db-bg)", border: "1px solid var(--db-border)" }}
                    >
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{ background: `${STATUS_COLORS[c.status] ?? "#94a3b8"}15`, color: STATUS_COLORS[c.status] ?? "#94a3b8" }}
                      >
                        {CALL_TYPE_LABELS[c.callType] ?? c.callType}
                      </span>
                      <span className="flex-1 truncate text-xs" style={{ color: "var(--db-text-secondary)" }}>
                        {c.customerPhone}
                      </span>
                      <span className="text-[10px]" style={{ color: STATUS_COLORS[c.status] ?? "#94a3b8" }}>
                        {c.outcome ?? c.status}
                      </span>
                      {c.duration != null && (
                        <span className="text-[10px]" style={{ color: "var(--db-text-muted)" }}>
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
  weak: { color: "#f87171", label: "Weak", width: "33%" },
  fair: { color: "#facc15", label: "Fair", width: "66%" },
  strong: { color: "#4ade80", label: "Strong", width: "100%" },
} as const;

function SecuritySection() {
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
        setSecSuccess(hasPassword ? "Password updated" : "Password set successfully");
        setHasPassword(true);
        setPasswordChangedAt(new Date().toISOString());
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setExpanded(false);
        toast.success(hasPassword ? "Password updated" : "Password set");
      } else {
        const data = await res.json();
        setSecError(data.error || "Something went wrong");
      }
    } catch {
      setSecError("Something went wrong");
    }
    setSaving(false);
  }

  return (
    <Card title="Security">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
              Password
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
              {hasPassword
                ? passwordChangedAt
                  ? `Last changed ${new Date(passwordChangedAt).toLocaleDateString()}`
                  : "Password is set"
                : "No password set — using magic link only"}
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
            {expanded ? "Cancel" : hasPassword ? "Change" : "Set Password"}
          </button>
        </div>

        {secSuccess && !expanded && (
          <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>
            {secSuccess}
          </div>
        )}

        {expanded && (
          <div className="space-y-3 pt-2" style={{ borderTop: "1px solid var(--db-border)" }}>
            {secError && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                {secError}
              </div>
            )}

            {hasPassword && (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                  Current Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    background: "var(--db-bg)",
                    border: "1px solid var(--db-border)",
                    color: "var(--db-text)",
                  }}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 pr-9 text-sm"
                  style={{
                    background: "var(--db-bg)",
                    border: "1px solid var(--db-border)",
                    color: "var(--db-text)",
                  }}
                  placeholder="Min 8 characters"
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
                  <span className="text-xs" style={{ color: strengthCfg.color }}>{strengthCfg.label}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--db-text-muted)" }}>
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  background: "var(--db-bg)",
                  border: `1px solid ${confirmPassword && !passwordsMatch ? "#f87171" : "var(--db-border)"}`,
                  color: "var(--db-text)",
                }}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="mt-0.5 text-xs" style={{ color: "#f87171" }}>Passwords don&apos;t match</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving || !isValid}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                style={{ background: "var(--db-accent)" }}
              >
                {saving ? "Saving..." : hasPassword ? "Update Password" : "Set Password"}
              </button>
              <button
                onClick={() => { setExpanded(false); setSecError(""); }}
                className="rounded-lg px-4 py-2 text-sm transition-colors"
                style={{ color: "var(--db-text-muted)" }}
              >
                Cancel
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

function GoogleCalendarSection() {
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
        toast.success("Google Calendar connected");
        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete("gcal");
        window.history.replaceState({}, "", url.pathname + url.hash);
      } else if (gcal === "error") {
        toast.error("Failed to connect Google Calendar");
        const url = new URL(window.location.href);
        url.searchParams.delete("gcal");
        url.searchParams.delete("reason");
        window.history.replaceState({}, "", url.pathname + url.hash);
      }
    }
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/dashboard/integrations/google/auth");
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to start connection");
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      toast.error("Failed to connect");
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
        toast.success("Google Calendar disconnected");
      } else {
        toast.error("Failed to disconnect");
      }
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <Card title="Integrations">
        <div className="flex items-center gap-2">
          <CaptaSpinnerInline />
          <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>Loading...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Google Calendar">
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
                  Connected
                </p>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                  {status.googleEmail}
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#22c55e" }} />
                Active
              </span>
            </div>

            {status.lastSyncAt && (
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                Last sync: {new Date(status.lastSyncAt).toLocaleString()}
              </p>
            )}

            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              New appointments booked by your receptionist will appear on your Google Calendar.
              Busy times on your Google Calendar will be respected when checking availability.
            </p>

            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: "var(--db-surface)",
                border: "1px solid var(--db-border)",
                color: "#f87171",
              }}
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
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
                  Google Calendar
                </p>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                  Sync appointments with your calendar and prevent double-bookings.
                </p>
              </div>
            </div>

            <div className="rounded-lg p-3" style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                When connected, your receptionist will:
              </p>
              <ul className="mt-2 space-y-1 text-xs" style={{ color: "var(--db-text-secondary)" }}>
                <li className="flex items-start gap-2">
                  <span style={{ color: "#22c55e" }}>&#10003;</span>
                  Add new appointments to your Google Calendar
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: "#22c55e" }}>&#10003;</span>
                  Check your calendar for conflicts before booking
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: "#22c55e" }}>&#10003;</span>
                  Remove cancelled appointments from your calendar
                </li>
              </ul>
            </div>

            <button
              onClick={handleConnect}
              disabled={connecting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
              style={{ background: "#4285F4" }}
            >
              {connecting ? "Connecting..." : "Connect Google Calendar"}
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
