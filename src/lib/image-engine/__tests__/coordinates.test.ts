import { describe, expect, it } from "vitest";
import {
  clampNormalizedRect,
  computeResizedDimensions,
  hasMinimumSourceSize,
  ImageEngineError,
  normalizePixelRect,
  toOutwardPixelRect,
} from "@/lib/image-engine";

describe("normalized coordinate helpers", () => {
  it("clamps coordinates strictly within [0..1]", () => {
    const clamped = clampNormalizedRect({ x: -0.2, y: 0.9, width: 0.5, height: 0.3 });
    expect(clamped.x).toBe(0);
    expect(clamped.y).toBe(0.9);
    expect(clamped.width).toBe(0.5);
    expect(clamped.height).toBeCloseTo(0.1, 10);
  });

  it("normalizes pixel rects against source dimensions", () => {
    expect(normalizePixelRect({ x: 500, y: 300, width: 600, height: 150 }, 2000, 1500)).toEqual({
      x: 0.25,
      y: 0.2,
      width: 0.3,
      height: 0.1,
    });
  });

  it("enforces minimum source pixel dimensions", () => {
    expect(hasMinimumSourceSize({ x: 0.1, y: 0.1, width: 0.001, height: 0.01 }, 1000, 1000, 4)).toBe(
      false,
    );
    expect(hasMinimumSourceSize({ x: 0.1, y: 0.1, width: 0.004, height: 0.004 }, 1000, 1000, 4)).toBe(
      true,
    );
  });

  it("rounds outward when projecting normalized coordinates to integer pixels", () => {
    // 0.1004 * 1000 = 100.4 -> floor 100; (0.1004 + 0.0501) * 1000 = 150.5 -> ceil 151 => width 51
    const projected = toOutwardPixelRect(
      { x: 0.1004, y: 0.2006, width: 0.0501, height: 0.0995 },
      1000,
      1000,
    );
    expect(projected).toEqual({
      x: 100,
      y: 200,
      width: 51,
      height: 101,
    });
  });
});

describe("computeResizedDimensions", () => {
  it("preserves aspect ratio by default when changing width or height", () => {
    expect(
      computeResizedDimensions(2000, 1000, { width: 1000, lockAspectRatio: true }),
    ).toEqual({ width: 1000, height: 500 });

    expect(
      computeResizedDimensions(2000, 1000, { height: 250, lockAspectRatio: true }),
    ).toEqual({ width: 500, height: 250 });
  });

  it("allows independent width and height when aspect ratio is unlocked", () => {
    expect(
      computeResizedDimensions(2000, 1000, { width: 800, height: 800, lockAspectRatio: false }),
    ).toEqual({ width: 800, height: 800 });
  });

  it("rejects dimensions exceeding max pixel count or max output dimension", () => {
    expect(() =>
      computeResizedDimensions(1000, 1000, { width: 9000, lockAspectRatio: false }),
    ).toThrowError(ImageEngineError);

    expect(() =>
      computeResizedDimensions(4000, 4000, { width: 5000, height: 5000, lockAspectRatio: false }),
    ).toThrowError(ImageEngineError);
  });
});
