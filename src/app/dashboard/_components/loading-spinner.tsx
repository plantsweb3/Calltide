"use client";

import CaptaSpinner from "@/components/capta-spinner";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

export default function LoadingSpinner({ message }: { message?: string }) {
  const [lang] = useLang();
  const displayMessage = message ?? t("misc.loading", lang);
  return (
    <div role="status" aria-label={t("misc.loading", lang)} className="flex flex-col items-center justify-center py-20 gap-3">
      <CaptaSpinner size={32} />
      <span className="text-sm" style={{ color: "var(--db-text-muted)" }}>
        {displayMessage}
      </span>
    </div>
  );
}
