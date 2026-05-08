import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Keyboard,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  id: string;
  text: string;
  mine: boolean;
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

const MOCK_MESSAGES: Message[] = [
  { id: '1', text: 'Hola, ¿cómo estás?', mine: false, time: '10:28', status: 'read' },
  { id: '2', text: 'Todo bien, ¿y tú?', mine: true, time: '10:29', status: 'read' },
  { id: '3', text: 'Muy bien gracias. ¿Pudiste revisar lo que te envié?', mine: false, time: '10:30', status: 'read' },
  { id: '4', text: 'Sí, lo estoy revisando ahora mismo', mine: true, time: '10:31', status: 'delivered' },
];

export default function ChatScreen() {
  const { id, name, color } = useLocalSearchParams<{ id: string; name: string; color: string }>();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const contactName = name || 'Chat';
  const contactColor = color || '#00c8a0';
  const initials = contactName.slice(0, 2).toUpperCase();

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      text,
      mine: true,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const StatusIcon = ({ status }: { status: Message['status'] }) => {
    if (status === 'read') return <Text style={styles.statusRead}>✓✓</Text>;
    if (status === 'delivered') return <Text style={styles.statusDelivered}>✓✓</Text>;
    return <Text style={styles.statusSent}>✓</Text>;
  };

  return (
    // SafeAreaView solo para top — el bottom lo maneja KeyboardAvoidingView
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#00c8a0" />

      {/* HEADER — siempre visible, nunca se mueve */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={[styles.avatar, { backgroundColor: contactColor + '30' }]}>
          <Text style={[styles.avatarText, { color: contactColor }]}>{initials}</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{contactName}</Text>
          <Text style={styles.headerStatus}>en línea</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionIcon}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BODY — KeyboardAvoidingView empuja el input hacia arriba cuando aparece el teclado */}
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Lista de mensajes */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.messageList, { paddingBottom: 8 }]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <View style={[styles.msgRow, item.mine ? styles.msgRowMine : styles.msgRowTheirs]}>
              <View style={[styles.bubble, item.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, item.mine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
                  {item.text}
                </Text>
                <View style={styles.bubbleMeta}>
                  <Text style={[styles.bubbleTime, item.mine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
                    {item.time}
                  </Text>
                  {item.mine && <StatusIcon status={item.status} />}
                </View>
              </View>
            </View>
          )}
        />

        {/* BARRA DE ESCRITURA — siempre pegada al fondo, sube con el teclado */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TouchableOpacity style={styles.attachBtn}>
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            returnKeyType="default"
          />

          {inputText.trim().length > 0 ? (
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micBtn}>
              <Text style={styles.micIcon}>🎤</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ECE5DD', // fondo estilo WhatsApp
  },

  // ── HEADER ──────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00c8a0',
    paddingHorizontal: 8,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    // zIndex alto para que nunca quede tapado
    zIndex: 100,
  },
  backBtn: {
    padding: 4,
    marginRight: 4,
  },
  backIcon: {
    fontSize: 32,
    color: '#fff',
    lineHeight: 36,
    fontWeight: '300',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  headerStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    padding: 8,
  },
  actionIcon: {
    fontSize: 20,
  },

  // ── BODY ────────────────────────────────────────────────
  body: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },

  // ── BURBUJAS ────────────────────────────────────────────
  msgRow: {
    marginBottom: 4,
    flexDirection: 'row',
  },
  msgRowMine: {
    justifyContent: 'flex-end',
  },
  msgRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  bubbleMine: {
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 2,
  },
  bubbleTheirs: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 2,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: '#111827',
  },
  bubbleTextTheirs: {
    color: '#111827',
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 3,
  },
  bubbleTime: {
    fontSize: 11,
  },
  bubbleTimeMine: {
    color: '#6B7280',
  },
  bubbleTimeTheirs: {
    color: '#9CA3AF',
  },
  statusRead: {
    fontSize: 11,
    color: '#00c8a0',
  },
  statusDelivered: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  statusSent: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  // ── INPUT BAR ───────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  attachIcon: {
    fontSize: 22,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: '#111827',
    maxHeight: 120,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#00c8a0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 18,
    color: '#fff',
  },
  micBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#00c8a0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: {
    fontSize: 18,
  },
});
