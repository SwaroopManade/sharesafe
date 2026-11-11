import { describe, expect, it } from "vitest";
import { IMAGE_LIMITS } from "@/config/limits";
import {
  applyRedactionsToContext,
  ImageEngineError,
  renderAndExportImage,
  type ImageDataLike,
  type RedactionRegion,
  type RenderSurface,
  type SurfaceContext,
} from "@/lib/image-engine";

function createMemorySurface(
  width: number,
  height: number,
  options?: {
    returnedMime?: string;
    onEncode?: (mime: string, quality: number | undefined, pixels: Uint8ClampedArray) => void;
    onRelease?: () => void;
  },
): { surface: RenderSurface; pixels: Uint8ClampedArray } {
  const pixels = new Uint8ClampedArray(width * height * 4);
  let currentFill = "#000000";

  const parseHex = (hex: string): [number, number, number] => {
    const clean = hex.replace("#", "");
    return [
      parseInt(clean.slice(0, 2), 16) || 0,
      parseInt(clean.slice(2, 4), 16) || 0,
      parseInt(clean.slice(4, 6), 16) || 0,
    ];
  };

  const ctx: SurfaceContext = {
    fillStyle: "#000000",
    globalAlpha: 1,
    drawImage: (_img, dx, dy, dw, dh) => {
      // Simulate drawing a bright red + transparent test pattern into target bounds
      for (let y = dy; y < dy + dh; y += 1) {
        for (let x = dx; x < dx + dw; x += 1) {
          if (x < 0 || y < 0 || x >= width || y >= height) continue;
          const idx = (y * width + x) * 4;
          // Left half opaque crimson, right half untouched (keeps background or transparent)
          if (x < width / 2) {
            pixels[idx] = 220;
            pixels[idx + 1] = 20;
            pixels[idx + 2] = 60;
            pixels[idx + 3] = 255;
          }
        }
      }
    },
    fillRect: (rx, ry, rw, rh) => {
      currentFill = typeof ctx.fillStyle === "string" ? ctx.fillStyle : "#000000";
      const [r, g, b] = parseHex(currentFill);
      for (let y = ry; y < ry + rh; y += 1) {
        for (let x = rx; x < rx + rw; x += 1) {
          if (x < 0 || y < 0 || x >= width || y >= height) continue;
          const idx = (y * width + x) * 4;
          pixels[idx] = r;
          pixels[idx + 1] = g;
          pixels[idx + 2] = b;
          pixels[idx + 3] = 255;
        }
      }
    },
    getImageData: (sx, sy, sw, sh): ImageDataLike => {
      const out = new Uint8ClampedArray(sw * sh * 4);
      for (let row = 0; row < sh; row += 1) {
        for (let col = 0; col < sw; col += 1) {
          const srcIdx = ((sy + row) * width + (sx + col)) * 4;
          const dstIdx = (row * sw + col) * 4;
          out[dstIdx] = pixels[srcIdx];
          out[dstIdx + 1] = pixels[srcIdx + 1];
          out[dstIdx + 2] = pixels[srcIdx + 2];
          out[dstIdx + 3] = pixels[srcIdx + 3];
        }
      }
      return { width: sw, height: sh, data: out };
    },
    putImageData: (imageData, dx, dy) => {
      for (let row = 0; row < imageData.height; row += 1) {
        for (let col = 0; col < imageData.width; col += 1) {
          const srcIdx = (row * imageData.width + col) * 4;
          const dstIdx = ((dy + row) * width + (dx + col)) * 4;
          pixels[dstIdx] = imageData.data[srcIdx];
          pixels[dstIdx + 1] = imageData.data[srcIdx + 1];
          pixels[dstIdx + 2] = imageData.data[srcIdx + 2];
          pixels[dstIdx + 3] = imageData.data[srcIdx + 3];
        }
      }
    },
  };

  const surface: RenderSurface = {
    width,
    height,
    getContext2D: () => ctx,
    encodeToBlob: async (mime, quality) => {
      options?.onEncode?.(mime, quality, new Uint8ClampedArray(pixels));
      const actualMime = options?.returnedMime ?? mime;
      return new Blob([pixels], { type: actualMime });
    },
    release: () => {
      options?.onRelease?.();
    },
  };

  return { surface, pixels };
}

describe("applyRedactionsToContext & renderAndExportImage", () => {
  it("permanently overwrites solid and blurred pixels while leaving outside pixels intact", async () => {
    let encodedPixels: Uint8ClampedArray | null = null;
    let released = false;

    const regions: RedactionRegion[] = [
      { id: "r1", x: 0.1, y: 0.1, width: 0.2, height: 0.2, mode: "solid", color: "#112233" },
      { id: "r2", x: 0.4, y: 0.4, width: 0.2, height: 0.2, mode: "blur", blurStrength: 2 },
    ];

    const result = await renderAndExportImage({
      source: {} as CanvasImageSource,
      sourceWidth: 100,
      sourceHeight: 100,
      originalFilename: "secret-doc.png",
      regions,
      exportOptions: {
        outputMime: "image/png",
        quality: 0.85,
        resize: { lockAspectRatio: true },
      },
      createSurface: (w, h) =>
        createMemorySurface(w, h, {
          onEncode: (_mime, quality, snap) => {
            expect(quality).toBeUndefined();
            encodedPixels = snap;
          },
          onRelease: () => {
            released = true;
          },
        }).surface,
    });

    expect(released).toBe(true);
    expect(result.filename).toBe("secret-doc-blurbefore.png");
    expect(result.alphaFlattenedToBackground).toBe(false);
    expect(encodedPixels).not.toBeNull();

    // Pixel inside solid redaction (15, 15) must be solid #112233
    const solidIdx = (15 * 100 + 15) * 4;
    expect(encodedPixels![solidIdx]).toBe(0x11);
    expect(encodedPixels![solidIdx + 1]).toBe(0x22);
    expect(encodedPixels![solidIdx + 2]).toBe(0x33);
    expect(encodedPixels![solidIdx + 3]).toBe(255);

    // Pixel outside all redactions on the left side (5, 5) keeps original crimson (220,20,60,255)
    const outsideIdx = (5 * 100 + 5) * 4;
    expect(encodedPixels![outsideIdx]).toBe(220);
    expect(encodedPixels![outsideIdx + 1]).toBe(20);
    expect(encodedPixels![outsideIdx + 2]).toBe(60);

    // Pixel inside blur region across center seam (45, 50) gets blended alpha < 255
    const blurredSeamIdx = (50 * 100 + 45) * 4;
    expect(encodedPixels![blurredSeamIdx + 3]).toBeLessThan(255);
  });

  it("flattens transparent regions onto white background when exporting to JPEG", async () => {
    let encodedPixels: Uint8ClampedArray | null = null;
    const result = await renderAndExportImage({
      source: {} as CanvasImageSource,
      sourceWidth: 40,
      sourceHeight: 40,
      originalFilename: "transparent.png",
      regions: [],
      exportOptions: {
        outputMime: "image/jpeg",
        quality: 0.82,
        resize: { lockAspectRatio: true },
      },
      createSurface: (w, h) =>
        createMemorySurface(w, h, {
          onEncode: (mime, quality, snap) => {
            expect(mime).toBe("image/jpeg");
            expect(quality).toBe(0.82);
            encodedPixels = snap;
          },
        }).surface,
    });

    expect(result.alphaFlattenedToBackground).toBe(true);
    expect(result.filename).toBe("transparent-blurbefore.jpg");

    // Right-half pixel (x=30, y=10) had no drawn image pixels, so it must be opaque white (#FFFFFF)
    const rightHalfIdx = (10 * 40 + 30) * 4;
    expect(encodedPixels![rightHalfIdx]).toBe(255);
    expect(encodedPixels![rightHalfIdx + 1]).toBe(255);
    expect(encodedPixels![rightHalfIdx + 2]).toBe(255);
    expect(encodedPixels![rightHalfIdx + 3]).toBe(255);
  });

  it("rejects silent browser fallback mime mismatches (e.g. WebP falling back to PNG)", async () => {
    let released = false;

    await expect(
      renderAndExportImage({
        source: {} as CanvasImageSource,
        sourceWidth: 20,
        sourceHeight: 20,
        regions: [],
        exportOptions: {
          outputMime: "image/webp",
          quality: 0.8,
          resize: { lockAspectRatio: true },
        },
        createSurface: (w, h) =>
          createMemorySurface(w, h, {
            returnedMime: "image/png",
            onRelease: () => {
              released = true;
            },
          }).surface,
      }),
    ).rejects.toMatchObject({
      code: "FORMAT_NOT_SUPPORTED_FOR_EXPORT",
    });

    expect(released).toBe(true);
  });

  it("rejects more than maxRedactionRegions", () => {
    const { surface } = createMemorySurface(20, 20);
    const regions: RedactionRegion[] = Array.from(
      { length: IMAGE_LIMITS.maxRedactionRegions + 1 },
      (_, i) => ({
        id: `r-${i}`,
        x: 0.1,
        y: 0.1,
        width: 0.2,
        height: 0.2,
        mode: "solid",
      }),
    );

    expect(() => applyRedactionsToContext(surface.getContext2D(), 20, 20, regions)).toThrowError(
      ImageEngineError,
    );
  });
});

