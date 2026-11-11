import { describe, expect, it } from "vitest";
import { blurImageDataInPlace, computeAdaptiveBlurRadius } from "@/lib/image-engine";

function createStripeImageData(width: number, height: number) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const val = x < width / 2 ? 0 : 255;
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }
  return { width, height, data };
}

describe("blurImageDataInPlace", () => {
  it("smooths sharp edges deterministically across the buffer", () => {
    const img = createStripeImageData(40, 20);
    blurImageDataInPlace(img, 4);

    // Center boundary pixel (x = 19 / 20) should now be a blended mid-tone, not 0 or 255
    const midLeftIdx = (10 * 40 + 19) * 4;
    const midRightIdx = (10 * 40 + 20) * 4;
    expect(img.data[midLeftIdx]).toBeGreaterThan(20);
    expect(img.data[midLeftIdx]).toBeLessThan(200);
    expect(img.data[midRightIdx]).toBeGreaterThan(50);
    expect(img.data[midRightIdx]).toBeLessThan(235);
  });

  it("keeps uniform color buffers unchanged", () => {
    const width = 16;
    const height = 16;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 42;
      data[i + 1] = 128;
      data[i + 2] = 210;
      data[i + 3] = 255;
    }
    blurImageDataInPlace({ width, height, data }, 5);

    expect(data[0]).toBe(42);
    expect(data[1]).toBe(128);
    expect(data[2]).toBe(210);
    expect(data[3]).toBe(255);
  });

  it("handles transparent pixels via premultiplied alpha without dark RGB fringes", () => {
    const width = 10;
    const height = 1;
    const data = new Uint8ClampedArray(width * height * 4);
    // Left half opaque pure white; right half transparent black (0,0,0,0)
    for (let x = 0; x < 5; x += 1) {
      const i = x * 4;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
    blurImageDataInPlace({ width, height, data }, 2);

    // Semi-transparent pixels near boundary must stay white (RGB ~255), not turn grey
    const boundaryIdx = 5 * 4;
    expect(data[boundaryIdx + 3]).toBeGreaterThan(0);
    expect(data[boundaryIdx]).toBeGreaterThan(245);
    expect(data[boundaryIdx + 1]).toBeGreaterThan(245);
    expect(data[boundaryIdx + 2]).toBeGreaterThan(245);
  });

  it("scales adaptive blur radius reasonably with image dimensions and strength", () => {
    const small = computeAdaptiveBlurRadius(600, 400, 2);
    const large = computeAdaptiveBlurRadius(3000, 2000, 2);
    const strong = computeAdaptiveBlurRadius(3000, 2000, 3);

    expect(small).toBeGreaterThanOrEqual(8);
    expect(large).toBeGreaterThan(small);
    expect(strong).toBeGreaterThanOrEqual(large);
    expect(strong).toBeLessThanOrEqual(48);
  });
});

