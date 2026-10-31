/**
 * share-picker.tsx — Selector de chat para contenido compartido desde otras apps
 *
 * Se abre cuando el usuario elige EGCHAT en el share sheet del sistema.
 * Muestra la lista de chats recientes para que el usuario elija dónde enviar.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, Platform,
  KeyboardAvoidingView, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { chatAPI } from '../src/api';
import { ShareExtension, SharedContent } from '../src/native/ShareExtension';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t as tr } from '../src/translations';

// ── Helpers (iguales a mensajeria.tsx) ──────────────────────────────────────
const getParticipantName = (p?: any) =>
  p?.full_name || p?.users?.full_name || p?.user?.full_name || tr('setUser');

const getParticipantAvatar = (p?: any): string => {
  const raw =
    p?.avatar_url || p?.users?.avatar_url || p?.user?.avatar_url ||
    p?.profile?.avatar_url || '';
  return typeof raw === 'string' ? raw : '';
};

type Chat = {
  id: string;
  type: 'private' | 'group';
  name?: string;
  avatar_url?: string;
  participants: Array<{ user_id: string; full_name?: string; users?: any; user?: any; avatar_url?: string }>;
  last_message?: { text?: string; created_at?: string };
};

// ── Componente principal ────────────────────────────────────────────────────
export default function SharePicker() {
  const [chats, setChats]           = useState<Chat[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [sharedContent, setContent] = useState<SharedContent | null>(null);
  const [currentUserId, setUserId]  = useState<string>('');

  useEffect(() => {
    // Leer el userId guardado
    AsyncStorage.getItem('userId').then(id => { if (id) setUserId(id); });
    // Leer el contenido compartido del App Group
    ShareExtension.getSharedContent().then(c => { if (c) setContent(c); });
    // Cargar chats
    chatAPI.getChats()
      .then(data => setChats(Array.isArray(data) ? data : []))
      .catch(() => setChats([]))
      .finally(() => setLoading(false));
  }, []);

  const getChatMeta = useCallback((chat: Chat) => {
    const other = chat.participants.find(p => String(p.user_id) !== String(currentUserId));
    const name   = chat.type === 'private'
      ? getParticipantName(other)
      : (chat.name || tr('msgGroup'));
    const avatar = chat.type === 'private'
      ? getParticipantAvatar(other)
      : (chat.avatar_url || '');
    return { name, avatar };
  }, [currentUserId]);

  const filtered = chats.filter(chat => {
    if (!search.trim()) return true;
    const { name } = getChatMeta(chat);
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelect = (chat: Chat) => {
    // Guardar el contenido pendiente para que [id].tsx lo consuma al abrir
    if (sharedContent) {
      AsyncStorage.setItem('egchat_pending_share', JSON.stringify(sharedContent));
    }
    router.replace(`/chat/${chat.id}` as any);
  };

  // Descripción breve del contenido que se va a compartir
  const contentPreview = () => {
    if (!sharedContent) return '';
    if (sharedContent.type === 'text') return `"${(sharedContent.text || '').slice(0, 60)}"`;
    if (sharedContent.type === 'image') return '📷 Foto';
    if (sharedContent.type === 'video') return '🎥 Video';
    if (sharedContent.type === 'audio') return '🎤 Audio';
    if (sharedContent.type === 'file')  return '📄 Archivo';
    if (sharedContent.type === 'multiple') return `${sharedContent.files?.length || ''} archivos`;
    return '';
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backIcon}>✕</Text>
          </TouchableOpacity>
          <View style={s.headerText}>
            <Text style={s.title}>{tr('xtCompartirEnEGChat')}</Text>
            {!!contentPreview() && (
              <Text style={s.preview} numberOfLines={1}>{contentPreview()}</Text>
            )}
          </View>
        </View>

        {/* Buscador */}
        <View style={s.searchRow}>
          <TextInput
            style={s.searchInput}
            placeholder={tr('searchChat')}
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        </View>

        {/* Lista de chats */}
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color="#00C8A0" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={s.list}
            renderItem={({ item }) => {
              const { name, avatar } = getChatMeta(item);
              const lastMsg = item.last_message?.text || '';
              return (
                <TouchableOpacity
                  style={s.chatRow}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  {/* Avatar */}
                  <View style={s.avatarWrap}>
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={s.avatar} />
                    ) : (
                      <View style={[s.avatar, s.avatarFallback]}>
                        <Text style={s.avatarFallbackText}>
                          {name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    {item.type === 'group' && (
                      <View style={s.groupBadge}>
                        <Text style={s.groupBadgeText}>G</Text>
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={s.chatInfo}>
                    <Text style={s.chatName} numberOfLines={1}>{name}</Text>
                    {!!lastMsg && (
                      <Text style={s.chatLast} numberOfLines={1}>{lastMsg}</Text>
                    )}
                  </View>

                  {/* Acción */}
                  <View style={s.sendBtn}>
                    <Text style={s.sendBtnText}>{tr('liaChipSend')}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={s.center}>
                <Text style={s.emptyText}>{tr('xtNoSeEncontraronChats')}</Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f1419',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backIcon: { color: '#fff', fontSize: 16 },
  headerText: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700', color: '#fff' },
  preview: { fontSize: 12, color: '#00C8A0', marginTop: 2 },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
  },
  list: {
    paddingBottom: 32,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    backgroundColor: '#00C8A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  groupBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0f1419',
  },
  groupBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  chatLast: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  sendBtn: {
    backgroundColor: '#00C8A0',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  sendBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: { color: 'rgba(255,255,255,0.35)', fontSize: 15 },
});
