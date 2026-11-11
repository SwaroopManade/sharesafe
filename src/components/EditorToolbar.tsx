"use client";

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
    <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3.5 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tool selector: Solid Cover vs Blur */}
        <div role="group" aria-label="Redaction tool" className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={effectiveMode === "solid"}
            onClick={() => onChangeMode("solid")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
              effectiveMode === "solid"
                ? "bg-emerald-500 text-zinc-950 shadow-sm"
                : "border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            }`}
          >
            <span aria-hidden="true" className="h-3.5 w-3.5 rounded-xs bg-current" />
            Solid Cover
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                effectiveMode === "solid"
                  ? "bg-zinc-950/15 text-zinc-950"
                  : "bg-emerald-500/15 text-emerald-300"
              }`}
            >
              Secure
            </span>
          </button>

          <button
            type="button"
            aria-pressed={effectiveMode === "blur"}
            onClick={() => onChangeMode("blur")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
              effectiveMode === "blur"
                ? "bg-amber-400 text-zinc-950 shadow-sm"
                : "border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            }`}
          >
            <span
              aria-hidden="true"
              className="h-3.5 w-3.5 rounded-xs border border-current bg-current/30 blur-[1px]"
            />
            Blur
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                effectiveMode === "blur"
                  ? "bg-zinc-950/15 text-zinc-950"
                  : "bg-zinc-700 text-zinc-300"
              }`}
            >
              Visual
            </span>
          </button>
        </div>

        {/* History, Zoom, and Image actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAddCenteredBox}
            disabled={regionCount >= maxRegions}
            title="Keyboard-accessible alternative: insert a centered redaction box"
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            + Add Box
          </button>

          {selectedRegion && (
            <button
              type="button"
              onClick={onDeleteSelected}
              className="rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/25 focus-visible:outline-2 focus-visible:outline-rose-400"
            >
              Delete Selected
            </button>
          )}

          <div className="mx-1 hidden h-5 w-px bg-zinc-800 sm:block" aria-hidden="true" />

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo last edit"
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo last edit"
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            Redo
          </button>
          <button
            type="button"
            onClick={onResetAll}
            disabled={regionCount === 0}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            Reset ({regionCount})
          </button>

          <div className="mx-1 hidden h-5 w-px bg-zinc-800 sm:block" aria-hidden="true" />

          <div role="group" aria-label="Zoom controls" className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => stepZoom(-1)}
              aria-label="Zoom out"
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => onChangeZoom("fit")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                zoom === "fit"
                  ? "bg-zinc-700 text-white"
                  : "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {zoom === "fit" ? "Fit" : `${Math.round(zoom * 100)}%`}
            </button>
            <button
              type="button"
              onClick={() => stepZoom(1)}
              aria-label="Zoom in"
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={onReplaceImage}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            New Image
          </button>
        </div>
      </div>

      {/* Contextual sub-bar: Color swatches or Blur strength + security caveat */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-3 text-xs">
        {effectiveMode === "solid" ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-zinc-400">
              {selectedRegion ? "Selected fill:" : "Solid fill color:"}
            </span>
            {SOLID_COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                aria-label={`Solid color ${swatch.label}`}
                aria-pressed={effectiveColor === swatch.hex}
                onClick={() => onChangeColor(swatch.hex)}
                style={{ backgroundColor: swatch.hex }}
                className={`h-6 w-6 rounded-md border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
                  effectiveColor === swatch.hex
                    ? "border-emerald-400 ring-2 ring-emerald-400/40"
                    : "border-zinc-600 hover:border-zinc-400"
                }`}
              />
            ))}
            <span className="ml-2 text-zinc-400">
              Recommended for passwords, IDs, phone numbers, and text.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-zinc-400">
              {selectedRegion ? "Selected blur:" : "Blur intensity:"}
            </span>
            {([1, 2, 3] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                aria-pressed={effectiveBlur === lvl}
                onClick={() => onChangeBlurStrength(lvl)}
                className={`rounded-md px-2.5 py-1 font-medium focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                  effectiveBlur === lvl
                    ? "bg-amber-400 text-zinc-950"
                    : "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {lvl === 1 ? "Light" : lvl === 2 ? "Medium" : "Strong"}
              </button>
            ))}
            <span className="ml-1 text-amber-300/90">
              Note: Blur reduces legibility but is not guaranteed irreversible for secrets—use Solid Cover for high-sensitivity data.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

