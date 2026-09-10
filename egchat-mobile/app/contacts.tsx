// EGCHAT — Contactos (diseño moderno v2)
// Lista de contactos con búsqueda, favoritos, añadir por teléfono,
// separadores de letras, estado online, acciones rápidas
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, RefreshControl,
  SectionList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import { contactsAPI, chatAPI } from '../src/api';
import { EGAvatar } from '../src/components/ui';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';

// ── Normalizar teléfono ───────────────────────────────────────────
const normalizePhone = (raw: string) => {
  const trimmed = String(raw || '').trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return trimmed;
  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('240')) return `+${digits}`;
  if (digits.length === 9) return `+240${digits}`;
  return digits;
};

// ── Helpers de campo ──────────────────────────────────────────────
const getName    = (c: any) => c?.user?.full_name || c?.full_name || c?.name || c?.nickname || 'Usuario';
const getPhone   = (c: any) => c?.user?.phone     || c?.phone     || '';
const getAvatar  = (c: any) => c?.user?.avatar_url || c?.avatar_url || '';
const getUserId  = (c: any) => c?.contact_user_id  || c?.user?.id  || c?.id;

// ── Iconos SVG ────────────────────────────────────────────────────
const IcoBack = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 12H5"/><Path d="M12 19l-7-7 7-7"/>
  </Svg>
);
const IcoSearch = ({ color }: { color: string }) => (
  <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
    <Circle cx="11" cy="11" r="8"/><Path d="M21 21l-4.35-4.35"/>
  </Svg>
);
const IcoChat = ({ color }: { color: string }) => (
  <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </Svg>
);
const IcoStar = ({ color, filled }: { color: string; filled?: boolean }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </Svg>
);
const IcoUserPlus = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <Circle cx="9" cy="7" r="4"/>
    <Line x1="19" y1="8" x2="19" y2="14"/>
    <Line x1="16" y1="11" x2="22" y2="11"/>
  </Svg>
);
const IcoUsers = ({ color }: { color: string }) => (
  <Svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <Circle cx="9" cy="7" r="4"/>
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <Path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </Svg>
);
const IcoClose = ({ color }: { color: string }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
    <Path d="M18 6L6 18"/><Path d="M6 6l12 12"/>
  </Svg>
);

// ── Pantalla principal ────────────────────────────────────────────
export default function ContactsScreen() {
  const [contacts,   setContacts]   = useState<any[]>([]);
  const [query,      setQuery]      = useState('');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addPhone,   setAddPhone]   = useState('');
  const [adding,     setAdding]     = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);

  const { isDark } = useThemeContext();
  const C      = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const insets = useSafeAreaInsets();

  // ── Cargar contactos ─────────────────────────────────────────
  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await contactsAPI.getAll();
      setContacts(data || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Añadir contacto ──────────────────────────────────────────
  const addContact = useCallback(async () => {
    const phone = normalizePhone(addPhone);
    if (!phone) return;
    setAdding(true);
    try {
      const contact = await contactsAPI.add(undefined, phone);
      setAddPhone('');
      setShowAdd(false);
      load();
      Alert.alert('✅ Contacto añadido', '¿Quieres abrir el chat ahora?', [
        { text: 'Luego', style: 'cancel' },
        {
          text: 'Abrir chat',
          onPress: async () => {
            const uid = getUserId(contact);
            if (!uid) return;
            const chat = await chatAPI.createPrivate(uid);
            router.replace(`/chat/${chat.id}` as any);
          },
        },
      ]);
    } catch {
      try {
        const chat = await chatAPI.createPrivate(undefined, phone);
        setAddPhone('');
        setShowAdd(false);
        router.replace(`/chat/${chat.id}` as any);
      } catch {
        Alert.alert('No encontrado', `El número ${phone} no está registrado en EGCHAT.`);
      }
    } finally { setAdding(false); }
  }, [addPhone, load]);

  // ── Abrir chat ───────────────────────────────────────────────
  const openChat = useCallback(async (contact: any) => {
    const uid = getUserId(contact);
    if (!uid) { Alert.alert('Error', 'Contacto sin usuario asociado'); return; }
    try {
      const chat = await chatAPI.createPrivate(uid);
      router.push(`/chat/${chat.id}` as any);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo abrir el chat');
    }
  }, []);

  // ── Eliminar contacto ────────────────────────────────────────
  const removeContact = useCallback((id: string, name: string) => {
    Alert.alert('Eliminar contacto', `¿Eliminar a ${name} de tus contactos?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          await contactsAPI.remove(id).catch(() => {});
          setContacts(prev => prev.filter(c => c.id !== id));
        },
      },
    ]);
  }, []);

  // ── Favorito toggle ──────────────────────────────────────────
  const toggleFav = useCallback(async (contact: any) => {
    const isFav = !!contact.is_favorite;
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, is_favorite: !isFav } : c));
    try {
      if (isFav) await contactsAPI.unfavorite(contact.id);
      else       await contactsAPI.favorite(contact.id);
    } catch {
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, is_favorite: isFav } : c));
    }
  }, []);

  // ── Filtrado + secciones por letra ───────────────────────────
  const sections = useMemo(() => {
    const list = query
      ? contacts.filter(c =>
          getName(c).toLowerCase().includes(query.toLowerCase()) ||
          getPhone(c).includes(query)
        )
      : contacts;

    if (list.length === 0) return [];

    // Favoritos primero
    const favs  = list.filter(c => c.is_favorite);
    const rest  = list.filter(c => !c.is_favorite);

    const grouped: Record<string, any[]> = {};
    rest.forEach(c => {
      const letter = getName(c)[0]?.toUpperCase() || '#';
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(c);
    });

    const result: { title: string; data: any[] }[] = [];
    if (favs.length > 0) result.push({ title: '⭐ Favoritos', data: favs });
    Object.keys(grouped).sort().forEach(letter => {
      result.push({ title: letter, data: grouped[letter] });
    });
    return result;
  }, [contacts, query]);

  // ── Item de contacto ─────────────────────────────────────────
  const renderContact = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity
      style={[st.item, { backgroundColor: C.bgPrimary }]}
      onPress={() => openChat(item)}
      onLongPress={() => removeContact(item.id, getName(item))}
      activeOpacity={0.7}
    >
      <View style={st.avatarWrap}>
        <EGAvatar src={getAvatar(item)} name={getName(item)} size={48} />
      </View>
      <View style={st.info}>
        <Text style={[st.name, { color: C.textPrimary }]} numberOfLines={1}>{getName(item)}</Text>
        <Text style={[st.phone, { color: C.textTertiary }]} numberOfLines={1}>{getPhone(item)}</Text>
      </View>
      <View style={st.actions}>
        <TouchableOpacity
          style={st.actionBtn}
          onPress={() => toggleFav(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IcoStar color={item.is_favorite ? '#f59e0b' : C.textTertiary} filled={!!item.is_favorite} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.actionBtn, st.chatBtn]}
          onPress={() => openChat(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IcoChat color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ), [C, openChat, removeContact, toggleFav]);

  const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
    <View style={[st.sectionHeader, { backgroundColor: C.bgSecondary }]}>
      <Text style={[st.sectionTitle, { color: C.textTertiary }]}>{section.title}</Text>
    </View>
  ), [C]);

  const renderSeparator = useCallback(() => (
    <View style={[st.separator, { backgroundColor: C.borderLight, marginLeft: 76 }]} />
  ), [C]);

  return (
    <SafeAreaView style={[st.root, { backgroundColor: C.bgPrimary }]} edges={['left', 'right']}>

      {/* ── Header ──────────────────────────────────────────── */}
      <View style={[st.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IcoBack color={C.textPrimary} />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Text style={[st.headerTitle, { color: C.textPrimary }]}>Contactos</Text>
          {contacts.length > 0 && (
            <View style={st.countBadge}>
              <Text style={st.countText}>{contacts.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[st.addIconBtn, { backgroundColor: '#6366f1' + '18', borderColor: '#6366f1' + '33' }]}
          onPress={() => setShowAdd(v => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IcoUserPlus color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* ── Añadir contacto (colapsable) ────────────────────── */}
      {showAdd && (
        <View style={[st.addBar, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
          <View style={[st.addInputWrap, { backgroundColor: C.bgTertiary, borderColor: C.border }]}>
            <TextInput
              style={[st.addInput, { color: C.textPrimary }]}
              value={addPhone}
              onChangeText={setAddPhone}
              placeholder="+240 xxx xxx xxx"
              placeholderTextColor={C.textTertiary}
              keyboardType="phone-pad"
              returnKeyType="done"
              onSubmitEditing={addContact}
              autoFocus
            />
            {addPhone.length > 0 && (
              <TouchableOpacity onPress={() => setAddPhone('')} style={st.clearBtn}>
                <IcoClose color={C.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[st.addBtn, (!addPhone.trim() || adding) && st.addBtnDisabled]}
            onPress={addContact}
            disabled={!addPhone.trim() || adding}
            activeOpacity={0.85}
          >
            {adding
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={st.addBtnText}>Añadir</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Barra búsqueda ───────────────────────────────────── */}
      <View style={[st.searchWrap, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <View style={[st.searchBar, { backgroundColor: C.bgTertiary, borderColor: C.border }]}>
          <IcoSearch color={C.textTertiary} />
          <TextInput
            style={[st.searchInput, { color: C.textPrimary }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar contacto..."
            placeholderTextColor={C.textTertiary}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={st.clearBtn}>
              <IcoClose color={C.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Contenido ────────────────────────────────────────── */}
      {loading ? (
        <View style={st.center}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : sections.length === 0 ? (
        <View style={st.center}>
          <IcoUsers color={C.border} />
          <Text style={[st.emptyTitle, { color: C.textPrimary }]}>
            {query ? 'Sin resultados' : 'No tienes contactos aún'}
          </Text>
          <Text style={[st.emptySub, { color: C.textSecondary }]}>
            {query ? 'Prueba con otro nombre o número' : 'Toca el icono + para añadir tu primer contacto'}
          </Text>
          {!query && (
            <TouchableOpacity
              style={st.emptyAddBtn}
              onPress={() => setShowAdd(true)}
              activeOpacity={0.85}
            >
              <Text style={st.emptyAddBtnText}>Añadir contacto</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => getUserId(item) || item.id}
          renderItem={renderContact}
          renderSectionHeader={renderSectionHeader}
          ItemSeparatorComponent={renderSeparator}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#6366f1"
              colors={['#6366f1']}
            />
          }
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      )}
    </SafeAreaView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const ACCENT = '#6366f1';

const st = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  countBadge: {
    backgroundColor: ACCENT,
    borderRadius: 12, paddingHorizontal: 7, paddingVertical: 2,
  },
  countText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  addIconBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },

  // Add bar
  addBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  addInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 12,
  },
  addInput: { flex: 1, fontSize: 15, paddingVertical: 10 },
  addBtn: {
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 12, backgroundColor: ACCENT,
  },
  addBtnDisabled: { backgroundColor: '#9ca3af' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  clearBtn: { padding: 4 },

  // Search
  searchWrap: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 12, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 9 },

  // Section header
  sectionHeader: {
    paddingHorizontal: 16, paddingVertical: 5,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  // Contact item
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    gap: 12,
  },
  avatarWrap: { position: 'relative' },
  info: { flex: 1, minWidth: 0 },
  name:  { fontSize: 15, fontWeight: '600' },
  phone: { fontSize: 12, marginTop: 2 },
  separator: { height: StyleSheet.hairlineWidth },

  // Actions
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  chatBtn: { backgroundColor: ACCENT },

  // Empty
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  emptySub:   { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyAddBtn: {
    marginTop: 16, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 14, backgroundColor: ACCENT,
  },
  emptyAddBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
