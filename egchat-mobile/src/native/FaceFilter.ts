/**
 * EGChat — Face Filters AR
 * Android: ML Kit Face Detection
 * iOS:     Vision Framework + ARKit
 *
 * Devuelve landmarks faciales (posición de ojos, nariz, boca)
 * para que el componente FaceFilterOverlay los use para renderizar
 * filtros SVG superpuestos en el stream de cámara.
 *
 * Uso en videollamada:
 *   const { faces, detectFrame } = useFaceFilter();
 *   // Llamar detectFrame(base64jpeg) en cada frame
 *   // Renderizar <FaceFilterOverlay faces={faces} filterId="glasses" />
 */
import { NativeModules, Platform } from 'react-native';

const { EGChatFaceFilter } = NativeModules;
const isAvailable = !!EGChatFaceFilter && Platform.OS !== 'web';

export interface FaceLandmarks {
  nose?:      { x: number; y: number };
  leftEye?:   { x: number; y: number };
  rightEye?:  { x: number; y: number };
  mouth?:     { x: number; y: number };
  leftBrow?:  { x: number; y: number };
  rightBrow?: { x: number; y: number };
  mouthLeft?:  { x: number; y: number };
  mouthRight?: { x: number; y: number };
}

export interface FaceData {
  x: number; y: number;
  width: number; height: number;
  headEulerX?: number;
  headEulerY?: number;
  headEulerZ?: number;
  smileProb?: number;
  leftEyeOpenProb?: number;
  rightEyeOpenProb?: number;
  landmarks: FaceLandmarks;
  trackingId?: number;
}

export const FaceFilter = {
  isAvailable,

  async initialize(): Promise<boolean> {
    if (!isAvailable) return false;
    try { return await EGChatFaceFilter.initialize(); }
    catch { return false; }
  },

  async detectFaces(base64Frame: string): Promise<FaceData[]> {
    if (!isAvailable) return [];
    try { return await EGChatFaceFilter.detectFacesInImage(base64Frame); }
    catch { return []; }
  },

  release() {
    if (!isAvailable) return;
    EGChatFaceFilter.releaseDetector?.();
  },
};

// ── IDs de filtros disponibles ────────────────────────────────────
export type FilterId =
  | 'none'
  | 'glasses'       // Gafas de sol SVG
  | 'hat'           // Sombrero
  | 'bunny_ears'    // Orejas de conejo
  | 'crown'         // Corona
  | 'mustache'      // Bigote
  | 'blur_bg';      // Fondo difuminado

export const FILTERS: Array<{ id: FilterId; label: string; emoji: string }> = [
  { id: 'none',       label: 'Sin filtro',  emoji: '🚫' },
  { id: 'glasses',    label: 'Gafas',       emoji: '🕶️' },
  { id: 'hat',        label: 'Sombrero',    emoji: '🎩' },
  { id: 'bunny_ears', label: 'Conejito',    emoji: '🐰' },
  { id: 'crown',      label: 'Corona',      emoji: '👑' },
  { id: 'mustache',   label: 'Bigote',      emoji: '👨' },
];
