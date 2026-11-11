import { APP_CONFIG } from "@/config/app";
import { IMAGE_LIMITS, type ImageProcessingLimits } from "@/config/limits";
import {
  ImageEngineError,
  type FileValidationResult,
  type SupportedImageMime,
} from "@/lib/image-engine/types";

interface SniffedFormat {
  mime: SupportedImageMime | "image/gif" | "image/tiff" | "image/heic" | "image/svg+xml" | null;
  animatedWebp?: boolean;
}

function matchesAscii(bytes: Uint8Array, offset: number, text: string): boolean {
  if (bytes.length < offset + text.length) return false;
  for (let i = 0; i < text.length; i += 1) {
    if (bytes[offset + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

/**
 * Sniff image container format directly from file header bytes so renamed files are caught.
 */
export function sniffImageBytes(bytes: Uint8Array): SniffedFormat {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: "image/png" };
  }

  // WebP: RIFF....WEBP (+ VP8X animation flag bit 0x02 at byte 20)
  if (bytes.length >= 12 && matchesAscii(bytes, 0, "RIFF") && matchesAscii(bytes, 8, "WEBP")) {
    let animatedWebp = false;
    if (bytes.length >= 21 && matchesAscii(bytes, 12, "VP8X")) {
      const flags = bytes[20];
      animatedWebp = (flags & 0x02) !== 0;
    }
    return { mime: "image/webp", animatedWebp };
  }

  // GIF: GIF87a / GIF89a
  if (matchesAscii(bytes, 0, "GIF87a") || matchesAscii(bytes, 0, "GIF89a")) {
    return { mime: "image/gif" };
  }

  // TIFF: II*\0 or MM\0*
  if (
    bytes.length >= 4 &&
    ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
      (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a))
  ) {
    return { mime: "image/tiff" };
  }

  // ISO BMFF / HEIC / HEIF: ....ftyp(heic|heix|hevc|mif1|msf1)
  if (bytes.length >= 12 && matchesAscii(bytes, 4, "ftyp")) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
    if (brand === "heic" || brand === "heix" || brand === "hevc" || brand === "mif1" || brand === "msf1") {
      return { mime: "image/heic" };
    }
  }

  // SVG heuristic (leading whitespace / BOM / <?xml / <svg)
  const headText = new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.subarray(0, Math.min(bytes.length, 64)))
    .trimStart()
    .toLowerCase();
  if (headText.startsWith("<svg") || (headText.startsWith("<?xml") && headText.includes("<svg"))) {
    return { mime: "image/svg+xml" };
  }

  return { mime: null };
}

/**
 * Validate file size and magic bytes before decoding the image into pixel memory.
 */
export async function validateImageFile(
  file: Blob,
  limits: ImageProcessingLimits = IMAGE_LIMITS,
): Promise<FileValidationResult> {
  if (file.size <= 0) {
    throw new ImageEngineError("FILE_EMPTY", "The selected file is empty. Please choose a valid JPEG, PNG, or WebP image.");
  }

  if (file.size > limits.maxFileSizeBytes) {
    const maxMb = Math.round((limits.maxFileSizeBytes / (1024 * 1024)) * 10) / 10;
    const actualMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new ImageEngineError(
      "FILE_TOO_LARGE",
      `This file is ${actualMb} MB, which exceeds the ${maxMb} MB limit. Please choose a smaller image.`,
    );
  }

  const headerSlice = file.slice(0, 64);
  const headerBuffer = await headerSlice.arrayBuffer();
  const headerBytes = new Uint8Array(headerBuffer);
  const sniffed = sniffImageBytes(headerBytes);

  if (sniffed.animatedWebp) {
    throw new ImageEngineError(
      "ANIMATED_IMAGE_UNSUPPORTED",
      "Animated WebP images are not supported because flattening would discard frames. Supported formats: JPEG, PNG, and static WebP.",
    );
  }

  if (sniffed.mime === "image/gif") {
    throw new ImageEngineError(
      "ANIMATED_IMAGE_UNSUPPORTED",
      "GIF images are not supported in this version. Please use JPEG, PNG, or static WebP.",
    );
  }

  if (sniffed.mime === "image/heic" || sniffed.mime === "image/tiff" || sniffed.mime === "image/svg+xml") {
    throw new ImageEngineError(
      "UNSUPPORTED_FORMAT",
      "HEIC, TIFF, and SVG files are not supported. Please convert or export to JPEG, PNG, or WebP first.",
    );
  }

  if (sniffed.mime !== "image/jpeg" && sniffed.mime !== "image/png" && sniffed.mime !== "image/webp") {
    throw new ImageEngineError(
      "UNSUPPORTED_FORMAT",
      "Unsupported or corrupted file format. Please choose a JPEG, PNG, or WebP image.",
    );
  }

  const originalName = "name" in file && typeof file.name === "string" && file.name.trim() ? file.name : "image";

  return {
    mimeType: sniffed.mime,
    byteSize: file.size,
    originalName,
  };
}

/**
 * Validate decoded or target dimensions against total megapixel and dimension caps.
 */
export function validatePixelDimensions(
  width: number,
  height: number,
  limits: ImageProcessingLimits = IMAGE_LIMITS,
): void {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < limits.minOutputDimension || height < limits.minOutputDimension) {
    throw new ImageEngineError("INVALID_DIMENSIONS", "Image width and height must be valid positive numbers.");
  }

  const roundedW = Math.round(width);
  const roundedH = Math.round(height);
  const totalPixels = roundedW * roundedH;

  if (totalPixels > limits.maxDecodedPixels) {
    const maxMp = Math.round((limits.maxDecodedPixels / 1_000_000) * 10) / 10;
    const actualMp = (totalPixels / 1_000_000).toFixed(1);
    throw new ImageEngineError(
      "DIMENSIONS_TOO_LARGE",
      `This image has ${roundedW}×${roundedH} pixels (${actualMp} MP), exceeding the ${maxMp} MP limit.`,
    );
  }
}

/**
 * Produce a safe download filename with the configured product suffix and output extension.
 */
export function buildExportFilename(
  originalName: string | undefined,
  outputMime: SupportedImageMime,
  suffix: string = APP_CONFIG.exportSuffix,
): string {
  const ext = APP_CONFIG.mimeToExtension[outputMime];
  const rawName = (originalName ?? "").split(/[/\\]/).pop() ?? "";
  const withoutExt = rawName.replace(/\.[^.]+$/, "");
  const cleanedBase = withoutExt
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  const base = cleanedBase.length > 0 && !/^\.+$/.test(cleanedBase) ? cleanedBase : "image";
  const normalizedBase = base.endsWith(suffix) ? base : `${base}${suffix}`;
  return `${normalizedBase}.${ext}`;
}

