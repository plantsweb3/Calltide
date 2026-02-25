"use client";

import { useEffect, useState } from "react";
import MetricCard from "@/components/metric-card";

interface Overview {
  callsToday: number;
  appointmentsThisWeek: number;
  missedCallsSaved: number;
  totalCalls: number;
}

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/overview")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div
        className="flex items-center justify-center py-20"
        style={{ color: "var(--db-text-muted)" }}
      >
        Loading...
      </div>
    );
  }

  if (
    data.totalCalls === 0 &&
    data.callsToday === 0 &&
    data.appointmentsThisWeek === 0
  ) {
    return (
      <div>
        <h1
          className="mb-6 text-2xl font-semibold"
          style={{ fontFamily: "var(--font-serif), serif", color: "var(--db-text)" }}
        >
          Overview
        </h1>
        <div
          className="rounded-xl p-12 text-center"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
            boxShadow: "var(--db-card-shadow)",
          }}
        >
          <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>
            Welcome to Calltide
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--db-text-muted)" }}>
            Your AI receptionist is ready. Once calls start coming in,
            you&apos;ll see your metrics here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1
        className="mb-6 text-2xl font-semibold"
        style={{ fontFamily: "var(--font-serif), serif", color: "var(--db-text)" }}
      >
        Overview
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Calls Today" value={data.callsToday} />
        <MetricCard label="Appointments This Week" value={data.appointmentsThisWeek} />
        <MetricCard label="Missed Calls Saved" value={data.missedCallsSaved} />
        <MetricCard label="Total Calls" value={data.totalCalls} />
      </div>
    </div>
  );
}
