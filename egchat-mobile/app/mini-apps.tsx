/**
 * EGChat — Tienda de Mini-Apps
 * Diseño mosaico limpio, mismo lenguaje visual que Servicios.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Line, Path, Circle } from 'react-native-svg';
import {
  MINI_APPS, CATEGORIES, addRecentApp,
  type MiniAppCategory, searchMiniApps, type MiniApp,
} from '../src/miniapps/miniAppsStore';
import { MiniAppIcon } from '../src/miniapps/MiniAppIcon';

const NATIVE_MINI_APP_ROUTES: Record<string, any> = {
  djangue:      '/mi-djangue',
  mitaxi:       '/mitaxi',
  cemac:        '/cemac',
  supermercado: { pathname: '/(tabs)/servicios', params: { service: 'supermercado' } },
  servicios_gov:'/(tabs)/servicios',
  seguros:      '/seguros-salud',
  apuestas:     '/apuestas',
  ocio:         '/ocio',
  barcos:       '/barcos',
};

export default function MiniAppsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState<MiniAppCategory | 'all'>('all');

  const filtered = useMemo(() => {
    let apps = search.trim() ? searchMiniApps(search) : MINI_APPS;
    if (category !== 'all') apps = apps.filter(a => a.category === category);
    return apps;
  }, [search, category]);

  const openApp = (app: MiniApp) => {
    void addRecentApp(app.id);
    const nativeRoute = NATIVE_MINI_APP_ROUTES[app.id];
    if (nativeRoute) {
      router.push(nativeRoute);
      return;
    }
    router.push({ pathname: '/mini-app-player', params: { url: app.url, title: app.name, appId: app.id } } as any);
  };

  // Agrupar apps filtradas por categoría para el mosaico
  const grouped = useMemo(() => {
    if (search.trim() || category !== 'all') {
      return [{ title: '', apps: filtered }];
    }
    const cats: { title: string; apps: MiniApp[] }[] = [];
    Object.entries(CATEGORIES).forEach(([catId, catInfo]) => {
      const catApps = MINI_APPS.filter(a => a.category === catId);
      if (catApps.length > 0) {
        cats.push({ title: catInfo.label, apps: catApps });
      }
    });
    return cats;
  }, [filtered, search, category]);

  return (
    <SafeAreaView style={s.root} edges={['left', 'right']}>

      {/* ── Header ── */}
      <LinearGradient
        colors={['#00C8A0', '#00B4E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[s.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={s.iconBtn}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="19" y1="12" x2="5" y2="12"/>
              <Path d="M12 19l-7-7 7-7"/>
            </Svg>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.headerTitle}>Mini-Apps</Text>
            <Text style={s.headerSub}>{MINI_APPS.length} aplicaciones · EGChat</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Búsqueda */}
        <View style={s.searchRow}>
          <View style={s.searchBar}>
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.6)" strokeWidth={2} strokeLinecap="round">
              <Circle cx="11" cy="11" r="8"/>
              <Path d="M21 21l-4.35-4.35"/>
            </Svg>
            <TextInput
              style={s.searchInput}
              placeholder="Buscar aplicación..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.6)" strokeWidth={2.5} strokeLinecap="round">
                  <Line x1="18" y1="6" x2="6" y2="18"/>
                  <Line x1="6" y1="6" x2="18" y2="18"/>
                </Svg>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* ── Chips de categoría ── */}
        <View style={s.catSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: 'all', label: 'Todo' },
              ...Object.entries(CATEGORIES).map(([id, c]) => ({ id, label: c.label })),
            ].map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[s.catChip, category === cat.id && s.catChipActive]}
                onPress={() => setCategory(cat.id as any)}
              >
                <Text style={[s.catText, category === cat.id && s.catTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Mosaico de apps agrupado por categoría ── */}
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none"
              stroke="#cbd5e1" strokeWidth={1.2} strokeLinecap="round">
              <Circle cx="11" cy="11" r="8"/>
              <Path d="M21 21l-4.35-4.35"/>
            </Svg>
            <Text style={s.emptyText}>Sin resultados para "{search}"</Text>
          </View>
        ) : (
          grouped.map((group, gi) => (
            <View key={gi} style={s.groupWrapper}>
              {/* Encabezado de sección */}
              {!!group.title && (
                <View style={s.groupHeader}>
                  <Text style={s.groupTitle}>{group.title.toUpperCase()}</Text>
                </View>
              )}

              {/* Grid de iconos */}
              <View style={s.sectionCard}>
                <View style={s.grid}>
                  {group.apps.map(app => (
                    <TouchableOpacity
                      key={app.id}
                      style={s.gridItem}
                      onPress={() => openApp(app)}
                      activeOpacity={0.55}
                    >
                      {/* Icono */}
                      <View style={[s.iconBox, { backgroundColor: app.accentColor + '18' }]}>
                        <MiniAppIcon name={app.icon} color={app.accentColor} size={24} />
                        {app.verified && <View style={[s.verifiedDot, { backgroundColor: app.accentColor }]} />}
                      </View>
                      {/* Etiqueta */}
                      <Text style={s.gridLabel} numberOfLines={2}>{app.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.groupSpacer} />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F0F2F5' },
  scroll: { flex: 1 },

  // ── Header ──────────────────────────────────────────────────────
  header:     { paddingBottom: 18 },
  headerRow:  {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  iconBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  searchRow: { paddingHorizontal: 16, marginTop: 8 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },

  // ── Categorías ──────────────────────────────────────────────────
  catSection: { paddingVertical: 10, paddingLeft: 8 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 7, marginRight: 8,
    borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  catChipActive: { backgroundColor: '#00C8A0', borderColor: '#00C8A0' },
  catText:       { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  catTextActive: { color: '#fff' },

  // ── Grupos / secciones ──────────────────────────────────────────
  groupWrapper: {},
  groupHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 2 },
  groupTitle:  { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8 },
  sectionCard: { backgroundColor: '#fff', paddingHorizontal: 4, paddingVertical: 4 },
  groupSpacer: { height: 6, backgroundColor: '#F0F2F5' },

  // ── Mosaico 4 columnas ──────────────────────────────────────────
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 5,
  },
  iconBox: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  verifiedDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 8, height: 8, borderRadius: 4,
    borderWidth: 1.5, borderColor: '#fff',
  },
  gridLabel: {
    fontSize: 10, fontWeight: '600',
    color: '#111827', textAlign: 'center',
    lineHeight: 13, maxWidth: 64,
  },

  // ── Empty ───────────────────────────────────────────────────────
  empty:     { alignItems: 'center', paddingVertical: 56, gap: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
});
