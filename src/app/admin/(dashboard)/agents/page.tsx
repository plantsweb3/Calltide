"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import StatusBadge from "../../_components/status-badge";
import DataTable, { type Column } from "../../_components/data-table";
import { TableSkeleton } from "@/components/skeleton";

// ── Types ──

interface AgentConfig {
  id: string;
  agentName: string;
  enabled: boolean;
  cronExpression: string | null;
  escalationThreshold: number | null;
  lastRunAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  updatedAt: string;
}

interface AgentActivity {
  id: string;
  agentName: string;
  actionType: string;
  targetId: string | null;
  targetType: string | null;
  inputSummary: string | null;
  outputSummary: string | null;
  toolsCalled: string[] | null;
  escalated: boolean;
  resolvedWithoutEscalation: boolean;
  category: string | null;
  createdAt: string;
}

interface ActivityStats {
  total: number;
  escalated: number;
  resolved: number;
}

type TabKey = "overview" | "activity" | "config" | "triggers";

const AGENT_DESCRIPTIONS: Record<string, { description: string; schedule: string }> = {
  support: { description: "Handles inbound client issues — billing, technical, how-to", schedule: "Event-driven (SMS/webhook)" },
  qualify: { description: "Evaluates prospects and moves them toward conversion", schedule: "Event-driven + manual batch" },
  churn: { description: "Identifies at-risk clients and takes proactive retention actions", schedule: "Daily at 2:00 PM" },
  onboard: { description: "Nudges new clients to complete onboarding milestones", schedule: "Hourly" },
  health: { description: "Monitors external service health and alerts on issues", schedule: "Every 5 minutes" },
};

// ── Main Page ──

export default function AgentsPage() {
  const [tab, setTab] = useState<TabKey>("overview");
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [stats, setStats] = useState<ActivityStats>({ total: 0, escalated: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState<string>("all");

  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [configRes, activityRes] = await Promise.all([
        fetch("/api/admin/agents/config"),
        fetch(`/api/admin/agents/activity${activityFilter !== "all" ? `?agent=${activityFilter}` : ""}`),
      ]);
      if (!configRes.ok || !activityRes.ok) throw new Error("Failed to load agent data");
      const configData = await configRes.json();
      const activityData = await activityRes.json();
      setConfigs(Array.isArray(configData) ? configData : []);
      setActivities(activityData.activities ?? []);
      setStats(activityData.stats ?? { total: 0, escalated: 0, resolved: 0 });
    } catch {
      setError("Failed to load agent data. Please try again.");
    }
    setLoading(false);
  }, [activityFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleAgent = async (agentName: string, enabled: boolean) => {
    try {
      const res = await fetch("/api/admin/agents/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentName, enabled }),
      });
      if (!res.ok) throw new Error("Failed to update agent");
      toast.success(`${agentName} agent ${enabled ? "enabled" : "disabled"}`);
      fetchData();
    } catch {
      toast.error("Failed to update agent configuration");
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "activity", label: "Activity Log" },
    { key: "config", label: "Configuration" },
    { key: "triggers", label: "Manual Triggers" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Agent System</h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          5 autonomous AI agents managing support, sales, retention, onboarding, and monitoring
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--db-surface)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: tab === t.key ? "var(--db-card)" : "transparent",
              color: tab === t.key ? "var(--db-text)" : "var(--db-text-muted)",
              border: tab === t.key ? "1px solid var(--db-border)" : "1px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          <button
            onClick={fetchData}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={5} />
      ) : (
        <>
          {tab === "overview" && <OverviewTab configs={configs} stats={stats} />}
          {tab === "activity" && (
            <ActivityTab
              activities={activities}
              filter={activityFilter}
              onFilterChange={(f) => setActivityFilter(f)}
            />
          )}
          {tab === "config" && <ConfigTab configs={configs} onToggle={toggleAgent} onRefresh={fetchData} />}
          {tab === "triggers" && <TriggersTab configs={configs} onRefresh={fetchData} />}
        </>
      )}
    </div>
  );
}

// ── Overview Tab ──

function OverviewTab({ configs, stats }: { configs: AgentConfig[]; stats: ActivityStats }) {
  const enabledCount = configs.filter((c) => c.enabled).length;
  const errored = configs.filter((c) => c.lastErrorAt && (!c.lastRunAt || c.lastErrorAt > c.lastRunAt));
  const resolveRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard label="Active Agents" value={`${enabledCount}/${configs.length}`} accent="#4ade80" />
        <SummaryCard label="Total Actions" value={stats.total} />
        <SummaryCard label="Escalations" value={stats.escalated} accent="#fbbf24" />
        <SummaryCard label="Auto-Resolve Rate" value={`${resolveRate}%`} accent="#60a5fa" />
      </div>

      {/* Agent cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {configs.map((config) => {
          const desc = AGENT_DESCRIPTIONS[config.agentName];
          const hasError = config.lastErrorAt && (!config.lastRunAt || config.lastErrorAt > config.lastRunAt);

          return (
            <div
              key={config.id}
              className="rounded-xl p-5"
              style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold capitalize" style={{ color: "var(--db-text)" }}>
                  {config.agentName}
                </h3>
                <StatusBadge status={config.enabled ? (hasError ? "degraded" : "operational") : "down"} />
              </div>
              <p className="mb-3 text-xs" style={{ color: "var(--db-text-muted)" }}>
                {desc?.description ?? "Autonomous agent"}
              </p>
              <div className="space-y-1 text-xs" style={{ color: "var(--db-text-secondary)" }}>
                <div className="flex justify-between">
                  <span>Schedule</span>
                  <span className="font-mono">{config.cronExpression ?? "Event-driven"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Run</span>
                  <span>{config.lastRunAt ? timeAgo(config.lastRunAt) : "Never"}</span>
                </div>
                {hasError && (
                  <div className="mt-2 rounded-md p-2" style={{ background: "rgba(248,113,113,0.1)" }}>
                    <p className="text-xs" style={{ color: "#f87171" }}>
                      {config.lastErrorMessage?.slice(0, 80) ?? "Unknown error"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error banner */}
      {errored.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}
        >
          <h4 className="text-sm font-medium" style={{ color: "#f87171" }}>
            {errored.length} agent{errored.length > 1 ? "s" : ""} with recent errors
          </h4>
          <ul className="mt-2 space-y-1">
            {errored.map((e) => (
              <li key={e.id} className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                <span className="font-medium capitalize">{e.agentName}</span>: {e.lastErrorMessage?.slice(0, 100)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Activity Tab ──

function ActivityTab({
  activities,
  filter,
  onFilterChange,
}: {
  activities: AgentActivity[];
  filter: string;
  onFilterChange: (f: string) => void;
}) {
  const activityColumns: Column<AgentActivity>[] = [
    {
      key: "agentName",
      label: "Agent",
      render: (row) => (
        <span className="text-xs font-semibold capitalize" style={{ color: "var(--db-accent)" }}>
          {row.agentName}
        </span>
      ),
    },
    {
      key: "actionType",
      label: "Action",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text)" }}>
          {row.actionType.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "escalated",
      label: "Status",
      render: (row) => (
        <StatusBadge
          status={row.escalated ? "at-risk" : row.resolvedWithoutEscalation ? "resolved" : "operational"}
        />
      ),
    },
    {
      key: "toolsCalled",
      label: "Tools",
      render: (row) => (
        <span className="text-xs font-mono" style={{ color: "var(--db-text-muted)" }}>
          {row.toolsCalled?.join(", ") ?? "—"}
        </span>
      ),
    },
    {
      key: "outputSummary",
      label: "Summary",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-secondary)" }}>
          {row.outputSummary?.slice(0, 80) ?? "—"}
          {(row.outputSummary?.length ?? 0) > 80 ? "..." : ""}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Time",
      render: (row) => (
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>
          {timeAgo(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>Filter:</span>
        {["all", "support", "qualify", "churn", "onboard", "health"].map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className="rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors"
            style={{
              background: filter === f ? "var(--db-accent)" : "var(--db-surface)",
              color: filter === f ? "#fff" : "var(--db-text-muted)",
              border: "1px solid var(--db-border)",
            }}
          >
            {f}
          </button>
        ))}
      </div>
      <DataTable columns={activityColumns} data={activities} />
    </div>
  );
}

// ── Config Tab ──

function ConfigTab({
  configs,
  onToggle,
  onRefresh,
}: {
  configs: AgentConfig[];
  onToggle: (name: string, enabled: boolean) => void;
  onRefresh: () => void;
}) {
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [thresholdValue, setThresholdValue] = useState<number>(3);

  const saveThreshold = async (agentName: string) => {
    try {
      const res = await fetch("/api/admin/agents/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentName, escalationThreshold: thresholdValue }),
      });
      if (!res.ok) throw new Error("Failed to save threshold");
      toast.success("Escalation threshold updated");
      setEditingThreshold(null);
      onRefresh();
    } catch {
      toast.error("Failed to save threshold");
    }
  };

  return (
    <div className="space-y-4">
      {configs.map((config) => {
        const desc = AGENT_DESCRIPTIONS[config.agentName];
        return (
          <div
            key={config.id}
            className="rounded-xl p-5"
            style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold capitalize" style={{ color: "var(--db-text)" }}>
                  {config.agentName} Agent
                </h3>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>
                  {desc?.description}
                </p>
              </div>
              <button
                onClick={() => onToggle(config.agentName, !config.enabled)}
                className="rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: config.enabled ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
                  color: config.enabled ? "#4ade80" : "#f87171",
                  border: `1px solid ${config.enabled ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                }}
              >
                {config.enabled ? "Enabled" : "Disabled"}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Schedule</p>
                <p className="mt-0.5 text-sm font-mono" style={{ color: "var(--db-text)" }}>
                  {config.cronExpression ?? "Event-driven"}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Escalation Threshold</p>
                {editingThreshold === config.agentName ? (
                  <div className="mt-0.5 flex gap-1">
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={thresholdValue}
                      onChange={(e) => setThresholdValue(parseInt(e.target.value, 10))}
                      className="w-16 rounded px-2 py-1 text-sm"
                      style={{
                        background: "var(--db-surface)",
                        border: "1px solid var(--db-border)",
                        color: "var(--db-text)",
                      }}
                    />
                    <button
                      onClick={() => saveThreshold(config.agentName)}
                      className="rounded px-2 py-1 text-xs"
                      style={{ background: "var(--db-accent)", color: "#fff" }}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <p
                    className="mt-0.5 cursor-pointer text-sm"
                    style={{ color: "var(--db-text)" }}
                    onClick={() => {
                      setEditingThreshold(config.agentName);
                      setThresholdValue(config.escalationThreshold ?? 3);
                    }}
                  >
                    {config.escalationThreshold ?? "—"}{" "}
                    <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>(click to edit)</span>
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Last Run</p>
                <p className="mt-0.5 text-sm" style={{ color: "var(--db-text)" }}>
                  {config.lastRunAt ? timeAgo(config.lastRunAt) : "Never"}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>Last Error</p>
                <p className="mt-0.5 text-sm" style={{ color: config.lastErrorAt ? "#f87171" : "var(--db-text)" }}>
                  {config.lastErrorAt ? timeAgo(config.lastErrorAt) : "None"}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Triggers Tab ──

function TriggersTab({ configs, onRefresh }: { configs: AgentConfig[]; onRefresh: () => void }) {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const triggerAgent = async (agentName: string) => {
    setRunning(agentName);
    setResults((prev) => ({ ...prev, [agentName]: "" }));

    try {
      const isGetAgent = ["churn", "onboard", "health"].includes(agentName);

      const res = await fetch("/api/admin/agents/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName,
          method: isGetAgent ? "GET" : "POST",
          ...(!isGetAgent
            ? {
                body:
                  agentName === "support"
                    ? { message: "Manual test run from admin panel" }
                    : { prospectId: "test" },
              }
            : {}),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const msg = `Success: ${data.summary ?? JSON.stringify(data).slice(0, 200)}`;
        setResults((prev) => ({ ...prev, [agentName]: msg }));
        toast.success(`${agentName} agent triggered successfully`);
      } else {
        const msg = `Error ${res.status}: ${data.error ?? "Unknown"}`;
        setResults((prev) => ({ ...prev, [agentName]: msg }));
        toast.error(`${agentName} agent failed`);
      }
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [agentName]: `Failed: ${err instanceof Error ? err.message : String(err)}`,
      }));
      toast.error(`Failed to trigger ${agentName} agent`);
    }

    setRunning(null);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
        Manually trigger agent runs for testing. Cron-based agents (churn, onboard, health) run their full scan.
        Event-driven agents (support, qualify) run with test data.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {configs.map((config) => {
          const desc = AGENT_DESCRIPTIONS[config.agentName];
          return (
            <div
              key={config.id}
              className="rounded-xl p-5"
              style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
            >
              <h3 className="text-sm font-semibold capitalize" style={{ color: "var(--db-text)" }}>
                {config.agentName}
              </h3>
              <p className="mb-3 text-xs" style={{ color: "var(--db-text-muted)" }}>
                {desc?.schedule}
              </p>

              <button
                onClick={() => triggerAgent(config.agentName)}
                disabled={running !== null || !config.enabled}
                className="w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  background: config.enabled ? "var(--db-accent)" : "var(--db-hover)",
                  color: config.enabled ? "#fff" : "var(--db-text-muted)",
                }}
              >
                {running === config.agentName ? "Running..." : config.enabled ? "Trigger Run" : "Disabled"}
              </button>

              {results[config.agentName] && (
                <div
                  className="mt-3 rounded-md p-2 text-xs"
                  style={{
                    background: results[config.agentName].startsWith("Success")
                      ? "rgba(74,222,128,0.1)"
                      : "rgba(248,113,113,0.1)",
                    color: results[config.agentName].startsWith("Success") ? "#4ade80" : "#f87171",
                  }}
                >
                  {results[config.agentName]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Helpers ──

function SummaryCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
      <p className="text-xs" style={{ color: "var(--db-text-muted)" }}>{label}</p>
      <p className="mt-1 text-2xl font-semibold" style={{ color: accent ?? "var(--db-text)" }}>{value}</p>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
