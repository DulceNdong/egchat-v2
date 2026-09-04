/**
 * EGChat — Panel de stickers completo
 *
 * Pestañas:
 *  ⭐ Favoritos — stickers marcados con long-press
 *  🕐 Recientes — últimos 24 enviados
 *  [pack] — cada paquete instalado
 *  🏪 Tienda — catálogo descargable
 *  🎞️ GIF — búsqueda en Tenor (real)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, FlatList,
  StyleSheet, TextInput, ActivityIndicator,
  ScrollView, Alert, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  getInstalledPacks, fetchPackCatalog, installPack, uninstallPack,
  getFavoriteStickers, getRecentStickers, toggleFavoriteSticker,
  addRecentSticker, searchGifs, getTrendingGifs,
  addCustomSticker, getCustomStickers,
  BUILTIN_PACKS,
  type Sticker, type StickerPack, type CustomSticker,
} from '../../services/stickers';

const ACCENT = '#00c8a0';

// ── Sub-componentes ───────────────────────────────────────────────

const StickerItem = React.memo(({
  sticker, onSelect, onLongPress,
}: {
  sticker: Sticker;
  onSelect: (s: Sticker) => void;
  onLongPress?: (s: Sticker) => void;
}) => (
  <TouchableOpacity
    style={sp.stickerBtn}
    onPress={() => onSelect(sticker)}
    onLongPress={() => onLongPress?.(sticker)}
    activeOpacity={0.7}
    delayLongPress={500}
  >
    <Image source={{ uri: sticker.url }} style={sp.sticker} resizeMode="contain" />
  </TouchableOpacity>
));

const EmptyState = ({ text }: { text: string }) => (
  <Text style={sp.empty}>{text}</Text>
);

// ── Tienda de paquetes ────────────────────────────────────────────

function StoreTab({
  onInstall, installedIds,
}: {
  onInstall: (pack: StickerPack) => void;
  installedIds: string[];
}) {
  const [catalog, setCatalog] = useState<StickerPack[]>([]);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    fetchPackCatalog().then(packs => {
      setCatalog(packs.filter(p => !p.isBuiltIn));
      setLoading(false);
    });
  }, []);

  if (loading) return <ActivityIndicator color={ACCENT} style={{ marginVertical: 24 }} />;

  return (
    <ScrollView contentContainerStyle={sp.storeList}>
      {catalog.length === 0 && <EmptyState text="No hay paquetes disponibles" />}
      {catalog.map(pack => {
        const isInstalled = installedIds.includes(pack.id);
        return (
          <View key={pack.id} style={sp.packRow}>
            <Image source={{ uri: pack.coverUrl }} style={sp.packCover} />
            <View style={sp.packInfo}>
              <Text style={sp.packName}>{pack.name}</Text>
              <Text style={sp.packAuthor}>{pack.author} · {pack.downloadCount || 0} instalaciones</Text>
            </View>
            <TouchableOpacity
              style={[sp.packBtn, isInstalled && sp.packBtnInstalled]}
              onPress={() => !isInstalled && onInstall(pack)}
            >
              <Text style={[sp.packBtnTxt, isInstalled && sp.packBtnTxtInstalled]}>
                {isInstalled ? 'Instalado' : 'Instalar'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ── Panel principal ───────────────────────────────────────────────

interface Props {
  onSelect: (stickerUrl: string) => void;
  onClose: () => void;
}

export function StickerPanel({ onSelect, onClose }: Props) {
  const [activeTab, setActiveTab]     = useState('recent');
  const [installedPacks, setInstalledPacks] = useState<StickerPack[]>(BUILTIN_PACKS);
  const [installedIds, setInstalledIds]     = useState<string[]>(BUILTIN_PACKS.map(p => p.id));
  const [favorites, setFavorites]     = useState<Sticker[]>([]);
  const [recents, setRecents]         = useState<Sticker[]>([]);
  const [customStickers, setCustomStickers] = useState<CustomSticker[]>([]);
  const [gifQuery, setGifQuery]       = useState('');
  const [gifResults, setGifResults]   = useState<Sticker[]>([]);
  const [gifLoading, setGifLoading]   = useState(false);
  const [trendingLoaded, setTrendingLoaded] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    const load = async () => {
      const [packs, favs, recs, customs] = await Promise.all([
        getInstalledPacks(),
        getFavoriteStickers(),
        getRecentStickers(),
        getCustomStickers(),
      ]);
      setInstalledPacks(packs);
      setInstalledIds(packs.map(p => p.id));
      setFavorites(favs);
      setRecents(recs);
      setCustomStickers(customs);
    };
    load();
  }, []);

  // Cargar trending GIFs al abrir pestaña GIF
  useEffect(() => {
    if (activeTab === 'gif' && !trendingLoaded) {
      setGifLoading(true);
      getTrendingGifs(20).then(gifs => {
        setGifResults(gifs);
        setTrendingLoaded(true);
        setGifLoading(false);
      });
    }
  }, [activeTab, trendingLoaded]);

  const handleSelect = useCallback(async (sticker: Sticker) => {
    onSelect(sticker.url);
    await addRecentSticker(sticker);
    setRecents(prev => [sticker, ...prev.filter(r => r.id !== sticker.id)].slice(0, 24));
    onClose();
  }, [onSelect, onClose]);

  const handleLongPress = useCallback(async (sticker: Sticker) => {
    const added = await toggleFavoriteSticker(sticker);
    setFavorites(await getFavoriteStickers());
    // Feedback visual sutil
  }, []);

  const handleInstallPack = useCallback(async (pack: StickerPack) => {
    await installPack(pack);
    const packs = await getInstalledPacks();
    setInstalledPacks(packs);
    setInstalledIds(packs.map(p => p.id));
    // Saltar al nuevo paquete
    setActiveTab(pack.id);
  }, []);

  const handleGifSearch = useCallback(async () => {
    if (!gifQuery.trim()) return;
    setGifLoading(true);
    const results = await searchGifs(gifQuery, 20);
    setGifResults(results);
    setGifLoading(false);
  }, [gifQuery]);

  const handleAddCustom = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para crear stickers.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const custom = await addCustomSticker(result.assets[0].uri);
      if (custom) setCustomStickers(prev => [custom, ...prev]);
    }
  }, []);

  // Construir tabs dinámicamente
  const tabs = [
    { id: 'recent',  label: '🕐' },
    { id: 'favs',    label: '⭐' },
    ...installedPacks.map(p => ({ id: p.id, label: p.name.slice(0, 6) })),
    { id: 'custom',  label: '📷' },
    { id: 'store',   label: '🏪' },
    { id: 'gif',     label: 'GIF' },
  ];

  // Contenido de la pestaña activa
  const renderContent = () => {
    if (activeTab === 'store') {
      return (
        <StoreTab
          onInstall={handleInstallPack}
          installedIds={installedIds}
        />
      );
    }

    if (activeTab === 'gif') {
      return (
        <View style={{ flex: 1 }}>
          <View style={sp.gifSearch}>
            <TextInput
              style={sp.gifInput}
              placeholder="Buscar GIF..."
              placeholderTextColor="#9ca3af"
              value={gifQuery}
              onChangeText={setGifQuery}
              onSubmitEditing={handleGifSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleGifSearch} style={sp.gifBtn} disabled={gifLoading}>
              {gifLoading
                ? <ActivityIndicator size="small" color={ACCENT} />
                : <Text style={sp.gifBtnTxt}>🔍</Text>
              }
            </TouchableOpacity>
          </View>
          {gifLoading && gifResults.length === 0
            ? <ActivityIndicator color={ACCENT} style={{ marginVertical: 24 }} />
            : <FlatList
                data={gifResults}
                numColumns={3}
                keyExtractor={item => item.id}
                contentContainerStyle={sp.grid}
                renderItem={({ item }) => (
                  <StickerItem
                    sticker={item}
                    onSelect={handleSelect}
                    onLongPress={handleLongPress}
                  />
                )}
                ListEmptyComponent={<EmptyState text="Sin resultados — prueba otra búsqueda" />}
              />
          }
        </View>
      );
    }

    if (activeTab === 'favs') {
      return (
        <FlatList
          data={favorites}
          numColumns={4}
          keyExtractor={item => item.id}
          contentContainerStyle={sp.grid}
          renderItem={({ item }) => (
            <StickerItem sticker={item} onSelect={handleSelect} onLongPress={handleLongPress} />
          )}
          ListEmptyComponent={<EmptyState text="Mantén presionado un sticker para marcarlo como favorito" />}
        />
      );
    }

    if (activeTab === 'recent') {
      return (
        <FlatList
          data={recents}
          numColumns={4}
          keyExtractor={item => item.id}
          contentContainerStyle={sp.grid}
          renderItem={({ item }) => (
            <StickerItem sticker={item} onSelect={handleSelect} onLongPress={handleLongPress} />
          )}
          ListEmptyComponent={<EmptyState text="Los stickers que envíes aparecerán aquí" />}
        />
      );
    }

    if (activeTab === 'custom') {
      return (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={sp.addCustomBtn} onPress={handleAddCustom}>
            <Text style={sp.addCustomTxt}>+ Crear sticker desde foto</Text>
          </TouchableOpacity>
          <FlatList
            data={customStickers}
            numColumns={4}
            keyExtractor={item => item.id}
            contentContainerStyle={sp.grid}
            renderItem={({ item }) => (
              <StickerItem
                sticker={{ id: item.id, url: item.uri }}
                onSelect={handleSelect}
              />
            )}
            ListEmptyComponent={<EmptyState text="Toca el botón para crear tu primer sticker" />}
          />
        </View>
      );
    }

    // Paquete instalado
    const pack = installedPacks.find(p => p.id === activeTab);
    if (!pack) return <EmptyState text="Paquete no encontrado" />;

    return (
      <FlatList
        data={pack.stickers}
        numColumns={4}
        keyExtractor={item => item.id}
        contentContainerStyle={sp.grid}
        renderItem={({ item }) => (
          <StickerItem sticker={item} onSelect={handleSelect} onLongPress={handleLongPress} />
        )}
        ListEmptyComponent={<EmptyState text="Este paquete no tiene stickers" />}
      />
    );
  };

  return (
    <View style={sp.container}>
      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={sp.tabsBar}
        contentContainerStyle={sp.tabsContent}
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[sp.tab, activeTab === tab.id && sp.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[sp.tabText, activeTab === tab.id && sp.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Contenido */}
      <View style={sp.content}>
        {renderContent()}
      </View>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────
const sp = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
    height: 300,
  },
  tabsBar: { flexShrink: 0, maxHeight: 44 },
  tabsContent: { paddingHorizontal: 8, paddingVertical: 6, gap: 6 },
  tab: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 14, backgroundColor: '#f3f4f6',
  },
  tabActive: { backgroundColor: ACCENT },
  tabText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  content: { flex: 1 },

  // Grid stickers
  grid: { paddingHorizontal: 6, paddingBottom: 8 },
  stickerBtn: {
    width: '25%', aspectRatio: 1,
    padding: 3, alignItems: 'center', justifyContent: 'center',
  },
  sticker: { width: '100%', height: '100%', borderRadius: 8 },
  empty: {
    textAlign: 'center', color: '#9ca3af',
    fontSize: 12, paddingVertical: 24,
    paddingHorizontal: 20, lineHeight: 18,
  },

  // GIF search
  gifSearch: {
    flexDirection: 'row', marginHorizontal: 10, marginVertical: 6,
    backgroundColor: '#f3f4f6', borderRadius: 18,
    paddingHorizontal: 12, alignItems: 'center', gap: 6,
  },
  gifInput: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 8 },
  gifBtn: { padding: 4 },
  gifBtnTxt: { fontSize: 16 },

  // Tienda
  storeList: { paddingHorizontal: 12, paddingVertical: 8, gap: 10 },
  packRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f9fafb', borderRadius: 12,
    padding: 10, gap: 10,
  },
  packCover: { width: 48, height: 48, borderRadius: 10 },
  packInfo: { flex: 1 },
  packName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  packAuthor: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  packBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, backgroundColor: ACCENT,
  },
  packBtnInstalled: { backgroundColor: '#f3f4f6' },
  packBtnTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  packBtnTxtInstalled: { color: '#9ca3af' },

  // Custom
  addCustomBtn: {
    margin: 10, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5,
    borderStyle: 'dashed', borderColor: ACCENT,
    alignItems: 'center',
  },
  addCustomTxt: { fontSize: 13, fontWeight: '600', color: ACCENT },
});
