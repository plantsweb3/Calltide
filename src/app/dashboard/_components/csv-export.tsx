"use client";

import { useCallback } from "react";
import { useLang } from "@/app/dashboard/_hooks/use-lang";
import { t } from "@/lib/i18n/strings";

interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

interface ExportCsvButtonProps<T> {
  data: T[];
  columns: CsvColumn<T>[];
  filename: string;
}

function escapeCsvField(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function ExportCsvButton<T>({
  data,
  columns,
  filename,
}: ExportCsvButtonProps<T>) {
  const [lang] = useLang();
  const handleExport = useCallback(() => {
    if (data.length === 0) return;

    const headerRow = columns.map((c) => escapeCsvField(c.header)).join(",");
    const dataRows = data.map((row) =>
      columns.map((c) => escapeCsvField(c.accessor(row))).join(",")
    );
    const csv = [headerRow, ...dataRows].join("\n");

    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, columns, filename]);

  const isEmpty = data.length === 0;

  return (
    <button
      onClick={handleExport}
      disabled={isEmpty}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
      style={{
        background: "var(--db-surface)",
        border: "1px solid var(--db-border)",
        color: "var(--db-text-muted)",
        cursor: isEmpty ? "not-allowed" : "pointer",
        opacity: isEmpty ? 0.5 : 1,
      }}
      title={isEmpty ? t("misc.noDataToExport", lang) : t("misc.exportAsCsv", lang)}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {t("action.exportCsv", lang)}
    </button>
  );
}

export type { CsvColumn };
