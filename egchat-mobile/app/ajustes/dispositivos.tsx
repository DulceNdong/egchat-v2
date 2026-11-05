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
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return 'Ahora mismo';
  if (mins < 60)  return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${days} día${days !== 1 ? 's' : ''}`;
}

function deviceTypeLabel(type: string): string {
  const map: Record<string, string> = {
    ios: 'iPhone / iPad', android: 'Android',
    web: 'Web', desktop: 'Escritorio',
  };
  return map[type] || 'Dispositivo';
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
            {session.deviceName || deviceTypeLabel(session.deviceType)}
          </Text>
          {session.isCurrentDevice && (
            <View style={sc.currentBadge}>
              <Text style={sc.currentBadgeTxt}>Este dispositivo</Text>
            </View>
          )}
        </View>
        <Text style={[sc.platform, { color: C.textSecondary }]}>
          {session.platform || deviceTypeLabel(session.deviceType)}
        </Text>
        <Text style={[sc.lastSeen, { color: C.textTertiary }]}>
          {session.isCurrentDevice ? '🟢 Activo ahora' : `⏱ ${relativeTime(session.lastSeen)}`}
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
            : <Text style={sc.closeBtnTxt}>Cerrar</Text>
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
    const name = session?.deviceName || 'este dispositivo';

    Alert.alert(
      'Cerrar sesión',
      `¿Cerrar la sesión en ${name}? Ese dispositivo tendrá que volver a iniciar sesión.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            setRevoking(sessionId);
            const ok = await revokeSession(sessionId);
            setRevoking(null);
            if (ok) {
              setSessions(prev => prev.filter(s => s.id !== sessionId));
              toast.success('✓ Sesión cerrada');
            } else {
              toast.error('No se pudo cerrar la sesión');
            }
          },
        },
      ],
    );
  }, [sessions]);

  const handleRevokeAll = useCallback(() => {
    const others = sessions.filter(s => !s.isCurrentDevice);
    if (others.length === 0) {
      toast.info('No hay otras sesiones activas');
      return;
    }
    Alert.alert(
      'Cerrar todas las sesiones',
      `Esto cerrará la sesión en ${others.length} dispositivo${others.length !== 1 ? 's' : ''} (excepto este). ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar todas',
          style: 'destructive',
          onPress: async () => {
            const ok = await revokeAllOtherSessions();
            if (ok) {
              setSessions(prev => prev.filter(s => s.isCurrentDevice));
              toast.success('✓ Todas las otras sesiones cerradas');
            } else {
              toast.error('No se pudieron cerrar las sesiones');
            }
          },
        },
      ],
    );
  }, [sessions]);

  const otherSessions = sessions.filter(s => !s.isCurrentDevice);
  const currentSession = sessions.find(s => s.isCurrentDevice);

  return (
    <SettingsLayout title="Dispositivos conectados">
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
            📱  Puedes usar EGChat en hasta 4 dispositivos a la vez. Los mensajes se sincronizan en tiempo real entre todos.
          </Text>
        </View>

        {/* Cargando */}
        {loading && (
          <ActivityIndicator color={Colors.accent} style={{ marginVertical: 32 }} />
        )}

        {/* Dispositivo actual */}
        {!loading && currentSession && (
          <>
            <SettingsSection label="Este dispositivo" />
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
            <SettingsSection label={`Otros dispositivos (${otherSessions.length})`} />
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
            <Text style={[st.emptyTitle, { color: C.textPrimary }]}>Solo este dispositivo</Text>
            <Text style={[st.emptySub, { color: C.textSecondary }]}>
              Escanea el QR en egchat-v2.vercel.app para usar EGChat en tu ordenador
            </Text>
          </View>
        )}

        {/* Acción: cerrar todas */}
        {!loading && otherSessions.length > 0 && (
          <>
            <SettingsSection label="Acciones" />
            <SettingsCard>
              <SettingsRow
                label="Cerrar todas las otras sesiones"
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
              🔒 Si no reconoces algún dispositivo, cierra esa sesión de inmediato y cambia tu contraseña en Ajustes → Seguridad.
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
