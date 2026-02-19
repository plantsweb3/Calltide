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
}

export default function CampaignsPage() {
  const [tab, setTab] = useState<"sales" | "client">("sales");
  const [outreachStats, setOutreachStats] = useState<OutreachStats[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    // Fetch outreach stats from dashboard
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((data) => {
        const statuses = data.prospects?.byStatus ?? {};
        setOutreachStats(
          Object.entries(statuses).map(([status, count]) => ({
            status,
            count: count as number,
          })),
        );
      });
  }, []);

  const tabClass = (t: string) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t
        ? "bg-slate-800 text-slate-100"
        : "text-slate-400 hover:text-slate-200"
    }`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <p className="text-sm text-slate-400">Sales and client outreach</p>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-900 p-1 w-fit border border-slate-800">
        <button onClick={() => setTab("sales")} className={tabClass("sales")}>
          Sales Campaigns
        </button>
        <button onClick={() => setTab("client")} className={tabClass("client")}>
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
                  className="rounded-xl border border-slate-800 bg-slate-900 p-4"
                >
                  <p className="text-xs text-slate-400">
                    {s.status.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">{s.count}</p>
                </div>
              ))}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="mb-3 text-sm font-medium text-slate-300">
              Outreach Funnel
            </h3>
            <div className="space-y-2">
              {outreachStats.map((s) => {
                const maxCount = Math.max(...outreachStats.map((x) => x.count), 1);
                const pct = (s.count / maxCount) * 100;
                return (
                  <div key={s.status} className="flex items-center gap-3">
                    <span className="w-32 text-xs text-slate-400 truncate">
                      {s.status.replace(/_/g, " ")}
                    </span>
                    <div className="flex-1 h-5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs text-slate-300">
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
        <div className="rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-xs font-medium uppercase text-slate-400">
                  Campaign
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-slate-400">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-slate-400">
                  Contacts
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-slate-400">
                  Reached
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    No client campaigns yet
                  </td>
                </tr>
              )}
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-200">{c.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{c.type}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{c.totalContacts}</td>
                  <td className="px-4 py-3 text-xs">{c.contactsReached}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
