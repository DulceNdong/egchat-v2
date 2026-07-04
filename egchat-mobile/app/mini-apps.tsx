/**
 * EGChat — Tienda de Mini-Apps
 * Grid de apps disponibles con búsqueda y filtro por categoría.
 * Al tocar una app se abre el MiniAppRuntime con la URL correspondiente.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  TextInput, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Line, Path } from 'react-native-svg';
import { MINI_APPS, CATEGORIES, type MiniAppCategory, searchMiniApps } from '../src/miniapps/miniAppsStore';

export default function MiniAppsScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MiniAppCategory | 'all'>('all');

  const filtered = useMemo(() => {
    let apps = search.trim() ? searchMiniApps(search) : MINI_APPS;
    if (category !== 'all') apps = apps.filter(a => a.category === category);
    return apps;
  }, [search, category]);

  const openApp = (appId: string, appUrl: string, appName: string) => {
    router.push({
      pathname: '/mini-app-player',
      params: { url: appUrl, title: appName, appId },
    } as any);
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#00b4e6', '#0088cc']} style={s.header}>
        <SafeAreaView edges={['top']}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                <Line x1="19" y1="12" x2="5" y2="12"/>
                <Path d="M12 19l-7-7 7-7"/>
              </Svg>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Mini-Apps</Text>
            <View style={{ width: 28 }} />
          </View>
          {/* Barra de búsqueda */}
          <View style={s.searchBar}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Buscar mini-app..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Filtros por categoría */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={s.cats} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        <TouchableOpacity
          style={[s.cat, category === 'all' && s.catActive]}
          onPress={() => setCategory('all')}
        >
          <Text style={[s.catText, category === 'all' && s.catTextActive]}>🌐 Todo</Text>
        </TouchableOpacity>
        {Object.entries(CATEGORIES).map(([id, cat]) => (
          <TouchableOpacity
            key={id}
            style={[s.cat, category === id && s.catActive]}
            onPress={() => setCategory(id as MiniAppCategory)}
          >
            <Text style={[s.catText, category === id && s.catTextActive]}>
              {cat.emoji} {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid de mini-apps */}
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={item => item.id}
        contentContainerStyle={s.grid}
        columnWrapperStyle={{ gap: 12 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🔍</Text>
            <Text style={s.emptyText}>No se encontraron mini-apps</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => openApp(item.id, item.url, item.name)}
            activeOpacity={0.85}
          >
            <View style={[s.iconBox, { backgroundColor: item.color }]}>
              <Text style={s.icon}>{item.icon}</Text>
              {item.verified && <View style={s.verifiedBadge}><Text style={s.verifiedText}>✓</Text></View>}
            </View>
            <Text style={s.appName} numberOfLines={1}>{item.name}</Text>
            <Text style={s.appDesc} numberOfLines={2}>{item.description}</Text>
            <View style={s.openBtn}>
              <Text style={s.openBtnText}>Abrir</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  cats: { paddingVertical: 12, maxHeight: 56 },
  cat: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1.5, borderColor: '#e5e7eb' },
  catActive: { backgroundColor: '#00c8a0', borderColor: '#00c8a0' },
  catText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  catTextActive: { color: '#fff' },
  grid: { padding: 16, gap: 12 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  iconBox: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  icon: { fontSize: 28 },
  verifiedBadge: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#00c8a0', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  verifiedText: { fontSize: 9, color: '#fff', fontWeight: '900' },
  appName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  appDesc: { fontSize: 12, color: '#9ca3af', lineHeight: 16 },
  openBtn: { backgroundColor: '#f3f4f6', borderRadius: 8, paddingVertical: 6, alignItems: 'center', marginTop: 2 },
  openBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
});
