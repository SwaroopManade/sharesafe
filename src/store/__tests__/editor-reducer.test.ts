import { describe, expect, it } from "vitest";
import type { RedactionRegion } from "@/lib/image-engine";
import {
  createInitialEditorState,
  editorReducer,
  type ActiveImageSession,
} from "@/store/editor-reducer";

function makeSession(
  overrides?: Partial<ActiveImageSession>,
): ActiveImageSession {
  return {
    file: new File([new Uint8Array([1, 2, 3])], "screenshot.png", { type: "image/png" }),
    mimeType: "image/png",
    byteSize: 3,
    filename: "screenshot.png",
    decoded: {
      source: {} as CanvasImageSource,
      width: 2000,
      height: 1000,
      release: () => {},
    },
    ...overrides,
  };
}

const sampleRegion: RedactionRegion = {
  id: "reg-1",
  x: 0.2,
  y: 0.2,
  width: 0.3,
  height: 0.2,
  mode: "solid",
  color: "#09090b",
  blurStrength: 2,
};

describe("editorReducer", () => {
  it("initializes export dimensions and falls back safely when WebP export is unsupported", () => {
    let state = createInitialEditorState();
    state = editorReducer(state, {
      type: "CAPABILITIES_DETECTED",
      capabilities: {
        supportsOffscreenCanvas: true,
        supportsWebWorkers: true,
        supportedExportMimes: ["image/jpeg", "image/png"],
      },
    });

    state = editorReducer(state, {
      type: "LOAD_SUCCESS",
      session: makeSession({ mimeType: "image/webp", filename: "photo.webp" }),
    });

    expect(state.exportSettings.outputMime).toBe("image/png");
    expect(state.exportSettings.resizeWidth).toBe("2000");
    expect(state.exportSettings.resizeHeight).toBe("1000");
    expect(state.transientNotice).toContain("WebP");
  });

  it("commits regions, supports undo/redo, and reconciles selectedRegionId automatically", () => {
    let state = createInitialEditorState();
    state = editorReducer(state, { type: "LOAD_SUCCESS", session: makeSession() });
    state = editorReducer(state, {
      type: "COMMIT_REGIONS",
      next: [sampleRegion],
      selectId: sampleRegion.id,
    });

    expect(state.history.present).toHaveLength(1);
    expect(state.selectedRegionId).toBe(sampleRegion.id);

    state = editorReducer(state, { type: "UNDO" });
    expect(state.history.present).toHaveLength(0);
    expect(state.selectedRegionId).toBeNull();

    state = editorReducer(state, { type: "REDO" });
    expect(state.history.present).toHaveLength(1);
    expect(state.selectedRegionId).toBeNull();
  });

  it("updates selected region mode/color/blur strength and records undo history", () => {
    let state = createInitialEditorState();
    state = editorReducer(state, { type: "LOAD_SUCCESS", session: makeSession() });
    state = editorReducer(state, {
      type: "COMMIT_REGIONS",
      next: [sampleRegion],
      selectId: sampleRegion.id,
    });

    state = editorReducer(state, { type: "SET_MODE", mode: "blur" });
    expect(state.activeMode).toBe("blur");
    expect(state.history.present[0].mode).toBe("blur");
    expect(state.history.past).toHaveLength(2);

    state = editorReducer(state, { type: "SET_BLUR_STRENGTH", strength: 3 });
    expect(state.activeBlurStrength).toBe(3);
    expect(state.history.present[0].blurStrength).toBe(3);

    state = editorReducer(state, { type: "UNDO" });
    expect(state.history.present[0].blurStrength).toBe(2);
  });

  it("maintains aspect-ratio-locked resize calculations and resets cleanly", () => {
    let state = createInitialEditorState();
    state = editorReducer(state, { type: "LOAD_SUCCESS", session: makeSession() });

    state = editorReducer(state, { type: "SET_RESIZE_WIDTH", value: "1000" });
    expect(state.exportSettings.resizeHeight).toBe("500");

    state = editorReducer(state, { type: "TOGGLE_ASPECT_LOCK" });
    state = editorReducer(state, { type: "SET_RESIZE_HEIGHT", value: "800" });
    expect(state.exportSettings.resizeWidth).toBe("1000");

    state = editorReducer(state, { type: "TOGGLE_ASPECT_LOCK" });
    expect(state.exportSettings.resizeHeight).toBe("500");

    state = editorReducer(state, { type: "CLEAR_SESSION" });
    expect(state.session).toBeNull();
    expect(state.history.present).toHaveLength(0);
  });
});

