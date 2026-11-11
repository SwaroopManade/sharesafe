"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { APP_CONFIG } from "@/config/app";
import { IMAGE_LIMITS } from "@/config/limits";
import {
  createRegionId,
  moveNormalizedRegion,
  resizeNormalizedRegion,
  type ResizeHandle,
} from "@/lib/editor-utils";
import {
  applyRedactionsToContext,
  clampNormalizedRect,
  hasMinimumSourceSize,
  normalizePixelRect,
  type BlurStrength,
  type DecodedImage,
  type RedactionMode,
  type RedactionRegion,
} from "@/lib/image-engine";

export type ZoomSetting = "fit" | number;

interface EditorCanvasProps {
  decodedImage: DecodedImage;
  regions: RedactionRegion[];
  selectedRegionId: string | null;
  activeMode: RedactionMode;
  activeColor: string;
  activeBlurStrength: BlurStrength;
  zoom: ZoomSetting;
  onSelectRegion: (id: string | null) => void;
  onCommitRegions: (next: RedactionRegion[], selectId?: string | null) => void;
  onTransientNotice: (msg: string | null) => void;
}

type InteractionState =
  | {
      kind: "draw";
      startNormX: number;
      startNormY: number;
      draft: RedactionRegion;
    }
  | {
      kind: "move";
      regionId: string;
      startNormX: number;
      startNormY: number;
      origin: RedactionRegion;
      draft: RedactionRegion;
    }
  | {
      kind: "resize";
      regionId: string;
      handle: ResizeHandle;
      startNormX: number;
      startNormY: number;
      origin: RedactionRegion;
      draft: RedactionRegion;
    };

const MAX_PREVIEW_LONG_EDGE = 1600;

const HANDLE_DEFINITIONS: { handle: ResizeHandle; positionClass: string; cursorClass: string; label: string }[] = [
  { handle: "nw", positionClass: "-left-3 -top-3", cursorClass: "cursor-nwse-resize", label: "Resize top-left" },
  { handle: "n", positionClass: "left-1/2 -top-3 -translate-x-1/2", cursorClass: "cursor-ns-resize", label: "Resize top" },
  { handle: "ne", positionClass: "-right-3 -top-3", cursorClass: "cursor-nesw-resize", label: "Resize top-right" },
  { handle: "e", positionClass: "-right-3 top-1/2 -translate-y-1/2", cursorClass: "cursor-ew-resize", label: "Resize right" },
  { handle: "se", positionClass: "-right-3 -bottom-3", cursorClass: "cursor-nwse-resize", label: "Resize bottom-right" },
  { handle: "s", positionClass: "left-1/2 -bottom-3 -translate-x-1/2", cursorClass: "cursor-ns-resize", label: "Resize bottom" },
  { handle: "sw", positionClass: "-left-3 -bottom-3", cursorClass: "cursor-nesw-resize", label: "Resize bottom-left" },
  { handle: "w", positionClass: "-left-3 top-1/2 -translate-y-1/2", cursorClass: "cursor-ew-resize", label: "Resize left" },
];

export function EditorCanvas({
  decodedImage,
  regions,
  selectedRegionId,
  activeMode,
  activeColor,
  activeBlurStrength,
  zoom,
  onSelectRegion,
  onCommitRegions,
  onTransientNotice,
}: EditorCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewSourceRef = useRef<HTMLCanvasElement | null>(null);

  const [viewportSize, setViewportSize] = useState({ width: 800, height: 520 });
  const [interaction, setInteraction] = useState<InteractionState | null>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const updateSize = () => {
      setViewportSize({
        width: Math.max(240, el.clientWidth - 24),
        height: Math.max(240, el.clientHeight - 24),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Build a capped preview offscreen canvas once per loaded image so blur previews stay snappy
  const previewDims = useMemo(() => {
    const { width, height } = decodedImage;
    const maxDim = Math.max(width, height);
    if (maxDim <= MAX_PREVIEW_LONG_EDGE) {
      return { width, height };
    }
    const ratio = MAX_PREVIEW_LONG_EDGE / maxDim;
    return {
      width: Math.max(1, Math.round(width * ratio)),
      height: Math.max(1, Math.round(height * ratio)),
    };
  }, [decodedImage]);

  useEffect(() => {
    const offscreen = document.createElement("canvas");
    offscreen.width = previewDims.width;
    offscreen.height = previewDims.height;
    const ctx = offscreen.getContext("2d");
    if (ctx) {
      ctx.drawImage(decodedImage.source, 0, 0, previewDims.width, previewDims.height);
    }
    previewSourceRef.current = offscreen;

    return () => {
      offscreen.width = 0;
      offscreen.height = 0;
      previewSourceRef.current = null;
    };
  }, [decodedImage, previewDims]);

  const fitScale = useMemo(() => {
    const scaleX = viewportSize.width / decodedImage.width;
    const scaleY = viewportSize.height / decodedImage.height;
    return Math.min(1, scaleX, scaleY);
  }, [viewportSize.width, viewportSize.height, decodedImage.width, decodedImage.height]);

  const effectiveScale = zoom === "fit" ? fitScale : zoom;
  const displayWidth = Math.max(1, Math.round(decodedImage.width * effectiveScale));
  const displayHeight = Math.max(1, Math.round(decodedImage.height * effectiveScale));

  // Regions currently shown on canvas (during active drag on a solid region we render live;
  // during drag on a blur region we keep the base canvas smooth and show a live frosted guide overlay)
  const effectiveRegions = useMemo(() => {
    if (!interaction) return regions;
    if (interaction.kind === "draw") {
      return interaction.draft.mode === "solid" ? [...regions, interaction.draft] : regions;
    }
    return regions.map((r) => {
      if (r.id !== interaction.regionId) return r;
      return interaction.draft.mode === "solid" ? interaction.draft : r;
    });
  }, [regions, interaction]);

  const overlayRegions = useMemo(() => {
    if (!interaction) return regions;
    if (interaction.kind === "draw") {
      return [...regions, interaction.draft];
    }
    return regions.map((r) => (r.id === interaction.regionId ? interaction.draft : r));
  }, [regions, interaction]);

  // Paint preview bitmap + committed redactions onto the visible canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const previewSource = previewSourceRef.current;
    if (!canvas || !previewSource) return;

    if (canvas.width !== previewDims.width || canvas.height !== previewDims.height) {
      canvas.width = previewDims.width;
      canvas.height = previewDims.height;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, previewDims.width, previewDims.height);
    ctx.drawImage(previewSource, 0, 0, previewDims.width, previewDims.height);

    // Exclude actively dragged blur box while mid-drag to keep 60fps pointer responsiveness
    const regionsToPaint =
      interaction && interaction.draft.mode === "blur" && interaction.kind !== "draw"
        ? effectiveRegions.filter((r) => r.id !== interaction.regionId)
        : effectiveRegions;

    applyRedactionsToContext(ctx, previewDims.width, previewDims.height, regionsToPaint);
  }, [previewDims, effectiveRegions, interaction]);

  const toNormalizedPoint = useCallback((clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const rect = stage.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(1, rect.width)));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / Math.max(1, rect.height)));
    return { x, y };
  }, []);

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (regions.length >= IMAGE_LIMITS.maxRedactionRegions) {
      onTransientNotice(
        `Maximum of ${IMAGE_LIMITS.maxRedactionRegions} redaction regions reached for this image.`,
      );
      return;
    }

    onTransientNotice(null);
    e.currentTarget.setPointerCapture(e.pointerId);
    const point = toNormalizedPoint(e.clientX, e.clientY);
    onSelectRegion(null);

    const draft: RedactionRegion = {
      id: createRegionId(),
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      mode: activeMode,
      color: activeColor,
      blurStrength: activeBlurStrength,
    };

    setInteraction({
      kind: "draw",
      startNormX: point.x,
      startNormY: point.y,
      draft,
    });
  };

  const handleRegionPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    region: RedactionRegion,
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onTransientNotice(null);
    onSelectRegion(region.id);
    stageRef.current?.setPointerCapture(e.pointerId);

    const point = toNormalizedPoint(e.clientX, e.clientY);
    setInteraction({
      kind: "move",
      regionId: region.id,
      startNormX: point.x,
      startNormY: point.y,
      origin: region,
      draft: region,
    });
  };

  const handleResizePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    region: RedactionRegion,
    handle: ResizeHandle,
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onTransientNotice(null);
    onSelectRegion(region.id);
    stageRef.current?.setPointerCapture(e.pointerId);

    const point = toNormalizedPoint(e.clientX, e.clientY);
    setInteraction({
      kind: "resize",
      regionId: region.id,
      handle,
      startNormX: point.x,
      startNormY: point.y,
      origin: region,
      draft: region,
    });
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interaction) return;
    const point = toNormalizedPoint(e.clientX, e.clientY);

    if (interaction.kind === "draw") {
      const left = Math.min(interaction.startNormX, point.x);
      const top = Math.min(interaction.startNormY, point.y);
      const width = Math.abs(point.x - interaction.startNormX);
      const height = Math.abs(point.y - interaction.startNormY);
      const clamped = clampNormalizedRect({ x: left, y: top, width, height });
      setInteraction({
        ...interaction,
        draft: { ...interaction.draft, ...clamped },
      });
      return;
    }

    const dx = point.x - interaction.startNormX;
    const dy = point.y - interaction.startNormY;

    if (interaction.kind === "move") {
      setInteraction({
        ...interaction,
        draft: moveNormalizedRegion(interaction.origin, dx, dy),
      });
      return;
    }

    if (interaction.kind === "resize") {
      setInteraction({
        ...interaction,
        draft: resizeNormalizedRegion(
          interaction.origin,
          interaction.handle,
          dx,
          dy,
          decodedImage.width,
          decodedImage.height,
        ),
      });
    }
  };

  const finishInteraction = () => {
    if (!interaction) return;
    const current = interaction;
    setInteraction(null);

    if (current.kind === "draw") {
      if (
        !hasMinimumSourceSize(
          current.draft,
          decodedImage.width,
          decodedImage.height,
          IMAGE_LIMITS.minRedactionSourcePx,
        )
      ) {
        // Ignore accidental tiny taps smaller than minimum source pixels
        const fallback = normalizePixelRect(
          { x: 0, y: 0, width: 0, height: 0 },
          decodedImage.width,
          decodedImage.height,
        );
        if (current.draft.width > fallback.width && current.draft.height > fallback.height) {
          onTransientNotice(
            `Selection was smaller than ${IMAGE_LIMITS.minRedactionSourcePx}×${IMAGE_LIMITS.minRedactionSourcePx} px and was ignored. Drag a larger rectangle or use "Add Box".`,
          );
        }
        return;
      }

      onCommitRegions([...regions, current.draft], current.draft.id);
      return;
    }

    const changed =
      current.draft.x !== current.origin.x ||
      current.draft.y !== current.origin.y ||
      current.draft.width !== current.origin.width ||
      current.draft.height !== current.origin.height;

    if (changed) {
      const next = regions.map((r) => (r.id === current.regionId ? current.draft : r));
      onCommitRegions(next, current.regionId);
    }
  };

  return (
    <div
      ref={viewportRef}
      className="relative flex h-[55vh] min-h-[340px] max-h-[72vh] w-full items-center justify-center overflow-auto rounded-2xl border border-zinc-800 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] bg-zinc-950 p-3"
    >
      <div
        ref={stageRef}
        role="application"
        aria-label="Image redaction canvas. Drag across the image to draw a redaction rectangle, or use the toolbar controls."
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={finishInteraction}
        onPointerCancel={finishInteraction}
        style={{ width: `${displayWidth}px`, height: `${displayHeight}px` }}
        className="relative shrink-0 touch-none select-none overflow-hidden rounded-sm shadow-2xl ring-1 ring-zinc-700/80 cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          style={{ width: `${displayWidth}px`, height: `${displayHeight}px` }}
          className="block h-full w-full"
        />

        {/* Interactive region selection and touch-friendly resize handles (not burned into export) */}
        {overlayRegions.map((region) => {
          const isSelected = region.id === selectedRegionId;
          const isBlurDraft =
            interaction !== null &&
            ((interaction.kind === "draw" && interaction.draft.id === region.id) ||
              (interaction.kind !== "draw" && interaction.regionId === region.id)) &&
            region.mode === "blur";

          return (
            <div
              key={region.id}
              onPointerDown={(e) => handleRegionPointerDown(e, region)}
              style={{
                left: `${region.x * 100}%`,
                top: `${region.y * 100}%`,
                width: `${region.width * 100}%`,
                height: `${region.height * 100}%`,
              }}
              className={`absolute box-border cursor-move transition-shadow ${
                isBlurDraft ? "backdrop-blur-md bg-white/10" : ""
              } ${
                isSelected
                  ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-zinc-950"
                  : "ring-1 ring-white/40 hover:ring-emerald-300/80"
              }`}
            >
              {isSelected && (
                <>
                  <span className="pointer-events-none absolute -top-6 left-0 inline-flex items-center gap-1 rounded bg-zinc-900/95 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-300 ring-1 ring-emerald-400/50">
                    {region.mode === "solid" ? "SOLID" : "BLUR"}
                  </span>

                  {HANDLE_DEFINITIONS.map((h) => (
                    <button
                      key={h.handle}
                      type="button"
                      aria-label={h.label}
                      onPointerDown={(e) => handleResizePointerDown(e, region, h.handle)}
                      className={`absolute z-10 flex h-6 w-6 items-center justify-center ${h.positionClass} ${h.cursorClass} focus-visible:outline-2 focus-visible:outline-emerald-400`}
                    >
                      <span className="h-2.5 w-2.5 rounded-xs border border-zinc-950 bg-emerald-400 shadow" />
                    </button>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

