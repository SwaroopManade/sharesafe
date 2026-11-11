"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, X } from "lucide-react";
import { APP_CONFIG } from "@/config/app";
import { formatByteSize } from "@/lib/editor-utils";
import type { ExportResult } from "@/lib/image-engine";

interface ExportPreviewModalProps {
  result: ExportResult | null;
  sourceByteSize: number;
  onClose: () => void;
}

export function ExportPreviewModal({
  result,
  sourceByteSize,
  onClose,
}: ExportPreviewModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    setDownloaded(false);
    if (!result) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(result.blob);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [result]);

  useEffect(() => {
    if (!result) return;
    closeBtnRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [result, onClose]);

  if (!result || !previewUrl) return null;

  const sizeDeltaPct =
    sourceByteSize > 0
      ? Math.round(((result.byteSize - sourceByteSize) / sourceByteSize) * 100)
      : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-preview-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--backdrop-modal)] p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div className="animate-modal-in flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-[var(--shadow-modal)] sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2
              size={18}
              strokeWidth={1.75}
              className="shrink-0 text-[var(--accent-green)]"
              aria-hidden="true"
            />
            <div>
              <h2
                id="export-preview-title"
                className="text-sm font-semibold text-[var(--text-primary)]"
              >
                Export Ready
              </h2>
              <p className="text-xs text-[var(--green-tint-text)]">
                Redactions baked into pixels · Common EXIF/GPS metadata stripped
              </p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            aria-label="Close preview"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-all duration-150 hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent-green)]"
          >
            <X size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {/* Preview area */}
        <div className="flex flex-1 items-center justify-center overflow-auto bg-[var(--bg-page)] bg-[radial-gradient(var(--canvas-dot)_1px,transparent_1px)] [background-size:20px_20px] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview of flattened redacted export"
            className="max-h-[46vh] rounded border border-[var(--border-subtle)] object-contain shadow-[var(--shadow-elevated)]"
          />
        </div>

        {/* Stats + Download actions */}
        <div className="space-y-4 border-t border-[var(--border-subtle)] bg-[var(--surface-1)] px-5 py-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2.5 text-xs">
              <span className="block text-[11px] text-[var(--text-muted)]">Dimensions</span>
              <span className="mt-0.5 block font-medium text-[var(--text-primary)]">
                {result.width} × {result.height}
              </span>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2.5 text-xs">
              <span className="block text-[11px] text-[var(--text-muted)]">Output Size</span>
              <span className="mt-0.5 block font-medium text-[var(--text-primary)]">
                {formatByteSize(result.byteSize)}{" "}
                <span
                  className={
                    sizeDeltaPct <= 0
                      ? "text-[var(--green-tint-text)]"
                      : "text-[var(--text-secondary)]"
                  }
                >
                  ({sizeDeltaPct > 0 ? `+${sizeDeltaPct}%` : `${sizeDeltaPct}%`})
                </span>
              </span>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2.5 text-xs">
              <span className="block text-[11px] text-[var(--text-muted)]">Format</span>
              <span className="mt-0.5 block font-medium text-[var(--text-primary)]">
                {APP_CONFIG.mimeToLabel[result.mimeType]}
              </span>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2.5 text-xs">
              <span className="block text-[11px] text-[var(--text-muted)]">Filename</span>
              <span
                className="mt-0.5 block truncate font-medium text-[var(--text-primary)]"
                title={result.filename}
              >
                {result.filename}
              </span>
            </div>
          </div>

          {result.alphaFlattenedToBackground && (
            <p className="text-xs text-[var(--amber-tint-text)]">
              Transparent areas were flattened onto a white background for JPEG compatibility.
            </p>
          )}

          {downloaded && (
            <div
              role="status"
              className="animate-banner-in flex items-center gap-2 rounded-lg border border-[var(--green-tint-border)] bg-[var(--green-tint-bg)] px-3.5 py-2.5 text-xs text-[var(--green-tint-text)]"
            >
              <CheckCircle2 size={14} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
              <span>
                Your image is ready to share safely — download started for{" "}
                <strong className="font-semibold text-[var(--text-primary)]">
                  {result.filename}
                </strong>
                .
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)]"
            >
              Continue Editing
            </button>
            <a
              href={previewUrl}
              download={result.filename}
              onClick={() => setDownloaded(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-green)] px-5 py-2.5 text-sm font-semibold text-[var(--text-inverse)] transition-all duration-150 hover:bg-[var(--accent-green-hover)] hover:shadow-[var(--shadow-glow-green)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)]"
            >
              <Download size={16} strokeWidth={1.75} aria-hidden="true" />
              Download {APP_CONFIG.mimeToLabel[result.mimeType]}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
