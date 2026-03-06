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

const inputStyle = {
  background: "var(--db-hover)",
  border: "1px solid var(--db-border)",
  color: "var(--db-text)",
};

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-client-title"
    >
      <div
        className="w-full max-w-md rounded-xl p-6"
        style={{
          background: "var(--db-card)",
          border: "1px solid var(--db-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="add-client-title" className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
            Add Client
          </h2>
          <button
            onClick={onClose}
            className="text-lg"
            style={{ color: "var(--db-text-muted)" }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--db-text-muted)" }}>
              Business Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--db-text-muted)" }}>
              Business Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            >
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--db-text-muted)" }}>
              Twilio Phone Number
            </label>
            <input
              type="tel"
              value={twilioNumber}
              onChange={(e) => setTwilioNumber(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
              placeholder="+1..."
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--db-text-muted)" }}>
              Owner Name
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--db-text-muted)" }}>
              Owner Phone
            </label>
            <input
              type="tel"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--db-text-muted)" }}>
              Owner Email (optional)
            </label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
            />
          </div>

          {error && (
            <div
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading || !name || !ownerName || !ownerPhone || !twilioNumber
            }
            className="w-full rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--db-accent)", color: "#fff" }}
          >
            {loading ? "Creating..." : "Add Client"}
          </button>
        </form>
      </div>
    </div>
  );
}
