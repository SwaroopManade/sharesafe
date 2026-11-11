"use client";

import Link from "next/link";
import { APP_CONFIG } from "@/config/app";
import { IMAGE_LIMITS } from "@/config/limits";
import type { SupportedImageMime } from "@/lib/image-engine";

interface ExportPanelProps {
  sourceWidth: number;
  sourceHeight: number;
  sourceMime: SupportedImageMime;
  outputMime: SupportedImageMime;
  supportedExportMimes: SupportedImageMime[];
  quality: number;
  resizeWidth: string;
  resizeHeight: string;
  lockAspectRatio: boolean;
  isExporting: boolean;
  exportError: string | null;
  onChangeOutputMime: (mime: SupportedImageMime) => void;
  onChangeQuality: (quality: number) => void;
  onChangeResizeWidth: (val: string) => void;
  onChangeResizeHeight: (val: string) => void;
  onToggleAspectLock: () => void;
  onResetDimensions: () => void;
  onExport: () => void;
}

export function ExportPanel({
  sourceWidth,
  sourceHeight,
  sourceMime,
  outputMime,
  supportedExportMimes,
  quality,
  resizeWidth,
  resizeHeight,
  lockAspectRatio,
  isExporting,
  exportError,
  onChangeOutputMime,
  onChangeQuality,
  onChangeResizeWidth,
  onChangeResizeHeight,
  onToggleAspectLock,
  onResetDimensions,
  onExport,
}: ExportPanelProps) {
  const isLossy = outputMime === "image/jpeg" || outputMime === "image/webp";
  const mayHaveAlpha = sourceMime === "image/png" || sourceMime === "image/webp";
  const showJpegAlphaWarning = outputMime === "image/jpeg" && mayHaveAlpha;

  return (
    <aside className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold text-white">Export Settings</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Original: {sourceWidth} × {sourceHeight} px ({APP_CONFIG.mimeToLabel[sourceMime]})
        </p>
      </div>

      {/* Metadata Cleaning Status (FR-031, FR-033) */}
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-200">
        <div className="flex items-center justify-between gap-2 font-medium text-emerald-100">
          <span>Metadata cleaning</span>
          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] uppercase">
            Enabled
          </span>
        </div>
        <p className="mt-1 leading-relaxed text-emerald-200/90">
          Re-encodes the image locally to strip common EXIF &amp; GPS fields. Not a guarantee
          against every hidden or steganographic payload.{" "}
          <Link href="/privacy" className="underline hover:text-white">
            Details
          </Link>
        </p>
      </div>

      {/* Resize Controls (FR-034 - FR-036) */}
      <div className="space-y-2.5 border-t border-zinc-800 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Resize (px)
          </span>
          <button
            type="button"
            onClick={onResetDimensions}
            className="text-xs text-emerald-400 hover:underline focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            Reset to original
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <label className="space-y-1 text-xs text-zinc-400">
            <span>Width</span>
            <input
              type="number"
              min={IMAGE_LIMITS.minOutputDimension}
              max={IMAGE_LIMITS.maxOutputDimension}
              value={resizeWidth}
              onChange={(e) => onChangeResizeWidth(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>

          <label className="space-y-1 text-xs text-zinc-400">
            <span>Height</span>
            <input
              type="number"
              min={IMAGE_LIMITS.minOutputDimension}
              max={IMAGE_LIMITS.maxOutputDimension}
              value={resizeHeight}
              onChange={(e) => onChangeResizeHeight(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
            />
          </label>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={lockAspectRatio}
            onChange={onToggleAspectLock}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-950 accent-emerald-500"
          />
          Preserve aspect ratio
        </label>
      </div>

      {/* Format Selection (FR-037, Section 11) */}
      <div className="space-y-2.5 border-t border-zinc-800 pt-4">
        <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Output Format
        </span>
        <div className="grid grid-cols-3 gap-2">
          {APP_CONFIG.supportedExportMimes.map((mime) => {
            const supported = supportedExportMimes.includes(mime);
            const active = outputMime === mime;
            return (
              <button
                key={mime}
                type="button"
                disabled={!supported}
                aria-pressed={active}
                title={
                  supported
                    ? `Export as ${APP_CONFIG.mimeToLabel[mime]}`
                    : `${APP_CONFIG.mimeToLabel[mime]} encoding is not supported by this browser`
                }
                onClick={() => onChangeOutputMime(mime)}
                className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                  active
                    ? "bg-emerald-500 text-zinc-950"
                    : supported
                      ? "border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                      : "cursor-not-allowed border border-zinc-800 bg-zinc-950 text-zinc-600"
                }`}
              >
                {APP_CONFIG.mimeToLabel[mime]}
              </button>
            );
          })}
        </div>

        {!supportedExportMimes.includes("image/webp") && (
          <p className="text-[11px] text-zinc-400">
            WebP encoding is unavailable in this browser; JPEG and PNG remain supported.
          </p>
        )}

        {showJpegAlphaWarning && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] leading-relaxed text-amber-200">
            JPEG does not support transparency. Any transparent areas will be flattened onto a white
            background.
          </p>
        )}
      </div>

      {/* Compression & Quality Controls (FR-038 - FR-040) */}
      <div className="space-y-3 border-t border-zinc-800 pt-4">
        {isLossy ? (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wider text-zinc-300">
                Compression Quality
              </span>
              <span className="font-mono text-zinc-200">{Math.round(quality * 100)}%</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {APP_CONFIG.qualityPresets.map((preset) => {
                const isActive = Math.abs(quality - preset.quality) < 0.02;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onChangeQuality(preset.quality)}
                    className={`rounded-lg px-2 py-1.5 text-[11px] font-medium transition focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                      isActive
                        ? "bg-zinc-200 text-zinc-950"
                        : "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <input
              type="range"
              aria-label="Compression quality percentage"
              min={10}
              max={100}
              step={1}
              value={Math.round(quality * 100)}
              onChange={(e) => onChangeQuality(Number(e.target.value) / 100)}
              className="w-full accent-emerald-500"
            />
            <p className="text-[11px] text-zinc-400">
              Lower {APP_CONFIG.mimeToLabel[outputMime]} quality shrinks file size but can reduce
              sharpness around text.
            </p>
          </>
        ) : (
          <p className="text-xs leading-relaxed text-zinc-400">
            PNG uses lossless compression for crisp screenshots and preserves transparency, though
            photo files may be larger than JPEG/WebP.
          </p>
        )}
      </div>

      {exportError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200"
        >
          {exportError}
        </div>
      )}

      <button
        type="button"
        disabled={isExporting}
        onClick={onExport}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
      >
        {isExporting ? "Flattening & Re-encoding..." : "Export & Preview Image"}
      </button>
    </aside>
  );
}

