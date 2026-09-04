// ══════════════════════════════════════════════════════════════════
// BusinessProfileScreen — Cuenta empresarial con catálogo
// Estilo WhatsApp Business: perfil, catálogo, respuestas rápidas
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Image, Modal, Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Line, Polyline, Circle, Rect, G } from 'react-native-svg';
import { router } from 'expo-router';
import { authAPI, getToken, getApiBase } from '../src/api';
import { toast } from '../src/components/Toast';
import { EGAvatar } from '../src/components/ui';
import { useThemeContext } from '../src/theme/ThemeContext';
import { Colors } from '../src/theme/colors';
import { DarkColors } from '../src/theme/darkMode';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BP_KEY = 'egchat_business_profile';
const CAT_KEY = 'egchat_catalog';

export interface BusinessProfile {
  name: string;
  category: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  avatar?: string;
  verified: boolean;
}

export interface CatalogItem {
  id: string;
  name: string;
  price: string;
  currency: string;
  description: string;
  image?: string;
  available: boolean;
}

const CATEGORIES = [
  'Restaurante', 'Tienda', 'Servicios', 'Salud', 'Educación',
  'Tecnología', 'Moda', 'Belleza', 'Inmobiliaria', 'Otro',
];

async function loadProfile(): Promise<BusinessProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(BP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function saveProfile(p: BusinessProfile): Promise<void> {
  await AsyncStorage.setItem(BP_KEY, JSON.stringify(p));
}

async function loadCatalog(): Promise<CatalogItem[]> {
  try {
    const raw = await AsyncStorage.getItem(CAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveCatalog(items: CatalogItem[]): Promise<void> {
  await AsyncStorage.setItem(CAT_KEY, JSON.stringify(items));
}

export default function BusinessProfileScreen() {
  const [profile, setProfile] = useState<BusinessProfile>({
    name: '', category: 'Tienda', description: '', phone: '',
    email: '', website: '', address: '', verified: false,
  });
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [tab, setTab] = useState<'profile' | 'catalog'>('profile');
  const [saving, setSaving] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editItem, setEditItem] = useState<CatalogItem | null>(null);
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  useEffect(() => {
    loadProfile().then(p => { if (p) setProfile(p); });
    loadCatalog().then(setCatalog);
  }, []);

  const handleSaveProfile = useCallback(async () => {
    if (!profile.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      await saveProfile(profile);
      try {
        const BASE = getApiBase();
        const token = await getToken();
        await fetch(`${BASE}/api/business/profile`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        });
      } catch {}
      toast.success('Perfil empresarial guardado');
    } finally {
      setSaving(false);
    }
  }, [profile]);

  const handlePickAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (!r.canceled && r.assets[0]) {
      setProfile(p => ({ ...p, avatar: r.assets[0].uri }));
    }
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    Alert.alert('Eliminar producto', '¿Confirmar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const next = catalog.filter(i => i.id !== id);
        setCatalog(next);
        await saveCatalog(next);
        toast.info('Producto eliminado');
      }},
    ]);
  }, [catalog]);

  const handleSaveItem = useCallback(async (item: CatalogItem) => {
    const exists = catalog.find(i => i.id === item.id);
    const next = exists ? catalog.map(i => i.id === item.id ? item : i) : [...catalog, item];
    setCatalog(next);
    await saveCatalog(next);
    setShowAddItem(false);
    setEditItem(null);
    toast.success(exists ? 'Producto actualizado' : 'Producto añadido');
  }, [catalog]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <LinearGradient colors={['#07a472', '#00b4e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.btn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
            <Line x1="19" y1="12" x2="5" y2="12"/><Polyline points="12 19 5 12 12 5"/>
          </Svg>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Perfil empresarial</Text>
        {profile.verified && <Text style={s.verifiedBadge}>✓ Verificado</Text>}
      </LinearGradient>

      {/* Tabs */}
      <View style={[s.tabs, { borderBottomColor: C.borderLight }]}>
        <TouchableOpacity style={[s.tab, tab === 'profile' && s.tabActive]} onPress={() => setTab('profile')}>
          <View style={s.tabInner}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={tab === 'profile' ? '#07a472' : C.textTertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Rect x="3" y="3" width="18" height="18" rx="2"/>
              <Line x1="3" y1="9" x2="21" y2="9"/>
              <Line x1="9" y1="21" x2="9" y2="9"/>
            </Svg>
            <Text style={[s.tabText, { color: tab === 'profile' ? '#07a472' : C.textTertiary }]}>Perfil</Text>
          </View>
          {tab === 'profile' && <View style={s.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'catalog' && s.tabActive]} onPress={() => setTab('catalog')}>
          <View style={s.tabInner}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={tab === 'catalog' ? '#07a472' : C.textTertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <Line x1="3" y1="6" x2="21" y2="6"/>
              <Path d="M16 10a4 4 0 01-8 0"/>
            </Svg>
            <Text style={[s.tabText, { color: tab === 'catalog' ? '#07a472' : C.textTertiary }]}>Catálogo ({catalog.length})</Text>
          </View>
          {tab === 'catalog' && <View style={s.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {tab === 'profile' ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          {/* Avatar */}
          <TouchableOpacity style={s.avatarWrap} onPress={handlePickAvatar}>
            <EGAvatar src={profile.avatar} name={profile.name || 'Empresa'} size={80} />
            <View style={s.avatarEdit}>
              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <Circle cx="12" cy="13" r="4"/>
              </Svg>
            </View>
          </TouchableOpacity>

          {/* Campos */}
          {([
            { key: 'name', label: 'Nombre del negocio *', placeholder: 'Mi Empresa' },
            { key: 'description', label: 'Descripción', placeholder: 'Qué ofreces...' },
            { key: 'phone', label: 'Teléfono de contacto', placeholder: '+240 222 XXX XXX' },
            { key: 'email', label: 'Email', placeholder: 'empresa@email.com' },
            { key: 'website', label: 'Sitio web', placeholder: 'https://miempresa.com' },
            { key: 'address', label: 'Dirección', placeholder: 'Malabo, Guinea Ecuatorial' },
          ] as { key: keyof BusinessProfile; label: string; placeholder: string }[]).map(field => (
            <View key={field.key} style={s.fieldGroup}>
              <Text style={[s.fieldLabel, { color: C.textTertiary }]}>{field.label}</Text>
              <TextInput
                style={[s.input, { color: C.textPrimary, backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}
                value={String(profile[field.key] || '')}
                onChangeText={v => setProfile(p => ({ ...p, [field.key]: v }))}
                placeholder={field.placeholder}
                placeholderTextColor={C.textTertiary}
              />
            </View>
          ))}

          {/* Categoría */}
          <Text style={[s.fieldLabel, { color: C.textTertiary, marginBottom: 8 }]}>Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[s.catChip, profile.category === cat && s.catChipActive]}
                onPress={() => setProfile(p => ({ ...p, category: cat }))}
              >
                <Text style={[s.catText, profile.category === cat && s.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={handleSaveProfile} disabled={saving} style={s.saveBtn}>
            <LinearGradient colors={['#07a472', '#00b4e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtnGrad}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Guardar perfil</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* ── Catálogo ── */
        <View style={{ flex: 1 }}>
          <FlatList
            data={catalog}
            keyExtractor={i => i.id}
            contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 80 }}
            numColumns={2}
            columnWrapperStyle={{ gap: 10 }}
            ListEmptyComponent={
              <View style={s.emptycat}>
                <View style={s.emptycatIconWrap}>
                  <Svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#07a472" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                    <Line x1="3" y1="6" x2="21" y2="6"/>
                    <Path d="M16 10a4 4 0 01-8 0"/>
                  </Svg>
                </View>
                <Text style={[s.emptycatText, { color: C.textTertiary }]}>
                  Añade productos o servicios a tu catálogo
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[s.catalogCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                {item.image
                  ? <Image source={{ uri: item.image }} style={s.catalogImg} resizeMode="cover" />
                  : <View style={[s.catalogImgPlaceholder, { backgroundColor: '#07a47215' }]}>
                      <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#07a472" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                        <Polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                        <Line x1="12" y1="22.08" x2="12" y2="12"/>
                      </Svg>
                    </View>
                }
                <View style={s.catalogInfo}>
                  <Text style={[s.catalogName, { color: C.textPrimary }]} numberOfLines={2}>{item.name}</Text>
                  <Text style={s.catalogPrice}>{item.price} {item.currency}</Text>
                  {!item.available && <Text style={s.outOfStock}>Sin stock</Text>}
                </View>
                <View style={s.catalogActions}>
                  <TouchableOpacity onPress={() => { setEditItem(item); setShowAddItem(true); }} style={s.catalogBtn}>
                    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </Svg>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteItem(item.id)} style={s.catalogBtn}>
                    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Polyline points="3 6 5 6 21 6"/>
                      <Path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                      <Path d="M10 11v6M14 11v6"/>
                      <Path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                    </Svg>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
          <TouchableOpacity
            style={[s.addItemFab, { bottom: insets.bottom + 16 }]}
            onPress={() => { setEditItem(null); setShowAddItem(true); }}
          >
            <LinearGradient colors={['#07a472', '#00b4e6']} style={s.fabGrad}>
              <Text style={s.fabText}>+ Añadir producto</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <CatalogItemModal
        visible={showAddItem}
        item={editItem}
        onSave={handleSaveItem}
        onClose={() => { setShowAddItem(false); setEditItem(null); }}
        C={C}
      />
    </SafeAreaView>
  );
}

// ── Modal añadir/editar producto ─────────────────────────────────
function CatalogItemModal({ visible, item, onSave, onClose, C }: {
  visible: boolean; item: CatalogItem | null;
  onSave: (i: CatalogItem) => void; onClose: () => void;
  C: typeof Colors;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('XAF');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [available, setAvailable] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setName(item?.name || '');
      setPrice(item?.price || '');
      setCurrency(item?.currency || 'XAF');
      setDescription(item?.description || '');
      setImage(item?.image || '');
      setAvailable(item?.available ?? true);
    }
  }, [visible, item]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (!r.canceled && r.assets[0]) setImage(r.assets[0].uri);
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error('El nombre es obligatorio'); return; }
    onSave({
      id: item?.id || `cat_${Date.now()}`,
      name: name.trim(), price: price.trim(), currency,
      description: description.trim(), image, available,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.root, { backgroundColor: C.bgPrimary, paddingTop: insets.top }]}>
        <LinearGradient colors={['#07a472', '#00b4e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.btn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
            </Svg>
          </TouchableOpacity>
          <Text style={s.headerTitle}>{item ? 'Editar producto' : 'Nuevo producto'}</Text>
          <TouchableOpacity onPress={handleSave} style={s.btn}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <Path d="M20 6L9 17l-5-5"/>
            </Svg>
          </TouchableOpacity>
        </LinearGradient>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          <TouchableOpacity style={s.imgPicker} onPress={handlePickImage}>
            {image
              ? <Image source={{ uri: image }} style={{ width: '100%', height: 160, borderRadius: 12 }} resizeMode="cover" />
              : <View style={[s.imgPlaceholder, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                  <Text style={{ fontSize: 32 }}>📷</Text>
                  <Text style={{ color: C.textTertiary, marginTop: 6 }}>Añadir foto del producto</Text>
                </View>
            }
          </TouchableOpacity>
          {([
            { val: name, set: setName, label: 'Nombre *', placeholder: 'Nombre del producto' },
            { val: price, set: setPrice, label: 'Precio', placeholder: '0', keyboard: 'numeric' },
            { val: description, set: setDescription, label: 'Descripción', placeholder: 'Describe el producto...' },
          ] as any[]).map(f => (
            <View key={f.label} style={s.fieldGroup}>
              <Text style={[s.fieldLabel, { color: C.textTertiary }]}>{f.label}</Text>
              <TextInput
                style={[s.input, { color: C.textPrimary, backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}
                value={f.val} onChangeText={f.set}
                placeholder={f.placeholder} placeholderTextColor={C.textTertiary}
                keyboardType={f.keyboard || 'default'}
              />
            </View>
          ))}
          <View style={s.fieldGroup}>
            <Text style={[s.fieldLabel, { color: C.textTertiary }]}>Moneda</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['XAF', 'EUR', 'USD'].map(cur => (
                <TouchableOpacity key={cur} style={[s.catChip, currency === cur && s.catChipActive]} onPress={() => setCurrency(cur)}>
                  <Text style={[s.catText, currency === cur && s.catTextActive]}>{cur}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={[s.fieldGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <Text style={[s.fieldLabel, { color: C.textPrimary }]}>Disponible</Text>
            <TouchableOpacity onPress={() => setAvailable(!available)}
              style={[s.catChip, available && s.catChipActive]}>
              <Text style={[s.catText, available && s.catTextActive]}>{available ? '✓ Disponible' : 'Sin stock'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 12, paddingTop: 10, gap: 6 },
  btn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff', marginLeft: 4 },
  verifiedBadge: { fontSize: 12, color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: '600' },
  tabIndicator: { position: 'absolute', bottom: 0, width: 40, height: 2.5, borderRadius: 2, backgroundColor: '#07a472' },
  avatarWrap: { alignSelf: 'center', position: 'relative', marginBottom: 20, marginTop: 4 },
  avatarEdit: { position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: '#07a472', alignItems: 'center', justifyContent: 'center' },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, marginBottom: 6 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.06)', marginRight: 6 },
  catChipActive: { backgroundColor: '#07a472' },
  catText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  catTextActive: { color: '#fff' },
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  saveBtnGrad: { paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptycat: { alignItems: 'center', marginTop: 60, gap: 12, paddingHorizontal: 30 },
  emptycatIcon: { fontSize: 52 },
  emptycatText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  catalogCard: { flex: 1, borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 10 },
  catalogImg: { width: '100%', height: 120 },
  catalogImgPlaceholder: { width: '100%', height: 120, alignItems: 'center', justifyContent: 'center' },
  catalogInfo: { padding: 10 },
  catalogName: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  catalogPrice: { fontSize: 14, fontWeight: '800', color: '#07a472' },
  outOfStock: { fontSize: 11, color: '#ef4444', fontWeight: '600', marginTop: 2 },
  catalogActions: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' },
  catalogBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  catalogBtnText: { fontSize: 16 },
  addItemFab: { position: 'absolute', left: 16, right: 16, borderRadius: 16, overflow: 'hidden' },
  fabGrad: { paddingVertical: 14, alignItems: 'center' },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  imgPicker: { marginBottom: 16 },
  imgPlaceholder: { height: 160, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
