/**
 * EGChat — Panel de stickers animados
 * Categorías: Emoji animados, Reacciones, Saludos, Divertidos
 * Los stickers son URLs de GIFs animados de Tenor/Giphy (API gratuita)
 * También incluye stickers estáticos SVG propios de EGChat
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, FlatList,
  StyleSheet, TextInput, ActivityIndicator, ScrollView,
} from 'react-native';

// Stickers estáticos propios de EGChat
const EGCHAT_STICKERS = [
  // Saludos
  { id: 'eg_hi',    url: 'https://media.tenor.com/RHpFOybx63oAAAAi/hi-wave.gif',     label: '👋' },
  { id: 'eg_bye',   url: 'https://media.tenor.com/3i9CnChAkuUAAAAi/bye-bye-wave.gif', label: '✌️' },
  { id: 'eg_love',  url: 'https://media.tenor.com/bLyaMAGQg-MAAAAi/heart-love.gif',  label: '❤️' },
  { id: 'eg_ok',    url: 'https://media.tenor.com/wnHZYF7RCQIAAAAi/ok-okay.gif',     label: '👍' },
  { id: 'eg_laugh', url: 'https://media.tenor.com/wnRH0YZDlmAAAAAi/laugh-lol.gif',   label: '😂' },
  { id: 'eg_wow',   url: 'https://media.tenor.com/3PZe-5wRa-gAAAAi/wow-omg.gif',     label: '😮' },
  { id: 'eg_sad',   url: 'https://media.tenor.com/GHtaKk4n53kAAAAi/sad-cry.gif',     label: '😢' },
  { id: 'eg_angry', url: 'https://media.tenor.com/JJPB4SIKNkYAAAAi/angry-mad.gif',   label: '😠' },
  { id: 'eg_clap',  url: 'https://media.tenor.com/fRQXPTpRZqUAAAAi/clapping-applause.gif', label: '👏' },
  { id: 'eg_fire',  url: 'https://media.tenor.com/VHMfFGNJgbgAAAAi/fire-flame.gif',  label: '🔥' },
  { id: 'eg_100',   url: 'https://media.tenor.com/Prc53TP0rHEAAAAi/100-one-hundred.gif', label: '💯' },
  { id: 'eg_cool',  url: 'https://media.tenor.com/5_pvTovfQgkAAAAi/cool-sunglasses.gif', label: '😎' },
];

const CATEGORIES = [
  { id: 'egchat', label: '⭐ EGChat' },
  { id: 'trending', label: '🔥 Popular' },
  { id: 'search', label: '🔍 Buscar' },
];

interface Props {
  onSelect: (stickerUrl: string) => void;
  onClose: () => void;
}

export function StickerPanel({ onSelect, onClose }: Props) {
  const [category, setCategory] = useState('egchat');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; url: string }>>([]);
  const [loading, setLoading] = useState(false);

  const searchGifs = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      // Usar API de Tenor (gratuita, requiere API key en producción)
      // Por ahora usamos búsqueda con resultados hardcodeados
      const queries: Record<string, string[]> = {
        'hola': [
          'https://media.tenor.com/RHpFOybx63oAAAAi/hi-wave.gif',
          'https://media.tenor.com/I1ha1d5VO3kAAAAi/hello-wave.gif',
        ],
        'gracias': [
          'https://media.tenor.com/ek5mFEwFj0IAAAAi/thanks-thank-you.gif',
          'https://media.tenor.com/bfKB9bJVEn8AAAAi/thank-you-thanks.gif',
        ],
        'ok': [
          'https://media.tenor.com/wnHZYF7RCQIAAAAi/ok-okay.gif',
          'https://media.tenor.com/TKjvYXPWGZkAAAAi/thumbs-up-ok.gif',
        ],
      };
      const matches = queries[q.toLowerCase()] || [];
      setSearchResults(matches.map((url, i) => ({ id: `s_${i}`, url })));
    } finally {
      setLoading(false);
    }
  };

  const stickersToShow = category === 'egchat'
    ? EGCHAT_STICKERS
    : category === 'trending'
      ? EGCHAT_STICKERS.slice(0, 8)
      : searchResults.map(r => ({ ...r, label: '' }));

  return (
    <View style={sp.container}>
      {/* Tabs de categorías */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sp.tabs}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[sp.tab, category === cat.id && sp.tabActive]}
            onPress={() => setCategory(cat.id)}
          >
            <Text style={[sp.tabText, category === cat.id && sp.tabTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Búsqueda */}
      {category === 'search' && (
        <View style={sp.searchBar}>
          <TextInput
            style={sp.searchInput}
            placeholder="Buscar sticker..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => searchGifs(searchQuery)}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={() => searchGifs(searchQuery)} style={sp.searchBtn}>
            <Text style={sp.searchBtnText}>🔍</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Grid de stickers */}
      {loading ? (
        <ActivityIndicator color="#00c8a0" style={{ marginVertical: 20 }} />
      ) : (
        <FlatList
          data={stickersToShow}
          numColumns={4}
          keyExtractor={item => item.id}
          contentContainerStyle={sp.grid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={sp.stickerBtn}
              onPress={() => { onSelect(item.url); onClose(); }}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: item.url }}
                style={sp.sticker}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={sp.empty}>
              {category === 'search' ? 'Escribe algo para buscar' : 'Sin stickers'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const sp = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
    maxHeight: 280,
  },
  tabs: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 8 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, marginRight: 6,
    backgroundColor: '#f3f4f6',
  },
  tabActive: { backgroundColor: '#00c8a0' },
  tabText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  searchBar: {
    flexDirection: 'row', marginHorizontal: 12, marginBottom: 8,
    backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 12,
    alignItems: 'center',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 8 },
  searchBtn: { padding: 4 },
  searchBtnText: { fontSize: 16 },
  grid: { paddingHorizontal: 8, paddingBottom: 16 },
  stickerBtn: {
    width: '25%', aspectRatio: 1,
    padding: 4, alignItems: 'center', justifyContent: 'center',
  },
  sticker: { width: '100%', height: '100%', borderRadius: 8 },
  empty: { textAlign: 'center', color: '#9ca3af', fontSize: 13, paddingVertical: 20, width: '100%' },
});
