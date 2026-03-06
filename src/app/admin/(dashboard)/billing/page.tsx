"use client";

import { useEffect, useState } from "react";
import MetricCard from "../../_components/metric-card";
import DataTable, { type Column } from "../../_components/data-table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BillingData {
  current: { mrr: number; arr: number; customerCount: number };
  trend: Array<{
    id: string;
    date: string;
    mrr: number;
    arr: number;
    customerCount: number;
    newCustomers: number | null;
    churnedCustomers: number | null;
    failedPayments: number | null;
  }>;
  aggregates: {
    newCustomers30d: number;
    churned30d: number;
    failedPayments30d: number;
  };
  churnRisks: Array<{
    id: string;
    customerId: string;
    businessName: string | null;
    businessType: string | null;
    score: number;
    factors: string[] | null;
    calculatedAt: string;
  }>;
  forecast: { nextMonth: number; threeMonth: number; sixMonth: number };
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/billing")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError("Failed to load billing data"));
  }, []);

  if (!data) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          </div>
        )}
        {!error && (
          <div className="flex h-64 items-center justify-center">
            <p style={{ color: "var(--db-text-muted)" }}>Loading billing data...</p>
          </div>
        )}
      </div>
    );
  }

  const churnColumns: Column<BillingData["churnRisks"][0]>[] = [
    {
      key: "businessName",
      label: "Business",
      sortable: true,
      render: (row) => (
        <span className="font-medium" style={{ color: "var(--db-text)" }}>{row.businessName || "—"}</span>
      ),
    },
    {
      key: "businessType",
      label: "Type",
      render: (row) => (
        <span className="capitalize" style={{ color: "var(--db-text-muted)" }}>{row.businessType || "—"}</span>
      ),
    },
    {
      key: "score",
      label: "Risk Score",
      sortable: true,
      render: (row) => {
        const color =
          row.score > 7 ? "#f87171" : row.score > 4 ? "#fbbf24" : "#4ade80";
        return <span className="font-semibold" style={{ color }}>{row.score}/10</span>;
      },
    },
    {
      key: "factors",
      label: "Factors",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.factors || []).slice(0, 2).map((f, i) => (
            <span key={i} className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: "var(--db-hover)", color: "var(--db-text-muted)" }}>
              {f}
            </span>
          ))}
          {(row.factors || []).length > 2 && (
            <span className="text-[10px]" style={{ color: "var(--db-text-muted)" }}>+{(row.factors || []).length - 2}</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm" style={{ color: "var(--db-text-muted)" }}>Revenue metrics and churn analysis</p>
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="MRR"
          value={data.current.mrr}
          prefix="$"
        />
        <MetricCard
          label="ARR"
          value={data.current.arr}
          prefix="$"
        />
        <MetricCard label="Active Customers" value={data.current.customerCount} />
        <MetricCard
          label="New (30d)"
          value={data.aggregates.newCustomers30d}
          change={data.aggregates.churned30d > 0 ? `${data.aggregates.churned30d} churned` : undefined}
          changeType={data.aggregates.churned30d > 0 ? "negative" : "neutral"}
        />
      </div>

      {/* MRR Trend chart */}
      <div className="rounded-xl p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
        <h3 className="mb-4 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>MRR Trend (30 days)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--db-border)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--db-text-muted)", fontSize: 11 }}
              tickFormatter={(d: string) => d.slice(5)}
            />
            <YAxis
              tick={{ fill: "var(--db-text-muted)", fontSize: 11 }}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--db-surface)",
                border: "1px solid var(--db-border)",
                borderRadius: 8,
                color: "var(--db-text)",
                fontSize: 12,
              }}
              formatter={(value?: number) => [`$${(value ?? 0).toLocaleString()}`, "MRR"]}
            />
            <Area type="monotone" dataKey="mrr" stroke="#C59A27" fill="#C59A27" fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast + Failed Payments */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <h3 className="mb-4 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>Revenue Forecast</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>Next Month</span>
              <span className="font-semibold" style={{ color: "var(--db-text)" }}>${data.forecast.nextMonth.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>3 Months</span>
              <span className="font-semibold" style={{ color: "var(--db-text)" }}>${data.forecast.threeMonth.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>6 Months</span>
              <span className="font-semibold" style={{ color: "var(--db-text)" }}>${data.forecast.sixMonth.toLocaleString()}</span>
            </div>
          </div>
          <p className="mt-4 text-xs" style={{ color: "var(--db-text-muted)" }}>
            Based on current growth rate extrapolation
          </p>
        </div>

        <div className="rounded-xl p-5" style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}>
          <h3 className="mb-4 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>Payment Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>Failed Payments (30d)</span>
              <span className="font-semibold" style={{ color: data.aggregates.failedPayments30d > 0 ? "#f87171" : "#4ade80" }}>
                {data.aggregates.failedPayments30d}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>Churned (30d)</span>
              <span className="font-semibold" style={{ color: data.aggregates.churned30d > 0 ? "#fbbf24" : "#4ade80" }}>
                {data.aggregates.churned30d}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>Net New (30d)</span>
              <span className="font-semibold" style={{ color: "#4ade80" }}>
                {data.aggregates.newCustomers30d - data.aggregates.churned30d}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Churn risk table */}
      <div>
        <h3 className="mb-3 text-sm font-medium" style={{ color: "var(--db-text-secondary)" }}>Churn Risk Analysis</h3>
        <DataTable columns={churnColumns} data={data.churnRisks} />
      </div>
    </div>
  );
}
