"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { ConfirmDiscardDialog } from "@/components/ConfirmDiscardDialog";
import { EditorCanvas } from "@/components/EditorCanvas";
import { EditorToolbar } from "@/components/EditorToolbar";
import { ExportPanel } from "@/components/ExportPanel";
import { ExportPreviewModal } from "@/components/ExportPreviewModal";
import { IntakeDropzone } from "@/components/IntakeDropzone";
import { IMAGE_LIMITS } from "@/config/limits";
import { formatByteSize } from "@/lib/editor-utils";
import { useEditor } from "@/store/editor-store";

type PendingDiscardAction =
  | { kind: "reset-regions" }
  | { kind: "clear-image" }
  | { kind: "load-file"; file: File };

interface BlurBeforeAppProps {
  intakeHero?: ReactNode;
  intakeFooter?: ReactNode;
}

export function BlurBeforeApp({ intakeHero, intakeFooter }: BlurBeforeAppProps) {
  const {
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
  } = useEditor();

  const [pendingDiscard, setPendingDiscard] = useState<PendingDiscardAction | null>(null);
  const [fitScale, setFitScale] = useState<number>(1);

  const {
    session,
    history,
    selectedRegionId,
    activeMode,
    activeColor,
    activeBlurStrength,
    zoom,
    capabilities,
    exportSettings,
    isLoadingImage,
    intakeError,
    transientNotice,
    isExporting,
    exportError,
    exportResult,
  } = state;

  const regions = history.present;
  const selectedRegion = regions.find((r) => r.id === selectedRegionId) ?? null;

  useEffect(() => {
    return () => {
      clearExportResult();
    };
  }, [clearExportResult]);

  const requestFileLoad = useCallback(
    (file: File) => {
      if (session && regions.length > 0) {
        setPendingDiscard({ kind: "load-file", file });
        return;
      }
      void loadFile(file);
    },
    [session, regions.length, loadFile],
  );

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
        undo();
        return;
      }
      if ((mod && e.key.toLowerCase() === "z" && e.shiftKey) || (mod && e.key.toLowerCase() === "y")) {
        e.preventDefault();
        redo();
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedRegionId) {
        e.preventDefault();
        deleteSelectedRegion();
        return;
      }

      if (
        selectedRegionId &&
        (e.key === "ArrowLeft" ||
          e.key === "ArrowRight" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowDown")
      ) {
        e.preventDefault();
        const stepPx = e.shiftKey ? 20 : 4;
        const dxPx = e.key === "ArrowLeft" ? -stepPx : e.key === "ArrowRight" ? stepPx : 0;
        const dyPx = e.key === "ArrowUp" ? -stepPx : e.key === "ArrowDown" ? stepPx : 0;
        nudgeSelectedRegion(dxPx, dyPx);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session, selectedRegionId, undo, redo, deleteSelectedRegion, nudgeSelectedRegion]);

  const confirmPendingDiscard = () => {
    const action = pendingDiscard;
    setPendingDiscard(null);
    if (!action) return;

    if (action.kind === "reset-regions") {
      resetRegions();
    } else if (action.kind === "clear-image") {
      clearSession();
    } else if (action.kind === "load-file") {
      void loadFile(action.file);
    }
  };

  if (!session) {
    return (
      <div className="space-y-12">
        <div className="space-y-6">
          {intakeHero}
          <IntakeDropzone
            isLoading={isLoadingImage}
            errorMessage={intakeError}
            onSelectFile={requestFileLoad}
            onPasteRequest={canClipboardRead ? () => void pasteFromClipboard() : undefined}
          />
        </div>
        {intakeFooter}
      </div>
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
        fitScale={fitScale}
        onChangeMode={setMode}
        onChangeColor={setSolidColor}
        onChangeBlurStrength={setBlurStrength}
        onAddCenteredBox={addCenteredBox}
        onDeleteSelected={deleteSelectedRegion}
        onUndo={undo}
        onRedo={redo}
        onResetAll={() => setPendingDiscard({ kind: "reset-regions" })}
        onChangeZoom={setZoom}
        onReplaceImage={() => {
          if (regions.length > 0) {
            setPendingDiscard({ kind: "clear-image" });
          } else {
            clearSession();
          }
        }}
      />

      {transientNotice && (
        <div
          role="status"
          className="animate-banner-in flex items-center justify-between gap-3 rounded-lg border border-[var(--amber-tint-border)] bg-[var(--amber-tint-bg)] px-4 py-2.5 text-xs text-[var(--amber-tint-text)]"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
            <span>{transientNotice}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss notice"
            onClick={() => setTransientNotice(null)}
            className="rounded p-0.5 text-[var(--amber-badge-text)] transition-colors hover:text-[var(--amber-tint-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent-amber)]"
          >
            <X size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}

      {intakeError && (
        <div
          role="alert"
          className="animate-banner-in flex items-center justify-between gap-3 rounded-lg border border-[var(--red-tint-border)] bg-[var(--red-tint-bg)] px-4 py-2.5 text-xs text-[var(--red-tint-text)]"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
            <span>{intakeError}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={clearIntakeError}
            className="rounded p-0.5 text-[var(--red-tint-text)] transition-colors hover:text-[var(--red-tint-strong)] focus-visible:outline-2 focus-visible:outline-[var(--accent-red)]"
          >
            <X size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          <EditorCanvas
            decodedImage={session.decoded}
            regions={regions}
            selectedRegionId={selectedRegionId}
            activeMode={activeMode}
            activeColor={activeColor}
            activeBlurStrength={activeBlurStrength}
            zoom={zoom}
            onSelectRegion={selectRegion}
            onCommitRegions={commitRegions}
            onTransientNotice={setTransientNotice}
            onFitScaleChange={setFitScale}
          />

          {/* Status bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-2.5 text-xs text-[var(--text-muted)] shadow-[var(--shadow-card)]">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="max-w-[200px] truncate font-medium text-[var(--text-secondary)]"
                title={session.filename}
              >
                {session.filename}
              </span>
              <span className="text-[var(--border-strong)]" aria-hidden="true">
                ·
              </span>
              <span>
                {session.decoded.width} × {session.decoded.height}
              </span>
              <span className="text-[var(--border-strong)]" aria-hidden="true">
                ·
              </span>
              <span>{formatByteSize(session.byteSize)}</span>
            </div>
            <div className="shrink-0 text-[var(--text-muted)]">
              ↑↓←→ nudge ·{" "}
              <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--surface-2)] px-1 text-[11px] text-[var(--text-secondary)]">
                Del
              </kbd>{" "}
              remove · edits in memory only
            </div>
          </div>

          {/* Region chips */}
          {regions.length > 0 && (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 shadow-[var(--shadow-card)]">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Regions ({regions.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {regions.map((r, idx) => {
                  const selected = r.id === selectedRegionId;
                  const isSolid = r.mode === "solid";
                  return (
                    <div
                      key={r.id}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                        selected
                          ? isSolid
                            ? "border-[var(--green-tint-border)] bg-[var(--green-tint-bg)] text-[var(--green-tint-text)]"
                            : "border-[var(--amber-tint-border)] bg-[var(--amber-tint-bg)] text-[var(--amber-tint-text)]"
                          : "border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => selectRegion(r.id)}
                        className="transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-green)]"
                      >
                        #{idx + 1} {isSolid ? "Solid" : "Blur"}
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove region ${idx + 1}`}
                        onClick={() => {
                          const next = regions.filter((item) => item.id !== r.id);
                          commitRegions(next, selected ? null : selectedRegionId);
                        }}
                        className="ml-0.5 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-[var(--accent-green)]"
                      >
                        <X size={11} strokeWidth={2} aria-hidden="true" />
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
          outputMime={exportSettings.outputMime}
          supportedExportMimes={capabilities.supportedExportMimes}
          quality={exportSettings.quality}
          resizeWidth={exportSettings.resizeWidth}
          resizeHeight={exportSettings.resizeHeight}
          lockAspectRatio={exportSettings.lockAspectRatio}
          isExporting={isExporting}
          exportError={exportError}
          onChangeOutputMime={setOutputMime}
          onChangeQuality={setQuality}
          onChangeResizeWidth={setResizeWidth}
          onChangeResizeHeight={setResizeHeight}
          onToggleAspectLock={toggleAspectLock}
          onResetDimensions={resetDimensions}
          onExport={() => void runExport()}
        />
      </div>

      <ExportPreviewModal
        result={exportResult}
        sourceByteSize={session.byteSize}
        onClose={clearExportResult}
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
