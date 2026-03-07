"use client";

import { useState, useRef } from "react";

export default function ImportModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    inserted: number;
    errors: number;
    totalRows: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/prospects/import", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setResult(data);
      setTimeout(() => {
        onComplete();
        onClose();
      }, 2000);
    } else {
      setError(data.error || "Import failed");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith(".csv")) {
      setFile(droppedFile);
    } else {
      setError("Please drop a CSV file");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div
        className="w-full max-w-md rounded-xl p-6"
        style={{ background: "var(--db-card)", border: "1px solid var(--db-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 id="import-modal-title" className="text-lg font-semibold" style={{ color: "var(--db-text)" }}>Import Prospects</h2>
          <button
            onClick={onClose}
            className="text-lg transition-colors"
            style={{ color: "var(--db-text-muted)" }}
          >
            ×
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors"
          style={{
            borderColor: dragOver ? "var(--db-accent)" : "var(--db-border)",
            background: dragOver ? "rgba(197,154,39,0.05)" : "var(--db-surface)",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div>
              <p className="text-sm" style={{ color: "var(--db-text)" }}>{file.name}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm" style={{ color: "var(--db-text)" }}>
                Drop a CSV file here or click to browse
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--db-text-muted)" }}>
                Headers: business_name, phone, email, website, city, state,
                vertical
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
            Imported {result.inserted} of {result.totalRows} rows.{" "}
            {result.errors > 0 && `${result.errors} errors.`}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="cta-gold mt-4 w-full rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50 transition-colors"
        >
          {loading ? "Importing..." : "Import CSV"}
        </button>
      </div>
    </div>
  );
}
