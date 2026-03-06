"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ImportWizard from "@/app/dashboard/_components/import-wizard";

function ImportContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") as "customers" | "appointments" | "estimates" | null;
  const validTypes = ["customers", "appointments", "estimates"];
  const initialType = type && validTypes.includes(type) ? type : undefined;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-body), system-ui, sans-serif", color: "var(--db-text)" }}>
          Import Data
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--db-text-muted)" }}>
          Bring your data from Jobber, ServiceTitan, Housecall Pro, or any other system.
        </p>
      </div>
      <ImportWizard initialType={initialType} />
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--db-border)", borderTopColor: "var(--db-accent)" }} />
      </div>
    }>
      <ImportContent />
    </Suspense>
  );
}
