// ══════════════════════════════════════════════════════════════════
// FloatingCallBar — Barra flotante de llamada activa (PiP interno)
//
// DISEÑO: rectangular, horizontal, compacta, oscura con glassmorphism
// POSICIÓN: anclada en la parte superior debajo del safe area
// VISIBILIDAD: solo cuando isPip=true (uiState === 'minimized')
//
// ARQUITECTURA:
//   - La llamada vive en CallManager (singleton, fuera de React)
//   - Esta barra es solo UI — no tiene estado de llamada propio
//   - "Expandir" no navega con router.back() (frágil) sino con
//     router.push() a la ruta de llamada con el callId actual,
//     lo que garantiza que se abre aunque el stack haya cambiado
//
// PiP NATIVO (evaluación):
//   iOS:  AVPictureInPictureController — requiere entitlements
//         adicionales y AVSampleBufferDisplayLayer. Complejidad alta.
//         No implementado en esta fase.
//   Android: PictureInPicture Activity mode — requiere android:
//            supportsPictureInPicture="true" y API 26+.
//            Complejidad media. No implementado en esta fase.
//   → Se usa PiP interno (esta barra) como solución completa.
// ══════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Line, Polygon } from 'react-native-svg';
import { RTCView } from '../../hooks/useWebRTC';
import { useActiveCall } from '../../context/ActiveCallContext';

const { width: SW } = Dimensions.get('window');

// ── Formatear duración ────────────────────────────────────────────
function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

// ── Iconos SVG inline (sin dependencias externas) ─────────────────
const MicIcon = ({ muted }: { muted: boolean }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none"
    stroke={muted ? '#f87171' : 'rgba(255,255,255,0.9)'} strokeWidth={2} strokeLinecap="round">
    {muted && <Line x1="1" y1="1" x2="23" y2="23" />}
    <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <Line x1="12" y1="19" x2="12" y2="23" />
    <Line x1="8"  y1="23" x2="16" y2="23" />
  </Svg>
);

const EndIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="#fff">
    <Path
      d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"
      transform="rotate(135 12 12)"
    />
  </Svg>
);

const ChevronUpIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none"
    stroke="rgba(255,255,255,0.7)" strokeWidth={2.5} strokeLinecap="round">
    <Path d="M18 15 12 9 6 15" />
  </Svg>
);

const VideoIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none"
    stroke="rgba(0,200,160,0.9)" strokeWidth={2} strokeLinecap="round">
    <Polygon points="23 7 16 12 23 17 23 7" />
    <Path d="M1 5h15v14H1z" strokeLinejoin="round" />
  </Svg>
);

// ════════════════════════════════════════════════════════════════════
export function FloatingCallBar() {
  const {
    callState, activeCall, isPip,
    expandCall, endCall, toggleMute,
  } = useActiveCall();

  const insets    = useSafeAreaInsets();

  // ── Animaciones ───────────────────────────────────────────────
  // slideY: entra desde arriba (-BAR_H) cuando visible, sale hacia arriba
  const BAR_H    = 56;
  const slideAnim = useRef(new Animated.Value(-(BAR_H + 20))).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;

  const visible = isPip && activeCall !== null && callState.commState !== 'idle';

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0, useNativeDriver: true,
          tension: 70, friction: 11,
        }),
        Animated.timing(opacAnim, {
          toValue: 1, duration: 200, useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -(BAR_H + 20), duration: 220, useNativeDriver: true,
        }),
        Animated.timing(opacAnim, {
          toValue: 0, duration: 180, useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // ── Expandir — navegar de vuelta a la pantalla de llamada ─────
  // Usa router.push con el callId actual para garantizar que funciona
  // independientemente de cuántas pantallas haya navegado el usuario.
  // expandCall() cambia UIState a 'full' en el manager.
  const handleExpand = useCallback(() => {
    if (!activeCall) return;
    expandCall();
    router.push({
      pathname: '/call/[callId]',
      params: {
        callId:       activeCall.callId,
        targetName:   activeCall.targetName,
        targetAvatar: activeCall.targetAvatar || '',
        callType:     activeCall.callType,
        role:         activeCall.role || 'caller',
        chatId:       activeCall.chatId || '',
      },
    } as any);
  }, [activeCall, expandCall]);

  const handleEnd   = useCallback(() => endCall(),    [endCall]);
  const handleMute  = useCallback(() => toggleMute(), [toggleMute]);

  // ── Nada que mostrar ──────────────────────────────────────────
  if (!activeCall) return null;

  const isMuted        = callState.isMuted;
  const isVideo        = activeCall.callType === 'video';
  const duration       = activeCall.duration;
  const isReconnecting = callState.commState === 'reconnecting';
  const remoteStream   = callState.remoteStream;
  const remoteUrl      = isVideo && remoteStream
    ? (remoteStream as any).toURL?.() || null
    : null;

  // ── Posición: top area debajo del status bar + 8px margen ────
  const topPosition = insets.top + 8;

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        s.wrapper,
        {
          top:       topPosition,
          height:    BAR_H,
          opacity:   opacAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* ── Fondo glassmorphism ───────────────────────────────── */}
      <View style={s.bg} />

      {/* ── Thumbnail video (si hay videollamada activa) ─────── */}
      {isVideo && remoteUrl && (
        <View style={s.videoThumb}>
          <RTCView
            streamURL={remoteUrl}
            style={StyleSheet.absoluteFill}
            objectFit="cover"
            mirror={false}
          />
          <View style={s.videoOverlay} />
        </View>
      )}

      {/* ── Toque en el área de info → expandir ─────────────── */}
      <TouchableOpacity
        style={s.infoArea}
        onPress={handleExpand}
        activeOpacity={0.75}
      >
        {/* Icono tipo de llamada */}
        <View style={s.callTypeIcon}>
          {isVideo ? <VideoIcon /> : (
            <View style={s.audioWave}>
              {[3,5,8,5,3].map((h, i) => (
                <View key={i} style={[s.waveBar, { height: h * 2 }]} />
              ))}
            </View>
          )}
        </View>

        {/* Nombre + estado */}
        <View style={s.textBlock}>
          <Text style={s.nameText} numberOfLines={1}>{activeCall.targetName}</Text>
          <View style={s.statusRow}>
            <View style={[
              s.statusDot,
              { backgroundColor: isReconnecting ? '#f59e0b' : '#4ade80' },
            ]} />
            <Text style={s.statusText} numberOfLines={1}>
              {isReconnecting
                ? 'Reconectando...'
                : duration > 0
                  ? fmt(duration)
                  : 'Conectando...'}
            </Text>
          </View>
        </View>

        {/* Flecha expandir — hint visual */}
        <View style={s.expandHint}>
          <ChevronUpIcon />
        </View>
      </TouchableOpacity>

      {/* ── Separador vertical ───────────────────────────────── */}
      <View style={s.divider} />

      {/* ── Botón micrófono ───────────────────────────────────── */}
      <TouchableOpacity
        style={[s.actionBtn, isMuted && s.actionBtnMuted]}
        onPress={handleMute}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <MicIcon muted={isMuted} />
      </TouchableOpacity>

      {/* ── Botón colgar ─────────────────────────────────────── */}
      <TouchableOpacity
        style={s.endBtn}
        onPress={handleEnd}
        activeOpacity={0.75}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <EndIcon />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ════════════════════════════════════════════════════════════════════
// ESTILOS
// ════════════════════════════════════════════════════════════════════
const RADIUS     = 16;
const SIDE_PAD   = 10;

const s = StyleSheet.create({
  wrapper: {
    position:   'absolute',
    left:       10,
    right:      10,
    zIndex:     9999,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS,
    overflow:   'hidden',
    // Sombra
    ...Platform.select({
      ios: {
        shadowColor:   '#000',
        shadowOffset:  { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius:  14,
      },
      android: {
        elevation: 20,
      },
    }),
  },

  // Fondo oscuro translúcido
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,28,0.93)',
    borderRadius:    RADIUS,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.10)',
  },

  // Thumbnail de video en el extremo izquierdo
  videoThumb: {
    width:    52,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  // Área central (toca para expandir)
  infoArea: {
    flex:          1,
    flexDirection: 'row',
    alignItems:    'center',
    paddingLeft:   SIDE_PAD,
    paddingRight:  4,
    alignSelf:     'stretch',
  },

  // Icono izquierdo (audio wave o video icon)
  callTypeIcon: {
    width:  22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  audioWave: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           2,
  },
  waveBar: {
    width:         2.5,
    borderRadius:  2,
    backgroundColor: 'rgba(0,200,160,0.8)',
  },

  // Bloque de texto
  textBlock: {
    flex:          1,
    justifyContent: 'center',
  },
  nameText: {
    color:      '#fff',
    fontSize:   13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginTop:     2,
  },
  statusDot: {
    width:        5,
    height:       5,
    borderRadius: 3,
  },
  statusText: {
    color:    'rgba(255,255,255,0.5)',
    fontSize: 11,
  },

  // Hint de expansión
  expandHint: {
    paddingHorizontal: 4,
    opacity: 0.6,
  },

  // Separador
  divider: {
    width:           1,
    height:          28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 4,
  },

  // Botones de acción
  actionBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems:      'center',
    justifyContent:  'center',
    marginHorizontal: 3,
  },
  actionBtnMuted: {
    backgroundColor: 'rgba(239,68,68,0.25)',
  },
  endBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: '#dc2626',
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     SIDE_PAD,
    marginLeft:      3,
    ...Platform.select({
      ios: {
        shadowColor:   '#dc2626',
        shadowOffset:  { width: 0, height: 2 },
        shadowOpacity: 0.55,
        shadowRadius:  5,
      },
      android: { elevation: 6 },
    }),
  },
});
