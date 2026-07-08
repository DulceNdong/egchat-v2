import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Modal, Pressable, Linking, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { authAPI } from '../../src/api';
import { NotificationsPanel, HamburgerMenu, WeatherModal, AppNotification } from '../../src/components/HeaderPanels';
import { EGChatHeader } from '../../src/components/EGChatHeader';
import { mergePersistentAvatar, onProfileUpdated } from '../../src/utils/profileEvents';
import { ServiceIcon } from '../../src/components/ServiceIcon';
import {
  RecargaModal, InternetModal, CanalesModal,
  BancosModal, SegurosModal, FacturasModal, InversionModal, TarjetasModal,
  ElectricidadModal, AguaModal, SaludModal, EducacionModal, CorreosModal, ImpuestosModal,
  SupermercadoModal, ComidaModal, RestaurantesModal, HotelModal, VuelosModal,
  GasolinerasModal, TiendaModal, LavanderiaModal, BellezaModal,
} from '../../src/components/services';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

// ── Secciones de servicios — iconos y colores idénticos a la web ──
const SERVICE_SECTIONS = [
  {
    id: 'basicos',
    title: 'Básicos',
    services: [
      { id: 'recarga',      svgIcon: 'recharge',      label: 'Recarga Tel.',  color: '#07C160' },
      { id: 'internet',     svgIcon: 'world',         label: 'Internet',      color: '#1485EE' },
      { id: 'tv',           svgIcon: 'services',      label: 'Canales',       color: '#8B5CF6' },
    ],
  },
  {
    id: 'financieros',
    title: 'Servicios Financieros',
    services: [
      { id: 'bancos',       svgIcon: 'banking',       label: 'Bancos',        color: '#1485EE' },
      { id: 'seguros',      svgIcon: 'seguros',       label: 'Seguros',       color: '#2E9E6B' },
      { id: 'facturas',     svgIcon: 'factura',       label: 'Facturas',      color: '#C47D2A' },
      { id: 'inversion',    svgIcon: 'invest',        label: 'Inversión',     color: '#6B5BD6' },
      { id: 'tarjetas',     svgIcon: 'tarjeta',       label: 'Tarjetas',      color: '#C0392B' },
      { id: 'historial',    svgIcon: 'historial',     label: 'Historial',     color: '#5A7090' },
    ],
  },
  {
    id: 'publicos',
    title: 'Servicios Públicos',
    services: [
      { id: 'electricidad', svgIcon: 'electricidad',  label: 'Electricidad',  color: '#C47D2A' },
      { id: 'agua',         svgIcon: 'rain',          label: 'Agua',          color: '#1485EE' },
      { id: 'salud',        svgIcon: 'salud',         label: 'Salud',         color: '#C0392B' },
      { id: 'educacion',    svgIcon: 'edu',           label: 'Educación',     color: '#6B5BD6' },
      { id: 'correos',      svgIcon: 'mensajes',      label: 'Correos',       color: '#C47D2A' },
      { id: 'impuestos',    svgIcon: 'gobierno',      label: 'Impuestos',     color: '#C0392B' },
    ],
  },
  {
    id: 'diarios',
    title: 'Servicios Diarios',
    services: [
      { id: 'mitaxi',       svgIcon: 'taxi',          label: 'MiTaxi',        color: '#F59E0B' },
      { id: 'supermercado', svgIcon: 'comercio',      label: 'Supermercado',  color: '#2E9E6B' },
      { id: 'comida',       svgIcon: 'money',         label: 'Comida',        color: '#C0392B' },
      { id: 'restaurantes', svgIcon: 'restaurante',   label: 'Restaurante',   color: '#C47D2A' },
      { id: 'hotel',        svgIcon: 'hotel',         label: 'Hotel',         color: '#1485EE' },
      { id: 'vuelos',       svgIcon: 'vuelos',        label: 'Vuelos',        color: '#6B5BD6' },
      { id: 'barcos',       svgIcon: 'barco',         label: 'Barcos',        color: '#0EA5E9' },
      { id: 'gasolineras',  svgIcon: 'gasolinera',    label: 'Gasolinera',    color: '#C47D2A' },
      { id: 'tienda',       svgIcon: 'tienda',        label: 'Tienda',        color: '#2E9E6B' },
      { id: 'lavanderia',   svgIcon: 'lavanderia',    label: 'Lavandería',    color: '#1485EE' },
      { id: 'belleza',      svgIcon: 'belleza',       label: 'Belleza',       color: '#C0392B' },
      { id: 'noticias',     svgIcon: 'noticias',      label: 'Noticias',      color: '#6B5BD6' },
    ],
  },
  {
    id: 'herramientas',
    title: 'Herramientas',
    services: [
      { id: 'id_digital',   svgIcon: 'id-card',       label: 'ID Digital',    color: '#6B5BD6' },
      { id: 'lia',          svgIcon: 'ai',            label: 'Lia-25',        color: '#1485EE' },
      { id: 'actividad',    svgIcon: 'historial',     label: 'Actividad',     color: '#0E7FA8' },
      { id: 'emergencias',  svgIcon: 'emergencia',    label: 'Emergencia',    color: '#C0392B' },
      { id: 'ajustes',      svgIcon: 'ajustes',       label: 'Ajustes',       color: '#5A7090' },
    ],
  },
];

// ── Modal genérico (bottom sheet) ─────────────────────────────────
const ServiceModal = ({
  visible, title, onClose, children,
}: {
  visible: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={() => {}}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
);

// ── Modal Noticias ────────────────────────────────────────────────
const NEWS_SOURCES = [
  { icon: '📰', name: 'La Gaceta de Guinea',   desc: 'Diario oficial y noticias nacionales', url: 'https://lagacetadeguinea.com' },
  { icon: '📡', name: 'TVGE Noticias',          desc: 'Televisión de Guinea Ecuatorial',      url: 'https://tvge.gq' },
  { icon: '🌍', name: 'Noticias CEMAC',         desc: 'Noticias de la región CEMAC',          url: 'https://cemac.int' },
  { icon: '📻', name: 'Radio Nacional GQ',      desc: 'Radio pública de Guinea Ecuatorial',   url: '' },
  { icon: '💼', name: 'Economía GQ',            desc: 'Noticias económicas y empresariales',  url: '' },
];

const NoticiasModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="📰 Noticias" onClose={onClose}>
    <Text style={styles.sectionLabel}>Fuentes de noticias</Text>
    {NEWS_SOURCES.map(n => (
      <TouchableOpacity key={n.name} style={styles.providerCard}
        onPress={() => n.url ? Linking.openURL(n.url) : Alert.alert(n.name, n.desc)}
        activeOpacity={0.7}>
        <Text style={styles.providerDotEmoji}>{n.icon}</Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{n.name}</Text>
          <Text style={styles.providerCat}>{n.desc}</Text>
        </View>
        <Text style={styles.providerArrow}>{n.url ? '🔗' : '›'}</Text>
      </TouchableOpacity>
    ))}
  </ServiceModal>
);

// ── Modal ID Digital ──────────────────────────────────────────────
const IdDigitalModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="🪪 ID Digital" onClose={onClose}>
    <View style={[styles.infoCard, { alignItems: 'center', marginBottom: Spacing.md }]}>
      <Text style={{ fontSize: 60, marginBottom: Spacing.md }}>🪪</Text>
      <Text style={[styles.infoCardTitle, { textAlign: 'center' }]}>Identidad Digital EGCHAT</Text>
      <Text style={[styles.providerCat, { textAlign: 'center', marginTop: Spacing.sm }]}>
        Tu identidad digital verificada en Guinea Ecuatorial
      </Text>
    </View>
    {[
      { icon: '✅', label: 'DNI verificado',        desc: 'Documento de identidad vinculado' },
      { icon: '📱', label: 'Número verificado',     desc: 'Teléfono confirmado por SMS' },
      { icon: '🔒', label: 'Cuenta segura',         desc: 'Autenticación de dos factores activa' },
      { icon: '🌍', label: 'Zona CEMAC',            desc: 'Válido en los 6 países CEMAC' },
    ].map(item => (
      <View key={item.label} style={styles.providerCard}>
        <Text style={styles.providerDotEmoji}>{item.icon}</Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{item.label}</Text>
          <Text style={styles.providerCat}>{item.desc}</Text>
        </View>
      </View>
    ))}
    <TouchableOpacity style={[styles.callBtn, { marginTop: Spacing.md }]}
      onPress={() => Alert.alert('ID Digital', 'Función de verificación de identidad próximamente disponible.')}>
      <Text style={styles.callBtnText}>🪪 Verificar mi identidad</Text>
    </TouchableOpacity>
  </ServiceModal>
);

// ── Modal Emergencias ─────────────────────────────────────────────
const EMERGENCY_NUMBERS = [
  { icon: '🚒', name: 'Bomberos',              number: '115',              color: '#EF4444' },
  { icon: '🚑', name: 'Ambulancia / SAMU',     number: '116',              color: '#DC2626' },
  { icon: '👮', name: 'Policía Nacional',       number: '114',              color: '#1E3A5F' },
  { icon: '🏥', name: 'Hospital General',       number: '+240 333 09 50 00', color: '#DC2626' },
  { icon: '⚡', name: 'Averías SEGESA',         number: '+240 333 09 70 00', color: '#EAB308' },
  { icon: '💧', name: 'Averías SNGE',           number: '+240 333 09 71 00', color: '#0EA5E9' },
  { icon: '🛡️', name: 'Guardia Civil',          number: '112',              color: '#374151' },
  { icon: '🌊', name: 'Protección Civil',       number: '+240 333 09 72 00', color: '#0369A1' },
];

const EmergenciasModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="⚠️ Emergencias" onClose={onClose}>
    <View style={{ backgroundColor: '#FEF2F2', borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: '#FECACA' }}>
      <Text style={{ fontSize: FontSize.sm, color: '#991B1B', textAlign: 'center', fontWeight: FontWeight.semibold }}>
        ⚠️ En caso de emergencia real, llama directamente al número correspondiente
      </Text>
    </View>
    <Text style={styles.sectionLabel}>Números de emergencia</Text>
    {EMERGENCY_NUMBERS.map(e => (
      <TouchableOpacity key={e.name} style={[styles.providerCard, { borderLeftWidth: 3, borderLeftColor: e.color }]}
        onPress={() => Alert.alert(e.name, `Número: ${e.number}`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: '📞 Llamar ahora', style: 'destructive', onPress: () => Linking.openURL(`tel:${e.number}`) },
        ])}
        activeOpacity={0.7}>
        <Text style={styles.providerDotEmoji}>{e.icon}</Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{e.name}</Text>
          <Text style={[styles.providerCat, { color: e.color, fontWeight: FontWeight.bold }]}>{e.number}</Text>
        </View>
        <Text style={styles.callIcon}>📞</Text>
      </TouchableOpacity>
    ))}
  </ServiceModal>
);

// ── Drawer lateral ────────────────────────────────────────────────
const DrawerMenu = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={drawerStyles.overlay} onPress={onClose}>
      <Pressable style={drawerStyles.drawer} onPress={() => {}}>
        <Text style={drawerStyles.title}>Menú</Text>
        {[
          { icon: '🤖', label: 'LIA-25 — IA Asistente',  action: () => { onClose(); router.push('/(tabs)/lia' as any); } },
          { icon: '🗺️', label: 'Mapa de Malabo',          action: () => { onClose(); router.push('/map' as any); } },
          { icon: '📲', label: 'Escanear QR',             action: () => { onClose(); router.push('/_qr-scanner' as any); } },
          { icon: '👥', label: 'Contactos',               action: () => { onClose(); router.push('/contacts' as any); } },
          { icon: '📖', label: 'Estados / Stories',       action: () => { onClose(); router.push('/stories' as any); } },
          { icon: '⚙️', label: 'Ajustes',                 action: () => { onClose(); router.push('/(tabs)/ajustes' as any); } },
        ].map(item => (
          <TouchableOpacity key={item.label} style={drawerStyles.item} onPress={item.action} activeOpacity={0.7}>
            <Text style={drawerStyles.itemIcon}>{item.icon}</Text>
            <Text style={drawerStyles.itemLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </Pressable>
    </Pressable>
  </Modal>
);

const drawerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', alignItems: 'flex-end' },
  drawer: {
    width: '75%', height: '100%',
    backgroundColor: Colors.bgSecondary,
    padding: Spacing.xl, paddingTop: 60, gap: Spacing.xs,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  itemIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  itemLabel: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
});

// ── Pantalla principal ────────────────────────────────────────────
export default function ServiciosScreen() {
  const params = useLocalSearchParams<{ service?: string }>();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const loadData = async () => {
    try {
      const me = await authAPI.me().catch(() => null);
      setUser(await mergePersistentAvatar(me));
    } catch {}
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    return onProfileUpdated(patch => {
      setUser((prev: any) => prev ? { ...prev, ...patch } : prev);
    });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Servicios que abren modal inline
  const MODAL_SERVICES = [
    'electricidad', 'agua', 'recarga', 'internet', 'tv',
    'bancos', 'seguros', 'facturas', 'inversion', 'tarjetas',
    'salud', 'educacion', 'impuestos', 'correos',
    'supermercado', 'comida', 'restaurantes', 'hotel', 'gasolineras', 'vuelos',
    'tienda', 'lavanderia', 'belleza', 'noticias',
    'id_digital', 'emergencias',
  ];

  const ROUTE_SERVICES: Record<string, string> = {
    mitaxi: '/mitaxi',
    taxi: '/mitaxi',
    cemac: '/cemac',
    ocio: '/ocio',
    apuestas: '/apuestas',
    lia: '/(tabs)/lia',
    barcos: '/barcos',
    ajustes: '/(tabs)/ajustes',
    historial: '/historial-completo',
    actividad: '/ajustes/actividad',
  };

  const openService = (id: string) => {
    if (MODAL_SERVICES.includes(id)) {
      setActiveModal(id);
      return;
    }
    const route = ROUTE_SERVICES[id];
    if (route) {
      router.push(route as any);
      return;
    }
    Alert.alert('Próximamente', 'Este servicio estará disponible pronto.');
  };

  useEffect(() => {
    const requested = Array.isArray(params.service) ? params.service[0] : params.service;
    if (!requested) return;
    if (MODAL_SERVICES.includes(requested)) {
      setActiveModal(requested);
      return;
    }
    const route = ROUTE_SERVICES[requested];
    if (route) router.push(route as any);
  }, [params.service]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0d1117' : '#F0F2F5' }]} edges={['bottom', 'left', 'right']}>
      <EGChatHeader
        temp={27}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C8A0" colors={['#00C8A0']} />}
      >
        {SERVICE_SECTIONS.map(section => (
          <View key={section.id} style={[styles.sectionWrapper, { backgroundColor: C.bgSecondary }]}>
            <View style={styles.sectionHeaderWeb}>
              <Text style={[styles.sectionTitleWeb, { color: C.textTertiary }]}>{section.title.toUpperCase()}</Text>
            </View>
            <View style={styles.sectionCardWeb}>
              <View style={styles.grid}>
                {section.services.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.serviceItem}
                    onPress={() => openService(s.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.serviceIconBox, {
                      backgroundColor: s.color + '14',
                      borderColor: s.color + '28',
                    }]}>
                      <ServiceIcon name={s.svgIcon} size={26} color={s.color} />
                    </View>
                    <Text style={[styles.serviceLabel, { color: C.textPrimary }]} numberOfLines={1}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={[styles.sectionSpacer, { backgroundColor: isDark ? '#0d1117' : '#F0F2F5' }]} />
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Drawer menú ── */}
      <DrawerMenu visible={showDrawer} onClose={() => setShowDrawer(false)} />

      {/* ── Paneles del header ── */}
      <NotificationsPanel
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        onClearAll={() => setNotifications([])}
        onNotifPress={(n) => {
          setNotifications(prev => prev.filter(x => x.id !== n.id));
          setShowNotifications(false);
          if (n.chatId) router.push(`/chat/${n.chatId}` as any);
        }}
      />
      <HamburgerMenu visible={showMenu} onClose={() => setShowMenu(false)} user={user} />
      <WeatherModal visible={showWeather} onClose={() => setShowWeather(false)} temp="27°" city="Malabo" condition="cloudy" />

      {/* ── Modales de servicios ── */}
      <ElectricidadModal  visible={activeModal === 'electricidad'}  onClose={() => setActiveModal(null)} />
      <AguaModal          visible={activeModal === 'agua'}          onClose={() => setActiveModal(null)} />
      <RecargaModal       visible={activeModal === 'recarga'}       onClose={() => setActiveModal(null)} />
      <InternetModal      visible={activeModal === 'internet'}      onClose={() => setActiveModal(null)} />
      <CanalesModal       visible={activeModal === 'tv'}            onClose={() => setActiveModal(null)} />
      <BancosModal        visible={activeModal === 'bancos'}        onClose={() => setActiveModal(null)} />
      <SegurosModal       visible={activeModal === 'seguros'}       onClose={() => setActiveModal(null)} />
      <FacturasModal      visible={activeModal === 'facturas'}      onClose={() => setActiveModal(null)} />
      <InversionModal     visible={activeModal === 'inversion'}     onClose={() => setActiveModal(null)} />
      <TarjetasModal      visible={activeModal === 'tarjetas'}      onClose={() => setActiveModal(null)} />
      <SaludModal         visible={activeModal === 'salud'}         onClose={() => setActiveModal(null)} />
      <EducacionModal     visible={activeModal === 'educacion'}     onClose={() => setActiveModal(null)} />
      <ImpuestosModal     visible={activeModal === 'impuestos'}     onClose={() => setActiveModal(null)} />
      <CorreosModal       visible={activeModal === 'correos'}       onClose={() => setActiveModal(null)} />
      <SupermercadoModal  visible={activeModal === 'supermercado'}  onClose={() => setActiveModal(null)} />
      <ComidaModal        visible={activeModal === 'comida'}        onClose={() => setActiveModal(null)} />
      <RestaurantesModal  visible={activeModal === 'restaurantes'}  onClose={() => setActiveModal(null)} />
      <HotelModal         visible={activeModal === 'hotel'}         onClose={() => setActiveModal(null)} />
      <VuelosModal        visible={activeModal === 'vuelos'}        onClose={() => setActiveModal(null)} />
      <GasolinerasModal   visible={activeModal === 'gasolineras'}   onClose={() => setActiveModal(null)} />
      <TiendaModal        visible={activeModal === 'tienda'}        onClose={() => setActiveModal(null)} />
      <LavanderiaModal    visible={activeModal === 'lavanderia'}    onClose={() => setActiveModal(null)} />
      <BellezaModal       visible={activeModal === 'belleza'}       onClose={() => setActiveModal(null)} />
      <NoticiasModal      visible={activeModal === 'noticias'}      onClose={() => setActiveModal(null)} />
      <IdDigitalModal     visible={activeModal === 'id_digital'}    onClose={() => setActiveModal(null)} />
      <EmergenciasModal   visible={activeModal === 'emergencias'}   onClose={() => setActiveModal(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding, paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoCircle: {
    width: 34, height: 34, borderRadius: 17,
    overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  headerLogo: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerLogoAccent: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weatherChip: {
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  weatherText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconText: { fontSize: 16, color: '#fff' },

  // Título de página
  pageHeader: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  pageTitle: {
    fontSize: 22, fontWeight: '800', color: Colors.textPrimary,
  },

  // Secciones (estilo web)
  sectionWrapper: {},
  sectionHeaderWeb: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2 },
  sectionTitleWeb: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8 },
  sectionCardWeb: { paddingHorizontal: 6, paddingVertical: 4 },
  sectionSpacer: { height: 10 },

  // Grid de servicios (4 columnas como la web)
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
  },
  serviceItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 6,
  },
  serviceIconBox: {
    width: 54, height: 54, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  serviceEmoji: { fontSize: 26 },
  serviceLabel: {
    fontSize: 11, fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14, maxWidth: 60,
  },

  // Modal bottom sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl, paddingBottom: Spacing['3xl'], maxHeight: '88%',
  },
  handle: {
    width: 36, height: 4, backgroundColor: Colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg,
  },
  sheetTitle: {
    ...Typography.headerTitle, color: Colors.textPrimary,
    marginBottom: Spacing.xl, textAlign: 'center',
  },

  // Etiquetas de sección dentro de modales
  sectionLabel: {
    ...Typography.fieldLabel, color: Colors.textTertiary,
    marginBottom: Spacing.sm, marginTop: Spacing.md,
  },

  // Taxi
  rideOption: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgTertiary, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border, gap: Spacing.md,
  },
  rideIconBox: { width: 44, height: 44, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  rideEmoji: { fontSize: 22 },
  rideInfo: { flex: 1 },
  rideLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  rideSub: { fontSize: FontSize.sm, color: Colors.textTertiary },
  ridePrice: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  actionBtn: { marginTop: Spacing.md },
  centerContent: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md },
  searchingText: { ...Typography.chatHeaderName, color: Colors.textPrimary },
  searchingSub: { ...Typography.subtitle, color: Colors.textSecondary },
  driverCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgTertiary, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.md,
  },
  driverAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  driverInitials: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  driverInfo: { flex: 1 },
  driverName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  driverSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  etaText: { fontSize: FontSize.base, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  fareText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.accent, textAlign: 'center', marginBottom: Spacing.md },

  // Facturas
  facturaCard: { marginTop: Spacing.lg, padding: Spacing.lg },
  facturaTitle: { ...Typography.chatHeaderName, color: Colors.textPrimary, marginBottom: Spacing.md },
  facturaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  facturaLabel: { fontSize: FontSize.base, color: Colors.textSecondary },
  facturaValue: { fontSize: FontSize.base, color: Colors.textPrimary },

  // Recarga
  operatorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  operatorChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.bgTertiary, borderWidth: 1, borderColor: Colors.border },
  operatorChipActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  operatorText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  operatorTextActive: { color: Colors.accent },
  amountRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  amountChip: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.bgTertiary, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  amountChipActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  amountText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  amountTextActive: { color: Colors.accent },

  // Proveedores / listas
  providerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgTertiary, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight },
  providerDot: { width: 12, height: 12, borderRadius: 6 },
  providerDotEmoji: { fontSize: 22, width: 28, textAlign: 'center' },
  providerInfo: { flex: 1 },
  providerName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  providerCat: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  providerArrow: { fontSize: 22, color: Colors.textTertiary },

  // Planes
  planCard: { backgroundColor: Colors.bgTertiary, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planText: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  planAction: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.bold },

  // Navegación dentro de modales
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  backText: { fontSize: FontSize.base, color: Colors.accent, fontWeight: FontWeight.semibold },

  // Info card
  infoCard: { backgroundColor: Colors.bgTertiary, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight },
  infoCardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  serviceRowDot: { fontSize: 8, color: Colors.accent },
  serviceRowText: { fontSize: FontSize.sm, color: Colors.textPrimary },

  // Botones de llamada
  callBtn: { backgroundColor: Colors.accentLight, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
  callBtnText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.semibold },
  callIcon: { fontSize: 22 },

  // Seguros / items con icono
  insuranceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, flex: 1 },
  insuranceIcon: { fontSize: 26, width: 32, textAlign: 'center' },
  insuranceInfo: { flex: 1 },

  // Supermercado categorías
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  categoryChip: { backgroundColor: Colors.bgTertiary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight },
  categoryText: { fontSize: FontSize.sm, color: Colors.textPrimary },
});
