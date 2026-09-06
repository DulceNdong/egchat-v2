import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { chatAPI, contactsAPI } from '../src/api';
import { EGAvatar } from '../src/components/ui';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';
import Svg, { Path, Circle } from 'react-native-svg';
import { pickContact } from '../src/utils/chatMedia';

const normalizePhoneForLookup = (raw: string) => {
  const trimmed = String(raw || '').trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return trimmed;
  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('240')) return `+${digits}`;
  if (digits.length === 9) return `+240${digits}`;
  return digits;
};

export default function NewChatScreen() {
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [contactList, users] = await Promise.all([
          contactsAPI.getAll().catch(() => []),
          chatAPI.searchUsers('').catch(() => []),
        ]);
        setContacts(contactList || []);
        setSuggestedUsers(users || []);
      } finally {
        setLoadingInitial(false);
      }
    };
    loadInitial();
  }, []);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await chatAPI.searchUsers(q.trim());
      setResults(data || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  const getRealUser = (item: any) => item?.user || item;
  const getRealUserId = (item: any) => item?.contact_user_id || item?.user?.id || item?.id;
  const getDisplayName = (item: any) => {
    const realUser = getRealUser(item);
    return realUser?.full_name || item?.full_name || item?.name || item?.nickname || 'Usuario';
  };
  const getDisplayPhone = (item: any) => {
    const realUser = getRealUser(item);
    return realUser?.phone || item?.phone || '';
  };
  const getDisplayAvatar = (item: any) => {
    const realUser = getRealUser(item);
    return realUser?.avatar_url || item?.avatar_url || '';
  };

  const startChat = useCallback(async (user: any) => {
    const realUserId = getRealUserId(user);
    if (!realUserId) {
      Alert.alert('Contacto incompleto', 'Este contacto no tiene usuario asociado.');
      return;
    }
    setCreating(realUserId);
    try {
      const chat = await chatAPI.createPrivate(realUserId);
      router.replace(`/chat/${chat.id}` as any);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo crear el chat');
    } finally { setCreating(null); }
  }, []);

  const addByPhone = useCallback(async (phoneNumber?: string, name?: string) => {
    const cleanPhone = normalizePhoneForLookup(phoneNumber || phone);
    if (!cleanPhone) return;
    setAdding(true);
    try {
      const contact = await contactsAPI.add(undefined, cleanPhone, name);
      setPhone('');
      setContacts(prev => [contact, ...prev.filter(c => getRealUserId(c) !== getRealUserId(contact))]);
      await startChat(contact);
    } catch {
      try {
        const chat = await chatAPI.createPrivate(undefined, cleanPhone);
        setPhone('');
        router.replace(`/chat/${chat.id}` as any);
      } catch {
        Alert.alert(
          'Usuario no encontrado',
          `El número ${cleanPhone} no aparece registrado en EGCHAT. Para iniciar chat, el contacto debe tener cuenta EGCHAT o puedes buscarlo por nombre/teléfono en la lista de usuarios.`,
          [{ text: 'Entendido' }],
        );
      }
    } finally {
      setAdding(false);
    }
  }, [phone, startChat]);

  const importDeviceContact = useCallback(async () => {
    const contact = await pickContact();
    if (!contact?.phone) return;
    await addByPhone(contact.phone, contact.name);
  }, [addByPhone]);

  const displayList = query.trim().length >= 2
    ? results
    : contacts.length > 0
      ? contacts
      : suggestedUsers;
  const sectionTitle = query.trim().length >= 2
    ? 'RESULTADOS'
    : contacts.length > 0
      ? 'MIS CONTACTOS'
      : 'USUARIOS EGCHAT DISPONIBLES';

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => startChat(item)}
      disabled={creating === getRealUserId(item)}
      activeOpacity={0.7}
    >
      <EGAvatar src={getDisplayAvatar(item)} name={getDisplayName(item)} size={46} />
      <View style={styles.info}>
        <Text style={styles.name}>{getDisplayName(item)}</Text>
        <Text style={styles.phone}>{getDisplayPhone(item)}</Text>
      </View>
      {creating === getRealUserId(item)
        ? <ActivityIndicator size="small" color={Colors.accent} />
        : <Text style={styles.arrow}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['left', 'right']}>
      <View style={[styles.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: C.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.textPrimary }]}>Nuevo chat</Text>
      </View>
      <View style={[styles.searchBar, { backgroundColor: C.bgSecondary, borderColor: C.border }]}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2} strokeLinecap="round">
          <Circle cx="11" cy="11" r="8"/><Path d="M21 21l-4.35-4.35"/>
        </Svg>
        <TextInput
          style={[styles.searchInput, { color: C.textPrimary }]}
          value={query}
          onChangeText={search}
          placeholder="Buscar por nombre o teléfono..."
          placeholderTextColor={C.textTertiary}
          autoFocus
        />
        {loading && <ActivityIndicator size="small" color={Colors.accent} />}
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={[styles.phoneInput, { backgroundColor: C.bgSecondary, borderColor: C.border, color: C.textPrimary }]}
          value={phone}
          onChangeText={setPhone}
          placeholder="Añadir por teléfono..."
          placeholderTextColor={C.textTertiary}
          keyboardType="phone-pad"
        />
        <TouchableOpacity
          style={[styles.addBtn, (!phone.trim() || adding) && styles.addBtnDisabled]}
          onPress={() => addByPhone()}
          disabled={!phone.trim() || adding}
        >
          {adding ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addBtnText}>+</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.importBtn, { backgroundColor: C.bgSecondary, borderColor: C.border }]} onPress={importDeviceContact}>
          <Text style={styles.importBtnText}>Agenda</Text>
        </TouchableOpacity>
      </View>

      {displayList.length > 0 && (
        <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>{sectionTitle}</Text>
      )}
      {query.trim().length >= 2 && results.length === 0 && !loading && (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: C.textSecondary }]}>Sin resultados para "{query}"</Text>
        </View>
      )}
      {loadingInitial ? (
        <View style={styles.empty}><ActivityIndicator color={Colors.accent} /></View>
      ) : displayList.length === 0 && query.trim().length < 2 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: C.textPrimary }]}>No hay contactos todavía</Text>
          <Text style={[styles.emptySub, { color: C.textSecondary }]}>Añade un número, importa desde la agenda o busca un usuario EGCHAT.</Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={item => getRealUserId(item) || item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.item, { backgroundColor: C.bgSecondary }]} onPress={() => startChat(item)} disabled={creating === getRealUserId(item)} activeOpacity={0.7}>
              <EGAvatar src={getDisplayAvatar(item)} name={getDisplayName(item)} size={46} />
              <View style={styles.info}>
                <Text style={[styles.name, { color: C.textPrimary }]}>{getDisplayName(item)}</Text>
                <Text style={[styles.phone, { color: C.textTertiary }]}>{getDisplayPhone(item)}</Text>
              </View>
              {creating === getRealUserId(item) ? <ActivityIndicator size="small" color={Colors.accent} /> : <Text style={[styles.arrow, { color: C.border }]}>›</Text>}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: C.borderLight }]} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  title: { ...Typography.headerTitle, color: Colors.textPrimary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, paddingVertical: Spacing.md },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  phoneInput: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.base,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.45 },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: FontWeight.bold, lineHeight: 26 },
  importBtn: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importBtnText: { color: Colors.accent, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  sectionLabel: {
    fontSize: FontSize.xs, fontWeight: FontWeight.bold,
    color: Colors.textTertiary, letterSpacing: 0.5,
    paddingHorizontal: Spacing.listItemPaddingH,
    paddingBottom: Spacing.sm,
  },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.listItemPaddingV,
    paddingHorizontal: Spacing.listItemPaddingH,
    backgroundColor: Colors.bgSecondary,
    gap: Spacing.listItemGap,
  },
  info: { flex: 1 },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  phone: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  arrow: { fontSize: 22, color: Colors.border },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.listItemPaddingH + 46 + Spacing.listItemGap },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyText: { fontSize: FontSize.base, color: Colors.textSecondary },
  emptySub: { marginTop: 8, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
});
