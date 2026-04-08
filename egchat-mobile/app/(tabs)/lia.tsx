import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { liaAPI } from '../../src/api';
import * as Speech from 'expo-speech';

interface Msg { id: string; role: 'user' | 'assistant'; content: string; time: string }

const SUGGESTIONS = ['¿Cuál es mi saldo?', 'Noticias de hoy', 'Pedir un taxi', 'Enviar dinero', 'Centros de salud'];

export default function LiaScreen() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: '0', role: 'assistant', content: '¡Hola! Soy Lia-25, tu asistente inteligente de EGCHAT. ¿En qué puedo ayudarte?', time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    const now = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const userMsg: Msg = { id: Date.now().toString(), role: 'user', content: msg, time: now };
    setMessages(p => [...p, userMsg]);
    setLoading(true);
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await liaAPI.chat(msg, history);
      const aMsg: Msg = { id: (Date.now() + 1).toString(), role: 'assistant', content: res.reply, time: now };
      setMessages(p => [...p, aMsg]);
      Speech.speak(res.reply, { language: 'es-ES', rate: 1.0 });
    } catch {
      setMessages(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Lo siento, no puedo conectarme ahora. Inténtalo de nuevo.', time: now }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>🤖</Text></View>
        <View><Text style={styles.name}>Lia-25</Text><Text style={styles.status}>● Asistente inteligente</Text></View>
      </View>

      <FlatList ref={listRef} data={messages} keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.aiText]}>{item.content}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        )}
        ListFooterComponent={loading ? <ActivityIndicator color="#00c8a0" style={{ margin: 12 }} /> : null}
      />

      {messages.length <= 1 && (
        <View style={styles.suggestions}>
          {SUGGESTIONS.map(s => (
            <TouchableOpacity key={s} style={styles.chip} onPress={() => send(s)}>
              <Text style={styles.chipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputRow}>
          <TextInput style={styles.input} value={input} onChangeText={setInput}
            placeholder="Pregunta a Lia-25..." placeholderTextColor="#9CA3AF"
            onSubmitEditing={() => send()} returnKeyType="send" />
          <TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} onPress={() => send()} disabled={!input.trim()}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0FDF9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  status: { fontSize: 11, color: '#00c8a0', fontWeight: '600' },
  list: { padding: 12, gap: 8 },
  bubble: { maxWidth: '80%', borderRadius: 18, padding: 12, marginVertical: 2 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#00c8a0', borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#F0F2F5' },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#fff' },
  aiText: { color: '#111827' },
  time: { fontSize: 10, color: 'rgba(0,0,0,0.3)', marginTop: 4, textAlign: 'right' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
  chip: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F2F5' },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00c8a0', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#E5E7EB' },
  sendIcon: { color: '#fff', fontSize: 16 },
});
