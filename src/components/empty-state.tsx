"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="db-card rounded-xl p-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center" style={{ color: "var(--db-text-muted)" }}>
        {icon}
      </div>
      <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>
        {title}
      </p>
      <p className="mt-2 text-sm max-w-sm mx-auto" style={{ color: "var(--db-text-muted)" }}>
        {description}
      </p>
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: "var(--db-accent)", color: "#fff" }}
          >
            {action.label}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
        ) : (
          <div className="mt-4">
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          </div>
        )
      )}
    </div>
  );
}
