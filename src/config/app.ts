import type { SupportedImageMime, RedactionMode } from "@/lib/image-engine/types";

export interface QualityPreset {
  id: "smaller" | "balanced" | "higher";
  label: string;
  quality: number;
  description: string;
}

export const APP_CONFIG = {
  name: "BlurBefore",
  exportSuffix: "-blurbefore",
  tagline: "Local-only image redaction, metadata cleaning, resize, and compression.",
  defaultRedactionMode: "solid" as RedactionMode,
  defaultSolidColor: "#09090b",
  defaultJpegBackground: "#ffffff",
  defaultBlurStrength: 2 as 1 | 2 | 3,
  defaultLossyQuality: 0.82,
  supportedInputMimes: ["image/jpeg", "image/png", "image/webp"] as readonly SupportedImageMime[],
  supportedExportMimes: ["image/jpeg", "image/png", "image/webp"] as readonly SupportedImageMime[],
  mimeToExtension: {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  } as Record<SupportedImageMime, string>,
  mimeToLabel: {
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WebP",
  } as Record<SupportedImageMime, string>,
  qualityPresets: [
    {
      id: "smaller",
      label: "Smaller file",
      quality: 0.65,
      description: "Stronger compression for smaller downloads.",
    },
    {
      id: "balanced",
      label: "Balanced",
      quality: 0.82,
      description: "Recommended balance of clarity and file size.",
    },
    {
      id: "higher",
      label: "Higher quality",
      quality: 0.92,
      description: "Preserves fine text and edges with larger file size.",
    },
  ] as readonly QualityPreset[],
} as const;

