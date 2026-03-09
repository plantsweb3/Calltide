"use client";

import { useEffect, useState, use } from "react";
import { toast } from "sonner";
import Link from "next/link";
import StatusBadge from "../../../_components/status-badge";
import { PageSkeleton } from "@/components/skeleton";

type Tab = "calls" | "bookings" | "intakes" | "communications" | "ai" | "notes" | "qa" | "nps" | "referral" | "timeline" | "customers" | "job-cards" | "partners";

interface BusinessDetail {
  id: string;
  name: string;
  type: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string | null;
  twilioNumber: string;
  timezone: string;
  defaultLanguage: string;
  active: boolean;
  createdAt: string;
  stats: {
    calls: { total: number; completed: number; missed: number; avgDuration: number };
    appointments: { total: number; confirmed: number; completed: number };
    sms: { total: number; sent: number; received: number };
  };
  churnRisk: { score: number; factors: string[] } | null;
  digestPreference: string | null;
  digestTime: string | null;
  lastDigestSentAt: string | null;
}

interface Call {
  id: string;
  callerPhone: string | null;
  direction: string;
  status: string;
  duration: number | null;
  language: string | null;
  sentiment: string | null;
  summary: string | null;
  transcript: Array<{ speaker: "ai" | "caller"; text: string }> | null;
  createdAt: string;
  leadName: string | null;
}

interface Appointment {
  id: string;
  service: string;
  date: string;
  time: string;
  status: string;
  notes: string | null;
  leadName: string | null;
}

interface SmsMessage {
  id: string;
  direction: string;
  fromNumber: string;
  toNumber: string;
  body: string;
  templateType: string | null;
  status: string;
  createdAt: string;
  leadName: string | null;
}

interface Note {
  id: string;
  noteText: string;
  createdBy: string;
  createdAt: string;
}

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [tab, setTab] = useState<Tab>("calls");
  const [callsData, setCallsData] = useState<{ calls: Call[]; total: number }>({ calls: [], total: 0 });
  const [appointmentsData, setAppointmentsData] = useState<{ appointments: Appointment[]; total: number }>({ appointments: [], total: 0 });
  const [smsData, setSmsData] = useState<{ messages: SmsMessage[]; total: number }>({ messages: [], total: 0 });
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  // QA, NPS, Referral, Timeline data
  const [qaScores, setQaScores] = useState<Array<{ callId: string; score: number; flags: string[]; fixRecommendation: string | null; summary: string | null; createdAt: string }>>([]);
  const [npsHistory, setNpsHistory] = useState<Array<{ id: string; score: number; classification: string; feedback: string | null; createdAt: string }>>([]);
  const [referralData, setReferralData] = useState<{ code: string | null; referrals: Array<{ id: string; status: string; creditAmount: number; creditApplied: boolean; createdAt: string }> }>({ code: null, referrals: [] });
  const [timeline, setTimeline] = useState<Array<{ id: string; eventType: string; emailSentAt: string | null; createdAt: string; eventData: Record<string, unknown> | null }>>([]);
  const [crmCustomers, setCrmCustomers] = useState<Array<{ id: string; phone: string; name: string | null; totalCalls: number; totalAppointments: number; lastCallAt: string | null; isRepeat: boolean; tags: string[] }>>([]);
  const [intakesData, setIntakesData] = useState<{ intakes: Array<{ id: string; tradeType: string; scopeLevel: string; answersJson: Record<string, unknown> | null; scopeDescription: string | null; urgency: string; intakeComplete: boolean; createdAt: string; callerPhone: string | null; leadName: string | null }>; total: number; completed: number; completionRate: number }>({ intakes: [], total: 0, completed: 0, completionRate: 0 });
  const [jobCardsData, setJobCardsData] = useState<{ cards: Array<{ id: string; callerName: string | null; callerPhone: string | null; jobTypeLabel: string | null; scopeLevel: string | null; scopeDescription: string | null; estimateMode: string | null; estimateMin: number | null; estimateMax: number | null; estimateUnit: string | null; estimateConfidence: string | null; estimateCalculationJson: Record<string, unknown> | null; status: string | null; ownerResponse: string | null; ownerAdjustedMin: number | null; ownerAdjustedMax: number | null; ownerRespondedAt: string | null; customerNotifiedAt: string | null; createdAt: string; responses: Array<{ id: string; direction: string; messageType: string; rawReply: string | null; parsedAction: string | null; createdAt: string }>; notifications: Array<{ id: string; notificationType: string; sentAt: string }> }>; total: number; pricingRanges: Array<{ id: string; jobTypeLabel: string; mode: string; minPrice: number | null; maxPrice: number | null; unit: string | null }>; stats: { total30d: number; pending: number; confirmed: number; adjusted: number; expired: number; siteVisit: number; responseRate: number; avgResponseTimeMinutes: number | null; totalPhotos: number } | null }>({ cards: [], total: 0, pricingRanges: [], stats: null });
  const [expandedJobCard, setExpandedJobCard] = useState<string | null>(null);
  const [partnerData, setPartnerData] = useState<{ totalPartners: number; totalReferrals: number; partners: Array<{ id: string; name: string; trade: string; phone: string; relationship: string }>; referrals: Array<{ id: string; partnerName: string; partnerTrade: string; callerName: string | null; requestedTrade: string; jobDescription: string | null; partnerNotified: boolean; outcome: string; createdAt: string }> }>({ totalPartners: 0, totalReferrals: 0, partners: [], referrals: [] });

  useEffect(() => {
    fetch(`/api/admin/clients/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        setBusiness(d);
        setLoading(false);
      })
      .catch(() => { setLoading(false); setError("Failed to load client data"); });

    fetch(`/api/admin/clients/${id}/calls?limit=50`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setCallsData)
      .catch(() => setError("Failed to load calls data"));

    fetch(`/api/admin/clients/${id}/appointments?limit=50`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setAppointmentsData)
      .catch(() => setError("Failed to load appointments data"));

    fetch(`/api/admin/clients/${id}/sms?limit=50`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setSmsData)
      .catch(() => setError("Failed to load SMS data"));

    fetch(`/api/admin/clients/${id}/notes`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setNotes(d.notes || []))
      .catch(() => setError("Failed to load notes"));

    // Fetch QA, NPS, referral, timeline data
    fetch(`/api/admin/clients/${id}/qa`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setQaScores(d.scores || []))
      .catch(() => setError("Failed to load QA data"));

    fetch(`/api/admin/clients/${id}/nps`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setNpsHistory(d.responses || []))
      .catch(() => setError("Failed to load NPS data"));

    fetch(`/api/admin/clients/${id}/referrals`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setReferralData(d))
      .catch(() => setError("Failed to load referral data"));

    fetch(`/api/admin/clients/${id}/timeline`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setTimeline(d.events || []))
      .catch(() => setError("Failed to load timeline data"));

    fetch(`/api/admin/clients/${id}/customers?limit=50`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setCrmCustomers(d.customers || []))
      .catch(() => setError("Failed to load customer data"));

    fetch(`/api/admin/clients/${id}/intakes?limit=50`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setIntakesData(d))
      .catch(() => { /* non-critical */ });

    fetch(`/api/admin/clients/${id}/job-cards?limit=50`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setJobCardsData(d))
      .catch(() => { /* non-critical */ });

    fetch(`/api/admin/clients/${id}/partner-referrals`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setPartnerData(d))
      .catch(() => { /* non-critical */ });
  }, [id]);

  async function addNote() {
    if (!newNote.trim()) return;
    try {
      const res = await fetch(`/api/admin/clients/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteText: newNote }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
      setNewNote("");
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    }
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const statusColor = (status: string) => {
    const map: Record<string, { background: string; color: string }> = {
      completed: { background: "rgba(74,222,128,0.1)", color: "#4ade80" },
      confirmed: { background: "rgba(74,222,128,0.1)", color: "#4ade80" },
      missed: { background: "rgba(251,191,36,0.1)", color: "#fbbf24" },
      no_show: { background: "rgba(251,191,36,0.1)", color: "#fbbf24" },
      failed: { background: "rgba(248,113,113,0.1)", color: "#f87171" },
      cancelled: { background: "rgba(248,113,113,0.1)", color: "#f87171" },
    };
    return map[status] || { background: "var(--db-hover)", color: "var(--db-text-secondary)" };
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!business) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p style={{ color: "var(--db-text-muted)" }}>Client not found</p>
        <Link href="/admin/clients" className="text-sm hover:opacity-80" style={{ color: "var(--db-accent)" }}>
          Back to Customers
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "calls", label: "Calls", count: callsData.total },
    { key: "bookings", label: "Bookings", count: appointmentsData.total },
    { key: "intakes", label: "Intakes", count: intakesData.total },
    { key: "communications", label: "Communications", count: smsData.total },
    { key: "ai", label: "AI Performance" },
    { key: "qa", label: "QA", count: qaScores.length },
    { key: "nps", label: "NPS", count: npsHistory.length },
    { key: "referral", label: "Referral", count: referralData.referrals.length },
    { key: "customers", label: "Customers", count: crmCustomers.length },
    { key: "job-cards", label: "Job Cards", count: jobCardsData.total },
    { key: "partners", label: "Partners", count: partnerData.totalPartners },
    { key: "timeline", label: "Timeline", count: timeline.length },
    { key: "notes", label: "Notes", count: notes.length },
  ];

  const churnLevel =
    business.churnRisk && business.churnRisk.score > 7
      ? "at-risk"
      : business.churnRisk && business.churnRisk.score > 4
        ? "degraded"
        : "operational";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--db-text-muted)" }}>
        <Link href="/admin/clients" className="hover:opacity-80" style={{ color: "var(--db-text-secondary)" }}>
          Customers
        </Link>
        <span>/</span>
        <span style={{ color: "var(--db-text)" }}>{business.name}</span>
      </div>

      {error && (
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{business.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm" style={{ color: "var(--db-text-muted)" }}>
            <span className="capitalize">{business.type}</span>
            <span>·</span>
            <span>{business.ownerName}</span>
            <span>·</span>
            <span>{business.ownerPhone}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={business.active ? "active" : "churned"} />
          {business.churnRisk && (
            <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              Churn risk: {business.churnRisk.score}/10
            </span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Total Calls</p>
          <p className="mt-1 text-lg font-semibold">{business.stats.calls.total}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Completed</p>
          <p className="mt-1 text-lg font-semibold" style={{ color: "#4ade80" }}>{business.stats.calls.completed}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Missed</p>
          <p className="mt-1 text-lg font-semibold" style={{ color: "#fbbf24" }}>{business.stats.calls.missed}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Avg Duration</p>
          <p className="mt-1 text-lg font-semibold">{formatDuration(business.stats.calls.avgDuration)}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Appointments</p>
          <p className="mt-1 text-lg font-semibold">{business.stats.appointments.total}</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>SMS Sent</p>
          <p className="mt-1 text-lg font-semibold">{business.stats.sms.sent}</p>
        </div>
      </div>

      {/* Digest config */}
      <div className="flex items-center gap-4 rounded-lg p-3 text-sm" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
        <span style={{ color: "var(--db-text-muted)" }}>Daily Digest:</span>
        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>
          {business.digestPreference || "sms"}
        </span>
        <span style={{ color: "var(--db-text-muted)" }}>at {business.digestTime || "18:00"}</span>
        {business.lastDigestSentAt && (
          <span style={{ color: "var(--db-text-muted)" }}>
            Last sent: {new Date(business.lastDigestSentAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Churn risk factors */}
      {business.churnRisk && business.churnRisk.score > 3 && (
        <div className="rounded-lg p-4" style={{ border: "1px solid rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.05)" }}>
          <p className="text-sm font-medium" style={{ color: "#fbbf24" }}>
            Churn Risk: {business.churnRisk.score}/10
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(business.churnRisk.factors as string[]).map((f, i) => (
              <span
                key={i}
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24" }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b" style={{ borderColor: "var(--db-border)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2.5 text-sm font-medium transition-colors"
            style={
              tab === t.key
                ? { borderBottom: "2px solid var(--db-accent)", color: "var(--db-text)" }
                : { color: "var(--db-text-muted)" }
            }
            onMouseEnter={(e) => {
              if (tab !== t.key) {
                e.currentTarget.style.color = "var(--db-text)";
              }
            }}
            onMouseLeave={(e) => {
              if (tab !== t.key) {
                e.currentTarget.style.color = "var(--db-text-muted)";
              }
            }}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 text-xs" style={{ color: "var(--db-text-muted)" }}>({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {/* Calls Tab */}
        {tab === "calls" && (
          <div className="space-y-2">
            {callsData.calls.length === 0 && (
              <p className="py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No calls yet</p>
            )}
            {callsData.calls.map((call) => {
              const isExpanded = expandedCall === call.id;
              const hasTranscript = call.transcript && call.transcript.length > 0;
              return (
                <div
                  key={call.id}
                  className="rounded-lg text-sm transition-all"
                  style={{ background: "var(--db-card)", border: `1px solid ${isExpanded ? "var(--db-accent)" : "var(--db-border)"}` }}
                >
                  <button
                    className="w-full px-4 py-3 text-left"
                    onClick={() => setExpandedCall(isExpanded ? null : call.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium" style={{ color: "var(--db-text)" }}>
                        {call.leadName || call.callerPhone || "Unknown"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{formatDate(call.createdAt)}</span>
                        {hasTranscript && (
                          <span className="text-xs" style={{ color: "var(--db-accent)" }}>{isExpanded ? "▲" : "▼"}</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={statusColor(call.status)}>
                        {call.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{formatDuration(call.duration)}</span>
                      {call.language && <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{call.language.toUpperCase()}</span>}
                      {call.sentiment && (
                        <span className="text-xs" style={{
                          color: call.sentiment === "positive" ? "#4ade80" :
                                call.sentiment === "negative" ? "#f87171" : "var(--db-text-muted)"
                        }}>
                          {call.sentiment}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{call.direction}</span>
                    </div>
                    {call.summary && (
                      <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--db-text-muted)" }}>{call.summary}</p>
                    )}
                  </button>

                  {/* Expanded transcript */}
                  {isExpanded && hasTranscript && (
                    <div className="border-t px-4 py-3" style={{ borderColor: "var(--db-border)" }}>
                      <p className="mb-2 text-xs font-medium" style={{ color: "var(--db-text-secondary)" }}>Transcript</p>
                      <div className="space-y-2">
                        {call.transcript!.map((line, i) => (
                          <div key={i} className={`flex gap-2 ${line.speaker === "ai" ? "" : "flex-row-reverse"}`}>
                            <span
                              className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                              style={
                                line.speaker === "ai"
                                  ? { background: "rgba(197,154,39,0.15)", color: "#C59A27" }
                                  : { background: "rgba(96,165,250,0.1)", color: "#60a5fa" }
                              }
                            >
                              {line.speaker === "ai" ? "AI" : "Caller"}
                            </span>
                            <p
                              className="rounded-lg px-3 py-1.5 text-xs leading-relaxed"
                              style={{
                                background: line.speaker === "ai" ? "rgba(197,154,39,0.05)" : "rgba(96,165,250,0.05)",
                                color: "var(--db-text-secondary)",
                                maxWidth: "85%",
                              }}
                            >
                              {line.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isExpanded && !hasTranscript && (
                    <div className="border-t px-4 py-3" style={{ borderColor: "var(--db-border)" }}>
                      <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>No transcript available for this call.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bookings Tab */}
        {tab === "bookings" && (
          <div className="space-y-2">
            {appointmentsData.appointments.length === 0 && (
              <p className="py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No bookings yet</p>
            )}
            {appointmentsData.appointments.map((apt) => (
              <div key={apt.id} className="rounded-lg px-4 py-3 text-sm" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-medium" style={{ color: "var(--db-text)" }}>{apt.service}</span>
                  <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={statusColor(apt.status)}>
                    {apt.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
                  {apt.date} at {apt.time} · {apt.leadName || "—"}
                </p>
                {apt.notes && <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>{apt.notes}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Intakes Tab */}
        {tab === "intakes" && (
          <div className="space-y-4">
            {/* Intake stats */}
            {intakesData.total > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                  <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Total Intakes</p>
                  <p className="mt-1 text-lg font-semibold">{intakesData.total}</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                  <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Completed</p>
                  <p className="mt-1 text-lg font-semibold" style={{ color: "#4ade80" }}>{intakesData.completed}</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                  <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Completion Rate</p>
                  <p className="mt-1 text-lg font-semibold">{intakesData.completionRate}%</p>
                </div>
              </div>
            )}

            {/* Intake list */}
            {intakesData.intakes.length === 0 && (
              <p className="py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No job intakes yet</p>
            )}
            {intakesData.intakes.map((intake) => (
              <div
                key={intake.id}
                className="rounded-lg px-4 py-3 text-sm"
                style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize" style={{ color: "var(--db-text)" }}>
                      {intake.tradeType}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                      style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa" }}
                    >
                      {intake.scopeLevel}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        background: intake.intakeComplete ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)",
                        color: intake.intakeComplete ? "#4ade80" : "#fbbf24",
                      }}
                    >
                      {intake.intakeComplete ? "Complete" : "Partial"}
                    </span>
                    {intake.urgency !== "normal" && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                        style={{
                          background: intake.urgency === "emergency" ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)",
                          color: intake.urgency === "emergency" ? "#f87171" : "#fbbf24",
                        }}
                      >
                        {intake.urgency}
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{formatDate(intake.createdAt)}</span>
                </div>
                <div className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
                  {intake.leadName || intake.callerPhone || "Unknown caller"}
                </div>
                {intake.scopeDescription && (
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--db-text-secondary)" }}>
                    {intake.scopeDescription}
                  </p>
                )}
                {intake.answersJson && Object.keys(intake.answersJson).length > 0 && (
                  <div className="mt-2 rounded-lg p-2.5 space-y-1" style={{ background: "var(--db-hover)" }}>
                    {Object.entries(intake.answersJson).map(([key, val]) => (
                      <div key={key} className="flex gap-2 text-xs">
                        <span className="shrink-0 font-medium capitalize" style={{ color: "var(--db-text-muted)" }}>
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span style={{ color: "var(--db-text-secondary)" }}>{String(val)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Communications Tab */}
        {tab === "communications" && (
          <div className="space-y-2">
            {smsData.messages.length === 0 && (
              <p className="py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No SMS messages yet</p>
            )}
            {smsData.messages.map((msg) => (
              <div key={msg.id} className="rounded-lg px-4 py-3 text-sm" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={
                      msg.direction === "outbound"
                        ? { background: "rgba(96,165,250,0.1)", color: "#60a5fa" }
                        : { background: "rgba(74,222,128,0.1)", color: "#4ade80" }
                    }>
                      {msg.direction}
                    </span>
                    <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{msg.leadName || msg.toNumber}</span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{formatDate(msg.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-xs" style={{ color: "var(--db-text-secondary)" }}>{msg.body}</p>
                {msg.templateType && (
                  <span className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px]" style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}>
                    {msg.templateType}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* AI Performance Tab */}
        {tab === "ai" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Completion Rate</p>
                <p className="mt-1 text-lg font-semibold">
                  {business.stats.calls.total > 0
                    ? `${Math.round((business.stats.calls.completed / business.stats.calls.total) * 100)}%`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Avg Call Duration</p>
                <p className="mt-1 text-lg font-semibold">{formatDuration(business.stats.calls.avgDuration)}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Bookings Created</p>
                <p className="mt-1 text-lg font-semibold">{business.stats.appointments.total}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>SMS Automated</p>
                <p className="mt-1 text-lg font-semibold">{business.stats.sms.sent}</p>
              </div>
            </div>
            <div className="rounded-lg p-4" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
              <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
                Detailed AI performance analytics per customer coming soon. View system-wide AI metrics on the{" "}
                <Link href="/admin/ai" className="hover:opacity-80" style={{ color: "var(--db-accent)" }}>
                  AI Performance
                </Link>{" "}
                page.
              </p>
            </div>
          </div>
        )}

        {/* QA Tab */}
        {tab === "qa" && (
          <div className="space-y-2">
            {qaScores.length === 0 && (
              <p className="py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No QA scores yet</p>
            )}
            {qaScores.map((qa) => {
              const scoreColor = qa.score >= 80 ? "#4ade80" : qa.score >= 60 ? "#fbbf24" : "#f87171";
              return (
                <div
                  key={qa.callId + qa.createdAt}
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-bold"
                        style={{ background: `${scoreColor}15`, color: scoreColor }}
                      >
                        {qa.score}/100
                      </span>
                      {qa.flags && qa.flags.length > 0 && (
                        <div className="flex gap-1">
                          {qa.flags.map((flag, i) => (
                            <span
                              key={i}
                              className="rounded px-1.5 py-0.5 text-[10px]"
                              style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
                            >
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{formatDate(qa.createdAt)}</span>
                  </div>
                  {qa.summary && (
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--db-text-secondary)" }}>{qa.summary}</p>
                  )}
                  {qa.fixRecommendation && (
                    <p className="mt-1.5 text-xs" style={{ color: "#fbbf24" }}>
                      Fix: {qa.fixRecommendation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* NPS Tab */}
        {tab === "nps" && (
          <div className="space-y-2">
            {npsHistory.length === 0 && (
              <p className="py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No NPS responses yet</p>
            )}
            {npsHistory.map((nps) => {
              const classColor =
                nps.classification === "promoter" ? "#4ade80" :
                nps.classification === "passive" ? "#fbbf24" : "#f87171";
              return (
                <div
                  key={nps.id}
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-bold"
                        style={{ background: `${classColor}15`, color: classColor }}
                      >
                        {nps.score}/10
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                        style={{ background: `${classColor}15`, color: classColor }}
                      >
                        {nps.classification}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{formatDate(nps.createdAt)}</span>
                  </div>
                  {nps.feedback && (
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--db-text-secondary)" }}>
                      &ldquo;{nps.feedback}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Referral Tab */}
        {tab === "referral" && (
          <div className="space-y-4">
            {referralData.code ? (
              <div
                className="rounded-lg p-4"
                style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--db-text-muted)" }}>
                  Referral Code
                </p>
                <code
                  className="rounded-lg px-3 py-1.5 text-sm font-bold tracking-wide"
                  style={{ background: "var(--db-hover)", color: "var(--db-accent)" }}
                >
                  {referralData.code}
                </code>
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>No referral code assigned</p>
            )}

            {referralData.referrals.length === 0 ? (
              <p className="py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No referrals yet</p>
            ) : (
              <div className="space-y-2">
                {referralData.referrals.map((ref) => {
                  const refColor =
                    ref.status === "activated" ? "#4ade80" :
                    ref.status === "signed_up" ? "#60a5fa" :
                    ref.status === "churned" ? "#f87171" : "var(--db-text-muted)";
                  return (
                    <div
                      key={ref.id}
                      className="rounded-lg px-4 py-3 text-sm"
                      style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{ background: `${refColor}15`, color: refColor }}
                          >
                            {ref.status?.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs" style={{ color: "var(--db-text-secondary)" }}>
                            ${ref.creditAmount} {ref.creditApplied ? "applied" : "pending"}
                          </span>
                        </div>
                        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{formatDate(ref.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Customers Tab */}
        {tab === "customers" && (
          <div className="space-y-2">
            {crmCustomers.length === 0 && (
              <p className="py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No CRM customers yet</p>
            )}
            {crmCustomers.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg px-4 py-3 text-sm"
                style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
              >
                <div>
                  <span className="font-medium" style={{ color: "var(--db-text)" }}>{c.name || "Unknown"}</span>
                  <span className="ml-2 text-xs" style={{ color: "var(--db-text-muted)" }}>{c.phone}</span>
                  {c.isRepeat && (
                    <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: "var(--db-accent)", color: "#fff" }}>
                      REPEAT
                    </span>
                  )}
                  {(c.tags || []).map((tag) => (
                    <span key={tag} className="ml-1 rounded px-1.5 py-0.5 text-[10px]" style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: "var(--db-text-muted)" }}>
                  <span>{c.totalCalls} calls</span>
                  <span>{c.totalAppointments} appts</span>
                  <span>{c.lastCallAt ? formatDate(c.lastCallAt) : "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Partners Tab */}
        {tab === "partners" && (
          <div className="space-y-4">
            {/* Partner Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3 text-center" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <p className="text-xl font-bold" style={{ color: "var(--db-text)" }}>{partnerData.totalPartners}</p>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Active Partners</p>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <p className="text-xl font-bold" style={{ color: "var(--db-text)" }}>{partnerData.totalReferrals}</p>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Referrals Made</p>
              </div>
            </div>

            {/* Partner List */}
            {partnerData.partners.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--db-text-muted)" }}>Partners</p>
                <div className="space-y-2">
                  {partnerData.partners.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                      <div>
                        <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{p.name}</span>
                        <span className="ml-2 text-xs" style={{ color: "var(--db-text-muted)" }}>{p.trade}</span>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs"
                        style={{
                          background: p.relationship === "preferred" ? "rgba(212,168,67,0.15)" : "rgba(96,165,250,0.15)",
                          color: p.relationship === "preferred" ? "#D4A843" : "#60a5fa",
                        }}
                      >
                        {p.relationship}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Referral Log */}
            {partnerData.referrals.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--db-text-muted)" }}>Recent Referrals</p>
                <div className="space-y-2">
                  {partnerData.referrals.map((r) => (
                    <div key={r.id} className="rounded-lg px-3 py-2" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: "var(--db-text)" }}>
                          {r.callerName || "Unknown"} &rarr; {r.partnerName}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-xs"
                          style={{
                            background: r.outcome === "connected" ? "rgba(74,222,128,0.15)" : "rgba(148,163,184,0.15)",
                            color: r.outcome === "connected" ? "#4ade80" : "#94a3b8",
                          }}
                        >
                          {r.outcome}
                        </span>
                      </div>
                      <div className="flex gap-3 text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
                        <span>{r.requestedTrade}</span>
                        {r.jobDescription && <span className="truncate max-w-[200px]">{r.jobDescription}</span>}
                        <span>{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {partnerData.totalPartners === 0 && partnerData.totalReferrals === 0 && (
              <p className="py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No partner network configured</p>
            )}
          </div>
        )}

        {/* Timeline Tab */}
        {tab === "timeline" && (
          <div className="space-y-2">
            {timeline.length === 0 && (
              <p className="py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No success events yet</p>
            )}
            {timeline.map((event) => {
              const typeLabels: Record<string, { label: string; color: string }> = {
                first_week_report: { label: "First Week Report", color: "#60a5fa" },
                monthly_report: { label: "Monthly Report", color: "#a78bfa" },
                nps_survey_sent: { label: "NPS Survey Sent", color: "#fbbf24" },
                nps_response: { label: "NPS Response", color: "#4ade80" },
                milestone: { label: "Milestone", color: "#f59e0b" },
                quarterly_review: { label: "Quarterly Review", color: "#8b5cf6" },
                anniversary: { label: "Anniversary", color: "#ec4899" },
                referral_prompt: { label: "Referral Prompt", color: "#22c55e" },
                health_score_updated: { label: "Health Score", color: "#06b6d4" },
              };
              const meta = typeLabels[event.eventType] ?? { label: event.eventType.replace(/_/g, " "), color: "var(--db-text-muted)" };
              return (
                <div
                  key={event.id}
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                        style={{ background: `${meta.color}15`, color: meta.color }}
                      >
                        {meta.label}
                      </span>
                      {event.emailSentAt && (
                        <span className="text-[10px]" style={{ color: "var(--db-text-muted)" }}>
                          Email sent
                        </span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{formatDate(event.createdAt)}</span>
                  </div>
                  {event.eventData && Object.keys(event.eventData).length > 0 && (
                    <p className="mt-1.5 text-xs" style={{ color: "var(--db-text-muted)" }}>
                      {Object.entries(event.eventData)
                        .filter(([, v]) => v !== null && v !== undefined)
                        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Job Cards Tab */}
        {tab === "job-cards" && (
          <div className="space-y-4">
            {/* Response Stats */}
            {jobCardsData.stats && jobCardsData.stats.total30d > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {[
                  { label: "Total (30d)", value: jobCardsData.stats.total30d },
                  { label: "Pending", value: jobCardsData.stats.pending },
                  { label: "Confirmed", value: jobCardsData.stats.confirmed },
                  { label: "Adjusted", value: jobCardsData.stats.adjusted },
                  { label: "Response Rate", value: `${jobCardsData.stats.responseRate}%` },
                  { label: "Avg Response", value: jobCardsData.stats.avgResponseTimeMinutes != null ? `${jobCardsData.stats.avgResponseTimeMinutes}min` : "\u2014" },
                  { label: "Photos", value: jobCardsData.stats.totalPhotos || 0 },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                    <p className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>{s.value}</p>
                    <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Pricing Config Summary */}
            {jobCardsData.pricingRanges.length > 0 && (
              <div className="rounded-lg p-4" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--db-text)" }}>Pricing Configuration</p>
                <div className="flex flex-wrap gap-2">
                  {jobCardsData.pricingRanges.map((r) => (
                    <span key={r.id} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                      style={{ background: r.mode === "advanced" ? "#dbeafe" : "var(--db-hover)", color: r.mode === "advanced" ? "#1d4ed8" : "var(--db-text-muted)" }}>
                      {r.jobTypeLabel}
                      {r.minPrice != null && r.maxPrice != null && (
                        <span> · ${r.minPrice.toLocaleString()}–${r.maxPrice.toLocaleString()}</span>
                      )}
                      {r.mode === "advanced" && <span> (formula)</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Job Cards */}
            {jobCardsData.cards.length === 0 && (
              <p className="py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No job cards yet</p>
            )}
            {jobCardsData.cards.map((card) => (
              <div
                key={card.id}
                className="cursor-pointer rounded-lg p-4 transition-colors"
                style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
                onClick={() => setExpandedJobCard(expandedJobCard === card.id ? null : card.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                        {card.callerName || "Unknown Caller"}
                        {card.callerPhone && <span className="ml-1 text-xs" style={{ color: "var(--db-text-muted)" }}>({card.callerPhone})</span>}
                      </p>
                      <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                        {card.jobTypeLabel || "Service requested"} · {card.scopeLevel || "residential"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {card.estimateMin != null && card.estimateMax != null ? (
                      <span className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
                        ${(card.ownerAdjustedMin || card.estimateMin).toLocaleString()}–${(card.ownerAdjustedMax || card.estimateMax).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>No estimate</span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      card.estimateConfidence === "estimated" ? "bg-blue-100 text-blue-700"
                      : card.estimateConfidence === "ballpark" ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500"
                    }`}>
                      {card.estimateConfidence || "none"}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      card.status === "confirmed" ? "bg-green-100 text-green-700"
                      : card.status === "adjusted" ? "bg-blue-100 text-blue-700"
                      : card.status === "site_visit_requested" ? "bg-purple-100 text-purple-700"
                      : card.status === "expired" ? "bg-gray-100 text-gray-400"
                      : card.status === "awaiting_adjustment" ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500"
                    }`}>
                      {card.status?.replace(/_/g, " ") || "pending"}
                    </span>
                    <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                      {formatDate(card.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Expanded View */}
                {expandedJobCard === card.id && (
                  <div className="mt-4 space-y-3 border-t pt-3" style={{ borderColor: "var(--db-border)" }}>
                    {card.scopeDescription && (
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "var(--db-text-muted)" }}>Scope</p>
                        <p className="text-sm" style={{ color: "var(--db-text)" }}>{card.scopeDescription}</p>
                      </div>
                    )}
                    {card.estimateMode === "advanced" && card.estimateCalculationJson && (
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "var(--db-text-muted)" }}>Calculation Breakdown</p>
                        <pre className="mt-1 rounded bg-gray-50 p-2 text-xs overflow-auto" style={{ color: "var(--db-text)" }}>
                          {JSON.stringify(card.estimateCalculationJson, null, 2)}
                        </pre>
                      </div>
                    )}
                    {card.ownerResponse && (
                      <div className="rounded-lg p-3" style={{ background: card.ownerResponse === "confirmed" ? "rgba(34,197,94,0.08)" : card.ownerResponse === "adjusted" ? "rgba(99,102,241,0.08)" : "rgba(59,130,246,0.08)" }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: "var(--db-text-muted)" }}>Owner Response</p>
                        <p className="text-sm" style={{ color: "var(--db-text)" }}>
                          {card.ownerResponse === "confirmed" && "Estimate confirmed"}
                          {card.ownerResponse === "adjusted" && card.ownerAdjustedMin != null && card.ownerAdjustedMax != null && (
                            <>Adjusted to ${card.ownerAdjustedMin.toLocaleString()}–${card.ownerAdjustedMax.toLocaleString()}</>
                          )}
                          {card.ownerResponse === "site_visit" && "Site visit requested"}
                          {card.ownerRespondedAt && (
                            <span className="ml-2 text-xs" style={{ color: "var(--db-text-muted)" }}>{formatDate(card.ownerRespondedAt)}</span>
                          )}
                        </p>
                      </div>
                    )}
                    {card.customerNotifiedAt && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
                        Customer notified {formatDate(card.customerNotifiedAt)}
                      </div>
                    )}
                    {/* Response Timeline */}
                    {card.responses && card.responses.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--db-text-muted)" }}>Response Timeline</p>
                        <div className="space-y-1">
                          {card.responses.map((r) => (
                            <div key={r.id} className="flex items-center gap-2 text-xs">
                              <span className={`rounded px-1.5 py-0.5 ${r.direction === "inbound" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                {r.direction === "inbound" ? "Owner" : "System"}
                              </span>
                              <span style={{ color: "var(--db-text)" }}>{r.rawReply || r.messageType.replace(/_/g, " ")}</span>
                              <span className="ml-auto" style={{ color: "var(--db-text-muted)" }}>{formatDate(r.createdAt)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Notes Tab */}
        {tab === "notes" && (
          <div className="space-y-4">
            {/* Add note form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                placeholder="Add a note..."
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  border: "1px solid var(--db-border)",
                  background: "var(--db-hover)",
                  color: "var(--db-text)",
                }}
              />
              <button
                onClick={addNote}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
                style={{ background: "var(--db-accent)", color: "#fff" }}
              >
                Add
              </button>
            </div>

            {/* Notes list */}
            {notes.length === 0 && (
              <p className="py-8 text-center text-xs" style={{ color: "var(--db-text-muted)" }}>No notes yet</p>
            )}
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg px-4 py-3" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
                <p className="text-sm" style={{ color: "var(--db-text)" }}>{note.noteText}</p>
                <p className="mt-2 text-xs" style={{ color: "var(--db-text-muted)" }}>
                  {note.createdBy} · {formatDate(note.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
