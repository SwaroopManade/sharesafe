import { IMAGE_LIMITS, type ImageProcessingLimits } from "@/config/limits";
import {
  ImageEngineError,
  type NormalizedRect,
  type PixelRect,
  type ResizeOptions,
} from "@/lib/image-engine/types";
import { validatePixelDimensions } from "@/lib/image-engine/validate";

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Clamp a normalized rectangle strictly inside [0..1] bounds.
 */
export function clampNormalizedRect(rect: NormalizedRect): NormalizedRect {
  const x = clamp01(rect.x);
  const y = clamp01(rect.y);
  const rawWidth = Number.isFinite(rect.width) ? Math.max(0, rect.width) : 0;
  const rawHeight = Number.isFinite(rect.height) ? Math.max(0, rect.height) : 0;

  return {
    x,
    y,
    width: Math.min(1 - x, rawWidth),
    height: Math.min(1 - y, rawHeight),
  };
}

/**
 * Convert source/canvas pixel coordinates into a clamped normalized [0..1] rectangle.
 */
export function normalizePixelRect(
  pixelRect: PixelRect,
  imageWidth: number,
  imageHeight: number,
): NormalizedRect {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  return clampNormalizedRect({
    x: pixelRect.x / imageWidth,
    y: pixelRect.y / imageHeight,
    width: pixelRect.width / imageWidth,
    height: pixelRect.height / imageHeight,
  });
}

/**
 * Verify whether a normalized rectangle covers at least `minSourcePx` in both axes on the source image.
 */
export function hasMinimumSourceSize(
  rect: NormalizedRect,
  sourceWidth: number,
  sourceHeight: number,
  minSourcePx: number = IMAGE_LIMITS.minRedactionSourcePx,
): boolean {
  const clamped = clampNormalizedRect(rect);
  const pxW = clamped.width * sourceWidth;
  const pxH = clamped.height * sourceHeight;
  return pxW >= minSourcePx && pxH >= minSourcePx;
}

/**
 * Project a normalized rectangle onto target integer pixel coordinates using outward rounding
 * (floor for top/left, ceil for bottom/right) so rounding never shrinks a redaction and leaks an edge row.
 */
export function toOutwardPixelRect(
  rect: NormalizedRect,
  targetWidth: number,
  targetHeight: number,
): PixelRect {
  if (targetWidth <= 0 || targetHeight <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const clamped = clampNormalizedRect(rect);
  if (clamped.width <= 0 || clamped.height <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const left = Math.max(0, Math.floor(clamped.x * targetWidth));
  const top = Math.max(0, Math.floor(clamped.y * targetHeight));
  const right = Math.min(targetWidth, Math.ceil((clamped.x + clamped.width) * targetWidth));
  const bottom = Math.min(targetHeight, Math.ceil((clamped.y + clamped.height) * targetHeight));

  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

/**
 * Compute valid integer output dimensions while honoring aspect ratio lock and memory caps.
 */
export function computeResizedDimensions(
  sourceWidth: number,
  sourceHeight: number,
  options: ResizeOptions,
  limits: ImageProcessingLimits = IMAGE_LIMITS,
): { width: number; height: number } {
  validatePixelDimensions(sourceWidth, sourceHeight, limits);

  const aspect = sourceWidth / sourceHeight;
  const hasWidth = typeof options.width === "number" && Number.isFinite(options.width) && options.width > 0;
  const hasHeight = typeof options.height === "number" && Number.isFinite(options.height) && options.height > 0;

  let targetWidth = sourceWidth;
  let targetHeight = sourceHeight;

  if (options.lockAspectRatio) {
    if (hasWidth && !hasHeight) {
      targetWidth = Math.round(options.width!);
      targetHeight = Math.max(1, Math.round(targetWidth / aspect));
    } else if (!hasWidth && hasHeight) {
      targetHeight = Math.round(options.height!);
      targetWidth = Math.max(1, Math.round(targetHeight * aspect));
    } else if (hasWidth && hasHeight) {
      // Fit within both requested bounds when aspect ratio is locked
      targetWidth = Math.round(options.width!);
      targetHeight = Math.max(1, Math.round(targetWidth / aspect));
    }
  } else {
    if (hasWidth) targetWidth = Math.round(options.width!);
    if (hasHeight) targetHeight = Math.round(options.height!);
  }

  if (
    targetWidth < limits.minOutputDimension ||
    targetHeight < limits.minOutputDimension ||
    targetWidth > limits.maxOutputDimension ||
    targetHeight > limits.maxOutputDimension
  ) {
    throw new ImageEngineError(
      "INVALID_DIMENSIONS",
      `Output dimensions must be between ${limits.minOutputDimension} and ${limits.maxOutputDimension} pixels.`,
    );
  }

  validatePixelDimensions(targetWidth, targetHeight, limits);

  return { width: targetWidth, height: targetHeight };
}

