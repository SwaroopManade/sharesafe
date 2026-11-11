"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Clipboard, Loader2, ShieldCheck, Upload } from "lucide-react";
import { IMAGE_LIMITS } from "@/config/limits";

interface IntakeDropzoneProps {
  isLoading: boolean;
  errorMessage: string | null;
  onSelectFile: (file: File) => void;
  onPasteRequest?: () => void;
}

export function IntakeDropzone({
  isLoading,
  errorMessage,
  onSelectFile,
  onPasteRequest,
}: IntakeDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const maxMb = Math.round(IMAGE_LIMITS.maxFileSizeBytes / (1024 * 1024));
  const maxMp = IMAGE_LIMITS.maxDecodedPixels / 1_000_000;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || isLoading) return;
    onSelectFile(files[0]);
  };

  return (
    <div className="space-y-4">
      <div
        data-drag-over={isDragOver}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isLoading) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className="relative flex min-h-[54vh] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)] px-6 py-14 text-center shadow-[var(--shadow-card)] transition-all duration-200 hover:border-[var(--border-strong)] data-[drag-over=true]:border-[var(--green-tint-border)] data-[drag-over=true]:bg-[var(--green-tint-bg)]"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          className="sr-only"
          aria-label="Choose an image file to redact"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] shadow-[var(--shadow-elevated)]">
          {isLoading ? (
            <Loader2
              size={28}
              strokeWidth={1.5}
              className="animate-spin text-[var(--green-tint-text)]"
              aria-hidden="true"
            />
          ) : (
            <Upload
              size={28}
              strokeWidth={1.5}
              className="text-[var(--green-tint-text)]"
              aria-hidden="true"
            />
          )}
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
          {isLoading ? "Decoding image locally..." : "Drop your image here"}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
          Or choose a file from your device. Everything runs in browser memory — nothing ever
          leaves this tab.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-green)] px-5 py-2.5 text-sm font-semibold text-[var(--text-inverse)] transition-all duration-150 hover:bg-[var(--accent-green-hover)] hover:shadow-[var(--shadow-glow-green)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)]"
          >
            <Upload size={16} strokeWidth={1.75} aria-hidden="true" />
            {isLoading ? "Processing..." : "Choose Image"}
          </button>

          {onPasteRequest && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onPasteRequest}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-green)]"
            >
              <Clipboard size={15} strokeWidth={1.75} aria-hidden="true" />
              Paste from Clipboard
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1 text-[var(--green-tint-text)]">
            <ShieldCheck size={13} strokeWidth={1.75} aria-hidden="true" />
            Zero server upload
          </span>
          <span aria-hidden="true">·</span>
          <span>JPEG · PNG · WebP (static)</span>
          <span aria-hidden="true">·</span>
          <span>
            Max {maxMb} MB / {maxMp} MP
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Press{" "}
            <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[11px] text-[var(--text-secondary)]">
              Ctrl/⌘ + V
            </kbd>
          </span>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="animate-banner-in flex items-start gap-2.5 rounded-lg border border-[var(--red-tint-border)] bg-[var(--red-tint-bg)] px-4 py-3 text-xs text-[var(--red-tint-text)]"
        >
          <AlertTriangle size={15} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <strong className="font-semibold text-[var(--red-tint-strong)]">Could not load image: </strong>
            {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
}
