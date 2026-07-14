// ══════════════════════════════════════════════════════════════════
// EGCHAT — HeaderPanels
// Panel de Notificaciones + Menú hamburguesa + Modal Clima
// Fiel a la versión web
// ══════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Pressable, Alert, Image, Animated, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Rect, Polyline, Polygon } from 'react-native-svg';
import { router } from 'expo-router';
import { authAPI } from '../api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme';

// ── Tipos ─────────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  type: 'message' | 'payment' | 'system' | 'security' | 'taxi' | 'bet';
  title: string;
  body: string;
  time: string;
  read: boolean;
  chatId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────
const colorForType = (type: AppNotification['type']) => {
  if (type === 'message')  return '#00b4e6';
  if (type === 'payment')  return '#00c8a0';
  if (type === 'taxi')     return '#f59e0b';
  if (type === 'security') return '#ef4444';
  if (type === 'bet')      return '#a855f7';
  return '#6b7280';
};

const IconForType = ({ type }: { type: AppNotification['type'] }) => {
  const c = colorForType(type);
  if (type === 'message') return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </Svg>
  );
  if (type === 'payment') return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round">
      <Rect x="2" y="5" width="20" height="14" rx="2"/>
      <Line x1="2" y1="10" x2="22" y2="10"/>
    </Svg>
  );
  if (type === 'taxi') return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round">
      <Rect x="1" y="3" width="15" height="13" rx="2"/>
      <Path d="M16 8h4l3 3v5h-7V8z"/>
      <Circle cx="5.5" cy="18.5" r="2.5"/>
      <Circle cx="18.5" cy="18.5" r="2.5"/>
    </Svg>
  );
  if (type === 'security') return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </Svg>
  );
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round">
      <Circle cx="12" cy="12" r="10"/>
      <Line x1="12" y1="8" x2="12" y2="12"/>
      <Line x1="12" y1="16" x2="12.01" y2="16"/>
    </Svg>
  );
};

// ══════════════════════════════════════════════════════════════════
// PANEL NOTIFICACIONES
// ══════════════════════════════════════════════════════════════════
export const NotificationsPanel = ({
  visible,
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll,
  onNotifPress,
}: {
  visible: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onNotifPress: (n: AppNotification) => void;
}) => {
  const unread = notifications.filter(n => !n.read).length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={np.overlay} onPress={onClose}>
        <Pressable style={np.panel} onPress={() => {}}>
          {/* Header */}
          <View style={np.header}>
            <View style={np.headerLeft}>
              <Text style={np.title}>Notificaciones</Text>
              {unread > 0 && (
                <View style={np.unreadBadge}>
                  <Text style={np.unreadText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              )}
            </View>
            <View style={np.headerRight}>
              {notifications.length > 0 && (
                <TouchableOpacity onPress={onMarkAllRead} activeOpacity={0.7}>
                  <Text style={np.markAll}>Marcar todas</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={np.closeBtn} activeOpacity={0.7}>
                <Text style={np.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista */}
          <ScrollView style={np.list} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={np.empty}>
                <Text style={np.emptyIcon}>🔔</Text>
                <Text style={np.emptyTitle}>Sin notificaciones</Text>
                <Text style={np.emptySub}>Los mensajes, pagos y más aparecerán aquí</Text>
              </View>
            ) : notifications.map((n, i) => (
              <TouchableOpacity
                key={n.id}
                style={[np.item, !n.read && np.itemUnread, i === notifications.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => onNotifPress(n)}
                activeOpacity={0.7}
              >
                {/* Icono tipo */}
                <View style={np.iconWrap}>
                  <IconForType type={n.type} />
                </View>
                {/* Texto */}
                <View style={np.itemText}>
                  <Text style={[np.itemTitle, !n.read && np.itemTitleUnread]} numberOfLines={1}>{n.title}</Text>
                  <Text style={np.itemBody} numberOfLines={1}>{n.body}</Text>
                </View>
                {/* Hora + dot */}
                <View style={np.itemMeta}>
                  <Text style={np.itemTime}>{n.time}</Text>
                  {!n.read && <View style={[np.dot, { backgroundColor: colorForType(n.type) }]} />}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer */}
          {notifications.length > 0 && (
            <View style={np.footer}>
              <TouchableOpacity onPress={onClearAll} activeOpacity={0.7}>
                <Text style={np.clearAll}>Limpiar todo</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const np = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 8,
  },
  panel: {
    width: 320,
    maxHeight: 480,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  unreadText: { fontSize: 11, fontWeight: FontWeight.bold, color: '#fff' },
  markAll: { fontSize: 11, fontWeight: FontWeight.semibold, color: Colors.brand },
  closeBtn: { padding: 2 },
  closeText: { fontSize: 16, color: Colors.textTertiary },
  list: { maxHeight: 360 },
  empty: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 4 },
  emptySub: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemUnread: { backgroundColor: 'rgba(0,180,230,0.04)' },
  iconWrap: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'transparent',
    flexShrink: 0,
  },
  itemText: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary, marginBottom: 2 },
  itemTitleUnread: { fontWeight: FontWeight.bold },
  itemBody: { fontSize: FontSize.xs, color: Colors.textSecondary },
  itemMeta: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  itemTime: { fontSize: 10, color: Colors.textTertiary },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  footer: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    alignItems: 'center',
  },
  clearAll: { fontSize: FontSize.sm, color: Colors.textTertiary },
});

// ══════════════════════════════════════════════════════════════════
// MENÚ HAMBURGUESA — Dropdown top-right (paridad renderMenuPanel web)
// ══════════════════════════════════════════════════════════════════
const SCREEN_W = Dimensions.get('window').width;
const MENU_PANEL_W = 220;
const ICON_COLOR = '#374151';

// ── Iconos SVG del menú ───────────────────────────────────────────
const MenuIcon = ({ name }: { name: string }) => {
  const c = name === 'salir' ? '#EF4444' : ICON_COLOR;
  const s = { width: 18, height: 18 };
  switch (name) {
    case 'perfil':
      return <Svg {...s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle cx="12" cy="7" r="4"/></Svg>;
    case 'nuevo-contacto':
      return <Svg {...s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round"><Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><Circle cx="9" cy="7" r="4"/><Line x1="19" y1="8" x2="19" y2="14"/><Line x1="22" y1="11" x2="16" y2="11"/></Svg>;
    case 'ayuda':
      return <Svg {...s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round"><Circle cx="12" cy="12" r="10"/><Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><Line x1="12" y1="17" x2="12.01" y2="17"/></Svg>;
    case 'crear-grupo':
      return <Svg {...s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><Circle cx="9" cy="7" r="4"/><Path d="M23 21v-2a4 4 0 0 0-3-3.87"/><Path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>;
    case 'moments':
      return <Svg {...s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round"><Rect x="3" y="3" width="18" height="18" rx="2"/><Circle cx="8.5" cy="8.5" r="1.5"/><Polyline points="21 15 16 10 5 21"/></Svg>;
    case 'broadcast':
      return <Svg {...s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round"><Path d="M22 12h-4l-3 9L9 3l-3 9H2"/></Svg>;
    case 'notas':
      return <Svg {...s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round"><Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>;
    case 'contactos':
      return <Svg {...s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round"><Rect x="5" y="2" width="14" height="20" rx="2"/><Line x1="9" y1="7" x2="15" y2="7"/><Line x1="9" y1="11" x2="15" y2="11"/><Line x1="9" y1="15" x2="13" y2="15"/></Svg>;
    case 'mensajes-arch':
      return <Svg {...s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round"><Polyline points="21 8 21 21 3 21 3 8"/><Rect x="1" y="3" width="22" height="5"/><Line x1="10" y1="12" x2="14" y2="12"/></Svg>;
    case 'notificaciones':
      return <Svg {...s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round"><Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><Path d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>;
    case 'privacidad':
      return <Svg {...s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round"><Rect x="3" y="11" width="18" height="11" rx="2"/><Path d="M7 11V7a5 5 0 0 1 10 0v4"/></Svg>;
    case 'ajustes':
      return <Svg {...s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round"><Circle cx="12" cy="12" r="3"/><Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Svg>;
    case 'salir':
      return <Svg {...s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round"><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><Polyline points="16 17 21 12 16 7"/><Line x1="21" y1="12" x2="9" y2="12"/></Svg>;
    default:
      return <Svg {...s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8}><Circle cx="12" cy="12" r="10"/></Svg>;
  }
};

export const HamburgerMenu = ({
  visible,
  onClose,
  user,
  headerHeight = 56,
}: {
  visible: boolean;
  onClose: () => void;
  user?: { full_name?: string; avatar_url?: string; phone?: string } | null;
  headerHeight?: number;
}) => {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const initials = user?.full_name
    ?.split(' ').filter(Boolean).map((w: string) => w[0].toUpperCase()).slice(0, 2).join('') || 'EG';

  const items: Array<{ id: string; label: string; sub: string }> = [
    { id: 'perfil',         label: 'Mi Perfil',           sub: 'Ver y editar tu perfil'    },
    { id: 'nuevo-contacto', label: 'Nuevo contacto',       sub: 'Añadir a tu lista'         },
    { id: 'crear-grupo',    label: 'Crear grupo',          sub: 'Nuevo grupo de chat'       },
    { id: 'moments',        label: '📸 Moments',           sub: 'Feed social de contactos'  },
    { id: 'broadcast',      label: '📢 Difusión',          sub: 'Mensaje a múltiples chats' },
    { id: 'notas',          label: '📝 Mis notas',         sub: 'Chat personal privado'     },
    { id: 'contactos',      label: 'Mis contactos',        sub: 'Ver todos tus contactos'   },
    { id: 'mensajes-arch',  label: 'Mensajes archivados',  sub: 'Chats archivados'          },
    { id: 'notificaciones', label: 'Notificaciones',       sub: 'Gestionar alertas'         },
    { id: 'privacidad',     label: 'Privacidad',           sub: 'Configurar privacidad'     },
    { id: 'ajustes',        label: 'Ajustes',              sub: 'Configuración de la app'   },
    { id: 'ayuda',          label: 'Ayuda y soporte',      sub: 'Centro de ayuda'           },
    { id: 'salir',          label: 'Cerrar sesión',        sub: 'Salir de tu cuenta'        },
  ];

  const handlePress = async (id: string) => {
    onClose();
    setTimeout(async () => {
      switch (id) {
        case 'perfil':         router.push('/ajustes/perfil' as any); break;
        case 'nuevo-contacto': router.push('/contacts' as any); break;
        case 'crear-grupo':    router.push('/new-chat' as any); break;
        case 'moments':        router.push('/moments' as any); break;
        case 'broadcast':      router.push('/broadcast' as any); break;
        case 'notas': {
          const { getOrCreateNotesChat } = await import('../services/personalNotes');
          const chatId = await getOrCreateNotesChat();
          if (chatId) router.push(`/chat/${chatId}` as any);
          break;
        }
        case 'contactos':      router.push('/contacts' as any); break;
        case 'mensajes-arch':  router.push('/(tabs)/mensajeria' as any); break;
        case 'notificaciones': router.push('/(tabs)/ajustes' as any); break;
        case 'privacidad':     router.push('/ajustes/security' as any); break;
        case 'ajustes':        router.push('/(tabs)/ajustes' as any); break;
        case 'ayuda':          router.push('/(tabs)/ajustes' as any); break;
        case 'salir':
          Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres salir?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Cerrar sesión', style: 'destructive', onPress: async () => {
              try { await authAPI.logout(); } catch {}
              if (typeof window !== 'undefined' && window.location) {
                window.location.href = '/';
              } else {
                router.replace('/(auth)/login' as any);
              }
            }},
          ]);
          break;
      }
    }, 120);
  };

  if (!visible) return null;

  const panelTop = insets.top + headerHeight;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={hm.root}>
        <Pressable style={hm.overlay} onPress={onClose} />
        <Animated.View
          style={[
            hm.panel,
            {
              top: panelTop,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
              maxWidth: SCREEN_W * 0.72,
            },
          ]}
        >
          <View style={hm.userHeader}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={hm.avatar} />
            ) : (
              <View style={hm.avatarFallback}>
                <Text style={hm.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={hm.userInfo}>
              <Text style={hm.userName} numberOfLines={1}>{user?.full_name || 'Usuario'}</Text>
              <Text style={hm.userStatus}>● En línea</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={hm.scroll}>
            {items.map((item, i) => (
              <TouchableOpacity
                key={item.id}
                style={[hm.item, i < items.length - 1 && hm.itemBorder]}
                onPress={() => handlePress(item.id)}
                activeOpacity={0.65}
              >
                <View style={hm.iconWrap}>
                  <MenuIcon name={item.id} />
                </View>
                <View style={hm.itemText}>
                  <Text style={[hm.itemLabel, item.id === 'salir' && { color: '#EF4444' }]}>
                    {item.label}
                  </Text>
                  <Text style={hm.itemSub}>{item.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const hm = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  panel: {
    position: 'absolute',
    right: 8,
    width: MENU_PANEL_W,
    maxHeight: '75%',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 24,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#00c8a0',
  },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarFallback: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 17, fontWeight: '800', color: '#fff' },
  userStatus: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginTop: 2 },
  scroll: { flexGrow: 0 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'transparent',
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  iconWrap: { flexShrink: 0 },
  itemText: { flex: 1, minWidth: 0 },
  itemLabel: { fontSize: 12, fontWeight: '600', color: '#111827', lineHeight: 16 },
  itemSub: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
});

// ══════════════════════════════════════════════════════════════════
// MODAL CLIMA
// ══════════════════════════════════════════════════════════════════
export const WeatherModal = ({
  visible,
  onClose,
  temp,
  city,
  condition,
}: {
  visible: boolean;
  onClose: () => void;
  temp: string;
  city: string;
  condition: 'sunny' | 'cloudy' | 'rain';
}) => {
  const conditionLabel = condition === 'sunny' ? '☀️ Soleado' : condition === 'cloudy' ? '☁️ Nublado' : '🌧️ Lluvia';
  const conditionColor = condition === 'sunny' ? '#f59e0b' : condition === 'cloudy' ? '#6b7280' : '#3b82f6';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={wm.overlay} onPress={onClose}>
        <Pressable style={wm.panel} onPress={() => {}}>
          {/* Header */}
          <View style={wm.header}>
            <Text style={wm.headerTitle}>🌍 Clima en {city}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={wm.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Temperatura principal */}
          <View style={wm.main}>
            <Text style={wm.tempBig}>{temp}</Text>
            <Text style={[wm.condition, { color: conditionColor }]}>{conditionLabel}</Text>
            <Text style={wm.city}>{city}, Guinea Ecuatorial</Text>
          </View>

          {/* Detalles */}
          <View style={wm.details}>
            {[
              { label: 'Humedad',    value: '78%',    icon: '💧' },
              { label: 'Viento',     value: '12 km/h', icon: '💨' },
              { label: 'Sensación',  value: `${parseInt(temp) + 2}°`, icon: '🌡️' },
              { label: 'UV',         value: 'Alto',   icon: '☀️' },
            ].map(d => (
              <View key={d.label} style={wm.detailItem}>
                <Text style={wm.detailIcon}>{d.icon}</Text>
                <Text style={wm.detailValue}>{d.value}</Text>
                <Text style={wm.detailLabel}>{d.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={wm.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={wm.closeBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const wm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingLeft: 8,
  },
  panel: {
    width: 280,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  closeText: { fontSize: 16, color: Colors.textTertiary },
  main: { alignItems: 'center', paddingVertical: 24 },
  tempBig: { fontSize: 56, fontWeight: '800', color: Colors.textPrimary, lineHeight: 64 },
  condition: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, marginTop: 4 },
  city: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 6 },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 16,
  },
  detailItem: { alignItems: 'center', gap: 4 },
  detailIcon: { fontSize: 20 },
  detailValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  detailLabel: { fontSize: 10, color: Colors.textTertiary },
  closeBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.base },
});
