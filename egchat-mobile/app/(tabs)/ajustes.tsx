// EGCHAT — Hub de Configuración (paridad con ConfiguracionView web v2.5.5)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TabErrorBoundary } from '../../src/components/TabErrorBoundary';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import { authAPI, clearToken } from '../../src/api';
import { mergePersistentAvatar, onProfileUpdated } from '../../src/utils/profileEvents';
import { AccountSwitcher } from '../../src/components/AccountSwitcher';
import { NotificationsPanel, HamburgerMenu, WeatherModal, AppNotification } from '../../src/components/HeaderPanels';
import { EGChatHeader } from '../../src/components/EGChatHeader';
import { useAppStore } from '../../src/store/useAppStore';
import { markAllRead, clearAllNotifications, removeNotification } from '../../src/store/appStore';
import { SettingsSearch, SettingsSection, SettingsCard, SettingsDivider, SettingsRow } from '../../src/components/settings/SettingsUI';
import { Colors, Spacing } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

type MenuItem = { label: string; route: string; value?: string };

const ALL_ROWS: MenuItem[] = [
  { label: 'Perfil', route: '/ajustes/perfil' },
  { label: 'Seguridad de la cuenta', route: '/ajustes/seguridad' },
  { label: 'Mi información y autorizaciones', route: '/ajustes/privacidad' },
  { label: 'Notificaciones', route: '/ajustes/notificaciones' },
  { label: 'Interfaz y pantalla', route: '/ajustes/interfaz' },
  { label: 'Permisos de amigos', route: '/ajustes/permisos-amigos' },
  { label: 'Almacenamiento', route: '/ajustes/almacenamiento' },
  { label: 'Sonidos y notificaciones', route: '/ajustes/sonidos' },
  { label: 'Chat', route: '/ajustes/chat' },
  { label: 'Llamadas de voz y video', route: '/ajustes/llamadas' },
  { label: 'Administrar historial de chat', route: '/ajustes/historial-chat' },
  { label: 'Otras funciones', route: '/ajustes/otras-funciones' },
  { label: 'Registro de actividad', route: '/ajustes/actividad' },
  { label: 'Comentarios', route: '/ajustes/comentarios' },
  { label: 'Acerca de EGCHAT', route: '/ajustes/acerca', value: 'v2.5.5' },
];

const SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Cuenta',
    items: [
      { label: 'Seguridad de la cuenta', route: '/ajustes/seguridad' },
      { label: 'Mi información y autorizaciones', route: '/ajustes/privacidad' },
      { label: 'Dispositivos conectados', route: '/ajustes/dispositivos' },
    ],
  },
  {
    title: 'General',
    items: [
      { label: 'Notificaciones', route: '/ajustes/notificaciones' },
      { label: 'Interfaz y pantalla', route: '/ajustes/interfaz' },
      { label: 'Permisos de amigos', route: '/ajustes/permisos-amigos' },
      { label: 'Almacenamiento', route: '/ajustes/almacenamiento' },
      { label: 'Sonidos y notificaciones', route: '/ajustes/sonidos' },
    ],
  },
  {
    title: 'Funciones',
    items: [
      { label: 'Chat', route: '/ajustes/chat' },
      { label: 'Llamadas de voz y video', route: '/ajustes/llamadas' },
      { label: 'Historial de llamadas', route: '/call-history' },
      { label: 'Administrar historial de chat', route: '/ajustes/historial-chat' },
      { label: 'Otras funciones', route: '/ajustes/otras-funciones' },
    ],
  },
  {
    title: 'Ayuda e información',
    items: [
      { label: 'Registro de actividad', route: '/ajustes/actividad' },
      { label: 'Comentarios', route: '/ajustes/comentarios' },
      { label: 'Acerca de EGCHAT', route: '/ajustes/acerca', value: 'v2.5.5' },
    ],
  },
];

const IconGear = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0d0d0d" strokeWidth={1.5} strokeLinecap="round">
    <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

function AjustesScreenInner() {
  const [user, setUser] = useState<{ id?: string; full_name?: string; phone?: string; email?: string; avatar_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [storageUsed] = useState(() => Math.round(Math.random() * 200 + 50));
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const { weather, notifications } = useAppStore();
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;

  useEffect(() => {
    authAPI.me()
      .then(data => mergePersistentAvatar(data))
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Actualizar avatar/nombre cuando el usuario los cambia en perfil
  useEffect(() => {
    return onProfileUpdated(patch => {
      setUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          ...(patch.avatar_url ? { avatar_url: patch.avatar_url } : {}),
          ...(patch.full_name ? { full_name: patch.full_name } : {}),
        };
      });
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return ALL_ROWS.filter(r => r.label.toLowerCase().includes(q));
  }, [search]);

  const logout = useCallback(() => {
    const doLogout = async () => {
      try { await authAPI.logout(); } catch {}
      try { await clearToken(); } catch {}
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = '/';
      } else {
        router.replace('/(auth)/login');
      }
    };

    if (typeof window !== 'undefined') {
      // Web: usar confirm nativo del navegador (siempre funciona)
      if (window.confirm('¿Cerrar sesión en EGChat?')) {
        doLogout();
      }
    } else {
      // Nativo: usar Alert
      Alert.alert('Cerrar sesión', '¿Estás seguro?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: doLogout },
      ]);
    }
  }, []);

  const navigate = (route: string) => router.push(route as any);

  const renderMenuCard = (items: MenuItem[]) => (
    <SettingsCard>
      {items.map((item, i) => (
        <React.Fragment key={item.route}>
          <SettingsRow
            label={item.label}
            value={item.label === 'Almacenamiento' ? `${storageUsed} MB` : item.value}
            onPress={() => navigate(item.route)}
          />
          {i < items.length - 1 && <SettingsDivider />}
        </React.Fragment>
      ))}
    </SettingsCard>
  );

  const initials = user?.full_name?.split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('') || 'U';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0d1117' : '#f2f2f7' }]} edges={['left', 'right']}>
      <EGChatHeader
        notificationsOpen={showNotifications}
        menuOpen={showMenu}
        onWeatherPress={() => setShowWeather(true)}
        onNotificationsPress={() => {
          setShowNotifications(true);
          markAllRead();
        }}
        onMenuPress={() => setShowMenu(true)}
      />

      <View style={[styles.bar, { backgroundColor: C.bgPrimary }]}>
        <View style={styles.barTitle}>
          <IconGear />
          <Text style={[styles.barText, { color: C.textPrimary }]}>Configuración</Text>
        </View>
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: isDark ? C.bgTertiary : 'rgba(243,244,246,0.85)', borderColor: C.borderLight }]}
          onPress={() => router.replace('/(tabs)/' as any)}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" stroke={C.textPrimary} strokeWidth={2.5} strokeLinecap="round">
            <Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <SettingsSearch value={search} onChangeText={setSearch} />

        {filtered ? (
          filtered.length === 0 ? (
            <Text style={{ textAlign: 'center', padding: 32, color: C.textTertiary }}>Sin resultados</Text>
          ) : (
            renderMenuCard(filtered)
          )
        ) : (
          <>
            <TouchableOpacity
              style={[styles.hero, { backgroundColor: isDark ? '#161b22' : '#fff' }]}
              onPress={() => navigate('/ajustes/perfil')}
              activeOpacity={0.8}
            >
              <LinearGradient colors={['#07c160', '#00b4e6']} style={styles.heroAvatar}>
                {user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.heroImg} />
                ) : loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.heroInitials}>{initials}</Text>
                )}
              </LinearGradient>
              <View style={styles.heroInfo}>
                <Text style={[styles.heroName, { color: C.textPrimary }]}>{user?.full_name || 'Usuario'}</Text>
                <Text style={[styles.heroSub, { color: C.textTertiary }]}>
                  {user?.id ? `ID: ${user.id.slice(0, 12).toUpperCase()}` : (user?.phone || '')}
                </Text>
              </View>
              <Text style={{ color: '#c7c7cc', fontSize: 18 }}>›</Text>
            </TouchableOpacity>

            {/* Banner: actualiza tu nombre si es genérico */}
            {user && (!user.full_name || user.full_name === 'Usuario EGCHAT' || user.full_name.startsWith('Usuario ')) && (
              <TouchableOpacity
                style={{ backgroundColor: '#fff3cd', borderRadius: 10, padding: 12, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                onPress={() => router.push('/ajustes/perfil')}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 16 }}>✏️</Text>
                <Text style={{ flex: 1, color: '#856404', fontSize: 13 }}>
                  Tu nombre aparece como genérico. Toca aquí para actualizar tu perfil.
                </Text>
              </TouchableOpacity>
            )}

            {/* Botón cambiar cuenta */}
            <TouchableOpacity
              style={styles.switchAccountBtn}
              onPress={() => setShowAccountSwitcher(true)}
              activeOpacity={0.7}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <Circle cx="9" cy="7" r="4"/>
                <Path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <Path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </Svg>
              <Text style={[styles.switchAccountText, { color: C.textTertiary }]}>Cambiar cuenta</Text>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2} strokeLinecap="round">
                <Path d="M9 18l6-6-6-6"/>
              </Svg>
            </TouchableOpacity>

            {SECTIONS.map(section => (
              <View key={section.title}>
                <SettingsSection label={section.title} />
                {renderMenuCard(
                  section.items.map(item =>
                    item.label === 'Almacenamiento'
                      ? { ...item, value: `${storageUsed} MB` }
                      : item,
                  ),
                )}
              </View>
            ))}

            <View style={{ height: 16 }} />
            <SettingsCard>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowAccountSwitcher(true)}>
                <Text style={styles.actionGreen}>Cambiar de cuenta</Text>
              </TouchableOpacity>
            </SettingsCard>
            <View style={{ height: 12 }} />
            <SettingsCard>
              <TouchableOpacity style={styles.actionBtn} onPress={logout}>
                <Text style={styles.actionRed}>Cerrar sesión</Text>
              </TouchableOpacity>
            </SettingsCard>
          </>
        )}
      </ScrollView>

      <NotificationsPanel
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAllRead={() => markAllRead()}
        onClearAll={() => clearAllNotifications()}
        onNotifPress={(n) => { removeNotification(n.id); setShowNotifications(false); }}
      />
      <HamburgerMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        user={user ? { full_name: user.full_name || '', avatar_url: user.avatar_url, phone: user.phone } : null}
      />
      <WeatherModal visible={showWeather} onClose={() => setShowWeather(false)} temp={`${weather.temp}°`} city={weather.city} condition={weather.condition} />
      <AccountSwitcher
        visible={showAccountSwitcher}
        currentAccountId={user?.id || ''}
        onClose={() => setShowAccountSwitcher(false)}
        onSwitch={(id) => { setShowAccountSwitcher(false); authAPI.me().then(setUser); }}
        onAddAccount={() => router.push('/(auth)/login' as any)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 10,
  },
  barTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barText: { fontSize: 16, fontWeight: '600' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 14,
    marginBottom: 1,
  },
  heroAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  heroImg: { width: '100%', height: '100%' },
  heroInitials: { fontSize: 20, fontWeight: '700', color: '#fff' },
  switchAccountBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 10, marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)',
  },
  switchAccountText: { fontSize: 13, fontWeight: '500' },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 17, fontWeight: '600' },
  heroSub: { fontSize: 13, marginTop: 2 },
  actionBtn: { paddingVertical: 15, alignItems: 'center' },
  actionGreen: { fontSize: 16, fontWeight: '500', color: '#07c160' },
  actionRed: { fontSize: 16, fontWeight: '500', color: '#ef4444' },
});

export default function AjustesScreen() {
  return (
    <TabErrorBoundary tabName="Ajustes">
      <AjustesScreenInner />
    </TabErrorBoundary>
  );
}
