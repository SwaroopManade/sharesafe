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
    <aside className="flex flex-col justify-between space-y-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="space-y-5">
        {/* 1. Source orientation */}
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            Export Settings
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Source: {sourceWidth} × {sourceHeight} px · {APP_CONFIG.mimeToLabel[sourceMime]}
          </p>
        </div>

        {/* 2. Metadata cleaning trust signal */}
        <div className="rounded-lg border border-[var(--green-tint-border)] bg-[var(--green-tint-bg)] px-3.5 py-3 text-xs">
          <div className="flex items-center justify-between gap-2 font-medium text-[var(--green-tint-text)]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} strokeWidth={1.75} aria-hidden="true" />
              Metadata cleaning
            </span>
            <span className="rounded border border-[var(--green-tint-border)] bg-[var(--green-tint-bg)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--green-badge-text)]">
              Active
            </span>
          </div>
          <p className="mt-1.5 leading-relaxed text-[var(--text-secondary)]">
            Re-encodes locally to strip common EXIF &amp; GPS tags (not a forensic guarantee).{" "}
            <Link
              href="/privacy"
              className="text-[var(--green-tint-text)] underline underline-offset-2 hover:text-[var(--text-primary)]"
            >
              Details
            </Link>
          </p>
        </div>

        <div className="-mx-4 h-px bg-[var(--border-subtle)] sm:-mx-5" aria-hidden="true" />

        {/* 3. Resize controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Resize (px)
            </span>
            <button
              type="button"
              onClick={onResetDimensions}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--green-tint-text)] transition-colors duration-150 hover:text-[var(--accent-green)] focus-visible:outline-2 focus-visible:outline-[var(--accent-green)]"
            >
              <RotateCcw size={11} strokeWidth={1.75} aria-hidden="true" />
              Original
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <label className="block space-y-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Width
              </span>
              <input
                type="number"
                min={IMAGE_LIMITS.minOutputDimension}
                max={IMAGE_LIMITS.maxOutputDimension}
                value={resizeWidth}
                onChange={(e) => onChangeResizeWidth(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 hover:border-[var(--border-strong)] focus:border-[var(--green-tint-border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-green)]/30"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Height
              </span>
              <input
                type="number"
                min={IMAGE_LIMITS.minOutputDimension}
                max={IMAGE_LIMITS.maxOutputDimension}
                value={resizeHeight}
                onChange={(e) => onChangeResizeHeight(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 hover:border-[var(--border-strong)] focus:border-[var(--green-tint-border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-green)]/30"
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
              <span className="h-4 w-4 rounded border border-[var(--border-strong)] bg-[var(--surface-2)] transition-colors duration-150 peer-checked:border-[var(--accent-green)] peer-checked:bg-[var(--accent-green)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent-green)]" />
              <Lock
                size={10}
                strokeWidth={2.25}
                aria-hidden="true"
                className="pointer-events-none absolute text-[var(--text-inverse)] opacity-0 transition-opacity duration-150 peer-checked:opacity-100"
              />
            </span>
            <span className="text-xs text-[var(--text-secondary)]">Preserve aspect ratio</span>
          </label>
        </div>

        <div className="-mx-4 h-px bg-[var(--border-subtle)] sm:-mx-5" aria-hidden="true" />

        {/* 4. Format selector */}
        <div className="space-y-2.5">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
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
                  className={`rounded-lg py-2 text-xs font-semibold transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)] ${
                    active
                      ? "bg-[var(--accent-green)] text-[var(--text-inverse)]"
                      : supported
                        ? "border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                        : "cursor-not-allowed border border-[var(--border-subtle)] bg-transparent text-[var(--text-muted)] opacity-40"
                  }`}
                >
                  {APP_CONFIG.mimeToLabel[mime]}
                </button>
              );
            })}
          </div>

          {!supportedExportMimes.includes("image/webp") && (
            <p className="text-[11px] text-[var(--text-muted)]">
              WebP encoding is unavailable in this browser; JPEG and PNG remain supported.
            </p>
          )}

          {showJpegAlphaWarning && (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--amber-tint-border)] bg-[var(--amber-tint-bg)] px-3 py-2.5 text-[11px] leading-relaxed text-[var(--amber-tint-text)]">
              <AlertTriangle size={14} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                JPEG does not support transparency. Transparent regions will be flattened onto white.
              </span>
            </div>
          )}
        </div>

        <div className="-mx-4 h-px bg-[var(--border-subtle)] sm:-mx-5" aria-hidden="true" />

        {/* 5. Quality / Compression controls */}
        <div className="space-y-3">
          {isLossy ? (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Quality
                </span>
                <span className="font-mono text-[var(--text-secondary)]">
                  {Math.round(quality * 100)}%
                </span>
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
                      className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[var(--accent-green)] ${
                        isActive
                          ? "border-[var(--border-strong)] bg-[var(--surface-3)] text-[var(--text-primary)]"
                          : "border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]"
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
                  className="h-1.5 w-full cursor-pointer rounded-full bg-[var(--border-subtle)] accent-[var(--accent-green)]"
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                  <span>Smaller file</span>
                  <span>Higher quality</span>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                Lower {APP_CONFIG.mimeToLabel[outputMime]} quality reduces file size but may soften
                fine text.
              </p>
            </>
          ) : (
            <p className="text-xs leading-relaxed text-[var(--text-muted)]">
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
            className="animate-banner-in flex items-start gap-2 rounded-lg border border-[var(--red-tint-border)] bg-[var(--red-tint-bg)] px-3 py-2.5 text-xs text-[var(--red-tint-text)]"
          >
            <AlertTriangle size={14} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{exportError}</span>
          </div>
        )}

        <button
          type="button"
          disabled={isExporting}
          onClick={onExport}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-green)] px-5 py-2.5 text-sm font-semibold text-[var(--text-inverse)] transition-all duration-150 hover:bg-[var(--accent-green-hover)] hover:shadow-[var(--shadow-glow-green)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)]"
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
