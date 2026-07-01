import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Line } from 'react-native-svg';
import {
  EMOJI_CATEGORIES, CHAT_STICKERS, CATEGORY_KEYS, EmojiCategoryKey,
} from '../../data/emojiCategories';

const RECENT_KEY = 'egchat_recent_emojis';
const CUSTOM_KEY = 'egchat_custom_emojis';
const MAX_RECENT = 30;

interface Props {
  onPick: (emoji: string) => void;
  onSendSticker: (text: string) => void;
}

export function ChatEmojiPanel({ onPick, onSendSticker }: Props) {
  const [category, setCategory] = useState<EmojiCategoryKey>('recientes');
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState<string[]>([...EMOJI_CATEGORIES.recientes.emojis]);
  const [custom, setCustom] = useState<string[]>([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then(raw => {
      if (raw) {
        try { setRecent(JSON.parse(raw)); } catch { /* ignore */ }
      }
    });
    AsyncStorage.getItem(CUSTOM_KEY).then(raw => {
      if (raw) {
        try { setCustom(JSON.parse(raw)); } catch { /* ignore */ }
      }
    });
  }, []);

  const saveCustom = useCallback((list: string[]) => {
    setCustom(list);
    AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(list)).catch(() => {});
  }, []);

  const commitCustomEmoji = useCallback(() => {
    const em = customDraft.trim();
    if (!em) return;
    saveCustom([em, ...custom.filter(e => e !== em)].slice(0, 40));
    setCustomDraft('');
    setShowAddCustom(false);
  }, [custom, customDraft, saveCustom]);

  const addCustomEmoji = useCallback(() => {
    if (Platform.OS === 'ios' && Alert.prompt) {
      Alert.prompt(
        'Emoji personalizado',
        'Pega o escribe un emoji',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Añadir',
            onPress: (value?: string) => {
              const em = value?.trim();
              if (!em) return;
              saveCustom([em, ...custom.filter(e => e !== em)].slice(0, 40));
            },
          },
        ],
        'plain-text',
      );
      return;
    }
    setShowAddCustom(true);
  }, [custom, saveCustom]);

  const removeCustomEmoji = useCallback((emoji: string) => {
    Alert.alert('Quitar emoji', '¿Eliminar de tus favoritos?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => saveCustom(custom.filter(e => e !== emoji)) },
    ]);
  }, [custom, saveCustom]);

  const saveRecent = useCallback(async (emoji: string) => {
    setRecent(prev => {
      const next = [emoji, ...prev.filter(e => e !== emoji)].slice(0, MAX_RECENT);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const handlePick = useCallback((emoji: string) => {
    saveRecent(emoji);
    onPick(emoji);
  }, [onPick, saveRecent]);

  const gridEmojis = useMemo(() => {
    if (search.trim()) {
      const q = search.trim();
      return CATEGORY_KEYS.flatMap(k => EMOJI_CATEGORIES[k].emojis).filter(e => e.includes(q));
    }
    if (category === 'recientes') return recent;
    if (category === 'custom') return custom;
    if (category === 'stickers') return [];
    return [...EMOJI_CATEGORIES[category].emojis];
  }, [category, search, recent, custom]);

  return (
    <View style={s.panel}>
      {showAddCustom && (
        <View style={s.addCustomRow}>
          <TextInput
            style={s.addCustomInput}
            value={customDraft}
            onChangeText={setCustomDraft}
            placeholder="Emoji..."
            placeholderTextColor="#9ca3af"
            autoFocus
          />
          <TouchableOpacity onPress={commitCustomEmoji} style={s.addCustomSave}>
            <Text style={s.addCustomSaveText}>OK</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setShowAddCustom(false); setCustomDraft(''); }}>
            <Text style={s.clearSearch}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Svg width={11} height={11} viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
            <Circle cx="11" cy="11" r="8" />
            <Line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
          </Svg>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar emoji..."
            placeholderTextColor="#9ca3af"
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Text style={s.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={s.gridScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {category === 'stickers' && !search ? (
          <View style={s.stickerGrid}>
            {CHAT_STICKERS.map((st, i) => (
              <TouchableOpacity
                key={i}
                style={s.stickerBtn}
                onPress={() => onSendSticker(`${st.emoji} ${st.label}`)}
                activeOpacity={0.8}
              >
                <Text style={s.stickerEmoji}>{st.emoji}</Text>
                <Text style={s.stickerLabel}>{st.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : category === 'custom' && !search ? (
          <View style={s.emojiGrid}>
            <TouchableOpacity style={s.addCustomBtn} onPress={addCustomEmoji} activeOpacity={0.8}>
              <Text style={s.addCustomIcon}>+</Text>
            </TouchableOpacity>
            {custom.length === 0 ? (
              <Text style={s.customHint}>Mantén pulsado para quitar · Toca + para añadir</Text>
            ) : null}
            {custom.map((em, i) => (
              <TouchableOpacity
                key={`${em}-${i}`}
                style={s.emojiBtn}
                onPress={() => handlePick(em)}
                onLongPress={() => removeCustomEmoji(em)}
              >
                <Text style={s.emojiChar}>{em}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={s.emojiGrid}>
            {gridEmojis.map((em, i) => (
              <TouchableOpacity key={`${em}-${i}`} style={s.emojiBtn} onPress={() => handlePick(em)}>
                <Text style={s.emojiChar}>{em}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catBar}>
        {CATEGORY_KEYS.map(key => {
          const cat = EMOJI_CATEGORIES[key];
          const active = category === key;
          return (
            <TouchableOpacity
              key={key}
              style={[s.catBtn, active && s.catBtnActive]}
              onPress={() => { setCategory(key); setSearch(''); }}
            >
              <Text style={[s.catIcon, !active && s.catIconDim]}>{cat.icon}</Text>
              {key === 'stickers' && (
                <Text style={[s.catStickerLabel, active && s.catStickerLabelActive]}>STICKERS</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    backgroundColor: '#f7f8fa',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.07)',
  },
  addCustomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 2,
  },
  addCustomInput: {
    flex: 1,
    height: 32,
    borderWidth: 1,
    borderColor: 'rgba(0,180,230,0.4)',
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 18,
    color: '#0d0d0d',
  },
  addCustomSave: {
    backgroundColor: '#00b4e6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addCustomSaveText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  searchRow: { paddingHorizontal: 10, paddingTop: 7, paddingBottom: 4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249,250,251,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 28,
    gap: 6,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0d0d0d', padding: 0 },
  clearSearch: { fontSize: 12, color: '#9ca3af' },
  gridScroll: { height: 155 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingVertical: 4 },
  emojiBtn: { padding: 4 },
  emojiChar: { fontSize: 22, lineHeight: 28 },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stickerBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    minWidth: 58,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  stickerEmoji: { fontSize: 28, lineHeight: 32 },
  stickerLabel: { fontSize: 9, color: '#6b7280', fontWeight: '600', marginTop: 3 },
  catBar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.07)',
    maxHeight: 48,
  },
  catBtn: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  catBtnActive: { borderTopColor: '#00b4e6' },
  catIcon: { fontSize: 18, lineHeight: 22 },
  catIconDim: { opacity: 0.4 },
  catStickerLabel: { fontSize: 8, fontWeight: '700', color: '#9ca3af', marginTop: 1 },
  catStickerLabelActive: { color: '#00b4e6' },
  addCustomBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(0,180,230,0.5)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  addCustomIcon: { fontSize: 22, color: '#00b4e6', lineHeight: 26 },
  customHint: { fontSize: 11, color: '#9ca3af', paddingHorizontal: 12, paddingVertical: 8, flex: 1 },
});
