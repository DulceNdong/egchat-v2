/**
 * EGChat — Dispositivos conectados
 * Pantalla estilo WhatsApp Web: muestra todos los dispositivos
 * activos del usuario y permite cerrar sesiones remotamente.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Alert, ActivityIndicator,
  TouchableOpacity, RefreshControl, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import {
  SettingsLayout, SettingsSection, SettingsCard, SettingsDivider, SettingsRow,
} from '../../src/components/settings/SettingsUI';
import {
  getActiveSessions, revokeSession, revokeAllOtherSessions,
  getDeviceId, type ActiveSession,
} from '../../src/services/deviceSessions';
import { toast } from '../../src/components/Toast';
import { Colors } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';
import { useLanguage } from '../../src/context/LanguageContext';

// ── Iconos de dispositivo ─────────────────────────────────────────
function DeviceIcon({ type, color }: { type: string; color: string }) {
  if (type === 'ios' || type === 'android') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
        <Rect x="5" y="2" width="14" height="20" rx="2" />
        <Path d="M12 18h.01" />
      </Svg>
    );
  }
  if (type === 'web') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
        <Circle cx="12" cy="12" r="10" />
        <Path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </Svg>
    );
  }
  // desktop
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
      <Rect x="2" y="3" width="20" height="14" rx="2" />
      <Path d="M8 21h8M12 17v4" />
    </Svg>
  );
}

// ── Calcular tiempo relativo ──────────────────────────────────────
function relativeTime(iso: string, t: (key: string) => string, language: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return t('setNow');
  if (mins < 60)  return language === 'en'
    ? `${mins} ${t('setMinShort')} ${t('setAgoSuffix')}`
    : `${t('setAgoPrefix')} ${mins} ${t('setMinShort')}`;
  if (hours < 24) return language === 'en'
    ? `${hours} ${t('setHourShort')} ${t('setAgoSuffix')}`
    : `${t('setAgoPrefix')} ${hours} ${t('setHourShort')}`;
  return language === 'en'
    ? `${days} ${days === 1 ? t('setDayShort') : t('setDaysShort')} ${t('setAgoSuffix')}`
    : `${t('setAgoPrefix')} ${days} ${days === 1 ? t('setDayShort') : t('setDaysShort')}`;
}

function deviceTypeLabel(type: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    ios: 'iPhone / iPad', android: 'Android',
    web: 'Web', desktop: t('setDesktop'),
  };
  return map[type] || t('setDevice');
}

// ── Tarjeta de sesión ─────────────────────────────────────────────
function SessionCard({
  session, onRevoke, revoking,
}: {
  session: ActiveSession;
  onRevoke: (id: string) => void;
  revoking: boolean;
}) {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const { translate: t, language } = useLanguage();
  const accent = session.isCurrentDevice ? '#00c8a0' : '#6b7280';

  return (
    <View style={[sc.card, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
      {/* Icono + info */}
      <View style={[sc.iconWrap, { backgroundColor: session.isCurrentDevice ? 'rgba(0,200,160,0.12)' : 'rgba(107,114,128,0.1)' }]}>
        <DeviceIcon type={session.deviceType} color={accent} />
      </View>

      <View style={sc.info}>
        <View style={sc.nameRow}>
          <Text style={[sc.name, { color: C.textPrimary }]} numberOfLines={1}>
            {session.deviceName || deviceTypeLabel(session.deviceType, t)}
          </Text>
          {session.isCurrentDevice && (
            <View style={sc.currentBadge}>
              <Text style={sc.currentBadgeTxt}>{t('thisDevice')}</Text>
            </View>
          )}
        </View>
        <Text style={[sc.platform, { color: C.textSecondary }]}>
          {session.platform || deviceTypeLabel(session.deviceType, t)}
        </Text>
        <Text style={[sc.lastSeen, { color: C.textTertiary }]}>
          {session.isCurrentDevice ? `🟢 ${t('activeNow')}` : `⏱ ${relativeTime(session.lastSeen, t, language)}`}
        </Text>
      </View>

      {/* Botón cerrar — solo para otros dispositivos */}
      {!session.isCurrentDevice && (
        <TouchableOpacity
          style={sc.closeBtn}
          onPress={() => onRevoke(session.id)}
          disabled={revoking}
          hitSlop={8}
        >
          {revoking
            ? <ActivityIndicator size="small" color="#ef4444" />
            : <Text style={sc.closeBtnTxt}>{t('closeSession')}</Text>
          }
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────
export default function DispositivosScreen() {
  const [sessions, setSessions]     = useState<ActiveSession[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revoking, setRevoking]     = useState<string | null>(null);

  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const { translate: t } = useLanguage();

  const loadSessions = useCallback(async () => {
    const data = await getActiveSessions();
    // Ordenar: dispositivo actual primero, luego por último visto
    const sorted = [...data].sort((a, b) => {
      if (a.isCurrentDevice) return -1;
      if (b.isCurrentDevice) return 1;
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    });
    setSessions(sorted);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadSessions(); }, []);

  const handleRevoke = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    const name = session?.deviceName || t('setThisDevice');

    Alert.alert(
      t('setCloseSessionTitle'),
      `${t('setCloseSessionConfirm')} ${name}? ${t('setCloseSessionConfirmEnd')}`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('setCloseSessionTitle'),
          style: 'destructive',
          onPress: async () => {
            setRevoking(sessionId);
            const ok = await revokeSession(sessionId);
            setRevoking(null);
            if (ok) {
              setSessions(prev => prev.filter(s => s.id !== sessionId));
              toast.success(`✓ ${t('setSessionClosed')}`);
            } else {
              toast.error(t('setSessionCloseFailed'));
            }
          },
        },
      ],
    );
  }, [sessions, t]);

  const handleRevokeAll = useCallback(() => {
    const others = sessions.filter(s => !s.isCurrentDevice);
    if (others.length === 0) {
      toast.info(t('setNoOtherSessions'));
      return;
    }
    const count = others.length;
    Alert.alert(
      t('setCloseAllSessions'),
      `${t('setCloseAllBody')} ${count} ${count === 1 ? t('setDeviceSingular') : t('setDevices')} ${t('setCloseAllBodyEnd')}`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('setCloseAll'),
          style: 'destructive',
          onPress: async () => {
            const ok = await revokeAllOtherSessions();
            if (ok) {
              setSessions(prev => prev.filter(s => s.isCurrentDevice));
              toast.success(`✓ ${t('setAllSessionsClosed')}`);
            } else {
              toast.error(t('setSessionsCloseFailed'));
            }
          },
        },
      ],
    );
  }, [sessions, t]);

  const otherSessions = sessions.filter(s => !s.isCurrentDevice);
  const currentSession = sessions.find(s => s.isCurrentDevice);

  return (
    <SettingsLayout title={t('connectedDevicesTitle')}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadSessions(); }}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Info */}
        <View style={[st.infoBanner, { backgroundColor: isDark ? '#161b22' : '#f0fdf4' }]}>
          <Text style={[st.infoBannerTxt, { color: isDark ? '#86efac' : '#166534' }]}>
            📱  {t('devicesInfoBanner')}
          </Text>
        </View>

        {/* Cargando */}
        {loading && (
          <ActivityIndicator color={Colors.accent} style={{ marginVertical: 32 }} />
        )}

        {/* Dispositivo actual */}
        {!loading && currentSession && (
          <>
            <SettingsSection label={t('thisDevice')} />
            <View style={st.cardsWrap}>
              <SessionCard
                session={currentSession}
                onRevoke={handleRevoke}
                revoking={revoking === currentSession.id}
              />
            </View>
          </>
        )}

        {/* Otros dispositivos */}
        {!loading && otherSessions.length > 0 && (
          <>
            <SettingsSection label={`${t('otherDevices')} (${otherSessions.length})`} />
            <View style={st.cardsWrap}>
              {otherSessions.map((session, i) => (
                <React.Fragment key={session.id}>
                  <SessionCard
                    session={session}
                    onRevoke={handleRevoke}
                    revoking={revoking === session.id}
                  />
                  {i < otherSessions.length - 1 && (
                    <View style={[st.divider, { backgroundColor: isDark ? '#21262d' : '#f3f4f6' }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </>
        )}

        {/* Sin otras sesiones */}
        {!loading && otherSessions.length === 0 && (
          <View style={st.empty}>
            <Text style={st.emptyIcon}>💻</Text>
            <Text style={[st.emptyTitle, { color: C.textPrimary }]}>{t('onlyThisDevice')}</Text>
            <Text style={[st.emptySub, { color: C.textSecondary }]}>
              {t('scanQRToUseOnPC')}
            </Text>
          </View>
        )}

        {/* Acción: cerrar todas */}
        {!loading && otherSessions.length > 0 && (
          <>
            <SettingsSection label={t('setActions')} />
            <SettingsCard>
              <SettingsRow
                label={t('setCloseAllSessionsRow')}
                danger
                onPress={handleRevokeAll}
              />
            </SettingsCard>
          </>
        )}

        {/* Info seguridad */}
        {!loading && (
          <View style={st.securityNote}>
            <Text style={[st.securityTxt, { color: C.textTertiary }]}>
              🔒 {t('setSecurityNote')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SettingsLayout>
  );
}

// ── Estilos ────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  iconWrap: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  currentBadge: {
    backgroundColor: 'rgba(0,200,160,0.15)',
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  currentBadgeTxt: { fontSize: 10, fontWeight: '700', color: '#00c8a0' },
  platform:   { fontSize: 12, fontWeight: '500' },
  lastSeen:   { fontSize: 11 },
  closeBtn:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)' },
  closeBtnTxt:{ fontSize: 13, fontWeight: '700', color: '#ef4444' },
});

const st = StyleSheet.create({
  infoBanner: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    borderRadius: 12, padding: 12,
  },
  infoBannerTxt: { fontSize: 13, lineHeight: 18 },
  cardsWrap: {
    marginHorizontal: 16, borderRadius: 12, overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  divider: { height: 1, marginHorizontal: 16 },
  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 32, gap: 8 },
  emptyIcon:  { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptySub:   { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  securityNote: { margin: 16, padding: 12, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.06)' },
  securityTxt:  { fontSize: 12, lineHeight: 17 },
});
