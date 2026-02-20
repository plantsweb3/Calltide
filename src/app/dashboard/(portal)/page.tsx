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
      <div className="flex items-center justify-center py-20 text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Overview</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Calls Today" value={data.callsToday} />
        <MetricCard label="Appointments This Week" value={data.appointmentsThisWeek} />
        <MetricCard label="Missed Calls Saved" value={data.missedCallsSaved} />
        <MetricCard label="Total Calls" value={data.totalCalls} />
      </div>
    </div>
  );
}
