"use client";

import { useEffect, useState, useCallback } from "react";
import MetricCard from "../../_components/metric-card";
import DataTable, { type Column } from "../../_components/data-table";
import StatusBadge from "../../_components/status-badge";

type Tab = "consent" | "sms" | "documents" | "retention" | "subprocessors";

export default function CompliancePage() {
  const [tab, setTab] = useState<Tab>("consent");

  const tabs: { key: Tab; label: string }[] = [
    { key: "consent", label: "Consent Audit" },
    { key: "sms", label: "SMS Compliance" },
    { key: "documents", label: "Legal Documents" },
    { key: "retention", label: "Data Retention" },
    { key: "subprocessors", label: "Sub-Processors" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Compliance</h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>
          Legal compliance, consent tracking, and data governance
        </p>
      </div>

      <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--db-hover)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              background: tab === t.key ? "var(--db-card)" : "transparent",
              color: tab === t.key ? "var(--db-text)" : "var(--db-text-muted)",
              boxShadow: tab === t.key ? "0 1px 2px rgba(0,0,0,0.05)" : undefined,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "consent" && <ConsentTab />}
      {tab === "sms" && <SmsTab />}
      {tab === "documents" && <DocumentsTab />}
      {tab === "retention" && <RetentionTab />}
      {tab === "subprocessors" && <SubProcessorsTab />}
    </div>
  );
}

function ConsentTab() {
  const [data, setData] = useState<{ records: any[]; outdatedTosCount: number } | null>(null);
  useEffect(() => {
    fetch("/api/admin/compliance?tab=consent").then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data) return <Loading />;

  const columns: Column<any>[] = [
    { key: "businessId", label: "Business", render: (r) => <span className="text-sm font-medium" style={{ color: "var(--db-text)" }}>{r.businessId ?? r.phoneNumber ?? "—"}</span> },
    { key: "consentType", label: "Type", render: (r) => <StatusBadge status={r.consentType} /> },
    { key: "documentVersion", label: "Version", render: (r) => <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{r.documentVersion ?? "—"}</span> },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "consentedAt", label: "Date", render: (r) => <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{new Date(r.consentedAt).toLocaleDateString()}</span> },
    { key: "ipAddress", label: "IP", render: (r) => <span className="text-xs font-mono" style={{ color: "var(--db-text-muted)" }}>{r.ipAddress ?? "—"}</span> },
  ];

  return (
    <div className="space-y-4">
      {data.outdatedTosCount > 0 && (
        <div className="rounded-lg p-3" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
          <span className="text-sm font-medium" style={{ color: "#f59e0b" }}>
            {data.outdatedTosCount} businesses not on current TOS version
          </span>
        </div>
      )}
      <DataTable columns={columns} data={data.records} />
    </div>
  );
}

function SmsTab() {
  const [data, setData] = useState<{ optOuts: any[]; activeConsentCount: number; optOutCount: number } | null>(null);
  useEffect(() => {
    fetch("/api/admin/compliance?tab=sms").then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data) return <Loading />;

  const columns: Column<any>[] = [
    { key: "phoneNumber", label: "Phone", render: (r) => <span className="font-mono text-sm" style={{ color: "var(--db-text)" }}>{r.phoneNumber}</span> },
    { key: "optedOutMethod", label: "Method", render: (r) => <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{r.optedOutMethod}</span> },
    { key: "optedOutAt", label: "Opted Out", render: (r) => <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{new Date(r.optedOutAt).toLocaleDateString()}</span> },
    { key: "reoptedInAt", label: "Re-opted In", render: (r) => <span className="text-xs" style={{ color: r.reoptedInAt ? "#4ade80" : "var(--db-text-muted)" }}>{r.reoptedInAt ? new Date(r.reoptedInAt).toLocaleDateString() : "—"}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <MetricCard label="Active SMS Consent" value={data.activeConsentCount} />
        <MetricCard label="Total Opt-Outs" value={data.optOutCount} />
      </div>
      <DataTable columns={columns} data={data.optOuts} />
    </div>
  );
}

function DocumentsTab() {
  const [data, setData] = useState<{ documents: any[]; totalActiveClients: number } | null>(null);
  useEffect(() => {
    fetch("/api/admin/compliance?tab=documents").then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data) return <Loading />;

  const currentDocs = data.documents.filter((d: any) => d.isCurrentVersion);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {currentDocs.map((doc: any) => (
          <div key={doc.id} className="rounded-lg p-4" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
            <p className="font-medium" style={{ color: "var(--db-text)" }}>{doc.title}</p>
            <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
              Version {doc.version} &middot; Effective {new Date(doc.effectiveDate).toLocaleDateString()}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--db-accent)" }}>{doc.documentType}</p>
          </div>
        ))}
      </div>
      <MetricCard label="Total Active Clients" value={data.totalActiveClients} />
    </div>
  );
}

function RetentionTab() {
  const [data, setData] = useState<{ logs: any[]; deletionRequests: any[] } | null>(null);
  useEffect(() => {
    fetch("/api/admin/compliance?tab=retention").then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data) return <Loading />;

  const retentionSchedule = [
    { type: "Call Transcripts", period: "12 months" },
    { type: "Call Metadata", period: "24 months" },
    { type: "SMS Content", period: "6 months" },
    { type: "Consent Records", period: "7 years (never auto-deleted)" },
    { type: "Offboarded Business Data", period: "30-day hold" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2" style={{ color: "var(--db-text)" }}>Retention Schedule</h3>
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--db-border)" }}>
          {retentionSchedule.map((item) => (
            <div key={item.type} className="flex justify-between px-4 py-2 border-b last:border-b-0" style={{ borderColor: "var(--db-border)", background: "var(--db-card)" }}>
              <span className="text-sm" style={{ color: "var(--db-text)" }}>{item.type}</span>
              <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>{item.period}</span>
            </div>
          ))}
        </div>
      </div>
      {data.logs.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2" style={{ color: "var(--db-text)" }}>Cleanup History</h3>
          <DataTable
            columns={[
              { key: "dataType", label: "Type", render: (r) => <span className="text-sm" style={{ color: "var(--db-text)" }}>{r.dataType}</span> },
              { key: "recordsDeleted", label: "Records", render: (r) => <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{r.recordsDeleted}</span> },
              { key: "deletedAt", label: "Date", render: (r) => <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{new Date(r.deletedAt).toLocaleDateString()}</span> },
            ]}
            data={data.logs}
          />
        </div>
      )}
      {data.deletionRequests.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2" style={{ color: "var(--db-text)" }}>Deletion Requests</h3>
          <DataTable
            columns={[
              { key: "requestedBy", label: "Requested By", render: (r) => <span className="text-sm" style={{ color: "var(--db-text)" }}>{r.requestedBy}</span> },
              { key: "requestType", label: "Type", render: (r) => <StatusBadge status={r.requestType} /> },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
              { key: "createdAt", label: "Date", render: (r) => <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{new Date(r.createdAt).toLocaleDateString()}</span> },
            ]}
            data={data.deletionRequests}
          />
        </div>
      )}
    </div>
  );
}

function SubProcessorsTab() {
  const [data, setData] = useState<{ processors: any[] } | null>(null);
  useEffect(() => {
    fetch("/api/admin/compliance?tab=subprocessors").then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  if (!data) return <Loading />;

  const columns: Column<any>[] = [
    { key: "name", label: "Name", render: (r) => <span className="font-medium" style={{ color: "var(--db-text)" }}>{r.name}</span> },
    { key: "purpose", label: "Purpose", render: (r) => <span className="text-sm" style={{ color: "var(--db-text-secondary)" }}>{r.purpose}</span> },
    { key: "location", label: "Location", render: (r) => <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{r.location}</span> },
    { key: "dpaStatus", label: "DPA", render: (r) => <StatusBadge status={r.dpaStatus} /> },
    { key: "lastReviewedAt", label: "Last Reviewed", render: (r) => <span className="text-xs" style={{ color: "var(--db-text-muted)" }}>{r.lastReviewedAt ? new Date(r.lastReviewedAt).toLocaleDateString() : "—"}</span> },
  ];

  return <DataTable columns={columns} data={data.processors} />;
}

function Loading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <p style={{ color: "var(--db-text-muted)" }}>Loading...</p>
    </div>
  );
}
