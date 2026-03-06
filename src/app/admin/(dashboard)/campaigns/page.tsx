"use client";

import { useEffect, useState } from "react";

interface OutreachStats {
  status: string;
  count: number;
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  totalContacts: number;
  contactsReached: number;
  createdAt: string;
  businessName?: string;
}

export default function CampaignsPage() {
  const [tab, setTab] = useState<"sales" | "client">("sales");
  const [outreachStats, setOutreachStats] = useState<OutreachStats[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setError(null);
    Promise.all([
      fetch("/api/admin/dashboard")
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((data) => {
          const statuses = data.prospects?.byStatus ?? {};
          setOutreachStats(
            Object.entries(statuses).map(([status, count]) => ({
              status,
              count: count as number,
            })),
          );
        }),
      fetch("/api/admin/outbound")
        .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
        .then((data) => {
          // Group outbound calls by type as pseudo-campaigns
          const types: Record<string, { total: number; completed: number }> = {};
          for (const call of data.calls ?? []) {
            const t = call.callType || "general";
            if (!types[t]) types[t] = { total: 0, completed: 0 };
            types[t].total++;
            if (call.status === "completed") types[t].completed++;
          }
          setCampaigns(
            Object.entries(types).map(([type, stats]) => ({
              id: type,
              name: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              type: "outbound",
              status: "active",
              totalContacts: stats.total,
              contactsReached: stats.completed,
              createdAt: new Date().toISOString(),
            })),
          );
        }),
    ])
      .catch(() => setError("Failed to load campaign data"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>
          Campaigns
        </h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          Sales and client outreach
        </p>
      </div>

      {error && (
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          <button onClick={() => window.location.reload()} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>Retry</button>
        </div>
      )}

      <div
        className="flex gap-1 rounded-xl p-1 w-fit"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
      >
        <button
          onClick={() => setTab("sales")}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          style={{
            background: tab === "sales" ? "var(--db-hover)" : "transparent",
            color: tab === "sales" ? "var(--db-text)" : "var(--db-text-muted)",
          }}
        >
          Sales Campaigns
        </button>
        <button
          onClick={() => setTab("client")}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          style={{
            background: tab === "client" ? "var(--db-hover)" : "transparent",
            color: tab === "client" ? "var(--db-text)" : "var(--db-text-muted)",
          }}
        >
          Client Campaigns
        </button>
      </div>

      {tab === "sales" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {outreachStats
              .filter((s) =>
                ["outreach_active", "outreach_paused", "demo_booked", "converted"].includes(s.status),
              )
              .map((s) => (
                <div
                  key={s.status}
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--db-card)",
                    border: "1px solid var(--db-border)",
                  }}
                >
                  <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                    {s.status.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold" style={{ color: "var(--db-text)" }}>
                    {s.count}
                  </p>
                </div>
              ))}
          </div>

          <div
            className="rounded-xl p-5"
            style={{
              background: "var(--db-card)",
              border: "1px solid var(--db-border)",
            }}
          >
            <h3 className="mb-3 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>
              Outreach Funnel
            </h3>
            <div className="space-y-2">
              {outreachStats.map((s) => {
                const maxCount = Math.max(...outreachStats.map((x) => x.count), 1);
                const pct = (s.count / maxCount) * 100;
                return (
                  <div key={s.status} className="flex items-center gap-3">
                    <span className="w-32 text-xs truncate" style={{ color: "var(--db-text-muted)" }}>
                      {s.status.replace(/_/g, " ")}
                    </span>
                    <div
                      className="flex-1 h-5 rounded-full overflow-hidden"
                      style={{ background: "var(--db-hover)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: "#C59A27" }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs" style={{ color: "var(--db-text-secondary)" }}>
                      {s.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "client" && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
          }}
        >
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--db-border)" }}>
                {["Campaign", "Type", "Status", "Contacts", "Reached"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-medium uppercase"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center"
                    style={{ color: "var(--db-text-muted)" }}
                  >
                    No client campaigns yet
                  </td>
                </tr>
              )}
              {campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid var(--db-border-light)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--db-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <td className="px-4 py-3" style={{ color: "var(--db-text)" }}>{c.name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--db-text-muted)" }}>{c.type}</td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{ background: "var(--db-hover)", color: "var(--db-text-secondary)" }}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--db-text)" }}>{c.totalContacts}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--db-text)" }}>{c.contactsReached}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
