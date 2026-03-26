"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ImportWizard from "@/app/dashboard/_components/import-wizard";
import CaptaSpinner from "@/components/capta-spinner";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

function ImportContent() {
  const [lang] = useLang();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") as "customers" | "appointments" | "estimates" | null;
  const validTypes = ["customers", "appointments", "estimates"];
  const initialType = type && validTypes.includes(type) ? type : undefined;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--db-text)" }}>
          {t("import.title", lang)}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--db-text-muted)" }}>
          {t("import.subtitle", lang)}
        </p>
      </div>
      <ImportWizard initialType={initialType} lang={lang} />
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <CaptaSpinner size={32} />
      </div>
    }>
      <ImportContent />
    </Suspense>
  );
}
