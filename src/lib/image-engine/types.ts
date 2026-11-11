export type SupportedImageMime = "image/jpeg" | "image/png" | "image/webp";

export type RedactionMode = "solid" | "blur";

export type BlurStrength = 1 | 2 | 3;

/**
 * Coordinates normalized to [0..1] against the EXIF-oriented decoded image dimensions.
 */
export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RedactionRegion extends NormalizedRect {
  id: string;
  mode: RedactionMode;
  color?: string;
  blurStrength?: BlurStrength;
}

export interface ImageDataLike {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

export interface ResizeOptions {
  width?: number;
  height?: number;
  lockAspectRatio: boolean;
}

export interface ExportOptions {
  outputMime: SupportedImageMime;
  quality: number; // [0..1] for JPEG/WebP; ignored for PNG
  resize: ResizeOptions;
  jpegBackground?: string;
}

export interface ExportResult {
  blob: Blob;
  mimeType: SupportedImageMime;
  width: number;
  height: number;
  byteSize: number;
  filename: string;
  alphaFlattenedToBackground: boolean;
}

export interface FileValidationResult {
  mimeType: SupportedImageMime;
  byteSize: number;
  originalName: string;
}

export type ImageEngineErrorCode =
  | "FILE_EMPTY"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FORMAT"
  | "ANIMATED_IMAGE_UNSUPPORTED"
  | "DIMENSIONS_TOO_LARGE"
  | "INVALID_DIMENSIONS"
  | "DECODE_FAILED"
  | "TOO_MANY_REGIONS"
  | "FORMAT_NOT_SUPPORTED_FOR_EXPORT"
  | "EXPORT_FAILED";

/**
 * Typed error raised by the client-side image-processing engine with user-friendly messages.
 */
export class ImageEngineError extends Error {
  readonly code: ImageEngineErrorCode;

  constructor(code: ImageEngineErrorCode, message: string) {
    super(message);
    this.name = "ImageEngineError";
    this.code = code;
  }
}

