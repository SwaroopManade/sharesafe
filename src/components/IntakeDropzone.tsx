"use client";

import { useRef, useState } from "react";
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
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          isDragOver
            ? "border-emerald-400 bg-emerald-500/10"
            : "border-zinc-700 bg-zinc-900/70 hover:border-zinc-500"
        }`}
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

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-white">
          {isLoading ? "Decoding image locally..." : "Select, drop, or paste an image"}
        </h2>
        <p className="mt-1.5 max-w-md text-sm text-zinc-300">
          Your file stays on your device. Nothing is uploaded to a server during editing or export.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => inputRef.current?.click()}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            {isLoading ? "Processing..." : "Choose Image"}
          </button>

          {onPasteRequest && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onPasteRequest}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              Paste from Clipboard
            </button>
          )}
        </div>

        <p className="mt-5 text-xs text-zinc-400">
          Supported: <span className="text-zinc-200">JPEG, PNG, static WebP</span> · Max{" "}
          <span className="text-zinc-200">{maxMb} MB</span> · Max{" "}
          <span className="text-zinc-200">{maxMp} MP</span> · Or press{" "}
          <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-200">
            Ctrl/⌘ + V
          </kbd>
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          <strong className="font-semibold text-rose-100">Could not load image: </strong>
          {errorMessage}
        </div>
      )}
    </div>
  );
}

