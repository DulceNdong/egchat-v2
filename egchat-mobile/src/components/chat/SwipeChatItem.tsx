/**
 * SwipeChatItem — Swipe actions estilo WhatsApp
 * Izquierda: No leído / Desarchivar
 * Derecha: Silenciar → Archivar → Eliminar
 * Con iconos SVG, colores limpios y haptics
 */
import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Svg, { Path, Line, Rect, Polyline, Circle } from 'react-native-svg';
import { haptics } from '../../hooks/useHaptics';

interface Props {
  onOpen: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMute?: () => void;
  onMarkUnread?: () => void;
  onUnarchive?: () => void;
  isArchived?: boolean;
  isMuted?: boolean;
  children: React.ReactNode;
}

const ACTION_WIDTH = 72;

export function SwipeChatItem({
  onOpen, onArchive, onDelete, onMute, onMarkUnread,
  onUnarchive, isArchived, isMuted, children,
}: Props) {
  const ref = useRef<Swipeable>(null);
  const close = () => ref.current?.close();

  // ── Acciones izquierda ─────────────────────────────────────────
  const renderLeft = (progress: Animated.AnimatedInterpolation<number>) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1], outputRange: [-ACTION_WIDTH, 0],
    });
    return (
      <Animated.View style={[s.leftWrap, { transform: [{ translateX }] }]}>
        {!isArchived ? (
          <TouchableOpacity
            style={[s.action, { backgroundColor: '#2563eb' }]}
            onPress={() => { haptics.light(); close(); onMarkUnread?.(); }}
            activeOpacity={0.85}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <Circle cx="9" cy="10" r="1" fill="#fff" stroke="none"/>
              <Circle cx="12" cy="10" r="1" fill="#fff" stroke="none"/>
              <Circle cx="15" cy="10" r="1" fill="#fff" stroke="none"/>
            </Svg>
            <Text style={s.actionLabel}>No leído</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.action, { backgroundColor: '#059669' }]}
            onPress={() => { haptics.light(); close(); onUnarchive?.(); }}
            activeOpacity={0.85}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="20 9 20 20 4 20 4 9"/>
              <Polyline points="9 12 12 9 15 12"/>
              <Line x1="12" y1="9" x2="12" y2="20"/>
              <Polyline points="1 9 2.2 2 21.8 2 23 9"/>
              <Line x1="1" y1="9" x2="23" y2="9"/>
            </Svg>
            <Text style={s.actionLabel}>Restaurar</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  // ── Acciones derecha ───────────────────────────────────────────
  const renderRight = (progress: Animated.AnimatedInterpolation<number>) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1], outputRange: [ACTION_WIDTH * 3, 0],
    });
    return (
      <Animated.View style={[s.rightWrap, { transform: [{ translateX }] }]}>
        {/* Silenciar */}
        <TouchableOpacity
          style={[s.action, { backgroundColor: '#6b7280' }]}
          onPress={() => { haptics.light(); close(); onMute?.(); }}
          activeOpacity={0.85}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
            stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            {isMuted ? (
              <>
                <Path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <Line x1="23" y1="9" x2="17" y2="15"/>
                <Line x1="17" y1="9" x2="23" y2="15"/>
              </>
            ) : (
              <>
                <Path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <Path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                <Path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </>
            )}
          </Svg>
          <Text style={s.actionLabel}>{isMuted ? 'Activar' : 'Silenciar'}</Text>
        </TouchableOpacity>

        {/* Archivar */}
        <TouchableOpacity
          style={[s.action, { backgroundColor: '#f59e0b' }]}
          onPress={() => { haptics.medium(); close(); onArchive(); }}
          activeOpacity={0.85}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
            stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="21 8 21 21 3 21 3 8"/>
            <Rect x="1" y="3" width="22" height="5"/>
            <Line x1="10" y1="12" x2="14" y2="12"/>
          </Svg>
          <Text style={s.actionLabel}>Archivar</Text>
        </TouchableOpacity>

        {/* Eliminar */}
        <TouchableOpacity
          style={[s.action, { backgroundColor: '#ef4444' }]}
          onPress={() => { haptics.heavy(); close(); onDelete(); }}
          activeOpacity={0.85}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
            stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="3 6 5 6 21 6"/>
            <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </Svg>
          <Text style={s.actionLabel}>Eliminar</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={ref}
      renderLeftActions={renderLeft}
      renderRightActions={renderRight}
      overshootLeft={false}
      overshootRight={false}
      friction={1.5}
      leftThreshold={60}
      rightThreshold={40}
    >
      <TouchableOpacity onPress={() => { haptics.selection(); onOpen(); }}
        activeOpacity={0.75} style={s.row}>
        {children}
      </TouchableOpacity>
    </Swipeable>
  );
}

const s = StyleSheet.create({
  row: { backgroundColor: '#fff' },
  leftWrap: { width: ACTION_WIDTH },
  rightWrap: { flexDirection: 'row', width: ACTION_WIDTH * 3 },
  action: {
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
});
