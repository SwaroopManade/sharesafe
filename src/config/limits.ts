export interface ImageProcessingLimits {
  maxFileSizeBytes: number;
  maxDecodedPixels: number;
  maxOutputDimension: number;
  minOutputDimension: number;
  maxRedactionRegions: number;
  minRedactionSourcePx: number;
}

export const IMAGE_LIMITS: ImageProcessingLimits = {
  maxFileSizeBytes: 20 * 1024 * 1024, // 20 MB
  maxDecodedPixels: 16_000_000, // 16 megapixels
  maxOutputDimension: 8192,
  minOutputDimension: 1,
  maxRedactionRegions: 100,
  minRedactionSourcePx: 4,
};

