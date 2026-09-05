/**
 * ChatMediaGallery — galería de imágenes y videos enviados en el chat
 * Carga los mensajes de tipo image/video/album del chat y los muestra en grid.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  FlatList, Image, ActivityIndicator, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Polyline } from 'react-native-svg';
import { chatAPI } from '../../api';
import { ImageViewer } from '../ImageViewer';
import { VideoViewerModal } from './VideoViewerModal';

const { width: W } = Dimensions.get('window');
const CELL = (W - 4) / 3;

interface Props {
  visible: boolean;
  chatId: string;
  chatName: string;
  onClose: () => void;
}

interface MediaItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
}

export function ChatMediaGallery({ visible, chatId, chatName, onClose }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [videoViewerOpen, setVideoViewerOpen] = useState(false);
  const [videoUri, setVideoUri] = useState('');
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    if (!chatId) return;
    setLoading(true);
    try {
      // Carga todos los mensajes y filtra los que tienen media
      const msgs: any[] = await chatAPI.getMessages(chatId, 1, 200);
      const media: MediaItem[] = [];
      for (const m of msgs) {
        if (m.type === 'image' && (m.imageUrl || m.file_url)) {
          media.push({ id: m.id, uri: m.imageUrl || m.file_url, type: 'image' });
        } else if (m.type === 'album' && Array.isArray(m.album_urls)) {
          m.album_urls.forEach((url: string, i: number) => {
            media.push({ id: `${m.id}_${i}`, uri: url, type: 'image' });
          });
        } else if (m.type === 'video' && m.file_url) {
          media.push({ id: m.id, uri: m.file_url, type: 'video' });
        }
      }
      setItems(media.reverse()); // más recientes primero
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const imageUris = items.filter(i => i.type === 'image').map(i => i.uri);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.backBtn} hitSlop={10}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="19" y1="12" x2="5" y2="12"/>
              <Polyline points="12 19 5 12 12 5"/>
            </Svg>
          </TouchableOpacity>
          <View>
            <Text style={s.title}>Archivos multimedia</Text>
            <Text style={s.subtitle}>{chatName}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} color="#00b4e6" />
        ) : items.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🖼️</Text>
            <Text style={s.emptyText}>No hay fotos ni videos compartidos</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            numColumns={3}
            keyExtractor={item => item.id}
            contentContainerStyle={{ gap: 2 }}
            columnWrapperStyle={{ gap: 2 }}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={s.cell}
                activeOpacity={0.8}
                onPress={() => {
                  if (item.type === 'video') {
                    setVideoUri(item.uri);
                    setVideoViewerOpen(true);
                  } else {
                    const imgIndex = imageUris.indexOf(item.uri);
                    if (imgIndex >= 0) {
                      setViewerIndex(imgIndex);
                      setViewerOpen(true);
                    }
                  }
                }}
              >
                <Image source={{ uri: item.uri }} style={s.cellImage} resizeMode="cover" />
                {item.type === 'video' && (
                  <View style={s.videoOverlay}>
                    <Text style={s.playIcon}>▶</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        )}

        <ImageViewer
          visible={viewerOpen}
          images={imageUris}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#9ca3af' },
  cell: { width: CELL, height: CELL, backgroundColor: '#f3f4f6' },
  cellImage: { width: CELL, height: CELL },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  playIcon: { color: '#fff', fontSize: 24 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: '#9ca3af' },
});
