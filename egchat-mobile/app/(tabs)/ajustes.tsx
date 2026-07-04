// EGCHAT — Hub de Configuración (paridad con ConfiguracionView web v2.5.5)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import { authAPI } from '../../src/api';
import { mergePersistentAvatar } from '../../src/utils/profileEvents';
import { AccountSwitcher } from '../../src/components/AccountSwitcher';
import { NotificationsPanel, HamburgerMenu, WeatherModal, AppNotification } from '../../src/components/HeaderPanels';
import { EGChatHeader } from '../../src/components/EGChatHeader';
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

export default function AjustesScreen() {
  const [user, setUser] = useState<{ id?: string; full_name?: string; phone?: string; email?: string; avatar_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [storageUsed] = useState(() => Math.round(Math.random() * 200 + 50));
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;

  useEffect(() => {
    authAPI.me()
      .then(data => mergePersistentAvatar(data))
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return ALL_ROWS.filter(r => r.label.toLowerCase().includes(q));
  }, [search]);

  const logout = useCallback(() => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          try { await authAPI.logout(); } catch {}
          // En web forzamos recarga completa para limpiar todo el estado
          if (typeof window !== 'undefined' && window.location) {
            window.location.href = '/';
          } else {
            router.replace('/(auth)/login');
          }
        },
      },
    ]);
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
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0d1117' : '#f2f2f7' }]} edges={['bottom', 'left', 'right']}>
      <EGChatHeader
        temp={24}
        city="Malabo"
        weatherCondition="cloudy"
        unreadCount={notifications.filter(n => !n.read).length}
        notificationsOpen={showNotifications}
        menuOpen={showMenu}
        onWeatherPress={() => setShowWeather(true)}
        onNotificationsPress={() => {
          setShowNotifications(true);
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
          onPress={() => router.push('/(tabs)/index' as any)}
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
                  {user?.phone || ''}{user?.email ? ` · ${user.email}` : ''}
                </Text>
              </View>
              <Text style={{ color: '#c7c7cc', fontSize: 18 }}>›</Text>
            </TouchableOpacity>

            {/* Botón cambiar cuenta */}
            <TouchableOpacity
              style={[styles.switchAccountBtn, { borderColor: C.borderLight }]}
              onPress={() => setShowAccountSwitcher(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.switchAccountText, { color: C.textSecondary }]}>
                👤 Cambiar cuenta
              </Text>
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
              <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Próximamente', 'Cambiar de cuenta estará disponible pronto.')}>
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
        onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        onClearAll={() => setNotifications([])}
        onNotifPress={() => setShowNotifications(false)}
      />
      <HamburgerMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        user={user ? { full_name: user.full_name || '', avatar_url: user.avatar_url, phone: user.phone } : null}
      />
      <WeatherModal visible={showWeather} onClose={() => setShowWeather(false)} temp="26°" city="Malabo" condition="cloudy" />
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
    flexDirection: 'row', justifyContent: 'center',
    paddingVertical: 10, marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  switchAccountText: { fontSize: 14, fontWeight: '600' },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 17, fontWeight: '600' },
  heroSub: { fontSize: 13, marginTop: 2 },
  actionBtn: { paddingVertical: 15, alignItems: 'center' },
  actionGreen: { fontSize: 16, fontWeight: '500', color: '#07c160' },
  actionRed: { fontSize: 16, fontWeight: '500', color: '#ef4444' },
});
