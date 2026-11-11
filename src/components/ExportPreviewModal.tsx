"use client";

import { useEffect, useRef, useState } from "react";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 id="export-preview-title" className="text-lg font-semibold text-white">
              Flattened Export Ready
            </h2>
            <p className="text-xs text-emerald-300">
              Redactions permanently baked into pixels · Common EXIF/GPS metadata stripped locally
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            Back to Editor
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-zinc-950 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview of flattened redacted export"
            className="mx-auto max-h-[52vh] rounded border border-zinc-800 object-contain"
          />
        </div>

        <div className="space-y-4 border-t border-zinc-800 bg-zinc-900 px-5 py-4">
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-2.5">
              <span className="block text-zinc-400">Dimensions</span>
              <span className="font-medium text-white">
                {result.width} × {result.height} px
              </span>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-2.5">
              <span className="block text-zinc-400">Output Size</span>
              <span className="font-medium text-white">
                {formatByteSize(result.byteSize)}{" "}
                <span className={sizeDeltaPct <= 0 ? "text-emerald-400" : "text-zinc-400"}>
                  ({sizeDeltaPct > 0 ? `+${sizeDeltaPct}%` : `${sizeDeltaPct}%`})
                </span>
              </span>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-2.5">
              <span className="block text-zinc-400">Format</span>
              <span className="font-medium text-white">
                {APP_CONFIG.mimeToLabel[result.mimeType]}
              </span>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-2.5">
              <span className="block text-zinc-400">Filename</span>
              <span className="block truncate font-medium text-white" title={result.filename}>
                {result.filename}
              </span>
            </div>
          </div>

          {result.alphaFlattenedToBackground && (
            <p className="text-xs text-amber-300">
              Transparent regions were flattened onto a white background for JPEG export.
            </p>
          )}

          {downloaded && (
            <div
              role="status"
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200"
            >
              Download started for <strong>{result.filename}</strong>. You can close this dialog or
              continue adjusting regions.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              Continue Editing
            </button>
            <a
              href={previewUrl}
              download={result.filename}
              onClick={() => setDownloaded(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              Download {APP_CONFIG.mimeToLabel[result.mimeType]}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

