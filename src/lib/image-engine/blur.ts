import type { BlurStrength, ImageDataLike } from "@/lib/image-engine/types";

/**
 * Compute a scale-aware blur radius so large photos and compact screenshots receive consistent obfuscation.
 */
export function computeAdaptiveBlurRadius(
  targetWidth: number,
  targetHeight: number,
  strength: BlurStrength = 2,
): number {
  const maxDim = Math.max(targetWidth, targetHeight);
  const baseFactor = strength === 1 ? 0.008 : strength === 3 ? 0.024 : 0.015;
  const scaled = Math.round(maxDim * baseFactor);
  const minByStrength = strength === 1 ? 4 : strength === 3 ? 12 : 8;
  return Math.max(minByStrength, Math.min(48, scaled));
}

function boxBlurHorizontal(
  src: Float32Array,
  dst: Float32Array,
  width: number,
  height: number,
  radius: number,
): void {
  const kernelSize = radius * 2 + 1;

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width * 4;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let sumA = 0;

    // Initialize sliding window with clamped left-edge pixels
    for (let k = -radius; k <= radius; k += 1) {
      const x = Math.min(width - 1, Math.max(0, k));
      const idx = rowOffset + x * 4;
      sumR += src[idx];
      sumG += src[idx + 1];
      sumB += src[idx + 2];
      sumA += src[idx + 3];
    }

    for (let x = 0; x < width; x += 1) {
      const outIdx = rowOffset + x * 4;
      dst[outIdx] = sumR / kernelSize;
      dst[outIdx + 1] = sumG / kernelSize;
      dst[outIdx + 2] = sumB / kernelSize;
      dst[outIdx + 3] = sumA / kernelSize;

      const removeX = Math.max(0, x - radius);
      const addX = Math.min(width - 1, x + radius + 1);
      const removeIdx = rowOffset + removeX * 4;
      const addIdx = rowOffset + addX * 4;

      sumR += src[addIdx] - src[removeIdx];
      sumG += src[addIdx + 1] - src[removeIdx + 1];
      sumB += src[addIdx + 2] - src[removeIdx + 2];
      sumA += src[addIdx + 3] - src[removeIdx + 3];
    }
  }
}

function boxBlurVertical(
  src: Float32Array,
  dst: Float32Array,
  width: number,
  height: number,
  radius: number,
): void {
  const kernelSize = radius * 2 + 1;
  const rowStride = width * 4;

  for (let x = 0; x < width; x += 1) {
    const colOffset = x * 4;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let sumA = 0;

    for (let k = -radius; k <= radius; k += 1) {
      const y = Math.min(height - 1, Math.max(0, k));
      const idx = y * rowStride + colOffset;
      sumR += src[idx];
      sumG += src[idx + 1];
      sumB += src[idx + 2];
      sumA += src[idx + 3];
    }

    for (let y = 0; y < height; y += 1) {
      const outIdx = y * rowStride + colOffset;
      dst[outIdx] = sumR / kernelSize;
      dst[outIdx + 1] = sumG / kernelSize;
      dst[outIdx + 2] = sumB / kernelSize;
      dst[outIdx + 3] = sumA / kernelSize;

      const removeY = Math.max(0, y - radius);
      const addY = Math.min(height - 1, y + radius + 1);
      const removeIdx = removeY * rowStride + colOffset;
      const addIdx = addY * rowStride + colOffset;

      sumR += src[addIdx] - src[removeIdx];
      sumG += src[addIdx + 1] - src[removeIdx + 1];
      sumB += src[addIdx + 2] - src[removeIdx + 2];
      sumA += src[addIdx + 3] - src[removeIdx + 3];
    }
  }
}

/**
 * Deterministic 3-pass separable box blur approximating a Gaussian blur on an isolated ImageData buffer.
 * - Zero reliance on CanvasRenderingContext2D.filter (consistent across Chrome, Safari, Firefox, and Workers).
 * - Clamps sampling strictly within [0..width-1, 0..height-1] so outside pixels never bleed in.
 * - Uses premultiplied alpha so transparent PNG edges do not darken.
 */
export function blurImageDataInPlace(imageData: ImageDataLike, radius: number): void {
  const { width, height, data } = imageData;
  const r = Math.max(0, Math.round(radius));

  if (r === 0 || (width <= 1 && height <= 1) || data.length === 0) {
    return;
  }

  const len = width * height * 4;
  const bufA = new Float32Array(len);
  const bufB = new Float32Array(len);

  // Convert straight RGBA to premultiplied floating-point RGBA
  for (let i = 0; i < len; i += 4) {
    const a = data[i + 3] / 255;
    bufA[i] = data[i] * a;
    bufA[i + 1] = data[i + 1] * a;
    bufA[i + 2] = data[i + 2] * a;
    bufA[i + 3] = data[i + 3];
  }

  // 3 separable passes approximate a Gaussian kernel in O(W * H) regardless of radius
  for (let pass = 0; pass < 3; pass += 1) {
    boxBlurHorizontal(bufA, bufB, width, height, r);
    boxBlurVertical(bufB, bufA, width, height, r);
  }

  // Unpremultiply back to Uint8ClampedArray
  for (let i = 0; i < len; i += 4) {
    const alphaByte = bufA[i + 3];
    if (alphaByte <= 0.5) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    } else {
      const invAlpha = 255 / alphaByte;
      data[i] = Math.round(bufA[i] * invAlpha);
      data[i + 1] = Math.round(bufA[i + 1] * invAlpha);
      data[i + 2] = Math.round(bufA[i + 2] * invAlpha);
      data[i + 3] = Math.round(alphaByte);
    }
  }
}
