"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useReceptionistName } from "@/app/dashboard/_hooks/use-receptionist-name";

interface PrimaryLocationData {
  services: string[];
  businessHours: Record<string, { open: string; close: string }>;
  type: string;
}

const INDUSTRIES = [
  "plumbing", "hvac", "electrical", "roofing", "landscaping",
  "pest_control", "cleaning", "painting", "general_contractor",
  "dental", "medical", "veterinary", "salon", "spa",
  "auto_repair", "legal", "accounting", "other",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEFAULT_HOURS: Record<string, { open: string; close: string }> = {
  Mon: { open: "08:00", close: "17:00" },
  Tue: { open: "08:00", close: "17:00" },
  Wed: { open: "08:00", close: "17:00" },
  Thu: { open: "08:00", close: "17:00" },
  Fri: { open: "08:00", close: "17:00" },
  Sat: { open: "closed", close: "closed" },
  Sun: { open: "closed", close: "closed" },
};

export default function AddLocationPage() {
  const receptionistName = useReceptionistName();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [primary, setPrimary] = useState<PrimaryLocationData | null>(null);

  // Form data
  const [locationName, setLocationName] = useState("");
  const [type, setType] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState("");
  const [hours, setHours] = useState<Record<string, { open: string; close: string }>>(DEFAULT_HOURS);
  const [greeting, setGreeting] = useState("");

  // Load primary location data for pre-fill
  useEffect(() => {
    fetch("/api/dashboard/settings")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        setPrimary({
          services: d.services ?? [],
          businessHours: d.businessHours ?? DEFAULT_HOURS,
          type: d.type ?? "",
        });
        // Pre-fill from primary
        if (d.services) setServices(d.services);
        if (d.businessHours) setHours(d.businessHours);
        if (d.type) setType(d.type);
      })
      .catch(() => {});
  }, []);

  function addService() {
    const s = serviceInput.trim();
    if (s && !services.includes(s)) {
      setServices([...services, s]);
    }
    setServiceInput("");
  }

  function removeService(s: string) {
    setServices(services.filter((x) => x !== s));
  }

  function updateHour(day: string, field: "open" | "close", value: string) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  async function submit() {
    if (!locationName.trim()) {
      toast.error("Location name is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/locations/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationName: locationName.trim(),
          type: type || "general",
          serviceArea: serviceArea || undefined,
          services,
          businessHours: hours,
          greeting: greeting || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add location");

      toast.success(`Location "${locationName}" created!`);

      // Switch to new location
      await fetch("/api/dashboard/locations/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: data.businessId }),
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add location");
    } finally {
      setLoading(false);
    }
  }

  const stepTitles = ["Location Info", "Services", "Business Hours", "Greeting", "Review"];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>
          Add New Location
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          Step {step} of 5 — {stepTitles[step - 1]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{ background: s <= step ? "var(--db-accent)" : "var(--db-border)" }}
          />
        ))}
      </div>

      <div
        className="rounded-xl p-6"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
      >
        {/* Step 1: Location Name + Type + Service Area */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "var(--db-text)" }}>
                Location Name
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., San Antonio, Downtown Office"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: "1px solid var(--db-border)", background: "var(--db-surface)", color: "var(--db-text)" }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "var(--db-text)" }}>
                Industry
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: "1px solid var(--db-border)", background: "var(--db-surface)", color: "var(--db-text)" }}
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" style={{ color: "var(--db-text)" }}>
                Service Area
              </label>
              <input
                type="text"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="e.g., Austin and surrounding areas"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: "1px solid var(--db-border)", background: "var(--db-surface)", color: "var(--db-text)" }}
              />
            </div>
          </div>
        )}

        {/* Step 2: Services (pre-filled from primary) */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
              These were copied from your primary location. Add, remove, or keep as-is.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addService())}
                placeholder="Add a service..."
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: "1px solid var(--db-border)", background: "var(--db-surface)", color: "var(--db-text)" }}
              />
              <button
                onClick={addService}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ background: "var(--db-accent)" }}
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: "var(--db-hover)", color: "var(--db-text)" }}
                >
                  {s}
                  <button onClick={() => removeService(s)} className="ml-0.5 text-base leading-none" style={{ color: "var(--db-text-muted)" }}>&times;</button>
                </span>
              ))}
            </div>
            {services.length === 0 && (
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>No services added yet.</p>
            )}
          </div>
        )}

        {/* Step 3: Business Hours (pre-filled from primary) */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
              Copied from your primary location. Adjust as needed.
            </p>
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-3">
                <span className="w-10 text-xs font-medium" style={{ color: "var(--db-text)" }}>{day}</span>
                <input
                  type="time"
                  value={hours[day]?.open === "closed" ? "" : hours[day]?.open ?? ""}
                  onChange={(e) => updateHour(day, "open", e.target.value || "closed")}
                  className="rounded-lg px-2 py-1.5 text-xs outline-none"
                  style={{ border: "1px solid var(--db-border)", background: "var(--db-surface)", color: "var(--db-text)" }}
                />
                <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>to</span>
                <input
                  type="time"
                  value={hours[day]?.close === "closed" ? "" : hours[day]?.close ?? ""}
                  onChange={(e) => updateHour(day, "close", e.target.value || "closed")}
                  className="rounded-lg px-2 py-1.5 text-xs outline-none"
                  style={{ border: "1px solid var(--db-border)", background: "var(--db-surface)", color: "var(--db-text)" }}
                />
                <button
                  onClick={() => setHours((prev) => ({ ...prev, [day]: { open: "closed", close: "closed" } }))}
                  className="text-xs font-medium"
                  style={{ color: hours[day]?.open === "closed" ? "var(--db-accent)" : "var(--db-text-muted)" }}
                >
                  {hours[day]?.open === "closed" ? "Closed" : "Set Closed"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Greeting customization */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
              Customize how {receptionistName} greets callers at this location. Leave blank to use the default.
            </p>
            <textarea
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder={`e.g., Thank you for calling Joe's Plumbing San Antonio! This is ${receptionistName}, how can I help you today?`}
              rows={4}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ border: "1px solid var(--db-border)", background: "var(--db-surface)", color: "var(--db-text)" }}
            />
          </div>
        )}

        {/* Step 5: Review + Submit */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="space-y-2 text-sm" style={{ color: "var(--db-text)" }}>
              <div className="flex justify-between rounded-lg px-3 py-2" style={{ background: "var(--db-hover)" }}>
                <span style={{ color: "var(--db-text-muted)" }}>Location</span>
                <span className="font-medium">{locationName}</span>
              </div>
              <div className="flex justify-between rounded-lg px-3 py-2" style={{ background: "var(--db-hover)" }}>
                <span style={{ color: "var(--db-text-muted)" }}>Industry</span>
                <span className="font-medium">{(type || "general").replace(/_/g, " ")}</span>
              </div>
              {serviceArea && (
                <div className="flex justify-between rounded-lg px-3 py-2" style={{ background: "var(--db-hover)" }}>
                  <span style={{ color: "var(--db-text-muted)" }}>Service Area</span>
                  <span className="font-medium">{serviceArea}</span>
                </div>
              )}
              <div className="flex justify-between rounded-lg px-3 py-2" style={{ background: "var(--db-hover)" }}>
                <span style={{ color: "var(--db-text-muted)" }}>Services</span>
                <span className="font-medium">{services.length} services</span>
              </div>
              <div className="flex justify-between rounded-lg px-3 py-2" style={{ background: "var(--db-hover)" }}>
                <span style={{ color: "var(--db-text-muted)" }}>Additional Cost</span>
                <span className="font-medium" style={{ color: "var(--db-accent)" }}>+$197/mo</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : router.back()}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{ background: "var(--db-hover)", color: "var(--db-text)" }}
        >
          {step === 1 ? "Cancel" : "Back"}
        </button>

        {step < 5 ? (
          <button
            onClick={() => {
              if (step === 1 && !locationName.trim()) {
                toast.error("Location name is required");
                return;
              }
              setStep(step + 1);
            }}
            className="rounded-lg px-6 py-2 text-sm font-medium text-white"
            style={{ background: "var(--db-accent)" }}
          >
            Continue
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={loading}
            className="rounded-lg px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "var(--db-accent)" }}
          >
            {loading ? "Creating..." : "Create Location"}
          </button>
        )}
      </div>
    </div>
  );
}
