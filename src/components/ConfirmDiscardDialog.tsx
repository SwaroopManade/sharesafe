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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
    >
      <div className="animate-modal-in w-full max-w-md rounded-2xl border border-[#2e2e2e] bg-[#111111] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.7),0_2px_8px_rgba(0,0,0,0.5)]">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#7f1d1d] bg-[#1f0a0a] text-[#f87171]">
            <AlertTriangle size={18} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div>
            <h2 id="confirm-discard-title" className="text-base font-semibold text-[#f5f5f5]">
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#a3a3a3]">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2.5">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-4 py-2 text-xs font-medium text-[#a3a3a3] transition-all duration-150 hover:border-[#3d3d3d] hover:bg-[#242424] hover:text-[#f5f5f5] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#7f1d1d] bg-[#1f0a0a] px-4 py-2 text-xs font-semibold text-[#f87171] transition-all duration-150 hover:bg-[#2d0f0f] hover:text-[#fca5a5] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef4444]"
          >
            <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
