"use client";

import {
  AlertTriangle,
  Layers,
  PlusSquare,
  Redo2,
  RefreshCw,
  RotateCcw,
  Square,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ZoomSetting } from "@/components/EditorCanvas";
import { computeNextZoomLevel, ZOOM_LEVELS } from "@/lib/editor-utils";
import type { BlurStrength, RedactionMode, RedactionRegion } from "@/lib/image-engine";

const SOLID_COLOR_SWATCHES = [
  { hex: "#09090b", label: "Black" },
  { hex: "#1e293b", label: "Slate" },
  { hex: "#ffffff", label: "White" },
  { hex: "#dc2626", label: "Red" },
] as const;

interface EditorToolbarProps {
  activeMode: RedactionMode;
  activeColor: string;
  activeBlurStrength: BlurStrength;
  selectedRegion: RedactionRegion | null;
  regionCount: number;
  maxRegions: number;
  canUndo: boolean;
  canRedo: boolean;
  zoom: ZoomSetting;
  fitScale?: number;
  onChangeMode: (mode: RedactionMode) => void;
  onChangeColor: (hex: string) => void;
  onChangeBlurStrength: (strength: BlurStrength) => void;
  onAddCenteredBox: () => void;
  onDeleteSelected: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onResetAll: () => void;
  onChangeZoom: (next: ZoomSetting) => void;
  onReplaceImage: () => void;
}

export function EditorToolbar({
  activeMode,
  activeColor,
  activeBlurStrength,
  selectedRegion,
  regionCount,
  maxRegions,
  canUndo,
  canRedo,
  zoom,
  fitScale = 1,
  onChangeMode,
  onChangeColor,
  onChangeBlurStrength,
  onAddCenteredBox,
  onDeleteSelected,
  onUndo,
  onRedo,
  onResetAll,
  onChangeZoom,
  onReplaceImage,
}: EditorToolbarProps) {
  const effectiveMode = selectedRegion ? selectedRegion.mode : activeMode;
  const effectiveColor = selectedRegion?.color ?? activeColor;
  const effectiveBlur = selectedRegion?.blurStrength ?? activeBlurStrength;

  const effectiveZoomValue = zoom === "fit" ? fitScale : zoom;
  const isMinZoom = effectiveZoomValue <= ZOOM_LEVELS[0] + 0.005;
  const isMaxZoom = effectiveZoomValue >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1] - 0.005;

  const stepZoom = (direction: 1 | -1) => {
    onChangeZoom(computeNextZoomLevel(zoom, fitScale, direction));
  };

  return (
    <div className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3.5 shadow-[var(--shadow-card)] sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Primary decision — Redaction Mode Toggle */}
        <div role="group" aria-label="Redaction tool" className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={effectiveMode === "solid"}
            onClick={() => onChangeMode("solid")}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)] ${
              effectiveMode === "solid"
                ? "border-[var(--green-tint-border)] bg-[var(--green-tint-bg)] text-[var(--green-tint-text)]"
                : "border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Square size={14} strokeWidth={0} fill="currentColor" aria-hidden="true" />
            <span>Solid Cover</span>
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                effectiveMode === "solid"
                  ? "border-[var(--green-tint-border)] bg-[var(--green-tint-bg)] text-[var(--green-badge-text)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-3)] text-[var(--text-secondary)]"
              }`}
            >
              Secure
            </span>
          </button>

          <button
            type="button"
            aria-pressed={effectiveMode === "blur"}
            onClick={() => onChangeMode("blur")}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-amber)] ${
              effectiveMode === "blur"
                ? "border-[var(--amber-tint-border)] bg-[var(--amber-tint-bg)] text-[var(--amber-tint-text)]"
                : "border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Layers size={14} strokeWidth={1.75} aria-hidden="true" />
            <span>Blur</span>
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                effectiveMode === "blur"
                  ? "border-[var(--amber-tint-border)] bg-[var(--amber-tint-bg)] text-[var(--amber-badge-text)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-3)] text-[var(--text-secondary)]"
              }`}
            >
              Visual Only
            </span>
          </button>
        </div>

        {/* Right: Region creation, history, zoom, and replace image */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onAddCenteredBox}
            disabled={regionCount >= maxRegions}
            title="Keyboard-accessible alternative: insert a centered redaction box"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)]"
          >
            <PlusSquare size={14} strokeWidth={1.75} aria-hidden="true" />
            Add Box
          </button>

          {selectedRegion && (
            <button
              type="button"
              onClick={onDeleteSelected}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--red-tint-border)] bg-[var(--red-tint-bg)] px-2.5 py-1.5 text-xs font-medium text-[var(--red-tint-text)] transition-all duration-150 hover:bg-[var(--red-tint-hover)] hover:text-[var(--red-tint-strong)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-red)]"
            >
              <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
              Delete
            </button>
          )}

          <div className="mx-0.5 hidden h-5 w-px bg-[var(--border-subtle)] sm:block" aria-hidden="true" />

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo last edit"
            title="Undo (Ctrl/Cmd + Z)"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)]"
          >
            <Undo2 size={14} strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo last edit"
            title="Redo (Ctrl/Cmd + Shift + Z)"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)]"
          >
            <Redo2 size={14} strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">Redo</span>
          </button>

          <button
            type="button"
            onClick={onResetAll}
            disabled={regionCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)]"
          >
            <RotateCcw size={13} strokeWidth={1.75} aria-hidden="true" />
            Reset ({regionCount})
          </button>

          <div className="mx-0.5 hidden h-5 w-px bg-[var(--border-subtle)] sm:block" aria-hidden="true" />

          <div role="group" aria-label="Zoom controls" className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => stepZoom(-1)}
              disabled={isMinZoom}
              aria-label="Zoom out"
              className="inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-all duration-150 hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)]"
            >
              <ZoomOut size={14} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onChangeZoom("fit")}
              title="Reset zoom to fit viewport"
              className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)] ${
                zoom === "fit"
                  ? "border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              }`}
            >
              {zoom === "fit" ? `Fit (${Math.round(fitScale * 100)}%)` : `${Math.round(zoom * 100)}%`}
            </button>
            <button
              type="button"
              onClick={() => stepZoom(1)}
              disabled={isMaxZoom}
              aria-label="Zoom in"
              className="inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-all duration-150 hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)]"
            >
              <ZoomIn size={14} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          <div className="mx-0.5 hidden h-5 w-px bg-[var(--border-subtle)] sm:block" aria-hidden="true" />

          <button
            type="button"
            onClick={onReplaceImage}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-all duration-150 hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)]"
          >
            <RefreshCw size={13} strokeWidth={1.75} aria-hidden="true" />
            New Image
          </button>
        </div>
      </div>

      {/* Contextual sub-bar: Solid swatches or Blur intensity */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-3 text-xs">
        {effectiveMode === "solid" ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[var(--text-muted)]">
              {selectedRegion ? "Selected fill:" : "Fill color:"}
            </span>
            <div className="flex items-center gap-1.5">
              {SOLID_COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  aria-label={`Solid color ${swatch.label}`}
                  aria-pressed={effectiveColor === swatch.hex}
                  onClick={() => onChangeColor(swatch.hex)}
                  style={{ backgroundColor: swatch.hex }}
                  className={`h-6 w-6 rounded-md border transition-all duration-150 active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)] ${
                    effectiveColor === swatch.hex
                      ? "border-[var(--accent-green)] ring-2 ring-[var(--accent-green)]/35"
                      : "border-[var(--border-strong)] hover:border-[var(--text-secondary)]"
                  }`}
                />
              ))}
            </div>
            <span className="text-[var(--text-secondary)]">
              Recommended for passwords, account IDs, phone numbers, and text.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[var(--text-muted)]">
              {selectedRegion ? "Selected blur:" : "Intensity:"}
            </span>
            <div className="flex items-center gap-1.5">
              {([1, 2, 3] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  aria-pressed={effectiveBlur === lvl}
                  onClick={() => onChangeBlurStrength(lvl)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[var(--accent-amber)] ${
                    effectiveBlur === lvl
                      ? "border-[var(--amber-tint-border)] bg-[var(--amber-tint-bg)] text-[var(--amber-tint-text)]"
                      : "border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {lvl === 1 ? "Light" : lvl === 2 ? "Medium" : "Strong"}
                </button>
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 text-[var(--amber-tint-text)]">
              <AlertTriangle size={13} strokeWidth={1.75} aria-hidden="true" />
              Blur reduces legibility visually — use Solid Cover for sensitive secrets.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
