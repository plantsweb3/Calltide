"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  address: string | null;
  language: string;
  tags: string[];
  notes: string | null;
  totalCalls: number;
  totalAppointments: number;
  totalEstimates: number;
  lastCallAt: string | null;
  firstCallAt: string | null;
  isRepeat: boolean;
}

interface Call {
  id: string;
  status: string;
  duration: number | null;
  language: string | null;
  summary: string | null;
  sentiment: string | null;
  outcome: string | null;
  createdAt: string;
}

interface Appointment {
  id: string;
  service: string;
  date: string;
  time: string;
  status: string;
  notes: string | null;
}

interface Sms {
  id: string;
  direction: string;
  body: string;
  templateType: string | null;
  createdAt: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [recentSms, setRecentSms] = useState<Sms[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"calls" | "appointments" | "sms">("calls");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchCustomer = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/customers/${id}`);
      if (!res.ok) {
        router.push("/dashboard/customers");
        return;
      }
      const data = await res.json();
      setCustomer(data.customer);
      setRecentCalls(data.recentCalls || []);
      setRecentAppointments(data.recentAppointments || []);
      setRecentSms(data.recentSms || []);
    } catch {
      router.push("/dashboard/customers");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  async function saveField(field: string, value: string) {
    setSaving(true);
    try {
      await fetch(`/api/dashboard/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      setCustomer((prev) => prev ? { ...prev, [field]: value || null } : prev);
    } catch { /* ignore */ }
    setSaving(false);
    setEditingField(null);
  }

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function formatTime(d: string) {
    return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: "var(--db-accent)" }} />
      </div>
    );
  }

  if (!customer) return null;

  const tabs = [
    { key: "calls" as const, label: "Call History", count: recentCalls.length },
    { key: "appointments" as const, label: "Appointments", count: recentAppointments.length },
    { key: "sms" as const, label: "SMS", count: recentSms.length },
  ];

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard/customers")}
        className="mb-4 flex items-center gap-1 text-sm transition-colors"
        style={{ color: "var(--db-text-muted)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Customers
      </button>

      {/* Header Card */}
      <div
        className="rounded-xl border p-6 mb-6"
        style={{ background: "var(--db-surface)", borderColor: "var(--db-border)" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold" style={{ color: "var(--db-text)" }}>
                {customer.name || "Unknown Customer"}
              </h1>
              {customer.language === "es" && (
                <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}>
                  ES
                </span>
              )}
              {customer.isRepeat && (
                <span className="rounded px-2 py-0.5 text-xs font-medium text-white" style={{ background: "var(--db-accent)" }}>
                  REPEAT
                </span>
              )}
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
              {customer.phone}
              {customer.email && ` · ${customer.email}`}
            </p>
          </div>
          <div className="flex gap-2">
            {(customer.tags || []).map((tag) => (
              <span
                key={tag}
                className="rounded px-2 py-0.5 text-xs"
                style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Calls", value: customer.totalCalls },
            { label: "Appointments", value: customer.totalAppointments },
            { label: "First Contact", value: formatDate(customer.firstCallAt) },
            { label: "Last Contact", value: formatDate(customer.lastCallAt) },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{stat.label}</p>
              <p className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Editable Fields */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {(["name", "email", "address", "notes"] as const).map((field) => {
            const isEditing = editingField === field;
            const value = isEditing ? (editValues[field] ?? "") : (customer[field] || "");
            return (
              <div key={field}>
                <label className="block text-xs font-medium uppercase mb-1" style={{ color: "var(--db-text-muted)" }}>
                  {field}
                </label>
                {field === "notes" ? (
                  <textarea
                    value={value}
                    onChange={(e) => {
                      setEditingField(field);
                      setEditValues((prev) => ({ ...prev, [field]: e.target.value }));
                    }}
                    onBlur={() => {
                      if (editingField === field) saveField(field, editValues[field] || "");
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    rows={2}
                    placeholder={`Add ${field}...`}
                    style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                      setEditingField(field);
                      setEditValues((prev) => ({ ...prev, [field]: e.target.value }));
                    }}
                    onBlur={() => {
                      if (editingField === field) saveField(field, editValues[field] || "");
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder={`Add ${field}...`}
                    style={{ background: "var(--db-bg)", borderColor: "var(--db-border)", color: "var(--db-text)" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4" style={{ borderBottom: "1px solid var(--db-border)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: activeTab === tab.key ? "var(--db-accent)" : "var(--db-text-muted)",
              borderBottom: activeTab === tab.key ? "2px solid var(--db-accent)" : "2px solid transparent",
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        className="rounded-xl border"
        style={{ background: "var(--db-surface)", borderColor: "var(--db-border)" }}
      >
        {activeTab === "calls" && (
          recentCalls.length === 0 ? (
            <p className="p-6 text-sm text-center" style={{ color: "var(--db-text-muted)" }}>No call history</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--db-border)" }}>
              {recentCalls.map((call) => (
                <div key={call.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          background: call.status === "completed" ? "#dcfce7" : call.status === "missed" ? "#fee2e2" : "var(--db-hover)",
                          color: call.status === "completed" ? "#166534" : call.status === "missed" ? "#991b1b" : "var(--db-text-muted)",
                        }}
                      >
                        {call.status.toUpperCase()}
                      </span>
                      {call.outcome && (
                        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                          {call.outcome.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                      {formatDate(call.createdAt)} {formatTime(call.createdAt)}
                    </span>
                  </div>
                  {call.summary && (
                    <p className="mt-2 text-sm" style={{ color: "var(--db-text-secondary)" }}>
                      {call.summary}
                    </p>
                  )}
                  <div className="mt-1 flex gap-3 text-xs" style={{ color: "var(--db-text-muted)" }}>
                    {call.duration && <span>{Math.round(call.duration / 60)}m {call.duration % 60}s</span>}
                    {call.language && <span>{call.language === "es" ? "Spanish" : "English"}</span>}
                    {call.sentiment && <span>{call.sentiment}</span>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === "appointments" && (
          recentAppointments.length === 0 ? (
            <p className="p-6 text-sm text-center" style={{ color: "var(--db-text-muted)" }}>No appointments</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--db-border)" }}>
              {recentAppointments.map((appt) => (
                <div key={appt.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                      {appt.service}
                    </span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        background: appt.status === "confirmed" ? "#dcfce7" : appt.status === "completed" ? "#dbeafe" : "#fee2e2",
                        color: appt.status === "confirmed" ? "#166534" : appt.status === "completed" ? "#1e40af" : "#991b1b",
                      }}
                    >
                      {appt.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
                    {appt.date} at {appt.time}
                  </p>
                  {appt.notes && (
                    <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>{appt.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === "sms" && (
          recentSms.length === 0 ? (
            <p className="p-6 text-sm text-center" style={{ color: "var(--db-text-muted)" }}>No SMS messages</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--db-border)" }}>
              {recentSms.map((sms) => (
                <div key={sms.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: sms.direction === "outbound" ? "var(--db-accent)" : "var(--db-text-muted)" }}>
                      {sms.direction === "outbound" ? "SENT" : "RECEIVED"}
                    </span>
                    <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                      {formatDate(sms.createdAt)} {formatTime(sms.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: "var(--db-text-secondary)" }}>
                    {sms.body}
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
