// ══════════════════════════════════════════════════════════════════
// CreateGroupModal — WhatsApp/WeChat style group creation
// Paso 1: seleccionar participantes | Paso 2: nombre + avatar
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  TextInput, FlatList, ActivityIndicator, Alert,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Polyline, Circle } from 'react-native-svg';
import { chatAPI, contactsAPI } from '../../api';
import { EGAvatar } from '../ui';
import { toast } from '../Toast';
import { useThemeContext } from '../../theme/ThemeContext';
import { Colors } from '../../theme/colors';
import { DarkColors } from '../../theme/darkMode';

interface Contact {
  id: string;
  user_id?: string;
  contact_user_id?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  users?: { full_name?: string; avatar_url?: string };
  user?: { full_name?: string; avatar_url?: string };
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: (chat: any) => void;
}

function getName(c: Contact) {
  return c.full_name || c.users?.full_name || c.user?.full_name || c.phone || 'Usuario';
}
function getAvatar(c: Contact) {
  return c.avatar_url || c.users?.avatar_url || c.user?.avatar_url || undefined;
}
function getUserId(c: Contact) {
  return c.contact_user_id || c.user_id || c.id;
}

export function CreateGroupModal({ visible, onClose, onGroupCreated }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact[]>([]);
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  useEffect(() => {
    if (!visible) return;
    setStep(1);
    setSelected([]);
    setGroupName('');
    setSearch('');
    setLoading(true);
    contactsAPI.getAll()
      .then(data => setContacts(Array.isArray(data) ? data : []))
      .catch(() => toast.error('No se pudieron cargar los contactos'))
      .finally(() => setLoading(false));
  }, [visible]);

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    return !q || getName(c).toLowerCase().includes(q) || (c.phone || '').includes(q);
  });

  const toggleSelect = useCallback((c: Contact) => {
    setSelected(prev => {
      const id = getUserId(c);
      if (prev.find(s => getUserId(s) === id)) return prev.filter(s => getUserId(s) !== id);
      if (prev.length >= 255) { toast.info('Máximo 255 participantes'); return prev; }
      return [...prev, c];
    });
  }, []);

  const handleCreate = useCallback(async () => {
    const name = groupName.trim();
    if (!name) { toast.error('Ponle un nombre al grupo'); return; }
    if (selected.length < 1) { toast.error('Selecciona al menos 1 participante'); return; }
    setCreating(true);
    try {
      const ids = selected.map(getUserId).filter(Boolean) as string[];
      const chat = await chatAPI.createGroup(name, ids);
      toast.success('Grupo creado', name);
      onGroupCreated(chat);
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo crear el grupo');
    } finally {
      setCreating(false);
    }
  }, [groupName, selected, onGroupCreated, onClose]);

  const isSelectedContact = (c: Contact) =>
    !!selected.find(s => getUserId(s) === getUserId(c));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.root, { backgroundColor: C.bgPrimary, paddingTop: insets.top }]}>

          {/* ── Header ── */}
          <LinearGradient colors={['#07a472', '#00b4e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
            <TouchableOpacity onPress={step === 1 ? onClose : () => setStep(1)} style={s.headerBtn}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                {step === 1
                  ? <><Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/></>
                  : <><Line x1="19" y1="12" x2="5" y2="12"/><Polyline points="12 19 5 12 12 5"/></>
                }
              </Svg>
            </TouchableOpacity>
            <Text style={s.headerTitle}>
              {step === 1 ? 'Nuevo grupo' : 'Nombre del grupo'}
            </Text>
            {step === 1 ? (
              <TouchableOpacity
                onPress={() => selected.length > 0 && setStep(2)}
                style={[s.headerBtn, s.nextBtn, selected.length === 0 && s.nextBtnDisabled]}
              >
                <Text style={s.nextText}>Siguiente</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleCreate} style={s.headerBtn} disabled={creating}>
                {creating
                  ? <ActivityIndicator color="#fff" size="small"/>
                  : <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"><Path d="M20 6L9 17l-5-5"/></Svg>
                }
              </TouchableOpacity>
            )}
          </LinearGradient>

          {step === 1 ? (
            <>
              {/* Participantes seleccionados */}
              {selected.length > 0 && (
                <View style={[s.selectedBar, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
                  <FlatList
                    data={selected}
                    horizontal
                    keyExtractor={c => getUserId(c)}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ padding: 8, gap: 10 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={s.chip} onPress={() => toggleSelect(item)}>
                        <EGAvatar src={getAvatar(item)} name={getName(item)} size={40} />
                        <Text style={[s.chipName, { color: C.textPrimary }]} numberOfLines={1}>{getName(item)}</Text>
                        <View style={s.chipX}>
                          <Text style={s.chipXText}>×</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                  <Text style={[s.selectedCount, { color: C.textTertiary }]}>
                    {selected.length} seleccionado{selected.length !== 1 ? 's' : ''}
                  </Text>
                </View>
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

              {/* Lista */}
              {loading
                ? <ActivityIndicator style={{ marginTop: 40 }} color={Colors.accent} />
                : (
                  <FlatList
                    data={filtered}
                    keyExtractor={c => getUserId(c)}
                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                    renderItem={({ item }) => {
                      const sel = isSelectedContact(item);
                      return (
                        <TouchableOpacity
                          style={[s.contactRow, { borderBottomColor: C.borderLight }]}
                          onPress={() => toggleSelect(item)}
                          activeOpacity={0.7}
                        >
                          <View style={s.contactLeft}>
                            <EGAvatar src={getAvatar(item)} name={getName(item)} size={46} />
                            <View style={s.contactInfo}>
                              <Text style={[s.contactName, { color: C.textPrimary }]}>{getName(item)}</Text>
                              {item.phone && <Text style={[s.contactPhone, { color: C.textTertiary }]}>{item.phone}</Text>}
                            </View>
                          </View>
                          <View style={[s.checkbox, sel && s.checkboxSelected]}>
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
            /* ── Paso 2: nombre del grupo ── */
            <View style={s.step2}>
              {/* Avatares de participantes */}
              <View style={s.membersPreview}>
                {selected.slice(0, 5).map((c, i) => (
                  <View key={getUserId(c)} style={[s.memberAvatar, { marginLeft: i > 0 ? -10 : 0, zIndex: 5 - i }]}>
                    <EGAvatar src={getAvatar(c)} name={getName(c)} size={44} />
                  </View>
                ))}
                {selected.length > 5 && (
                  <View style={[s.memberAvatar, s.memberMore]}>
                    <Text style={s.memberMoreText}>+{selected.length - 5}</Text>
                  </View>
                )}
              </View>
              <Text style={[s.memberCount, { color: C.textTertiary }]}>
                {selected.length} participante{selected.length !== 1 ? 's' : ''}
              </Text>

              {/* Campo nombre */}
              <View style={[s.nameWrap, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={1.8} strokeLinecap="round">
                  <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <Circle cx="9" cy="7" r="4"/>
                  <Path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <Path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </Svg>
                <TextInput
                  style={[s.nameInput, { color: C.textPrimary }]}
                  placeholder="Nombre del grupo..."
                  placeholderTextColor={C.textTertiary}
                  value={groupName}
                  onChangeText={setGroupName}
                  maxLength={60}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleCreate}
                />
                {groupName.length > 0 && (
                  <TouchableOpacity onPress={() => setGroupName('')}>
                    <Text style={{ fontSize: 18, color: C.textTertiary }}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[s.nameHint, { color: C.textTertiary }]}>{groupName.length}/60</Text>

              {/* Lista de miembros */}
              <Text style={[s.membersLabel, { color: C.textTertiary }]}>Participantes</Text>
              <FlatList
                data={selected}
                keyExtractor={c => getUserId(c)}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                renderItem={({ item }) => (
                  <View style={[s.contactRow, { borderBottomColor: C.borderLight }]}>
                    <View style={s.contactLeft}>
                      <EGAvatar src={getAvatar(item)} name={getName(item)} size={42} />
                      <Text style={[s.contactName, { color: C.textPrimary }]}>{getName(item)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleSelect(item)}>
                      <Text style={{ color: '#ef4444', fontSize: 20, fontWeight: '700', paddingHorizontal: 8 }}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    paddingTop: 10,
    gap: 6,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff', marginLeft: 4 },
  nextBtn: { paddingHorizontal: 12, borderRadius: 16 },
  nextBtnDisabled: { opacity: 0.4 },
  nextText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  selectedBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  selectedCount: { fontSize: 11, textAlign: 'center', paddingBottom: 4 },
  chip: { alignItems: 'center', width: 56 },
  chipName: { fontSize: 10, marginTop: 3, textAlign: 'center' },
  chipX: {
    position: 'absolute', top: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center',
  },
  chipXText: { color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contactLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '600' },
  contactPhone: { fontSize: 12, marginTop: 2 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: '#07a472', borderColor: '#07a472' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 15 },
  // step 2
  step2: { flex: 1, paddingHorizontal: 20 },
  membersPreview: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, marginBottom: 8 },
  memberAvatar: { borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: '#fff' },
  memberMore: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#07a472',
    alignItems: 'center', justifyContent: 'center',
  },
  memberMoreText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  memberCount: { textAlign: 'center', fontSize: 13, marginBottom: 24 },
  nameWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
  },
  nameInput: { flex: 1, fontSize: 16, paddingVertical: 2 },
  nameHint: { fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 16 },
  membersLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
});
