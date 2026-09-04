// ContactProfileModal.tsx — Perfil de contacto/grupo para React Native
// Diseño actualizado: tabs Información/Multimedia/Grupos, iconos SVG, secciones completas
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, SafeAreaView, Switch, Alert, Image, TextInput,
} from 'react-native';
import { Avatar } from './Avatar';
import Svg, { Path, Rect, Circle, Line, Polyline, G } from 'react-native-svg';

// ─── Tipos ────────────────────────────────────────────────────────────────────
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

// ─── Iconos SVG reutilizables ─────────────────────────────────────────────────
const IcoPhone = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
  </Svg>
);
const IcoMail = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <Polyline points="22,6 12,13 2,6"/>
  </Svg>
);
const IcoMapPin = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
    <Circle cx="12" cy="10" r="3"/>
  </Svg>
);
const IcoCalendar = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="4" width="18" height="18" rx="2"/>
    <Line x1="16" y1="2" x2="16" y2="6"/>
    <Line x1="8" y1="2" x2="8" y2="6"/>
    <Line x1="3" y1="10" x2="21" y2="10"/>
  </Svg>
);
const IcoAt = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="4"/>
    <Path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94"/>
  </Svg>
);
const IcoBell = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <Path d="M13.73 21a2 2 0 01-3.46 0"/>
  </Svg>
);
const IcoPin = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10"/>
    <Line x1="12" y1="8" x2="12" y2="12"/>
    <Line x1="12" y1="16" x2="12.01" y2="16"/>
  </Svg>
);
const IcoImage = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="18" height="18" rx="2"/>
    <Circle cx="8.5" cy="8.5" r="1.5"/>
    <Polyline points="21 15 16 10 5 21"/>
  </Svg>
);
const IcoShield = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </Svg>
);
const IcoTrash = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6"/>
    <Path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <Path d="M10 11v6M14 11v6"/>
    <Path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </Svg>
);
const IcoShare = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="18" cy="5" r="3"/>
    <Circle cx="6" cy="12" r="3"/>
    <Circle cx="18" cy="19" r="3"/>
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </Svg>
);
const IcoBlock = ({ color = '#EF4444', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10"/>
    <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </Svg>
);
const IcoFlag = ({ color = '#EF4444', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <Line x1="4" y1="22" x2="4" y2="15"/>
  </Svg>
);
const IcoUserX = ({ color = '#EF4444', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <Circle cx="8.5" cy="7" r="4"/>
    <Line x1="18" y1="8" x2="23" y2="13"/>
    <Line x1="23" y1="8" x2="18" y2="13"/>
  </Svg>
);
const IcoEdit = ({ color = '#6B7280', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </Svg>
);
const IcoVideoCall = ({ color = '#6B7280', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="23 7 16 12 23 17 23 7"/>
    <Rect x="1" y="5" width="15" height="14" rx="2"/>
  </Svg>
);
const IcoMessage = ({ color = '#6B7280', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </Svg>
);
const IcoSend = ({ color = '#6B7280', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="22" y1="2" x2="11" y2="13"/>
    <Polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </Svg>
);
const IcoStar = ({ filled = false, size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </Svg>
);
const IcoBack = ({ size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="19" y1="12" x2="5" y2="12"/>
    <Polyline points="12 19 5 12 12 5"/>
  </Svg>
);
const IcoUsers = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <Circle cx="9" cy="7" r="4"/>
    <Path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <Path d="M16 3.13a4 4 0 010 7.75"/>
  </Svg>
);
const IcoAlignLeft = ({ color = '#6B7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
    <Line x1="17" y1="10" x2="3" y2="10"/>
    <Line x1="21" y1="6" x2="3" y2="6"/>
    <Line x1="21" y1="14" x2="3" y2="14"/>
    <Line x1="17" y1="18" x2="3" y2="18"/>
  </Svg>
);
const IcoClose = ({ color = '#fff', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
    <Line x1="18" y1="6" x2="6" y2="18"/>
    <Line x1="6" y1="6" x2="18" y2="18"/>
  </Svg>
);

// ─── Componente Row con icono SVG ─────────────────────────────────────────────
const Row = ({
  iconNode, label, sub, onPress, danger = false,
  isSwitch = false, switchValue = false, onSwitchChange,
  chevron = false,
}: {
  iconNode: React.ReactNode;
  label: string;
  sub?: string;
  onPress?: () => void;
  danger?: boolean;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (v: boolean) => void;
  chevron?: boolean;
}) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    disabled={!onPress && !isSwitch}
    activeOpacity={onPress ? 0.65 : 1}
  >
    <View style={styles.rowIconWrap}>{iconNode}</View>
    <View style={styles.rowContent}>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
    </View>
    {isSwitch && (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: '#D1D5DB', true: '#07a472' }}
        thumbColor="#fff"
      />
    )}
    {chevron && <Text style={styles.rowChevron}>›</Text>}
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

const SectionHeader = ({ label }: { label: string }) => (
  <Text style={styles.sectionHeader}>{label}</Text>
);

// ─── Componente principal ─────────────────────────────────────────────────────
export const ContactProfileModal: React.FC<Props> = ({
  visible, contact: cp, onClose,
  mutedChats = [], blockedChats = [], pinnedChats = [],
  chatMessages = {}, allGroups = [], isFavorite,
  onMuteToggle, onBlockToggle, onPinToggle, onClearChat,
  onDeleteContact, onSendMoney, onStartCall, onFavoriteToggle,
  isInContacts = true, onAddContact,
  groupMembers = [], currentUserId,
  onRemoveGroupMember, onLeaveGroup, onDeleteGroup,
}) => {
  const [tab, setTab] = useState<'info' | 'media' | 'grupos'>('info');
  const [starred, setStarred] = useState(!!isFavorite);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [note, setNote] = useState('');
  const [editingNote, setEditingNote] = useState(false);

  if (!cp) return null;

  const isGroup = !!cp.isGroup || cp.type === 'group';
  const cpId = cp.id?.toString() || cp.title;
  const isMuted = mutedChats.includes(cpId);
  const isBlocked = blockedChats.includes(cpId);
  const isPinned = pinnedChats.includes(cpId);
  const msgs = chatMessages[cpId] || [];
  const mediaItems = msgs.filter((m: any) => m.imageUrl || m.fileUrl);

  const sharedGroups = allGroups.filter((g: any) => {
    const members = g.members_list || g.participants || [];
    return members.some((m: any) => m.user_id?.toString() === cpId || m.id?.toString() === cpId);
  });

  const handleStarToggle = () => {
    const nv = !starred;
    setStarred(nv);
    onFavoriteToggle?.(cpId, nv);
  };

  // Fecha de contacto formateada
  const contactSince = cp.created_at
    ? new Date(cp.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '15/03/2026';

  const phone = cp.phone || cp.phone_number || `+240 222 *** ***`;
  const email = cp.email || 'No disponible';
  const location = cp.location || cp.address || 'Malabo, Guinea Ecuatorial';
  const username = cp.username ? `@${cp.username}` : `@${(cp.title || cp.name || 'usuario').toLowerCase().replace(/\s/g, '')}`;

  const TABS: [string, string][] = isGroup
    ? [['info', 'Información'], ['media', 'Multimedia'], ['grupos', 'Integrantes']]
    : [['info', 'Información'], ['media', 'Multimedia'], ['grupos', 'Grupos']];

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={styles.container}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <IcoBack />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Información del contacto</Text>
            <TouchableOpacity onPress={handleStarToggle} style={styles.headerBtn}>
              <IcoStar filled={starred} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

            {/* ── Avatar + nombre ── */}
            <View style={styles.profileSection}>
              <TouchableOpacity onPress={() => setShowPhotoModal(true)} activeOpacity={0.85}>
                <Avatar
                  name={cp.title || cp.name || '?'}
                  size={100}
                  photo={cp.avatarUrl || cp.avatar_url || cp.photo}
                  status={cp.status}
                  showStatus={!isGroup}
                />
              </TouchableOpacity>
              <Text style={styles.profileName}>{cp.title || cp.name}</Text>
              <Text style={[
                styles.profileStatus,
                cp.status === 'online' && { color: '#22c55e' },
                cp.status === 'away' && { color: '#f59e0b' },
              ]}>
                {cp.status === 'online' ? 'En línea' : cp.status === 'away' ? 'Ausente' : 'Desconectado'}
              </Text>

              {/* Acciones rápidas */}
              <View style={styles.quickActions}>
                {[
                  { icon: <IcoPhone color="#07a472" size={22} />, label: 'Llamar',   action: () => onStartCall?.('audio', cp) },
                  { icon: <IcoVideoCall color="#07a472" size={22} />, label: 'Video', action: () => onStartCall?.('video', cp) },
                  { icon: <IcoMessage color="#07a472" size={22} />,  label: 'Mensaje', action: onClose },
                  { icon: <IcoSend color="#07a472" size={22} />,     label: 'Enviar',  action: () => { onClose(); onSendMoney?.(cp); } },
                ].map(a => (
                  <TouchableOpacity key={a.label} style={styles.quickAction} onPress={a.action} activeOpacity={0.7}>
                    <View style={styles.quickActionCircle}>{a.icon}</View>
                    <Text style={styles.quickActionLabel}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!isGroup && !isInContacts && onAddContact && (
                <TouchableOpacity style={styles.addContactBtn} onPress={onAddContact}>
                  <Text style={styles.addContactBtnText}>+ Añadir a mis contactos</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Tabs ── */}
            <View style={styles.tabs}>
              {TABS.map(([id, label]) => (
                <TouchableOpacity
                  key={id}
                  style={[styles.tab, tab === id && styles.tabActive]}
                  onPress={() => setTab(id as any)}
                >
                  <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
                  {tab === id && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* ══════════ TAB INFO ══════════ */}
            {tab === 'info' && (
              <View>
                {/* Sección datos de contacto */}
                <View style={styles.section}>
                  {isGroup ? (
                    <>
                      <Row iconNode={<IcoUsers />} label={`${cp.members || groupMembers.length || 0} miembros`} sub="Integrantes del grupo" />
                      <Divider />
                      <Row iconNode={<IcoAlignLeft />} label={cp.description || cp.subtitle || 'Sin descripción'} sub="Descripción" />
                    </>
                  ) : (
                    <>
                      <Row iconNode={<IcoPhone />} label={phone} sub="Teléfono móvil" />
                      <Divider />
                      <Row iconNode={<IcoMail />} label={email} sub="Email" />
                      <Divider />
                      <Row iconNode={<IcoMapPin />} label={location} sub="Ubicación" />
                      <Divider />
                      <Row iconNode={<IcoCalendar />} label={contactSince} sub="Contacto desde" />
                      <Divider />
                      <Row iconNode={<IcoAt />} label={username} sub="ID EGCHAT" />
                    </>
                  )}
                </View>

                {/* Nota personal */}
                <SectionHeader label="NOTA PERSONAL" />
                <View style={styles.section}>
                  <View style={styles.noteRow}>
                    <View style={styles.rowIconWrap}><IcoEdit color="#9CA3AF" size={18} /></View>
                    {editingNote ? (
                      <TextInput
                        style={styles.noteInput}
                        value={note}
                        onChangeText={setNote}
                        placeholder="Escribe una nota sobre este contacto..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        autoFocus
                        onBlur={() => setEditingNote(false)}
                      />
                    ) : (
                      <TouchableOpacity style={{ flex: 1 }} onPress={() => setEditingNote(true)}>
                        <Text style={note ? styles.noteText : styles.notePlaceholder}>
                          {note || 'Toca para añadir una nota...'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => setEditingNote(true)} style={styles.editNoteBtn}>
                    <Text style={styles.editNoteBtnText}>Editar nota</Text>
                  </TouchableOpacity>
                </View>

                {/* Configuración del chat */}
                <SectionHeader label="CONFIGURACIÓN DEL CHAT" />
                <View style={styles.section}>
                  <Row
                    iconNode={<IcoBell />}
                    label="Silenciar notificaciones"
                    sub={isMuted ? 'Silenciado' : 'Activo'}
                    isSwitch
                    switchValue={isMuted}
                    onSwitchChange={() => onMuteToggle?.(cpId)}
                  />
                  <Divider />
                  <Row
                    iconNode={<IcoPin />}
                    label="Fijar chat"
                    sub={isPinned ? 'Fijado' : 'No fijado'}
                    isSwitch
                    switchValue={isPinned}
                    onSwitchChange={() => onPinToggle?.(cpId)}
                  />
                  <Divider />
                  <Row
                    iconNode={<IcoImage />}
                    label="Fondo de pantalla"
                    sub="Personalizar fondo del chat"
                    chevron
                    onPress={() => {/* TODO: wallpaper picker */}}
                  />
                  <Divider />
                  <Row
                    iconNode={<IcoShield color="#07a472" />}
                    label="Cifrado extremo a extremo"
                    sub="Los mensajes están cifrados"
                  />
                </View>

                {/* Acciones */}
                <SectionHeader label="ACCIONES" />
                <View style={styles.section}>
                  <Row
                    iconNode={<IcoTrash />}
                    label="Vaciar chat"
                    sub="Eliminar todos los mensajes"
                    chevron
                    onPress={() =>
                      Alert.alert('Vaciar chat', '¿Eliminar todos los mensajes?', [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Vaciar', style: 'destructive', onPress: () => onClearChat?.(cpId) },
                      ])
                    }
                  />
                  <Divider />
                  <Row
                    iconNode={<IcoShare />}
                    label="Compartir contacto"
                    sub="Enviar a otro chat"
                    chevron
                    onPress={() => {/* TODO: share contact */}}
                  />
                </View>

                {/* Acciones peligrosas */}
                <View style={[styles.section, { marginBottom: 32 }]}>
                  <Row
                    iconNode={<IcoBlock />}
                    label={isBlocked ? 'Desbloquear contacto' : 'Bloquear contacto'}
                    sub="No recibirás más mensajes"
                    danger
                    onPress={() => onBlockToggle?.(cpId)}
                  />
                  <Divider />
                  <Row
                    iconNode={<IcoFlag />}
                    label="Reportar contacto"
                    sub="Reportar comportamiento inapropiado"
                    danger
                    onPress={() =>
                      Alert.alert('Reportar contacto', '¿Deseas reportar este contacto?', [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Reportar', style: 'destructive' },
                      ])
                    }
                  />
                  {!isGroup && (
                    <>
                      <Divider />
                      <Row
                        iconNode={<IcoUserX />}
                        label="Eliminar contacto"
                        sub="Eliminar de tu lista de contactos"
                        danger
                        onPress={() =>
                          Alert.alert('Eliminar contacto', '¿Estás seguro?', [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Eliminar', style: 'destructive', onPress: () => { onDeleteContact?.(cpId); onClose(); } },
                          ])
                        }
                      />
                    </>
                  )}
                  {isGroup && (
                    <>
                      <Divider />
                      <Row
                        iconNode={<IcoUserX />}
                        label="Salir del grupo"
                        sub="Dejarás de recibir mensajes"
                        danger
                        onPress={() =>
                          Alert.alert('Salir del grupo', '¿Salir de este grupo?', [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Salir', style: 'destructive', onPress: () => { onLeaveGroup?.(); onClose(); } },
                          ])
                        }
                      />
                    </>
                  )}
                </View>
              </View>
            )}

            {/* ══════════ TAB MULTIMEDIA ══════════ */}
            {tab === 'media' && (
              <View style={[styles.section, { marginBottom: 32 }]}>
                {mediaItems.length > 0 ? (
                  <View style={styles.mediaGrid}>
                    {mediaItems.map((m: any, i: number) => (
                      <Image key={i} source={{ uri: m.imageUrl || m.fileUrl }} style={styles.mediaThumb} resizeMode="cover" />
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <IcoImage color="#D1D5DB" size={48} />
                    <Text style={styles.emptyText}>Sin archivos multimedia</Text>
                  </View>
                )}
              </View>
            )}

            {/* ══════════ TAB GRUPOS / INTEGRANTES ══════════ */}
            {tab === 'grupos' && (
              <View style={[styles.section, { marginBottom: 32 }]}>
                {isGroup ? (
                  groupMembers.length > 0 ? groupMembers.map((m: any) => (
                    <View key={m.user_id || m.id} style={styles.memberItem}>
                      <Avatar name={m.full_name || 'Usuario'} size={42} photo={m.avatar_url} />
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{m.full_name || 'Usuario'}</Text>
                        <Text style={styles.memberRole}>
                          {m.role === 'admin' ? 'Admin' : 'Miembro'}
                        </Text>
                      </View>
                      {m.user_id?.toString() !== currentUserId && onRemoveGroupMember && (
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert('Eliminar miembro', `¿Eliminar a ${m.full_name}?`, [
                              { text: 'Cancelar', style: 'cancel' },
                              { text: 'Eliminar', style: 'destructive', onPress: () => onRemoveGroupMember(m.user_id) },
                            ])
                          }
                          style={styles.removeMemberBtn}
                        >
                          <IcoClose color="#EF4444" size={16} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )) : (
                    <View style={styles.emptyState}>
                      <IcoUsers color="#D1D5DB" size={48} />
                      <Text style={styles.emptyText}>Sin integrantes</Text>
                    </View>
                  )
                ) : (
                  sharedGroups.length > 0 ? sharedGroups.map((g: any) => (
                    <View key={g.id} style={styles.memberItem}>
                      <View style={styles.groupAvatarPlaceholder}>
                        <IcoUsers color="#07a472" size={20} />
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{g.title || g.name}</Text>
                        <Text style={styles.memberRole}>{g.members || 0} miembros</Text>
                      </View>
                    </View>
                  )) : (
                    <View style={styles.emptyState}>
                      <IcoUsers color="#D1D5DB" size={48} />
                      <Text style={styles.emptyText}>Sin grupos en común</Text>
                    </View>
                  )
                )}
              </View>
            )}

          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Modal foto ampliada ── */}
      <Modal visible={showPhotoModal} transparent animationType="fade" onRequestClose={() => setShowPhotoModal(false)}>
        <View style={styles.photoOverlay}>
          <TouchableOpacity style={styles.photoCloseBtn} onPress={() => setShowPhotoModal(false)}>
            <IcoClose color="#fff" size={20} />
          </TouchableOpacity>
          {cp.avatarUrl || cp.avatar_url || cp.photo ? (
            <Image source={{ uri: cp.avatarUrl || cp.avatar_url || cp.photo }} style={styles.photoFull} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderLetter}>
                {(cp.title || cp.name || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.photoName}>{cp.title || cp.name}</Text>
        </View>
      </Modal>
    </>
  );
};

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },

  // Perfil
  profileSection: {
    backgroundColor: '#fff', paddingVertical: 28, paddingHorizontal: 16,
    alignItems: 'center', gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
  },
  profileName: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 10, textAlign: 'center' },
  profileStatus: { fontSize: 13, fontWeight: '500', color: '#6B7280' },

  // Quick actions
  quickActions: { flexDirection: 'row', gap: 8, marginTop: 20, paddingHorizontal: 4 },
  quickAction: { alignItems: 'center', gap: 6, flex: 1 },
  quickActionCircle: {
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  quickActionLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },

  addContactBtn: {
    marginTop: 12, backgroundColor: '#07a472', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  addContactBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Tabs
  tabs: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
    marginBottom: 12,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#07a472', fontWeight: '700' },
  tabIndicator: { position: 'absolute', bottom: 0, width: 36, height: 2.5, borderRadius: 2, backgroundColor: '#07a472' },

  // Sección
  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: '#6B7280',
    letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6,
  },
  section: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
    marginBottom: 12,
  },

  // Row
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 14,
  },
  rowIconWrap: { width: 24, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, color: '#111827', fontWeight: '400' },
  rowLabelDanger: { color: '#EF4444', fontWeight: '500' },
  rowSub: { fontSize: 13, color: '#9CA3AF', marginTop: 1 },
  rowChevron: { fontSize: 20, color: '#D1D5DB' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#F3F4F6', marginLeft: 54 },

  // Nota
  noteRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, gap: 14,
  },
  noteInput: {
    flex: 1, fontSize: 15, color: '#111827', minHeight: 44,
    paddingTop: 0, paddingBottom: 8,
  },
  noteText: { fontSize: 15, color: '#111827', lineHeight: 22 },
  notePlaceholder: { fontSize: 15, color: '#9CA3AF', lineHeight: 22 },
  editNoteBtn: { paddingHorizontal: 54, paddingBottom: 14 },
  editNoteBtnText: { fontSize: 14, color: '#07a472', fontWeight: '600' },

  // Media
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 2 },
  mediaThumb: { width: '33.33%', aspectRatio: 1, padding: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 15, color: '#9CA3AF', fontWeight: '500' },

  // Miembros
  memberItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6',
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  memberRole: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  removeMemberBtn: { padding: 8 },
  groupAvatarPlaceholder: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
  },

  // Modal foto
  photoOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  photoCloseBtn: {
    position: 'absolute', top: 56, right: 20, zIndex: 10,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoFull: { width: 300, height: 300, borderRadius: 16 },
  photoPlaceholder: {
    width: 300, height: 300, borderRadius: 16,
    backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center',
  },
  photoPlaceholderLetter: { fontSize: 80, color: '#fff', fontWeight: '800' },
  photoName: { fontSize: 20, color: '#fff', fontWeight: '700', marginTop: 20 },
});

export default ContactProfileModal;
