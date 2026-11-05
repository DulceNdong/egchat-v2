// ══════════════════════════════════════════════════════════════════
// StoryMusicPicker — selector de música para Estados/Stories
// Busca canciones y añade fragmento al story (estilo WhatsApp)
// ══════════════════════════════════════════════════════════════════
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, TextInput,
  FlatList, Image, Pressable, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Circle, Polyline } from 'react-native-svg';
import { Audio } from 'expo-av';
import { useThemeContext } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';
import { DarkColors } from '../theme/darkMode';

export interface StoryMusic {
  trackId: string;
  title: string;
  artist: string;
  albumArt?: string;
  previewUrl?: string;
  startSeconds: number; // qué segundo del track usar (0-30)
}

interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  previewUrl?: string;
  duration: number;
}

interface Props {
  visible: boolean;
  selected?: StoryMusic | null;
  onSelect: (music: StoryMusic | null) => void;
  onClose: () => void;
}

// Búsqueda de música via iTunes Search API (gratuita, sin auth)
async function searchMusic(query: string): Promise<Track[]> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=15&country=US`,
      { signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      id: String(r.trackId),
      title: r.trackName || 'Sin título',
      artist: r.artistName || 'Artista desconocido',
      albumArt: r.artworkUrl60?.replace('60x60', '100x100'),
      previewUrl: r.previewUrl,
      duration: Math.round((r.trackTimeMillis || 30000) / 1000),
    }));
  } catch {
    return [];
  }
}

export function StoryMusicPicker({ visible, selected, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [startSec, setStartSec] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  useEffect(() => {
    if (!visible) {
      stopPreview();
      setQuery('');
      setTracks([]);
      setSelectedTrack(null);
      setStartSec(0);
    }
  }, [visible]);

  const stopPreview = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setPlayingId(null);
  }, []);

  const playPreview = useCallback(async (track: Track) => {
    await stopPreview();
    if (!track.previewUrl) return;
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: track.previewUrl }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(track.id);
      // Auto-stop after 10s
      timerRef.current = setTimeout(() => stopPreview(), 10000);
    } catch {}
  }, [stopPreview]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    const results = await searchMusic(query);
    setTracks(results);
    setLoading(false);
  }, [query]);

  const handleSelect = useCallback(() => {
    if (!selectedTrack) return;
    stopPreview();
    onSelect({
      trackId: selectedTrack.id,
      title: selectedTrack.title,
      artist: selectedTrack.artist,
      albumArt: selectedTrack.albumArt,
      previewUrl: selectedTrack.previewUrl,
      startSeconds: startSec,
    });
    onClose();
  }, [selectedTrack, startSec, onSelect, onClose, stopPreview]);

  // Canciones populares por defecto
  const defaultTracks: Track[] = [
    { id: 'd1', title: 'Shakira: Bzrp Music Sessions #53', artist: 'Bizarrap & Shakira', duration: 210 },
    { id: 'd2', title: 'Anti-Hero', artist: 'Taylor Swift', duration: 200 },
    { id: 'd3', title: 'Flowers', artist: 'Miley Cyrus', duration: 200 },
    { id: 'd4', title: 'Ella Baila Sola', artist: 'Eslabon Armado & Peso Pluma', duration: 185 },
    { id: 'd5', title: 'Cupid', artist: 'FIFTY FIFTY', duration: 172 },
  ];

  const displayTracks = tracks.length > 0 ? tracks : defaultTracks;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.root, { backgroundColor: C.bgPrimary }]}>
        {/* Header */}
        <LinearGradient colors={['#1db954', '#191414']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
          <TouchableOpacity onPress={() => { stopPreview(); onClose(); }} style={s.btn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
            </Svg>
          </TouchableOpacity>
          <Text style={s.headerTitle}>🎵 Añadir música</Text>
          {selected && (
            <TouchableOpacity style={s.removeBtn} onPress={() => { stopPreview(); onSelect(null); onClose(); }}>
              <Text style={s.removeBtnText}>Quitar</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Búsqueda */}
        <View style={[s.searchRow, { backgroundColor: C.bgSecondary }]}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2} strokeLinecap="round">
            <Circle cx="11" cy="11" r="8"/><Path d="M21 21l-4.35-4.35"/>
          </Svg>
          <TextInput
            style={[s.searchInput, { color: C.textPrimary }]}
            placeholder="Buscar canción o artista..."
            placeholderTextColor={C.textTertiary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleSearch} style={s.searchBtn}>
              <Text style={s.searchBtnText}>Buscar</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#1db954" />
        ) : (
          <FlatList
            data={displayTracks}
            keyExtractor={t => t.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListHeaderComponent={
              tracks.length === 0 ? (
                <Text style={[s.sectionLabel, { color: C.textTertiary }]}>🔥 POPULARES</Text>
              ) : null
            }
            renderItem={({ item }) => {
              const isPlaying = playingId === item.id;
              const isSel = selectedTrack?.id === item.id;
              return (
                <TouchableOpacity
                  style={[s.trackRow, { borderBottomColor: C.borderLight }, isSel && s.trackRowSelected]}
                  onPress={() => setSelectedTrack(item)}
                  activeOpacity={0.75}
                >
                  {/* Album art */}
                  <View style={s.albumArt}>
                    {item.albumArt ? (
                      <Image source={{ uri: item.albumArt }} style={s.albumImg} />
                    ) : (
                      <LinearGradient colors={['#1db954', '#191414']} style={s.albumImg}>
                        <Text style={{ fontSize: 20 }}>🎵</Text>
                      </LinearGradient>
                    )}
                    {isPlaying && (
                      <View style={s.playingOverlay}>
                        <Text style={{ fontSize: 14 }}>▶</Text>
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={s.trackInfo}>
                    <Text style={[s.trackTitle, { color: C.textPrimary }, isSel && { color: '#1db954' }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[s.trackArtist, { color: C.textTertiary }]} numberOfLines={1}>
                      {item.artist}
                    </Text>
                  </View>

                  {/* Preview button */}
                  {item.previewUrl && (
                    <TouchableOpacity
                      style={s.previewBtn}
                      onPress={() => isPlaying ? stopPreview() : playPreview(item)}
                    >
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill={isPlaying ? '#1db954' : 'none'}
                        stroke="#1db954" strokeWidth={2} strokeLinecap="round">
                        {isPlaying
                          ? <><Line x1="6" y1="4" x2="6" y2="20"/><Line x1="18" y1="4" x2="18" y2="20"/></>
                          : <Polyline points="5 3 19 12 5 21 5 3"/>
                        }
                      </Svg>
                    </TouchableOpacity>
                  )}

                  {/* Select check */}
                  {isSel && (
                    <View style={s.checkBadge}>
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                        <Path d="M20 6L9 17l-5-5"/>
                      </Svg>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Botón confirmar */}
        {selectedTrack && (
          <View style={[s.confirmBar, { backgroundColor: C.bgPrimary, borderTopColor: C.borderLight }]}>
            <View style={s.selectedInfo}>
              <Text style={[s.selectedTitle, { color: C.textPrimary }]} numberOfLines={1}>
                🎵 {selectedTrack.title}
              </Text>
              <Text style={[s.selectedArtist, { color: C.textTertiary }]} numberOfLines={1}>
                {selectedTrack.artist}
              </Text>
            </View>
            <TouchableOpacity style={s.confirmBtn} onPress={handleSelect}>
              <LinearGradient colors={['#1db954', '#17a844']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.confirmGrad}>
                <Text style={s.confirmText}>Usar esta canción</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

// Badge musical para mostrar en el story viewer
export function StoryMusicBadge({ music }: { music: StoryMusic }) {
  return (
    <View style={mb.badge}>
      <View style={mb.disc}>
        <Text style={mb.note}>♪</Text>
      </View>
      <View style={mb.info}>
        <Text style={mb.title} numberOfLines={1}>{music.title}</Text>
        <Text style={mb.artist} numberOfLines={1}>{music.artist}</Text>
      </View>
    </View>
  );
}

const mb = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, margin: 12,
    alignSelf: 'flex-start',
  },
  disc: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1db954', alignItems: 'center', justifyContent: 'center' },
  note: { color: '#fff', fontSize: 14, fontWeight: '700' },
  info: { maxWidth: 160 },
  title: { color: '#fff', fontSize: 13, fontWeight: '700' },
  artist: { color: 'rgba(255,255,255,0.75)', fontSize: 11 },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 12, paddingTop: 50, gap: 10 },
  btn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff' },
  removeBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12 },
  removeBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 12, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  searchBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#1db954', borderRadius: 10 },
  searchBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 16, paddingVertical: 8 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  trackRowSelected: { backgroundColor: 'rgba(29,185,84,0.08)' },
  albumArt: { width: 52, height: 52, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  albumImg: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  playingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  trackInfo: { flex: 1, minWidth: 0 },
  trackTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  trackArtist: { fontSize: 12 },
  previewBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#1db954', alignItems: 'center', justifyContent: 'center' },
  checkBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1db954', alignItems: 'center', justifyContent: 'center' },
  confirmBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 34 },
  selectedInfo: { flex: 1 },
  selectedTitle: { fontSize: 13, fontWeight: '700' },
  selectedArtist: { fontSize: 11 },
  confirmBtn: { borderRadius: 20, overflow: 'hidden' },
  confirmGrad: { paddingHorizontal: 16, paddingVertical: 10 },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
