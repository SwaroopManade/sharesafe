"use client";

import Link from "next/link";
import { AlertTriangle, Download, Loader2, Lock, RotateCcw, ShieldCheck } from "lucide-react";
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
    <aside className="flex flex-col justify-between space-y-5 rounded-xl border border-[#2e2e2e] bg-[#111111] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:p-5">
      <div className="space-y-5">
        {/* 1. Source orientation */}
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-[#f5f5f5]">Export Settings</h2>
          <p className="mt-1 text-xs text-[#666666]">
            Source: {sourceWidth} × {sourceHeight} px · {APP_CONFIG.mimeToLabel[sourceMime]}
          </p>
        </div>

        {/* 2. Metadata cleaning trust signal */}
        <div className="rounded-lg border border-[#166534] bg-[#052e16] px-3.5 py-3 text-xs">
          <div className="flex items-center justify-between gap-2 font-medium text-[#4ade80]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} strokeWidth={1.75} aria-hidden="true" />
              Metadata cleaning
            </span>
            <span className="rounded border border-[#166534] bg-[#052e16] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#22c55e]">
              Active
            </span>
          </div>
          <p className="mt-1.5 leading-relaxed text-[#a3a3a3]">
            Re-encodes locally to strip common EXIF &amp; GPS tags (not a forensic guarantee).{" "}
            <Link
              href="/privacy"
              className="text-[#4ade80] underline underline-offset-2 hover:text-[#f5f5f5]"
            >
              Details
            </Link>
          </p>
        </div>

        <div className="-mx-4 h-px bg-[#2e2e2e] sm:-mx-5" aria-hidden="true" />

        {/* 3. Resize controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#666666]">
              Resize (px)
            </span>
            <button
              type="button"
              onClick={onResetDimensions}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#4ade80] transition-colors duration-150 hover:text-[#22c55e] focus-visible:outline-2 focus-visible:outline-[#22c55e]"
            >
              <RotateCcw size={11} strokeWidth={1.75} aria-hidden="true" />
              Original
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <label className="block space-y-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#666666]">
                Width
              </span>
              <input
                type="number"
                min={IMAGE_LIMITS.minOutputDimension}
                max={IMAGE_LIMITS.maxOutputDimension}
                value={resizeWidth}
                onChange={(e) => onChangeResizeWidth(e.target.value)}
                className="w-full rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-3 py-2 text-sm text-[#f5f5f5] placeholder:text-[#666666] transition-colors duration-150 hover:border-[#3d3d3d] focus:border-[#166534] focus:outline-none focus:ring-1 focus:ring-[#166534]/40"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#666666]">
                Height
              </span>
              <input
                type="number"
                min={IMAGE_LIMITS.minOutputDimension}
                max={IMAGE_LIMITS.maxOutputDimension}
                value={resizeHeight}
                onChange={(e) => onChangeResizeHeight(e.target.value)}
                className="w-full rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-3 py-2 text-sm text-[#f5f5f5] placeholder:text-[#666666] transition-colors duration-150 hover:border-[#3d3d3d] focus:border-[#166534] focus:outline-none focus:ring-1 focus:ring-[#166534]/40"
              />
            </label>
          </div>

          <label className="flex cursor-pointer items-center gap-2 select-none">
            <span className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={lockAspectRatio}
                onChange={onToggleAspectLock}
                className="peer sr-only"
              />
              <span className="h-4 w-4 rounded border border-[#2e2e2e] bg-[#1a1a1a] transition-colors duration-150 peer-checked:border-[#22c55e] peer-checked:bg-[#22c55e] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#22c55e]" />
              <Lock
                size={10}
                strokeWidth={2.25}
                aria-hidden="true"
                className="pointer-events-none absolute text-[#0a0a0a] opacity-0 transition-opacity duration-150 peer-checked:opacity-100"
              />
            </span>
            <span className="text-xs text-[#a3a3a3]">Preserve aspect ratio</span>
          </label>
        </div>

        <div className="-mx-4 h-px bg-[#2e2e2e] sm:-mx-5" aria-hidden="true" />

        {/* 4. Format selector */}
        <div className="space-y-2.5">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-[#666666]">
            Output Format
          </span>
          <div className="grid grid-cols-3 gap-1.5">
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
                  className={`rounded-lg py-2 text-xs font-semibold transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e] ${
                    active
                      ? "bg-[#22c55e] text-[#0a0a0a]"
                      : supported
                        ? "border border-[#2e2e2e] bg-[#1a1a1a] text-[#a3a3a3] hover:border-[#3d3d3d] hover:text-[#f5f5f5]"
                        : "cursor-not-allowed border border-[#1a1a1a] bg-transparent text-[#666666] opacity-40"
                  }`}
                >
                  {APP_CONFIG.mimeToLabel[mime]}
                </button>
              );
            })}
          </div>

          {!supportedExportMimes.includes("image/webp") && (
            <p className="text-[11px] text-[#666666]">
              WebP encoding is unavailable in this browser; JPEG and PNG remain supported.
            </p>
          )}

          {showJpegAlphaWarning && (
            <div className="flex items-start gap-2 rounded-lg border border-[#92400e] bg-[#1c1200] px-3 py-2.5 text-[11px] leading-relaxed text-[#fbbf24]">
              <AlertTriangle size={14} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                JPEG does not support transparency. Transparent regions will be flattened onto white.
              </span>
            </div>
          )}
        </div>

        <div className="-mx-4 h-px bg-[#2e2e2e] sm:-mx-5" aria-hidden="true" />

        {/* 5. Quality / Compression controls */}
        <div className="space-y-3">
          {isLossy ? (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#666666]">
                  Quality
                </span>
                <span className="font-mono text-[#a3a3a3]">{Math.round(quality * 100)}%</span>
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
                      className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[#22c55e] ${
                        isActive
                          ? "border-[#3d3d3d] bg-[#242424] text-[#f5f5f5]"
                          : "border-[#2e2e2e] bg-[#1a1a1a] text-[#666666] hover:border-[#3d3d3d] hover:text-[#a3a3a3]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <input
                  type="range"
                  aria-label="Compression quality percentage"
                  min={10}
                  max={100}
                  step={1}
                  value={Math.round(quality * 100)}
                  onChange={(e) => onChangeQuality(Number(e.target.value) / 100)}
                  className="h-1.5 w-full cursor-pointer rounded-full bg-[#2e2e2e] accent-[#22c55e]"
                />
                <div className="flex justify-between text-[10px] text-[#666666]">
                  <span>Smaller file</span>
                  <span>Higher quality</span>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-[#666666]">
                Lower {APP_CONFIG.mimeToLabel[outputMime]} quality reduces file size but may soften
                fine text.
              </p>
            </>
          ) : (
            <p className="text-xs leading-relaxed text-[#666666]">
              PNG uses lossless compression for crisp screenshots and preserves transparency, though
              photo files may be larger than JPEG/WebP.
            </p>
          )}
        </div>
      </div>

      {/* 6 & 7. Error alert + Primary Export CTA */}
      <div className="space-y-3 pt-1">
        {exportError && (
          <div
            role="alert"
            className="animate-banner-in flex items-start gap-2 rounded-lg border border-[#7f1d1d] bg-[#1f0a0a] px-3 py-2.5 text-xs text-[#f87171]"
          >
            <AlertTriangle size={14} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{exportError}</span>
          </div>
        )}

        <button
          type="button"
          disabled={isExporting}
          onClick={onExport}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-all duration-150 hover:bg-[#16a34a] hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
        >
          {isExporting ? (
            <>
              <Loader2 size={16} strokeWidth={1.75} className="animate-spin" aria-hidden="true" />
              Flattening &amp; Re-encoding...
            </>
          ) : (
            <>
              <Download size={16} strokeWidth={1.75} aria-hidden="true" />
              Export &amp; Preview
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
