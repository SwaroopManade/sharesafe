import { decodeSourceImage, renderAndExportImage } from "@/lib/image-engine/pipeline";
import { ImageEngineError, type ExportOptions, type RedactionRegion } from "@/lib/image-engine/types";

export interface WorkerExportRequest {
  id: string;
  file: Blob;
  originalFilename?: string;
  regions: RedactionRegion[];
  exportOptions: ExportOptions;
}

export interface WorkerExportSuccess {
  id: string;
  ok: true;
  blob: Blob;
  mimeType: ExportOptions["outputMime"];
  width: number;
  height: number;
  byteSize: number;
  filename: string;
  alphaFlattenedToBackground: boolean;
}

export interface WorkerExportFailure {
  id: string;
  ok: false;
  code: string;
  message: string;
}

export type WorkerExportResponse = WorkerExportSuccess | WorkerExportFailure;

const workerGlobal = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerExportRequest>) => void) | null;
  postMessage: (message: WorkerExportResponse) => void;
};

workerGlobal.onmessage = async (event: MessageEvent<WorkerExportRequest>) => {
  const { id, file, originalFilename, regions, exportOptions } = event.data;
  let decoded: Awaited<ReturnType<typeof decodeSourceImage>> | null = null;

  try {
    decoded = await decodeSourceImage(file);
    const result = await renderAndExportImage({
      source: decoded.source,
      sourceWidth: decoded.width,
      sourceHeight: decoded.height,
      originalFilename,
      regions,
      exportOptions,
    });

    workerGlobal.postMessage({
      id,
      ok: true,
      ...result,
    });
  } catch (err) {
    const code = err instanceof ImageEngineError ? err.code : "EXPORT_FAILED";
    const message = err instanceof Error ? err.message : "Export failed inside worker.";
    workerGlobal.postMessage({
      id,
      ok: false,
      code,
      message,
    });
  } finally {
    decoded?.release();
  }
};

