import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { contactsAPI, chatAPI } from '../src/api';
import { EGAvatar } from '../src/components/ui';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';
import Svg, { Path, Circle } from 'react-native-svg';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [addPhone, setAddPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const load = useCallback(async () => {
    try {
      const data = await contactsAPI.getAll();
      setContacts(data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const addContact = useCallback(async () => {
    const phone = addPhone.trim();
    if (!phone) return;
    setAdding(true);
    try {
      await contactsAPI.add(undefined, phone);
      setAddPhone('');
      load();
      Alert.alert('✅', 'Contacto añadido');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo añadir el contacto');
    } finally { setAdding(false); }
  }, [addPhone]);

  const removeContact = useCallback((id: string, name: string) => {
    Alert.alert('Eliminar contacto', `¿Eliminar a ${name}?`, [
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

  const openChat = useCallback(async (contact: any) => {
    const userId = getRealUserId(contact);
    if (!userId) {
      Alert.alert('Contacto incompleto', 'Este contacto no tiene usuario asociado.');
      return;
    }
    try {
      const chat = await chatAPI.createPrivate(userId);
      router.replace(`/chat/${chat.id}` as any);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo abrir el chat');
    }
  }, []);

  const filtered = query
    ? contacts.filter(c =>
        getDisplayName(c).toLowerCase().includes(query.toLowerCase()) ||
        getDisplayPhone(c).includes(query)
      )
    : contacts;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: C.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.textPrimary }]}>Contactos</Text>
        <Text style={styles.count}>{contacts.length}</Text>
      </View>
      <View style={styles.addBar}>
        <TextInput style={[styles.addInput, { backgroundColor: C.bgSecondary, borderColor: C.border, color: C.textPrimary }]} value={addPhone} onChangeText={setAddPhone} placeholder="Añadir por teléfono..." placeholderTextColor={C.textTertiary} keyboardType="phone-pad" />
        <TouchableOpacity style={[styles.addBtn, !addPhone.trim() && styles.addBtnDisabled]} onPress={addContact} disabled={!addPhone.trim() || adding}>
          {adding ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.addBtnText}>+</Text>}
        </TouchableOpacity>
      </View>
      <View style={[styles.searchBar, { backgroundColor: C.bgSecondary, borderColor: C.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={[styles.searchInput, { color: C.textPrimary }]} value={query} onChangeText={setQuery} placeholder="Buscar contacto..." placeholderTextColor={C.textTertiary} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.accent} /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={[styles.emptyText, { color: C.textPrimary }]}>{query ? 'Sin resultados' : 'No tienes contactos aún'}</Text>
          <Text style={[styles.emptySub, { color: C.textSecondary }]}>Añade un contacto por su número de teléfono</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => getRealUserId(item) || item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.item, { backgroundColor: C.bgSecondary }]} onPress={() => openChat(item)} onLongPress={() => removeContact(item.id, getDisplayName(item) || 'Contacto')} activeOpacity={0.7}>
              <EGAvatar src={getDisplayAvatar(item)} name={getDisplayName(item)} size={46} />
              <View style={styles.info}>
                <Text style={[styles.name, { color: C.textPrimary }]}>{getDisplayName(item)}</Text>
                <Text style={[styles.phone, { color: C.textTertiary }]}>{getDisplayPhone(item)}</Text>
              </View>
              <TouchableOpacity onPress={() => openChat(item)} style={styles.chatBtn}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={Colors.accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </Svg>
              </TouchableOpacity>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  title: { ...Typography.headerTitle, color: Colors.textPrimary, flex: 1 },
  count: {
    fontSize: FontSize.sm, color: Colors.white,
    backgroundColor: Colors.accent,
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2,
    fontWeight: FontWeight.bold,
  },
  addBar: {
    flexDirection: 'row', alignItems: 'center',
    margin: Spacing.md, gap: Spacing.sm,
  },
  addInput: {
    flex: 1, backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.base, color: Colors.textPrimary,
  },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: Colors.border },
  addBtnText: { fontSize: 24, color: Colors.white, lineHeight: 28 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, gap: Spacing.sm,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, paddingVertical: Spacing.sm + 2 },
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
  chatBtn: { padding: Spacing.sm },
  chatBtnIcon: { fontSize: 20 },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.listItemPaddingH + 46 + Spacing.listItemGap },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptySub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
});
