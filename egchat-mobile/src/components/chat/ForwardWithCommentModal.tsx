/**
 * ForwardWithCommentModal — reenviar mensaje con comentario opcional
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet,
  TextInput, TouchableOpacity, ActivityIndicator,
  FlatList, Alert, useColorScheme,
} from 'react-native';
import { EGAvatar } from '../ui';
import { chatAPI } from '../../api';
import { toast } from '../Toast';
import type { ChatMessage } from '../../types/chat';

interface ChatSummary {
  id: string;
  name?: string;
  avatar_url?: string;
  type: string;
}

interface Props {
  visible: boolean;
  message: ChatMessage | null;
  currentUserId: string;
  onClose: () => void;
  onForwarded?: () => void;
}

export function ForwardWithCommentModal({ visible, message, currentUserId, onClose, onForwarded }: Props) {
  const isDark = useColorScheme() === 'dark';
  const sheetBg = isDark ? '#1c1c1e' : '#fff';
  const textColor = isDark ? '#f9fafb' : '#111827';
  const previewBg = isDark ? '#374151' : '#f3f4f6';
  const cancelBg = isDark ? '#374151' : '#f3f4f6';
  const inputBg = isDark ? '#374151' : '#fff';
  const inputBorder = isDark ? '#4b5563' : '#e5e7eb';

  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSummary | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    chatAPI.getChats()
      .then((data: any[]) => setChats(data || []))
      .catch(() => setChats([]))
      .finally(() => setLoading(false));
    setSelectedChat(null);
    setComment('');
  }, [visible]);

  const handleSend = async () => {
    if (!selectedChat || !message) return;
    setSending(true);
    try {
      await chatAPI.sendMessage(selectedChat.id, {
        text: message.text || '',
        type: message.type || 'text',
        file_url: message.file_url,
        album_urls: (message as any).album_urls,
        forwarded_from: message.id,
      });
      if (comment.trim()) {
        await chatAPI.sendMessage(selectedChat.id, { text: comment.trim(), type: 'text' });
      }
      // Mensaje reenviado silenciosamente
      onForwarded?.();
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo reenviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const getChatName = (c: ChatSummary) => c.name || 'Chat';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: sheetBg }]} onPress={e => e.stopPropagation()}>
          <View style={s.handle} />
          <Text style={[s.title, { color: textColor }]}>➡️ Reenviar mensaje</Text>

          {message && (
            <View style={[s.preview, { backgroundColor: previewBg }]}>
              <Text style={[s.previewLabel]}>Mensaje original:</Text>
              <Text style={[s.previewText, { color: textColor }]} numberOfLines={3}>
                {message.type === 'image' ? '📷 Foto'
                  : message.type === 'video' ? '🎥 Video'
                  : message.type === 'audio' ? '🎵 Audio'
                  : message.type === 'album' ? '📷 Álbum'
                  : message.text || '(sin texto)'}
              </Text>
            </View>
          )}

          <Text style={[s.sectionLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Enviar a:</Text>
          {loading ? (
            <ActivityIndicator color="#00b4e6" style={{ marginVertical: 12 }} />
          ) : (
            <FlatList
              data={chats}
              keyExtractor={c => c.id}
              style={s.chatList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.chatRow, selectedChat?.id === item.id && { backgroundColor: isDark ? 'rgba(0,180,230,0.2)' : 'rgba(0,180,230,0.10)' }]}
                  onPress={() => setSelectedChat(item)}
                  activeOpacity={0.7}
                >
                  <EGAvatar src={item.avatar_url} name={getChatName(item)} size={36} />
                  <Text style={[s.chatName, { color: textColor }]} numberOfLines={1}>{getChatName(item)}</Text>
                  {selectedChat?.id === item.id && <Text style={s.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          )}

          <TextInput
            style={[s.commentInput, { color: textColor, borderColor: inputBorder, backgroundColor: inputBg }]}
            placeholder="Añadir comentario (opcional)..."
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
          />

          <View style={s.actions}>
            <TouchableOpacity style={[s.cancelBtn, { backgroundColor: cancelBg }]} onPress={onClose} activeOpacity={0.7}>
              <Text style={[s.cancelTxt, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.sendBtn, (!selectedChat || sending) && s.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!selectedChat || sending}
              activeOpacity={0.8}
            >
              {sending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.sendTxt}>Reenviar</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingBottom: 36, maxHeight: '80%' },
  handle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  preview: { borderRadius: 10, padding: 10, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#00b4e6' },
  previewLabel: { fontSize: 11, fontWeight: '700', color: '#00b4e6', marginBottom: 3 },
  previewText: { fontSize: 14 },
  sectionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  chatList: { maxHeight: 200, marginBottom: 10 },
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 10 },
  chatName: { flex: 1, fontSize: 14, fontWeight: '600' },
  checkmark: { fontSize: 16, color: '#00b4e6', fontWeight: '700' },
  commentInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 14, minHeight: 48, maxHeight: 80 },
  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  cancelTxt: { fontSize: 15, fontWeight: '600' },
  sendBtn: { flex: 2, paddingVertical: 13, borderRadius: 12, backgroundColor: '#00b4e6', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#b0cfe8' },
  sendTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
