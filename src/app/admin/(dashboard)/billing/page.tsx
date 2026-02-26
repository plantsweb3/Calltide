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

  useEffect(() => {
    fetch("/api/admin/billing")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-500">Loading billing data...</p>
      </div>
    );
  }

  const churnColumns: Column<BillingData["churnRisks"][0]>[] = [
    {
      key: "businessName",
      label: "Business",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-slate-200">{row.businessName || "—"}</span>
      ),
    },
    {
      key: "businessType",
      label: "Type",
      render: (row) => (
        <span className="capitalize text-slate-400">{row.businessType || "—"}</span>
      ),
    },
    {
      key: "score",
      label: "Risk Score",
      sortable: true,
      render: (row) => {
        const color =
          row.score > 7 ? "text-red-400" : row.score > 4 ? "text-amber-400" : "text-green-400";
        return <span className={`font-semibold ${color}`}>{row.score}/10</span>;
      },
    },
    {
      key: "factors",
      label: "Factors",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.factors || []).slice(0, 2).map((f, i) => (
            <span key={i} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
              {f}
            </span>
          ))}
          {(row.factors || []).length > 2 && (
            <span className="text-[10px] text-slate-500">+{(row.factors || []).length - 2}</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-slate-400">Revenue metrics and churn analysis</p>
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
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="mb-4 text-sm font-medium text-slate-300">MRR Trend (30 days)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={(d: string) => d.slice(5)}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 8,
                color: "#e2e8f0",
                fontSize: 12,
              }}
              formatter={(value?: number) => [`$${(value ?? 0).toLocaleString()}`, "MRR"]}
            />
            <Area type="monotone" dataKey="mrr" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast + Failed Payments */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 text-sm font-medium text-slate-300">Revenue Forecast</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Next Month</span>
              <span className="font-semibold text-slate-200">${data.forecast.nextMonth.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">3 Months</span>
              <span className="font-semibold text-slate-200">${data.forecast.threeMonth.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">6 Months</span>
              <span className="font-semibold text-slate-200">${data.forecast.sixMonth.toLocaleString()}</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Based on current growth rate extrapolation
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 text-sm font-medium text-slate-300">Payment Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Failed Payments (30d)</span>
              <span className={`font-semibold ${data.aggregates.failedPayments30d > 0 ? "text-red-400" : "text-green-400"}`}>
                {data.aggregates.failedPayments30d}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Churned (30d)</span>
              <span className={`font-semibold ${data.aggregates.churned30d > 0 ? "text-amber-400" : "text-green-400"}`}>
                {data.aggregates.churned30d}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Net New (30d)</span>
              <span className="font-semibold text-green-400">
                {data.aggregates.newCustomers30d - data.aggregates.churned30d}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Churn risk table */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-300">Churn Risk Analysis</h3>
        <DataTable columns={churnColumns} data={data.churnRisks} />
      </div>
    </div>
  );
}
