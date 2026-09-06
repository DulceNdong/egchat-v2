import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  ActivityIndicator, TextInput, Modal, Pressable, FlatList
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MIcon } from '../src/components/ui/MIcon';
import { getToken, getApiBase, walletAPI } from '../src/api';
import { toast } from '../src/components/Toast';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';

interface Supermarket {
  id: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  open?: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
}

interface CartItem extends Product {
  qty: number;
}

const CATEGORIES = [
  { id: 'Alimentación', name: '🥩 Carnicería', emoji: '🥩' },
  { id: 'Bebidas', name: '🥤 Bebidas', emoji: '🥤' },
  { id: 'Lácteos', name: '🥛 Lácteos', emoji: '🥛' },
  { id: 'Panadería', name: '🍞 Panadería', emoji: '🍞' },
  { id: 'Higiene', name: '🧴 Higiene', emoji: '🧴' },
  { id: 'Limpieza', name: '🧹 Limpieza', emoji: '🧹' }
];

async function fetchSupermarkets(): Promise<Supermarket[]> {
  try {
    const BASE = getApiBase();
    const token = await getToken();
    const res = await fetch(`${BASE}/api/supermarkets`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) return res.json();
  } catch {}
  return [];
}

async function fetchProducts(supermarketId: string, category?: string): Promise<Product[]> {
  try {
    const BASE = getApiBase();
    const token = await getToken();
    const url = `${BASE}/api/supermarkets/${supermarketId}/products${category ? `?cat=${encodeURIComponent(category)}` : ''}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) return res.json();
  } catch {}
  return [];
}

async function createOrder(supermarketId: string, items: CartItem[], address: string): Promise<any> {
  const BASE = getApiBase();
  const token = await getToken();
  const res = await fetch(`${BASE}/api/supermarkets/orders`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: items.map(item => ({ id: item.id, name: item.name, price: item.price, qty: item.qty })),
      supermarketId,
      address
    })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al procesar el pedido');
  }
  return res.json();
}

export default function SupermercadosScreen() {
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [selectedSupermarket, setSelectedSupermarket] = useState<Supermarket | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [address, setAddress] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [balance, setBalance] = useState(0);
  const [search, setSearch] = useState('');

  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const insets = useSafeAreaInsets();

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const loadSupermarkets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSupermarkets();
      setSupermarkets(data);
      if (data.length > 0) {
        setSelectedSupermarket(data[0]);
        await loadProducts(data[0].id);
      }
    } catch (error) {
      toast.error('Error cargando supermercados');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async (supermarketId: string, category?: string) => {
    setLoadingProducts(true);
    try {
      const data = await fetchProducts(supermarketId, category);
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      toast.error('Error cargando productos');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const loadBalance = useCallback(async () => {
    try {
      const result = await walletAPI.getBalance();
      setBalance(result.balance || 0);
    } catch {}
  }, []);

  useEffect(() => {
    loadSupermarkets();
    loadBalance();
  }, [loadSupermarkets, loadBalance]);

  useEffect(() => {
    let filtered = products;
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (search.trim()) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  }, [products, selectedCategory, search]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, qty: Math.min(item.qty + 1, product.stock) }
            : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} añadido al carrito`);
  };

  const updateCartItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(item => item.id !== productId));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.id === productId ? { ...item, qty } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCheckout = async () => {
    if (!selectedSupermarket || cart.length === 0) return;
    if (!address.trim()) {
      toast.error('Ingresa tu dirección de entrega');
      return;
    }
    if (balance < cartTotal) {
      Alert.alert(
        'Saldo insuficiente',
        `Necesitas ${cartTotal.toLocaleString()} XAF. Tu saldo actual es ${balance.toLocaleString()} XAF.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Recargar', onPress: () => router.push('/(tabs)/monedero' as any) }
        ]
      );
      return;
    }

    setOrdering(true);
    try {
      const result = await createOrder(selectedSupermarket.id, cart, address.trim());
      toast.success('¡Pedido confirmado! Llegará en 30-45 min');
      setCart([]);
      setShowCheckout(false);
      setShowCart(false);
      setAddress('');
      loadBalance();
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el pedido');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={[styles.loadingText, { color: C.textSecondary }]}>Cargando supermercados...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight, paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: C.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.textPrimary }]}>Supermercados</Text>
        <TouchableOpacity 
          style={styles.cartBtn} 
          onPress={() => setShowCart(true)}
          disabled={cart.length === 0}
        >
          <MIcon name="shopping-bag" size={24} color={cart.length > 0 ? Colors.accent : C.textTertiary} />
          {cartItemsCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Supermarket selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.supermarketScroll}>
        {supermarkets.map(sm => (
          <TouchableOpacity
            key={sm.id}
            style={[
              styles.supermarketChip,
              { 
                backgroundColor: selectedSupermarket?.id === sm.id ? Colors.accent : C.bgSecondary,
                borderColor: selectedSupermarket?.id === sm.id ? Colors.accent : C.borderLight
              }
            ]}
            onPress={() => {
              setSelectedSupermarket(sm);
              setSelectedCategory(null);
              loadProducts(sm.id);
            }}
          >
            <Text style={[
              styles.supermarketChipText,
              { color: selectedSupermarket?.id === sm.id ? '#fff' : C.textPrimary }
            ]}>
              🛒 {sm.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: C.bgSecondary }]}>
        <MIcon name="search" size={20} color={C.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: C.textPrimary }]}
          placeholder="Buscar productos..."
          placeholderTextColor={C.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        <TouchableOpacity
          style={[
            styles.categoryChip,
            { 
              backgroundColor: !selectedCategory ? Colors.accent : C.bgSecondary,
              borderColor: !selectedCategory ? Colors.accent : C.borderLight
            }
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[
            styles.categoryChipText,
            { color: !selectedCategory ? '#fff' : C.textPrimary }
          ]}>
            Todos
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              { 
                backgroundColor: selectedCategory === cat.id ? Colors.accent : C.bgSecondary,
                borderColor: selectedCategory === cat.id ? Colors.accent : C.borderLight
              }
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={[
              styles.categoryChipText,
              { color: selectedCategory === cat.id ? '#fff' : C.textPrimary }
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products */}
      {loadingProducts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={[styles.loadingText, { color: C.textSecondary }]}>Cargando productos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsContainer}
          renderItem={({ item }) => (
            <View style={[styles.productCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
              <Text style={styles.productEmoji}>📦</Text>
              <Text style={[styles.productName, { color: C.textPrimary }]} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={[styles.productCategory, { color: C.textSecondary }]}>
                {item.category}
              </Text>
              <Text style={[styles.productPrice, { color: Colors.accent }]}>
                {item.price.toLocaleString()} XAF
              </Text>
              <Text style={[styles.productStock, { color: C.textTertiary }]}>
                Stock: {item.stock}
              </Text>
              <TouchableOpacity
                style={[styles.addToCartBtn, { backgroundColor: Colors.accent }]}
                onPress={() => addToCart(item)}
                disabled={item.stock === 0}
              >
                <Text style={styles.addToCartText}>
                  {item.stock === 0 ? 'Agotado' : 'Añadir'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: C.textTertiary }]}>
                {search.trim() ? 'No se encontraron productos' : 'No hay productos disponibles'}
              </Text>
            </View>
          }
        />
      )}

      {/* Cart Modal */}
      <Modal visible={showCart} animationType="slide" onRequestClose={() => setShowCart(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: C.bgPrimary }]} edges={['top']}>
          <View style={[styles.modalHeader, { borderBottomColor: C.borderLight }]}>
            <TouchableOpacity onPress={() => setShowCart(false)}>
              <MIcon name="close" size={24} color={C.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Mi Carrito</Text>
            <TouchableOpacity onPress={clearCart} disabled={cart.length === 0}>
              <Text style={[styles.clearCartText, { color: cart.length > 0 ? Colors.accent : C.textTertiary }]}>
                Limpiar
              </Text>
            </TouchableOpacity>
          </View>
          
          {cart.length === 0 ? (
            <View style={styles.emptyCartContainer}>
              <Text style={styles.emptyCartEmoji}>🛒</Text>
              <Text style={[styles.emptyCartText, { color: C.textTertiary }]}>Tu carrito está vacío</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={cart}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.cartItemsContainer}
                renderItem={({ item }) => (
                  <View style={[styles.cartItem, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
                    <View style={styles.cartItemInfo}>
                      <Text style={[styles.cartItemName, { color: C.textPrimary }]}>{item.name}</Text>
                      <Text style={[styles.cartItemPrice, { color: Colors.accent }]}>
                        {item.price.toLocaleString()} XAF
                      </Text>
                    </View>
                    <View style={styles.cartItemControls}>
                      <TouchableOpacity
                        style={[styles.qtyBtn, { backgroundColor: C.bgTertiary }]}
                        onPress={() => updateCartItemQty(item.id, item.qty - 1)}
                      >
                        <Text style={[styles.qtyBtnText, { color: C.textPrimary }]}>−</Text>
                      </TouchableOpacity>
                      <Text style={[styles.qtyText, { color: C.textPrimary }]}>{item.qty}</Text>
                      <TouchableOpacity
                        style={[styles.qtyBtn, { backgroundColor: C.bgTertiary }]}
                        onPress={() => updateCartItemQty(item.id, item.qty + 1)}
                        disabled={item.qty >= item.stock}
                      >
                        <Text style={[styles.qtyBtnText, { color: C.textPrimary }]}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
              <View style={[styles.cartTotal, { backgroundColor: C.bgSecondary, borderTopColor: C.borderLight }]}>
                <Text style={[styles.totalLabel, { color: C.textSecondary }]}>Total:</Text>
                <Text style={[styles.totalAmount, { color: Colors.accent }]}>
                  {cartTotal.toLocaleString()} XAF
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.checkoutBtn, { backgroundColor: Colors.accent }]}
                onPress={() => {
                  setShowCart(false);
                  setShowCheckout(true);
                }}
              >
                <Text style={styles.checkoutBtnText}>Proceder al checkout</Text>
              </TouchableOpacity>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* Checkout Modal */}
      <Modal visible={showCheckout} animationType="slide" onRequestClose={() => setShowCheckout(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: C.bgPrimary }]} edges={['top']}>
          <View style={[styles.modalHeader, { borderBottomColor: C.borderLight }]}>
            <TouchableOpacity onPress={() => setShowCheckout(false)}>
              <MIcon name="arrow-back" size={24} color={C.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Finalizar Pedido</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.checkoutContent}>
            <View style={[styles.checkoutSection, { backgroundColor: C.bgSecondary }]}>
              <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Dirección de entrega</Text>
              <TextInput
                style={[styles.addressInput, { backgroundColor: C.bgTertiary, color: C.textPrimary, borderColor: C.borderLight }]}
                placeholder="Ingresa tu dirección completa..."
                placeholderTextColor={C.textTertiary}
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>

            <View style={[styles.checkoutSection, { backgroundColor: C.bgSecondary }]}>
              <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Resumen del pedido</Text>
              {cart.map(item => (
                <View key={item.id} style={styles.orderSummaryItem}>
                  <Text style={[styles.orderItemName, { color: C.textSecondary }]}>
                    {item.qty}x {item.name}
                  </Text>
                  <Text style={[styles.orderItemPrice, { color: C.textPrimary }]}>
                    {(item.price * item.qty).toLocaleString()} XAF
                  </Text>
                </View>
              ))}
              <View style={[styles.orderTotal, { borderTopColor: C.borderLight }]}>
                <Text style={[styles.orderTotalLabel, { color: C.textPrimary }]}>Total:</Text>
                <Text style={[styles.orderTotalAmount, { color: Colors.accent }]}>
                  {cartTotal.toLocaleString()} XAF
                </Text>
              </View>
            </View>

            <View style={[styles.checkoutSection, { backgroundColor: C.bgSecondary }]}>
              <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Método de pago</Text>
              <View style={styles.paymentMethod}>
                <Text style={styles.paymentIcon}>💳</Text>
                <Text style={[styles.paymentText, { color: C.textSecondary }]}>Monedero EGChat</Text>
              </View>
              <Text style={[styles.balanceText, { color: balance >= cartTotal ? '#10b981' : '#ef4444' }]}>
                Saldo disponible: {balance.toLocaleString()} XAF
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.placeOrderBtn,
              { 
                backgroundColor: ordering || !address.trim() || balance < cartTotal ? '#94a3b8' : Colors.accent 
              }
            ]}
            onPress={handleCheckout}
            disabled={ordering || !address.trim() || balance < cartTotal}
          >
            {ordering ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.placeOrderText}>
                {balance < cartTotal ? 'Saldo insuficiente' : 'Confirmar pedido'}
              </Text>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 16 },
  
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1
  },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 28, lineHeight: 32 },
  title: { fontSize: 20, fontWeight: '700' },
  cartBtn: { padding: 8, position: 'relative' },
  cartBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: '#ef4444', borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center'
  },
  cartBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Supermarket selector
  supermarketScroll: { paddingHorizontal: 16, paddingVertical: 8 },
  supermarketChip: {
    marginRight: 8, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1
  },
  supermarketChipText: { fontSize: 14, fontWeight: '600' },

  // Search
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginVertical: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12
  },
  searchInput: { flex: 1, fontSize: 16 },

  // Categories
  categoriesScroll: { paddingHorizontal: 16, paddingVertical: 8 },
  categoryChip: {
    marginRight: 8, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1
  },
  categoryChipText: { fontSize: 13, fontWeight: '600' },

  // Products
  productsContainer: { padding: 16 },
  productCard: {
    flex: 1, margin: 4, padding: 12,
    borderRadius: 12, borderWidth: 1,
    alignItems: 'center', gap: 4
  },
  productEmoji: { fontSize: 32, marginBottom: 4 },
  productName: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  productCategory: { fontSize: 12 },
  productPrice: { fontSize: 16, fontWeight: '700' },
  productStock: { fontSize: 11 },
  addToCartBtn: {
    marginTop: 8, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 16, minWidth: 80, alignItems: 'center'
  },
  addToCartText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Empty states
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 16, textAlign: 'center' },

  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  clearCartText: { fontSize: 14, fontWeight: '600' },

  // Cart
  emptyCartContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyCartEmoji: { fontSize: 64 },
  emptyCartText: { fontSize: 18 },
  cartItemsContainer: { padding: 16 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, marginBottom: 8,
    borderRadius: 12, borderWidth: 1
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 16, fontWeight: '600' },
  cartItemPrice: { fontSize: 14, marginTop: 2 },
  cartItemControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center'
  },
  qtyBtnText: { fontSize: 18, fontWeight: '700' },
  qtyText: { fontSize: 16, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  cartTotal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderTopWidth: 1
  },
  totalLabel: { fontSize: 16 },
  totalAmount: { fontSize: 20, fontWeight: '700' },
  checkoutBtn: {
    margin: 16, padding: 16,
    borderRadius: 12, alignItems: 'center'
  },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Checkout
  checkoutContent: { flex: 1 },
  checkoutSection: { margin: 16, padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  addressInput: {
    borderWidth: 1, borderRadius: 8,
    padding: 12, fontSize: 16,
    minHeight: 80, textAlignVertical: 'top'
  },
  orderSummaryItem: { 
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 4
  },
  orderItemName: { fontSize: 14 },
  orderItemPrice: { fontSize: 14, fontWeight: '600' },
  orderTotal: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 8, marginTop: 8, borderTopWidth: 1
  },
  orderTotalLabel: { fontSize: 16, fontWeight: '600' },
  orderTotalAmount: { fontSize: 18, fontWeight: '700' },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentIcon: { fontSize: 24 },
  paymentText: { fontSize: 16 },
  balanceText: { fontSize: 14, marginTop: 8, fontWeight: '600' },
  placeOrderBtn: {
    margin: 16, padding: 16,
    borderRadius: 12, alignItems: 'center'
  },
  placeOrderText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
