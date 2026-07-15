// ══════════════════════════════════════════════════════════════════
// MediaPreviewModal — Preview de imagen/documento antes de enviar
// Igual que WhatsApp: muestra la previsualización + caption
// ══════════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Image, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Polyline } from 'react-native-svg';
import { useThemeContext } from '../../theme/ThemeContext';
import { Colors } from '../../theme/colors';
import { DarkColors } from '../../theme/darkMode';

export interface MediaPreviewItem {
  uri: string;
  fileName: string;
  mimeType: string;
  type: 'image' | 'video' | 'file';
}

interface Props {
  visible: boolean;
  item: MediaPreviewItem | null;
  onSend: (caption: string) => void;
  onCancel: () => void;
  sending?: boolean;
}

const isImage = (item: MediaPreviewItem) =>
  item.type === 'image' || item.mimeType.startsWith('image/');

export function MediaPreviewModal({ visible, item, onSend, onCancel, sending }: Props) {
  const [caption, setCaption] = useState('');
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  if (!item) return null;

  const handleSend = () => {
    onSend(caption);
    setCaption('');
  };

  // Icono para archivos no-imagen
  const fileIcon = item.mimeType.includes('pdf') ? '📄'
    : item.mimeType.includes('word') ? '📝'
    : item.mimeType.includes('excel') || item.mimeType.includes('sheet') ? '📊'
    : item.mimeType.includes('audio') ? '🎵'
    : item.mimeType.includes('video') ? '🎬'
    : '📁';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#000' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onCancel} style={s.headerBtn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
            </Svg>
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>{item.fileName}</Text>
        </View>

        {/* Preview */}
        <View style={s.previewArea}>
          {isImage(item) ? (
            <Image
              source={{ uri: item.uri }}
              style={s.previewImage}
              resizeMode="contain"
            />
          ) : (
            <View style={s.filePreview}>
              <Text style={s.fileIcon}>{fileIcon}</Text>
              <Text style={s.fileName} numberOfLines={2}>{item.fileName}</Text>
              <Text style={s.fileMime}>{item.mimeType.split('/').pop()?.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Caption + Enviar */}
        <View style={[s.footer, { paddingBottom: insets.bottom + 8 }]}>
          <View style={[s.captionRow, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <TextInput
              style={s.captionInput}
              placeholder="Añade un texto..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={1000}
            />
          </View>
          <TouchableOpacity
            style={s.sendBtn}
            onPress={handleSend}
            disabled={sending}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#07a472', '#00b4e6']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.sendGrad}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                  <Line x1="22" y1="2" x2="11" y2="13"/>
                  <Polyline points="22 2 15 22 11 13 2 9 22 2"/>
                </Svg>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10, gap: 10, backgroundColor: 'rgba(0,0,0,0.6)' },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600' },
  previewArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '100%' },
  filePreview: { alignItems: 'center', gap: 12, padding: 30, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  fileIcon: { fontSize: 72 },
  fileName: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  fileMime: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  footer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingTop: 10, backgroundColor: 'rgba(0,0,0,0.6)' },
  captionRow: { flex: 1, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8, maxHeight: 100 },
  captionInput: { color: '#fff', fontSize: 15, maxHeight: 84 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  sendGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
