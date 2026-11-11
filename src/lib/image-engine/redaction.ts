import { APP_CONFIG } from "@/config/app";
import { IMAGE_LIMITS, type ImageProcessingLimits } from "@/config/limits";
import { blurImageDataInPlace, computeAdaptiveBlurRadius } from "@/lib/image-engine/blur";
import { toOutwardPixelRect } from "@/lib/image-engine/coordinates";
import {
  ImageEngineError,
  type ImageDataLike,
  type RedactionRegion,
} from "@/lib/image-engine/types";

export interface RedactionRenderContext {
  fillStyle: string | CanvasGradient | CanvasPattern;
  globalAlpha: number;
  fillRect(x: number, y: number, w: number, h: number): void;
  getImageData(sx: number, sy: number, sw: number, sh: number): ImageDataLike;
  putImageData(imagedata: ImageDataLike, dx: number, dy: number): void;
}

/**
 * Paint all normalized redaction regions permanently into a 2D / OffscreenCanvas pixel surface.
 */
export function applyRedactionsToContext(
  ctx: RedactionRenderContext,
  canvasWidth: number,
  canvasHeight: number,
  regions: readonly RedactionRegion[],
  limits: ImageProcessingLimits = IMAGE_LIMITS,
): void {
  if (regions.length > limits.maxRedactionRegions) {
    throw new ImageEngineError(
      "TOO_MANY_REGIONS",
      `Too many redaction regions (${regions.length}). Maximum allowed per image is ${limits.maxRedactionRegions}.`,
    );
  }

  for (const region of regions) {
    const pixelRect = toOutwardPixelRect(region, canvasWidth, canvasHeight);
    if (pixelRect.width <= 0 || pixelRect.height <= 0) {
      continue;
    }

    if (region.mode === "solid") {
      ctx.globalAlpha = 1;
      ctx.fillStyle = region.color ?? APP_CONFIG.defaultSolidColor;
      ctx.fillRect(pixelRect.x, pixelRect.y, pixelRect.width, pixelRect.height);
      continue;
    }

    // Extract isolated region buffer, blur deterministically, and write pixels back
    const regionPixels = ctx.getImageData(
      pixelRect.x,
      pixelRect.y,
      pixelRect.width,
      pixelRect.height,
    );
    const radius = computeAdaptiveBlurRadius(
      canvasWidth,
      canvasHeight,
      region.blurStrength ?? APP_CONFIG.defaultBlurStrength,
    );
    blurImageDataInPlace(regionPixels, radius);
    ctx.putImageData(regionPixels, pixelRect.x, pixelRect.y);
  }
}

