"use client";

import CaptaSpinner from "@/components/capta-spinner";

export default function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <CaptaSpinner size={32} />
      <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>
        {message}
      </span>
    </div>
  );
}
