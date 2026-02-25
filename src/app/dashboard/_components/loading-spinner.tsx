"use client";

export default function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div
        className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--db-border)", borderTopColor: "var(--db-accent)" }}
      />
      <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>
        {message}
      </span>
    </div>
  );
}
