"use client";

import { useState, useRef, useEffect } from "react";
import Button from "@/components/ui/button";

export interface DateRange {
  from: string; // ISO date string YYYY-MM-DD
  to: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

type Preset = { label: string; key: string; getRange: () => DateRange };

function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getPresets(): Preset[] {
  const now = new Date();
  const today = toISO(now);

  return [
    {
      label: "Today",
      key: "today",
      getRange: () => ({ from: today, to: today }),
    },
    {
      label: "Last 7 days",
      key: "7d",
      getRange: () => {
        const d = new Date(now);
        d.setDate(d.getDate() - 6);
        return { from: toISO(d), to: today };
      },
    },
    {
      label: "Last 30 days",
      key: "30d",
      getRange: () => {
        const d = new Date(now);
        d.setDate(d.getDate() - 29);
        return { from: toISO(d), to: today };
      },
    },
    {
      label: "Last 90 days",
      key: "90d",
      getRange: () => {
        const d = new Date(now);
        d.setDate(d.getDate() - 89);
        return { from: toISO(d), to: today };
      },
    },
    {
      label: "This month",
      key: "month",
      getRange: () => {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: toISO(first), to: today };
      },
    },
  ];
}

function formatLabel(range: DateRange): string {
  const presets = getPresets();
  for (const p of presets) {
    const r = p.getRange();
    if (r.from === range.from && r.to === range.to) return p.label;
  }
  const fmtDate = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmtDate(range.from)} – ${fmtDate(range.to)}`;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);
  const ref = useRef<HTMLDivElement>(null);

  // Sync custom inputs when value changes externally (e.g., preset click)
  useEffect(() => {
    setCustomFrom(value.from);
    setCustomTo(value.to);
  }, [value.from, value.to]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const presets = getPresets();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        style={{
          background: "var(--db-card)",
          border: "1px solid var(--db-border)",
          color: "var(--db-text)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {formatLabel(value)}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="db-card absolute right-0 top-full z-30 mt-2 w-64 rounded-xl p-3 space-y-2 shadow-lg"
          style={{ border: "1px solid var(--db-border)" }}
        >
          {presets.map((p) => {
            const r = p.getRange();
            const active = r.from === value.from && r.to === value.to;
            return (
              <button
                key={p.key}
                onClick={() => {
                  onChange(r);
                  setOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors"
                style={{
                  background: active ? "var(--db-accent)" : "transparent",
                  color: active ? "#fff" : "var(--db-text)",
                }}
              >
                {p.label}
              </button>
            );
          })}

          <div
            className="border-t pt-2 mt-2 space-y-2"
            style={{ borderColor: "var(--db-border)" }}
          >
            <p className="text-xs font-medium" style={{ color: "var(--db-text-muted)" }}>
              Custom Range
            </p>
            <div className="flex gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                style={{
                  background: "var(--db-hover)",
                  border: "1px solid var(--db-border)",
                  color: "var(--db-text)",
                }}
              />
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                style={{
                  background: "var(--db-hover)",
                  border: "1px solid var(--db-border)",
                  color: "var(--db-text)",
                }}
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                if (customFrom && customTo) {
                  onChange({ from: customFrom, to: customTo });
                  setOpen(false);
                }
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
