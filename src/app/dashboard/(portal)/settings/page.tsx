"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/app/dashboard/_components/loading-spinner";

interface AccountData {
  name: string;
  type: string;
  ownerName: string;
  ownerEmail: string | null;
  ownerPhone: string;
  twilioNumber: string;
  timezone: string;
  defaultLanguage: string;
  services: string[];
  businessHours: Record<string, { open: string; close: string }>;
  active: boolean;
  totalCalls: number;
  totalAppointments: number;
  memberSince: string;
}

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${ampm}`;
}

export default function SettingsPage() {
  const [data, setData] = useState<AccountData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/account")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Failed to load account data"));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
        <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
      </div>
    );
  }

  if (!data) return <LoadingSpinner message="Loading account..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-body), system-ui, sans-serif", color: "var(--db-text)" }}
        >
          Settings
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
          Your account and AI receptionist configuration
        </p>
      </div>

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
            {data.active
              ? "Your AI is answering calls 24/7"
              : "Contact support to reactivate your AI receptionist"}
          </p>
        </div>
      </div>

      {/* Business Info */}
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
          Business Info
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoRow label="Business Name" value={data.name} />
          <InfoRow label="Industry" value={data.type} />
          <InfoRow label="Owner" value={data.ownerName} />
          <InfoRow label="Email" value={data.ownerEmail || "—"} />
          <InfoRow label="Phone" value={formatPhone(data.ownerPhone)} />
          <InfoRow label="AI Phone Number" value={formatPhone(data.twilioNumber)} accent />
          <InfoRow label="Timezone" value={data.timezone} />
          <InfoRow label="Default Language" value={data.defaultLanguage === "es" ? "Spanish" : "English"} />
          <InfoRow label="Member Since" value={new Date(data.memberSince).toLocaleDateString(undefined, { month: "long", year: "numeric" })} />
        </div>
      </div>

      {/* Services */}
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
          Services Your AI Can Book
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.services.map((service) => (
            <span
              key={service}
              className="rounded-lg px-3 py-1.5 text-sm font-medium"
              style={{
                background: "var(--db-hover)",
                color: "var(--db-text-secondary)",
                border: "1px solid var(--db-border)",
              }}
            >
              {service}
            </span>
          ))}
        </div>
      </div>

      {/* Business Hours */}
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
          Business Hours
        </h3>
        <div className="space-y-2">
          {DAY_ORDER.map((day) => {
            const hours = data.businessHours[day];
            return (
              <div key={day} className="flex items-center justify-between py-1.5">
                <span className="text-sm font-medium w-12" style={{ color: "var(--db-text)" }}>
                  {day}
                </span>
                {hours ? (
                  <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
                    {formatTime(hours.open)} — {formatTime(hours.close)}
                  </span>
                ) : (
                  <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>
                    Closed
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--db-text-muted)" }}>
          Your AI receptionist answers calls 24/7, but appointments are only scheduled during business hours.
        </p>
      </div>

      {/* Account Stats */}
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
          Account Stats
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>
              {data.totalCalls.toLocaleString()}
            </p>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Total Calls Handled</p>
          </div>
          <div>
            <p className="text-2xl font-semibold" style={{ color: "var(--db-accent)" }}>
              {data.totalAppointments.toLocaleString()}
            </p>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Appointments Booked</p>
          </div>
        </div>
      </div>

      {/* Support */}
      <div
        className="rounded-xl p-5 text-center"
        style={{
          background: "var(--db-card)",
          border: "1px solid var(--db-border)",
          boxShadow: "var(--db-card-shadow)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
          Need to update your settings? Contact us at{" "}
          <a
            href="mailto:support@calltide.app"
            className="font-medium"
            style={{ color: "var(--db-accent)" }}
          >
            support@calltide.app
          </a>
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{label}</p>
      <p
        className="mt-0.5 text-sm font-medium"
        style={{ color: accent ? "var(--db-accent)" : "var(--db-text)" }}
      >
        {value}
      </p>
    </div>
  );
}
