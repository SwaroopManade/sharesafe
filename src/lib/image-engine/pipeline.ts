import { APP_CONFIG } from "@/config/app";
import { IMAGE_LIMITS, type ImageProcessingLimits } from "@/config/limits";
import { computeResizedDimensions } from "@/lib/image-engine/coordinates";
import { applyRedactionsToContext, type RedactionRenderContext } from "@/lib/image-engine/redaction";
import {
  ImageEngineError,
  type DecodedImage,
  type ExportOptions,
  type ExportResult,
  type RedactionRegion,
  type SupportedImageMime,
} from "@/lib/image-engine/types";
import { buildExportFilename, validatePixelDimensions } from "@/lib/image-engine/validate";

export interface SurfaceContext extends RedactionRenderContext {
  drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void;
}

export interface RenderSurface {
  width: number;
  height: number;
  getContext2D(): SurfaceContext;
  encodeToBlob(mimeType: SupportedImageMime, quality?: number): Promise<Blob>;
  release(): void;
}

export type SurfaceFactory = (width: number, height: number) => RenderSurface;

function clampQuality(quality: number): number {
  if (!Number.isFinite(quality)) return APP_CONFIG.defaultLossyQuality;
  return Math.min(1, Math.max(0.1, quality));
}

export function createOffscreenSurface(width: number, height: number): RenderSurface {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new ImageEngineError("EXPORT_FAILED", "Could not initialize OffscreenCanvas 2D context.");
  }

  return {
    width,
    height,
    getContext2D: () => ctx as unknown as SurfaceContext,
    encodeToBlob: async (mimeType, quality) => {
      const options: ImageEncodeOptions =
        mimeType === "image/png" ? { type: mimeType } : { type: mimeType, quality: clampQuality(quality ?? APP_CONFIG.defaultLossyQuality) };
      return canvas.convertToBlob(options);
    },
    release: () => {
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}

export function createHtmlCanvasSurface(width: number, height: number): RenderSurface {
  if (typeof document === "undefined") {
    throw new ImageEngineError("EXPORT_FAILED", "HTMLCanvasElement is unavailable outside a browser document.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new ImageEngineError("EXPORT_FAILED", "Could not initialize HTML Canvas 2D context.");
  }

  return {
    width,
    height,
    getContext2D: () => ctx as unknown as SurfaceContext,
    encodeToBlob: (mimeType, quality) =>
      new Promise<Blob>((resolve, reject) => {
        const lossyQuality = mimeType === "image/png" ? undefined : clampQuality(quality ?? APP_CONFIG.defaultLossyQuality);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new ImageEngineError("EXPORT_FAILED", "Browser failed to encode the exported image."));
              return;
            }
            resolve(blob);
          },
          mimeType,
          lossyQuality,
        );
      }),
    release: () => {
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}

export function createDefaultSurface(width: number, height: number): RenderSurface {
  if (typeof OffscreenCanvas !== "undefined") {
    return createOffscreenSurface(width, height);
  }
  return createHtmlCanvasSurface(width, height);
}

/**
 * Decode an image Blob with EXIF orientation applied and validate total megapixel limits.
 */
export async function decodeSourceImage(
  blob: Blob,
  limits: ImageProcessingLimits = IMAGE_LIMITS,
): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
      try {
        validatePixelDimensions(bitmap.width, bitmap.height, limits);
      } catch (err) {
        bitmap.close();
        throw err;
      }

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => {
          bitmap.close();
        },
      };
    } catch (err) {
      if (err instanceof ImageEngineError) {
        throw err;
      }
      // Fall through to HTMLImageElement decoding if createImageBitmap fails on a specific environment
    }
  }

  if (typeof Image === "undefined" || typeof URL === "undefined") {
    throw new ImageEngineError("DECODE_FAILED", "Image decoding APIs are unavailable in this environment.");
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = objectUrl;
    await img.decode();
    validatePixelDimensions(img.naturalWidth, img.naturalHeight, limits);

    let released = false;
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => {
        if (!released) {
          released = true;
          URL.revokeObjectURL(objectUrl);
          img.src = "";
        }
      },
    };
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    if (err instanceof ImageEngineError) {
      throw err;
    }
    throw new ImageEngineError(
      "DECODE_FAILED",
      "This image could not be decoded. It may be corrupted or unsupported by your browser.",
    );
  }
}

export interface RenderAndExportParams {
  source: CanvasImageSource;
  sourceWidth: number;
  sourceHeight: number;
  originalFilename?: string;
  regions: readonly RedactionRegion[];
  exportOptions: ExportOptions;
  limits?: ImageProcessingLimits;
  createSurface?: SurfaceFactory;
}

/**
 * Render source image + permanent flattened redactions onto a clean raster surface and re-encode.
 * Re-encoding removes common embedded EXIF/GPS metadata for supported formats.
 */
export async function renderAndExportImage({
  source,
  sourceWidth,
  sourceHeight,
  originalFilename,
  regions,
  exportOptions,
  limits = IMAGE_LIMITS,
  createSurface = createDefaultSurface,
}: RenderAndExportParams): Promise<ExportResult> {
  const { width: targetWidth, height: targetHeight } = computeResizedDimensions(
    sourceWidth,
    sourceHeight,
    exportOptions.resize,
    limits,
  );

  const surface = createSurface(targetWidth, targetHeight);
  const alphaFlattenedToBackground = exportOptions.outputMime === "image/jpeg";

  try {
    const ctx = surface.getContext2D();

    if (alphaFlattenedToBackground) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = exportOptions.jpegBackground ?? APP_CONFIG.defaultJpegBackground;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.globalAlpha = 1;
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

    applyRedactionsToContext(ctx, targetWidth, targetHeight, regions, limits);

    const encodeQuality =
      exportOptions.outputMime === "image/png" ? undefined : clampQuality(exportOptions.quality);
    const blob = await surface.encodeToBlob(exportOptions.outputMime, encodeQuality);

    // Some browsers silently fall back to PNG if WebP export is unsupported
    if (blob.type && blob.type !== exportOptions.outputMime) {
      throw new ImageEngineError(
        "FORMAT_NOT_SUPPORTED_FOR_EXPORT",
        `Your browser does not support exporting ${APP_CONFIG.mimeToLabel[exportOptions.outputMime]} images (returned ${blob.type}). Please choose JPEG or PNG instead.`,
      );
    }

    return {
      blob,
      mimeType: exportOptions.outputMime,
      width: targetWidth,
      height: targetHeight,
      byteSize: blob.size,
      filename: buildExportFilename(originalFilename, exportOptions.outputMime),
      alphaFlattenedToBackground,
    };
  } catch (err) {
    if (err instanceof ImageEngineError) {
      throw err;
    }
    throw new ImageEngineError(
      "EXPORT_FAILED",
      "Export failed, possibly due to browser memory limits. Try exporting at smaller dimensions.",
    );
  } finally {
    surface.release();
  }
}
