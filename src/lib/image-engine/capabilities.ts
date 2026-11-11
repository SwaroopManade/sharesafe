import type { SupportedImageMime } from "@/lib/image-engine/types";

export interface BrowserCapabilities {
  supportsOffscreenCanvas: boolean;
  supportsWebWorkers: boolean;
  supportedExportMimes: SupportedImageMime[];
}

/**
 * Probe whether the current browser actually encodes WebP (avoiding silent PNG fallbacks).
 */
export async function probeWebpExportSupport(): Promise<boolean> {
  try {
    if (typeof OffscreenCanvas !== "undefined") {
      const canvas = new OffscreenCanvas(1, 1);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillRect(0, 0, 1, 1);
        const blob = await canvas.convertToBlob({ type: "image/webp", quality: 0.8 });
        canvas.width = 0;
        canvas.height = 0;
        return blob.type === "image/webp";
      }
    }

    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const dataUrl = canvas.toDataURL("image/webp");
      canvas.width = 0;
      canvas.height = 0;
      return dataUrl.startsWith("data:image/webp");
    }
  } catch {
    return false;
  }

  return false;
}

export async function detectBrowserCapabilities(): Promise<BrowserCapabilities> {
  const supportsOffscreenCanvas = typeof OffscreenCanvas !== "undefined";
  const supportsWebWorkers = typeof Worker !== "undefined";
  const webpSupported = await probeWebpExportSupport();

  const supportedExportMimes: SupportedImageMime[] = ["image/jpeg", "image/png"];
  if (webpSupported) {
    supportedExportMimes.push("image/webp");
  }

  return {
    supportsOffscreenCanvas,
    supportsWebWorkers,
    supportedExportMimes,
  };
}

