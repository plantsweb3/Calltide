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

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t
        ? "bg-slate-800 text-slate-100"
        : "text-slate-400 hover:text-slate-200"
    }`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-400">Platform configuration</p>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-900 p-1 w-fit border border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={tabClass(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "email" && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-slate-300">
            Missed Call Sequence (3 emails)
          </h2>
          {Object.entries(missedCallSequence).map(([key, factory]) => {
            const template = factory("[Business Name]");
            return (
              <div
                key={key}
                className="rounded-xl border border-slate-800 bg-slate-900 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400">{key}</span>
                </div>
                <p className="text-sm font-medium text-slate-200">
                  {template.subject}
                </p>
                <div
                  className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-slate-800 p-3 text-xs text-slate-400"
                  dangerouslySetInnerHTML={{ __html: template.html }}
                />
              </div>
            );
          })}

          <h2 className="text-sm font-medium text-slate-300 mt-6">
            Answered Sequence (1 email)
          </h2>
          {Object.entries(answeredSequence).map(([key, factory]) => {
            const template = factory("[Business Name]");
            return (
              <div
                key={key}
                className="rounded-xl border border-slate-800 bg-slate-900 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400">{key}</span>
                </div>
                <p className="text-sm font-medium text-slate-200">
                  {template.subject}
                </p>
                <div
                  className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-slate-800 p-3 text-xs text-slate-400"
                  dangerouslySetInnerHTML={{ __html: template.html }}
                />
              </div>
            );
          })}
        </div>
      )}

      {tab === "sms" && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-slate-300">SMS Templates</h2>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-mono text-slate-400 mb-2">missed_sms_1</p>
            <p className="text-sm text-slate-200">
              Hi [Business Name]! We just tried calling and couldn&apos;t get
              through. Calltide is an AI receptionist that makes sure you never
              miss a call again — 24/7, bilingual. Interested? Reply YES for a
              quick demo. Reply STOP to opt out.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs font-mono text-slate-400 mb-2">missed_sms_2</p>
            <p className="text-sm text-slate-200">
              Hey [Business Name], just following up. Missing calls = missing
              revenue. Our AI answers, books appointments & takes messages for
              you. 10-min demo? Reply YES or visit calltide.com. Reply STOP to
              opt out.
            </p>
          </div>
        </div>
      )}

      {tab === "twilio" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
          <h2 className="text-sm font-medium text-slate-300">Twilio Configuration</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Account SID</p>
              <p className="font-mono text-slate-200">
                {process.env.NEXT_PUBLIC_APP_URL ? "Configured" : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Phone Number</p>
              <p className="font-mono text-slate-200">Configured</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Audit TwiML URL</p>
              <p className="font-mono text-xs text-slate-400 truncate">
                /api/audit/twiml
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status Callback URL</p>
              <p className="font-mono text-xs text-slate-400 truncate">
                /api/audit/status
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "api" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4">API Key Status</h2>
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
                className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-3"
              >
                <span className="text-sm text-slate-200">{key.name}</span>
                <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-400">
                  Check .env.local
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "scraping" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <h2 className="text-sm font-medium text-slate-300">Scraping Configuration</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">API</p>
              <p className="text-slate-200">Google Places (New) Text Search</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Max Results per Scrape</p>
              <p className="text-slate-200">60 (default)</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Deduplication</p>
              <p className="text-slate-200">By Place ID</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Enrichment</p>
              <p className="text-slate-200">
                Language detection, size estimation, lead scoring
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Lead Scoring (max 65 pts)</p>
            <div className="space-y-1 text-xs text-slate-400">
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
