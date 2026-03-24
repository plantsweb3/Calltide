"use client";

import { useEffect, useRef, useCallback } from "react";
import Button from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  onCancelRef.current = onCancel;

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onCancelRef.current();
  }, []);

  // Focus restoration
  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement as HTMLElement;
    }
    return () => {
      if (!open && prevFocusRef.current) {
        prevFocusRef.current.focus();
      }
    };
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="modal-content db-card w-full max-w-md rounded-xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="confirm-dialog-title"
          className="text-lg font-semibold"
          style={{ color: "var(--db-text)" }}
        >
          {title}
        </h3>
        <p className="text-sm" style={{ color: "var(--db-text-secondary)" }}>
          {description}
        </p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            variant={variant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Please wait..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
