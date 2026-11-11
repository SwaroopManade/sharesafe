import { describe, expect, it } from "vitest";
import {
  buildCenteredRegion,
  createInitialHistory,
  formatByteSize,
  historyReducer,
  moveNormalizedRegion,
  resizeNormalizedRegion,
} from "@/lib/editor-utils";
import type { RedactionRegion } from "@/lib/image-engine";

const sampleRegion: RedactionRegion = {
  id: "r1",
  x: 0.2,
  y: 0.2,
  width: 0.3,
  height: 0.2,
  mode: "solid",
  color: "#09090b",
};

describe("historyReducer", () => {
  it("supports commit, undo, redo, and reset all", () => {
    let state = createInitialHistory();
    state = historyReducer(state, { type: "COMMIT", next: [sampleRegion] });
    expect(state.present).toHaveLength(1);
    expect(state.past).toHaveLength(1);

    state = historyReducer(state, { type: "UNDO" });
    expect(state.present).toHaveLength(0);
    expect(state.future).toHaveLength(1);

    state = historyReducer(state, { type: "REDO" });
    expect(state.present).toHaveLength(1);

    state = historyReducer(state, { type: "RESET_ALL" });
    expect(state.present).toHaveLength(0);
    expect(state.past).toHaveLength(2);
  });
});

describe("region movement & resize helpers", () => {
  it("clamps movement strictly inside [0..1]", () => {
    const movedTopLeft = moveNormalizedRegion(sampleRegion, -0.5, -0.5);
    expect(movedTopLeft.x).toBe(0);
    expect(movedTopLeft.y).toBe(0);

    const movedBottomRight = moveNormalizedRegion(sampleRegion, 0.9, 0.9);
    expect(movedBottomRight.x).toBeCloseTo(0.7, 10);
    expect(movedBottomRight.y).toBeCloseTo(0.8, 10);
  });

  it("resizes from handle while preserving minimum source pixel size", () => {
    const resized = resizeNormalizedRegion(sampleRegion, "se", 0.1, 0.1, 1000, 1000);
    expect(resized.width).toBeCloseTo(0.4, 10);
    expect(resized.height).toBeCloseTo(0.3, 10);

    // Shrinking smaller than 4px keeps original dimensions or clamps cleanly
    const shrunkTooSmall = resizeNormalizedRegion(sampleRegion, "se", -0.299, -0.199, 1000, 1000);
    expect(shrunkTooSmall.width * 1000).toBeGreaterThanOrEqual(4);
    expect(shrunkTooSmall.height * 1000).toBeGreaterThanOrEqual(4);
  });

  it("builds a centered region and formats byte sizes cleanly", () => {
    const box = buildCenteredRegion(1000, 1000, "solid");
    expect(box.x).toBeGreaterThan(0.2);
    expect(box.y).toBeGreaterThan(0.2);
    expect(box.mode).toBe("solid");

    expect(formatByteSize(512)).toBe("512 B");
    expect(formatByteSize(1536)).toBe("1.5 KB");
    expect(formatByteSize(2 * 1024 * 1024)).toBe("2.00 MB");
  });
});

