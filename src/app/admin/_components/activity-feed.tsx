"use client";

import { useEffect, useState } from "react";

interface Activity {
  id: string;
  type: string;
  title: string;
  detail?: string;
  createdAt: string;
}

const typeColors: Record<string, string> = {
  prospect_scraped: "bg-blue-500",
  audit_call: "bg-amber-500",
  audit_result: "bg-amber-500",
  email_sent: "bg-purple-500",
  email_opened: "bg-purple-400",
  email_clicked: "bg-green-500",
  sms_sent: "bg-blue-400",
  sms_opt_out: "bg-red-500",
  demo_booked: "bg-green-500",
  demo_updated: "bg-green-400",
  outreach_started: "bg-purple-500",
  outreach_paused: "bg-amber-500",
  status_change: "bg-slate-500",
  csv_import: "bg-blue-500",
  bulk_status_change: "bg-slate-500",
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr + "Z");
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);

  const fetchActivities = async () => {
    const res = await fetch("/api/admin/activity-feed?limit=20");
    if (res.ok) {
      const data = await res.json();
      setActivities(data);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-5 py-3">
        <h3 className="text-sm font-medium text-slate-300">Activity Feed</h3>
      </div>
      <div className="divide-y divide-slate-800/50 max-h-[400px] overflow-y-auto">
        {activities.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            No activity yet
          </p>
        )}
        {activities.map((a) => (
          <div key={a.id} className="flex items-start gap-3 px-5 py-3">
            <div
              className={`mt-1 h-2 w-2 rounded-full ${typeColors[a.type] ?? "bg-slate-500"}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200 truncate">{a.title}</p>
              {a.detail && (
                <p className="text-xs text-slate-500 truncate">{a.detail}</p>
              )}
            </div>
            <span className="shrink-0 text-xs text-slate-500">
              {formatTime(a.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
