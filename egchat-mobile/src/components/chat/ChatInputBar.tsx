// Barra de input del chat
import React, { useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';
import { TextFormatBar } from './TextFormatBar';

export interface ChatInputBarProps {
  text: string;
  sending: boolean;
  showAttach: boolean;
  showEmojis: boolean;
  isRecording: boolean;
  keyboardVisible?: boolean;
  durationFormatted: string;
  amplitude?: number;
  sendScale: Animated.Value;
  onChangeText: (v: string) => void;
  onToggleAttach: () => void;
  onToggleEmojis: () => void;
  onToggleStickers?: () => void;
  onSend: () => void;
  onLongPressSend?: () => void;
  onStartRecording: () => void;
  onCancelRecording: () => void;
  onStopRecording: () => void;
  inputRef?: React.RefObject<TextInput | null>;
}

export function ChatInputBar({
  text,
  sending,
  showAttach,
  showEmojis,
  isRecording,
  keyboardVisible = false,
  durationFormatted,
  amplitude = 0,
  sendScale,
  onChangeText,
  onToggleAttach,
  onToggleEmojis,
  onToggleStickers,
  onSend,
  onLongPressSend,
  onStartRecording,
  onCancelRecording,
  onStopRecording,
  inputRef,
}: ChatInputBarProps) {
  const hasText = !!text.trim();
  const insets = useSafeAreaInsets();
  const bottomPadding = keyboardVisible ? 6 : Math.max(6, insets.bottom);
  // C6 — referencia de selección para insertar formato
  const selectionRef = useRef<{ start: number; end: number }>({ start: text.length, end: text.length });

  const handleFormat = (open: string, close: string) => {
    const { start, end } = selectionRef.current;
    const selected = text.slice(start, end);
    const before   = text.slice(0, start);
    const after    = text.slice(end);
    onChangeText(`${before}${open}${selected || 'texto'}${close}${after}`);
  };

  if (isRecording) {
    return (
      <View style={[s.bar, { paddingBottom: bottomPadding }]}>
        <TouchableOpacity style={s.plusBtn} onPress={onToggleAttach} activeOpacity={0.8}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
            stroke='#00b4e6' strokeWidth={2.5} strokeLinecap="round">
            <Line x1="12" y1="5" x2="12" y2="19" />
            <Line x1="5" y1="12" x2="19" y2="12" />
          </Svg>
        </TouchableOpacity>
        <View style={s.recordingRow}>
          <TouchableOpacity onPress={onCancelRecording} style={s.recCancel}>
            <Text style={s.recCancelText}>✕</Text>
          </TouchableOpacity>
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
      </View>
    );
  }

  return (
    <>
    <TextFormatBar visible={hasText} onFormat={handleFormat} />
    <View style={[s.bar, { paddingBottom: bottomPadding }]}>
      <TouchableOpacity
        style={s.plusBtn}
        onPress={onToggleAttach}
        activeOpacity={0.8}
      >
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
          stroke={showAttach ? '#00b4e6' : '#00b4e6'} strokeWidth={2.5} strokeLinecap="round">
          <Line x1="12" y1="5" x2="12" y2="19" />
          <Line x1="5" y1="12" x2="19" y2="12" />
        </Svg>
      </TouchableOpacity>

      <View style={s.field}>
        <TouchableOpacity
          style={s.iconInside}
          onPress={onToggleEmojis}
          activeOpacity={0.8}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
            stroke={showEmojis ? '#f59e0b' : '#9ca3af'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="10"/>
            <Path d="M8 13s1.5 2 4 2 4-2 4-2"/>
            <Line x1="9" y1="9" x2="9.01" y2="9"/>
            <Line x1="15" y1="9" x2="15.01" y2="9"/>
          </Svg>
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={s.input}
          value={text}
          onChangeText={onChangeText}
          onSelectionChange={e => { selectionRef.current = e.nativeEvent.selection; }}
          placeholder={showAttach ? 'Añadir comentario...' : 'Escribe un mensaje...'}
          placeholderTextColor="#b0b7c3"
          multiline
          maxLength={4000}
          autoFocus={false}
        />

        {hasText ? (
          <TouchableOpacity
            onPress={onSend}
            onLongPress={onLongPressSend}
            disabled={sending}
            style={[s.iconInside, { backgroundColor: '#00c8a0', borderRadius: 8, margin: 2 }]}
            activeOpacity={0.8}
            delayLongPress={600}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Line x1="22" y1="2" x2="11" y2="13"/>
                <Path d="M22 2 15 22 11 13 2 9 22 2" fill="#fff" stroke="#fff"/>
              </Svg>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.iconInside} onPress={onStartRecording} activeOpacity={0.8}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth={1.8} strokeLinecap="round">
              <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <Path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <Line x1="12" y1="19" x2="12" y2="23"/>
              <Line x1="8" y1="23" x2="16" y2="23"/>
            </Svg>
          </TouchableOpacity>
        )}
      </View>
    </View>
    </>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  plusBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,180,230,0.10)',
    flexShrink: 0,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f6f8',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    minHeight: 38,
    maxHeight: 100,
    paddingLeft: 6,
    paddingRight: 4,
    paddingVertical: 2,
  },
  iconInside: {
    width: 30, height: 30, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    maxHeight: 90,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  micRec: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center',
  },
  recordingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f4f6f8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 38,
    paddingHorizontal: 8,
  },
  waveContainer: { flex: 1, height: 36 },
  recCancel: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  recCancelText: { fontSize: 13, color: '#374151', fontWeight: '700' },
  recTime: { fontSize: 12, fontWeight: '700', color: '#ef4444', minWidth: 34, textAlign: 'center' },
  micBtn: { padding: 6 },
  sendInline: { width: 30, height: 30, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  emojiBtn: { padding: 6 },
});
