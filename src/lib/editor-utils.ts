import { APP_CONFIG } from "@/config/app";
import { IMAGE_LIMITS } from "@/config/limits";
import { clampNormalizedRect, hasMinimumSourceSize } from "@/lib/image-engine";
import type { BlurStrength, RedactionMode, RedactionRegion } from "@/lib/image-engine";

export interface EditorHistoryState {
  past: RedactionRegion[][];
  present: RedactionRegion[];
  future: RedactionRegion[][];
}

export type HistoryAction =
  | { type: "COMMIT"; next: RedactionRegion[] }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET_ALL" }
  | { type: "CLEAR_HISTORY" };

const MAX_HISTORY_ENTRIES = 50;

export function createInitialHistory(): EditorHistoryState {
  return { past: [], present: [], future: [] };
}

export function historyReducer(
  state: EditorHistoryState,
  action: HistoryAction,
): EditorHistoryState {
  switch (action.type) {
    case "COMMIT": {
      const nextPast = [...state.past, state.present].slice(-MAX_HISTORY_ENTRIES);
      return {
        past: nextPast,
        present: action.next,
        future: [],
      };
    }
    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future].slice(0, MAX_HISTORY_ENTRIES),
      };
    }
    case "REDO": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY_ENTRIES),
        present: next,
        future: state.future.slice(1),
      };
    }
    case "RESET_ALL": {
      if (state.present.length === 0) return state;
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY_ENTRIES),
        present: [],
        future: [],
      };
    }
    case "CLEAR_HISTORY":
      return createInitialHistory();
    default:
      return state;
  }
}

export function createRegionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `reg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function buildCenteredRegion(
  sourceWidth: number,
  sourceHeight: number,
  mode: RedactionMode,
  color: string = APP_CONFIG.defaultSolidColor,
  blurStrength: BlurStrength = APP_CONFIG.defaultBlurStrength,
): RedactionRegion {
  const width = Math.max(0.18, Math.min(0.4, (IMAGE_LIMITS.minRedactionSourcePx * 12) / Math.max(1, sourceWidth)));
  const height = Math.max(0.1, Math.min(0.25, (IMAGE_LIMITS.minRedactionSourcePx * 8) / Math.max(1, sourceHeight)));
  const clamped = clampNormalizedRect({
    x: 0.5 - width / 2,
    y: 0.5 - height / 2,
    width,
    height,
  });

  return {
    id: createRegionId(),
    ...clamped,
    mode,
    color,
    blurStrength,
  };
}

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

/**
 * Resize a normalized region from one of the 8 handles while clamping inside [0..1]
 * and enforcing the minimum source pixel dimensions.
 */
export function resizeNormalizedRegion(
  origin: RedactionRegion,
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number,
  sourceWidth: number,
  sourceHeight: number,
): RedactionRegion {
  const minW = Math.min(1, IMAGE_LIMITS.minRedactionSourcePx / Math.max(1, sourceWidth));
  const minH = Math.min(1, IMAGE_LIMITS.minRedactionSourcePx / Math.max(1, sourceHeight));

  let left = origin.x;
  let top = origin.y;
  let right = origin.x + origin.width;
  let bottom = origin.y + origin.height;

  if (handle.includes("w")) {
    left = Math.min(right - minW, Math.max(0, origin.x + deltaX));
  }
  if (handle.includes("e")) {
    right = Math.max(left + minW, Math.min(1, origin.x + origin.width + deltaX));
  }
  if (handle.includes("n")) {
    top = Math.min(bottom - minH, Math.max(0, origin.y + deltaY));
  }
  if (handle.includes("s")) {
    bottom = Math.max(top + minH, Math.min(1, origin.y + origin.height + deltaY));
  }

  const next = clampNormalizedRect({
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  });

  if (!hasMinimumSourceSize(next, sourceWidth, sourceHeight)) {
    return origin;
  }

  return {
    ...origin,
    ...next,
  };
}

export function moveNormalizedRegion(
  origin: RedactionRegion,
  deltaX: number,
  deltaY: number,
): RedactionRegion {
  const x = Math.min(1 - origin.width, Math.max(0, origin.x + deltaX));
  const y = Math.min(1 - origin.height, Math.max(0, origin.y + deltaY));
  return { ...origin, x, y };
}

export const ZOOM_LEVELS = [0.1, 0.15, 0.25, 0.35, 0.5, 0.75, 1, 1.25, 1.5, 2, 3] as const;

/**
 * Compute the next zoom scale relative to the actual viewport fitScale when zoom is "fit".
 */
export function computeNextZoomLevel(
  currentZoom: "fit" | number,
  fitScale: number,
  direction: 1 | -1,
): number {
  const safeFit = Number.isFinite(fitScale) && fitScale > 0 ? fitScale : 1;
  const effective = currentZoom === "fit" ? safeFit : currentZoom;
  const epsilon = 0.015;

  if (direction === 1) {
    return ZOOM_LEVELS.find((level) => level > effective + epsilon) ?? ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
  }

  for (let i = ZOOM_LEVELS.length - 1; i >= 0; i -= 1) {
    if (ZOOM_LEVELS[i] < effective - epsilon) {
      return ZOOM_LEVELS[i];
    }
  }
  return ZOOM_LEVELS[0];
}

