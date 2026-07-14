// ══════════════════════════════════════════════════════════════════
// GroupInfoModal — Info, miembros, añadir/quitar, salir del grupo
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  FlatList, Alert, ActivityIndicator, ScrollView,
  TextInput, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Polyline, Circle } from 'react-native-svg';
import { chatAPI, contactsAPI, getToken, getApiBase } from '../../api';
import { EGAvatar } from '../ui';
import { toast } from '../Toast';
import { useThemeContext } from '../../theme/ThemeContext';
import { Colors } from '../../theme/colors';
import { DarkColors } from '../../theme/darkMode';

interface Member {
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  role?: 'admin' | 'member';
  users?: { full_name?: string; avatar_url?: string };
}

interface Props {
  visible: boolean;
  chat: any;
  currentUserId: string;
  onClose: () => void;
  onLeft: () => void; // se llamó cuando el usuario sale del grupo
}

function getMemberName(m: Member) {
  return m.full_name || m.users?.full_name || m.phone || 'Usuario';
}
function getMemberAvatar(m: Member) {
  return m.avatar_url || m.users?.avatar_url || undefined;
}

export function GroupInfoModal({ visible, chat, currentUserId, onClose, onLeft }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [addSearch, setAddSearch] = useState('');
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const isAdmin = members.find(m => m.user_id === currentUserId)?.role === 'admin';

  useEffect(() => {
    if (!visible || !chat?.id) return;
    setGroupName(chat.name || '');
    loadMembers();
  }, [visible, chat?.id]);

  const loadMembers = useCallback(async () => {
    if (!chat?.id) return;
    setLoading(true);
    try {
      const BASE = getApiBase();
      const token = await getToken();
      const data = await fetch(`${BASE}/api/chats/${chat.id}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());
      setMembers(Array.isArray(data) ? data : (chat.participants || []));
    } catch {
      setMembers(chat.participants || []);
    } finally {
      setLoading(false);
    }
  }, [chat]);

  const handleSaveName = useCallback(async () => {
    const name = groupName.trim();
    if (!name || name === chat.name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      const BASE = getApiBase();
      const token = await getToken();
      await fetch(`${BASE}/api/chats/${chat.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      toast.success('Nombre actualizado');
      setEditingName(false);
    } catch {
      toast.error('No se pudo actualizar el nombre');
    } finally {
      setSavingName(false);
    }
  }, [groupName, chat]);

  const handleRemoveMember = useCallback((member: Member) => {
    if (!isAdmin) { toast.info('Solo admins pueden eliminar miembros'); return; }
    if (member.user_id === currentUserId) return;
    Alert.alert('Eliminar miembro', `¿Quitar a ${getMemberName(member)} del grupo?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar', style: 'destructive',
        onPress: async () => {
          try {
            const BASE = getApiBase();
            const token = await getToken();
            await fetch(`${BASE}/api/chats/${chat.id}/participants/${member.user_id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            setMembers(prev => prev.filter(m => m.user_id !== member.user_id));
            toast.success('Miembro eliminado');
          } catch {
            toast.error('No se pudo eliminar el miembro');
          }
        },
      },
    ]);
  }, [isAdmin, currentUserId, chat]);

  const handlePromoteAdmin = useCallback((member: Member) => {
    if (!isAdmin) return;
    Alert.alert('Hacer admin', `¿Hacer admin a ${getMemberName(member)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Hacer admin',
        onPress: async () => {
          try {
            const BASE = getApiBase();
            const token = await getToken();
            await fetch(`${BASE}/api/chats/${chat.id}/participants/${member.user_id}/role`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: 'admin' }),
            });
            setMembers(prev => prev.map(m => m.user_id === member.user_id ? { ...m, role: 'admin' } : m));
            toast.success('Admin asignado');
          } catch {
            toast.error('No se pudo cambiar el rol');
          }
        },
      },
    ]);
  }, [isAdmin, chat]);

  const handleLeaveGroup = useCallback(() => {
    Alert.alert('Salir del grupo', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => {
          try {
            const BASE = getApiBase();
            const token = await getToken();
            await fetch(`${BASE}/api/chats/${chat.id}/leave`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
            toast.info('Saliste del grupo');
            onLeft();
          } catch {
            toast.error('No se pudo salir del grupo');
          }
        },
      },
    ]);
  }, [chat, onLeft]);

  const handleAddMembers = useCallback(async () => {
    setShowAddMember(true);
    try {
      const data = await contactsAPI.getAll();
      const memberIds = new Set(members.map(m => m.user_id));
      setContacts((Array.isArray(data) ? data : []).filter(
        (c: any) => !memberIds.has(c.contact_user_id || c.user_id)
      ));
    } catch {
      toast.error('No se pudieron cargar contactos');
    }
  }, [members]);

  const handleAddContact = useCallback(async (contact: any) => {
    const userId = contact.contact_user_id || contact.user_id || contact.id;
    try {
      const BASE = getApiBase();
      const token = await getToken();
      await fetch(`${BASE}/api/chats/${chat.id}/participants`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      toast.success('Miembro añadido');
      setShowAddMember(false);
      loadMembers();
    } catch {
      toast.error('No se pudo añadir el miembro');
    }
  }, [chat, loadMembers]);

  const filteredContacts = contacts.filter(c => {
    if (!addSearch) return true;
    const name = c.full_name || c.users?.full_name || c.phone || '';
    return name.toLowerCase().includes(addSearch.toLowerCase());
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.root, { backgroundColor: C.bgPrimary, paddingTop: insets.top }]}>

        {/* Header */}
        <LinearGradient colors={['#07a472', '#00b4e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.btn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="19" y1="12" x2="5" y2="12"/><Polyline points="12 19 5 12 12 5"/>
            </Svg>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Info del grupo</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          {/* Avatar + nombre */}
          <View style={s.groupTop}>
            <EGAvatar src={chat?.avatar_url} name={chat?.name || 'Grupo'} size={80} />
            {editingName ? (
              <View style={s.editNameRow}>
                <TextInput
                  style={[s.editNameInput, { color: C.textPrimary, borderColor: C.borderLight }]}
                  value={groupName}
                  onChangeText={setGroupName}
                  autoFocus
                  maxLength={60}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                <TouchableOpacity onPress={handleSaveName} disabled={savingName} style={s.saveBtn}>
                  {savingName
                    ? <ActivityIndicator size="small" color="#07a472" />
                    : <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#07a472" strokeWidth={2.5} strokeLinecap="round"><Path d="M20 6L9 17l-5-5"/></Svg>
                  }
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.nameRow} onPress={() => isAdmin && setEditingName(true)}>
                <Text style={[s.groupName, { color: C.textPrimary }]}>{chat?.name || 'Grupo'}</Text>
                {isAdmin && (
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2} strokeLinecap="round">
                    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </Svg>
                )}
              </TouchableOpacity>
            )}
            <Text style={[s.memberCountText, { color: C.textTertiary }]}>{members.length} participantes</Text>
          </View>

          {/* Acciones */}
          <View style={[s.actionsRow, { borderColor: C.borderLight }]}>
            <TouchableOpacity style={s.actionBtn} onPress={handleAddMembers}>
              <View style={[s.actionIcon, { backgroundColor: '#07a47220' }]}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#07a472" strokeWidth={2} strokeLinecap="round">
                  <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <Circle cx="9" cy="7" r="4"/>
                  <Line x1="19" y1="8" x2="19" y2="14"/>
                  <Line x1="22" y1="11" x2="16" y2="11"/>
                </Svg>
              </View>
              <Text style={[s.actionLabel, { color: C.textPrimary }]}>Añadir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={handleLeaveGroup}>
              <View style={[s.actionIcon, { backgroundColor: '#ef444420' }]}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round">
                  <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <Polyline points="16 17 21 12 16 7"/>
                  <Line x1="21" y1="12" x2="9" y2="12"/>
                </Svg>
              </View>
              <Text style={[s.actionLabel, { color: '#ef4444' }]}>Salir</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de miembros */}
          <Text style={[s.sectionTitle, { color: C.textTertiary }]}>PARTICIPANTES</Text>
          {loading
            ? <ActivityIndicator style={{ marginTop: 20 }} color={Colors.accent} />
            : members.map(member => (
              <TouchableOpacity
                key={member.user_id}
                style={[s.memberRow, { borderBottomColor: C.borderLight }]}
                onLongPress={() => {
                  if (!isAdmin || member.user_id === currentUserId) return;
                  Alert.alert(getMemberName(member), 'Opciones', [
                    { text: 'Hacer admin', onPress: () => handlePromoteAdmin(member) },
                    { text: 'Quitar del grupo', style: 'destructive', onPress: () => handleRemoveMember(member) },
                    { text: 'Cancelar', style: 'cancel' },
                  ]);
                }}
                activeOpacity={0.7}
              >
                <EGAvatar src={getMemberAvatar(member)} name={getMemberName(member)} size={44} />
                <View style={s.memberInfo}>
                  <Text style={[s.memberName, { color: C.textPrimary }]}>
                    {getMemberName(member)}{member.user_id === currentUserId ? ' (tú)' : ''}
                  </Text>
                  {member.role === 'admin' && (
                    <Text style={s.adminBadge}>Admin</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          }
        </ScrollView>
      </View>

      {/* Modal añadir miembro */}
      <Modal visible={showAddMember} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddMember(false)}>
        <View style={[s.root, { backgroundColor: C.bgPrimary, paddingTop: insets.top }]}>
          <LinearGradient colors={['#07a472', '#00b4e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
            <TouchableOpacity onPress={() => setShowAddMember(false)} style={s.btn}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
              </Svg>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Añadir participantes</Text>
          </LinearGradient>
          <View style={[s.searchWrap, { backgroundColor: C.bgSecondary }]}>
            <TextInput
              style={[s.searchInput, { color: C.textPrimary }]}
              placeholder="Buscar..."
              placeholderTextColor={C.textTertiary}
              value={addSearch}
              onChangeText={setAddSearch}
            />
          </View>
          <FlatList
            data={filteredContacts}
            keyExtractor={c => c.contact_user_id || c.user_id || c.id}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            renderItem={({ item }) => {
              const name = item.full_name || item.users?.full_name || item.phone || 'Usuario';
              const avatar = item.avatar_url || item.users?.avatar_url;
              return (
                <TouchableOpacity style={[s.memberRow, { borderBottomColor: C.borderLight }]} onPress={() => handleAddContact(item)}>
                  <EGAvatar src={avatar} name={name} size={44} />
                  <Text style={[s.memberName, { color: C.textPrimary, marginLeft: 12 }]}>{name}</Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<Text style={[s.empty, { color: C.textTertiary }]}>No hay contactos para añadir</Text>}
          />
        </View>
      </Modal>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingBottom: 12, paddingTop: 10, gap: 6,
  },
  btn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff', marginLeft: 4 },
  groupTop: { alignItems: 'center', paddingVertical: 28 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  groupName: { fontSize: 22, fontWeight: '700' },
  editNameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8, paddingHorizontal: 24, width: '100%' },
  editNameInput: { flex: 1, fontSize: 18, borderBottomWidth: 1.5, paddingBottom: 4 },
  saveBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  memberCountText: { fontSize: 13, marginTop: 4 },
  actionsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 16, marginBottom: 16,
  },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, paddingHorizontal: 16, marginBottom: 4 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  memberInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  memberName: { fontSize: 15, fontWeight: '600' },
  adminBadge: {
    fontSize: 11, color: '#07a472', fontWeight: '700',
    backgroundColor: '#07a47218', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  searchWrap: { margin: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { fontSize: 15 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 15 },
});
