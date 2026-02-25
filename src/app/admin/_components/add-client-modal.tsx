"use client";

import { useState } from "react";

const BUSINESS_TYPES = [
  "plumbing",
  "electrical",
  "hvac",
  "landscaping",
  "real estate",
  "dental",
  "salon",
  "general",
];

export default function AddClientModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState(BUSINESS_TYPES[0]);
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [twilioNumber, setTwilioNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type,
        ownerName,
        ownerPhone,
        ownerEmail: ownerEmail || undefined,
        twilioNumber,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      onComplete();
      onClose();
    } else {
      setError(data.error || "Failed to create client");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Client</h2>
          <button
            onClick={onClose}
            className="text-lg text-slate-400 hover:text-slate-200"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">
              Business Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">
              Business Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-green-500"
            >
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">
              Twilio Phone Number
            </label>
            <input
              type="tel"
              value={twilioNumber}
              onChange={(e) => setTwilioNumber(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-green-500"
              placeholder="+1..."
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">
              Owner Name
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">
              Owner Phone
            </label>
            <input
              type="tel"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">
              Owner Email (optional)
            </label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-green-500"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading || !name || !ownerName || !ownerPhone || !twilioNumber
            }
            className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-500 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Add Client"}
          </button>
        </form>
      </div>
    </div>
  );
}
