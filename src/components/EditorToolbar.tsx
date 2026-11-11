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

  const stepZoom = (direction: 1 | -1) => {
    const levels = [0.5, 0.75, 1, 1.5, 2, 3];
    const current = zoom === "fit" ? 1 : zoom;
    if (direction === 1) {
      const next = levels.find((l) => l > current + 0.01) ?? 3;
      onChangeZoom(next);
    } else {
      const reversed = [...levels].reverse();
      const next = reversed.find((l) => l < current - 0.01) ?? 0.5;
      onChangeZoom(next);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-[#2e2e2e] bg-[#111111] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Primary decision — Redaction Mode Toggle */}
        <div role="group" aria-label="Redaction tool" className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={effectiveMode === "solid"}
            onClick={() => onChangeMode("solid")}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e] ${
              effectiveMode === "solid"
                ? "border-[#166534] bg-[#052e16] text-[#4ade80]"
                : "border-[#2e2e2e] bg-[#1a1a1a] text-[#a3a3a3] hover:border-[#3d3d3d] hover:bg-[#242424] hover:text-[#f5f5f5]"
            }`}
          >
            <Square size={14} strokeWidth={0} fill="currentColor" aria-hidden="true" />
            <span>Solid Cover</span>
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                effectiveMode === "solid"
                  ? "border-[#166534] bg-[#052e16] text-[#22c55e]"
                  : "border-[#2e2e2e] bg-[#242424] text-[#a3a3a3]"
              }`}
            >
              Secure
            </span>
          </button>

          <button
            type="button"
            aria-pressed={effectiveMode === "blur"}
            onClick={() => onChangeMode("blur")}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f59e0b] ${
              effectiveMode === "blur"
                ? "border-[#92400e] bg-[#1c1200] text-[#fbbf24]"
                : "border-[#2e2e2e] bg-[#1a1a1a] text-[#a3a3a3] hover:border-[#3d3d3d] hover:bg-[#242424] hover:text-[#f5f5f5]"
            }`}
          >
            <Layers size={14} strokeWidth={1.75} aria-hidden="true" />
            <span>Blur</span>
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                effectiveMode === "blur"
                  ? "border-[#92400e] bg-[#1c1200] text-[#f59e0b]"
                  : "border-[#2e2e2e] bg-[#242424] text-[#a3a3a3]"
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-2.5 py-1.5 text-xs font-medium text-[#a3a3a3] transition-all duration-150 hover:border-[#3d3d3d] hover:bg-[#242424] hover:text-[#f5f5f5] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
          >
            <PlusSquare size={14} strokeWidth={1.75} aria-hidden="true" />
            Add Box
          </button>

          {selectedRegion && (
            <button
              type="button"
              onClick={onDeleteSelected}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#7f1d1d] bg-[#1f0a0a] px-2.5 py-1.5 text-xs font-medium text-[#f87171] transition-all duration-150 hover:bg-[#2d0f0f] hover:text-[#fca5a5] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef4444]"
            >
              <Trash2 size={14} strokeWidth={1.75} aria-hidden="true" />
              Delete
            </button>
          )}

          <div className="mx-0.5 hidden h-5 w-px bg-[#2e2e2e] sm:block" aria-hidden="true" />

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo last edit"
            title="Undo (Ctrl/Cmd + Z)"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-2.5 py-1.5 text-xs font-medium text-[#a3a3a3] transition-all duration-150 hover:border-[#3d3d3d] hover:bg-[#242424] hover:text-[#f5f5f5] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-2.5 py-1.5 text-xs font-medium text-[#a3a3a3] transition-all duration-150 hover:border-[#3d3d3d] hover:bg-[#242424] hover:text-[#f5f5f5] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
          >
            <Redo2 size={14} strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">Redo</span>
          </button>

          <button
            type="button"
            onClick={onResetAll}
            disabled={regionCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-2.5 py-1.5 text-xs font-medium text-[#a3a3a3] transition-all duration-150 hover:border-[#3d3d3d] hover:bg-[#242424] hover:text-[#f5f5f5] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
          >
            <RotateCcw size={13} strokeWidth={1.75} aria-hidden="true" />
            Reset ({regionCount})
          </button>

          <div className="mx-0.5 hidden h-5 w-px bg-[#2e2e2e] sm:block" aria-hidden="true" />

          <div role="group" aria-label="Zoom controls" className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => stepZoom(-1)}
              aria-label="Zoom out"
              className="inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-xs font-medium text-[#666666] transition-all duration-150 hover:bg-[#1a1a1a] hover:text-[#a3a3a3] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
            >
              <ZoomOut size={14} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onChangeZoom("fit")}
              className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e] ${
                zoom === "fit"
                  ? "border border-[#2e2e2e] bg-[#1a1a1a] text-[#f5f5f5]"
                  : "text-[#a3a3a3] hover:bg-[#1a1a1a] hover:text-[#f5f5f5]"
              }`}
            >
              {zoom === "fit" ? "Fit" : `${Math.round(zoom * 100)}%`}
            </button>
            <button
              type="button"
              onClick={() => stepZoom(1)}
              aria-label="Zoom in"
              className="inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-xs font-medium text-[#666666] transition-all duration-150 hover:bg-[#1a1a1a] hover:text-[#a3a3a3] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
            >
              <ZoomIn size={14} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          <div className="mx-0.5 hidden h-5 w-px bg-[#2e2e2e] sm:block" aria-hidden="true" />

          <button
            type="button"
            onClick={onReplaceImage}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#666666] transition-all duration-150 hover:bg-[#1a1a1a] hover:text-[#a3a3a3] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
          >
            <RefreshCw size={13} strokeWidth={1.75} aria-hidden="true" />
            New Image
          </button>
        </div>
      </div>

      {/* Contextual sub-bar: Solid swatches or Blur intensity */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2e2e2e] pt-3 text-xs">
        {effectiveMode === "solid" ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[#666666]">
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
                  className={`h-6 w-6 rounded-md border transition-all duration-150 active:scale-[0.95] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e] ${
                    effectiveColor === swatch.hex
                      ? "border-[#22c55e] ring-2 ring-[#22c55e]/35"
                      : "border-[#3d3d3d] hover:border-[#a3a3a3]"
                  }`}
                />
              ))}
            </div>
            <span className="text-[#a3a3a3]">
              Recommended for passwords, account IDs, phone numbers, and text.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[#666666]">
              {selectedRegion ? "Selected blur:" : "Intensity:"}
            </span>
            <div className="flex items-center gap-1.5">
              {([1, 2, 3] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  aria-pressed={effectiveBlur === lvl}
                  onClick={() => onChangeBlurStrength(lvl)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[#f59e0b] ${
                    effectiveBlur === lvl
                      ? "border-[#92400e] bg-[#1c1200] text-[#fbbf24]"
                      : "border-[#2e2e2e] bg-[#1a1a1a] text-[#a3a3a3] hover:border-[#3d3d3d] hover:text-[#f5f5f5]"
                  }`}
                >
                  {lvl === 1 ? "Light" : lvl === 2 ? "Medium" : "Strong"}
                </button>
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 text-[#fbbf24]">
              <AlertTriangle size={13} strokeWidth={1.75} aria-hidden="true" />
              Blur reduces legibility visually — use Solid Cover for sensitive secrets.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
