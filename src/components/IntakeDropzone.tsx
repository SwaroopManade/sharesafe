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
        className="relative flex min-h-[54vh] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2e2e2e] bg-[#111111] px-6 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.5)] transition-all duration-200 hover:border-[#3d3d3d] data-[drag-over=true]:border-[#166534] data-[drag-over=true]:bg-[#052e16]"
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

        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#2e2e2e] bg-[#1a1a1a] shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
          {isLoading ? (
            <Loader2 size={28} strokeWidth={1.5} className="animate-spin text-[#4ade80]" aria-hidden="true" />
          ) : (
            <Upload size={28} strokeWidth={1.5} className="text-[#4ade80]" aria-hidden="true" />
          )}
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-[#f5f5f5]">
          {isLoading ? "Decoding image locally..." : "Drop your image here"}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#a3a3a3]">
          Or choose a file from your device. Everything runs in browser memory — nothing ever
          leaves this tab.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-all duration-150 hover:bg-[#16a34a] hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
          >
            <Upload size={16} strokeWidth={1.75} aria-hidden="true" />
            {isLoading ? "Processing..." : "Choose Image"}
          </button>

          {onPasteRequest && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onPasteRequest}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2e2e2e] bg-[#1a1a1a] px-4 py-2.5 text-sm font-medium text-[#a3a3a3] transition-all duration-150 hover:border-[#3d3d3d] hover:bg-[#242424] hover:text-[#f5f5f5] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22c55e]"
            >
              <Clipboard size={15} strokeWidth={1.75} aria-hidden="true" />
              Paste from Clipboard
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-[#666666]">
          <span className="inline-flex items-center gap-1 text-[#4ade80]">
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
            <kbd className="rounded border border-[#2e2e2e] bg-[#1a1a1a] px-1.5 py-0.5 text-[11px] text-[#a3a3a3]">
              Ctrl/⌘ + V
            </kbd>
          </span>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="animate-banner-in flex items-start gap-2.5 rounded-lg border border-[#7f1d1d] bg-[#1f0a0a] px-4 py-3 text-xs text-[#f87171]"
        >
          <AlertTriangle size={15} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <strong className="font-semibold text-[#fca5a5]">Could not load image: </strong>
            {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
}
