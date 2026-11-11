"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ConfirmDiscardDialog } from "@/components/ConfirmDiscardDialog";
import { EditorCanvas, type ZoomSetting } from "@/components/EditorCanvas";
import { EditorToolbar } from "@/components/EditorToolbar";
import { ExportPanel } from "@/components/ExportPanel";
import { ExportPreviewModal } from "@/components/ExportPreviewModal";
import { IntakeDropzone } from "@/components/IntakeDropzone";
import { APP_CONFIG } from "@/config/app";
import { IMAGE_LIMITS } from "@/config/limits";
import {
  buildCenteredRegion,
  createInitialHistory,
  formatByteSize,
  historyReducer,
  moveNormalizedRegion,
} from "@/lib/editor-utils";
import {
  decodeSourceImage,
  detectBrowserCapabilities,
  exportImageOffMainThreadOrFallback,
  ImageEngineError,
  validateImageFile,
  type BlurStrength,
  type BrowserCapabilities,
  type DecodedImage,
  type ExportResult,
  type RedactionMode,
  type RedactionRegion,
  type SupportedImageMime,
} from "@/lib/image-engine";

interface ActiveImageSession {
  file: File;
  mimeType: SupportedImageMime;
  byteSize: number;
  filename: string;
  decoded: DecodedImage;
}

type PendingDiscardAction =
  | { kind: "reset-regions" }
  | { kind: "clear-image" }
  | { kind: "load-file"; file: File };

export function BlurBeforeApp() {
  const [session, setSession] = useState<ActiveImageSession | null>(null);
  const sessionRef = useRef<ActiveImageSession | null>(null);

  const [history, dispatchHistory] = useReducer(historyReducer, undefined, createInitialHistory);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<RedactionMode>(APP_CONFIG.defaultRedactionMode);
  const [activeColor, setActiveColor] = useState<string>(APP_CONFIG.defaultSolidColor);
  const [activeBlurStrength, setActiveBlurStrength] = useState<BlurStrength>(
    APP_CONFIG.defaultBlurStrength,
  );
  const [zoom, setZoom] = useState<ZoomSetting>("fit");

  const [capabilities, setCapabilities] = useState<BrowserCapabilities>({
    supportsOffscreenCanvas: false,
    supportsWebWorkers: false,
    supportedExportMimes: ["image/jpeg", "image/png"],
  });

  const [outputMime, setOutputMime] = useState<SupportedImageMime>("image/png");
  const [quality, setQuality] = useState<number>(APP_CONFIG.defaultLossyQuality);
  const [resizeWidth, setResizeWidth] = useState<string>("");
  const [resizeHeight, setResizeHeight] = useState<string>("");
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);

  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [transientNotice, setTransientNotice] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [pendingDiscard, setPendingDiscard] = useState<PendingDiscardAction | null>(null);
  const [canClipboardRead, setCanClipboardRead] = useState(false);

  const regions = history.present;
  const selectedRegion = regions.find((r) => r.id === selectedRegionId) ?? null;

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Cleanup active decoded ImageBitmap / object URLs on unmount (FR-042)
  useEffect(() => {
    return () => {
      sessionRef.current?.decoded.release();
    };
  }, []);

  // Detect browser capabilities (WebP export support, OffscreenCanvas, Clipboard read)
  useEffect(() => {
    let active = true;
    detectBrowserCapabilities().then((caps) => {
      if (active) setCapabilities(caps);
    });
    if (typeof navigator !== "undefined" && navigator.clipboard && "read" in navigator.clipboard) {
      setCanClipboardRead(true);
    }
    return () => {
      active = false;
    };
  }, []);

  // Warn before page unload when unsaved redaction edits exist (FR-043)
  useEffect(() => {
    if (!session || regions.length === 0) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [session, regions.length]);

  const loadFileDirect = useCallback(
    async (file: File) => {
      setIsLoadingImage(true);
      setIntakeError(null);
      setExportError(null);
      setTransientNotice(null);

      try {
        const validated = await validateImageFile(file);
        const decoded = await decodeSourceImage(file);

        // Release previous session resources immediately after new image succeeds
        sessionRef.current?.decoded.release();

        const nextSession: ActiveImageSession = {
          file,
          mimeType: validated.mimeType,
          byteSize: validated.byteSize,
          filename: validated.originalName,
          decoded,
        };

        const defaultExportMime = capabilities.supportedExportMimes.includes(validated.mimeType)
          ? validated.mimeType
          : "image/png";

        setSession(nextSession);
        dispatchHistory({ type: "CLEAR_HISTORY" });
        setSelectedRegionId(null);
        setZoom("fit");
        setOutputMime(defaultExportMime);
        setQuality(APP_CONFIG.defaultLossyQuality);
        setResizeWidth(String(decoded.width));
        setResizeHeight(String(decoded.height));
        setLockAspectRatio(true);
        setExportResult(null);

        if (validated.mimeType !== defaultExportMime) {
          setTransientNotice(
            `This browser does not support ${APP_CONFIG.mimeToLabel[validated.mimeType]} export; defaulted output format to PNG.`,
          );
        }
      } catch (err) {
        const message =
          err instanceof ImageEngineError
            ? err.message
            : "Failed to load this image. Please try another JPEG, PNG, or WebP file.";
        setIntakeError(message);
      } finally {
        setIsLoadingImage(false);
      }
    },
    [capabilities.supportedExportMimes],
  );

  const requestFileLoad = useCallback(
    (file: File) => {
      if (session && regions.length > 0) {
        setPendingDiscard({ kind: "load-file", file });
        return;
      }
      void loadFileDirect(file);
    },
    [session, regions.length, loadFileDirect],
  );

  // Global clipboard paste support (FR-012)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            requestFileLoad(blob);
            return;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [requestFileLoad]);

  const handlePasteButton = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split("/")[1] || "png";
          const pastedFile = new File([blob], `clipboard-image.${ext}`, { type: imageType });
          requestFileLoad(pastedFile);
          return;
        }
      }
      setIntakeError("No image found on your clipboard. Copy an image first or select a file.");
    } catch {
      setIntakeError(
        "Clipboard access was blocked by the browser. Try pressing Ctrl/Cmd+V directly or choosing a file.",
      );
    }
  };

  // Keyboard shortcuts for Undo/Redo, Delete, and keyboard-accessible region nudging (NFR-016)
  useEffect(() => {
    if (!session) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (isInput) return;

      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatchHistory({ type: "UNDO" });
        return;
      }
      if ((mod && e.key.toLowerCase() === "z" && e.shiftKey) || (mod && e.key.toLowerCase() === "y")) {
        e.preventDefault();
        dispatchHistory({ type: "REDO" });
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedRegionId) {
        e.preventDefault();
        const next = regions.filter((r) => r.id !== selectedRegionId);
        dispatchHistory({ type: "COMMIT", next });
        setSelectedRegionId(null);
        return;
      }

      if (
        selectedRegion &&
        (e.key === "ArrowLeft" ||
          e.key === "ArrowRight" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowDown")
      ) {
        e.preventDefault();
        const stepPx = e.shiftKey ? 20 : 4;
        const dxNorm =
          e.key === "ArrowLeft"
            ? -stepPx / session.decoded.width
            : e.key === "ArrowRight"
              ? stepPx / session.decoded.width
              : 0;
        const dyNorm =
          e.key === "ArrowUp"
            ? -stepPx / session.decoded.height
            : e.key === "ArrowDown"
              ? stepPx / session.decoded.height
              : 0;

        const moved = moveNormalizedRegion(selectedRegion, dxNorm, dyNorm);
        const next = regions.map((r) => (r.id === selectedRegion.id ? moved : r));
        dispatchHistory({ type: "COMMIT", next });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session, regions, selectedRegion, selectedRegionId]);

  const handleCommitRegions = (next: RedactionRegion[], selectId?: string | null) => {
    dispatchHistory({ type: "COMMIT", next });
    if (selectId !== undefined) {
      setSelectedRegionId(selectId);
    }
  };

  const handleChangeMode = (mode: RedactionMode) => {
    setActiveMode(mode);
    if (selectedRegion && selectedRegion.mode !== mode) {
      const next = regions.map((r) => (r.id === selectedRegion.id ? { ...r, mode } : r));
      dispatchHistory({ type: "COMMIT", next });
    }
  };

  const handleChangeColor = (hex: string) => {
    setActiveColor(hex);
    if (selectedRegion && selectedRegion.mode === "solid" && selectedRegion.color !== hex) {
      const next = regions.map((r) => (r.id === selectedRegion.id ? { ...r, color: hex } : r));
      dispatchHistory({ type: "COMMIT", next });
    }
  };

  const handleChangeBlurStrength = (strength: BlurStrength) => {
    setActiveBlurStrength(strength);
    if (
      selectedRegion &&
      selectedRegion.mode === "blur" &&
      selectedRegion.blurStrength !== strength
    ) {
      const next = regions.map((r) =>
        r.id === selectedRegion.id ? { ...r, blurStrength: strength } : r,
      );
      dispatchHistory({ type: "COMMIT", next });
    }
  };

  const handleAddCenteredBox = () => {
    if (!session || regions.length >= IMAGE_LIMITS.maxRedactionRegions) return;
    const region = buildCenteredRegion(
      session.decoded.width,
      session.decoded.height,
      activeMode,
      activeColor,
      activeBlurStrength,
    );
    handleCommitRegions([...regions, region], region.id);
  };

  const handleDeleteSelected = () => {
    if (!selectedRegionId) return;
    handleCommitRegions(
      regions.filter((r) => r.id !== selectedRegionId),
      null,
    );
  };

  const handleChangeResizeWidth = (val: string) => {
    setResizeWidth(val);
    if (!session || !lockAspectRatio) return;
    const parsed = Number(val);
    if (Number.isFinite(parsed) && parsed > 0) {
      const aspect = session.decoded.width / session.decoded.height;
      setResizeHeight(String(Math.max(1, Math.round(parsed / aspect))));
    }
  };

  const handleChangeResizeHeight = (val: string) => {
    setResizeHeight(val);
    if (!session || !lockAspectRatio) return;
    const parsed = Number(val);
    if (Number.isFinite(parsed) && parsed > 0) {
      const aspect = session.decoded.width / session.decoded.height;
      setResizeWidth(String(Math.max(1, Math.round(parsed * aspect))));
    }
  };

  const handleToggleAspectLock = () => {
    const nextLock = !lockAspectRatio;
    setLockAspectRatio(nextLock);
    if (nextLock && session) {
      const parsedW = Number(resizeWidth);
      if (Number.isFinite(parsedW) && parsedW > 0) {
        const aspect = session.decoded.width / session.decoded.height;
        setResizeHeight(String(Math.max(1, Math.round(parsedW / aspect))));
      }
    }
  };

  const handleResetDimensions = () => {
    if (!session) return;
    setResizeWidth(String(session.decoded.width));
    setResizeHeight(String(session.decoded.height));
  };

  const handleExport = async () => {
    if (!session || isExporting) return;
    setIsExporting(true);
    setExportError(null);

    try {
      const widthNum = Number(resizeWidth);
      const heightNum = Number(resizeHeight);

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
        file: session.file,
        originalFilename: session.filename,
        regions,
        exportOptions: {
          outputMime,
          quality,
          resize: {
            width: Math.round(widthNum),
            height: Math.round(heightNum),
            lockAspectRatio,
          },
        },
      });

      setExportResult(result);
    } catch (err) {
      const message =
        err instanceof ImageEngineError
          ? err.message
          : "Export failed, possibly due to memory constraints. Try smaller output dimensions.";
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  };

  const confirmPendingDiscard = () => {
    const action = pendingDiscard;
    setPendingDiscard(null);
    if (!action) return;

    if (action.kind === "reset-regions") {
      dispatchHistory({ type: "RESET_ALL" });
      setSelectedRegionId(null);
    } else if (action.kind === "clear-image") {
      session?.decoded.release();
      setSession(null);
      dispatchHistory({ type: "CLEAR_HISTORY" });
      setSelectedRegionId(null);
      setExportResult(null);
      setExportError(null);
      setTransientNotice(null);
    } else if (action.kind === "load-file") {
      void loadFileDirect(action.file);
    }
  };

  if (!session) {
    return (
      <IntakeDropzone
        isLoading={isLoadingImage}
        errorMessage={intakeError}
        onSelectFile={requestFileLoad}
        onPasteRequest={canClipboardRead ? handlePasteButton : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      <EditorToolbar
        activeMode={activeMode}
        activeColor={activeColor}
        activeBlurStrength={activeBlurStrength}
        selectedRegion={selectedRegion}
        regionCount={regions.length}
        maxRegions={IMAGE_LIMITS.maxRedactionRegions}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        zoom={zoom}
        onChangeMode={handleChangeMode}
        onChangeColor={handleChangeColor}
        onChangeBlurStrength={handleChangeBlurStrength}
        onAddCenteredBox={handleAddCenteredBox}
        onDeleteSelected={handleDeleteSelected}
        onUndo={() => dispatchHistory({ type: "UNDO" })}
        onRedo={() => dispatchHistory({ type: "REDO" })}
        onResetAll={() => setPendingDiscard({ kind: "reset-regions" })}
        onChangeZoom={setZoom}
        onReplaceImage={() => {
          if (regions.length > 0) {
            setPendingDiscard({ kind: "clear-image" });
          } else {
            session.decoded.release();
            setSession(null);
            dispatchHistory({ type: "CLEAR_HISTORY" });
            setSelectedRegionId(null);
          }
        }}
      />

      {transientNotice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200"
        >
          <span>{transientNotice}</span>
          <button
            type="button"
            onClick={() => setTransientNotice(null)}
            className="text-amber-100 underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {intakeError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-200"
        >
          {intakeError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <EditorCanvas
            decodedImage={session.decoded}
            regions={regions}
            selectedRegionId={selectedRegionId}
            activeMode={activeMode}
            activeColor={activeColor}
            activeBlurStrength={activeBlurStrength}
            zoom={zoom}
            onSelectRegion={setSelectedRegionId}
            onCommitRegions={handleCommitRegions}
            onTransientNotice={setTransientNotice}
          />

          {/* Status bar & keyboard-accessible region list (NFR-016) */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-xs text-zinc-400">
            <span className="truncate">
              <strong className="text-zinc-200">{session.filename}</strong> ·{" "}
              {session.decoded.width} × {session.decoded.height} px ·{" "}
              {formatByteSize(session.byteSize)}
            </span>
            <span>
              Use arrow keys to nudge selected box · <kbd className="rounded bg-zinc-800 px-1 text-zinc-200">Del</kbd> to remove · Edits live in memory only
            </span>
          </div>

          {regions.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Redaction Regions ({regions.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {regions.map((r, idx) => {
                  const selected = r.id === selectedRegionId;
                  return (
                    <div
                      key={r.id}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${
                        selected
                          ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
                          : "border-zinc-700 bg-zinc-800/80 text-zinc-300"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedRegionId(r.id)}
                        className="font-medium hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
                      >
                        #{idx + 1} {r.mode === "solid" ? "Solid" : "Blur"}
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove region ${idx + 1}`}
                        onClick={() => {
                          const next = regions.filter((item) => item.id !== r.id);
                          handleCommitRegions(next, selected ? null : selectedRegionId);
                        }}
                        className="ml-1 rounded px-1 text-zinc-400 hover:bg-zinc-700 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <ExportPanel
          sourceWidth={session.decoded.width}
          sourceHeight={session.decoded.height}
          sourceMime={session.mimeType}
          outputMime={outputMime}
          supportedExportMimes={capabilities.supportedExportMimes}
          quality={quality}
          resizeWidth={resizeWidth}
          resizeHeight={resizeHeight}
          lockAspectRatio={lockAspectRatio}
          isExporting={isExporting}
          exportError={exportError}
          onChangeOutputMime={setOutputMime}
          onChangeQuality={setQuality}
          onChangeResizeWidth={handleChangeResizeWidth}
          onChangeResizeHeight={handleChangeResizeHeight}
          onToggleAspectLock={handleToggleAspectLock}
          onResetDimensions={handleResetDimensions}
          onExport={handleExport}
        />
      </div>

      <ExportPreviewModal
        result={exportResult}
        sourceByteSize={session.byteSize}
        onClose={() => setExportResult(null)}
      />

      <ConfirmDiscardDialog
        open={pendingDiscard !== null}
        title={
          pendingDiscard?.kind === "reset-regions"
            ? "Reset all redaction regions?"
            : "Discard current edits?"
        }
        description={
          pendingDiscard?.kind === "reset-regions"
            ? `This will remove all ${regions.length} redaction region(s) from the current image.`
            : "Projects are held only in browser memory. Replacing or closing the current image will discard your unsaved redactions."
        }
        confirmLabel={
          pendingDiscard?.kind === "reset-regions" ? "Reset Regions" : "Discard & Continue"
        }
        onConfirm={confirmPendingDiscard}
        onCancel={() => setPendingDiscard(null)}
      />
    </div>
  );
}

