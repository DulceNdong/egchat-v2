// ══════════════════════════════════════════════════════════════════
// GlobalSearch — Búsqueda en todos los chats y mensajes
// Estilo WhatsApp: busca contactos, grupos y contenido de mensajes
// ══════════════════════════════════════════════════════════════════
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Polyline, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { chatAPI, getToken, getApiBase } from '../src/api';
import { EGAvatar } from '../src/components/ui';
import { useThemeContext } from '../src/theme/ThemeContext';
import { Colors } from '../src/theme/colors';
import { DarkColors } from '../src/theme/darkMode';

interface SearchResult {
  type: 'chat' | 'message' | 'contact';
  chatId: string;
  chatName: string;
  chatAvatar?: string;
  messageId?: string;
  messageText?: string;
  messageDate?: string;
  senderName?: string;
  highlight?: string; // fragmento de texto que coincide
}

const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return d.toLocaleDateString('es-ES', { weekday: 'short' });
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
};

// Resalta el texto encontrado
const HighlightText = ({ text, query, style }: { text: string; query: string; style: any }) => {
  if (!query || !text) return <Text style={style}>{text}</Text>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <Text style={style}>{text}</Text>;
  return (
    <Text style={style}>
      {text.slice(0, idx)}
      <Text style={{ backgroundColor: '#fef08a', color: '#78350f' }}>
        {text.slice(idx, idx + query.length)}
      </Text>
      {text.slice(idx + query.length)}
    </Text>
  );
};

export default function GlobalSearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);

    try {
      const found: SearchResult[] = [];

      // 1. Buscar en la lista de chats (nombre)
      const chats = await chatAPI.getChats();
      for (const chat of (Array.isArray(chats) ? chats : [])) {
        const name = chat.name || chat.participants?.[0]?.full_name || '';
        if (name.toLowerCase().includes(q.toLowerCase())) {
          found.push({
            type: 'chat',
            chatId: chat.id,
            chatName: name,
            chatAvatar: chat.avatar_url || chat.participants?.[0]?.avatar_url,
          });
        }
      }

      // 2. Buscar mensajes via API
      try {
        const BASE = getApiBase();
        const token = await getToken();
        const res = await fetch(`${BASE}/api/messages/search?q=${encodeURIComponent(q)}&limit=30`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const msgs = await res.json();
          for (const msg of (Array.isArray(msgs) ? msgs : [])) {
            const chatName = msg.chat?.name || msg.chat?.participants?.[0]?.full_name || 'Chat';
            found.push({
              type: 'message',
              chatId: msg.chat_id || msg.chat?.id,
              chatName,
              chatAvatar: msg.chat?.avatar_url,
              messageId: msg.id,
              messageText: msg.text || '',
              messageDate: msg.created_at,
              senderName: msg.sender?.full_name || 'Usuario',
              highlight: q,
            });
          }
        }
      } catch {
        // Fallback: buscar en mensajes locales de cada chat
        for (const chat of (Array.isArray(chats) ? chats.slice(0, 15) : [])) {
          try {
            const msgs = await chatAPI.getMessages(chat.id, 50);
            for (const msg of (Array.isArray(msgs) ? msgs : [])) {
              if ((msg.text || '').toLowerCase().includes(q.toLowerCase())) {
                const chatName = chat.name || chat.participants?.find((p: any) => p.user_id !== 'me')?.full_name || 'Chat';
                found.push({
                  type: 'message',
                  chatId: chat.id,
                  chatName,
                  chatAvatar: chat.avatar_url,
                  messageId: msg.id,
                  messageText: msg.text || '',
                  messageDate: msg.created_at,
                  senderName: msg.sender?.full_name || 'Usuario',
                  highlight: q,
                });
              }
            }
          } catch {}
        }
      }

      setResults(found);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = useCallback((text: string) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(text), 400);
  }, [doSearch]);

  const openResult = useCallback((r: SearchResult) => {
    router.push(`/chat/${r.chatId}` as any);
  }, []);

  const chatResults = results.filter(r => r.type === 'chat');
  const msgResults = results.filter(r => r.type === 'message');

  return (
    <SafeAreaView style={[s.root, { backgroundColor: '#07a472' }]} edges={['left', 'right']}>
      {/* Header con barra de búsqueda */}
      <LinearGradient colors={['#07a472', '#00b4e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
            <Line x1="19" y1="12" x2="5" y2="12"/><Polyline points="12 19 5 12 12 5"/>
          </Svg>
        </TouchableOpacity>
        <View style={s.searchBox}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={2} strokeLinecap="round">
            <Circle cx="11" cy="11" r="8"/><Path d="M21 21l-4.35-4.35"/>
          </Svg>
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            placeholder="Buscar en todos los chats..."
            placeholderTextColor="rgba(0,0,0,0.4)"
            value={query}
            onChangeText={handleChange}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => doSearch(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <Text style={{ fontSize: 16, color: 'rgba(0,0,0,0.4)', paddingHorizontal: 4 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 50 }} color={Colors.accent} size="large" />
        ) : !searched ? (
          <View style={s.empty}>
            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={1.2} strokeLinecap="round">
              <Circle cx="11" cy="11" r="8"/><Path d="M21 21l-4.35-4.35"/>
            </Svg>
            <Text style={[s.emptyTitle, { color: C.textPrimary }]}>Busca en todos tus chats</Text>
            <Text style={[s.emptySub, { color: C.textTertiary }]}>Escribe al menos 2 caracteres</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🔍</Text>
            <Text style={[s.emptyTitle, { color: C.textPrimary }]}>Sin resultados</Text>
            <Text style={[s.emptySub, { color: C.textTertiary }]}>No se encontró "{query}"</Text>
          </View>
        ) : (
          <FlatList
            data={[
              ...(chatResults.length > 0 ? [{ type: 'header', label: `CHATS (${chatResults.length})`, id: 'h_chats' }] : []),
              ...chatResults.map(r => ({ ...r, id: `chat_${r.chatId}` })),
              ...(msgResults.length > 0 ? [{ type: 'header', label: `MENSAJES (${msgResults.length})`, id: 'h_msgs' }] : []),
              ...msgResults.map((r, i) => ({ ...r, id: `msg_${r.messageId || i}` })),
            ] as any[]}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return (
                  <View style={[s.sectionHeader, { backgroundColor: C.bgSecondary }]}>
                    <Text style={[s.sectionTitle, { color: C.textTertiary }]}>{item.label}</Text>
                  </View>
                );
              }
              return (
                <TouchableOpacity
                  style={[s.resultRow, { borderBottomColor: C.borderLight }]}
                  onPress={() => openResult(item)}
                  activeOpacity={0.7}
                >
                  <EGAvatar src={item.chatAvatar} name={item.chatName} size={44} />
                  <View style={s.resultInfo}>
                    <Text style={[s.resultName, { color: C.textPrimary }]} numberOfLines={1}>
                      {item.chatName}
                    </Text>
                    {item.type === 'message' && (
                      <>
                        {item.senderName && (
                          <Text style={[s.resultSender, { color: '#07a472' }]} numberOfLines={1}>
                            {item.senderName}
                          </Text>
                        )}
                        <HighlightText
                          text={item.messageText || ''}
                          query={query}
                          style={[s.resultText, { color: C.textTertiary }]}
                        />
                      </>
                    )}
                  </View>
                  {item.messageDate && (
                    <Text style={[s.resultDate, { color: C.textTertiary }]}>{formatDate(item.messageDate)}</Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 10, paddingTop: 10, gap: 8 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 22, paddingHorizontal: 12, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827', paddingVertical: 0 },
  empty: { alignItems: 'center', marginTop: 80, gap: 10, paddingHorizontal: 30 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center' },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 7 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  resultInfo: { flex: 1, minWidth: 0 },
  resultName: { fontSize: 15, fontWeight: '700', marginBottom: 1 },
  resultSender: { fontSize: 12, fontWeight: '600', marginBottom: 1 },
  resultText: { fontSize: 13 },
  resultDate: { fontSize: 11, flexShrink: 0 },
});
