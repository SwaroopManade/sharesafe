import { decodeSourceImage, renderAndExportImage } from "@/lib/image-engine/pipeline";
import {
  ImageEngineError,
  type ExportOptions,
  type ExportResult,
  type ImageEngineErrorCode,
  type RedactionRegion,
} from "@/lib/image-engine/types";
import type { WorkerExportRequest, WorkerExportResponse } from "@/lib/image-engine/image.worker";

export interface ExportJobInput {
  file: Blob;
  originalFilename?: string;
  regions: readonly RedactionRegion[];
  exportOptions: ExportOptions;
}

function canUseExportWorker(): boolean {
  return typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined";
}

function runExportInWorker(input: ExportJobInput): Promise<ExportResult> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./image.worker.ts", import.meta.url), { type: "module" });
    } catch (err) {
      reject(err);
      return;
    }

    const requestId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const cleanup = () => {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    };

    worker.onmessage = (event: MessageEvent<WorkerExportResponse>) => {
      const payload = event.data;
      if (payload.id !== requestId) return;
      cleanup();

      if (payload.ok) {
        resolve({
          blob: payload.blob,
          mimeType: payload.mimeType,
          width: payload.width,
          height: payload.height,
          byteSize: payload.byteSize,
          filename: payload.filename,
          alphaFlattenedToBackground: payload.alphaFlattenedToBackground,
        });
      } else {
        reject(new ImageEngineError(payload.code as ImageEngineErrorCode, payload.message));
      }
    };

    worker.onerror = () => {
      cleanup();
      reject(new Error("Worker execution error"));
    };

    const request: WorkerExportRequest = {
      id: requestId,
      file: input.file,
      originalFilename: input.originalFilename,
      regions: [...input.regions],
      exportOptions: input.exportOptions,
    };

    worker.postMessage(request);
  });
}

/**
 * Run image flattening and re-encoding in a Web Worker + OffscreenCanvas when supported,
 * seamlessly falling back to the main-thread Canvas pipeline when unavailable.
 */
export async function exportImageOffMainThreadOrFallback(input: ExportJobInput): Promise<ExportResult> {
  if (canUseExportWorker()) {
    try {
      return await runExportInWorker(input);
    } catch (err) {
      // Domain errors from the engine (format, dimensions, etc.) should surface directly
      if (err instanceof ImageEngineError) {
        throw err;
      }
      // Infrastructure / worker instantiation failures fall back cleanly to main thread
    }
  }

  const decoded = await decodeSourceImage(input.file);
  try {
    return await renderAndExportImage({
      source: decoded.source,
      sourceWidth: decoded.width,
      sourceHeight: decoded.height,
      originalFilename: input.originalFilename,
      regions: input.regions,
      exportOptions: input.exportOptions,
    });
  } finally {
    decoded.release();
  }
}

