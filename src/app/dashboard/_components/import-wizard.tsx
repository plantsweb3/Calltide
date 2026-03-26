"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CaptaSpinnerInline } from "@/components/capta-spinner";
import { t, type Lang } from "@/lib/i18n/strings";

type ImportType = "customers" | "appointments" | "estimates";
type WizardStep = "choose" | "upload" | "preview" | "results";

interface ImportError {
  row: number;
  reason: string;
}

interface ImportResults {
  imported: number;
  skipped: number;
  errors: ImportError[];
}

interface PreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

const IMPORT_TYPE_ICONS: Record<ImportType, React.ReactNode> = {
  customers: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  appointments: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  estimates: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
};

const IMPORT_TYPE_KEYS: ImportType[] = ["customers", "appointments", "estimates"];

function getImportTypeLabel(key: ImportType, lang: Lang): string {
  return t(`import.${key}`, lang);
}

function getImportTypeDesc(key: ImportType, lang: Lang): string {
  return t(`import.${key}Desc`, lang);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function parseCsvPreview(text: string): PreviewData {
  // Quote-aware line splitting (matches backend splitCsvLines)
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      current += char;
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === "\n" || (char === "\r" && text[i + 1] === "\n")) && !inQuotes) {
      if (current.trim()) lines.push(current);
      current = "";
      if (char === "\r") i++;
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current);

  if (lines.length === 0) return { headers: [], rows: [], totalRows: 0 };

  // Parse a CSV row handling quoted fields and escaped quotes (matches backend parseCsvLine)
  const parseRow = (line: string) => {
    const result: string[] = [];
    let field = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { field += '"'; i++; }
        else { q = !q; }
      } else if (ch === "," && !q) { result.push(field.trim()); field = ""; }
      else { field += ch; }
    }
    result.push(field.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1, 11).map(parseRow);
  return { headers, rows, totalRows: lines.length - 1 };
}

export default function ImportWizard({ initialType, lang }: { initialType?: ImportType; lang: Lang }) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(initialType ? "upload" : "choose");
  const [importType, setImportType] = useState<ImportType | null>(initialType || null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<ImportResults | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.endsWith(".csv")) {
      toast.error(t("import.errorCsvOnly", lang));
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error(t("import.errorTooLarge", lang));
      return;
    }
    setFile(selectedFile);
    const text = await selectedFile.text();
    const previewData = parseCsvPreview(text);
    if (previewData.headers.length === 0) {
      toast.error(t("import.errorEmpty", lang));
      return;
    }
    setPreview(previewData);
    setStep("preview");
  }, [lang]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!file || !importType) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/dashboard/import/${importType}`, {
        method: "POST",
        body: formData,
      });

      if (res.status === 429) {
        toast.error(t("import.errorRateLimit", lang));
        setUploading(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t("import.errorFailed", lang));
        setUploading(false);
        return;
      }

      setResults(data);
      setStep("results");
      if (data.imported > 0) {
        toast.success(t("import.successToast", lang, { count: data.imported, type: getImportTypeLabel(importType, lang).toLowerCase() }));
      }
    } catch {
      toast.error(t("import.errorFailed", lang));
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setStep("choose");
    setImportType(null);
    setFile(null);
    setPreview(null);
    setResults(null);
  };

  const goBack = () => {
    if (step === "upload") { setStep("choose"); setImportType(null); }
    else if (step === "preview") { setStep("upload"); setFile(null); setPreview(null); }
  };

  const stepLabels = [
    t("import.stepChooseType", lang),
    t("import.stepUploadFile", lang),
    t("import.stepPreview", lang),
    t("import.stepResults", lang),
  ];

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(["choose", "upload", "preview", "results"] as WizardStep[]).map((s, idx) => {
          const stepOrder = ["choose", "upload", "preview", "results"];
          const currentIdx = stepOrder.indexOf(step);
          const isActive = idx <= currentIdx;
          return (
            <div key={s} className="flex items-center gap-2">
              {idx > 0 && (
                <div
                  className="h-px w-8"
                  style={{ background: isActive ? "var(--db-accent)" : "var(--db-border)" }}
                />
              )}
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium"
                  style={{
                    background: isActive ? "var(--db-accent)" : "var(--db-hover)",
                    color: isActive ? "#fff" : "var(--db-text-muted)",
                  }}
                >
                  {idx + 1}
                </div>
                <span
                  className="text-sm hidden sm:inline"
                  style={{ color: isActive ? "var(--db-text)" : "var(--db-text-muted)" }}
                >
                  {stepLabels[idx]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1: Choose Type */}
      {step === "choose" && (
        <div>
          <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--db-text)" }}>
            {t("import.whatToImport", lang)}
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--db-text-muted)" }}>
            {t("import.selectType", lang)}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {IMPORT_TYPE_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => { setImportType(key); setStep("upload"); }}
                className="flex flex-col items-start gap-3 rounded-xl p-5 text-left transition-all"
                style={{
                  background: "var(--db-surface)",
                  border: "1px solid var(--db-border)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--db-accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--db-border)"; }}
              >
                <div
                  className="rounded-lg p-2.5"
                  style={{ background: "var(--db-hover)", color: "var(--db-accent)" }}
                >
                  {IMPORT_TYPE_ICONS[key]}
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: "var(--db-text)" }}>
                    {getImportTypeLabel(key, lang)}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
                    {getImportTypeDesc(key, lang)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Upload */}
      {step === "upload" && importType && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={goBack}
              className="db-hover-bg rounded-lg p-1.5 transition-colors"
              style={{ color: "var(--db-text-muted)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
              {t("import.uploadCsv", lang, { type: capitalize(getImportTypeLabel(importType, lang)) })}
            </h2>
          </div>

          {/* Download template */}
          <div
            className="rounded-xl p-4 mb-6 flex items-center justify-between"
            style={{ background: "var(--db-hover)", border: "1px solid var(--db-border)" }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
                {t("import.needTemplate", lang)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
                {t("import.templateDesc", lang)}
              </p>
            </div>
            <a
              href={`/api/dashboard/import/templates?type=${importType}`}
              download
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: "var(--db-surface)",
                border: "1px solid var(--db-border)",
                color: "var(--db-text)",
              }}
            >
              {t("import.downloadTemplate", lang)}
            </a>
          </div>

          {/* Drop zone */}
          <div
            className="rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer"
            style={{
              borderColor: dragOver ? "var(--db-accent)" : "var(--db-border)",
              background: dragOver ? "color-mix(in srgb, var(--db-accent) 5%, transparent)" : "var(--db-surface)",
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
            <svg
              className="mx-auto mb-3"
              width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: "var(--db-text-muted)" }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-sm font-medium" style={{ color: "var(--db-text)" }}>
              {t("import.dropOrBrowse", lang)}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
              {t("import.maxFileSize", lang)}
            </p>
          </div>

          {/* Tips */}
          <div className="mt-6 rounded-xl p-4" style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--db-text)" }}>
              {t("import.tipsTitle", lang)}
            </p>
            <ul className="space-y-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
              <li>{t("import.tipExport", lang)}</li>
              <li>{t("import.tipColumnsMatched", lang)}</li>
              <li>{t("import.tipPhoneLink", lang)}</li>
              {importType === "appointments" && (
                <li>{t("import.tipDateFormats", lang)}</li>
              )}
              {importType === "estimates" && (
                <li>{t("import.tipEstimatesCustomersFirst", lang)}</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && preview && importType && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={goBack}
              className="db-hover-bg rounded-lg p-1.5 transition-colors"
              style={{ color: "var(--db-text-muted)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>
              {t("import.previewImport", lang)}
            </h2>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "var(--db-text)" }}>
                <span className="font-medium">{file?.name}</span>
                {" — "}
                {preview.totalRows !== 1
                  ? t("import.rowsFoundPlural", lang, { count: preview.totalRows })
                  : t("import.rowsFound", lang, { count: preview.totalRows })}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--db-text-muted)" }}>
                {t("import.showingFirst", lang, { count: Math.min(10, preview.rows.length) })}
              </p>
            </div>
          </div>

          <div className="overflow-auto rounded-xl border" style={{ borderColor: "var(--db-border)" }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "var(--db-hover)" }}>
                  <th className="px-3 py-2 text-left font-medium" style={{ color: "var(--db-text-muted)" }}>#</th>
                  {preview.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium whitespace-nowrap" style={{ color: "var(--db-text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr
                    key={i}
                    style={{ borderTop: "1px solid var(--db-border)", background: "var(--db-surface)" }}
                  >
                    <td className="px-3 py-2" style={{ color: "var(--db-text-muted)" }}>{i + 2}</td>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 max-w-[200px] truncate" style={{ color: "var(--db-text)" }}>
                        {cell || <span style={{ color: "var(--db-text-muted)" }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={goBack}
              className="rounded-lg px-4 py-2 text-sm"
              style={{ background: "var(--db-hover)", color: "var(--db-text)" }}
            >
              {t("import.chooseDifferentFile", lang)}
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="rounded-lg px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: "var(--db-accent)" }}
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <CaptaSpinnerInline size={16} />
                  {t("import.importing", lang)}
                </span>
              ) : (
                preview.totalRows !== 1
                  ? t("import.importRowsPlural", lang, { count: preview.totalRows })
                  : t("import.importRows", lang, { count: preview.totalRows })
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === "results" && results && importType && (
        <div>
          <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--db-text)" }}>
            {t("import.complete", lang)}
          </h2>

          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div className="rounded-xl p-4" style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}>
              <div className="text-2xl font-bold" style={{ color: "var(--db-success)" }}>
                {results.imported}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
                {t("import.successfullyImported", lang)}
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}>
              <div className="text-2xl font-bold" style={{ color: "var(--db-text-muted)" }}>
                {results.skipped}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
                {t("import.skippedDuplicates", lang)}
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--db-surface)", border: "1px solid var(--db-border)" }}>
              <div className="text-2xl font-bold" style={{ color: results.errors.length > 0 ? "var(--db-danger)" : "var(--db-text-muted)" }}>
                {results.errors.length}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--db-text-muted)" }}>
                {t("import.errors", lang)}
              </div>
            </div>
          </div>

          {/* Error details */}
          {results.errors.length > 0 && (
            <div className="mb-6 rounded-xl overflow-hidden" style={{ border: "1px solid var(--db-danger)" }}>
              <div className="px-4 py-3" style={{ background: "var(--db-danger-bg)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--db-danger)" }}>
                  {results.errors.length !== 1
                    ? t("import.rowsHadErrorsPlural", lang, { count: results.errors.length })
                    : t("import.rowsHadErrors", lang, { count: results.errors.length })}
                </p>
              </div>
              <div className="max-h-48 overflow-auto" style={{ background: "var(--db-surface)" }}>
                {results.errors.map((err, i) => (
                  <div
                    key={i}
                    className="px-4 py-2 text-xs flex gap-3"
                    style={{ borderTop: i > 0 ? "1px solid var(--db-border)" : undefined }}
                  >
                    <span className="font-medium shrink-0" style={{ color: "var(--db-text-muted)" }}>
                      {t("import.row", lang, { n: err.row })}
                    </span>
                    <span style={{ color: "var(--db-text)" }}>{err.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="rounded-lg px-4 py-2 text-sm"
              style={{ background: "var(--db-hover)", color: "var(--db-text)" }}
            >
              {t("import.importMoreData", lang)}
            </button>
            <button
              onClick={() => {
                const paths: Record<ImportType, string> = {
                  customers: "/dashboard/customers",
                  appointments: "/dashboard/appointments",
                  estimates: "/dashboard/estimates",
                };
                router.push(paths[importType]);
              }}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: "var(--db-accent)" }}
            >
              {t("import.view", lang, { type: capitalize(getImportTypeLabel(importType, lang)) })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
