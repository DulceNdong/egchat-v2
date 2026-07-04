/**
 * EGChat — Tienda de Mini-Apps (diseño premium v2)
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  TextInput, ScrollView, ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Line, Path, Circle } from 'react-native-svg';
import { MINI_APPS, CATEGORIES, type MiniAppCategory, searchMiniApps, type MiniApp } from '../src/miniapps/miniAppsStore';

export default function MiniAppsScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MiniAppCategory | 'all'>('all');

  const filtered = useMemo(() => {
    let apps = search.trim() ? searchMiniApps(search) : MINI_APPS;
    if (category !== 'all') apps = apps.filter(a => a.category === category);
    return apps;
  }, [search, category]);

  const featured = MINI_APPS.filter(a => a.verified).slice(0, 3);

  const openApp = (app: MiniApp) => {
    router.push({
      pathname: '/mini-app-player',
      params: { url: app.url, title: app.name, appId: app.id },
    } as any);
  };

  return (
    <View style={s.root}>
      {/* Header con gradiente */}
      <LinearGradient colors={['#0f172a', '#1e293b', '#0f3460']} style={s.header}>
        <SafeAreaView edges={['top']}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                <Line x1="19" y1="12" x2="5" y2="12"/>
                <Path d="M12 19l-7-7 7-7"/>
              </Svg>
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>Mini-Apps</Text>
              <Text style={s.headerSub}>{MINI_APPS.length} aplicaciones disponibles</Text>
            </View>
            <TouchableOpacity hitSlop={12}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} strokeLinecap="round">
                <Circle cx="11" cy="11" r="8"/>
                <Path d="M21 21l-4.35-4.35"/>
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Barra de búsqueda */}
          <View style={s.searchWrap}>
            <View style={s.searchBar}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2} strokeLinecap="round">
                <Circle cx="11" cy="11" r="8"/><Path d="M21 21l-4.35-4.35"/>
              </Svg>
              <TextInput
                style={s.searchInput}
                placeholder="Buscar mini-app..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Destacadas */}
        {!search && category === 'all' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>⭐ Destacadas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.featuredScroll}>
              {featured.map(app => (
                <TouchableOpacity key={app.id} style={s.featuredCard} onPress={() => openApp(app)} activeOpacity={0.88}>
                  <LinearGradient
                    colors={[app.color + 'ff', app.color + '99']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={s.featuredGrad}
                  >
                    <Text style={s.featuredIcon}>{app.icon}</Text>
                    <View style={s.featuredBadge}><Text style={s.featuredBadgeText}>✓ Verificada</Text></View>
                  </LinearGradient>
                  <View style={s.featuredInfo}>
                    <Text style={s.featuredName}>{app.name}</Text>
                    <Text style={s.featuredDesc} numberOfLines={1}>{app.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Filtros por categoría */}
        <View style={s.section}>
          {!search && <Text style={s.sectionTitle}>📂 Categorías</Text>}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catsScroll}>
            <TouchableOpacity style={[s.cat, category === 'all' && s.catActive]} onPress={() => setCategory('all')}>
              <Text style={s.catEmoji}>🌐</Text>
              <Text style={[s.catLabel, category === 'all' && s.catLabelActive]}>Todo</Text>
            </TouchableOpacity>
            {Object.entries(CATEGORIES).map(([id, cat]) => (
              <TouchableOpacity key={id} style={[s.cat, category === id && s.catActive]} onPress={() => setCategory(id as MiniAppCategory)}>
                <Text style={s.catEmoji}>{cat.emoji}</Text>
                <Text style={[s.catLabel, category === id && s.catLabelActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Grid de apps */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>
            {search ? `Resultados para "${search}"` : category === 'all' ? '🔥 Todas las apps' : `${CATEGORIES[category as MiniAppCategory]?.emoji} ${CATEGORIES[category as MiniAppCategory]?.label}`}
          </Text>
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🔍</Text>
              <Text style={s.emptyText}>No se encontraron mini-apps</Text>
            </View>
          ) : (
            <View style={s.grid}>
              {filtered.map(app => (
                <TouchableOpacity key={app.id} style={s.card} onPress={() => openApp(app)} activeOpacity={0.85}>
                  {/* Cabecera de la card con gradiente */}
                  <LinearGradient
                    colors={[app.color + 'aa', app.color + '44']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={s.cardHeader}
                  >
                    <Text style={s.cardIcon}>{app.icon}</Text>
                    {app.verified && (
                      <View style={s.verifiedBadge}>
                        <Text style={s.verifiedText}>✓</Text>
                      </View>
                    )}
                  </LinearGradient>
                  {/* Info */}
                  <View style={s.cardBody}>
                    <Text style={s.cardName} numberOfLines={1}>{app.name}</Text>
                    <Text style={s.cardDesc} numberOfLines={2}>{app.description}</Text>
                    <View style={s.cardFooter}>
                      <Text style={s.devName}>{app.developer}</Text>
                      <LinearGradient colors={['#00c8a0', '#00b4e6']} style={s.openBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Text style={s.openBtnText}>Abrir</Text>
                      </LinearGradient>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Espacio inferior */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },

  // Header
  header: { paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },

  // Búsqueda
  searchWrap: { paddingHorizontal: 20, marginTop: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },

  // Secciones
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },

  // Destacadas
  featuredScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  featuredCard: { width: 160, marginRight: 12 },
  featuredGrad: {
    height: 100, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8, position: 'relative',
  },
  featuredIcon: { fontSize: 40 },
  featuredBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  featuredBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  featuredInfo: { paddingHorizontal: 2 },
  featuredName: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  featuredDesc: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  // Categorías
  catsScroll: { marginHorizontal: -20 },
  cat: {
    alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10,
    marginRight: 8, borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    minWidth: 70,
  },
  catActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  catEmoji: { fontSize: 18 },
  catLabel: { fontSize: 10, fontWeight: '600', color: '#64748b' },
  catLabelActive: { color: '#fff' },

  // Grid de apps
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47.5%', backgroundColor: '#fff', borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  cardHeader: { height: 90, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cardIcon: { fontSize: 38 },
  verifiedBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#00c8a0', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  verifiedText: { fontSize: 10, color: '#fff', fontWeight: '900' },
  cardBody: { padding: 12, gap: 4 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  cardDesc: { fontSize: 11, color: '#94a3b8', lineHeight: 15, minHeight: 30 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  devName: { fontSize: 10, color: '#cbd5e1', fontWeight: '500' },
  openBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  openBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
});
