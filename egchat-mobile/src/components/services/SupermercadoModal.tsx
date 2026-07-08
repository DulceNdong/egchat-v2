import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { superAPI } from '../../api';
import {
  DAILY_CITIES, SUPERMARKETS, FEATURED_PRODUCTS, cityName, cityStoreCount,
  Supermarket, Product,
} from '../../data/serviciosDiarios';
import { FinancialModuleShell, FilterChips } from './FinancialModuleUI';
import { SearchField } from './PublicModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';

type Screen = 'home' | 'cities' | 'stores' | 'products' | 'cart' | 'checkout' | 'success';

interface Props { visible: boolean; onClose: () => void; }

export const SupermercadoModal: React.FC<Props> = ({ visible, onClose }) => {
  const [screen, setScreen] = useState<Screen>('home');
  const [cityId, setCityId] = useState<string | null>(null);
  const [store, setStore] = useState<Supermarket | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Array<{ product: Product; qty: number }>>([]);
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    if (!visible) {
      setScreen('home'); setCityId(null); setStore(null); setProducts([]);
      setSearch(''); setCart([]); setAddress(''); setName(''); setPhone(''); setOrderId('');
    }
  }, [visible]);

  const cartTotal = cart.reduce((s, i) => s + i.product.precio * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === p.id);
      return ex ? prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { product: p, qty: 1 }];
    });
  };

  const openStore = async (sm: Supermarket) => {
    setStore(sm);
    setLoading(true);
    try {
      const apiProducts = await superAPI.getProducts(sm.id);
      if (apiProducts?.length) {
        setProducts(apiProducts.map((p: any) => ({
          id: p.id, sm_ids: [sm.id], nombre: p.name, marca: p.brand || '', precio: Number(p.price) || 0, img: p.icon || '🛒', destacado: false,
        })));
      } else {
        setProducts(FEATURED_PRODUCTS.filter(p => p.sm_ids.includes(sm.id)));
      }
    } catch {
      setProducts(FEATURED_PRODUCTS.filter(p => p.sm_ids.includes(sm.id)));
    } finally {
      setLoading(false);
      setScreen('products');
    }
  };

  const placeOrder = async () => {
    if (!store || !cart.length || !address.trim() || !phone.trim() || !name.trim()) return;
    setLoading(true);
    try {
      const res = await superAPI.createOrder({
        supermarketId: store.id,
        address: address.trim(),
        items: cart.map(i => ({ productId: i.product.id, qty: i.qty, price: i.product.precio })),
      });
      setOrderId(res?.orderId || `SM-${Date.now()}`);
    } catch {
      setOrderId(`SM-${Date.now().toString().slice(-6)}`);
    } finally {
      setLoading(false);
      setScreen('success');
      setCart([]);
    }
  };

  const refresh = () => {
    setScreen('home'); setCityId(null); setStore(null); setSearch(''); setCart([]);
  };

  const goBack = () => {
    if (screen === 'checkout') setScreen('cart');
    else if (screen === 'cart') setScreen('products');
    else if (screen === 'products') setScreen(cityId ? 'stores' : 'home');
    else if (screen === 'stores') setScreen('cities');
    else if (screen === 'cities') setScreen('home');
    else onClose();
  };

  const title = screen === 'cities' ? 'Ciudades' : screen === 'stores' ? 'Supermercados' : 'Supermercados';
  const subtitle = screen === 'home'
    ? `${SUPERMARKETS.length} tiendas · ${DAILY_CITIES.length} ciudades · GQ`
    : screen === 'cities' ? 'Selecciona tu ciudad'
    : store ? store.nombre : undefined;

  const filteredProducts = products.filter(p =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.marca.toLowerCase().includes(search.toLowerCase())
  );

  const fixedTop = screen === 'home' ? (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      <SearchField placeholder="Buscar producto en todos los supermercados..." value={search} onChangeText={setSearch} />
    </View>
  ) : screen === 'products' ? (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      <SearchField placeholder="Buscar producto..." value={search} onChangeText={setSearch} />
    </View>
  ) : null;

  return (
    <FinancialModuleShell
      visible={visible}
      title={title}
      subtitle={subtitle}
      onBack={goBack}
      onClose={onClose}
      centerTitle
      hideBack={screen === 'home' || screen === 'success'}
      fixedTop={fixedTop}
      onRefresh={refresh}
      headerGradient={screen === 'home' ? ['#065F46', '#00c8a0'] : undefined}
    >
      {loading && <ActivityIndicator color="#00c8a0" style={{ marginVertical: 12 }} />}

      {screen === 'home' && (
        <View>
          <LinearGradient colors={['#065F46', '#00c8a0']} style={st.banner}>
            <Text style={{ fontSize: 28 }}>🛒</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.bannerTitle}>Compra Online</Text>
              <Text style={st.bannerSub}>Supermercados nacionales · Entrega a domicilio</Text>
            </View>
          </LinearGradient>

          <View style={st.grid}>
            {([
              { icon: '🏙️', label: 'Ver Ciudades', sub: `${DAILY_CITIES.length} ciudades`, action: () => setScreen('cities') },
              { icon: '🛒', label: 'Supermercados', sub: `${SUPERMARKETS.length} tiendas`, action: () => { setCityId(null); setScreen('stores'); } },
              { icon: '🛍️', label: 'Mi Carrito', sub: cartCount ? `${cartCount} productos` : 'Vacío', action: () => cartCount ? setScreen('cart') : Alert.alert('Carrito vacío') },
              { icon: '📦', label: 'Mis Pedidos', sub: '0 pedidos', action: () => Alert.alert('Pedidos', 'No tienes pedidos recientes') },
              { icon: '📋', label: 'Historial', sub: 'Compras anteriores', action: () => Alert.alert('Historial', 'Próximamente') },
              { icon: '🎧', label: 'Soporte', sub: 'Ayuda y reportes', action: () => Alert.alert('Soporte', '+240 222 20 00 00') },
            ]).map(item => (
              <TouchableOpacity key={item.label} style={st.gridCard} onPress={item.action} activeOpacity={0.8}>
                <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                <Text style={st.gridLabel}>{item.label}</Text>
                <Text style={st.gridSub}>{item.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={st.sectionTitle}>⭐ Productos destacados</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {FEATURED_PRODUCTS.map(p => (
              <View key={p.id} style={st.prodCard}>
                <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: 6 }}>{p.img}</Text>
                <Text style={st.prodName} numberOfLines={2}>{p.nombre}</Text>
                <Text style={st.prodBrand}>{p.marca}</Text>
                <Text style={st.prodPrice}>{p.precio.toLocaleString()} XAF</Text>
                <TouchableOpacity style={st.addBtn} onPress={() => addToCart(p)}>
                  <Text style={st.addBtnText}>+ Añadir</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {screen === 'cities' && (
        <View style={st.cityGrid}>
          {DAILY_CITIES.map(c => (
            <TouchableOpacity key={c.id} style={st.cityCard} onPress={() => { setCityId(c.id); setScreen('stores'); }} activeOpacity={0.85}>
              <Text style={{ fontSize: 20 }}>🏙️</Text>
              <Text style={st.cityName}>{c.name}</Text>
              <Text style={st.cityProv}>{c.provincia}</Text>
              <Text style={st.cityCount}>{cityStoreCount(c.id)} tienda{cityStoreCount(c.id) !== 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {screen === 'stores' && (
        <View>
          {SUPERMARKETS.filter(s => !cityId || s.ciudad_id === cityId).map(sm => (
            <TouchableOpacity key={sm.id} style={st.storeRow} onPress={() => openStore(sm)} activeOpacity={0.85}>
              <View style={[st.storeLogo, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }]}>
                <Text style={[st.storeLogoText, { color: sm.color }]}>{sm.logo}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.storeName}>{sm.nombre}</Text>
                <Text style={st.storeMeta}>{cityName(sm.ciudad_id)} · {sm.horario}</Text>
                {sm.delivery && <Text style={st.deliveryTag}>🚚 Delivery</Text>}
              </View>
              <Text style={st.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {screen === 'products' && store && (
        <View>
          <LinearGradient colors={[store.color, store.color2]} style={st.storeBanner}>
            <Text style={st.storeBannerTitle}>{store.nombre}</Text>
            <Text style={st.storeBannerSub}>{store.direccion}</Text>
          </LinearGradient>
          {filteredProducts.map(p => (
            <View key={p.id} style={st.prodRow}>
              <Text style={{ fontSize: 24 }}>{p.img}</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.prodName}>{p.nombre}</Text>
                <Text style={st.prodBrand}>{p.marca}</Text>
                <Text style={st.prodPrice}>{p.precio.toLocaleString()} XAF</Text>
              </View>
              <TouchableOpacity style={st.addBtn} onPress={() => addToCart(p)}>
                <Text style={st.addBtnText}>+ Añadir</Text>
              </TouchableOpacity>
            </View>
          ))}
          {cartCount > 0 && (
            <TouchableOpacity style={st.cartFab} onPress={() => setScreen('cart')}>
              <Text style={st.cartFabText}>🛒 Ver carrito ({cartCount}) — {cartTotal.toLocaleString()} XAF</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {screen === 'cart' && (
        <View>
          {cart.map(item => (
            <View key={item.product.id} style={st.cartRow}>
              <Text style={{ fontSize: 20 }}>{item.product.img}</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.prodName}>{item.product.nombre}</Text>
                <Text style={st.prodPrice}>{item.product.precio.toLocaleString()} XAF</Text>
              </View>
              <View style={st.qtyRow}>
                <TouchableOpacity onPress={() => setCart(p => p.map(i => i.product.id === item.product.id ? { ...i, qty: Math.max(0, i.qty - 1) } : i).filter(i => i.qty > 0))}>
                  <Text style={st.qtyBtn}>−</Text>
                </TouchableOpacity>
                <Text style={st.qtyVal}>{item.qty}</Text>
                <TouchableOpacity onPress={() => addToCart(item.product)}>
                  <Text style={st.qtyBtn}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <Text style={st.cartTotal}>Total: {cartTotal.toLocaleString()} XAF</Text>
          <PrimaryButton label="Continuar al pago" onPress={() => setScreen('checkout')} color="#00c8a0" disabled={!cart.length} />
        </View>
      )}

      {screen === 'checkout' && (
        <View>
          <FormField placeholder="Nombre completo" value={name} onChangeText={setName} />
          <FormField placeholder="Teléfono de contacto" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <FormField placeholder="Dirección de entrega" value={address} onChangeText={setAddress} />
          <View style={st.summaryBox}>
            <Text style={st.summaryTitle}>Resumen del pedido</Text>
            <Text style={st.summaryTotal}>{cartTotal.toLocaleString()} XAF</Text>
            {store && <Text style={st.storeMeta}>{store.nombre}</Text>}
          </View>
          <PrimaryButton label={loading ? 'Procesando...' : 'Confirmar pedido'} onPress={placeOrder} color="#00c8a0" disabled={loading || !address.trim() || !phone.trim() || !name.trim()} />
        </View>
      )}

      {screen === 'success' && (
        <View style={st.success}>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={st.successTitle}>¡Pedido confirmado!</Text>
          <Text style={st.successSub}>Orden {orderId}</Text>
          <Text style={st.successSub}>Entrega estimada: 30-45 min</Text>
          <PrimaryButton label="Volver al inicio" onPress={refresh} color="#00c8a0" />
        </View>
      )}
    </FinancialModuleShell>
  );
};

const st = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 16, marginBottom: 14 },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  gridCard: { width: '48%', backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F0F2F5' },
  gridLabel: { fontSize: 13, fontWeight: '700', color: '#111827', marginTop: 6 },
  gridSub: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 10 },
  prodCard: { width: 140, backgroundColor: '#fff', borderRadius: 14, padding: 12, marginRight: 10, borderWidth: 1, borderColor: '#F0F2F5' },
  prodName: { fontSize: 12, fontWeight: '700', color: '#111827' },
  prodBrand: { fontSize: 10, color: '#9CA3AF', marginBottom: 4 },
  prodPrice: { fontSize: 13, fontWeight: '800', color: '#00c8a0', marginBottom: 8 },
  addBtn: { backgroundColor: '#00c8a0', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityCard: { width: '48%', backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F0F2F5' },
  cityName: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 6 },
  cityProv: { fontSize: 11, color: '#9CA3AF' },
  cityCount: { fontSize: 11, fontWeight: '700', color: '#00c8a0', marginTop: 6 },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  storeLogo: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  storeLogoText: { fontSize: 14, fontWeight: '800' },
  storeName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  storeMeta: { fontSize: 11, color: '#9CA3AF' },
  deliveryTag: { fontSize: 10, color: '#00c8a0', fontWeight: '700', marginTop: 2 },
  chevron: { fontSize: 18, color: '#9CA3AF' },
  storeBanner: { borderRadius: 12, padding: 14, marginBottom: 12 },
  storeBannerTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  storeBannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  prodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  cartFab: { backgroundColor: '#00c8a0', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  cartFabText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  cartRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { fontSize: 18, fontWeight: '700', color: '#00c8a0', paddingHorizontal: 8 },
  qtyVal: { fontSize: 14, fontWeight: '700' },
  cartTotal: { fontSize: 18, fontWeight: '900', color: '#00c8a0', textAlign: 'right', marginVertical: 12 },
  summaryBox: { backgroundColor: '#F0FAF5', borderRadius: 12, padding: 14, marginBottom: 14 },
  summaryTitle: { fontSize: 12, color: '#6B7280' },
  summaryTotal: { fontSize: 22, fontWeight: '900', color: '#065F46' },
  success: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  successSub: { fontSize: 13, color: '#9CA3AF' },
});
