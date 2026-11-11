import { APP_CONFIG } from "@/config/app";
import {
  createInitialHistory,
  historyReducer,
  type EditorHistoryState,
} from "@/lib/editor-utils";
import type {
  BlurStrength,
  BrowserCapabilities,
  DecodedImage,
  ExportResult,
  RedactionMode,
  RedactionRegion,
  SupportedImageMime,
} from "@/lib/image-engine";

export type ZoomSetting = "fit" | number;

export interface ActiveImageSession {
  file: File;
  mimeType: SupportedImageMime;
  byteSize: number;
  filename: string;
  decoded: DecodedImage;
}

export interface ExportSettingsState {
  outputMime: SupportedImageMime;
  quality: number;
  resizeWidth: string;
  resizeHeight: string;
  lockAspectRatio: boolean;
}

export interface EditorState {
  session: ActiveImageSession | null;
  history: EditorHistoryState;
  selectedRegionId: string | null;
  activeMode: RedactionMode;
  activeColor: string;
  activeBlurStrength: BlurStrength;
  zoom: ZoomSetting;
  capabilities: BrowserCapabilities;
  exportSettings: ExportSettingsState;
  isLoadingImage: boolean;
  intakeError: string | null;
  transientNotice: string | null;
  isExporting: boolean;
  exportError: string | null;
  exportResult: ExportResult | null;
}

export type EditorAction =
  | { type: "CAPABILITIES_DETECTED"; capabilities: BrowserCapabilities }
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; session: ActiveImageSession }
  | { type: "LOAD_FAILURE"; message: string }
  | { type: "CLEAR_SESSION" }
  | { type: "COMMIT_REGIONS"; next: RedactionRegion[]; selectId?: string | null }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET_REGIONS" }
  | { type: "SELECT_REGION"; id: string | null }
  | { type: "SET_MODE"; mode: RedactionMode }
  | { type: "SET_SOLID_COLOR"; color: string }
  | { type: "SET_BLUR_STRENGTH"; strength: BlurStrength }
  | { type: "SET_ZOOM"; zoom: ZoomSetting }
  | { type: "SET_OUTPUT_MIME"; mime: SupportedImageMime }
  | { type: "SET_QUALITY"; quality: number }
  | { type: "SET_RESIZE_WIDTH"; value: string }
  | { type: "SET_RESIZE_HEIGHT"; value: string }
  | { type: "TOGGLE_ASPECT_LOCK" }
  | { type: "RESET_DIMENSIONS" }
  | { type: "EXPORT_START" }
  | { type: "EXPORT_SUCCESS"; result: ExportResult }
  | { type: "EXPORT_FAILURE"; message: string }
  | { type: "CLEAR_EXPORT_RESULT" }
  | { type: "SET_TRANSIENT_NOTICE"; message: string | null }
  | { type: "CLEAR_INTAKE_ERROR" };

export function createInitialEditorState(): EditorState {
  return {
    session: null,
    history: createInitialHistory(),
    selectedRegionId: null,
    activeMode: APP_CONFIG.defaultRedactionMode,
    activeColor: APP_CONFIG.defaultSolidColor,
    activeBlurStrength: APP_CONFIG.defaultBlurStrength,
    zoom: "fit",
    capabilities: {
      supportsOffscreenCanvas: false,
      supportsWebWorkers: false,
      supportedExportMimes: ["image/jpeg", "image/png"],
    },
    exportSettings: {
      outputMime: "image/png",
      quality: APP_CONFIG.defaultLossyQuality,
      resizeWidth: "",
      resizeHeight: "",
      lockAspectRatio: true,
    },
    isLoadingImage: false,
    intakeError: null,
    transientNotice: null,
    isExporting: false,
    exportError: null,
    exportResult: null,
  };
}

function reconcileSelectedId(
  regions: readonly RedactionRegion[],
  currentSelectedId: string | null,
): string | null {
  if (!currentSelectedId) return null;
  return regions.some((r) => r.id === currentSelectedId) ? currentSelectedId : null;
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "CAPABILITIES_DETECTED": {
      const nextCaps = action.capabilities;
      let nextOutputMime = state.exportSettings.outputMime;
      if (!nextCaps.supportedExportMimes.includes(nextOutputMime)) {
        nextOutputMime = "image/png";
      } else if (
        state.session &&
        nextCaps.supportedExportMimes.includes(state.session.mimeType) &&
        state.transientNotice?.includes("defaulted output format")
      ) {
        nextOutputMime = state.session.mimeType;
      }

      return {
        ...state,
        capabilities: nextCaps,
        exportSettings: {
          ...state.exportSettings,
          outputMime: nextOutputMime,
        },
      };
    }

    case "LOAD_START":
      return {
        ...state,
        isLoadingImage: true,
        intakeError: null,
        exportError: null,
        transientNotice: null,
      };

    case "LOAD_SUCCESS": {
      const { session } = action;
      const defaultExportMime = state.capabilities.supportedExportMimes.includes(session.mimeType)
        ? session.mimeType
        : "image/png";

      const fallbackNotice =
        session.mimeType !== defaultExportMime
          ? `This browser does not support ${APP_CONFIG.mimeToLabel[session.mimeType]} export; defaulted output format to PNG.`
          : null;

      return {
        ...state,
        session,
        history: createInitialHistory(),
        selectedRegionId: null,
        zoom: "fit",
        exportSettings: {
          outputMime: defaultExportMime,
          quality: APP_CONFIG.defaultLossyQuality,
          resizeWidth: String(session.decoded.width),
          resizeHeight: String(session.decoded.height),
          lockAspectRatio: true,
        },
        isLoadingImage: false,
        intakeError: null,
        transientNotice: fallbackNotice,
        isExporting: false,
        exportError: null,
        exportResult: null,
      };
    }

    case "LOAD_FAILURE":
      return {
        ...state,
        isLoadingImage: false,
        intakeError: action.message,
      };

    case "CLEAR_SESSION":
      return {
        ...state,
        session: null,
        history: createInitialHistory(),
        selectedRegionId: null,
        zoom: "fit",
        exportSettings: {
          outputMime: "image/png",
          quality: APP_CONFIG.defaultLossyQuality,
          resizeWidth: "",
          resizeHeight: "",
          lockAspectRatio: true,
        },
        isLoadingImage: false,
        intakeError: null,
        transientNotice: null,
        isExporting: false,
        exportError: null,
        exportResult: null,
      };

    case "COMMIT_REGIONS": {
      const nextHistory = historyReducer(state.history, {
        type: "COMMIT",
        next: action.next,
      });
      const candidateId =
        action.selectId !== undefined ? action.selectId : state.selectedRegionId;
      return {
        ...state,
        history: nextHistory,
        selectedRegionId: reconcileSelectedId(nextHistory.present, candidateId),
      };
    }

    case "UNDO": {
      const nextHistory = historyReducer(state.history, { type: "UNDO" });
      if (nextHistory === state.history) return state;
      return {
        ...state,
        history: nextHistory,
        selectedRegionId: reconcileSelectedId(nextHistory.present, state.selectedRegionId),
      };
    }

    case "REDO": {
      const nextHistory = historyReducer(state.history, { type: "REDO" });
      if (nextHistory === state.history) return state;
      return {
        ...state,
        history: nextHistory,
        selectedRegionId: reconcileSelectedId(nextHistory.present, state.selectedRegionId),
      };
    }

    case "RESET_REGIONS": {
      const nextHistory = historyReducer(state.history, { type: "RESET_ALL" });
      return {
        ...state,
        history: nextHistory,
        selectedRegionId: null,
      };
    }

    case "SELECT_REGION":
      return {
        ...state,
        selectedRegionId: reconcileSelectedId(state.history.present, action.id),
      };

    case "SET_MODE": {
      const selected = state.history.present.find((r) => r.id === state.selectedRegionId);
      if (selected && selected.mode !== action.mode) {
        const nextRegions = state.history.present.map((r) =>
          r.id === selected.id ? { ...r, mode: action.mode } : r,
        );
        return {
          ...state,
          activeMode: action.mode,
          history: historyReducer(state.history, { type: "COMMIT", next: nextRegions }),
        };
      }
      return { ...state, activeMode: action.mode };
    }

    case "SET_SOLID_COLOR": {
      const selected = state.history.present.find((r) => r.id === state.selectedRegionId);
      if (selected && selected.mode === "solid" && selected.color !== action.color) {
        const nextRegions = state.history.present.map((r) =>
          r.id === selected.id ? { ...r, color: action.color } : r,
        );
        return {
          ...state,
          activeColor: action.color,
          history: historyReducer(state.history, { type: "COMMIT", next: nextRegions }),
        };
      }
      return { ...state, activeColor: action.color };
    }

    case "SET_BLUR_STRENGTH": {
      const selected = state.history.present.find((r) => r.id === state.selectedRegionId);
      if (selected && selected.mode === "blur" && selected.blurStrength !== action.strength) {
        const nextRegions = state.history.present.map((r) =>
          r.id === selected.id ? { ...r, blurStrength: action.strength } : r,
        );
        return {
          ...state,
          activeBlurStrength: action.strength,
          history: historyReducer(state.history, { type: "COMMIT", next: nextRegions }),
        };
      }
      return { ...state, activeBlurStrength: action.strength };
    }

    case "SET_ZOOM":
      return { ...state, zoom: action.zoom };

    case "SET_OUTPUT_MIME":
      return {
        ...state,
        exportError: null,
        exportSettings: { ...state.exportSettings, outputMime: action.mime },
      };

    case "SET_QUALITY":
      return {
        ...state,
        exportSettings: { ...state.exportSettings, quality: action.quality },
      };

    case "SET_RESIZE_WIDTH": {
      let nextHeight = state.exportSettings.resizeHeight;
      if (state.session && state.exportSettings.lockAspectRatio) {
        const parsed = Number(action.value);
        if (Number.isFinite(parsed) && parsed > 0) {
          const aspect = state.session.decoded.width / state.session.decoded.height;
          nextHeight = String(Math.max(1, Math.round(parsed / aspect)));
        }
      }
      return {
        ...state,
        exportSettings: {
          ...state.exportSettings,
          resizeWidth: action.value,
          resizeHeight: nextHeight,
        },
      };
    }

    case "SET_RESIZE_HEIGHT": {
      let nextWidth = state.exportSettings.resizeWidth;
      if (state.session && state.exportSettings.lockAspectRatio) {
        const parsed = Number(action.value);
        if (Number.isFinite(parsed) && parsed > 0) {
          const aspect = state.session.decoded.width / state.session.decoded.height;
          nextWidth = String(Math.max(1, Math.round(parsed * aspect)));
        }
      }
      return {
        ...state,
        exportSettings: {
          ...state.exportSettings,
          resizeWidth: nextWidth,
          resizeHeight: action.value,
        },
      };
    }

    case "TOGGLE_ASPECT_LOCK": {
      const nextLock = !state.exportSettings.lockAspectRatio;
      let nextHeight = state.exportSettings.resizeHeight;
      if (nextLock && state.session) {
        const parsedW = Number(state.exportSettings.resizeWidth);
        if (Number.isFinite(parsedW) && parsedW > 0) {
          const aspect = state.session.decoded.width / state.session.decoded.height;
          nextHeight = String(Math.max(1, Math.round(parsedW / aspect)));
        }
      }
      return {
        ...state,
        exportSettings: {
          ...state.exportSettings,
          lockAspectRatio: nextLock,
          resizeHeight: nextHeight,
        },
      };
    }

    case "RESET_DIMENSIONS": {
      if (!state.session) return state;
      return {
        ...state,
        exportSettings: {
          ...state.exportSettings,
          resizeWidth: String(state.session.decoded.width),
          resizeHeight: String(state.session.decoded.height),
        },
      };
    }

    case "EXPORT_START":
      return {
        ...state,
        isExporting: true,
        exportError: null,
      };

    case "EXPORT_SUCCESS":
      return {
        ...state,
        isExporting: false,
        exportError: null,
        exportResult: action.result,
      };

    case "EXPORT_FAILURE":
      return {
        ...state,
        isExporting: false,
        exportError: action.message,
      };

    case "CLEAR_EXPORT_RESULT":
      return {
        ...state,
        exportResult: null,
      };

    case "SET_TRANSIENT_NOTICE":
      return {
        ...state,
        transientNotice: action.message,
      };

    case "CLEAR_INTAKE_ERROR":
      return {
        ...state,
        intakeError: null,
      };

    default:
      return state;
  }
}

