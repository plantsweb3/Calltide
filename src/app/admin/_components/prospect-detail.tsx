"use client";

import { useEffect, useState } from "react";

interface ProspectData {
  prospect: {
    id: string;
    businessName: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    vertical?: string;
    rating?: number;
    reviewCount?: number;
    language?: string;
    size?: string;
    leadScore?: number;
    status: string;
    auditResult?: string;
    tags?: string[];
    notes?: string;
    source: string;
    smsOptOut?: boolean;
    createdAt: string;
  };
  auditCalls: Array<{
    id: string;
    status: string;
    duration?: number;
    answeredBy?: string;
    createdAt: string;
  }>;
  outreach: Array<{
    id: string;
    channel: string;
    templateKey: string;
    status: string;
    sentAt: string;
    openedAt?: string;
    clickedAt?: string;
  }>;
}

const statusColors: Record<string, string> = {
  new: "bg-slate-600",
  audit_scheduled: "bg-amber-600",
  audit_complete: "bg-blue-600",
  outreach_active: "bg-purple-600",
  outreach_paused: "bg-amber-600",
  demo_booked: "bg-green-600",
  converted: "bg-green-500",
  disqualified: "bg-red-600",
};

export default function ProspectDetail({
  prospectId,
  onClose,
}: {
  prospectId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<ProspectData | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch(`/api/prospects/${prospectId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setNotes(d.prospect.notes ?? "");
      });
  }, [prospectId]);

  async function saveNotes() {
    await fetch(`/api/prospects/${prospectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
  }

  if (!data) {
    return (
      <div className="fixed inset-y-0 right-0 z-50 w-96 border-l border-slate-800 bg-slate-900 p-6">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  const { prospect, auditCalls, outreach } = data;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col border-l border-slate-800 bg-slate-900 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <h2 className="text-lg font-semibold truncate">{prospect.businessName}</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 text-lg"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${statusColors[prospect.status] ?? "bg-slate-600"}`}
          >
            {prospect.status.replace(/_/g, " ")}
          </span>
          {prospect.auditResult && (
            <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs text-slate-300">
              audit: {prospect.auditResult}
            </span>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {prospect.phone && (
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-slate-200">{prospect.phone}</p>
            </div>
          )}
          {prospect.email && (
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-slate-200 truncate">{prospect.email}</p>
            </div>
          )}
          {prospect.website && (
            <div className="col-span-2">
              <p className="text-xs text-slate-500">Website</p>
              <p className="text-slate-200 truncate">{prospect.website}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-500">Location</p>
            <p className="text-slate-200">
              {[prospect.city, prospect.state].filter(Boolean).join(", ")}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Vertical</p>
            <p className="text-slate-200">{prospect.vertical ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Rating</p>
            <p className="text-slate-200">
              {prospect.rating ? `${prospect.rating} (${prospect.reviewCount} reviews)` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Lead Score</p>
            <p className="text-slate-200">{prospect.leadScore ?? 0}/65</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Size</p>
            <p className="text-slate-200 capitalize">{prospect.size}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Language</p>
            <p className="text-slate-200">{prospect.language === "es" ? "Spanish" : "English"}</p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-slate-500">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-green-500 resize-none"
            rows={3}
          />
        </div>

        {/* Audit calls history */}
        <div>
          <h3 className="text-xs font-medium uppercase text-slate-400 mb-2">
            Audit Calls ({auditCalls.length})
          </h3>
          {auditCalls.length === 0 ? (
            <p className="text-xs text-slate-500">No audit calls yet</p>
          ) : (
            <div className="space-y-2">
              {auditCalls.map((call) => (
                <div
                  key={call.id}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-xs"
                >
                  <div className="flex justify-between">
                    <span className="text-slate-200">{call.status}</span>
                    <span className="text-slate-500">
                      {call.duration ? `${call.duration}s` : ""}
                    </span>
                  </div>
                  {call.answeredBy && (
                    <p className="text-slate-400">by: {call.answeredBy}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outreach history */}
        <div>
          <h3 className="text-xs font-medium uppercase text-slate-400 mb-2">
            Outreach ({outreach.length})
          </h3>
          {outreach.length === 0 ? (
            <p className="text-xs text-slate-500">No outreach yet</p>
          ) : (
            <div className="space-y-2">
              {outreach.map((o) => (
                <div
                  key={o.id}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-xs"
                >
                  <div className="flex justify-between">
                    <span className="text-slate-200">
                      {o.channel} — {o.templateKey}
                    </span>
                    <span className="text-slate-500">{o.status}</span>
                  </div>
                  {o.openedAt && (
                    <p className="text-slate-400">Opened: {o.openedAt}</p>
                  )}
                  {o.clickedAt && (
                    <p className="text-green-400">Clicked: {o.clickedAt}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
