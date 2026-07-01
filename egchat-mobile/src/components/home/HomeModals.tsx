import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Pressable, ScrollView,
  StyleSheet, Linking, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HOME_NEWS, NEWS_SOURCES, type HomeNewsItem } from '../../data/homeNews';
import { fetchLiveHomeNews } from '../../services/newsRss';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../theme';

const Sheet = ({
  visible, title, onClose, children,
}: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={s.overlay} onPress={onClose}>
      <Pressable style={s.sheet} onPress={() => {}}>
        <View style={s.handle} />
        <Text style={s.sheetTitle}>{title}</Text>
        <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
);

export function HomeNoticiasModal({
  visible, onClose,
}: { visible: boolean; onClose: () => void }) {
  const [items, setItems] = useState<HomeNewsItem[]>(HOME_NEWS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchLiveHomeNews()
      .then(setItems)
      .finally(() => setLoading(false));
  }, [visible]);

  return (
    <Sheet visible={visible} title="📰 Noticias" onClose={onClose}>
      <Text style={s.sectionLabel}>ÚLTIMAS NOTICIAS</Text>
      {loading && <ActivityIndicator color="#00b4e6" style={{ marginVertical: 12 }} />}
      {items.map(item => (
        <TouchableOpacity
          key={item.id}
          style={s.newsRow}
          activeOpacity={0.75}
          onPress={() => {
            if (item.url) Linking.openURL(item.url);
            else Alert.alert(item.title, item.source);
          }}
        >
          <View style={s.newsDot} />
          <View style={{ flex: 1 }}>
            <Text style={s.newsTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={s.newsMeta}>{item.source} · {item.time}</Text>
          </View>
          {item.url ? <Text style={s.newsLink}>🔗</Text> : null}
        </TouchableOpacity>
      ))}

      <Text style={[s.sectionLabel, { marginTop: Spacing.lg }]}>FUENTES</Text>
      {NEWS_SOURCES.map(n => (
        <TouchableOpacity
          key={n.name}
          style={s.sourceRow}
          activeOpacity={0.75}
          onPress={() => (n.url ? Linking.openURL(n.url) : Alert.alert(n.name, n.desc))}
        >
          <Text style={s.sourceIcon}>{n.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.sourceName}>{n.name}</Text>
            <Text style={s.sourceDesc}>{n.desc}</Text>
          </View>
          <Text style={s.sourceArrow}>{n.url ? '🔗' : '›'}</Text>
        </TouchableOpacity>
      ))}
      <View style={{ height: 24 }} />
    </Sheet>
  );
}

export function HomeIdDigitalModal({
  visible, onClose, userName, userPhone, userId, verified,
}: {
  visible: boolean; onClose: () => void;
  userName: string; userPhone: string; userId: string; verified?: boolean;
}) {
  const idShort = userId
    ? `EG-${new Date().getFullYear()}-${userId.slice(-4).toUpperCase()}`
    : 'EG-2026-****';

  return (
    <Sheet visible={visible} title="🪪 ID Digital" onClose={onClose}>
      <LinearGradient
        colors={['#1A3A6B', '#0E5F8A', '#0A7A8A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.idCard}
      >
        <Text style={s.idCardEmoji}>🪪</Text>
        <Text style={s.idCardName}>{userName || 'Usuario EGCHAT'}</Text>
        {!!userPhone && <Text style={s.idCardPhone}>{userPhone}</Text>}
        <Text style={s.idCardCode}>{idShort}</Text>
        <View style={[s.idBadge, verified && s.idBadgeOk]}>
          <Text style={s.idBadgeText}>{verified ? '✓ Identidad verificada' : 'Pendiente de verificación'}</Text>
        </View>
      </LinearGradient>

      {[
        { icon: '✅', label: 'DNI verificado', desc: 'Documento de identidad vinculado' },
        { icon: '📱', label: 'Número verificado', desc: userPhone ? `Tel: ${userPhone}` : 'Teléfono pendiente' },
        { icon: '🔒', label: 'Cuenta segura', desc: 'Mensajes cifrados de extremo a extremo' },
        { icon: '🌍', label: 'Zona CEMAC', desc: 'Válido en los 6 países CEMAC' },
      ].map(item => (
        <View key={item.label} style={s.featureRow}>
          <Text style={s.featureIcon}>{item.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.featureLabel}>{item.label}</Text>
            <Text style={s.featureDesc}>{item.desc}</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={s.verifyBtn}
        activeOpacity={0.85}
        onPress={() => Alert.alert('ID Digital', 'La verificación biométrica estará disponible en una próxima actualización.')}
      >
        <LinearGradient colors={['#00C8A0', '#00B4E6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.verifyBtnGrad}>
          <Text style={s.verifyBtnText}>Verificar mi identidad</Text>
        </LinearGradient>
      </TouchableOpacity>
      <View style={{ height: 20 }} />
    </Sheet>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#F7F8FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingBottom: Spacing.xl,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB',
    alignSelf: 'center', marginTop: 10, marginBottom: 8,
  },
  sheetTitle: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold as '700',
    color: '#111827', textAlign: 'center', marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#6B7280',
    letterSpacing: 0.5, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
  newsRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: '#fff', borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  newsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginTop: 5 },
  newsTitle: { fontSize: FontSize.sm, fontWeight: '600', color: '#0d0d0d' },
  newsMeta: { fontSize: 11, color: '#9ca3af', marginTop: 3 },
  newsLink: { fontSize: 16 },
  sourceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: '#fff', borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  sourceIcon: { fontSize: 22 },
  sourceName: { fontSize: FontSize.sm, fontWeight: '700', color: '#111827' },
  sourceDesc: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  sourceArrow: { fontSize: 18, color: '#D1D5DB' },
  idCard: {
    marginHorizontal: Spacing.lg, borderRadius: 16, padding: Spacing.xl,
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  idCardEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  idCardName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  idCardPhone: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  idCardCode: { fontSize: 14, fontWeight: '700', color: '#00c8a0', marginTop: 10, letterSpacing: 1 },
  idBadge: {
    marginTop: Spacing.md, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
  },
  idBadgeOk: { backgroundColor: 'rgba(0,200,160,0.25)' },
  idBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: '#fff', borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  featureIcon: { fontSize: 20 },
  featureLabel: { fontSize: FontSize.sm, fontWeight: '700', color: '#111827' },
  featureDesc: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  verifyBtn: { marginHorizontal: Spacing.lg, marginTop: Spacing.md, borderRadius: 12, overflow: 'hidden' },
  verifyBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  verifyBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
