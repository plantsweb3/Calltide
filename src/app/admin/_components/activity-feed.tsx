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
  prospect_scraped: "#3b82f6",
  audit_call: "#fbbf24",
  audit_result: "#fbbf24",
  email_sent: "#a855f7",
  email_opened: "#c084fc",
  email_clicked: "#4ade80",
  sms_sent: "#60a5fa",
  sms_opt_out: "#f87171",
  demo_booked: "#4ade80",
  demo_updated: "#4ade80",
  outreach_started: "#a855f7",
  outreach_paused: "#fbbf24",
  status_change: "#94a3b8",
  csv_import: "#3b82f6",
  bulk_status_change: "#94a3b8",
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
    <div
      className="rounded-xl"
      style={{
        background: "var(--db-card)",
        border: "1px solid var(--db-border)",
      }}
    >
      <div
        className="px-5 py-3"
        style={{ borderBottom: "1px solid var(--db-border)" }}
      >
        <h3 className="text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>
          Activity Feed
        </h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {activities.length === 0 && (
          <p className="px-5 py-8 text-center text-sm" style={{ color: "var(--db-text-muted)" }}>
            No activity yet
          </p>
        )}
        {activities.map((a, i) => (
          <div
            key={a.id}
            className="flex items-start gap-3 px-5 py-3"
            style={{
              borderBottom: i < activities.length - 1 ? "1px solid var(--db-border-light)" : undefined,
            }}
          >
            <div
              className="mt-1 h-2 w-2 rounded-full shrink-0"
              style={{ background: typeColors[a.type] ?? "var(--db-text-muted)" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" style={{ color: "var(--db-text)" }}>
                {a.title}
              </p>
              {a.detail && (
                <p className="text-xs truncate" style={{ color: "var(--db-text-muted)" }}>
                  {a.detail}
                </p>
              )}
            </div>
            <span className="shrink-0 text-xs" style={{ color: "var(--db-text-muted)" }}>
              {formatTime(a.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
