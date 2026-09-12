// ══════════════════════════════════════════════════════════════════
// FloatingCallBar — Mini barra de llamada activa (PiP global)
// Se muestra encima de cualquier pantalla cuando isPip=true
// ══════════════════════════════════════════════════════════════════
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { EGAvatar } from '../ui';
import { useActiveCall } from '../../context/ActiveCallContext';

function formatDur(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;
}

// Iconos inline
const MicIcon = ({ off }: { off?: boolean }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
    {off && <Line x1="1" y1="1" x2="23" y2="23"/>}
    <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <Line x1="12" y1="19" x2="12" y2="23"/>
    <Line x1="8" y1="23" x2="16" y2="23"/>
  </Svg>
);

const HangupIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="#fff">
    <Path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" transform="rotate(135 12 12)"/>
  </Svg>
);

const ExpandIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
    <Path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
  </Svg>
);

export function FloatingCallBar() {
  const { activeCall, isPip, setIsPip } = useActiveCall();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isPip && activeCall ? 0 : -80,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [isPip, activeCall]);

  if (!activeCall) return null;

  const expandCall = () => {
    setIsPip(false);
    router.push({
      pathname: '/call/[callId]',
      params: {
        callId: activeCall.callId,
        targetName: activeCall.targetName,
        targetAvatar: activeCall.targetAvatar || '',
        callType: activeCall.callType,
        role: 'callee',
      },
    } as any);
  };

  return (
    <Animated.View
      style={[
        s.bar,
        { top: insets.top + 10, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Fondo glassmorphism */}
      <View style={s.bgBlur}/>

      {/* Avatar */}
      <EGAvatar src={activeCall.targetAvatar} name={activeCall.targetName} size={36}/>

      {/* Info */}
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{activeCall.targetName}</Text>
        <View style={s.statusRow}>
          <View style={s.greenDot}/>
          <Text style={s.status}>
            {activeCall.duration > 0 ? `En llamada · ${formatDur(activeCall.duration)}` : 'Conectando...'}
          </Text>
        </View>
      </View>

      {/* Botones */}
      <TouchableOpacity style={s.iconBtn} onPress={() => {}} activeOpacity={0.8}>
        <MicIcon/>
      </TouchableOpacity>

      <TouchableOpacity style={s.hangupBtn} onPress={() => {}} activeOpacity={0.85}>
        <HangupIcon/>
      </TouchableOpacity>

      <TouchableOpacity style={s.expandBtn} onPress={expandCall} activeOpacity={0.8}>
        <ExpandIcon/>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute', left: 12, right: 12, zIndex: 9999,
    height: 62, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, gap: 8,
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 16, elevation: 24,
  },
  bgBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12,12,38,0.92)',
    borderRadius: 18,
  },
  info: { flex: 1, justifyContent: 'center' },
  name: { color: '#fff', fontSize: 13, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  status: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  hangupBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ef4444', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, shadowRadius: 6, elevation: 8,
  },
  expandBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
});
