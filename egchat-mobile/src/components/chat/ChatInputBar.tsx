// Barra de input — paridad App.tsx (#d1d3d9, send inline, emoji, mic)
import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';

export interface ChatInputBarProps {
  text: string;
  sending: boolean;
  showAttach: boolean;
  showEmojis: boolean;
  isRecording: boolean;
  durationFormatted: string;
  amplitude?: number;       // 0-32768 para el visualizador de onda
  sendScale: Animated.Value;
  onChangeText: (v: string) => void;
  onToggleAttach: () => void;
  onToggleEmojis: () => void;
  onToggleStickers?: () => void;
  onSend: () => void;
  onStartRecording: () => void;
  onCancelRecording: () => void;
  onStopRecording: () => void;
}

export function ChatInputBar({
  text,
  sending,
  showAttach,
  showEmojis,
  isRecording,
  durationFormatted,
  amplitude = 0,
  sendScale,
  onChangeText,
  onToggleAttach,
  onToggleEmojis,
  onToggleStickers,
  onSend,
  onStartRecording,
  onCancelRecording,
  onStopRecording,
}: ChatInputBarProps) {
  const hasText = !!text.trim();

  return (
    <View style={s.bar}>
      <TouchableOpacity style={s.plusBtn} onPress={onToggleAttach} activeOpacity={0.8}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
          stroke={showAttach ? '#00b4e6' : '#9ca3af'} strokeWidth={2.2} strokeLinecap="round">
          <Line x1="12" y1="5" x2="12" y2="19" />
          <Line x1="5" y1="12" x2="19" y2="12" />
        </Svg>
      </TouchableOpacity>

      <View style={s.field}>
        <TextInput
          style={s.input}
          value={text}
          onChangeText={onChangeText}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={4000}
        />
        {hasText && (
          <TouchableOpacity onPress={onSend} disabled={sending} style={s.sendInline} activeOpacity={0.8}>
            {sending ? (
              <ActivityIndicator size="small" color="#00c8a0" />
            ) : (
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Line x1="22" y1="2" x2="11" y2="13"/>
                <Path d="M22 2 15 22 11 13 2 9 22 2" fill="#00c8a0" stroke="#00c8a0"/>
              </Svg>
            )}
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={s.emojiBtn} onPress={onToggleEmojis} activeOpacity={0.8}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
          stroke={showEmojis ? '#f59e0b' : '#9ca3af'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10"/>
          <Path d="M8 13s1.5 2 4 2 4-2 4-2"/>
          <Line x1="9" y1="9" x2="9.01" y2="9"/>
          <Line x1="15" y1="9" x2="15.01" y2="9"/>
        </Svg>
      </TouchableOpacity>

      {onToggleStickers && (
        <TouchableOpacity style={s.emojiBtn} onPress={onToggleStickers} activeOpacity={0.8}>
          <Text style={{ fontSize: 20 }}>🎭</Text>
        </TouchableOpacity>
      )}

      {isRecording ? (
        <View style={s.recordingRow}>
          <TouchableOpacity onPress={onCancelRecording} style={s.recCancel}>
            <Text style={s.recCancelText}>✕</Text>
          </TouchableOpacity>
          {/* Visualizador de onda */}
          <View style={s.waveContainer}>
            <AudioWaveformVisualizer amplitude={amplitude} color="#ef4444" height={40} />
          </View>
          <Text style={s.recTime}>{durationFormatted}</Text>
          <TouchableOpacity onPress={onStopRecording} style={s.micRec}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round">
              <Line x1="22" y1="2" x2="11" y2="13"/>
              <Path d="M22 2 15 22 11 13 2 9 22 2" fill="#fff" stroke="#fff"/>
            </Svg>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={s.micBtn}
          onPress={onStartRecording}
          activeOpacity={0.8}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.8} strokeLinecap="round">
            <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <Path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <Line x1="12" y1="19" x2="12" y2="23"/>
            <Line x1="8" y1="23" x2="16" y2="23"/>
          </Svg>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.07)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    paddingBottom: 10,
    gap: 6,
  },
  plusBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,180,230,0.08)',
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    minHeight: 44,
    paddingLeft: 16,
    paddingRight: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    maxHeight: 120,
    paddingVertical: 10,
  },
  sendInline: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiBtn: { padding: 8 },
  micBtn: { padding: 8 },
  micRec: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center',
  },
  recordingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  waveContainer: { flex: 1, height: 44 },
  recCancel: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  recCancelText: { fontSize: 14, color: '#374151', fontWeight: '700' },
  recTime: { fontSize: 13, fontWeight: '700', color: '#ef4444', minWidth: 38, textAlign: 'center' },
});
