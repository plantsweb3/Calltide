"use client";

import { useState, useCallback } from "react";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

interface SetupChecklistProps {
  businessHours: Record<string, { open?: string; close?: string; closed?: boolean }> | null;
  greeting: string | null;
  hasPricing: boolean;
  totalCalls: number;
  setupChecklistDismissed: boolean;
  createdAt: string;
}

interface CheckItem {
  label: string;
  done: boolean;
  link?: string;
}

export default function SetupChecklist({
  businessHours,
  greeting,
  hasPricing,
  totalCalls,
  setupChecklistDismissed,
  createdAt,
}: SetupChecklistProps) {
  const [dismissed, setDismissed] = useState(setupChecklistDismissed);
  const [lang] = useLang();

  // Only show for businesses < 30 days old and not dismissed
  const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (dismissed || ageInDays > 30) return null;

  const hasBusinessHours = businessHours
    ? Object.values(businessHours).some((h) => h && !h.closed && h.open && h.open !== "00:00")
    : false;

  const items: CheckItem[] = [
    { label: t("checklist.accountCreated", lang), done: true },
    { label: t("checklist.setBusinessHours", lang), done: hasBusinessHours, link: "/dashboard/settings#general" },
    { label: t("checklist.customizeGreeting", lang), done: !!greeting, link: "/dashboard/settings#receptionist" },
    { label: t("checklist.addServicePricing", lang), done: hasPricing, link: "/dashboard/settings#pricing" },
    { label: t("checklist.makeFirstCall", lang), done: totalCalls > 0 },
    { label: t("checklist.setupCallForwarding", lang), done: false, link: "/dashboard/settings#general" },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const progress = Math.round((completedCount / items.length) * 100);

  const handleDismiss = useCallback(async () => {
    setDismissed(true);
    try {
      await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupChecklistDismissed: true }),
      });
    } catch {
      // Non-fatal — just hide locally
    }
  }, []);

  return (
    <div
      className="p-5"
      style={{ background: "var(--db-card)", borderRadius: 4, border: "1px solid var(--db-border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--db-text)" }}>
            {t("checklist.title", lang)}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
            {t("checklist.progress", lang, { completed: completedCount, total: items.length })}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{
            background: "var(--db-hover)",
            color: "var(--db-text-muted)",
            border: "none",
            cursor: "pointer",
          }}
        >
          {t("checklist.dismiss", lang)}
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 rounded-full mb-4"
        style={{ background: "var(--db-border)" }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("checklist.progress", lang, { completed: completedCount, total: items.length })}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: "var(--db-accent)" }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-2.5">
        {items.map((item, i) => {
          const content = (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
              style={{
                background: item.done ? "var(--db-success-bg)" : "transparent",
              }}
            >
              {/* Checkbox */}
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                style={{
                  background: item.done ? "var(--db-accent)" : "transparent",
                  border: item.done ? "none" : "2px solid var(--db-border)",
                }}
              >
                {item.done && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>

              <span
                className="text-sm"
                style={{
                  color: item.done ? "var(--db-text-muted)" : "var(--db-text)",
                  textDecoration: item.done ? "line-through" : "none",
                }}
              >
                {item.label}
              </span>

              {item.link && !item.done && (
                <svg
                  className="ml-auto shrink-0"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "var(--db-text-muted)" }}
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              )}
            </div>
          );

          if (item.link && !item.done) {
            return (
              <a
                key={i}
                href={item.link}
                className="block rounded-lg transition-colors"
                style={{ textDecoration: "none" }}
              >
                {content}
              </a>
            );
          }

          return <div key={i}>{content}</div>;
        })}
      </div>
    </div>
  );
}
