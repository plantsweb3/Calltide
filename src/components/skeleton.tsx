"use client";

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "h-4 w-32" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ background: "var(--db-border)" }}
    />
  );
}

/** Pre-built skeleton layouts for common page patterns */

export function MetricCardSkeleton() {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
    >
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
    >
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}
