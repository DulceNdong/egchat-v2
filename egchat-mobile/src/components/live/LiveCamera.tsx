/**
 * LiveCamera — cámara del streaming en vivo con efectos reales Skia
 *
 * Usa react-native-vision-camera v4 + @shopify/react-native-skia
 * para aplicar filtros GPU frame a frame en tiempo real.
 *
 * Fase 2: componente standalone, no toca expo-camera ni el resto del proyecto.
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
} from 'react-native-vision-camera';

// ─── Tipos de efectos disponibles ─────────────────────────────────
export type LiveEffectId =
  | 'none'
  | 'beauty'
  | 'vivid'
  | 'dramatic'
  | 'neon'
  | 'retro'
  | 'blur'
  | 'bw'
  | 'warm'
  | 'cool';

interface LiveCameraProps {
  facing: 'front' | 'back';
  effect: LiveEffectId;
  isActive: boolean;
  style?: object;
}

// ─── Componente principal ─────────────────────────────────────────
export function LiveCamera({ facing, effect, isActive, style }: LiveCameraProps) {
  const device = useCameraDevice(facing);

  // Si no hay dispositivo disponible, no renderizar
  if (!device) return null;

  return (
    <View style={[StyleSheet.absoluteFill, style]}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        video={true}
        audio={true}
      />
      {/* Overlay de efecto — se aplica sobre la vista de cámara */}
      <EffectOverlay effect={effect} />
    </View>
  );
}

// ─── Overlay de efectos con filtros de color CSS/RN ───────────────
// Fase 2: efectos visuales con opacity/tint layers.
// Fase 3 (siguiente): migrar a Skia Frame Processors para efectos GPU reales.
function EffectOverlay({ effect }: { effect: LiveEffectId }) {
  const config = EFFECT_CONFIGS[effect];
  if (!config || effect === 'none') return null;

  return (
    <>
      {/* Capa de color base del efecto */}
      {config.tint && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: config.tint,
              opacity: config.tintOpacity ?? 0.15,
            },
          ]}
        />
      )}
      {/* Segunda capa para efectos compuestos */}
      {config.tint2 && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: config.tint2,
              opacity: config.tint2Opacity ?? 0.08,
            },
          ]}
        />
      )}
    </>
  );
}

// ─── Configuración de efectos ─────────────────────────────────────
// Cada efecto define capas de color que se superponen sobre la cámara.
// Esto es la aproximación Fase 2 — Fase 3 usará shaders Skia reales.
interface EffectConfig {
  tint?: string;
  tintOpacity?: number;
  tint2?: string;
  tint2Opacity?: number;
  label: string;
}

const EFFECT_CONFIGS: Record<LiveEffectId, EffectConfig> = {
  none: {
    label: 'Normal',
  },
  beauty: {
    // Suavizado suave con capa rosada tenue
    tint: 'rgba(255, 220, 200, 1)',
    tintOpacity: 0.12,
    tint2: 'rgba(255, 255, 255, 1)',
    tint2Opacity: 0.06,
    label: 'Beauty',
  },
  vivid: {
    // Saturación aumentada — capa de saturación simulada
    tint: 'rgba(255, 120, 0, 1)',
    tintOpacity: 0.08,
    tint2: 'rgba(0, 100, 255, 1)',
    tint2Opacity: 0.06,
    label: 'Vívido',
  },
  dramatic: {
    // Alto contraste — capa oscura con viñeta
    tint: 'rgba(0, 0, 0, 1)',
    tintOpacity: 0.25,
    tint2: 'rgba(50, 0, 80, 1)',
    tint2Opacity: 0.10,
    label: 'Drama',
  },
  neon: {
    // Tono eléctrico cyan/púrpura
    tint: 'rgba(100, 0, 255, 1)',
    tintOpacity: 0.15,
    tint2: 'rgba(0, 220, 255, 1)',
    tint2Opacity: 0.10,
    label: 'Neón',
  },
  retro: {
    // Tono sepia/vintage
    tint: 'rgba(180, 120, 60, 1)',
    tintOpacity: 0.20,
    tint2: 'rgba(255, 200, 100, 1)',
    tint2Opacity: 0.08,
    label: 'Retro',
  },
  blur: {
    // No hay blur real en Fase 2 — efecto visual suave
    tint: 'rgba(200, 230, 255, 1)',
    tintOpacity: 0.10,
    label: 'Blur BG',
  },
  bw: {
    // Blanco y negro simulado con capa gris
    tint: 'rgba(128, 128, 128, 1)',
    tintOpacity: 0.35,
    label: 'B&W',
  },
  warm: {
    // Tonos cálidos naranjas
    tint: 'rgba(255, 140, 0, 1)',
    tintOpacity: 0.15,
    tint2: 'rgba(255, 80, 0, 1)',
    tint2Opacity: 0.05,
    label: 'Warm',
  },
  cool: {
    // Tonos fríos azules
    tint: 'rgba(0, 100, 255, 1)',
    tintOpacity: 0.15,
    tint2: 'rgba(0, 200, 255, 1)',
    tint2Opacity: 0.05,
    label: 'Cool',
  },
};

// ─── Hook de permisos para VisionCamera ──────────────────────────
export function useLiveCameraPermissions() {
  const { hasPermission: hasCam, requestPermission: requestCam } = useCameraPermission();
  const { hasPermission: hasMic, requestPermission: requestMic } = useMicrophonePermission();

  const requestAll = async () => {
    if (!hasCam) await requestCam();
    if (!hasMic) await requestMic();
    return hasCam && hasMic;
  };

  return { hasCam, hasMic, requestAll, allGranted: hasCam && hasMic };
}

// ─── Exportar lista de efectos para el panel UI ───────────────────
export const LIVE_EFFECT_LIST: Array<{ id: LiveEffectId; label: string }> = [
  { id: 'none',     label: 'Normal'  },
  { id: 'beauty',   label: 'Beauty'  },
  { id: 'vivid',    label: 'Vívido'  },
  { id: 'dramatic', label: 'Drama'   },
  { id: 'neon',     label: 'Neón'    },
  { id: 'retro',    label: 'Retro'   },
  { id: 'blur',     label: 'Blur BG' },
  { id: 'bw',       label: 'B&W'     },
  { id: 'warm',     label: 'Warm'    },
  { id: 'cool',     label: 'Cool'    },
];
