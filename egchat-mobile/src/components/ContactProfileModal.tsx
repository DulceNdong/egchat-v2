// ContactProfileModal.tsx — Perfil de contacto/grupo para React Native
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, SafeAreaView, Switch, Alert, Image,
} from 'react-native';
import { Avatar } from './Avatar';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

interface Msg { id: string; from: 'me' | 'them'; text: string; time: string }

interface Props {
  visible: boolean;
  contact: any;
  onClose: () => void;
  mutedChats?: string[];
  blockedChats?: string[];
  pinnedChats?: string[];
  chatMessages?: Record<string, Msg[]>;
  allGroups?: any[];
  userBalance?: number;
  isFavorite?: boolean;
  onMuteToggle?: (id: string) => void;
  onBlockToggle?: (id: string) => void;
  onPinToggle?: (id: string) => void;
  onClearChat?: (id: string) => void;
  onDeleteContact?: (id: string) => void;
  onSendMoney?: (contact: any) => void;
  onStartCall?: (type: 'audio' | 'video', contact: any) => void;
  onFavoriteToggle?: (id: string, isFav: boolean) => void;
  isInContacts?: boolean;
  onAddContact?: () => void;
  groupMembers?: any[];
  currentUserId?: string;
  onRemoveGroupMember?: (userId: string) => void;
  onLeaveGroup?: () => void;
  onDeleteGroup?: () => void;
}

interface Msg { id: string; from: 'me' | 'them'; text: string; time: string }

interface Props {
  visible: boolean;
  contact: any;
  onClose: () => void;
  mutedChats?: string[];
  blockedChats?: string[];
  pinnedChats?: string[];
  chatMessages?: Record<string, Msg[]>;
  allGroups?: any[];
  userBalance?: number;
  isFavorite?: boolean;
  onMuteToggle?: (id: string) => void;
  onBlockToggle?: (id: string) => void;
  onPinToggle?: (id: string) => void;
  onClearChat?: (id: string) => void;
  onDeleteContact?: (id: string) => void;
  onSendMoney?: (contact: any) => void;
  onStartCall?: (type: 'audio' | 'video', contact: any) => void;
  onFavoriteToggle?: (id: string, isFav: boolean) => void;
  isInContacts?: boolean;
  onAddContact?: () => void;
  groupMembers?: any[];
  currentUserId?: string;
  onRemoveGroupMember?: (userId: string) => void;
  onLeaveGroup?: () => void;
  onDeleteGroup?: () => void;
}

const Row = ({
  icon, label, sub, onPress, danger = false, value, isSwitch, switchValue,
}: {
  icon: string; label: string; sub?: string; onPress?: () => void;
  danger?: boolean; value?: string; isSwitch?: boolean; switchValue?: boolean;
}) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    disabled={!onPress && !isSwitch}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <Text style={styles.rowIcon}>{icon}</Text>
    <View style={styles.rowContent}>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {sub && <Text style={styles.rowSub}>{sub}</Text>}
    </View>
    {value && <Text style={styles.rowValue}>{value}</Text>}
    {isSwitch && <Switch value={switchValue} onValueChange={onPress} trackColor={{ true: '#00c8a0' }} />}
    {onPress && !isSwitch && <Text style={styles.rowChevron}>›</Text>}
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

export const ContactProfileModal: React.FC<Props> = ({
  visible, contact: cp, onClose,
  mutedChats = [], blockedChats = [], pinnedChats = [],
  chatMessages = {}, allGroups = [], userBalance = 0, isFavorite,
  onMuteToggle, onBlockToggle, onPinToggle, onClearChat,
  onDeleteContact, onSendMoney, onStartCall, onFavoriteToggle,
  isInContacts = true, onAddContact,
  groupMembers = [], currentUserId,
  onRemoveGroupMember, onLeaveGroup, onDeleteGroup,
}) => {
  const [tab, setTab] = useState<'info' | 'media' | 'grupos'>('info');
  const [starred, setStarred] = useState(!!isFavorite);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  if (!cp) return null;

  const isGroup = !!cp.isGroup || cp.type === 'group';
  const cpId = cp.id?.toString() || cp.title;
  const isMuted = mutedChats.includes(cpId);
  const isBlocked = blockedChats.includes(cpId);
  const isPinned = pinnedChats.includes(cpId);
  const msgs = chatMessages[cpId] || [];
  const mediaCount = msgs.filter((m: any) => m.imageUrl || m.text?.startsWith('📷')).length;

  const sharedGroups = allGroups.filter((g: any) => {
    const members = g.members_list || g.participants || [];
    return members.some((m: any) => m.user_id?.toString() === cpId || m.id?.toString() === cpId);
  });

  const handleStarToggle = () => {
    const newVal = !starred;
    setStarred(newVal);
    onFavoriteToggle?.(cpId, newVal);
  };

  const TABS = isGroup
    ? [['info', 'Información'], ['media', 'Multimedia'], ['grupos', 'Integrantes']]
    : [['info', 'Información'], ['media', 'Multimedia'], ['grupos', 'Grupos']];

  // Modal para ampliar foto
  const PhotoModal = () => (
    <Modal visible={showPhotoModal} transparent animationType="fade" onRequestClose={() => setShowPhotoModal(false)}>
      <View style={styles.photoModalOverlay}>
        <TouchableOpacity 
          style={styles.photoModalClose} 
          onPress={() => setShowPhotoModal(false)}
          activeOpacity={0.7}
        >
          <Text style={styles.photoModalCloseText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.photoModalContent}>
          {cp.avatarUrl || cp.avatar_url || cp.photo ? (
            <Image 
              source={{ uri: cp.avatarUrl || cp.avatar_url || cp.photo }}
              style={styles.photoModalImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.photoModalPlaceholder}>
              <Text style={styles.photoModalPlaceholderText}>
                {(cp.title || cp.name || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.photoModalName}>{cp.title || cp.name}</Text>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isGroup ? 'Info del grupo' : 'Info del contacto'}
            </Text>
            <TouchableOpacity onPress={handleStarToggle} style={styles.headerBtn}>
              <Text style={styles.starIcon}>{starred ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }}>
            {/* Avatar + nombre */}
            <View style={styles.profileSection}>
              <TouchableOpacity 
                onPress={() => setShowPhotoModal(true)}
                activeOpacity={0.8}
                style={styles.avatarContainer}
              >
                <Avatar
                  name={cp.title || cp.name || '?'}
                  size={110}
                  photo={cp.avatarUrl || cp.avatar_url || cp.photo}
                  status={cp.status}
                  showStatus={!isGroup}
                />
              </TouchableOpacity>
              
              <Text style={styles.profileName}>{cp.title || cp.name}</Text>
              <Text style={styles.profileId}>ID: {cpId.slice(-8).toUpperCase()}</Text>
              <Text style={[
                styles.profileStatus,
                cp.status === 'online' && { color: '#22c55e' },
                cp.status === 'away' && { color: '#f59e0b' },
              ]}>
                {cp.status === 'online' ? 'En línea' : cp.status === 'away' ? 'Ausente' : 'Desconectado'}
              </Text>

              {/* Acciones rápidas mejoradas */}
              <View style={styles.quickActions}>
                {[
                  { 
                    icon: (
                      <View style={styles.actionIcon}>
                        <Text style={styles.actionIconText}>📞</Text>
                      </View>
                    ), 
                    label: 'Llamar', 
                    action: () => onStartCall?.('audio', cp) 
                  },
                  { 
                    icon: (
                      <View style={styles.actionIcon}>
                        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <Rect x="2" y="7" width="13" height="11" rx="2.5"/>
                          <Circle cx="8.5" cy="12.5" r="2.5"/>
                          <Path d="M15 10.5l5.5-2.5v9L15 14.5"/>
                          <Circle cx="8.5" cy="12.5" r="1" fill="#6B7280" stroke="none"/>
                        </Svg>
                      </View>
                    ), 
                    label: 'Video', 
                    action: () => onStartCall?.('video', cp) 
                  },
                  { 
                    icon: (
                      <View style={styles.actionIcon}>
                        <Text style={styles.actionIconText}>💬</Text>
                      </View>
                    ), 
                    label: 'Mensaje', 
                    action: onClose 
                  },
                  { 
                    icon: (
                      <View style={styles.actionIcon}>
                        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          {/* Flecha circular de transferencia */}
                          <Path d="M17 1l4 4-4 4"/>
                          <Path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                          <Path d="M7 23l-4-4 4-4"/>
                          <Path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                        </Svg>
                      </View>
                    ), 
                    label: 'Enviar', 
                    action: () => { onClose(); onSendMoney?.(cp); } 
                  },
                ].map(a => (
                  <TouchableOpacity 
                    key={a.label} 
                    style={styles.quickAction} 
                    onPress={a.action}
                    activeOpacity={0.7}
                  >
                    {a.icon}
                    <Text style={styles.quickActionLabel}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Botón añadir contacto */}
              {!isGroup && !isInContacts && onAddContact && (
                <TouchableOpacity style={styles.addContactBtn} onPress={onAddContact}>
                  <Text style={styles.addContactBtnText}>+ Añadir a mis contactos</Text>
                </TouchableOpacity>
              )}
            </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {TABS.map(([id, label]) => (
              <TouchableOpacity
                key={id}
                style={[styles.tab, tab === id && styles.tabActive]}
                onPress={() => setTab(id as any)}
              >
                <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TAB INFO */}
          {tab === 'info' && (
            <View>
              <View style={styles.section}>
                {isGroup ? (
                  <>
                    <Row icon="👥" label={`${cp.members || groupMembers.length || 0} miembros`} sub="Integrantes del grupo" />
                    <Divider />
                    <Row icon="📝" label={cp.description || cp.subtitle || 'Sin descripción'} sub="Descripción" />
                  </>
                ) : (
                  <>
                    <Row icon="📧" label={cp.email || 'No disponible'} sub="Email" />
                    <Divider />
                    <Row icon="📍" label="Malabo, Guinea Ecuatorial" sub="Ubicación" />
                  </>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Configuración del chat</Text>
                <Row
                  icon={isMuted ? '🔕' : '🔔'}
                  label="Silenciar notificaciones"
                  sub={isMuted ? 'Silenciado' : 'Activo'}
                  isSwitch
                  switchValue={isMuted}
                  onPress={() => onMuteToggle?.(cpId)}
                />
                <Divider />
                <Row
                  icon="📌"
                  label="Fijar chat"
                  sub={isPinned ? 'Fijado' : 'No fijado'}
                  isSwitch
                  switchValue={isPinned}
                  onPress={() => onPinToggle?.(cpId)}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Acciones</Text>
                <Row
                  icon="🗑️"
                  label="Vaciar chat"
                  onPress={() => {
                    Alert.alert('Vaciar chat', '¿Eliminar todos los mensajes?', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Vaciar', style: 'destructive', onPress: () => onClearChat?.(cpId) },
                    ]);
                  }}
                />
                <Divider />
                <Row
                  icon="🚫"
                  label={isBlocked ? 'Desbloquear' : 'Bloquear'}
                  danger={!isBlocked}
                  onPress={() => onBlockToggle?.(cpId)}
                />
                {!isGroup && (
                  <>
                    <Divider />
                    <Row
                      icon="❌"
                      label="Eliminar contacto"
                      danger
                      onPress={() => {
                        Alert.alert('Eliminar contacto', '¿Estás seguro?', [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Eliminar', style: 'destructive', onPress: () => { onDeleteContact?.(cpId); onClose(); } },
                        ]);
                      }}
                    />
                  </>
                )}
                {isGroup && (
                  <>
                    <Divider />
                    <Row
                      icon="🚪"
                      label="Salir del grupo"
                      danger
                      onPress={() => {
                        Alert.alert('Salir del grupo', '¿Salir de este grupo?', [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Salir', style: 'destructive', onPress: () => { onLeaveGroup?.(); onClose(); } },
                        ]);
                      }}
                    />
                  </>
                )}
              </View>
            </View>
          )}

          {/* TAB MEDIA */}
          {tab === 'media' && (
            <View style={styles.section}>
              <Text style={styles.emptyText}>
                {mediaCount > 0 ? `${mediaCount} archivos multimedia` : 'Sin archivos multimedia'}
              </Text>
            </View>
          )}

          {/* TAB GRUPOS / INTEGRANTES */}
          {tab === 'grupos' && (
            <View style={styles.section}>
              {isGroup ? (
                groupMembers.length > 0 ? (
                  groupMembers.map((m: any) => (
                    <View key={m.user_id || m.id} style={styles.memberItem}>
                      <Avatar name={m.full_name || 'Usuario'} size={40} photo={m.avatar_url} />
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{m.full_name || 'Usuario'}</Text>
                        <Text style={styles.memberRole}>{m.role === 'admin' ? '👑 Admin' : 'Miembro'}</Text>
                      </View>
                      {m.user_id?.toString() !== currentUserId && onRemoveGroupMember && (
                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert('Eliminar miembro', `¿Eliminar a ${m.full_name}?`, [
                              { text: 'Cancelar', style: 'cancel' },
                              { text: 'Eliminar', style: 'destructive', onPress: () => onRemoveGroupMember(m.user_id) },
                            ]);
                          }}
                        >
                          <Text style={styles.removeMember}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Sin integrantes</Text>
                )
              ) : (
                sharedGroups.length > 0 ? (
                  sharedGroups.map((g: any) => (
                    <View key={g.id} style={styles.memberItem}>
                      <Text style={styles.groupIcon}>👥</Text>
                      <Text style={styles.memberName}>{g.title || g.name}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Sin grupos en común</Text>
                )
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
    
    <PhotoModal />
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', 
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  headerBtn: { padding: 8, borderRadius: 8 },
  headerBtnText: { fontSize: 20, color: '#374151', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  starIcon: { fontSize: 22, color: '#F59E0B' },
  
  profileSection: {
    backgroundColor: '#fff', padding: 32, alignItems: 'center', gap: 8, 
    marginBottom: 12, borderRadius: 16, marginHorizontal: 8, marginTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  avatarContainer: {
    borderRadius: 60, padding: 4, backgroundColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  profileName: { 
    fontSize: 26, fontWeight: '800', color: '#111827', 
    marginTop: 16, textAlign: 'center', letterSpacing: 0.5 
  },
  profileId: { 
    fontSize: 13, color: '#64748B', fontWeight: '500',
    backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12, marginTop: 4
  },
  profileStatus: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  
  quickActions: { 
    flexDirection: 'row', gap: 20, marginTop: 24,
    paddingHorizontal: 8 
  },
  quickAction: { 
    alignItems: 'center', gap: 8, flex: 1,
    paddingVertical: 12, borderRadius: 12,
  },
  actionIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  actionIconText: { fontSize: 16, color: '#6B7280' },
  quickActionLabel: { 
    fontSize: 12, color: '#475569', fontWeight: '600',
    textAlign: 'center'
  },
  
  addContactBtn: {
    marginTop: 16, backgroundColor: '#10B981', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 4,
  },
  addContactBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  
  tabs: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 8, borderRadius: 12, padding: 4,
    marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  tab: { 
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderRadius: 8, marginHorizontal: 2
  },
  tabActive: { 
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  
  section: { 
    backgroundColor: '#fff', marginBottom: 12, borderRadius: 12,
    marginHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  sectionLabel: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    fontSize: 12, fontWeight: '700', color: '#64748B', 
    textTransform: 'uppercase', letterSpacing: 1,
  },
  
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  rowIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, color: '#111827', fontWeight: '500' },
  rowLabelDanger: { color: '#EF4444' },
  rowSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  rowValue: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  rowChevron: { fontSize: 18, color: '#CBD5E1' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 60 },
  
  memberItem: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  memberRole: { fontSize: 12, color: '#64748B', marginTop: 2, fontWeight: '500' },
  removeMember: { fontSize: 16, color: '#EF4444', padding: 6 },
  groupIcon: { fontSize: 24 },
  emptyText: { 
    padding: 32, textAlign: 'center', color: '#64748B', 
    fontSize: 15, fontWeight: '500' 
  },
  
  // Modal de foto
  photoModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', 
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  photoModalClose: {
    position: 'absolute', top: 60, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  photoModalCloseText: { 
    fontSize: 18, color: '#fff', fontWeight: '700' 
  },
  photoModalContent: { alignItems: 'center', gap: 16 },
  photoModalImage: { 
    width: 320, height: 320, borderRadius: 20,
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.1)',
  },
  photoModalPlaceholder: {
    width: 320, height: 320, borderRadius: 20,
    backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.1)',
  },
  photoModalPlaceholderText: {
    fontSize: 80, color: '#fff', fontWeight: '700',
  },
  photoModalName: {
    fontSize: 22, color: '#fff', fontWeight: '700',
    textAlign: 'center', marginTop: 8,
  },
});

export default ContactProfileModal;
