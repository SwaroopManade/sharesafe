"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmDiscardDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDiscardDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDiscardDialogProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelBtnRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-discard-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--backdrop-modal)] p-4 backdrop-blur-sm"
    >
      <div className="animate-modal-in w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-modal)]">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--red-tint-border)] bg-[var(--red-tint-bg)] text-[var(--red-tint-text)]">
            <AlertTriangle size={18} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div>
            <h2
              id="confirm-discard-title"
              className="text-base font-semibold text-[var(--text-primary)]"
            >
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2.5">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--red-tint-border)] bg-[var(--red-tint-bg)] px-4 py-2 text-xs font-semibold text-[var(--red-tint-text)] transition-all duration-150 hover:bg-[var(--red-tint-hover)] hover:text-[var(--red-tint-strong)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-red)]"
          >
            <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
