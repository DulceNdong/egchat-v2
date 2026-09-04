// ══════════════════════════════════════════════════════════════════
// Broadcast / Lista de difusión — envía un mensaje a múltiples
// contactos a la vez (cada uno lo recibe en su chat privado)
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, TextInput,
  FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Polyline, Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { chatAPI, contactsAPI } from '../src/api';
import { EGAvatar } from '../src/components/ui';
import { toast } from '../src/components/Toast';
import { useThemeContext } from '../src/theme/ThemeContext';
import { Colors } from '../src/theme/colors';
import { DarkColors } from '../src/theme/darkMode';

interface Contact {
  id: string;
  contact_user_id?: string;
  user_id?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  users?: { full_name?: string; avatar_url?: string };
}

function getName(c: Contact) { return c.full_name || c.users?.full_name || c.phone || 'Usuario'; }
function getAvatar(c: Contact) { return c.avatar_url || c.users?.avatar_url || undefined; }
function getUserId(c: Contact) { return c.contact_user_id || c.user_id || c.id; }

export default function BroadcastScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0 });
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  useEffect(() => {
    setLoading(true);
    contactsAPI.getAll()
      .then(data => setContacts(Array.isArray(data) ? data : []))
      .catch(() => toast.error('No se pudieron cargar los contactos'))
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = useCallback((c: Contact) => {
    const id = getUserId(c);
    setSelected(prev =>
      prev.find(s => getUserId(s) === id)
        ? prev.filter(s => getUserId(s) !== id)
        : [...prev, c]
    );
  }, []);

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    return !q || getName(c).toLowerCase().includes(q) || (c.phone || '').includes(q);
  });

  const handleSend = useCallback(async () => {
    if (!message.trim()) { toast.error('Escribe el mensaje'); return; }
    if (selected.length === 0) { toast.error('Selecciona al menos 1 contacto'); return; }

    setSending(true);
    setProgress({ sent: 0, total: selected.length });
    let sentCount = 0;
    let failedCount = 0;

    for (const contact of selected) {
      const userId = getUserId(contact);
      try {
        // Obtener o crear el chat privado
        const chat = await chatAPI.createPrivate(userId);
        if (chat?.id) {
          await chatAPI.sendMessage(chat.id, { text: message.trim(), type: 'text' });
          sentCount++;
        }
      } catch {
        failedCount++;
      }
      setProgress({ sent: sentCount + failedCount, total: selected.length });
      // Pequeña pausa para no saturar el servidor
      await new Promise(r => setTimeout(r, 120));
    }

    setSending(false);
    if (failedCount === 0) {
      toast.success('Difusión enviada', `${sentCount} mensajes enviados`);
    } else {
      toast.info(`${sentCount} enviados, ${failedCount} fallidos`);
    }
    router.back();
  }, [message, selected]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bgPrimary }]} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#07a472', '#00b4e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
        <TouchableOpacity
          onPress={step === 1 ? () => router.back() : () => setStep(1)}
          style={s.headerBtn}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
            {step === 1
              ? <><Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/></>
              : <><Line x1="19" y1="12" x2="5" y2="12"/><Polyline points="12 19 5 12 12 5"/></>
            }
          </Svg>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Lista de difusión</Text>
          <Text style={s.headerSub}>
            {step === 1
              ? `${selected.length} seleccionado${selected.length !== 1 ? 's' : ''}`
              : 'Redactar mensaje'
            }
          </Text>
        </View>
        {step === 1 ? (
          <TouchableOpacity
            onPress={() => selected.length > 0 && setStep(2)}
            style={[s.headerBtnText, selected.length === 0 && { opacity: 0.4 }]}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Siguiente</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSend} style={s.headerBtn} disabled={sending}>
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                  <Line x1="22" y1="2" x2="11" y2="13"/>
                  <Polyline points="22 2 15 22 11 13 2 9 22 2"/>
                </Svg>
            }
          </TouchableOpacity>
        )}
      </LinearGradient>

      {step === 1 ? (
        <>
          {/* Chips seleccionados */}
          {selected.length > 0 && (
            <FlatList
              horizontal
              data={selected}
              keyExtractor={c => getUserId(c)}
              contentContainerStyle={{ padding: 8, gap: 8 }}
              style={[s.chipsBar, { borderBottomColor: C.borderLight }]}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.chip} onPress={() => toggleSelect(item)}>
                  <EGAvatar src={getAvatar(item)} name={getName(item)} size={38} />
                  <Text style={[s.chipName, { color: C.textPrimary }]} numberOfLines={1}>{getName(item)}</Text>
                  <View style={s.chipX}><Text style={s.chipXText}>×</Text></View>
                </TouchableOpacity>
              )}
            />
          )}

          {/* Búsqueda */}
          <View style={[s.searchWrap, { backgroundColor: C.bgSecondary }]}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={1.8} strokeLinecap="round">
              <Circle cx="11" cy="11" r="8"/><Path d="M21 21l-4.35-4.35"/>
            </Svg>
            <TextInput
              style={[s.searchInput, { color: C.textPrimary }]}
              placeholder="Buscar contactos..."
              placeholderTextColor={C.textTertiary}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {loading
            ? <ActivityIndicator style={{ marginTop: 40 }} color={Colors.accent} />
            : (
              <FlatList
                data={filtered}
                keyExtractor={c => getUserId(c)}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                renderItem={({ item }) => {
                  const sel = !!selected.find(s => getUserId(s) === getUserId(item));
                  return (
                    <TouchableOpacity
                      style={[s.contactRow, { borderBottomColor: C.borderLight }]}
                      onPress={() => toggleSelect(item)}
                      activeOpacity={0.7}
                    >
                      <EGAvatar src={getAvatar(item)} name={getName(item)} size={46} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[s.contactName, { color: C.textPrimary }]}>{getName(item)}</Text>
                        {item.phone && <Text style={[s.contactPhone, { color: C.textTertiary }]}>{item.phone}</Text>}
                      </View>
                      <View style={[s.checkbox, sel && s.checkboxSel]}>
                        {sel && (
                          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round">
                            <Path d="M20 6L9 17l-5-5"/>
                          </Svg>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <Text style={[s.empty, { color: C.textTertiary }]}>
                    {search ? 'Sin resultados' : 'No tienes contactos aún'}
                  </Text>
                }
              />
            )
          }
        </>
      ) : (
        /* ── Paso 2: redactar ── */
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.step2}>
            <View style={[s.infoBox, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#07a472" strokeWidth={2} strokeLinecap="round">
                <Path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </Svg>
              <Text style={[s.infoText, { color: C.textTertiary }]}>
                El mensaje se enviará a {selected.length} contacto{selected.length !== 1 ? 's' : ''} en chats individuales
              </Text>
            </View>

            <TextInput
              style={[s.msgInput, { color: C.textPrimary, backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}
              placeholder="Escribe tu mensaje de difusión..."
              placeholderTextColor={C.textTertiary}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={1000}
              autoFocus
            />
            <Text style={[s.charCount, { color: C.textTertiary }]}>{message.length}/1000</Text>

            {/* Preview de destinatarios */}
            <Text style={[s.recipientsLabel, { color: C.textTertiary }]}>DESTINATARIOS</Text>
            <FlatList
              data={selected}
              keyExtractor={c => getUserId(c)}
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
              renderItem={({ item }) => (
                <View style={[s.recipientRow, { borderBottomColor: C.borderLight }]}>
                  <EGAvatar src={getAvatar(item)} name={getName(item)} size={40} />
                  <Text style={[s.recipientName, { color: C.textPrimary }]}>{getName(item)}</Text>
                </View>
              )}
            />
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Overlay de envío */}
      {sending && (
        <View style={s.sendingOverlay}>
          <View style={s.sendingBox}>
            <ActivityIndicator color="#07a472" size="large" />
            <Text style={s.sendingText}>
              Enviando {progress.sent}/{progress.total}...
            </Text>
            <View style={s.progressBar}>
              <View style={[s.progressFill, {
                width: `${progress.total > 0 ? (progress.sent / progress.total) * 100 : 0}%`
              }]} />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 12, paddingTop: 10, gap: 4 },
  headerBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { height: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 1 },
  chipsBar: { borderBottomWidth: StyleSheet.hairlineWidth, maxHeight: 80 },
  chip: { alignItems: 'center', width: 58 },
  chipName: { fontSize: 10, marginTop: 3, textAlign: 'center' },
  chipX: {
    position: 'absolute', top: -4, right: -4, width: 18, height: 18,
    borderRadius: 9, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center',
  },
  chipXText: { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  contactName: { fontSize: 15, fontWeight: '600' },
  contactPhone: { fontSize: 12, marginTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxSel: { backgroundColor: '#07a472', borderColor: '#07a472' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 15 },
  // step 2
  step2: { flex: 1, padding: 16 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 16 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  msgInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, minHeight: 120, textAlignVertical: 'top', lineHeight: 22 },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 16 },
  recipientsLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  recipientName: { fontSize: 15, fontWeight: '600' },
  // sending overlay
  sendingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  sendingBox: { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', gap: 12, width: 240 },
  sendingText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  progressBar: { width: '100%', height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#07a472', borderRadius: 2 },
});
