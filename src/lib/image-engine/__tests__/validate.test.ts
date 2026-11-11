import { describe, expect, it } from "vitest";
import { IMAGE_LIMITS } from "@/config/limits";
import {
  buildExportFilename,
  ImageEngineError,
  sniffImageBytes,
  validateImageFile,
  validatePixelDimensions,
} from "@/lib/image-engine";

function makeBytes(bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

describe("sniffImageBytes", () => {
  it("detects JPEG, PNG, and static WebP headers", () => {
    expect(sniffImageBytes(makeBytes([0xff, 0xd8, 0xff, 0xe0])).mime).toBe("image/jpeg");
    expect(
      sniffImageBytes(makeBytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])).mime,
    ).toBe("image/png");

    // RIFF....WEBP + VP8 (static)
    const staticWebp = makeBytes([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
    ]);
    expect(sniffImageBytes(staticWebp)).toEqual({ mime: "image/webp", animatedWebp: false });
  });

  it("flags animated WebP via VP8X animation bit", () => {
    const animatedWebp = new Uint8Array(24);
    animatedWebp.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
    animatedWebp.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
    animatedWebp.set([0x56, 0x50, 0x38, 0x58], 12); // VP8X
    animatedWebp[20] = 0x02; // animation flag bit

    expect(sniffImageBytes(animatedWebp)).toEqual({ mime: "image/webp", animatedWebp: true });
  });

  it("detects unsupported GIF, TIFF, HEIC, and SVG formats", () => {
    expect(sniffImageBytes(new TextEncoder().encode("GIF89a......")).mime).toBe("image/gif");
    expect(sniffImageBytes(makeBytes([0x49, 0x49, 0x2a, 0x00, 0x08])).mime).toBe("image/tiff");
    expect(sniffImageBytes(new TextEncoder().encode("    <svg xmlns='...'>")).mime).toBe(
      "image/svg+xml",
    );

    const heic = new Uint8Array(12);
    heic.set(new TextEncoder().encode("ftypheic"), 4);
    expect(sniffImageBytes(heic).mime).toBe("image/heic");
  });
});

describe("validateImageFile", () => {
  it("accepts a valid PNG File and preserves filename", async () => {
    const pngFile = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])],
      "screenshot.png",
      { type: "image/png" },
    );

    const res = await validateImageFile(pngFile);
    expect(res).toEqual({
      mimeType: "image/png",
      byteSize: 9,
      originalName: "screenshot.png",
    });
  });

  it("rejects empty files and oversized files before decode", async () => {
    await expect(validateImageFile(new File([], "empty.png"))).rejects.toMatchObject({
      code: "FILE_EMPTY",
    });

    const tinyLimits = { ...IMAGE_LIMITS, maxFileSizeBytes: 10 };
    const overFile = new File([new Uint8Array(11)], "big.jpg");
    await expect(validateImageFile(overFile, tinyLimits)).rejects.toMatchObject({
      code: "FILE_TOO_LARGE",
    });
  });

  it("rejects renamed text or GIF files masquerading as PNG", async () => {
    const renamedGif = new File([new TextEncoder().encode("GIF89a123456")], "fake.png", {
      type: "image/png",
    });
    await expect(validateImageFile(renamedGif)).rejects.toBeInstanceOf(ImageEngineError);
    await expect(validateImageFile(renamedGif)).rejects.toMatchObject({
      code: "ANIMATED_IMAGE_UNSUPPORTED",
    });

    const renamedText = new File([new TextEncoder().encode("not really an image")], "fake.jpg", {
      type: "image/jpeg",
    });
    await expect(validateImageFile(renamedText)).rejects.toMatchObject({
      code: "UNSUPPORTED_FORMAT",
    });
  });
});

describe("validatePixelDimensions", () => {
  it("allows up to 16 MP and rejects > 16 MP", () => {
    expect(() => validatePixelDimensions(4000, 4000)).not.toThrow();
    expect(() => validatePixelDimensions(4001, 4000)).toThrowError(ImageEngineError);
    expect(() => validatePixelDimensions(0, 100)).toThrowError(ImageEngineError);
  });
});

describe("buildExportFilename", () => {
  it("appends -blurbefore suffix and maps output extension cleanly", () => {
    expect(buildExportFilename("bank-receipt.png", "image/jpeg")).toBe(
      "bank-receipt-blurbefore.jpg",
    );
    expect(buildExportFilename("C:\\fakepath\\My Photo (1).jpeg", "image/webp")).toBe(
      "My-Photo-1-blurbefore.webp",
    );
    expect(buildExportFilename("already-blurbefore.png", "image/png")).toBe(
      "already-blurbefore.png",
    );
    expect(buildExportFilename("", "image/png")).toBe("image-blurbefore.png");
  });
});

