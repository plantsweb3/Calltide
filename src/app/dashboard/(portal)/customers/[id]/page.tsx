"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageSkeleton } from "@/components/skeleton";
import Button from "@/components/ui/button";
import ConfirmDialog from "@/components/confirm-dialog";
import TagEditor from "@/components/tag-editor";

// ── Types ──

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
  lifetimeValue: number;
  tier: string;
  leadScore: number | null;
}

interface TimelineItem {
  id: string;
  type: "call" | "appointment" | "estimate" | "sms";
  date: string;
  data: Record<string, unknown>;
}

// ── Timeline type config ──

const TIMELINE_CONFIG: Record<
  TimelineItem["type"],
  { label: string; borderColor: string; iconColor: string }
> = {
  call: { label: "Call", borderColor: "#3b82f6", iconColor: "#3b82f6" },
  appointment: { label: "Appointment", borderColor: "#22c55e", iconColor: "#22c55e" },
  estimate: { label: "Estimate", borderColor: "#f97316", iconColor: "#f97316" },
  sms: { label: "SMS", borderColor: "#8b5cf6", iconColor: "#8b5cf6" },
};

// ── Icons ──

function CallIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function EstimateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function SmsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

const ICON_MAP: Record<TimelineItem["type"], () => React.ReactNode> = {
  call: CallIcon,
  appointment: CalendarIcon,
  estimate: EstimateIcon,
  sms: SmsIcon,
};

// ── Helpers ──

function formatDate(d: string | null): string {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(d: string): string {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " at " +
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "TBD";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);
}

function tierLabel(tier: string): string {
  const map: Record<string, string> = {
    new: "New",
    loyal: "Loyal",
    vip: "VIP",
    dormant: "Dormant",
    "at-risk": "At Risk",
  };
  return map[tier] || tier;
}

function tierColor(tier: string): { bg: string; fg: string } {
  const map: Record<string, { bg: string; fg: string }> = {
    new: { bg: "rgba(96,165,250,0.15)", fg: "#60a5fa" },
    loyal: { bg: "rgba(74,222,128,0.15)", fg: "#4ade80" },
    vip: { bg: "rgba(250,204,21,0.15)", fg: "#facc15" },
    dormant: { bg: "rgba(156,163,175,0.15)", fg: "#9ca3af" },
    "at-risk": { bg: "rgba(248,113,113,0.15)", fg: "#f87171" },
  };
  return map[tier] || { bg: "var(--db-hover)", fg: "var(--db-text-muted)" };
}

// ── Status badge ──

function StatusBadge({ status, type }: { status: string; type: TimelineItem["type"] }) {
  let bg = "var(--db-hover)";
  let fg = "var(--db-text-muted)";

  if (type === "call") {
    if (status === "completed") { bg = "rgba(74,222,128,0.15)"; fg = "#4ade80"; }
    else if (status === "missed") { bg = "rgba(248,113,113,0.15)"; fg = "#f87171"; }
    else if (status === "in_progress") { bg = "rgba(96,165,250,0.15)"; fg = "#60a5fa"; }
  } else if (type === "appointment") {
    if (status === "confirmed") { bg = "rgba(74,222,128,0.15)"; fg = "#4ade80"; }
    else if (status === "completed") { bg = "rgba(96,165,250,0.15)"; fg = "#60a5fa"; }
    else if (status === "cancelled") { bg = "rgba(248,113,113,0.15)"; fg = "#f87171"; }
    else if (status === "no_show") { bg = "rgba(250,204,21,0.15)"; fg = "#facc15"; }
  } else if (type === "estimate") {
    if (status === "won") { bg = "rgba(74,222,128,0.15)"; fg = "#4ade80"; }
    else if (status === "lost" || status === "expired") { bg = "rgba(248,113,113,0.15)"; fg = "#f87171"; }
    else if (status === "sent" || status === "follow_up") { bg = "rgba(96,165,250,0.15)"; fg = "#60a5fa"; }
    else if (status === "new") { bg = "rgba(250,204,21,0.15)"; fg = "#facc15"; }
  }

  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase"
      style={{ background: bg, color: fg }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── Timeline item renderers ──

function CallTimelineItem({ item }: { item: TimelineItem }) {
  const d = item.data;
  const status = String(d.status || "");
  const outcome = d.outcome ? String(d.outcome) : null;
  const summary = d.summary ? String(d.summary) : null;
  const duration = d.duration as number | null;
  const language = d.language ? String(d.language) : null;
  const sentiment = d.sentiment ? String(d.sentiment) : null;
  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={status} type="call" />
        {outcome && (
          <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
            {outcome.replace(/_/g, " ")}
          </span>
        )}
        <span className="text-xs ml-auto" style={{ color: "var(--db-text-muted)" }}>
          {formatDateTime(item.date)}
        </span>
      </div>
      {summary && (
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--db-text)" }}>
          {summary.length > 200 ? summary.slice(0, 200) + "..." : summary}
        </p>
      )}
      <div className="mt-1 flex gap-3 text-xs" style={{ color: "var(--db-text-muted)" }}>
        {duration && <span>{formatDuration(duration)}</span>}
        {language && <span>{language === "es" ? "Spanish" : "English"}</span>}
        {sentiment && <span>{sentiment}</span>}
      </div>
    </div>
  );
}

function AppointmentTimelineItem({ item }: { item: TimelineItem }) {
  const d = item.data;
  const service = String(d.service || "");
  const status = String(d.status || "");
  const date = String(d.date || "");
  const time = String(d.time || "");
  const notes = d.notes ? String(d.notes) : null;
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
            {service}
          </span>
          <StatusBadge status={status} type="appointment" />
        </div>
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
          {date} at {time}
        </span>
      </div>
      {notes && (
        <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
          {notes}
        </p>
      )}
    </div>
  );
}

function EstimateTimelineItem({ item }: { item: TimelineItem }) {
  const d = item.data;
  const service = String(d.service || "");
  const status = String(d.status || "");
  const amount = d.amount as number | null;
  const description = d.description ? String(d.description) : null;
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
            {service}
          </span>
          <StatusBadge status={status} type="estimate" />
        </div>
        <span className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
          {formatCurrency(amount)}
        </span>
      </div>
      {description && (
        <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
          {description}
        </p>
      )}
      <span className="text-xs mt-1 block" style={{ color: "var(--db-text-muted)" }}>
        {formatDateTime(item.date)}
      </span>
    </div>
  );
}

function SmsTimelineItem({ item }: { item: TimelineItem }) {
  const d = item.data;
  const direction = String(d.direction || "outbound");
  const body = String(d.body || "");
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span
          className="text-xs font-medium uppercase"
          style={{ color: direction === "outbound" ? "var(--db-accent)" : "var(--db-text-muted)" }}
        >
          {direction === "outbound" ? "Sent" : "Received"}
        </span>
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
          {formatDateTime(item.date)}
        </span>
      </div>
      <p className="mt-1 text-sm" style={{ color: "var(--db-text)" }}>
        {body}
      </p>
    </div>
  );
}

const ITEM_RENDERERS: Record<TimelineItem["type"], React.ComponentType<{ item: TimelineItem }>> = {
  call: CallTimelineItem,
  appointment: AppointmentTimelineItem,
  estimate: EstimateTimelineItem,
  sms: SmsTimelineItem,
};

// ── Filter buttons ──

type FilterType = "all" | TimelineItem["type"];

// ── Page component ──

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/customers/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push("/dashboard/customers");
          return;
        }
        throw new Error("Failed to load customer");
      }
      const data = await res.json();
      setCustomer(data.customer);
      setTimeline(data.timeline || []);
    } catch {
      setError("Failed to load customer details. Please try again.");
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
      const res = await fetch(`/api/dashboard/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Save failed");
      setCustomer((prev) => prev ? { ...prev, [field]: value || null } : prev);
      toast.success("Changes saved");
    } catch {
      toast.error("Failed to save changes");
    }
    setSaving(false);
    setEditingField(null);
  }

  async function saveTags(newTags: string[]) {
    try {
      const res = await fetch(`/api/dashboard/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: newTags }),
      });
      if (!res.ok) throw new Error("Save failed");
      setCustomer((prev) => prev ? { ...prev, tags: newTags } : prev);
      toast.success("Tags updated");
    } catch {
      toast.error("Failed to save tags");
    }
  }

  async function deleteCustomer() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/dashboard/customers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Customer deleted");
      router.push("/dashboard/customers");
    } catch {
      toast.error("Failed to delete customer");
      setDeleting(false);
    }
  }

  if (loading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <div>
        <button
          onClick={() => router.push("/dashboard/customers")}
          className="mb-4 flex items-center gap-1 text-sm transition-colors"
          style={{ color: "var(--db-text-muted)" }}
        >
          <BackArrowIcon />
          Back to Customers
        </button>
        <div
          className="rounded-xl p-6 text-center"
          style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
        >
          <p className="text-sm mb-3" style={{ color: "#f87171" }}>{error}</p>
          <button
            onClick={fetchCustomer}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ background: "var(--db-accent)", color: "#fff" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  // Filter timeline
  const filteredTimeline = filter === "all"
    ? timeline
    : timeline.filter((item) => item.type === filter);

  // Count per type
  const counts: Record<FilterType, number> = {
    all: timeline.length,
    call: timeline.filter((t) => t.type === "call").length,
    appointment: timeline.filter((t) => t.type === "appointment").length,
    estimate: timeline.filter((t) => t.type === "estimate").length,
    sms: timeline.filter((t) => t.type === "sms").length,
  };

  const tc = tierColor(customer.tier || "new");

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard/customers")}
        className="mb-4 flex items-center gap-1 text-sm transition-colors"
        style={{ color: "var(--db-text-muted)" }}
      >
        <BackArrowIcon />
        Back to Customers
      </button>

      {/* Header card */}
      <div
        className="rounded-xl border p-6 mb-6"
        style={{ background: "var(--db-card)", borderColor: "var(--db-border)" }}
      >
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold" style={{ color: "var(--db-text)" }}>
                {customer.name || "Unknown Customer"}
              </h1>
              {customer.language === "es" && (
                <span
                  className="rounded px-2 py-0.5 text-xs font-medium"
                  style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
                >
                  ES
                </span>
              )}
              {customer.isRepeat && (
                <span
                  className="rounded px-2 py-0.5 text-xs font-medium text-white"
                  style={{ background: "var(--db-accent)" }}
                >
                  REPEAT
                </span>
              )}
              {customer.tier && (
                <span
                  className="rounded px-2 py-0.5 text-xs font-medium"
                  style={{ background: tc.bg, color: tc.fg }}
                >
                  {tierLabel(customer.tier)}
                </span>
              )}
              {customer.leadScore != null && (
                <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--db-text-muted)" }}>
                  <span className="inline-block w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--db-hover)" }}>
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${customer.leadScore}%`,
                        background: customer.leadScore >= 70 ? "#4ade80" : customer.leadScore >= 40 ? "#fbbf24" : "#f87171",
                      }}
                    />
                  </span>
                  {customer.leadScore}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--db-text-muted)" }}>
              {customer.phone}
              {customer.email && ` \u00B7 ${customer.email}`}
              {customer.address && ` \u00B7 ${customer.address}`}
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete
          </Button>
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            { label: "Total Calls", value: String(customer.totalCalls) },
            { label: "Appointments", value: String(customer.totalAppointments) },
            { label: "Estimates", value: String(customer.totalEstimates) },
            { label: "Lifetime Value", value: formatCurrency(customer.lifetimeValue || 0) },
            { label: "First Contact", value: formatDate(customer.firstCallAt) },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{stat.label}</p>
              <p className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Editable fields */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {(["name", "phone", "email", "address", "notes"] as const).map((field) => {
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
          <div>
            <label className="block text-xs font-medium uppercase mb-1" style={{ color: "var(--db-text-muted)" }}>
              Tags
            </label>
            <TagEditor tags={customer.tags || []} onChange={saveTags} />
          </div>
        </div>
      </div>

      {/* Timeline section */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
          Activity Timeline
        </h2>
        <div className="flex gap-1 flex-wrap">
          {(["all", "call", "appointment", "estimate", "sms"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: filter === f ? "var(--db-accent)" : "var(--db-hover)",
                color: filter === f ? "#fff" : "var(--db-text-muted)",
              }}
            >
              {f === "all" ? "All" : TIMELINE_CONFIG[f].label}
              {" "}({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {/* Timeline list */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "var(--db-card)", borderColor: "var(--db-border)" }}
      >
        {filteredTimeline.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
              {filter === "all"
                ? "No activity recorded for this customer yet."
                : `No ${TIMELINE_CONFIG[filter as TimelineItem["type"]].label.toLowerCase()} activity found.`}
            </p>
          </div>
        ) : (
          <div>
            {filteredTimeline.map((item) => {
              const config = TIMELINE_CONFIG[item.type];
              const Icon = ICON_MAP[item.type];
              const Renderer = ITEM_RENDERERS[item.type];
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex gap-3 p-4 transition-colors cursor-pointer"
                  style={{
                    borderBottom: "1px solid var(--db-border)",
                    borderLeft: `3px solid ${config.borderColor}`,
                  }}
                  onClick={() => {
                    const routes: Record<string, string> = {
                      call: "/dashboard/calls",
                      appointment: "/dashboard/appointments",
                      estimate: "/dashboard/estimates",
                      sms: "/dashboard/sms",
                    };
                    router.push(routes[item.type] || "/dashboard");
                  }}
                >
                  {/* Icon */}
                  <div
                    className="mt-0.5 flex-shrink-0 flex items-center justify-center rounded-lg"
                    style={{
                      width: 32,
                      height: 32,
                      background: `${config.borderColor}15`,
                      color: config.iconColor,
                    }}
                  >
                    <Icon />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Renderer item={item} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Customer?"
        description="This will permanently remove this customer and all their associated data. This action cannot be undone."
        confirmLabel="Delete Customer"
        variant="danger"
        loading={deleting}
        onConfirm={deleteCustomer}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
