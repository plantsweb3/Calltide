"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import LoadingSpinner from "@/app/dashboard/_components/loading-spinner";

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
}

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

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [initialData, setInitialData] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [newService, setNewService] = useState("");
  const [showGreetingPreview, setShowGreetingPreview] = useState(false);

  // Pricing state
  const [pricingEnabled, setPricingEnabled] = useState(false);
  const [pricing, setPricing] = useState<PricingEntry[]>([]);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [newPriceRow, setNewPriceRow] = useState<{ serviceName: string; priceMin: string; priceMax: string; unit: string } | null>(null);

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

  const defaultGreeting = `Thank you for calling ${data.name}, this is María. How can I help you?`;

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
            Configure your AI receptionist and business information
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
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
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
            AI Receptionist {data.active ? "Active" : "Inactive"}
          </p>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {data.active ? "Your AI is answering calls 24/7" : "Contact support to reactivate"}
          </p>
        </div>
      </div>

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
              <span className="ml-2 text-xs opacity-60" style={{ color: "var(--db-text-muted)" }}>(managed by Calltide)</span>
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

      {/* ── Section: María's Personality ── */}
      <Card title="María's Personality">
        <p className="text-sm mb-3" style={{ color: "var(--db-text-muted)" }}>
          Customize how María sounds on calls. These instructions shape her tone and behavior.
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
          Your AI receptionist answers calls 24/7, but appointments are only scheduled during business hours.
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

      {/* ── Section: Service Pricing ── */}
      <Card title="Service Pricing">
        <div className="space-y-4">
          {/* Master toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                Enable María to discuss pricing
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
                When enabled, María will quote ballpark prices with a &quot;final price may vary&quot; disclaimer
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
                            defaultValue={p.serviceName}
                            id={`edit-name-${p.id}`}
                            className="flex-1 min-w-[120px] rounded px-2 py-1 text-sm"
                            style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>$</span>
                            <input
                              type="number"
                              defaultValue={p.priceMin ?? ""}
                              id={`edit-min-${p.id}`}
                              className="w-20 rounded px-2 py-1 text-sm"
                              style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                              placeholder="Min"
                            />
                            <span style={{ color: "var(--db-text-muted)" }}>—</span>
                            <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>$</span>
                            <input
                              type="number"
                              defaultValue={p.priceMax ?? ""}
                              id={`edit-max-${p.id}`}
                              className="w-20 rounded px-2 py-1 text-sm"
                              style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)", color: "var(--db-text)" }}
                              placeholder="Max"
                            />
                          </div>
                          <select
                            defaultValue={p.unit}
                            id={`edit-unit-${p.id}`}
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
                              const nameEl = document.getElementById(`edit-name-${p.id}`) as HTMLInputElement;
                              const minEl = document.getElementById(`edit-min-${p.id}`) as HTMLInputElement;
                              const maxEl = document.getElementById(`edit-max-${p.id}`) as HTMLInputElement;
                              const unitEl = document.getElementById(`edit-unit-${p.id}`) as HTMLSelectElement;
                              try {
                                const res = await fetch(`/api/dashboard/pricing/${p.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    serviceName: nameEl.value,
                                    priceMin: minEl.value ? parseFloat(minEl.value) : null,
                                    priceMax: maxEl.value ? parseFloat(maxEl.value) : null,
                                    unit: unitEl.value,
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
                            {p.unit.replace("_", " ")}
                          </span>
                          <button
                            onClick={() => setEditingPriceId(p.id)}
                            className="text-xs font-medium"
                            style={{ color: "var(--db-accent)" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await fetch(`/api/dashboard/pricing/${p.id}`, { method: "DELETE" });
                                setPricing((prev) => prev.filter((x) => x.id !== p.id));
                                toast.success("Pricing removed");
                              } catch {
                                toast.error("Failed to delete");
                              }
                            }}
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

      {/* ── Section: María's Greeting ── */}
      <Card title="María's Greeting">
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
              placeholder={`Gracias por llamar a ${data.name}, habla María. ¿En qué le puedo ayudar?`}
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
                When someone calls, María will say:
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
                    &ldquo;{data.greetingEs || `Gracias por llamar a ${data.name}, habla María. ¿En qué le puedo ayudar?`}&rdquo;
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
          María is bilingual and will switch languages automatically. This sets the default.
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
          If set, María will SMS this number in addition to the owner during emergency transfers.
          Leave blank to only notify the owner phone.
        </p>
      </Card>

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
