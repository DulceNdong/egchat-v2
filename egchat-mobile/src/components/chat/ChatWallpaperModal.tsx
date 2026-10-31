import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CHAT_WALLPAPERS, WallpaperCategory } from '../../data/chatWallpapers';
import { useTranslation } from '../../context/LanguageContext';

const TABS: { id: WallpaperCategory | 'all'; labelKey: string }[] = [
  { id: 'crystal', labelKey: 'chtWallpaperCrystal' },
  { id: 'static', labelKey: 'chtWallpaperStatic' },
  { id: 'dynamic', labelKey: 'chtWallpaperDynamic' },
  { id: 'none', labelKey: 'chtWallpaperNone' },
];

export function ChatWallpaperModal({
  visible,
  activeId,
  onClose,
  onSelect,
}: {
  visible: boolean;
  activeId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<WallpaperCategory | 'all'>('crystal');
  const items = CHAT_WALLPAPERS.filter(w => tab === 'all' || w.category === tab || (tab === 'none' && w.id === 'none'));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.handle} />
          <Text style={s.title}>{t('wallpaper')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabs}>
            {TABS.map(tabItem => (
              <TouchableOpacity
                key={tabItem.id}
                style={[s.tab, tab === tabItem.id && s.tabActive]}
                onPress={() => setTab(tabItem.id)}
              >
                <Text style={[s.tabText, tab === tabItem.id && s.tabTextActive]}>{t(tabItem.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView contentContainerStyle={s.grid}>
            {items.map(wp => (
              <TouchableOpacity
                key={wp.id}
                style={s.thumb}
                onPress={() => { onSelect(wp.id); onClose(); }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={wp.colors as [string, string, ...string[]]}
                  style={[s.thumbGrad, activeId === wp.id && s.thumbGradActive]}
                />
                {wp.live && (
                  <View style={s.liveBadge}><Text style={s.liveText}>{t('chtLiveTag')}</Text></View>
                )}
                <Text style={s.thumbLabel} numberOfLines={1}>{wp.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '78%',
    paddingBottom: 24,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#d1d5db',
    alignSelf: 'center', marginTop: 10, marginBottom: 8,
  },
  title: { fontSize: 17, fontWeight: '800', color: '#111827', paddingHorizontal: 16, marginBottom: 8 },
  tabs: { paddingHorizontal: 12, marginBottom: 8, maxHeight: 40 },
  tab: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#f3f4f6', marginRight: 8,
  },
  tabActive: { backgroundColor: 'rgba(0,200,160,0.15)' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#00c8a0' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  thumb: { width: '30%', alignItems: 'center', marginBottom: 4 },
  thumbGrad: { width: 90, height: 90, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  thumbGradActive: { borderColor: '#00c8a0' },
  liveBadge: {
    position: 'absolute', top: 6, right: '12%',
    backgroundColor: '#ef4444', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1,
  },
  liveText: { fontSize: 8, fontWeight: '800', color: '#fff' },
  thumbLabel: { fontSize: 10, color: '#374151', marginTop: 4, textAlign: 'center', fontWeight: '600' },
});
