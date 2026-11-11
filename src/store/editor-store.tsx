"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { IMAGE_LIMITS } from "@/config/limits";
import { buildCenteredRegion, moveNormalizedRegion } from "@/lib/editor-utils";
import {
  decodeSourceImage,
  detectBrowserCapabilities,
  exportImageOffMainThreadOrFallback,
  ImageEngineError,
  validateImageFile,
  type BlurStrength,
  type RedactionMode,
  type RedactionRegion,
  type SupportedImageMime,
} from "@/lib/image-engine";
import {
  createInitialEditorState,
  editorReducer,
  type ActiveImageSession,
  type EditorState,
  type ZoomSetting,
} from "@/store/editor-reducer";

interface EditorContextValue {
  state: EditorState;
  canClipboardRead: boolean;
  loadFile: (file: File) => Promise<void>;
  pasteFromClipboard: () => Promise<void>;
  clearSession: () => void;
  commitRegions: (next: RedactionRegion[], selectId?: string | null) => void;
  undo: () => void;
  redo: () => void;
  resetRegions: () => void;
  selectRegion: (id: string | null) => void;
  setMode: (mode: RedactionMode) => void;
  setSolidColor: (color: string) => void;
  setBlurStrength: (strength: BlurStrength) => void;
  setZoom: (zoom: ZoomSetting) => void;
  addCenteredBox: () => void;
  deleteSelectedRegion: () => void;
  nudgeSelectedRegion: (dxPx: number, dyPx: number) => void;
  setOutputMime: (mime: SupportedImageMime) => void;
  setQuality: (quality: number) => void;
  setResizeWidth: (val: string) => void;
  setResizeHeight: (val: string) => void;
  toggleAspectLock: () => void;
  resetDimensions: () => void;
  runExport: () => Promise<void>;
  clearExportResult: () => void;
  clearIntakeError: () => void;
  setTransientNotice: (message: string | null) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

/**
 * Root-mounted, memory-only editor store so client-side page navigation (e.g. / <-> /privacy)
 * preserves active images, redaction regions, undo history, and export settings without
 * writing sensitive image data to persistent browser storage.
 */
export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, undefined, createInitialEditorState);
  const [canClipboardRead, setCanClipboardRead] = useState(false);

  const stateRef = useRef(state);
  const loadSeqRef = useRef(0);
  const exportSeqRef = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Release decoded ImageBitmap/ObjectURL only when the entire application unmounts (tab close)
  useEffect(() => {
    return () => {
      stateRef.current.session?.decoded.release();
    };
  }, []);

  // Probe browser capabilities once at app startup
  useEffect(() => {
    let active = true;
    detectBrowserCapabilities().then((caps) => {
      if (active) {
        dispatch({ type: "CAPABILITIES_DETECTED", capabilities: caps });
      }
    });
    if (typeof navigator !== "undefined" && navigator.clipboard && "read" in navigator.clipboard) {
      setCanClipboardRead(true);
    }
    return () => {
      active = false;
    };
  }, []);

  // Warn before browser refresh/tab close across all routes when edits exist in memory (FR-043)
  useEffect(() => {
    if (!state.session || state.history.present.length === 0) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.session, state.history.present.length]);

  const loadFile = useCallback(async (file: File) => {
    const requestSeq = ++loadSeqRef.current;
    // Invalidate any in-flight export belonging to the previous image
    exportSeqRef.current += 1;
    dispatch({ type: "LOAD_START" });

    try {
      const validated = await validateImageFile(file);
      const decoded = await decodeSourceImage(file);

      // If a newer file load started while decoding, dispose stale bitmap cleanly
      if (requestSeq !== loadSeqRef.current) {
        decoded.release();
        return;
      }

      // Release previous active image bitmap right before replacing it
      stateRef.current.session?.decoded.release();

      const nextSession: ActiveImageSession = {
        file,
        mimeType: validated.mimeType,
        byteSize: validated.byteSize,
        filename: validated.originalName,
        decoded,
      };

      dispatch({ type: "LOAD_SUCCESS", session: nextSession });
    } catch (err) {
      if (requestSeq !== loadSeqRef.current) return;
      const message =
        err instanceof ImageEngineError
          ? err.message
          : "Failed to load this image. Please try another JPEG, PNG, or WebP file.";
      dispatch({ type: "LOAD_FAILURE", message });
    }
  }, []);

  const pasteFromClipboard = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split("/")[1] || "png";
          const pastedFile = new File([blob], `clipboard-image.${ext}`, { type: imageType });
          await loadFile(pastedFile);
          return;
        }
      }
      dispatch({
        type: "LOAD_FAILURE",
        message: "No image found on your clipboard. Copy an image first or select a file.",
      });
    } catch {
      dispatch({
        type: "LOAD_FAILURE",
        message:
          "Clipboard access was blocked by the browser. Try pressing Ctrl/Cmd+V directly or choosing a file.",
      });
    }
  }, [loadFile]);

  const clearSession = useCallback(() => {
    loadSeqRef.current += 1;
    exportSeqRef.current += 1;
    stateRef.current.session?.decoded.release();
    dispatch({ type: "CLEAR_SESSION" });
  }, []);

  const commitRegions = useCallback(
    (next: RedactionRegion[], selectId?: string | null) => {
      dispatch({ type: "COMMIT_REGIONS", next, selectId });
    },
    [],
  );

  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);
  const resetRegions = useCallback(() => dispatch({ type: "RESET_REGIONS" }), []);
  const selectRegion = useCallback((id: string | null) => dispatch({ type: "SELECT_REGION", id }), []);
  const setMode = useCallback((mode: RedactionMode) => dispatch({ type: "SET_MODE", mode }), []);
  const setSolidColor = useCallback((color: string) => dispatch({ type: "SET_SOLID_COLOR", color }), []);
  const setBlurStrength = useCallback(
    (strength: BlurStrength) => dispatch({ type: "SET_BLUR_STRENGTH", strength }),
    [],
  );
  const setZoom = useCallback((zoom: ZoomSetting) => dispatch({ type: "SET_ZOOM", zoom }), []);

  const addCenteredBox = useCallback(() => {
    const current = stateRef.current;
    if (!current.session || current.history.present.length >= IMAGE_LIMITS.maxRedactionRegions) {
      return;
    }
    const region = buildCenteredRegion(
      current.session.decoded.width,
      current.session.decoded.height,
      current.activeMode,
      current.activeColor,
      current.activeBlurStrength,
    );
    dispatch({
      type: "COMMIT_REGIONS",
      next: [...current.history.present, region],
      selectId: region.id,
    });
  }, []);

  const deleteSelectedRegion = useCallback(() => {
    const current = stateRef.current;
    if (!current.selectedRegionId) return;
    dispatch({
      type: "COMMIT_REGIONS",
      next: current.history.present.filter((r) => r.id !== current.selectedRegionId),
      selectId: null,
    });
  }, []);

  const nudgeSelectedRegion = useCallback((dxPx: number, dyPx: number) => {
    const current = stateRef.current;
    if (!current.session || !current.selectedRegionId) return;
    const selected = current.history.present.find((r) => r.id === current.selectedRegionId);
    if (!selected) return;

    const moved = moveNormalizedRegion(
      selected,
      dxPx / current.session.decoded.width,
      dyPx / current.session.decoded.height,
    );
    dispatch({
      type: "COMMIT_REGIONS",
      next: current.history.present.map((r) => (r.id === selected.id ? moved : r)),
    });
  }, []);

  const setOutputMime = useCallback(
    (mime: SupportedImageMime) => dispatch({ type: "SET_OUTPUT_MIME", mime }),
    [],
  );
  const setQuality = useCallback((quality: number) => dispatch({ type: "SET_QUALITY", quality }), []);
  const setResizeWidth = useCallback(
    (value: string) => dispatch({ type: "SET_RESIZE_WIDTH", value }),
    [],
  );
  const setResizeHeight = useCallback(
    (value: string) => dispatch({ type: "SET_RESIZE_HEIGHT", value }),
    [],
  );
  const toggleAspectLock = useCallback(() => dispatch({ type: "TOGGLE_ASPECT_LOCK" }), []);
  const resetDimensions = useCallback(() => dispatch({ type: "RESET_DIMENSIONS" }), []);
  const clearExportResult = useCallback(() => dispatch({ type: "CLEAR_EXPORT_RESULT" }), []);
  const clearIntakeError = useCallback(() => dispatch({ type: "CLEAR_INTAKE_ERROR" }), []);
  const setTransientNotice = useCallback(
    (message: string | null) => dispatch({ type: "SET_TRANSIENT_NOTICE", message }),
    [],
  );

  const runExport = useCallback(async () => {
    const current = stateRef.current;
    if (!current.session || current.isExporting) return;

    const exportSeq = ++exportSeqRef.current;
    const sessionSnapshot = current.session;
    const regionsSnapshot = current.history.present;
    const settingsSnapshot = current.exportSettings;

    dispatch({ type: "EXPORT_START" });

    try {
      const widthNum = Number(settingsSnapshot.resizeWidth);
      const heightNum = Number(settingsSnapshot.resizeHeight);

      if (
        !Number.isFinite(widthNum) ||
        !Number.isFinite(heightNum) ||
        widthNum < 1 ||
        heightNum < 1
      ) {
        throw new ImageEngineError(
          "INVALID_DIMENSIONS",
          "Please enter valid positive integer values for output width and height.",
        );
      }

      const result = await exportImageOffMainThreadOrFallback({
        file: sessionSnapshot.file,
        originalFilename: sessionSnapshot.filename,
        regions: regionsSnapshot,
        exportOptions: {
          outputMime: settingsSnapshot.outputMime,
          quality: settingsSnapshot.quality,
          resize: {
            width: Math.round(widthNum),
            height: Math.round(heightNum),
            lockAspectRatio: settingsSnapshot.lockAspectRatio,
          },
        },
      });

      if (exportSeq !== exportSeqRef.current) return;
      dispatch({ type: "EXPORT_SUCCESS", result });
    } catch (err) {
      if (exportSeq !== exportSeqRef.current) return;
      const message =
        err instanceof ImageEngineError
          ? err.message
          : "Export failed, possibly due to memory constraints. Try smaller output dimensions.";
      dispatch({ type: "EXPORT_FAILURE", message });
    }
  }, []);

  const value = useMemo<EditorContextValue>(
    () => ({
      state,
      canClipboardRead,
      loadFile,
      pasteFromClipboard,
      clearSession,
      commitRegions,
      undo,
      redo,
      resetRegions,
      selectRegion,
      setMode,
      setSolidColor,
      setBlurStrength,
      setZoom,
      addCenteredBox,
      deleteSelectedRegion,
      nudgeSelectedRegion,
      setOutputMime,
      setQuality,
      setResizeWidth,
      setResizeHeight,
      toggleAspectLock,
      resetDimensions,
      runExport,
      clearExportResult,
      clearIntakeError,
      setTransientNotice,
    }),
    [
      state,
      canClipboardRead,
      loadFile,
      pasteFromClipboard,
      clearSession,
      commitRegions,
      undo,
      redo,
      resetRegions,
      selectRegion,
      setMode,
      setSolidColor,
      setBlurStrength,
      setZoom,
      addCenteredBox,
      deleteSelectedRegion,
      nudgeSelectedRegion,
      setOutputMime,
      setQuality,
      setResizeWidth,
      setResizeHeight,
      toggleAspectLock,
      resetDimensions,
      runExport,
      clearExportResult,
      clearIntakeError,
      setTransientNotice,
    ],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error("useEditor must be used inside an EditorProvider.");
  }
  return ctx;
}

