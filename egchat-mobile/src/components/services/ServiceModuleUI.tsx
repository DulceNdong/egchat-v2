// UI compartida módulos servicios básicos — paridad ModHeader / grids web
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Pressable,
  ScrollView, TextInput, Dimensions, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Polyline, Line, Rect, Circle } from 'react-native-svg';

const { height: SCREEN_H } = Dimensions.get('window');

// ── Shell modal ───────────────────────────────────────────────────
export const ServiceModuleShell = ({
  visible, title, subtitle, onBack, onClose, children,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  onBack: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={sh.overlay} onPress={onClose}>
      <Pressable style={sh.sheet} onPress={() => {}}>
        <View style={sh.header}>
          <TouchableOpacity onPress={onBack} style={sh.backBtn} hitSlop={8}>
            <Text style={sh.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={sh.headerCenter}>
            <Text style={sh.headerTitle}>{title}</Text>
            {subtitle ? <Text style={sh.headerSub}>{subtitle}</Text> : null}
          </View>
          <TouchableOpacity onPress={onClose} style={sh.closeBtn}>
            <Text style={sh.closeX}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={sh.body}
          contentContainerStyle={sh.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
);

// ── Grid home (3 columnas) ───────────────────────────────────────
export type HomeGridItem = {
  id: string;
  label: string;
  desc: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
};

export const ServiceHomeGrid = ({ items, onPress }: { items: HomeGridItem[]; onPress: (id: string) => void }) => (
  <View style={sh.gridWrap}>
    {items.map(item => (
      <TouchableOpacity key={item.id + item.label} style={sh.gridCell} onPress={() => onPress(item.id)} activeOpacity={0.75}>
        <View style={[sh.gridIconBox, { backgroundColor: item.bg }]}>{item.icon}</View>
        <Text style={sh.gridLabel} numberOfLines={2}>{item.label}</Text>
        <Text style={sh.gridDesc} numberOfLines={2}>{item.desc}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ── Banner inferior con FAB refresh ─────────────────────────────
export const ServiceBanner = ({
  label, count, suffix, colors, onRefresh,
}: {
  label: string;
  count: number | string;
  suffix: string;
  colors: [string, string];
  onRefresh?: () => void;
}) => (
  <View style={sh.bannerOuter}>
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={sh.banner}>
      <Text style={sh.bannerLabel}>{label}</Text>
      <Text style={sh.bannerCount}>{count} operadores</Text>
      <Text style={sh.bannerSuffix}>{suffix}</Text>
    </LinearGradient>
    {onRefresh && (
      <TouchableOpacity style={sh.bannerFab} onPress={onRefresh} activeOpacity={0.85}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round">
          <Polyline points="23 4 23 10 17 10" />
          <Path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </Svg>
      </TouchableOpacity>
    )}
  </View>
);

// ── Logo thumb con iniciales ──────────────────────────────────────
export const LogoThumb = ({ name, color, size = 40 }: { name: string; color: string; size?: number }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const r = size * 0.28;
  return (
    <View style={{
      width: size, height: size, borderRadius: r,
      backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <View style={{
        width: size * 0.75, height: size * 0.75, borderRadius: size * 0.2,
        backgroundColor: color, alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ color: '#fff', fontSize: size * 0.28, fontWeight: '900' }}>{initials}</Text>
      </View>
    </View>
  );
};

// ── Badge estado ──────────────────────────────────────────────────
export const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { bg: string; color: string }> = {
    pendiente: { bg: '#FEF3C7', color: '#92400E' },
    activo: { bg: '#F0FDF4', color: '#16A34A' },
    completado: { bg: '#EFF6FF', color: '#1D4ED8' },
    cancelado: { bg: '#FFF1F2', color: '#DC2626' },
  };
  const s = cfg[status] || { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: s.color }}>{status}</Text>
    </View>
  );
};

// ── Grid operadores 4 columnas ────────────────────────────────────
export const OperatorGrid = ({
  items, onSelect,
}: {
  items: Array<{ id: string; name: string; color: string; cov?: string; cat?: string }>;
  onSelect: (id: string) => void;
}) => (
  <View style={sh.opCard}>
    <View style={sh.opGrid}>
      {items.map(op => (
        <TouchableOpacity key={op.id} style={sh.opCell} onPress={() => onSelect(op.id)} activeOpacity={0.7}>
          <View style={[sh.opLogo, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }]}>
            <View style={[sh.opLogoInner, { backgroundColor: op.color }]}>
              <Text style={sh.opInitials}>{op.name.slice(0, 2).toUpperCase()}</Text>
            </View>
          </View>
          <Text style={sh.opName} numberOfLines={1}>{op.name}</Text>
          <Text style={sh.opCov} numberOfLines={1}>{op.cov || op.cat || ''}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// ── Campo formulario ─────────────────────────────────────────────
export const FormField = ({
  placeholder, value, onChangeText, keyboardType,
}: {
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
}) => (
  <View style={sh.formField}>
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      style={sh.formInput}
    />
  </View>
);

// ── Pantalla soporte ─────────────────────────────────────────────
const SUPPORT_ITEMS = [
  { icon: '🐛', label: 'Reportar incidencia', desc: 'Problema con tu servicio' },
  { icon: '🎫', label: 'Abrir ticket', desc: 'Nueva solicitud de soporte' },
  { icon: '💬', label: 'Chat con soporte', desc: 'Respuesta en menos de 1h' },
  { icon: '📞', label: 'Llamar soporte', desc: '+240 333 00 00 00', action: 'tel:+240333000000' },
  { icon: '📧', label: 'Email soporte', desc: 'soporte@egchat.gq', action: 'mailto:soporte@egchat.gq' },
];

export const SupportScreen = () => (
  <View style={sh.supportCard}>
    <Text style={sh.supportTitle}>🎧 Soporte</Text>
    {SUPPORT_ITEMS.map((s, i) => (
      <TouchableOpacity
        key={i}
        style={sh.supportItem}
        activeOpacity={0.7}
        onPress={() => s.action && Linking.openURL(s.action)}
      >
        <Text style={sh.supportIcon}>{s.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={sh.supportLabel}>{s.label}</Text>
          <Text style={sh.supportDesc}>{s.desc}</Text>
        </View>
      </TouchableOpacity>
    ))}
  </View>
);

// ── Empty state ───────────────────────────────────────────────────
export const EmptyState = ({ emoji, title, desc, actionLabel, onAction }: {
  emoji: string; title: string; desc: string; actionLabel?: string; onAction?: () => void;
}) => (
  <View style={sh.empty}>
    <Text style={sh.emptyEmoji}>{emoji}</Text>
    <Text style={sh.emptyTitle}>{title}</Text>
    <Text style={sh.emptyDesc}>{desc}</Text>
    {actionLabel && onAction && (
      <TouchableOpacity style={sh.emptyBtn} onPress={onAction}>
        <Text style={sh.emptyBtnText}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ── Botón primario ────────────────────────────────────────────────
export const PrimaryButton = ({
  label, onPress, disabled, color,
}: {
  label: string; onPress: () => void; disabled?: boolean; color?: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.85}
    style={{ opacity: disabled ? 0.6 : 1 }}
  >
    <LinearGradient
      colors={disabled ? ['#e5e7eb', '#e5e7eb'] : [color || '#10B981', (color || '#10B981') + 'bb']}
      style={sh.primaryBtn}
    >
      <Text style={[sh.primaryBtnText, disabled && { color: '#9ca3af' }]}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

// ── Iconos SVG reutilizables ──────────────────────────────────────
export const Ico = {
  signal: (c: string) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
      <Line x1="1" y1="6" x2="1" y2="18" /><Line x1="6" y1="11" x2="6" y2="18" />
      <Line x1="11" y1="8" x2="11" y2="18" /><Line x1="16" y1="5" x2="16" y2="18" />
      <Line x1="21" y1="2" x2="21" y2="18" />
    </Svg>
  ),
  wifi: (c: string) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M5 12.55a11 11 0 0 1 14.08 0" /><Path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><Circle cx="12" cy="20" r="1" fill={c} stroke="none" />
    </Svg>
  ),
  phone: (c: string) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  ),
  clock: (c: string) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
      <Circle cx="12" cy="12" r="10" /><Polyline points="12 6 12 12 16 14" />
    </Svg>
  ),
  mobile: (c: string) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
      <Rect x="5" y="2" width="14" height="20" rx="2" /><Line x1="12" y1="18" x2="12.01" y2="18" />
    </Svg>
  ),
  headset: (c: string) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <Path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </Svg>
  ),
  home: (c: string) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  ),
  wrench: (c: string) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </Svg>
  ),
  card: (c: string) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
      <Rect x="1" y="4" width="22" height="16" rx="2" /><Line x1="1" y1="10" x2="23" y2="10" />
    </Svg>
  ),
  clipboard: (c: string) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <Rect x="9" y="3" width="6" height="4" rx="1" />
      <Line x1="9" y1="12" x2="15" y2="12" /><Line x1="9" y1="16" x2="13" y2="16" />
    </Svg>
  ),
  tv: (c: string) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
      <Rect x="2" y="7" width="20" height="15" rx="2" /><Polyline points="17 2 12 7 7 2" />
    </Svg>
  ),
  box: (c: string) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <Polyline points="3.27 6.96 12 12.01 20.73 6.96" /><Line x1="12" y1="22.08" x2="12" y2="12" />
    </Svg>
  ),
  check: (c: string) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><Polyline points="22 4 12 14.01 9 11.01" />
    </Svg>
  ),
};

const sh = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#f5f5f5', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    maxHeight: SCREEN_H * 0.92, overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F2F5',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 20, color: '#6B7280' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 9, color: '#9CA3AF', marginTop: 2, textAlign: 'center' },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  closeX: { fontSize: 14, color: '#6B7280' },
  body: { flexGrow: 0 },
  bodyContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 28 },

  gridWrap: {
    flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#F0F2F5',
    borderRadius: 14, overflow: 'hidden', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  gridCell: {
    width: '33.333%', backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 10,
    alignItems: 'center', marginBottom: 1, marginRight: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 1,
  },
  gridIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  gridLabel: { fontSize: 11, fontWeight: '600', color: '#111827', textAlign: 'center', lineHeight: 14 },
  gridDesc: { fontSize: 9, color: '#9CA3AF', textAlign: 'center', marginTop: 2 },

  bannerOuter: { position: 'relative', marginBottom: 8 },
  banner: { borderRadius: 14, padding: 14, paddingRight: 56 },
  bannerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  bannerCount: { fontSize: 24, fontWeight: '800', color: '#fff' },
  bannerSuffix: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  bannerFab: {
    position: 'absolute', right: -4, top: '50%', marginTop: -22,
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#00C8A0',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },

  opCard: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 12, elevation: 1 },
  opGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#F0F2F5' },
  opCell: { width: '25%', backgroundColor: '#fff', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, marginBottom: 1 },
  opLogo: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  opLogoInner: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  opInitials: { color: '#fff', fontSize: 12, fontWeight: '900' },
  opName: { fontSize: 10, fontWeight: '600', color: '#111827', textAlign: 'center', maxWidth: 60 },
  opCov: { fontSize: 9, color: '#9CA3AF', textAlign: 'center' },

  formField: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, height: 48, justifyContent: 'center', marginBottom: 8 },
  formInput: { fontSize: 14, color: '#0d0d0d' },

  supportCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  supportTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 12 },
  supportItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 8 },
  supportIcon: { fontSize: 22 },
  supportLabel: { fontSize: 13, fontWeight: '700', color: '#111' },
  supportDesc: { fontSize: 11, color: '#888' },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 20 },
  emptyBtn: { backgroundColor: '#1485EE', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  primaryBtn: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
