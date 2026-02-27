"use client";

import { useState } from "react";
import { missedCallSequence, answeredSequence } from "@/lib/outreach/email-templates";

type Tab = "email" | "sms" | "twilio" | "api" | "scraping";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("email");

  const tabs: { key: Tab; label: string }[] = [
    { key: "email", label: "Email Templates" },
    { key: "sms", label: "SMS Templates" },
    { key: "twilio", label: "Twilio" },
    { key: "api", label: "API Keys" },
    { key: "scraping", label: "Scraping" },
  ];

  const tabClass = (t: Tab) => {
    const isActive = tab === t;
    return {
      baseClass: "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
      style: isActive
        ? { background: "var(--db-hover)", color: "var(--db-text)" }
        : { color: "var(--db-text-muted)" },
    };
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>Platform configuration</p>
      </div>

      <div className="flex gap-1 rounded-xl p-1 w-fit" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
        {tabs.map((t) => {
          const { baseClass, style } = tabClass(t.key);
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={baseClass}
              style={style}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "email" && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>
            Missed Call Sequence (3 emails)
          </h2>
          {Object.entries(missedCallSequence).map(([key, factory]) => {
            const template = factory("[Business Name]");
            return (
              <div
                key={key}
                className="rounded-xl p-4"
                style={{ border: "1px solid var(--db-border)", background: "var(--db-card)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono" style={{ color: "var(--db-text-muted)" }}>{key}</span>
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                  {template.subject}
                </p>
                <div
                  className="mt-2 max-h-40 overflow-y-auto rounded-lg p-3 text-xs"
                  style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
                  dangerouslySetInnerHTML={{ __html: template.html }}
                />
              </div>
            );
          })}

          <h2 className="text-sm font-medium mt-6" style={{ color: "var(--db-text-secondary)" }}>
            Answered Sequence (1 email)
          </h2>
          {Object.entries(answeredSequence).map(([key, factory]) => {
            const template = factory("[Business Name]");
            return (
              <div
                key={key}
                className="rounded-xl p-4"
                style={{ border: "1px solid var(--db-border)", background: "var(--db-card)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono" style={{ color: "var(--db-text-muted)" }}>{key}</span>
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                  {template.subject}
                </p>
                <div
                  className="mt-2 max-h-40 overflow-y-auto rounded-lg p-3 text-xs"
                  style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}
                  dangerouslySetInnerHTML={{ __html: template.html }}
                />
              </div>
            );
          })}
        </div>
      )}

      {tab === "sms" && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>SMS Templates</h2>
          <div className="rounded-xl p-4" style={{ border: "1px solid var(--db-border)", background: "var(--db-card)" }}>
            <p className="text-xs font-mono mb-2" style={{ color: "var(--db-text-muted)" }}>missed_sms_1</p>
            <p className="text-sm" style={{ color: "var(--db-text)" }}>
              Hi [Business Name]! We just tried calling and couldn&apos;t get
              through. Calltide is an AI receptionist that makes sure you never
              miss a call again — 24/7, bilingual. Interested? Reply YES for a
              quick demo. Reply STOP to opt out.
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ border: "1px solid var(--db-border)", background: "var(--db-card)" }}>
            <p className="text-xs font-mono mb-2" style={{ color: "var(--db-text-muted)" }}>missed_sms_2</p>
            <p className="text-sm" style={{ color: "var(--db-text)" }}>
              Hey [Business Name], just following up. Missing calls = missing
              revenue. Our AI answers, books appointments & takes messages for
              you. 10-min demo? Reply YES or visit calltide.app. Reply STOP to
              opt out.
            </p>
          </div>
        </div>
      )}

      {tab === "twilio" && (
        <div className="rounded-xl p-5 space-y-3" style={{ border: "1px solid var(--db-border)", background: "var(--db-card)" }}>
          <h2 className="text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>Twilio Configuration</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Account SID</p>
              <p className="font-mono" style={{ color: "var(--db-text)" }}>Configured</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Phone Number</p>
              <p className="font-mono" style={{ color: "var(--db-text)" }}>Configured</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Audit TwiML URL</p>
              <p className="font-mono text-xs truncate" style={{ color: "var(--db-text-muted)" }}>
                /api/audit/twiml
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Status Callback URL</p>
              <p className="font-mono text-xs truncate" style={{ color: "var(--db-text-muted)" }}>
                /api/audit/status
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "api" && (
        <div className="rounded-xl p-5" style={{ border: "1px solid var(--db-border)", background: "var(--db-card)" }}>
          <h2 className="text-sm font-medium mb-4" style={{ color: "var(--db-text-secondary)" }}>API Key Status</h2>
          <div className="space-y-3">
            {[
              { name: "Twilio", envVar: "TWILIO_ACCOUNT_SID" },
              { name: "Hume AI", envVar: "HUME_API_KEY" },
              { name: "Anthropic", envVar: "ANTHROPIC_API_KEY" },
              { name: "Google Places", envVar: "GOOGLE_PLACES_API_KEY" },
              { name: "Resend", envVar: "RESEND_API_KEY" },
            ].map((key) => (
              <div
                key={key.name}
                className="flex items-center justify-between rounded-lg px-4 py-3"
                style={{ background: "var(--db-hover)" }}
              >
                <span className="text-sm" style={{ color: "var(--db-text)" }}>{key.name}</span>
                <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}>
                  Check .env.local
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "scraping" && (
        <div className="rounded-xl p-5 space-y-4" style={{ border: "1px solid var(--db-border)", background: "var(--db-card)" }}>
          <h2 className="text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>Scraping Configuration</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>API</p>
              <p style={{ color: "var(--db-text)" }}>Google Places (New) Text Search</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Max Results per Scrape</p>
              <p style={{ color: "var(--db-text)" }}>60 (default)</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Deduplication</p>
              <p style={{ color: "var(--db-text)" }}>By Place ID</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Enrichment</p>
              <p style={{ color: "var(--db-text)" }}>
                Language detection, size estimation, lead scoring
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--db-text-muted)" }}>Lead Scoring (max 65 pts)</p>
            <div className="space-y-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
              <p>+15 — Has phone number</p>
              <p>+10 — Has website</p>
              <p>+10 — Rating below 4.0</p>
              <p>+15 — 10-100 reviews (active but small)</p>
              <p>+15 — Small business</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
