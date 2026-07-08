/**
 * EGChat — Tienda de Mini-Apps (diseño premium v3 — iconos SVG, sin fondos)
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Line, Path, Circle } from 'react-native-svg';
import { MINI_APPS, CATEGORIES, type MiniAppCategory, searchMiniApps, type MiniApp } from '../src/miniapps/miniAppsStore';
import { MiniAppIcon } from '../src/miniapps/MiniAppIcon';

export default function MiniAppsScreen() {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState<MiniAppCategory | 'all'>('all');

  const filtered = useMemo(() => {
    let apps = search.trim() ? searchMiniApps(search) : MINI_APPS;
    if (category !== 'all') apps = apps.filter(a => a.category === category);
    return apps;
  }, [search, category]);

  const featured = MINI_APPS.filter(a => a.verified).slice(0, 3);

  const openApp = (app: MiniApp) => {
    router.push({ pathname: '/mini-app-player', params: { url: app.url, title: app.name, appId: app.id } } as any);
  };

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <LinearGradient colors={['#0f172a', '#1e3a5f']} style={s.header}>
        <SafeAreaView edges={['top']}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={s.iconBtn}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
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
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={2} strokeLinecap="round">
                <Circle cx="11" cy="11" r="8"/><Path d="M21 21l-4.35-4.35"/>
              </Svg>
              <TextInput
                style={s.searchInput}
                placeholder="Buscar aplicación..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={s.scroll}>
        {/* ── Destacadas ── */}
        {!search && category === 'all' && (
          <View style={s.sect}>
            <Text style={s.sectTitle}>Destacadas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.featRow}>
              {featured.map(app => (
                <TouchableOpacity key={app.id} style={s.featCard} onPress={() => openApp(app)} activeOpacity={0.85}>
                  {/* Icono grande sin fondo */}
                  <View style={[s.featIconWrap, { borderColor: 'rgba(0,0,0,0.07)' }]}>
                    <MiniAppIcon name={app.icon} color={app.accentColor} size={36} />
                  </View>
                  <Text style={s.featName}>{app.name}</Text>
                  <Text style={s.featDesc} numberOfLines={2}>{app.description}</Text>
                  {app.verified && (
                    <View style={s.featVerified}>
                      <Text style={[s.featVerifiedText, { color: app.accentColor }]}>✓ Verificada</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Categorías ── */}
        <View style={s.sect}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catRow}>
            {[{ id: 'all', label: 'Todo', emoji: '⬡' }, ...Object.entries(CATEGORIES).map(([id, c]) => ({ id, label: c.label, emoji: c.emoji }))].map(cat => (
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

        {/* ── Lista de apps ── */}
        <View style={s.sect}>
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth={1.2} strokeLinecap="round">
                <Circle cx="11" cy="11" r="8"/><Path d="M21 21l-4.35-4.35"/>
              </Svg>
              <Text style={s.emptyText}>Sin resultados para "{search}"</Text>
            </View>
          ) : (
            filtered.map(app => (
              <TouchableOpacity key={app.id} style={s.row} onPress={() => openApp(app)} activeOpacity={0.82}>
                {/* Icono SVG limpio sin fondo */}
                <View style={[s.rowIcon, { borderColor: app.accentColor + '25' }]}>
                  <MiniAppIcon name={app.icon} color={app.accentColor} size={26} />
                </View>

                {/* Info */}
                <View style={s.rowInfo}>
                  <View style={s.rowTitleRow}>
                    <Text style={s.rowName}>{app.name}</Text>
                    {app.verified && (
                      <View style={s.badge}>
                        <Text style={[s.badgeText, { color: app.accentColor }]}>✓ Verificada</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.rowDesc} numberOfLines={1}>{app.description}</Text>
                  <Text style={s.rowDev}>{app.developer}</Text>
                </View>

                {/* Botón */}
                <TouchableOpacity style={[s.openBtn, { borderColor: app.accentColor + '50' }]} onPress={() => openApp(app)}>
                  <Text style={[s.openBtnText, { color: app.accentColor }]}>Abrir</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },

  // Header
  header: { paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  searchRow: { paddingHorizontal: 16, marginTop: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },

  // Sección
  sect: { paddingHorizontal: 16, marginTop: 20 },
  sectTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },

  // Destacadas
  featRow: { marginHorizontal: -16 },
  featCard: {
    width: 150, marginLeft: 16, padding: 16,
    backgroundColor: '#fff', borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    gap: 6,
  },
  featIconWrap: {
    width: 60, height: 60, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  featName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  featDesc: { fontSize: 11, color: '#94a3b8', lineHeight: 15 },
  featVerified: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, marginTop: 4,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
  },
  featVerifiedText: { fontSize: 10, fontWeight: '700' },

  // Categorías
  catRow: { marginHorizontal: -16 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8, marginLeft: 8,
    borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  catChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  catText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  catTextActive: { color: '#fff' },

  // Filas de apps
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  rowIcon: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
  rowInfo: { flex: 1, gap: 3 },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  rowDesc: { fontSize: 12, color: '#94a3b8' },
  rowDev: { fontSize: 11, color: '#cbd5e1', fontWeight: '500' },
  openBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5, flexShrink: 0,
  },
  openBtnText: { fontSize: 13, fontWeight: '700' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
});
