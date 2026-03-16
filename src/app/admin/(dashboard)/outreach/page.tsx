"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import DataTable, { type Column } from "../../_components/data-table";
import MetricCard from "../../_components/metric-card";

// ── Types ──

interface Prospect {
  id: string;
  businessName: string;
  phone?: string;
  email?: string;
  website?: string;
  city?: string;
  state?: string;
  vertical?: string;
  leadScore?: number;
  source: string;
  outreachStatus: string;
  nextFollowUpAt?: string;
  lastTouchAt?: string;
  createdAt: string;
  touchCount: number;
  lastOutcome?: string;
  lastNotes?: string;
}

interface Touch {
  id: string;
  prospectId: string;
  channel: string;
  outcome: string;
  notes?: string;
  followUpAt?: string;
  durationSeconds?: number;
  createdAt: string;
}

interface Stats {
  today: number;
  thisWeek: number;
  followUpsDue: number;
  interested: number;
}

type Tab = "fresh" | "follow_ups" | "interested" | "worked";

const TABS: { key: Tab; label: string }[] = [
  { key: "fresh", label: "Fresh" },
  { key: "follow_ups", label: "Follow-ups" },
  { key: "interested", label: "Interested" },
  { key: "worked", label: "Worked" },
];

const WORKED_STATUSES = [
  { value: "", label: "All Worked" },
  { value: "attempted", label: "Attempted" },
  { value: "demo_booked", label: "Demo Booked" },
  { value: "onboarded", label: "Onboarded" },
  { value: "not_interested", label: "Not Interested" },
  { value: "disqualified", label: "Disqualified" },
];

const CHANNELS = ["call", "sms", "email", "dm"] as const;
const OUTCOMES = [
  { value: "interested", label: "Interested", color: "#4ade80" },
  { value: "no_answer", label: "No Answer", color: "#94a3b8" },
  { value: "left_voicemail", label: "Voicemail", color: "#60a5fa" },
  { value: "circle_back", label: "Circle Back", color: "#fbbf24" },
  { value: "booked_demo", label: "Booked Demo", color: "#a855f7" },
  { value: "not_interested", label: "Not Interested", color: "#f87171" },
  { value: "gatekeeper", label: "Gatekeeper", color: "#fb923c" },
  { value: "wrong_number", label: "Wrong Number", color: "#ef4444" },
] as const;

const FOLLOW_UP_PRESETS = [
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "Next Week", days: 7 },
  { label: "In 2 weeks", days: 14 },
];

const outreachStatusColors: Record<string, { bg: string; text: string }> = {
  fresh: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8" },
  attempted: { bg: "rgba(96,165,250,0.15)", text: "#60a5fa" },
  interested: { bg: "rgba(74,222,128,0.15)", text: "#4ade80" },
  follow_up: { bg: "rgba(251,191,36,0.15)", text: "#fbbf24" },
  demo_booked: { bg: "rgba(168,85,247,0.15)", text: "#a855f7" },
  onboarded: { bg: "rgba(74,222,128,0.2)", text: "#22c55e" },
  not_interested: { bg: "rgba(248,113,113,0.15)", text: "#f87171" },
  disqualified: { bg: "rgba(248,113,113,0.1)", text: "#f87171" },
};

// ── Call Script Steps ──

const SCRIPT_STEPS = [
  {
    num: 1,
    title: "Opener",
    line: `Hey [NAME], how've you been? ... Hey listen, the reason I'm calling — I work with [TRADE] companies in [CITY] and most of them were losing a ton of jobs to missed calls. Wanted to see if that's something you deal with too.`,
  },
  {
    num: 2,
    title: "Pain + Qualify",
    line: `How many calls a day do you think you guys get? And when you miss one — like you're on a job or it's after hours — what happens? [Let them answer] Yeah, most [TRADE] guys we talk to are missing 15-30 a month and each one is $200-500 walking to a competitor.`,
  },
  {
    num: 3,
    title: "What It Does",
    line: `So we built an AI front office — not an answering service. It actually books the job right on the call, gives pricing ballparks, sends the customer a confirmation text, and follows up on estimates automatically. Works 24/7, speaks English and Spanish. You can even text it from the job site and it manages your whole schedule.`,
  },
  {
    num: 4,
    title: "The Extras",
    line: `It also auto-texts missed callers back within 60 seconds, sends appointment reminders so people don't no-show, asks happy customers for Google reviews, and sends you a daily briefing of everything that happened. It's like having a full office manager for less than one lost job per month.`,
  },
  {
    num: 5,
    title: "ROI Flip",
    line: `What's your average job worth? [Let them answer] So one extra booked job a month pays for the whole thing, and you're probably missing 15-30 calls. Everything after that first job is pure profit.`,
  },
  {
    num: 6,
    title: "Close",
    line: `I can get you set up today and you'd be live by tomorrow morning. 30-day money-back guarantee, zero risk. Want me to get you started?`,
  },
];

const OBJECTION_HANDLERS = [
  {
    trigger: '"Not interested"',
    response: `All good — just so you know, this isn't an answering service. It books jobs on the call, follows up on estimates, sends review requests, and you can text it from the job site to manage your schedule. If any of that sounds useful, I'm around. If not, no worries.`,
  },
  {
    trigger: '"We have an answering service"',
    response: `Yeah most of our customers had one. The difference is answering services take messages — ours books the job right on the call, gives pricing, texts the customer a confirmation, follows up on open estimates, and speaks Spanish. Plus you can text it from the job site and it runs your calendar. That's why most of them switch.`,
  },
  {
    trigger: '"Too expensive"',
    response: `What's your average job worth? [Let them answer] So one extra job a month covers the whole thing. And you're also getting automatic estimate follow-ups, Google review requests, appointment reminders, daily briefings, missed call recovery — you'd pay $2K+/mo for all that separately. Plus 30-day money-back guarantee.`,
  },
  {
    trigger: '"Send me info"',
    response: `Absolutely — what's your best email? [Get it] Quick question so I send the right stuff — is the bigger issue after-hours calls, or keeping up during the day when you're on a job? [Engage, then:] I'll send you a quick overview tonight. How about I call you [DAY] at [TIME] to walk through it? Takes 5 min.`,
  },
  {
    trigger: "Gatekeeper / receptionist",
    response: `Hey, maybe you can help me actually — I work with [TRADE] companies in [CITY] and help them stop losing calls to voicemail. Do you guys ever get complaints from customers who couldn't get through? [Let them talk] What's the best time to catch the owner?`,
  },
];

const VOICEMAIL_SCRIPT = `Hey [NAME], it's Ulysses. I work with [TRADE] companies in [CITY] — we built something that answers your phone 24/7 and actually books the job on the call instead of just taking a message. Gimme a shout back — I'll also shoot you a text. Thanks.`;

// ── Helpers ──

function formatDate(d?: string) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateTime(d?: string) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isOverdue(d?: string) {
  if (!d) return false;
  return new Date(d) < new Date();
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Rule of 100 Progress Ring ──

function ProgressRing({ value, max }: { value: number; max: number }) {
  const pct = Math.min(value / max, 1);
  const r = 20;
  const c = 2 * Math.PI * r;
  const offset = c - pct * c;
  const color = value >= max ? "#4ade80" : "#D4A843";

  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--db-border)" strokeWidth="4" />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
      />
      <text
        x="28"
        y="28"
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--db-text)"
        fontSize="12"
        fontWeight="600"
      >
        {value}
      </text>
    </svg>
  );
}

// ── SMS Template (copy-paste) ──

const SMS_TEMPLATE = `Hey [BUSINESS] — this is Ulysses. I work with [TRADE] companies in the area. We built an AI that answers your phone 24/7, books the job right on the call, follows up on estimates, sends review requests, and speaks Spanish. It's like a full office manager for less than one lost job/month. Worth a quick chat?`;

function SmsTemplate({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(SMS_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: "var(--db-card)",
        border: "1px solid var(--db-border)",
        boxShadow: "var(--db-card-shadow)",
      }}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
        style={{ borderBottom: collapsed ? "none" : "1px solid var(--db-border)" }}
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
            SMS Template
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}>
            copy & paste
          </span>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--db-text-muted)" strokeWidth="2"
          style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {!collapsed && (
        <div className="px-4 py-3 space-y-2">
          <div
            className="rounded-lg p-3 text-sm leading-relaxed cursor-pointer select-all"
            style={{ background: "var(--db-hover)", color: "var(--db-text)", border: "1px solid var(--db-border)" }}
            onClick={handleCopy}
          >
            {SMS_TEMPLATE}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px]" style={{ color: "var(--db-text-muted)" }}>
              Replace <strong>[BUSINESS]</strong> and <strong>[TRADE]</strong> before sending. Click message to copy.
            </p>
            <button
              onClick={handleCopy}
              className="rounded px-3 py-1 text-xs font-medium transition-colors"
              style={{
                background: copied ? "rgba(74,222,128,0.15)" : "rgba(96,165,250,0.15)",
                color: copied ? "#4ade80" : "#60a5fa",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sticky Call Script ──

function CallScript({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: "var(--db-card)",
        border: "1px solid var(--db-border)",
        boxShadow: "var(--db-card-shadow)",
      }}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
        style={{ borderBottom: collapsed ? "none" : "1px solid var(--db-border)" }}
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--db-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
            Call Script
          </span>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--db-text-muted)" strokeWidth="2"
          style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {!collapsed && (
        <div className="px-4 py-3 space-y-3">
          {/* Script steps */}
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            {SCRIPT_STEPS.map((s) => (
              <div key={s.num} className="rounded-lg p-2.5" style={{ background: "var(--db-hover)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--db-accent)" }}>
                  {s.num}. {s.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--db-text)" }}>
                  {s.line}
                </p>
              </div>
            ))}
          </div>

          {/* Objection handlers */}
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#f87171" }}>
              Objection Handlers
            </p>
            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-2 xl:grid-cols-3">
              {OBJECTION_HANDLERS.map((o) => (
                <div key={o.trigger} className="rounded-lg p-2.5" style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.1)" }}>
                  <p className="text-[10px] font-semibold" style={{ color: "#f87171" }}>
                    {o.trigger}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--db-text)" }}>
                    {o.response}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Voicemail Script Modal ──

function VoicemailModal({
  prospect,
  onClose,
  onConfirm,
}: {
  prospect: Prospect;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const script = VOICEMAIL_SCRIPT
    .replace("[NAME]", prospect.businessName)
    .replace("[TRADE]", prospect.vertical ?? "home service")
    .replace("[CITY]", prospect.city ?? "your area");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50" />
      <div
        className="relative z-10 w-full max-w-lg rounded-xl p-6 space-y-4"
        style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
              Voicemail Script
            </h3>
            <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
              {prospect.businessName} — leave this voicemail, then auto follow-up via SMS + email
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1" style={{ color: "var(--db-text-muted)" }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" />
            </svg>
          </button>
        </div>

        <div
          className="rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            background: "var(--db-hover)",
            color: "var(--db-text)",
            border: "1px solid var(--db-border)",
          }}
        >
          {script}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ color: "var(--db-text-muted)", border: "1px solid var(--db-border)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ background: "var(--db-accent)", color: "#fff" }}
          >
            Log Voicemail & Start Follow-up Sequence
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Expanded Row Content ──

function ExpandedRow({
  prospect,
  onLogged,
}: {
  prospect: Prospect;
  onLogged: (stay: boolean) => void;
}) {
  const [channel, setChannel] = useState<string>("call");
  const [outcome, setOutcome] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [touches, setTouches] = useState<Touch[]>([]);
  const [copied, setCopied] = useState(false);
  const [showVoicemailModal, setShowVoicemailModal] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/outreach/touches/${prospect.id}?limit=3`)
      .then((r) => (r.ok ? r.json() : { touches: [] }))
      .then((d) => setTouches(d.touches ?? []))
      .catch(() => {});
  }, [prospect.id]);

  async function logTouch(stay: boolean, overrideOutcome?: string, overrideNotes?: string) {
    const finalOutcome = overrideOutcome ?? outcome;
    if (!finalOutcome) return;
    setSaving(true);
    try {
      await fetch("/api/admin/outreach/touches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId: prospect.id,
          channel,
          outcome: finalOutcome,
          notes: (overrideNotes ?? notes) || undefined,
          followUpAt: finalOutcome === "circle_back" && followUpDate ? new Date(followUpDate).toISOString() : undefined,
        }),
      });
      setOutcome("");
      setNotes("");
      setFollowUpDate("");
      onLogged(stay);
    } finally {
      setSaving(false);
    }
  }

  function handleNoResponse() {
    setShowVoicemailModal(true);
  }

  async function handleVoicemailConfirm() {
    setShowVoicemailModal(false);
    // Start automated SMS/email sequence for this prospect
    try {
      await fetch("/api/outreach/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectIds: [prospect.id] }),
      });
    } catch {}
    logTouch(false, "left_voicemail", "Left voicemail + started automated follow-up sequence");
  }

  function copyPhone() {
    if (prospect.phone) {
      navigator.clipboard.writeText(prospect.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  async function sendWarmupSms() {
    if (!prospect.phone || smsSending || smsSent) return;
    setSmsSending(true);
    try {
      const res = await fetch("/api/admin/outreach/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectIds: [prospect.id] }),
      });
      if (res.ok) {
        setSmsSent(true);
        onLogged(true); // refresh stats
      }
    } finally {
      setSmsSending(false);
    }
  }

  return (
    <>
      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: "280px 1fr" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Contact info + recent touches */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
              Contact
            </p>
            <div className="mt-1 space-y-1">
              {prospect.phone && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyPhone}
                    className="flex items-center gap-2 text-sm transition-colors"
                    style={{ color: "var(--db-accent)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {prospect.phone}
                    {copied && <span className="text-xs" style={{ color: "#4ade80" }}>Copied!</span>}
                  </button>
                  <button
                    onClick={sendWarmupSms}
                    disabled={smsSending || smsSent}
                    className="rounded px-2 py-0.5 text-[10px] font-medium transition-colors"
                    style={{
                      background: smsSent ? "rgba(74,222,128,0.15)" : "rgba(96,165,250,0.15)",
                      color: smsSent ? "#4ade80" : "#60a5fa",
                    }}
                  >
                    {smsSent ? "SMS Sent" : smsSending ? "Sending..." : "Send SMS"}
                  </button>
                </div>
              )}
              {prospect.email && (
                <p className="flex items-center gap-2 text-sm" style={{ color: "var(--db-text-muted)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  {prospect.email}
                </p>
              )}
              {prospect.website && (
                <a
                  href={prospect.website.startsWith("http") ? prospect.website : `https://${prospect.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "var(--db-text-muted)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Website
                </a>
              )}
            </div>
          </div>

          {touches.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
                Recent Touches
              </p>
              <div className="mt-1 space-y-1.5">
                {touches.map((t) => (
                  <div key={t.id} className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                    <span className="font-medium" style={{ color: "var(--db-text)" }}>
                      {t.channel}
                    </span>
                    {" \u2192 "}
                    <span>{t.outcome.replace(/_/g, " ")}</span>
                    <span className="ml-1 opacity-60">{formatDateTime(t.createdAt)}</span>
                    {t.notes && <p className="mt-0.5 opacity-80">{t.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Log Touch form */}
        <div className="space-y-3">
          {/* Channel */}
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
              Channel
            </p>
            <div className="flex gap-1.5">
              {CHANNELS.map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors capitalize"
                  style={{
                    background: channel === ch ? "var(--db-accent)" : "var(--db-hover)",
                    color: channel === ch ? "#fff" : "var(--db-text-muted)",
                  }}
                >
                  {ch === "dm" ? "DM" : ch}
                </button>
              ))}
            </div>
          </div>

          {/* Outcome */}
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
              Outcome
            </p>
            <div className="flex flex-wrap gap-1.5">
              {OUTCOMES.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setOutcome(o.value)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: outcome === o.value ? o.color : "var(--db-hover)",
                    color: outcome === o.value ? "#fff" : "var(--db-text-muted)",
                  }}
                >
                  {o.label}
                </button>
              ))}
              {/* No Response — special button */}
              <button
                onClick={handleNoResponse}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: "var(--db-hover)",
                  color: "#fb923c",
                  border: "1px dashed #fb923c",
                }}
              >
                No Response
              </button>
            </div>
          </div>

          {/* Follow-up date (only for circle_back) */}
          {outcome === "circle_back" && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--db-text-muted)" }}>
                Follow-up Date
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="rounded-lg px-3 py-1.5 text-sm outline-none"
                  style={{
                    background: "var(--db-hover)",
                    border: "1px solid var(--db-border)",
                    color: "var(--db-text)",
                  }}
                />
                <div className="flex gap-1">
                  {FOLLOW_UP_PRESETS.map((p) => (
                    <button
                      key={p.days}
                      onClick={() => setFollowUpDate(addDays(p.days))}
                      className="rounded px-2 py-1 text-[10px] font-medium transition-colors"
                      style={{
                        background: "var(--db-hover)",
                        color: "var(--db-text-muted)",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <input
            type="text"
            placeholder="Quick note..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: "var(--db-hover)",
              border: "1px solid var(--db-border)",
              color: "var(--db-text)",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && outcome) {
                e.preventDefault();
                logTouch(false);
              }
            }}
          />

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => logTouch(false)}
              disabled={!outcome || saving}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40"
              style={{ background: "var(--db-accent)", color: "#fff" }}
            >
              {saving ? "Saving..." : "Log & Next \u2192"}
            </button>
            <button
              onClick={() => logTouch(true)}
              disabled={!outcome || saving}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40"
              style={{
                background: "transparent",
                color: "var(--db-text-muted)",
                border: "1px solid var(--db-border)",
              }}
            >
              Log & Stay
            </button>
          </div>
        </div>
      </div>

      {/* Voicemail script modal */}
      {showVoicemailModal && (
        <VoicemailModal
          prospect={prospect}
          onClose={() => setShowVoicemailModal(false)}
          onConfirm={handleVoicemailConfirm}
        />
      )}
    </>
  );
}

// ── Main Page ──

export default function OutreachPage() {
  const [tab, setTab] = useState<Tab>("fresh");
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [workedFilter, setWorkedFilter] = useState("");
  const [stats, setStats] = useState<Stats>({ today: 0, thisWeek: 0, followUpsDue: 0, interested: 0 });
  const [scriptCollapsed, setScriptCollapsed] = useState(false);
  const [smsCollapsed, setSmsCollapsed] = useState(false);
  const [bulkSmsStatus, setBulkSmsStatus] = useState<"idle" | "sending" | "done">("idle");
  const [bulkSmsResult, setBulkSmsResult] = useState<{ sent: number; skipped: number } | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchProspects = useCallback(async () => {
    const params = new URLSearchParams({
      tab,
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    });
    if (search) params.set("search", search);
    if (tab === "worked" && workedFilter) params.set("status", workedFilter);

    const res = await fetch(`/api/admin/outreach?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setProspects(data.data);
    setPagination((prev) => ({ ...prev, ...data.pagination }));
  }, [tab, pagination.page, pagination.limit, search, workedFilter]);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/outreach/stats");
    if (!res.ok) return;
    const data = await res.json();
    setStats(data);
  }, []);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  function handleSearchChange(val: string) {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(val);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 300);
  }

  function handleTabChange(t: Tab) {
    setTab(t);
    setPagination((p) => ({ ...p, page: 1 }));
    setWorkedFilter("");
  }

  function handleTouchLogged(stay: boolean) {
    fetchStats();
    fetchProspects().then(() => {
      if (!stay) {
        // Auto-advance handled by DataTable — row will collapse
        // and user continues through the list
      }
    });
  }

  async function sendBulkWarmupSms() {
    if (bulkSmsStatus === "sending") return;
    setBulkSmsStatus("sending");
    setBulkSmsResult(null);

    // Send to all fresh prospects on current page that have phones
    const ids = prospects.filter((p) => p.phone).map((p) => p.id);
    if (ids.length === 0) {
      setBulkSmsStatus("idle");
      return;
    }

    try {
      const res = await fetch("/api/admin/outreach/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectIds: ids }),
      });
      if (res.ok) {
        const data = await res.json();
        setBulkSmsResult({ sent: data.sent, skipped: data.skipped });
        setBulkSmsStatus("done");
        fetchStats();
        fetchProspects();
        setTimeout(() => setBulkSmsStatus("idle"), 5000);
      } else {
        setBulkSmsStatus("idle");
      }
    } catch {
      setBulkSmsStatus("idle");
    }
  }

  // ── Column definitions per tab ──

  const freshColumns: Column<Prospect>[] = [
    { key: "businessName", label: "Business", render: (r) => <span className="font-medium">{r.businessName}</span> },
    { key: "city", label: "City", render: (r) => <span>{r.city ?? "\u2014"}</span> },
    { key: "vertical", label: "Vertical", render: (r) => <span className="capitalize">{r.vertical ?? "\u2014"}</span> },
    { key: "phone", label: "Phone", render: (r) => <span className="tabular-nums">{r.phone ?? "\u2014"}</span> },
    { key: "leadScore", label: "Score", render: (r) => <span className="tabular-nums">{r.leadScore ?? 0}</span> },
    { key: "source", label: "Source", render: (r) => <span className="text-xs">{r.source.replace(/_/g, " ")}</span> },
    { key: "createdAt", label: "Added", render: (r) => <span className="text-xs">{formatDate(r.createdAt)}</span> },
  ];

  const followUpColumns: Column<Prospect>[] = [
    { key: "businessName", label: "Business", render: (r) => <span className="font-medium">{r.businessName}</span> },
    { key: "phone", label: "Phone", render: (r) => <span className="tabular-nums">{r.phone ?? "\u2014"}</span> },
    {
      key: "nextFollowUpAt",
      label: "Follow-up",
      render: (r) => (
        <span style={{ color: isOverdue(r.nextFollowUpAt) ? "#f87171" : "var(--db-text)", fontWeight: isOverdue(r.nextFollowUpAt) ? 600 : 400 }}>
          {formatDate(r.nextFollowUpAt)}
          {isOverdue(r.nextFollowUpAt) && " (overdue)"}
        </span>
      ),
    },
    { key: "lastTouchAt", label: "Last Touch", render: (r) => <span className="text-xs">{formatDate(r.lastTouchAt)}</span> },
    { key: "lastOutcome", label: "Last Outcome", render: (r) => <span className="text-xs capitalize">{r.lastOutcome?.replace(/_/g, " ") ?? "\u2014"}</span> },
    { key: "lastNotes", label: "Notes", render: (r) => <span className="text-xs max-w-[200px] truncate block">{r.lastNotes ?? "\u2014"}</span> },
  ];

  const interestedColumns: Column<Prospect>[] = [
    { key: "businessName", label: "Business", render: (r) => <span className="font-medium">{r.businessName}</span> },
    { key: "phone", label: "Phone", render: (r) => <span className="tabular-nums">{r.phone ?? "\u2014"}</span> },
    { key: "touchCount", label: "Touches", render: (r) => <span className="tabular-nums">{r.touchCount}</span> },
    { key: "lastTouchAt", label: "Last Touch", render: (r) => <span className="text-xs">{formatDate(r.lastTouchAt)}</span> },
    { key: "lastOutcome", label: "Last Outcome", render: (r) => <span className="text-xs capitalize">{r.lastOutcome?.replace(/_/g, " ") ?? "\u2014"}</span> },
    { key: "lastNotes", label: "Notes", render: (r) => <span className="text-xs max-w-[200px] truncate block">{r.lastNotes ?? "\u2014"}</span> },
  ];

  const workedColumns: Column<Prospect>[] = [
    { key: "businessName", label: "Business", render: (r) => <span className="font-medium">{r.businessName}</span> },
    { key: "phone", label: "Phone", render: (r) => <span className="tabular-nums">{r.phone ?? "\u2014"}</span> },
    {
      key: "outreachStatus",
      label: "Status",
      render: (r) => {
        const sc = outreachStatusColors[r.outreachStatus ?? "fresh"] ?? { bg: "var(--db-hover)", text: "var(--db-text-muted)" };
        return (
          <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: sc.bg, color: sc.text }}>
            {(r.outreachStatus ?? "fresh").replace(/_/g, " ")}
          </span>
        );
      },
    },
    { key: "touchCount", label: "Touches", render: (r) => <span className="tabular-nums">{r.touchCount}</span> },
    { key: "lastTouchAt", label: "Last Touch", render: (r) => <span className="text-xs">{formatDate(r.lastTouchAt)}</span> },
    { key: "lastOutcome", label: "Last Outcome", render: (r) => <span className="text-xs capitalize">{r.lastOutcome?.replace(/_/g, " ") ?? "\u2014"}</span> },
  ];

  const columns =
    tab === "fresh" ? freshColumns :
    tab === "follow_ups" ? followUpColumns :
    tab === "interested" ? interestedColumns :
    workedColumns;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Outreach</h1>
          <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
            Manual sales outreach — Rule of 100
          </p>
        </div>
        {tab === "fresh" && (
          <div className="flex items-center gap-2">
            <button
              onClick={sendBulkWarmupSms}
              disabled={bulkSmsStatus === "sending" || prospects.length === 0}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40"
              style={{ background: "#60a5fa", color: "#fff" }}
            >
              {bulkSmsStatus === "sending"
                ? "Sending..."
                : bulkSmsStatus === "done"
                  ? `Sent ${bulkSmsResult?.sent ?? 0} SMS`
                  : `Send Warm-up SMS to Page (${prospects.filter((p) => p.phone).length})`}
            </button>
          </div>
        )}
      </div>

      {/* Sticky SMS Template + Call Script */}
      <div className="sticky top-0 z-10 space-y-2">
        <SmsTemplate collapsed={smsCollapsed} onToggle={() => setSmsCollapsed(!smsCollapsed)} />
        <CallScript collapsed={scriptCollapsed} onToggle={() => setScriptCollapsed(!scriptCollapsed)} />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Today's Touches" value={stats.today} />
        <div
          className="flex items-center gap-4 rounded-xl p-5 transition-colors duration-300"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
            boxShadow: "var(--db-card-shadow)",
          }}
        >
          <ProgressRing value={stats.today} max={100} />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>
              Rule of 100
            </p>
            <p className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
              {stats.today}/100
            </p>
            <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
              {stats.thisWeek}/500 this week
            </p>
          </div>
        </div>
        <MetricCard
          label="Follow-ups Due"
          value={stats.followUpsDue}
          change={stats.followUpsDue > 0 ? "Needs attention" : "All clear"}
          changeType={stats.followUpsDue > 0 ? "negative" : "positive"}
        />
        <MetricCard label="Interested" value={stats.interested} changeType="positive" />
      </div>

      {/* Tabs + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--db-hover)" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                background: tab === t.key ? "var(--db-card)" : "transparent",
                color: tab === t.key ? "var(--db-text)" : "var(--db-text-muted)",
                boxShadow: tab === t.key ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search businesses..."
            defaultValue={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm outline-none w-56"
            style={{
              background: "var(--db-hover)",
              border: "1px solid var(--db-border)",
              color: "var(--db-text)",
            }}
          />
          {tab === "worked" && (
            <select
              value={workedFilter}
              onChange={(e) => {
                setWorkedFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                background: "var(--db-hover)",
                border: "1px solid var(--db-border)",
                color: "var(--db-text)",
              }}
            >
              {WORKED_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={prospects}
        pagination={{
          ...pagination,
          onPageChange: (p) => setPagination((prev) => ({ ...prev, page: p })),
        }}
        expandedContent={(row) => (
          <ExpandedRow
            prospect={row}
            onLogged={(stay) => handleTouchLogged(stay)}
          />
        )}
      />
    </div>
  );
}
