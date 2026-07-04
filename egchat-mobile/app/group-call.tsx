/**
 * EGChat — Pantalla de llamada grupal
 * Muestra hasta 4 participantes en grid 2x2
 * Stream local en miniatura PiP
 */
import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import Svg, { Path, Polygon, Rect, Line } from 'react-native-svg';
import { EGAvatar } from '../src/components/ui';
import { useGroupCall } from '../src/hooks/useGroupCall';

const ACCENT = '#00c8a0';

export default function GroupCallScreen() {
  const {
    groupId, myUserId, participantIds, callType, participantNames,
  } = useLocalSearchParams<{
    groupId: string;
    myUserId: string;
    participantIds: string;   // JSON array
    callType: 'audio' | 'video';
    participantNames: string; // JSON Record<id, name>
  }>();

  const {
    participants, localStream, isActive,
    isMuted, isCamOff,
    startGroupCall, endGroupCall,
    toggleGroupMute, toggleGroupCamera,
    hasNativeWebRTC,
  } = useGroupCall();

  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const ids = JSON.parse(participantIds || '[]') as string[];
    const names: Record<string, string> = JSON.parse(participantNames || '{}');
    startGroupCall(groupId, myUserId, ids, callType as 'audio' | 'video')
      .then(() => {
        // Actualizar nombres
        // (se hace con updateParticipantInfo en producción)
      })
      .catch(() => router.back());

    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    return () => { clearInterval(timer); endGroupCall(); };
  }, []);

  const hangUp = useCallback(() => {
    endGroupCall();
    router.back();
  }, [endGroupCall]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const isVideo = callType === 'video';

  // Importar RTCView solo en nativo
  let RTCView: any = View;
  try {
    if (Platform.OS !== 'web') RTCView = require('react-native-webrtc').RTCView;
  } catch {}

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <SafeAreaView>
        <View style={s.header}>
          <Text style={s.title}>Llamada grupal</Text>
          <Text style={s.timer}>{fmt(duration)}</Text>
          <Text style={s.count}>{participants.length + 1} participantes</Text>
        </View>
      </SafeAreaView>

      {/* Grid de participantes */}
      <ScrollView contentContainerStyle={s.grid}>
        {/* Yo */}
        <View style={s.cell}>
          {isVideo && localStream ? (
            <RTCView streamURL={localStream.toURL?.()} style={s.cellVideo} objectFit="cover" mirror />
          ) : (
            <LinearGradient colors={['#00c8a0', '#00b4e6']} style={s.cellBg}>
              <Text style={s.cellInitials}>Yo</Text>
            </LinearGradient>
          )}
          <View style={s.cellLabel}><Text style={s.cellName}>Tú</Text></View>
          {isMuted && <View style={s.mutedBadge}><Text style={s.mutedIcon}>🔇</Text></View>}
        </View>

        {/* Otros participantes */}
        {participants.map(p => {
          const remoteUrl = p.stream?.toURL?.() || '';
          const initials = (p.name || p.userId).slice(0, 2).toUpperCase();
          return (
            <View key={p.userId} style={s.cell}>
              {isVideo && remoteUrl ? (
                <RTCView streamURL={remoteUrl} style={s.cellVideo} objectFit="cover" />
              ) : (
                <LinearGradient colors={['#667eea', '#764ba2']} style={s.cellBg}>
                  <Text style={s.cellInitials}>{initials}</Text>
                </LinearGradient>
              )}
              <View style={s.cellLabel}>
                <Text style={s.cellName} numberOfLines={1}>{p.name || p.userId}</Text>
              </View>
              {p.isAudioMuted && <View style={s.mutedBadge}><Text style={s.mutedIcon}>🔇</Text></View>}
            </View>
          );
        })}

        {/* Celdas vacías para completar el grid */}
        {participants.length < 3 && Array(3 - participants.length).fill(0).map((_, i) => (
          <View key={`empty_${i}`} style={[s.cell, s.emptyCell]}>
            <Text style={s.emptyIcon}>+</Text>
          </View>
        ))}
      </ScrollView>

      {/* Controles */}
      <SafeAreaView edges={['bottom']}>
        <View style={s.controls}>
          {/* Silenciar */}
          <TouchableOpacity style={[s.btn, isMuted && s.btnDanger]} onPress={toggleGroupMute}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
              {isMuted
                ? <><Line x1="1" y1="1" x2="23" y2="23"/><Path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><Path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><Line x1="12" y1="19" x2="12" y2="23"/><Line x1="8" y1="23" x2="16" y2="23"/></>
                : <><Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><Path d="M19 10v2a7 7 0 0 1-14 0v-2"/><Line x1="12" y1="19" x2="12" y2="23"/><Line x1="8" y1="23" x2="16" y2="23"/></>
              }
            </Svg>
          </TouchableOpacity>

          {/* Colgar */}
          <TouchableOpacity onPress={hangUp}>
            <LinearGradient colors={['#ff3b30', '#c0392b']} style={s.hangup}>
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="#fff">
                <Path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" transform="rotate(135 12 12)"/>
              </Svg>
            </LinearGradient>
          </TouchableOpacity>

          {/* Cámara (solo video) */}
          {isVideo && (
            <TouchableOpacity style={[s.btn, isCamOff && s.btnDanger]} onPress={toggleGroupCamera}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
                {isCamOff
                  ? <><Line x1="1" y1="1" x2="23" y2="23"/><Path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/></>
                  : <><Polygon points="23 7 16 12 23 17 23 7"/><Rect x="1" y="5" width="15" height="14" rx="2"/></>
                }
              </Svg>
            </TouchableOpacity>
          )}
        </View>

        {!hasNativeWebRTC && (
          <Text style={s.hint}>WebRTC nativo disponible con EAS Dev Client</Text>
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  header: { alignItems: 'center', paddingVertical: 12, gap: 2 },
  title: { fontSize: 16, fontWeight: '700', color: '#fff' },
  timer: { fontSize: 13, color: ACCENT, fontWeight: '600' },
  count: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: 8, gap: 6,
    justifyContent: 'center',
  },
  cell: {
    width: '48%', aspectRatio: 0.75,
    borderRadius: 16, overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1e293b',
  },
  cellVideo: { flex: 1 },
  cellBg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cellInitials: { fontSize: 36, fontWeight: '900', color: 'rgba(255,255,255,0.9)' },
  cellLabel: {
    position: 'absolute', bottom: 8, left: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  cellName: { fontSize: 12, color: '#fff', fontWeight: '600', textAlign: 'center' },
  mutedBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10,
    padding: 3,
  },
  mutedIcon: { fontSize: 12 },
  emptyCell: {
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  emptyIcon: { fontSize: 28, color: 'rgba(255,255,255,0.2)', fontWeight: '200' },
  controls: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 28,
    paddingVertical: 16, paddingHorizontal: 24,
  },
  btn: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  btnDanger: { backgroundColor: 'rgba(239,68,68,0.3)', borderColor: 'rgba(239,68,68,0.5)' },
  hangup: {
    width: 66, height: 66, borderRadius: 33,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ff3b30', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 12,
  },
  hint: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 11, paddingBottom: 8 },
});
