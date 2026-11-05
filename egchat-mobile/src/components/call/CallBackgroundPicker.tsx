// ══════════════════════════════════════════════════════════════════
// CallBackgroundPicker — Selector de fondo para llamadas
// Fondos predeterminados + galería del usuario
// ══════════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Image, Pressable, Alert, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'egchat_call_background';

// Fondos predeterminados incluidos en la app
export const PRESET_BACKGROUNDS = [
  { id: 'cherry',   label: 'Sakura',    color: '#f9a8d4', gradient: ['#fce7f3', '#fbcfe8', '#f9a8d4'] as [string,string,string] },
  { id: 'night',    label: 'Noche',     color: '#1e1b4b', gradient: ['#1e1b4b', '#312e81', '#4338ca'] as [string,string,string] },
  { id: 'tokyo',    label: 'Tokio',     color: '#0f172a', gradient: ['#0f172a', '#1e3a5f', '#0369a1'] as [string,string,string] },
  { id: 'forest',   label: 'Bosque',    color: '#14532d', gradient: ['#052e16', '#14532d', '#166534'] as [string,string,string] },
  { id: 'sunset',   label: 'Atardecer', color: '#7c2d12', gradient: ['#7c2d12', '#c2410c', '#fb923c'] as [string,string,string] },
  { id: 'ocean',    label: 'Océano',    color: '#0c4a6e', gradient: ['#0c4a6e', '#0369a1', '#38bdf8'] as [string,string,string] },
  { id: 'purple',   label: 'Violeta',   color: '#581c87', gradient: ['#3b0764', '#581c87', '#7e22ce'] as [string,string,string] },
  { id: 'dark',     label: 'Oscuro',    color: '#0f172a', gradient: ['#000000', '#0f172a', '#1e293b'] as [string,string,string] },
  { id: 'rose',     label: 'Rosa',      color: '#881337', gradient: ['#881337', '#be123c', '#fb7185'] as [string,string,string] },
] as const;

export type BackgroundId = typeof PRESET_BACKGROUNDS[number]['id'] | 'custom';

export interface CallBackground {
  type: 'preset' | 'custom';
  id?: BackgroundId;
  uri?: string;
  gradient?: [string, string, string];
}

export async function loadCallBackground(): Promise<CallBackground> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { type: 'preset', id: 'night', gradient: PRESET_BACKGROUNDS[1].gradient };
}

export async function saveCallBackground(bg: CallBackground) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bg));
  } catch {}
}

interface Props {
  visible: boolean;
  current: CallBackground;
  onSelect: (bg: CallBackground) => void;
  onClose: () => void;
}

export function CallBackgroundPicker({ visible, current, onSelect, onClose }: Props) {
  const [tab, setTab] = useState<'recents' | 'gallery' | 'colors'>('gallery');

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para elegir un fondo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [9, 16],
      });
      if (!result.canceled && result.assets[0]) {
        const bg: CallBackground = { type: 'custom', uri: result.assets[0].uri };
        await saveCallBackground(bg);
        onSelect(bg);
        onClose();
      }
    } catch {
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>Fondo de llamadas</Text>

          {/* Tabs */}
          <View style={s.tabs}>
            {(['gallery', 'colors'] as const).map(t => (
              <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
                <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                  {t === 'gallery' ? 'Galería' : 'Colores'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'gallery' && (
            <ScrollView contentContainerStyle={s.grid} showsVerticalScrollIndicator={false}>
              {/* Opción galería del usuario */}
              <TouchableOpacity style={s.pickBtn} onPress={pickFromGallery} activeOpacity={0.8}>
                <Text style={s.pickBtnIcon}>🖼️</Text>
                <Text style={s.pickBtnText}>Elegir de la galería</Text>
              </TouchableOpacity>

              {/* Fondos predeterminados de paisaje */}
              {PRESET_BACKGROUNDS.slice(0, 6).map(bg => (
                <TouchableOpacity
                  key={bg.id}
                  style={[s.bgThumb, current.id === bg.id && s.bgThumbSelected]}
                  onPress={async () => {
                    const selected: CallBackground = { type: 'preset', id: bg.id, gradient: bg.gradient };
                    await saveCallBackground(selected);
                    onSelect(selected);
                    onClose();
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[s.bgPreview, { backgroundColor: bg.color }]}>
                    <View style={StyleSheet.absoluteFill}>
                      <View style={{ flex: 1, backgroundColor: bg.gradient[0] }} />
                      <View style={{ flex: 1, backgroundColor: bg.gradient[1] }} />
                      <View style={{ flex: 1, backgroundColor: bg.gradient[2] }} />
                    </View>
                    {current.id === bg.id && (
                      <View style={s.checkBadge}>
                        <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.bgLabel}>{bg.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {tab === 'colors' && (
            <ScrollView contentContainerStyle={s.grid} showsVerticalScrollIndicator={false}>
              {PRESET_BACKGROUNDS.map(bg => (
                <TouchableOpacity
                  key={bg.id}
                  style={[s.bgThumb, current.id === bg.id && s.bgThumbSelected]}
                  onPress={async () => {
                    const selected: CallBackground = { type: 'preset', id: bg.id, gradient: bg.gradient };
                    await saveCallBackground(selected);
                    onSelect(selected);
                    onClose();
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[s.colorPreview, { backgroundColor: bg.gradient[1] }]}>
                    {current.id === bg.id && (
                      <View style={s.checkBadge}><Text style={{ color: '#fff', fontSize: 12 }}>✓</Text></View>
                    )}
                  </View>
                  <Text style={s.bgLabel}>{bg.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32, maxHeight: '75%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  title: { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center', paddingVertical: 12 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderColor: '#00c8a0' },
  tabText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#00c8a0' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  pickBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 4,
  },
  pickBtnIcon: { fontSize: 22 },
  pickBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  bgThumb: { width: '30%', alignItems: 'center', gap: 6 },
  bgThumbSelected: { transform: [{ scale: 0.95 }] },
  bgPreview: {
    width: '100%', aspectRatio: 9 / 16, borderRadius: 12, overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },
  colorPreview: {
    width: '100%', aspectRatio: 1, borderRadius: 12,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#00c8a0', alignItems: 'center', justifyContent: 'center',
  },
  bgLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500' },
});
