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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div className="animate-modal-in flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[#2e2e2e] bg-[#111111] shadow-[0_8px_32px_rgba(0,0,0,0.7),0_2px_8px_rgba(0,0,0,0.5)] sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2e2e2e] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} strokeWidth={1.75} className="shrink-0 text-[#22c55e]" aria-hidden="true" />
            <div>
              <h2 id="export-preview-title" className="text-sm font-semibold text-[#f5f5f5]">
                Export Ready
              </h2>
              <p className="text-xs text-[#4ade80]">
                Redactions baked into pixels · Common EXIF/GPS metadata stripped
              </p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            aria-label="Close preview"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#666666] transition-all duration-150 hover:bg-[#1a1a1a] hover:text-[#f5f5f5] focus-visible:outline-2 focus-visible:outline-[#22c55e]"
          >
            <X size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {/* Preview area */}
        <div className="flex flex-1 items-center justify-center overflow-auto bg-[#0a0a0a] bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:20px_20px] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview of flattened redacted export"
            className="max-h-[46vh] rounded border border-[#2e2e2e] object-contain shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          />
        </div>

        {/* Stats + Download actions */}
        <div className="space-y-4 border-t border-[#2e2e2e] bg-[#111111] px-5 py-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] p-2.5 text-xs">
              <span className="block text-[11px] text-[#666666]">Dimensions</span>
              <span className="mt-0.5 block font-medium text-[#f5f5f5]">
                {result.width} × {result.height}
              </span>
            </div>
            <div className="rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] p-2.5 text-xs">
              <span className="block text-[11px] text-[#666666]">Output Size</span>
              <span className="mt-0.5 block font-medium text-[#f5f5f5]">
                {formatByteSize(result.byteSize)}{" "}
                <span className={sizeDeltaPct <= 0 ? "text-[#4ade80]" : "text-[#a3a3a3]"}>
                  ({sizeDeltaPct > 0 ? `+${sizeDeltaPct}%` : `${sizeDeltaPct}%`})
                </span>
              </span>
            </div>
            <div className="rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] p-2.5 text-xs">
              <span className="block text-[11px] text-[#666666]">Format</span>
              <span className="mt-0.5 block font-medium text-[#f5f5f5]">
                {APP_CONFIG.mimeToLabel[result.mimeType]}
              </span>
            </div>
            <div className="rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] p-2.5 text-xs">
              <span className="block text-[11px] text-[#666666]">Filename</span>
              <span className="mt-0.5 block truncate font-medium text-[#f5f5f5]" title={result.filename}>
                {result.filename}
              </span>
            </div>
          </div>

          {result.alphaFlattenedToBackground && (
            <p className="text-xs text-[#fbbf24]">
              Transparent areas were flattened onto a white background for JPEG compatibility.
            </p>
          )}

          {downloaded && (
            <div
              role="status"
              className="animate-banner-in flex items-center gap-2 rounded-lg border border-[#166534] bg-[#052e16] px-3.5 py-2.5 text-xs text-[#4ade80]"
            >
              <CheckCircle2 size={14} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
              <span>
                Your image is ready to share safely — download started for{" "}
                <strong className="font-semibold text-[#f5f5f5]">{result.filename}</strong>.
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-4 py-2 text-xs font-medium text-[#a3a3a3] transition-all duration-150 hover:border-[#3d3d3d] hover:bg-[#242424] hover:text-[#f5f5f5] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
            >
              Continue Editing
            </button>
            <a
              href={previewUrl}
              download={result.filename}
              onClick={() => setDownloaded(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-all duration-150 hover:bg-[#16a34a] hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
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
